import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from '../src/data/products.ts';
import { connectDB, User, ActivityLog, OrderModel, CDPWallet } from '../server/models.ts';
import { createCoinbaseCheckout, verifyWebhookSignature, refundCoinbaseCheckout } from '../server/coinbaseCheckout.ts';

// Shared In-Memory Demo Cart for Vercel Serverless Session
const DEMO_CART = [
  {
    id: 'cart-demo-1',
    productId: 'prod-1',
    product: SAMPLE_PRODUCTS[0],
    quantity: 2,
    addedByMemberId: 'mem-2',
    addedByMemberName: 'Gogo Moyo',
    addedByLocation: 'Harare, ZIM',
    channel: 'whatsapp',
    addedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    note: 'Added via WhatsApp Voice Note',
  },
  {
    id: 'cart-demo-2',
    productId: 'prod-3',
    product: SAMPLE_PRODUCTS[2],
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'cart-demo-3',
    productId: 'prod-8',
    product: SAMPLE_PRODUCTS[7],
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    note: 'For Gogo power outages',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract path from URL (e.g., /api/health -> /health)
    const rawUrl = req.url || '';
    const cleanUrl = rawUrl.split('?')[0];
    const pathname = cleanUrl.startsWith('/api') ? cleanUrl.replace(/^\/api/, '') : cleanUrl;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Safely parse JSON body if string
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

  // --- 1. HEALTH ---
  if (pathname === '/health' || pathname === '') {
    return res.status(200).json({
      status: 'ok',
      service: 'PnP Express Cross-Border Engine',
      platform: 'Vercel Serverless (Unified Router)',
      timestamp: new Date().toISOString(),
    });
  }

  // --- 2. PRODUCTS ---
  if (pathname === '/products') {
    return res.status(200).json({
      products: SAMPLE_PRODUCTS,
      exchangeRates: INITIAL_EXCHANGE_RATES,
    });
  }

  // --- 3. MEMBERS ---
  if (pathname === '/members') {
    return res.status(200).json({ members: INITIAL_MEMBERS });
  }

  // --- 4. EXCHANGE RATES ---
  if (pathname === '/exchange-rates') {
    return res.status(200).json(INITIAL_EXCHANGE_RATES);
  }

  // --- 5. CART ROUTES ---
  if (pathname === '/cart' && req.method === 'GET') {
    return res.status(200).json({ cart: DEMO_CART, members: INITIAL_MEMBERS });
  }

  if (pathname === '/cart/add' && req.method === 'POST') {
    const { productId, quantity = 1, memberName, memberId, memberLocation, channel, note } = req.body || {};
    const product = SAMPLE_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const newItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      product,
      quantity: Number(quantity),
      addedByMemberId: memberId || 'mem-1',
      addedByMemberName: memberName || 'Tinashe Moyo',
      addedByLocation: memberLocation || 'Johannesburg, SA',
      channel: channel || 'web',
      addedAt: new Date().toISOString(),
      note,
    };
    return res.status(200).json({ success: true, cart: [newItem, ...DEMO_CART] });
  }

  if (pathname === '/cart/update' && req.method === 'POST') {
    const { itemId, quantity } = req.body || {};
    if (Number(quantity) <= 0) {
      const filtered = DEMO_CART.filter((item) => item.id !== itemId);
      return res.status(200).json({ success: true, cart: filtered });
    }
    const updated = DEMO_CART.map((item) =>
      item.id === itemId ? { ...item, quantity: Number(quantity) } : item
    );
    return res.status(200).json({ success: true, cart: updated });
  }

  if (pathname === '/cart/clear' && req.method === 'POST') {
    return res.status(200).json({ success: true, cart: [] });
  }

  if (pathname === '/cart/split-calculator' && req.method === 'POST') {
    const { splitMethod = 'EQUAL', customRatios = {} } = req.body || {};
    const totalUSD = DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

    const memberTotals: { [memberId: string]: { subtotalUSD: number; count: number } } = {};
    INITIAL_MEMBERS.forEach((m) => {
      memberTotals[m.id] = { subtotalUSD: 0, count: 0 };
    });

    DEMO_CART.forEach((item) => {
      if (!memberTotals[item.addedByMemberId]) {
        memberTotals[item.addedByMemberId] = { subtotalUSD: 0, count: 0 };
      }
      memberTotals[item.addedByMemberId].subtotalUSD += item.product.priceUSD * item.quantity;
      memberTotals[item.addedByMemberId].count += item.quantity;
    });

    const memberShares = INITIAL_MEMBERS.map((m) => {
      let shareUSD = 0;
      const subtotalUSD = memberTotals[m.id]?.subtotalUSD || 0;

      if (splitMethod === 'EQUAL') {
        shareUSD = totalUSD / (INITIAL_MEMBERS.length || 1);
      } else if (splitMethod === 'BY_SUBMITTER') {
        shareUSD = subtotalUSD;
      } else if (splitMethod === 'CUSTOM') {
        const ratio = customRatios[m.id] || 1 / INITIAL_MEMBERS.length;
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
        percentage,
      };
    });

    return res.status(200).json({
      success: true,
      totalUSD: Number(totalUSD.toFixed(2)),
      totalZAR: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
      totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
      splitMethod,
      shares: memberShares,
    });
  }

  // --- 6. VOICE AI ---
  if (pathname === '/voice-ai' && req.method === 'POST') {
    const textPrompt = req.body?.textPrompt || 'Hupfu nemafuta';
    const promptLower = textPrompt.toLowerCase();

    let lang = 'Shona';
    let nativeReply = 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.';
    let matchedProduct = SAMPLE_PRODUCTS[1];

    if (promptLower.includes('rice') || promptLower.includes('mupunga') || promptLower.includes('tastic')) {
      matchedProduct = SAMPLE_PRODUCTS[0];
      nativeReply = 'Ndaisa mupunga weTastic mungoro yeMoyo Family.';
    } else if (promptLower.includes('sugar') || promptLower.includes('chigaku')) {
      matchedProduct = SAMPLE_PRODUCTS[4];
      nativeReply = 'Ndaisa chigaku mungoro yeMoyo Family.';
    } else if (promptLower.includes('mazoe')) {
      matchedProduct = SAMPLE_PRODUCTS[5];
      nativeReply = 'Ndaisa Mazoe Orange mungoro yeMoyo Family.';
    }

    if (promptLower.includes('ndebele') || promptLower.includes('upfu')) {
      lang = 'Ndebele';
      nativeReply = 'Ngizofaka impuphu lobisi enqoleni yomdeni.';
    }

    return res.status(200).json({
      success: true,
      result: {
        action: 'ADD',
        items: [{ productName: matchedProduct.name, qty: 1 }],
        spokenResponse: nativeReply,
        detectedLanguage: lang,
        confidence: 0.95,
        originalText: textPrompt,
      },
      cart: [
        {
          id: `cart-ai-${Date.now()}`,
          productId: matchedProduct.id,
          product: matchedProduct,
          quantity: 1,
          addedByMemberId: 'mem-2',
          addedByMemberName: 'Gogo Moyo',
          addedByLocation: 'Harare, ZIM',
          channel: 'whatsapp',
          addedAt: new Date().toISOString(),
          note: `Added via ${lang} Voice AI Assistant (Demo Mode)`,
        },
        ...DEMO_CART,
      ],
    });
  }

  // --- 7. WHATSAPP ---
  if (pathname === '/whatsapp/webhook' && req.method === 'POST') {
    const fromPhone = req.body?.From || req.body?.fromPhone || '+263772123456';
    const senderName = req.body?.senderName || 'Gogo Moyo';
    const bodyText = req.body?.Body || req.body?.text || 'Ndinoda hupfu hweSona ne mafuta';

    const totalUSD = DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const totalZWG = (totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2);

    const replyText = `🛒 *GreenCart Family Cart Updated!*\n\n*Current Shared Items:*\n• 2x ${SAMPLE_PRODUCTS[0].name}\n\n*Total:* $${totalUSD.toFixed(2)} USD (ZWG ${totalZWG})\n*Delivery:* Harare Express & Bulawayo Depot\n\nReply *1* to Checkout via EcoCash / Mukuru.\nReply *LIST* to view options.`;

    const waMsg = {
      id: `wa-${Date.now()}`,
      fromPhone,
      senderName,
      text: bodyText,
      isVoiceNote: req.body?.isVoiceNote || false,
      timestamp: new Date().toISOString(),
      status: 'processed',
      parsedIntent: {
        action: 'ADD',
        items: [{ productName: SAMPLE_PRODUCTS[1].name, qty: 1 }],
        spokenResponse: 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.',
        detectedLanguage: 'Shona',
      },
      replyText,
    };

    return res.status(200).json({
      success: true,
      waMessage: waMsg,
      cart: DEMO_CART,
      replyText,
    });
  }

  if (pathname === '/whatsapp/logs') {
    return res.status(200).json({
      logs: [
        {
          id: 'wa-msg-demo-1',
          fromPhone: '+263772123456',
          senderName: 'Gogo Moyo',
          text: 'Ndinoda mupunga weTastic ne mafuta',
          isVoiceNote: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          status: 'processed',
          replyText: '🛒 GreenCart Zim Summary:\nAdded: 2x Tastic Rice 5kg, 1x Cooking Oil 2L.',
        },
      ],
    });
  }

  // --- 8. SMART BASKET ---
  if (pathname === '/smart-basket/recommendations' && req.method === 'POST') {
    const recommended = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, 5);
    const totalEstimatedUSD = recommended.reduce((sum, p) => sum + p.priceUSD, 0);

    return res.status(200).json({
      success: true,
      recommendedProducts: recommended,
      totalEstimatedUSD: Number(totalEstimatedUSD.toFixed(2)),
      aiNote: 'Kudya kwemhuri kwasarudzwa zvinotsvukisa nenzira yehutsanana (Balanced family staples selected - Demo Mode).',
    });
  }

  // --- 9. DUAL-PATH COINBASE CHECKOUT & WEBHOOKS ---
  if ((pathname === '/checkout' || pathname === '/checkout/create' || pathname === '/checkout/orchestrate') && req.method === 'POST') {
    const { amount, currency = 'USD', orderId, customerEmail, country, card } = req.body || {};
    const totalAmount = amount ? parseFloat(amount) : DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const targetOrderId = orderId || `PNP-ZW-${Math.floor(100000 + Math.random() * 900000)}`;
    const targetCountry = country || (card?.billingCountry) || 'GB';

    const checkoutResult = await createCoinbaseCheckout({
      amount: totalAmount,
      currency,
      orderId: targetOrderId,
      customerEmail: customerEmail || 'shopper@pnpexpress.co.zw',
      country: targetCountry,
      card
    });

    const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
      ...checkoutResult,
      orderId: targetOrderId,
      invoiceNumber,
      voucherCode,
      totalUSD: Number(totalAmount.toFixed(2)),
      finalRail: 'COINBASE_USDC',
      settlementAccount: 'Merchant Wallet Base (USDC)',
      attempts: [
        { rail: 'COINBASE_USDC', latencyMs: 120, status: 'SUCCESS' }
      ]
    });
  }

  if ((pathname === '/webhooks/coinbase' || pathname === '/webhooks/onramp' || pathname === '/api/webhooks/onramp') && req.method === 'POST') {
    const rawPayload = JSON.stringify(req.body || {});
    const signatureHeader = (req.headers['x-hook0-signature'] as string) || (req.headers['x-cc-webhook-signature'] as string) || (req.headers['x-cb-signature'] as string);
    const secret = process.env.COINBASE_WEBHOOK_SECRET || 'sec_wh_cdp_pnpexpress_2026';

    const isValid = verifyWebhookSignature(rawPayload, signatureHeader, secret, req.headers as any);
    const event = req.body || {};
    const eventType = event.eventType || event.type || event.event?.type;
    const status = event.status || event.data?.status;
    const metadata = event.data?.metadata || event.event?.data?.metadata || {};
    const orderId = event.partnerUserRef || metadata.orderId || event.data?.id;

    if (
      (eventType === 'onramp.transaction.success' && status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') ||
      eventType === 'checkout.payment.success' ||
      eventType === 'charge:confirmed'
    ) {
      if (orderId) {
        await OrderModel.updateOne({ orderId }, { $set: { status: 'PROCESSING', statusLabel: 'Paid via Coinbase USDC' } }).catch(() => {});
      }
    }

    return res.status(200).send('OK');
  }

  if ((pathname === '/checkout/refund' || pathname.includes('/refund')) && req.method === 'POST') {
    const checkoutId = req.body?.checkoutId || req.body?.orderId || 'chk_demo';
    const reason = req.body?.reason || 'Order cancelled';
    const result = await refundCoinbaseCheckout(checkoutId, reason);
    return res.status(200).json(result);
  }

  // --- 10. AI RECIPE SUGGEST ---
  if (pathname === '/ai/recipe-suggest' && req.method === 'POST') {
    return res.status(200).json({
      success: true,
      recipeName: 'Traditional Sadza & Beef Stew',
      description: 'Authentic Zimbabwean staple featuring cooked white maize meal, braised beef blade, and fresh leafy vegetables.',
      matchedProducts: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[10], SAMPLE_PRODUCTS[2]],
      missingIngredients: ['Onions', 'Tomatoes'],
    });
  }

  // --- 11. AUTH ENDPOINTS ---
  // Connect to MongoDB Atlas
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('[Vercel Serverless DB Connect Error]:', dbErr);
  }

  // --- 11. AUTH & SESSIONS ENDPOINTS (MongoDB Atlas) ---
  if (pathname === '/auth/signup' && req.method === 'POST') {
    try {
      const { email, name, password } = req.body || {};
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      let existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const demoAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newUser = await User.create({
        email,
        name,
        password: password || 'demo_pass_123',
        role: 'Sponsor / Diaspora',
        walletAddress: demoAddress,
        cdpProjectId: process.env.VITE_CDP_PROJECT_ID
      });

      await ActivityLog.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        action: 'SIGNUP_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID, walletAddress: demoAddress }
      });

      await CDPWallet.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        address: demoAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID
      });

      return res.status(201).json({
        success: true,
        user: newUser,
        token: `jwt_token_${newUser._id}`,
        cdpWallet: {
          address: demoAddress,
          projectId: process.env.VITE_CDP_PROJECT_ID
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (pathname === '/auth/login' && req.method === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      let user = await User.findOne({ email });
      if (!user) {
        const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
        user = await User.create({
          email,
          name: email.split('@')[0].replace('.', ' '),
          role: 'Sponsor / Diaspora',
          walletAddress: demoAddress,
          cdpProjectId: process.env.VITE_CDP_PROJECT_ID
        });
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }

      await ActivityLog.create({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'LOGIN_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID }
      });

      return res.status(200).json({
        success: true,
        user,
        token: `jwt_token_${user._id}`,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (pathname === '/auth/me') {
    try {
      const user = await User.findOne().sort({ lastLoginAt: -1 });
      if (!user) return res.status(200).json({ authenticated: false });
      return res.status(200).json({ authenticated: true, user });
    } catch (err) {
      return res.status(200).json({ authenticated: false });
    }
  }

  if (pathname === '/auth/sessions') {
    try {
      const sessions = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
      return res.status(200).json({ success: true, sessions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (pathname === '/auth/logout' && req.method === 'POST') {
    return res.status(200).json({ success: true });
  }

  // --- 12. PAYMENTS ENDPOINTS ---
  if (pathname === '/payments/balance') {
    const address = (req.query?.address as string) || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
    return res.status(200).json({
      success: true,
      address,
      balances: { eth: '1.5000', usdc: '500.00' },
      cdpActive: false,
    });
  }

  if (pathname === '/payments/faucet' && req.method === 'POST') {
    const fallbackHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return res.status(200).json({
      success: true,
      message: 'Faucet funding requested successfully (Demo Mode)',
      txHash: fallbackHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${fallbackHash}`,
      cdpActive: false,
    });
  }

  if (pathname === '/payments/usdc' && req.method === 'POST') {
    const { amountUSD = 10 } = req.body || {};
    const fallbackHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return res.status(200).json({
      success: true,
      txHash: fallbackHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${fallbackHash}`,
      amountUSD: Number(amountUSD),
      cdpActive: false,
    });
  }

  // Fallback 404 for unhandled API routes
  return res.status(404).json({ error: `API route not found: ${pathname}` });
  } catch (err: any) {
    console.error('[Vercel API Handler Exception]:', err);
    return res.status(500).json({
      error: err.message || 'Internal Server Error',
      success: false
    });
  }
}
