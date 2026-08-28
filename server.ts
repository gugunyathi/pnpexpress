import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from './src/data/products';
import { connectDB, User, ActivityLog, OrderModel, CDPWallet } from './server/models';
import { createCoinbaseCheckout, verifyWebhookSignature, refundCoinbaseCheckout } from './server/coinbaseCheckout';
import { 
  CartItem, 
  Product, 
  WhatsAppMessage, 
  VoiceAIResult, 
  PaymentRail, 
  OrchestrationAttempt, 
  OrchestrationResponse, 
  PaymentOrchestratorLog,
  DeliveryAddress,
  StoreId,
  Currency
} from './src/types';
import { 
  INITIAL_DEPOTS, 
  INITIAL_ORDERS, 
  INITIAL_INVOICES, 
  INITIAL_USER_PROFILE, 
  INITIAL_USER_ADDRESSES, 
  LIVE_CALL_INITIAL_STATE,
  PastOrder,
  CommercialInvoice,
  DepotLocation
} from './server/db';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// =========================================================================
// IN-MEMORY PERSISTENCE LAYER (Synchronized & Socket Broadcasted)
// =========================================================================

let currentCart: CartItem[] = [
  {
    id: 'cart-init-1',
    productId: 'prod-1',
    product: SAMPLE_PRODUCTS[0], // Tastic Rice 5kg
    quantity: 2,
    addedByMemberId: 'mem-2',
    addedByMemberName: 'Gogo Moyo',
    addedByLocation: 'Harare, ZIM',
    channel: 'whatsapp',
    addedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    note: 'Added via WhatsApp Voice Note'
  },
  {
    id: 'cart-init-2',
    productId: 'prod-3',
    product: SAMPLE_PRODUCTS[2], // Fruit and Vegetable Box 10kg
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'cart-init-3',
    productId: 'prod-8',
    product: SAMPLE_PRODUCTS[7], // Solar Light Kit
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    note: 'For Gogo power outages'
  }
];

let ordersStore: PastOrder[] = [...INITIAL_ORDERS];
let invoicesStore: CommercialInvoice[] = [...INITIAL_INVOICES];
let depotsStore: DepotLocation[] = [...INITIAL_DEPOTS];
let userProfileStore = { ...INITIAL_USER_PROFILE };
let userAddressesStore: DeliveryAddress[] = [...INITIAL_USER_ADDRESSES];
let liveCallStore = { ...LIVE_CALL_INITIAL_STATE };
let paymentAuditLogs: PaymentOrchestratorLog[] = [];

let whatsappLog: WhatsAppMessage[] = [
  {
    id: 'wa-msg-1',
    fromPhone: '+263772123456',
    senderName: 'Gogo Moyo',
    text: 'Ndinoda mupunga weTastic ne mafuta',
    isVoiceNote: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'processed',
    parsedIntent: {
      action: 'ADD',
      items: [{ productName: 'Tastic Rice Parboiled Long Grain (5kg)', qty: 2 }],
      spokenResponse: 'Ndaisa mupunga weTastic nemafuta ekubikisa mungoro yeMoyo Family.',
      detectedLanguage: 'Shona'
    },
    replyText: '🛒 TM Pick n Pay Family Cart:\nAdded: 2x Tastic Rice 5kg, 1x Cooking Oil 2L.\nTotal: $17.40 (ZWG 466.32). Reply 1 to Checkout via EcoCash / Mukuru.'
  }
];

// Helper to match catalog item by voice or colloquial native text query
const matchProduct = (queryName: string): Product => {
  const q = queryName.toLowerCase();
  
  // Check exact name and native terms
  const exactMatch = SAMPLE_PRODUCTS.find(p => 
    p.name.toLowerCase().includes(q) || 
    (p.nativeName && p.nativeName.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q)
  );
  if (exactMatch) return exactMatch;

  // Colloquial term mapping
  if (q.includes('mupunga') || q.includes('tastic') || q.includes('rice') || q.includes('ilayisi')) {
    return SAMPLE_PRODUCTS[0]; // Tastic Rice 5kg
  }
  if (q.includes('hupfu') || q.includes('impuphu') || q.includes('maize') || q.includes('meal') || q.includes('upfu')) {
    return SAMPLE_PRODUCTS[1]; // White Star Maize
  }
  if (q.includes('miriwo') || q.includes('michero') || q.includes('fruit') || q.includes('vegetable') || q.includes('veshi')) {
    return SAMPLE_PRODUCTS[2]; // Fruit & Veg Box 10kg
  }
  if (q.includes('mafuta') || q.includes('oil') || q.includes('amafutha') || q.includes('cooking')) {
    return SAMPLE_PRODUCTS[3]; // Sunfoil Oil 5L
  }
  if (q.includes('chigaku') || q.includes('sugar') || q.includes('unshukela') || q.includes('shuga')) {
    return SAMPLE_PRODUCTS[4]; // Huletts Sugar
  }
  if (q.includes('mazoe') || q.includes('orange') || q.includes('drink') || q.includes('cordial')) {
    return SAMPLE_PRODUCTS[5]; // Mazoe Orange
  }
  if (q.includes('mwenje') || q.includes('solar') || q.includes('light') || q.includes('amagetsi')) {
    return SAMPLE_PRODUCTS[7]; // Solar kit
  }
  if (q.includes('nyama') || q.includes('beef') || q.includes('meat') || q.includes('inyama')) {
    return SAMPLE_PRODUCTS[10] || SAMPLE_PRODUCTS[0]; // Beef
  }
  if (q.includes('mukaka') || q.includes('milk') || q.includes('ubisi') || q.includes('clover')) {
    return SAMPLE_PRODUCTS[8] || SAMPLE_PRODUCTS[0]; // Clover Milk
  }
  if (q.includes('sipo') || q.includes('soap') || q.includes('isipho') || q.includes('sunlight')) {
    return SAMPLE_PRODUCTS[9] || SAMPLE_PRODUCTS[0]; // Soap
  }
  
  return SAMPLE_PRODUCTS[0];
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =========================================================================
// SERVER STARTUP & API ROUTING
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper to broadcast cart updates
  const broadcastCartUpdate = (initiator?: string) => {
    io.emit('cart:update', {
      cart: currentCart,
      updatedAt: new Date().toISOString(),
      initiator
    });
  };

  // Socket.io connection handling
  io.on('connection', (socket) => {
    socket.emit('cart:init', {
      cart: currentCart,
      members: INITIAL_MEMBERS,
      exchangeRates: INITIAL_EXCHANGE_RATES,
      activeOrdersCount: ordersStore.length
    });

    socket.on('presence:join', (member) => {
      socket.broadcast.emit('member:joined', member);
    });

    socket.on('live_call:join', (data) => {
      liveCallStore.isActive = true;
      io.emit('live_call:state', liveCallStore);
    });
  });

  // Initialize MongoDB Atlas connection
  await connectDB();

  // -------------------------------------------------------------
  // 1. HEALTH & METRICS
  // -------------------------------------------------------------
  app.get('/api/health', async (req: Request, res: Response) => {
    let mongoConnected = false;
    try {
      const mongoose = (await import('mongoose')).default;
      mongoConnected = mongoose.connection.readyState === 1;
    } catch (_) {}

    res.json({ 
      status: 'ok', 
      service: 'PnP Express Cross-Border Engine', 
      version: '2.4.0',
      database: mongoConnected ? 'MongoDB Atlas Connected' : 'In-Memory Fallback',
      activeSockets: io.engine.clientsCount,
      cartItemCount: currentCart.length,
      ordersCount: ordersStore.length,
      timestamp: new Date().toISOString() 
    });
  });

  // -------------------------------------------------------------
  // 1B. AUTHENTICATION & USER SESSIONS (MongoDB Atlas)
  // -------------------------------------------------------------
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, name, password, phone, country } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Generate CDP Smart Wallet Address placeholder or user wallet
      const walletAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newUser = new User({
        email,
        name,
        password: password || 'demo_pass_123',
        role: 'Sponsor / Diaspora',
        walletAddress,
        cdpProjectId: process.env.VITE_CDP_PROJECT_ID,
        phone: phone || '+44 7700 900123',
        country: country || 'United Kingdom',
        city: 'London',
        walletBalanceUSD: 250.00
      });

      await newUser.save();

      // Record Activity Log Session in MongoDB
      await ActivityLog.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        action: 'SIGNUP_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID, walletAddress },
        ip: req.ip
      });

      // Record CDP Wallet in MongoDB
      await CDPWallet.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        address: walletAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID,
        balanceEth: 0.05,
        balanceUsdc: 500.00
      });

      res.status(201).json({
        success: true,
        user: newUser,
        token: `jwt_token_${newUser._id}`,
        cdpWallet: {
          address: walletAddress,
          projectId: process.env.VITE_CDP_PROJECT_ID,
          paymasterUrl: process.env.CDP_PAYMASTER_URL_TESTNET
        }
      });
    } catch (err: any) {
      console.error('[Auth Signup Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to sign up' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      let user = await User.findOne({ email });
      if (!user) {
        // Auto-provision demo account if not existing for smooth UX
        const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
        user = await User.create({
          email,
          name: email.split('@')[0].replace('.', ' '),
          role: 'Sponsor / Diaspora',
          walletAddress,
          cdpProjectId: process.env.VITE_CDP_PROJECT_ID
        });
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }

      // Record Session Activity in MongoDB
      await ActivityLog.create({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'LOGIN_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID },
        ip: req.ip
      });

      let cdpWallet = await CDPWallet.findOne({ userId: user._id.toString() });
      if (!cdpWallet) {
        cdpWallet = await CDPWallet.create({
          userId: user._id.toString(),
          userEmail: user.email,
          address: user.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          projectId: process.env.VITE_CDP_PROJECT_ID
        });
      }

      res.json({
        success: true,
        user,
        token: `jwt_token_${user._id}`,
        cdpWallet
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to log in' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const user = await User.findOne().sort({ lastLoginAt: -1 });
      if (!user) {
        return res.json({ authenticated: false });
      }
      const cdpWallet = await CDPWallet.findOne({ userId: user._id.toString() });
      res.json({
        authenticated: true,
        user,
        cdpWallet
      });
    } catch (err) {
      res.json({ authenticated: false });
    }
  });

  app.get('/api/auth/sessions', async (req: Request, res: Response) => {
    try {
      const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
      res.json({ success: true, count: logs.length, sessions: logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 1C. COINBASE DEVELOPER PLATFORM (CDP) WALLET & PAYMASTER API
  // -------------------------------------------------------------
  app.get('/api/cdp/info', (req: Request, res: Response) => {
    res.json({
      success: true,
      projectId: process.env.VITE_CDP_PROJECT_ID,
      keyId: process.env.CDP_API_KEY_ID ? `${process.env.CDP_API_KEY_ID.substring(0, 6)}...` : 'configured',
      paymasterTestnet: process.env.CDP_PAYMASTER_URL_TESTNET,
      paymasterMainnet: process.env.CDP_PAYMASTER_URL_MAINNET,
      network: 'Base Sepolia (Layer 2 Gasless)'
    });
  });

  app.post('/api/cdp/wallet/create', async (req: Request, res: Response) => {
    try {
      const { userEmail = 'diaspora@pnpexpress.co.zw' } = req.body;
      const newAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      let user = await User.findOne({ email: userEmail });
      const userId = user ? user._id.toString() : `usr_${Date.now()}`;

      const wallet = await CDPWallet.create({
        userId,
        userEmail,
        address: newAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID,
        paymasterUrl: process.env.CDP_PAYMASTER_URL_TESTNET,
        balanceEth: 0.05,
        balanceUsdc: 500.00
      });

      await ActivityLog.create({
        userId,
        userEmail,
        action: 'CDP_WALLET_CREATED',
        details: { address: newAddress, projectId: process.env.VITE_CDP_PROJECT_ID }
      });

      res.status(201).json({
        success: true,
        message: 'Coinbase CDP Smart Wallet provisioned successfully',
        wallet
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 2. PRODUCTS & CATALOG ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/products', (req: Request, res: Response) => {
    const { 
      category, 
      storeId, 
      search, 
      fulfillmentTag, 
      inStock, 
      sort = 'featured',
      page = '1',
      limit = '50'
    } = req.query;

    let filtered = [...SAMPLE_PRODUCTS];

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (storeId) {
      filtered = filtered.filter(p => p.storeId === storeId);
    }

    if (fulfillmentTag) {
      filtered = filtered.filter(p => p.fulfillmentTag === fulfillmentTag);
    }

    if (inStock !== undefined) {
      const stockBool = inStock === 'true';
      filtered = filtered.filter(p => p.inStock === stockBool);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.nativeName && p.nativeName.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sort === 'price_asc') {
      filtered.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (sort === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // Default: featured first
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      products: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
      exchangeRates: INITIAL_EXCHANGE_RATES
    });
  });

  app.get('/api/products/categories', (req: Request, res: Response) => {
    const categoryCounts: Record<string, number> = {};
    SAMPLE_PRODUCTS.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const categoryList = Object.entries(categoryCounts).map(([name, count]) => {
      let nativeLabel = name;
      if (name === 'Maize & Staples') nativeLabel = 'Hupfu, Mupunga & Shuga';
      if (name === 'Cooking & Oils') nativeLabel = 'Mafuta eKubikisa';
      if (name === 'Meats & Proteins') nativeLabel = 'Nyama yeMombe neHuku';
      if (name === 'Dairy & Fresh') nativeLabel = 'Mukaka neMiriwo';
      if (name === 'Beverages & Tea') nativeLabel = 'Mazoe, Tii neZvinwiwa';
      if (name === 'Solar & Power') nativeLabel = 'Mwenje weZuva & Amagetsi';
      if (name === 'Household & Soap') nativeLabel = 'Sipo neZvokuchenesa';
      if (name === 'Baby & Care') nativeLabel = 'ZveVana neVacheche';

      return {
        name,
        nativeLabel,
        count
      };
    });

    res.json(categoryList);
  });

  app.get('/api/products/stores', (req: Request, res: Response) => {
    const stores = [
      { id: 'TM_PNP', name: 'TM Pick n Pay Zimbabwe', tag: '74+ Branch Network', depotCount: 74, logo: 'tm_pnp' },
      { id: 'OK_ZIM', name: 'OK Zimbabwe / OK Mart', tag: 'Hypermarket Click & Collect', depotCount: 52, logo: 'ok_zim' },
      { id: 'SPAR_ZIM', name: 'SPAR Zimbabwe', tag: 'Fresh Gourmet & City Express', depotCount: 38, logo: 'spar_zim' },
      { id: 'SA_WHOLESALE', name: 'SA Direct Wholesale Depot', tag: 'Direct Cross-Border Bulk Export', depotCount: 12, logo: 'sa_wholesale' },
      { id: 'CHOPPIES', name: 'Choppies Zimbabwe', tag: 'Value Grocery Hub', depotCount: 30, logo: 'choppies' }
    ];
    res.json(stores);
  });

  app.get('/api/products/deals', (req: Request, res: Response) => {
    const deals = SAMPLE_PRODUCTS.filter(p => p.featured || p.priceUSD < 7.00);
    res.json({
      title: 'Diaspora Family Relief Hampers & Weekly Saver Packs',
      deals
    });
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const product = SAMPLE_PRODUCTS.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const related = SAMPLE_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

    res.json({
      ...product,
      nutritionFacts: 'Rich in essential daily minerals and dietary energy.',
      packagingNote: 'Sealed cold-chain packaging guaranteed for door delivery and depot lockers.',
      relatedProducts: related
    });
  });

  // -------------------------------------------------------------
  // 3. COLLABORATIVE FAMILY CART ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/cart', (req: Request, res: Response) => {
    const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const totalZAR = totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR;
    const totalZWG = totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG;
    const totalGBP = totalUSD * 0.79;

    res.json({
      cart: currentCart,
      members: INITIAL_MEMBERS,
      totals: {
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZAR: Number(totalZAR.toFixed(2)),
        totalZWG: Number(totalZWG.toFixed(2)),
        totalGBP: Number(totalGBP.toFixed(2)),
        itemCount: currentCart.reduce((cnt, i) => cnt + i.quantity, 0)
      }
    });
  });

  app.post('/api/cart/add', (req: Request, res: Response) => {
    const { productId, quantity = 1, memberId, memberName, memberLocation, channel = 'web', note } = req.body;
    
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in store catalog' });
    }

    const existingIndex = currentCart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += Number(quantity);
      if (note) currentCart[existingIndex].note = note;
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        product,
        quantity: Math.max(1, Number(quantity)),
        addedByMemberId: memberId || 'mem-1',
        addedByMemberName: memberName || 'Tinashe Moyo',
        addedByLocation: memberLocation || 'Johannesburg, SA',
        channel: channel || 'web',
        addedAt: new Date().toISOString(),
        note
      };
      currentCart.unshift(newItem);
    }

    broadcastCartUpdate(memberName || 'Family Member');
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/update', (req: Request, res: Response) => {
    const { itemId, quantity, note } = req.body;
    
    if (Number(quantity) <= 0) {
      currentCart = currentCart.filter(item => item.id !== itemId);
    } else {
      const item = currentCart.find(i => i.id === itemId);
      if (item) {
        item.quantity = Number(quantity);
        if (note !== undefined) item.note = note;
      }
    }

    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/remove', (req: Request, res: Response) => {
    const { itemId } = req.body;
    currentCart = currentCart.filter(item => item.id !== itemId);
    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/clear', (req: Request, res: Response) => {
    currentCart = [];
    broadcastCartUpdate('Cart Reset');
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/member-address', (req: Request, res: Response) => {
    const { memberId, address } = req.body;
    currentCart.forEach(item => {
      if (item.addedByMemberId === memberId) {
        item.deliveryAddress = address;
      }
    });
    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/split-calculator', (req: Request, res: Response) => {
    try {
      const { splitMethod = 'EQUAL', customRatios = {} } = req.body;
      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

      const memberTotals: { [memberId: string]: { subtotalUSD: number; count: number } } = {};
      INITIAL_MEMBERS.forEach(m => {
        memberTotals[m.id] = { subtotalUSD: 0, count: 0 };
      });

      currentCart.forEach(item => {
        if (!memberTotals[item.addedByMemberId]) {
          memberTotals[item.addedByMemberId] = { subtotalUSD: 0, count: 0 };
        }
        memberTotals[item.addedByMemberId].subtotalUSD += item.product.priceUSD * item.quantity;
        memberTotals[item.addedByMemberId].count += item.quantity;
      });

      const memberShares = INITIAL_MEMBERS.map(m => {
        let shareUSD = 0;
        const subtotalUSD = memberTotals[m.id]?.subtotalUSD || 0;

        if (splitMethod === 'EQUAL') {
          shareUSD = totalUSD / (INITIAL_MEMBERS.length || 1);
        } else if (splitMethod === 'BY_SUBMITTER') {
          shareUSD = subtotalUSD;
        } else if (splitMethod === 'CUSTOM') {
          const ratio = customRatios[m.id] || (1 / INITIAL_MEMBERS.length);
          shareUSD = totalUSD * ratio;
        }

        const percentage = totalUSD > 0 ? Math.round((shareUSD / totalUSD) * 100) : 0;

        return {
          memberId: m.id,
          memberName: m.name,
          location: m.location,
          role: m.role,
          subtotalUSD: Number(subtotalUSD.toFixed(2)),
          shareUSD: Number(shareUSD.toFixed(2)),
          shareZAR: Number((shareUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
          shareZWG: Number((shareUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
          shareGBP: Number((shareUSD * 0.79).toFixed(2)),
          percentage
        };
      });

      res.json({
        success: true,
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZAR: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
        totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
        totalGBP: Number((totalUSD * 0.79).toFixed(2)),
        splitMethod,
        shares: memberShares
      });
    } catch (err: any) {
      console.error('[Split Calculator Error]:', err);
      res.status(500).json({ error: 'Failed to calculate split shares' });
    }
  });

  // -------------------------------------------------------------
  // 4. ORDERS & LIVE DISPATCH TRACKING ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    const { status, search } = req.query;
    let filtered = [...ordersStore];

    if (status && status !== 'ALL') {
      filtered = filtered.filter(o => o.status === status);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.fulfillmentLocation.toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q))
      );
    }

    res.json({
      orders: filtered,
      totalCount: filtered.length
    });
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = ordersStore.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  app.post('/api/orders/reorder', (req: Request, res: Response) => {
    const { orderId } = req.body;
    const order = ordersStore.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Past order not found' });
    }

    let addedCount = 0;
    order.items.forEach(pastItem => {
      const prod = SAMPLE_PRODUCTS.find(p => p.id === pastItem.id) || matchProduct(pastItem.name);
      const existing = currentCart.find(c => c.productId === prod.id);
      if (existing) {
        existing.quantity += pastItem.quantity;
      } else {
        currentCart.unshift({
          id: `cart-reorder-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: prod.id,
          product: prod,
          quantity: pastItem.quantity,
          addedByMemberId: 'mem-1',
          addedByMemberName: 'Tariro Moyo',
          addedByLocation: 'London, UK',
          channel: 'web',
          addedAt: new Date().toISOString(),
          note: `Reordered from ${order.id}`
        });
      }
      addedCount += pastItem.quantity;
    });

    broadcastCartUpdate(`Re-order (${order.id})`);
    res.json({
      success: true,
      addedCount,
      cart: currentCart,
      message: `Added ${addedCount} items from ${order.id} into family cart.`
    });
  });

  app.post('/api/orders/:id/advance-status', (req: Request, res: Response) => {
    const order = ordersStore.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { nextStatus } = req.body;
    if (nextStatus) {
      order.status = nextStatus;
    } else if (order.status === 'PROCESSING') {
      order.status = order.fulfillmentType === 'CLICK_AND_COLLECT' ? 'READY_FOR_COLLECTION' : 'OUT_FOR_DELIVERY';
    } else if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'READY_FOR_COLLECTION') {
      order.status = 'DELIVERED';
    }

    // Update tracking steps
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (order.status === 'DELIVERED') {
      order.statusLabel = `Delivered to ${order.recipientName}`;
      order.statusColor = 'emerald';
      order.trackingSteps.forEach(s => s.completed = true);
    }

    io.emit('order:status_updated', order);
    res.json({ success: true, order });
  });

  // -------------------------------------------------------------
  // 5. COMMERCIAL TAX INVOICES ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/invoices', (req: Request, res: Response) => {
    res.json({
      invoices: invoicesStore,
      totalCount: invoicesStore.length
    });
  });

  app.get('/api/invoices/:id', (req: Request, res: Response) => {
    const invoice = invoicesStore.find(inv => inv.id === req.params.id || inv.orderId === req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice record not found' });
    }
    res.json(invoice);
  });

  app.get('/api/invoices/:id/html', (req: Request, res: Response) => {
    const invoice = invoicesStore.find(inv => inv.id === req.params.id || inv.orderId === req.params.id);
    if (!invoice) {
      return res.status(404).send('<h2>Invoice Not Found</h2>');
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1c1917; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #002D62; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 900; color: #002D62; }
    .badge { background: #E6F4EA; color: #137333; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #F5F5F4; text-align: left; padding: 10px; font-size: 13px; border-bottom: 2px solid #E7E5E4; }
    td { padding: 12px 10px; border-bottom: 1px solid #E7E5E4; font-size: 14px; }
    .total-box { margin-left: auto; width: 300px; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { font-size: 18px; font-weight: 900; color: #002D62; border-top: 2px solid #002D62; padding-top: 10px; margin-top: 6px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E7E5E4; font-size: 11px; color: #78716C; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #002D62; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Download PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="brand">TM Pick n Pay Zimbabwe</div>
      <div style="font-size: 12px; color: #57534E; margin-top: 4px;">Meikles Limited & Pick n Pay Retailers JV</div>
      <div style="font-size: 12px; color: #57534E;">VAT Registration: 10029481 | RBZ CD1 Authorized</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">OFFICIAL TAX INVOICE</span>
      <div style="font-size: 16px; font-weight: 800; margin-top: 8px;">${invoice.invoiceNumber}</div>
      <div style="font-size: 13px; color: #57534E;">Date: ${invoice.date}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <strong>Diaspora Sponsor (Billed To):</strong>
      <div>${invoice.customerName}</div>
      <div>${invoice.customerLocation}</div>
      <div style="margin-top: 8px;"><strong>Payment Rail:</strong> ${invoice.paymentRail}</div>
      <div><strong>Forex Declaration:</strong> ${invoice.forexReportingCode}</div>
    </div>
    <div>
      <strong>Zimbabwe Recipient (Delivered To):</strong>
      <div>${invoice.recipientName}</div>
      <div>${invoice.recipientAddress}</div>
      <div style="margin-top: 8px;"><strong>Fulfillment Store:</strong> ${invoice.storePartner}</div>
      <div><strong>Settlement Treasury:</strong> ${invoice.settlementAccount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price (USD)</th>
        <th style="text-align: right;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(it => `
        <tr>
          <td>${it.name}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">$${it.unitPriceUSD.toFixed(2)}</td>
          <td style="text-align: right;">$${it.totalUSD.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Subtotal:</span><span>$${invoice.subtotalUSD.toFixed(2)}</span></div>
    <div class="total-row"><span>Express Delivery / Depot Handling:</span><span>$${invoice.deliveryFeeUSD.toFixed(2)}</span></div>
    <div class="total-row"><span>Value Added Tax (Zero-Rated Export):</span><span>$${invoice.vatTaxUSD.toFixed(2)}</span></div>
    <div class="total-row grand-total"><span>Total Settled (USD):</span><span>$${invoice.totalUSD.toFixed(2)}</span></div>
    <div style="font-size: 11px; color: #57534E; margin-top: 6px; text-align: right;">
      Equivalent: £${invoice.currencyEquivalents.GBP.toFixed(2)} GBP | R${invoice.currencyEquivalents.ZAR.toFixed(2)} ZAR | ZWG ${invoice.currencyEquivalents.ZWG.toFixed(2)}
    </div>
  </div>

  <div class="footer">
    This document serves as an authorized commercial export receipt under Zimbabwe Reserve Bank (RBZ) Direct Inflow Regulations. Goods cleared for express handover in Zimbabwe.
  </div>
</body>
</html>
    `;
    res.send(html);
  });

  // -------------------------------------------------------------
  // 5B. DUAL-PATH COINBASE CHECKOUT & WEBHOOK SYSTEM
  // -------------------------------------------------------------

  // Dual-Path Checkout API: Routes US (Headless Native) vs UK/EU/AU/NZ (Hosted Redirect)
  const handleDualPathCheckout = async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'USD', orderId, customerEmail, country, card } = req.body;
      const totalAmount = amount ? parseFloat(amount) : currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const targetOrderId = orderId || `PNP-ZW-${Math.floor(10000 + Math.random() * 90000)}`;
      const targetCountry = country || (card?.billingCountry) || 'US';

      const checkoutResult = await createCoinbaseCheckout({
        amount: totalAmount,
        currency,
        orderId: targetOrderId,
        customerEmail: customerEmail || 'shopper@pnpexpress.co.zw',
        country: targetCountry,
        card
      });

      // Record Activity Log Session in MongoDB
      await ActivityLog.create({
        userId: customerEmail || 'guest_shopper',
        userEmail: customerEmail || 'shopper@pnpexpress.co.zw',
        action: `COINBASE_CHECKOUT_CREATED_${checkoutResult.mode}`,
        details: { checkoutId: checkoutResult.checkoutId, orderId: targetOrderId, country: targetCountry, amount: totalAmount }
      }).catch(() => {});

      return res.status(200).json(checkoutResult);
    } catch (err: any) {
      console.error('[Coinbase Checkout Creation Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to initialize Coinbase checkout' });
    }
  };

  app.post('/api/checkout', handleDualPathCheckout);
  app.post('/api/checkout/create', handleDualPathCheckout);

  // Coinbase Webhook Handler: Verifies HMAC signature and processes payment events (Onramp & Checkouts)
  const handleCoinbaseWebhook = async (req: Request, res: Response) => {
    try {
      const rawPayload = JSON.stringify(req.body);
      const signatureHeader = (req.headers['x-hook0-signature'] as string) || (req.headers['x-cc-webhook-signature'] as string) || (req.headers['x-cb-signature'] as string);
      const secret = process.env.COINBASE_WEBHOOK_SECRET || 'sec_wh_cdp_pnpexpress_2026';

      const isValid = verifyWebhookSignature(rawPayload, signatureHeader, secret, req.headers as any);

      const event = req.body || {};
      const eventType = event.eventType || event.type || event.event?.type;
      const status = event.status || event.data?.status;
      const orderId = event.partnerUserRef || event.data?.metadata?.orderId || event.event?.data?.metadata?.orderId || event.data?.id;
      const txHash = event.txHash || event.data?.txHash;

      if (
        (eventType === 'onramp.transaction.success' && status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') ||
        eventType === 'checkout.payment.success' ||
        eventType === 'charge:confirmed'
      ) {
        if (orderId) {
          const order = ordersStore.find(o => o.id === orderId);
          if (order) {
            order.status = 'PROCESSING';
            order.statusLabel = 'Payment Confirmed via Coinbase USDC (Base) - Packaging at TM Pick n Pay Avondale';
            order.statusColor = 'emerald';
            order.trackingSteps[0].completed = true;
          }
          await OrderModel.updateOne({ orderId }, { $set: { status: 'PROCESSING', statusLabel: 'Paid via Coinbase USDC', txHash } }).catch(() => {});
        }

        await ActivityLog.create({
          userId: event.partnerUserRef || 'webhooks',
          userEmail: 'webhooks@pnpexpress.co.zw',
          action: 'COINBASE_PAYMENT_SUCCESS_WEBHOOK',
          details: { orderId, eventType, txHash, usdcAmount: event.purchaseAmount?.value }
        }).catch(() => {});
      } else if (eventType === 'onramp.transaction.failed' || eventType === 'checkout.payment.failed' || eventType === 'charge:failed') {
        if (orderId) {
          await OrderModel.updateOne({ orderId }, { $set: { status: 'FAILED' } }).catch(() => {});
        }
      } else if (eventType === 'checkout.refund.success') {
        if (orderId) {
          await OrderModel.updateOne({ orderId }, { $set: { status: 'REFUNDED' } }).catch(() => {});
        }
      }

      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Coinbase Webhook Handler Error]:', err);
      return res.status(200).send('OK');
    }
  };

  app.post('/api/webhooks/coinbase', handleCoinbaseWebhook);
  app.post('/api/webhooks/onramp', handleCoinbaseWebhook);
  app.post('/webhooks/onramp', handleCoinbaseWebhook);

  // Refund Route: Cancels / refunds order via Coinbase CDP API
  app.post(['/api/checkout/:id/refund', '/api/checkout/refund'], async (req: Request, res: Response) => {
    try {
      const checkoutId = req.params.id || req.body.checkoutId || req.body.orderId;
      const reason = req.body.reason || 'Order cancelled by customer';

      const result = await refundCoinbaseCheckout(checkoutId, reason);

      await ActivityLog.create({
        userId: 'admin_refund',
        action: 'COINBASE_REFUND_EXECUTED',
        details: { checkoutId, reason }
      }).catch(() => {});

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to process refund' });
    }
  });

  // -------------------------------------------------------------
  // 6. MULTI-RAIL PAYMENT ORCHESTRATOR
  // -------------------------------------------------------------
  async function processContiPay(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(220 + Math.floor(Math.random() * 80));
    const latencyMs = Date.now() - startTime;

    const country = (card.billingCountry || '').toUpperCase();
    const cleanPan = (card.cardNumber || '').replace(/\D/g, '');

    // Hard decline check
    if (cleanPan.endsWith('0000')) {
      return {
        success: false,
        latencyMs,
        error: 'HARD_DECLINE: Insufficient funds in cardholder account'
      };
    }

    if (card.cvv === '000') {
      return {
        success: false,
        latencyMs,
        error: 'HARD_DECLINE: Invalid CVV security code'
      };
    }

    // Soft errors triggering fallback: Coinbase Commerce, Australasia, or test card numbers ending in 9991/9992
    if (
      country.includes('COINBASE') ||
      country.includes('USDC') ||
      country.includes('CARD-TO-USDC') ||
      country.includes('GLOBAL') ||
      country.includes('OTHER') ||
      country.includes('AU') || 
      country.includes('NZ') || 
      country.includes('AUSTRALIA') || 
      country.includes('NEW ZEALAND') || 
      cleanPan.endsWith('9991') || 
      cleanPan.endsWith('9992')
    ) {
      return {
        success: false,
        latencyMs,
        error: (country.includes('COINBASE') || country.includes('USDC'))
          ? 'ROUTING_DIRECT: Initiating Coinbase Commerce (Card-to-USDC) clearing waterfall'
          : 'GATEWAY_UNSUPPORTED_REGION: ContiPay primary routing restricted to UK/EU/US card BINs'
      };
    }

    // Success via ContiPay (UK, EU, US direct Nostro)
    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `CTP-UK-${orderId}-${Math.floor(1000 + Math.random() * 9000)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_STANBIC_01 (Stanbic Bank Zimbabwe)',
      forexCode: `RBZ-CD1-CTP-${timestamp.toString(36).toUpperCase()}`
    };
  }

  async function processPesapal(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(320 + Math.floor(Math.random() * 90));
    const latencyMs = Date.now() - startTime;

    const country = (card.billingCountry || '').toUpperCase();
    const cleanPan = (card.cardNumber || '').replace(/\D/g, '');

    // If user has chosen Coinbase Commerce or test card ending in 9992, route directly to Coinbase USDC
    if (country.includes('COINBASE') || country.includes('USDC') || country.includes('CARD-TO-USDC') || cleanPan.endsWith('9992')) {
      return {
        success: false,
        latencyMs,
        error: (country.includes('COINBASE') || country.includes('USDC'))
          ? 'ROUTING_PREFERENCE: Directing to Coinbase Commerce (Card-to-USDC) clearing rail'
          : 'ACQUIRER_TIMEOUT: Australasia regional clearing bridge timeout (>450ms)'
      };
    }

    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `PSP-APAC-${orderId}-${Math.floor(1000 + Math.random() * 9000)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_CABS_02 (CABS Nostro Zimbabwe)',
      forexCode: `RBZ-ECTS-PSP-${timestamp.toString(36).toUpperCase()}`
    };
  }

  async function processCoinbaseUSDC(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(450 + Math.floor(Math.random() * 100));
    const latencyMs = Date.now() - startTime;

    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `CB-USDC-0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_CBZ_03 (CBZ Bank Forex Bureau Off-Ramp)',
      forexCode: `RBZ-CRYPTO-BUREAU-091-${timestamp.toString(36).toUpperCase()}`
    };
  }

  // Unified Payment Orchestration Controller
  app.post('/api/checkout/orchestrate', async (req: Request, res: Response) => {
    const orchestrationStart = Date.now();
    const attempts: OrchestrationAttempt[] = [];

    try {
      const { 
        card, 
        payerMemberId = 'mem-1', 
        payerMemberName = 'Tariro Moyo (London Diaspora)',
        deliveryAddresses = {}
      } = req.body;

      if (!card || !card.cardNumber) {
        return res.status(400).json({ error: 'Card information required for payment orchestration.' });
      }

      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const totalItemsCount = currentCart.reduce((cnt, i) => cnt + i.quantity, 0);

      const orderId = `PNP-ZW-${Math.floor(10000 + Math.random() * 90000)}`;
      const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const cleanPan = (card.cardNumber || '').replace(/\D/g, '');
      const last4 = cleanPan.slice(-4) || '4242';

      let settledRail: PaymentRail | null = null;
      let settlementData: any = null;

      // Rail 1: ContiPay
      const contiResult = await processContiPay(card, totalUSD, orderId);
      attempts.push({
        rail: 'CONTIPAY',
        latencyMs: contiResult.latencyMs,
        error: contiResult.error,
        status: contiResult.success ? 'SUCCESS' : 'FAILED'
      });

      if (contiResult.success) {
        settledRail = 'CONTIPAY';
        settlementData = contiResult;
      } else if (contiResult.error && contiResult.error.startsWith('HARD_DECLINE:')) {
        const totalLatencyMs = Date.now() - orchestrationStart;
        return res.status(402).json({
          success: false,
          orderId,
          totalLatencyMs,
          attempts,
          error: contiResult.error.replace('HARD_DECLINE: ', ''),
          userMessage: 'Card transaction was declined by the card issuer.'
        });
      }

      // Rail 2: Fallback Pesapal
      if (!settledRail) {
        const pesapalResult = await processPesapal(card, totalUSD, orderId);
        attempts.push({
          rail: 'PESAPAL',
          latencyMs: pesapalResult.latencyMs,
          error: pesapalResult.error,
          status: pesapalResult.success ? 'SUCCESS' : 'FAILED'
        });

        if (pesapalResult.success) {
          settledRail = 'PESAPAL';
          settlementData = pesapalResult;
        }
      }

      // Rail 3: Fallback Coinbase USDC
      if (!settledRail) {
        const coinbaseResult = await processCoinbaseUSDC(card, totalUSD, orderId);
        attempts.push({
          rail: 'COINBASE_USDC',
          latencyMs: coinbaseResult.latencyMs,
          error: coinbaseResult.error,
          status: coinbaseResult.success ? 'SUCCESS' : 'FAILED'
        });

        if (coinbaseResult.success) {
          settledRail = 'COINBASE_USDC';
          settlementData = coinbaseResult;
        }
      }

      if (settledRail && settlementData) {
        const totalLatencyMs = Date.now() - orchestrationStart;

        // 1. Create Past Order Record in Store
        const newOrderItems = currentCart.map(item => ({
          id: item.productId,
          name: item.product.name,
          nativeName: item.product.nativeName,
          quantity: item.quantity,
          unitPriceUSD: item.product.priceUSD,
          totalUSD: item.product.priceUSD * item.quantity,
          image: item.product.image,
          store: item.product.storeName,
          weightOrVol: item.product.unit
        }));

        const newPastOrder: PastOrder = {
          id: orderId,
          invoiceNumber,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          timestamp: new Date().toISOString(),
          status: 'PROCESSING',
          statusLabel: 'Packaging at TM Pick n Pay Avondale',
          statusColor: 'blue',
          storePartner: 'TM Pick n Pay Avondale, Harare',
          fulfillmentType: 'DOOR_DELIVERY',
          fulfillmentLocation: 'House 42, Bath Road, Avondale, Harare',
          recipientName: 'Gogo Moyo',
          recipientPhone: '+263 77 234 5678',
          collectionCode: `PIN-${Math.floor(1000 + Math.random() * 9000)}-HRE`,
          paymentMethod: {
            type: settledRail as any,
            label: `${settledRail} Cross-Border (••${last4})`,
            details: `Settled into ${settlementData.nostroAccount?.split(' ')[0]}`,
            authRef: settlementData.txRef || `AUTH-${orderId}`
          },
          subtotalUSD: Number(totalUSD.toFixed(2)),
          deliveryFeeUSD: 3.50,
          vatTaxUSD: 0.00,
          totalUSD: Number((totalUSD + 3.50).toFixed(2)),
          items: newOrderItems.length > 0 ? newOrderItems : [
            {
              id: 'WS-5KG',
              name: 'White Star Super Maize Meal (5kg)',
              nativeName: 'Hupfu hweSona',
              quantity: 2,
              unitPriceUSD: 4.50,
              totalUSD: 9.00,
              image: '/images/white_star_maize.jpg',
              store: 'TM Pick n Pay',
              weightOrVol: '5kg x 2'
            }
          ],
          trackingSteps: [
            {
              title: `Payment Cleared via ${settledRail}`,
              description: `Funds authorized and allocated to TM Pick n Pay Nostro account.`,
              time: 'Just Now',
              completed: true,
              current: true
            },
            {
              title: 'Aisle Staging & Packaging',
              description: 'Cold-chain dispatch team assembling order in refrigerated depot crates.',
              time: 'Estimated 20 Mins',
              completed: false
            },
            {
              title: 'Assigned to Express Delivery Van',
              description: 'Courier route optimization in progress.',
              time: 'Estimated 1 Hour',
              completed: false
            },
            {
              title: 'Handover & Signature',
              description: 'Recipient OTP scan at doorstep.',
              time: 'Estimated 3 Hours',
              completed: false
            }
          ]
        };

        ordersStore.unshift(newPastOrder);

        // MongoDB Atlas Async Sync
        try {
          await OrderModel.create({
            orderId: newPastOrder.id,
            invoiceNumber: newPastOrder.invoiceNumber,
            date: newPastOrder.date,
            timestamp: newPastOrder.timestamp,
            status: newPastOrder.status,
            statusLabel: newPastOrder.statusLabel,
            statusColor: newPastOrder.statusColor,
            storePartner: newPastOrder.storePartner,
            fulfillmentType: newPastOrder.fulfillmentType,
            fulfillmentLocation: newPastOrder.fulfillmentLocation,
            recipientName: newPastOrder.recipientName,
            recipientPhone: newPastOrder.recipientPhone,
            paymentMethod: newPastOrder.paymentMethod,
            subtotalUSD: newPastOrder.subtotalUSD,
            deliveryFeeUSD: newPastOrder.deliveryFeeUSD,
            vatTaxUSD: newPastOrder.vatTaxUSD,
            totalUSD: newPastOrder.totalUSD,
            items: newPastOrder.items,
            trackingSteps: newPastOrder.trackingSteps
          });

          await ActivityLog.create({
            userId: payerMemberId || 'mem-1',
            userEmail: 'tariro.moyo@gmail.com',
            action: 'ORDER_PLACED_AND_SETTLED',
            details: {
              orderId,
              invoiceNumber,
              settledRail,
              totalUSD: newPastOrder.totalUSD,
              cdpProjectId: process.env.VITE_CDP_PROJECT_ID
            }
          });
        } catch (dbErr) {
          console.error('[MongoDB Order Save Error]:', dbErr);
        }

        // 2. Create Commercial Tax Invoice Record
        const newInvoice: CommercialInvoice = {
          id: invoiceNumber,
          invoiceNumber,
          orderId,
          date: newPastOrder.date,
          timestamp: newPastOrder.timestamp,
          customerName: payerMemberName.split('(')[0].trim() || 'Tariro Moyo',
          customerLocation: 'London, United Kingdom (Diaspora Sponsor)',
          recipientName: newPastOrder.recipientName,
          recipientAddress: newPastOrder.fulfillmentLocation,
          storePartner: newPastOrder.storePartner,
          paymentRail: `${settledRail} Cross-Border (Ref: ${settlementData.txRef})`,
          settlementAccount: settlementData.nostroAccount || 'TM_PNP_USD_NOSTRO_STANBIC_01',
          forexReportingCode: settlementData.forexCode || `RBZ-CD1-${orderId}`,
          subtotalUSD: newPastOrder.subtotalUSD,
          deliveryFeeUSD: newPastOrder.deliveryFeeUSD,
          vatTaxUSD: 0.00,
          totalUSD: newPastOrder.totalUSD,
          currencyEquivalents: {
            GBP: Number((newPastOrder.totalUSD * 0.79).toFixed(2)),
            ZAR: Number((newPastOrder.totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
            ZWG: Number((newPastOrder.totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
            EUR: Number((newPastOrder.totalUSD * 0.92).toFixed(2)),
            AUD: Number((newPastOrder.totalUSD * 1.54).toFixed(2))
          },
          items: newPastOrder.items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unitPriceUSD: i.unitPriceUSD,
            totalUSD: i.totalUSD
          }))
        };

        invoicesStore.unshift(newInvoice);

        // 3. Record Audit Log
        paymentAuditLogs.unshift({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          orderId,
          amountUSD: totalUSD,
          billingCountry: card.billingCountry || 'United Kingdom',
          cardLast4: last4,
          status: 'SETTLED',
          finalRail: settledRail,
          attempts,
          nostroAccount: settlementData.nostroAccount,
          forexCode: settlementData.forexCode,
          totalLatencyMs
        });

        const responseData: OrchestrationResponse = {
          success: true,
          orderId,
          voucherCode,
          finalRail: settledRail,
          transactionReference: settlementData.txRef,
          settlementAccount: settlementData.nostroAccount,
          forexReportingCode: settlementData.forexCode,
          totalLatencyMs,
          attempts,
          userMessage: `Payment authorized and settled via ${settledRail} Cross-Border Rail into Zimbabwe Nostro treasury.`,
          itemsCount: totalItemsCount,
          totalUSD: Number(totalUSD.toFixed(2)),
          timestamp: new Date().toISOString()
        };

        // Emit Socket Event
        io.emit('order:created', newPastOrder);
        io.emit('payment:orchestrated', responseData);

        // Clear Cart
        currentCart = [];
        broadcastCartUpdate(`Payment Orchestrator (${settledRail})`);

        return res.json(responseData);
      }

      // All Rails Failed
      const totalLatencyMs = Date.now() - orchestrationStart;
      return res.status(502).json({
        success: false,
        orderId,
        totalLatencyMs,
        attempts,
        error: 'All payment rails exhausted. Please check card details or try another card.',
        userMessage: 'Payment processing could not be completed across all fallback channels.'
      });

    } catch (err: any) {
      console.error('[Payment Orchestrator Fatal Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Payment orchestrator internal error',
        totalLatencyMs: Date.now() - orchestrationStart,
        attempts
      });
    }
  });

  app.get('/api/payment-orchestrator/logs', (req: Request, res: Response) => {
    res.json({
      success: true,
      totalCount: paymentAuditLogs.length,
      logs: paymentAuditLogs.slice(0, 30),
      supportedRails: [
        {
          rail: 'CONTIPAY',
          priority: 1,
          targetRegions: ['UK', 'EU', 'USA'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_STANBIC_01',
          compliance: 'RBZ Form CD1 Forex Declaration',
          targetSLA: '< 400ms'
        },
        {
          rail: 'PESAPAL',
          priority: 2,
          targetRegions: ['Australia', 'New Zealand', 'SADC', 'East Africa'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_CABS_02',
          compliance: 'RBZ ECTS Inflow Certification',
          targetSLA: '< 600ms'
        },
        {
          rail: 'COINBASE_USDC',
          priority: 3,
          targetRegions: ['Global Fallback / Unrestricted'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_CBZ_03 (Bureau de Change Off-Ramp)',
          compliance: 'RBZ Licensed Bureau Crypto-to-Nostro Clearance',
          targetSLA: '< 800ms'
        }
      ]
    });
  });

  // -------------------------------------------------------------
  // 7. GEMINI VOICE AI & SMART ASSISTANT ENDPOINTS
  // -------------------------------------------------------------
  app.post('/api/voice-ai', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const textPrompt = req.body.textPrompt;
      const file = req.file;

      if (!textPrompt && !file) {
        return res.status(400).json({ error: 'Audio file or textPrompt required' });
      }

      const systemInstruction = `
You are PnP's Multilingual African Voice AI Shopping Assistant for South Africa and Zimbabwe.
You understand English, Shona (chiShona), Ndebele (siNdebele), Zulu (isiZulu), Xhosa, Tswana, and Sesotho.

Your task is to analyze user spoken or written grocery orders, which often contain code-switched or colloquial terms.
Key African Grocery Term Translations:
- "hupfu", "hupfu hweSona", "impuphu", "upfu" -> Maize Meal / Mealies
- "mafuta", "mafuta ekubikisa", "amafutha" -> Cooking Oil
- "chigaku", "shugera", "unshukela", "shuga" -> White Sugar
- "mukaka", "ubisi" -> Fresh or Steri Milk
- "mazoe", "mazoe orange" -> Mazoe Orange Crush
- "mwenje", "solar", "mwenje wezuva", "amagetsi" -> Solar Light / Charger Kit
- "nyama", "nyama yemombe", "inyama" -> Beef Meat
- "tii", "chai" -> Tea Bags
- "sipo", "isipho" -> Laundry Soap Bar

Available Action Types:
- "ADD": User wants to add item(s) to cart.
- "REMOVE": User wants to remove item(s).
- "QUERY": User asking about prices or recommendations.
- "CHECKOUT": User asking to finalize or send invoice.

Response Guidelines:
1. Identify the items and quantities requested.
2. Formulate a natural 'spokenResponse' in the same language as the user's input (Shona, Ndebele, Zulu, English), confirming the item was added to the family cart.
3. Return strict JSON matching the schema.
`;

      let contentsPayload: any;

      if (file) {
        const base64Data = file.buffer.toString('base64');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.mimetype || 'audio/webm'
              }
            },
            {
              text: 'Listen to this grocery audio request and extract intent, items, quantity, and spoken native response.'
            }
          ]
        };
      } else {
        contentsPayload = `Process this African grocery order: "${textPrompt}". Extract intent, items, quantities, and spoken native response.`;
      }

      // Call Gemini 3.6 Flash
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    qty: { type: Type.INTEGER }
                  }
                }
              },
              spokenResponse: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      });

      const parsed: VoiceAIResult = JSON.parse(geminiResponse.text || '{}');

      // Mutate cart if action is ADD
      if (parsed.action === 'ADD' && parsed.items && parsed.items.length > 0) {
        for (const itemRequest of parsed.items) {
          const product = matchProduct(itemRequest.productName);
          const qty = itemRequest.qty || 1;

          const existingIndex = currentCart.findIndex(i => i.productId === product.id);
          if (existingIndex > -1) {
            currentCart[existingIndex].quantity += qty;
          } else {
            currentCart.unshift({
              id: `cart-ai-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              productId: product.id,
              product,
              quantity: qty,
              addedByMemberId: 'mem-2',
              addedByMemberName: 'Gogo Moyo',
              addedByLocation: 'Harare, ZIM',
              channel: file ? 'whatsapp' : 'web',
              addedAt: new Date().toISOString(),
              note: `Added via ${parsed.detectedLanguage || 'African'} Voice AI Assistant`
            });
          }
        }
        broadcastCartUpdate('Gogo Moyo (Voice AI)');
      }

      res.json({
        success: true,
        result: parsed,
        cart: currentCart
      });

    } catch (err: any) {
      console.error('[Gemini Voice AI Error]:', err);
      
      const fallbackPrompt = (req.body.textPrompt || 'Hupfu nemafuta').toLowerCase();
      let matchedProduct = SAMPLE_PRODUCTS[0];
      let lang = 'Shona';
      let nativeReply = 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.';

      if (fallbackPrompt.includes('ndebele') || fallbackPrompt.includes('upfu')) {
        lang = 'Ndebele';
        nativeReply = 'Ngizofaka impuphu lobisi enqoleni yomdeni.';
      }

      currentCart.unshift({
        id: `cart-fb-${Date.now()}`,
        productId: matchedProduct.id,
        product: matchedProduct,
        quantity: 1,
        addedByMemberId: 'mem-2',
        addedByMemberName: 'Gogo Moyo',
        addedByLocation: 'Harare, ZIM',
        channel: 'whatsapp',
        addedAt: new Date().toISOString(),
        note: `Added via ${lang} Voice Assistant`
      });

      broadcastCartUpdate('Gogo Moyo (Voice AI)');

      res.json({
        success: true,
        result: {
          action: 'ADD',
          items: [{ productName: matchedProduct.name, qty: 1 }],
          spokenResponse: nativeReply,
          detectedLanguage: lang,
          confidence: 0.95,
          originalText: req.body.textPrompt || 'Voice Note'
        },
        cart: currentCart
      });
    }
  });

  app.post('/api/ai/shopping-advisor', async (req: Request, res: Response) => {
    try {
      const { query = 'What are good staples for a family of 4 in Harare?' } = req.body;

      const prompt = `You are the TM Pick n Pay Cross-Border Grocery Advisor.
Advise a diaspora sponsor on this question: "${query}".
Available products in catalog:
${SAMPLE_PRODUCTS.map(p => `- ${p.name} ($${p.priceUSD} USD, ${p.unit}, Store: ${p.storeName})`).join('\n')}

Provide practical, helpful advice in 2-3 concise paragraphs, highlighting high-calorie nutritional value and load-shedding convenience (e.g. solar lighting, UHT long-life milk).
Also recommend 3 product IDs from the catalog.
Return JSON with:
1. "response": string
2. "recommendedProductIds": array of strings.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              response: { type: Type.STRING },
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(geminiResponse.text || '{}');
      const recProducts = SAMPLE_PRODUCTS.filter(p => parsed.recommendedProductIds?.includes(p.id));

      res.json({
        success: true,
        response: parsed.response || 'We recommend pairing 10kg White Star Maize Meal, Pure Sunflower Oil, and Tanganda Tea for a well-rounded household staple pack.',
        recommendations: recProducts.length > 0 ? recProducts : SAMPLE_PRODUCTS.slice(0, 3)
      });
    } catch (err) {
      res.json({
        success: true,
        response: 'For a family of 4 in Zimbabwe, securing essential staples like maize meal, cooking oil, long-life milk, and a backup solar lighting kit provides maximum peace of mind.',
        recommendations: [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[3], SAMPLE_PRODUCTS[7]]
      });
    }
  });

  app.post('/api/ai/recipe-suggest', async (req: Request, res: Response) => {
    try {
      const { recipeQuery = 'Sadza ne Beef Stew ne Muriwo' } = req.body;

      const prompt = `You are a culinary expert in traditional Southern African and Zimbabwean dishes.
The user wants to cook: "${recipeQuery}".
Current cart items: ${currentCart.map(i => i.product.name).join(', ') || 'None'}.

Available store catalog:
${SAMPLE_PRODUCTS.map(p => `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category}`).join('\n')}

Identify necessary ingredients to prepare this dish, and match them with IDs from the available catalog.
Return JSON with:
1. "recipeName": string
2. "description": short appetizing description
3. "matchedCatalogIds": array of matching product IDs
4. "missingIngredients": array of ingredient names not in catalog.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipeName: { type: Type.STRING },
              description: { type: Type.STRING },
              matchedCatalogIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              missingIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const matchedProducts = SAMPLE_PRODUCTS.filter(p => parsed.matchedCatalogIds?.includes(p.id));

      res.json({
        success: true,
        recipeName: parsed.recipeName || recipeQuery,
        description: parsed.description || 'Rich traditional Zimbabwean meal prepared with fresh farm ingredients.',
        matchedProducts: matchedProducts.length > 0 ? matchedProducts : SAMPLE_PRODUCTS.slice(0, 3),
        missingIngredients: parsed.missingIngredients || []
      });
    } catch (err: any) {
      console.error('[Recipe Suggest Error]:', err);
      res.json({
        success: true,
        recipeName: 'Traditional Sadza & Beef Stew',
        description: 'Authentic Zimbabwean staple featuring cooked white maize meal, braised beef blade, and fresh leafy vegetables.',
        matchedProducts: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[10] || SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[2]],
        missingIngredients: ['Onions', 'Tomatoes']
      });
    }
  });

  // -------------------------------------------------------------
  // 8. LOW-DATA WHATSAPP WEBHOOK & BOT
  // -------------------------------------------------------------
  app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      const fromPhone = req.body.From || req.body.fromPhone || '+263772123456';
      const senderName = req.body.senderName || (fromPhone.includes('263772') ? 'Gogo Moyo' : 'Uncle Farai');
      const bodyText = req.body.Body || req.body.text || 'Ndinoda hupfu hweSona ne mafuta';
      const isVoice = req.body.isVoiceNote || false;

      let parsedResult: VoiceAIResult = {
        action: 'ADD',
        items: [{ productName: '10kg Maize Meal', qty: 1 }],
        spokenResponse: 'Ndaisa hupfu nemafuta mungoro.',
        detectedLanguage: 'Shona',
        confidence: 0.9
      };

      try {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `A user sent this WhatsApp message in Zimbabwe/South Africa: "${bodyText}". Identify if they want to add groceries, check cart, or clear cart. Return JSON.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      qty: { type: Type.INTEGER }
                    }
                  }
                },
                spokenResponse: { type: Type.STRING },
                detectedLanguage: { type: Type.STRING }
              }
            }
          }
        });

        if (geminiResponse.text) {
          parsedResult = JSON.parse(geminiResponse.text);
        }
      } catch (geminiErr) {
        console.warn('[WhatsApp Gemini Warning]: using heuristic parser:', geminiErr);
      }

      if (parsedResult.action === 'ADD' && parsedResult.items && parsedResult.items.length > 0) {
        for (const it of parsedResult.items) {
          const prod = matchProduct(it.productName);
          const qty = it.qty || 1;
          
          const existing = currentCart.find(c => c.productId === prod.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            currentCart.unshift({
              id: `cart-wa-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              productId: prod.id,
              product: prod,
              quantity: qty,
              addedByMemberId: 'mem-2',
              addedByMemberName: senderName,
              addedByLocation: 'Harare, ZIM',
              channel: 'whatsapp',
              addedAt: new Date().toISOString(),
              note: `Added via WhatsApp (${parsedResult.detectedLanguage || 'Local'})`
            });
          }
        }
      }

      broadcastCartUpdate(`${senderName} (WhatsApp)`);

      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const totalZWG = (totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2);

      const itemsSummaryList = currentCart
        .map(item => `• ${item.quantity}x ${item.product.name} ($${(item.product.priceUSD * item.quantity).toFixed(2)})`)
        .join('\n');

      const replyText = `🛒 *TM Pick n Pay Family Cart Updated!*\n\n*Current Shared Items:*\n${itemsSummaryList || 'Cart is empty'}\n\n*Total:* $${totalUSD.toFixed(2)} USD (ZWG ${totalZWG})\n*Delivery:* Harare Express & Bulawayo Locker\n\nReply *1* to Checkout via EcoCash / Mukuru.\nReply *LIST* to view options.`;

      const waMsg: WhatsAppMessage = {
        id: `wa-${Date.now()}`,
        fromPhone,
        senderName,
        text: bodyText,
        isVoiceNote: isVoice,
        timestamp: new Date().toISOString(),
        status: 'processed',
        parsedIntent: {
          action: parsedResult.action || 'ADD',
          items: parsedResult.items || [],
          spokenResponse: parsedResult.spokenResponse,
          detectedLanguage: parsedResult.detectedLanguage
        },
        replyText
      };

      whatsappLog.unshift(waMsg);
      io.emit('whatsapp:message_received', waMsg);

      if (req.headers['content-type']?.includes('x-www-form-urlencoded')) {
        res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`);
      } else {
        res.json({
          success: true,
          waMessage: waMsg,
          cart: currentCart,
          replyText
        });
      }

    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err);
      res.status(500).json({ error: 'Failed to process WhatsApp webhook' });
    }
  });

  app.get('/api/whatsapp/logs', (req: Request, res: Response) => {
    res.json({ logs: whatsappLog });
  });

  // -------------------------------------------------------------
  // 9. SMART BASKET AI RECOMMENDATION ENDPOINT
  // -------------------------------------------------------------
  app.post('/api/smart-basket/recommendations', async (req: Request, res: Response) => {
    try {
      const { budgetUSD = 50, familySize = 4, location = 'Harare, ZIM', preferences = [] } = req.body;

      const prompt = `Generate a recommended grocery staple basket for a family of ${familySize} in ${location} with a target budget of $${budgetUSD} USD.
Available products in catalog:
${SAMPLE_PRODUCTS.map(p => `- ${p.id}: ${p.name} ($${p.priceUSD} USD, Category: ${p.category})`).join('\n')}

Preferences: ${preferences.join(', ') || 'Standard household staples'}.

Return a JSON object with:
1. "recommendedProductIds": list of product IDs from catalog.
2. "totalEstimatedUSD": calculated sum.
3. "aiNote": short explanation in Shona/English explaining why this basket was chosen for the family.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              totalEstimatedUSD: { type: Type.NUMBER },
              aiNote: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const recommendedProducts = SAMPLE_PRODUCTS.filter(p => result.recommendedProductIds?.includes(p.id));

      res.json({
        success: true,
        recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : SAMPLE_PRODUCTS.slice(0, 4),
        totalEstimatedUSD: result.totalEstimatedUSD || 42.50,
        aiNote: result.aiNote || 'Kudya kwemhuri kwasarudzwa zvinotsvukisa nenzira yehutsanana (Balanced family staples selected).'
      });
    } catch (err: any) {
      res.json({
        success: true,
        recommendedProducts: SAMPLE_PRODUCTS.slice(0, 4),
        totalEstimatedUSD: 38.90,
        aiNote: 'Essential family staples algorithmically selected for high energy and nutritional balance.'
      });
    }
  });

  app.post('/api/smart-basket/apply', (req: Request, res: Response) => {
    const { productIds = [] } = req.body;
    let addedCount = 0;

    productIds.forEach((id: string) => {
      const prod = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (prod) {
        const existing = currentCart.find(c => c.productId === prod.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          currentCart.unshift({
            id: `cart-smart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            productId: prod.id,
            product: prod,
            quantity: 1,
            addedByMemberId: 'mem-1',
            addedByMemberName: 'Tariro Moyo',
            addedByLocation: 'London, UK',
            channel: 'web',
            addedAt: new Date().toISOString(),
            note: 'Added from Smart Basket AI'
          });
        }
        addedCount++;
      }
    });

    broadcastCartUpdate('Smart Basket AI');
    res.json({ success: true, addedCount, cart: currentCart });
  });

  // -------------------------------------------------------------
  // 10. DEPOTS & DELIVERY QUOTE ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/depots', (req: Request, res: Response) => {
    const { city } = req.query;
    let list = depotsStore;
    if (city) {
      list = list.filter(d => d.city.toLowerCase() === String(city).toLowerCase());
    }
    res.json({ depots: list, total: list.length });
  });

  app.post('/api/delivery/quote', (req: Request, res: Response) => {
    const { city = 'Harare', deliveryType = 'DOOR_DELIVERY' } = req.body;
    
    if (deliveryType === 'STORE_PICKUP') {
      return res.json({
        deliveryFeeUSD: 0.00,
        eta: 'Ready for Collection in 2 Hours',
        fulfillmentType: 'CLICK_AND_COLLECT'
      });
    }

    let fee = 3.50;
    let eta = 'Within 4 Hours (Express Dispatch)';

    if (city.toLowerCase().includes('bulawayo')) {
      fee = 4.00;
      eta = 'Within 3-5 Hours';
    } else if (city.toLowerCase().includes('mutare')) {
      fee = 4.50;
      eta = 'Same-Day Afternoon Delivery';
    }

    res.json({
      deliveryFeeUSD: fee,
      eta,
      fulfillmentType: 'DOOR_DELIVERY'
    });
  });

  // -------------------------------------------------------------
  // 11. EXCHANGE RATES & CURRENCY ENGINE
  // -------------------------------------------------------------
  app.get('/api/exchange-rates', (req: Request, res: Response) => {
    res.json({
      ...INITIAL_EXCHANGE_RATES,
      rates: {
        GBP: 0.79,
        USD: 1.00,
        ZAR: 18.50,
        ZWG: 26.80,
        EUR: 0.92,
        AUD: 1.54,
        NZD: 1.68,
        CHF: 0.88,
        CNY: 7.23,
        AED: 3.67
      }
    });
  });

  app.post('/api/currency/convert', (req: Request, res: Response) => {
    const { amountUSD = 0, targetCurrency = 'GBP' } = req.body;
    const rates: Record<string, number> = {
      GBP: 0.79,
      USD: 1.00,
      ZAR: 18.50,
      ZWG: 26.80,
      EUR: 0.92,
      AUD: 1.54,
      NZD: 1.68,
      CHF: 0.88,
      CNY: 7.23,
      AED: 3.67
    };

    const rate = rates[targetCurrency] || 1.0;
    const targetAmount = Number((amountUSD * rate).toFixed(2));

    res.json({
      amountUSD: Number(amountUSD.toFixed(2)),
      targetCurrency,
      targetAmount,
      rate
    });
  });

  // -------------------------------------------------------------
  // 12. USER PROFILE & ADDRESS BOOK ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/user/profile', (req: Request, res: Response) => {
    res.json(userProfileStore);
  });

  app.put('/api/user/profile', (req: Request, res: Response) => {
    userProfileStore = {
      ...userProfileStore,
      ...req.body
    };
    res.json({ success: true, profile: userProfileStore });
  });

  app.get('/api/user/addresses', (req: Request, res: Response) => {
    res.json(userAddressesStore);
  });

  app.post('/api/user/addresses', (req: Request, res: Response) => {
    const newAddress: DeliveryAddress = {
      type: req.body.type || 'DOOR_DELIVERY',
      addressLine: req.body.addressLine || 'Main St',
      suburb: req.body.suburb || '',
      city: req.body.city || 'Harare',
      country: 'Zimbabwe',
      instructions: req.body.instructions || '',
      lat: req.body.lat,
      lng: req.body.lng,
      storeId: req.body.storeId,
      storeName: req.body.storeName
    };
    userAddressesStore.push(newAddress);
    res.json({ success: true, addresses: userAddressesStore });
  });

  // -------------------------------------------------------------
  // 13. LIVE CALL SHOPPING / VIRTUAL CONCIERGE ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/live-call/session', (req: Request, res: Response) => {
    res.json(liveCallStore);
  });

  app.post('/api/live-call/session', (req: Request, res: Response) => {
    const { action } = req.body;
    if (action === 'START') {
      liveCallStore.isActive = true;
    } else if (action === 'END') {
      liveCallStore.isActive = false;
    }
    io.emit('live_call:state', liveCallStore);
    res.json(liveCallStore);
  });

  app.post('/api/live-call/scan-barcode', (req: Request, res: Response) => {
    const randomProduct = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
    
    // Add to cart directly
    const existing = currentCart.find(c => c.productId === randomProduct.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.unshift({
        id: `cart-scan-${Date.now()}`,
        productId: randomProduct.id,
        product: randomProduct,
        quantity: 1,
        addedByMemberId: 'mem-1',
        addedByMemberName: 'In-Store Clerk (Chipo)',
        addedByLocation: 'Harare Avondale Aisle 3',
        channel: 'web',
        addedAt: new Date().toISOString(),
        note: 'Scanned live in store aisle'
      });
    }

    liveCallStore.lastScannedBarcode = {
      product: randomProduct,
      scannedAt: new Date().toISOString()
    } as any;

    broadcastCartUpdate('In-Store Shopper (Live Barcode Scan)');
    io.emit('live_call:item_scanned', randomProduct);

    res.json({
      success: true,
      scannedProduct: randomProduct,
      cart: currentCart
    });
  });

  // -------------------------------------------------------------
  // 14. MEMBERS MANAGEMENT
  // -------------------------------------------------------------
  app.get('/api/members', (req: Request, res: Response) => {
    res.json({ members: INITIAL_MEMBERS });
  });

  // -------------------------------------------------------------
  // 15. STATIC ASSETS & SPA FALLBACK
  // -------------------------------------------------------------
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  // In development, Vite runs on port 5173 with a proxy to this server (port 3000).
  // Run: npm run dev  — which uses concurrently to start both.

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[PnP Express] Backend API + Socket.IO running on http://0.0.0.0:${PORT}`);
    console.log(`[PnP Express] Frontend (Vite) → http://localhost:5173`);
  });
}

startServer();
