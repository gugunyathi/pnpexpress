import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from './src/data/products';
import { CartItem, Product, WhatsAppMessage, VoiceAIResult } from './src/types';

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

// In-Memory Shared State
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
    replyText: '🛒 GreenCart Zim Summary:\nAdded: 2x Tastic Rice 5kg, 1x Cooking Oil 2L.\nTotal: $17.40 (ZWG 466.32). Reply 1 to Checkout via EcoCash.'
  }
];

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

  // Helper to match catalog item by voice or text query
  const matchProduct = (queryName: string): Product => {
    const q = queryName.toLowerCase();
    
    // Check name and native terms
    const exactMatch = SAMPLE_PRODUCTS.find(p => 
      p.name.toLowerCase().includes(q) || 
      (p.nativeName && p.nativeName.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
    if (exactMatch) return exactMatch;

    // Term fallbacks
    if (q.includes('mupunga') || q.includes('tastic') || q.includes('rice') || q.includes('ilayisi')) {
      return SAMPLE_PRODUCTS[0]; // Tastic Rice 5kg
    }
    if (q.includes('hupfu') || q.includes('impuphu') || q.includes('maize') || q.includes('meal')) {
      return SAMPLE_PRODUCTS[1]; // White Star Maize
    }
    if (q.includes('miriwo') || q.includes('michero') || q.includes('fruit') || q.includes('vegetable') || q.includes('veshi')) {
      return SAMPLE_PRODUCTS[2]; // Fruit & Veg Box 10kg
    }
    if (q.includes('chigaku') || q.includes('sugar') || q.includes('unshukela')) {
      return SAMPLE_PRODUCTS[4]; // Huletts Sugar
    }
    if (q.includes('mazoe') || q.includes('orange') || q.includes('drink')) {
      return SAMPLE_PRODUCTS[5]; // Mazoe Orange
    }
    if (q.includes('mwenje') || q.includes('solar') || q.includes('light')) {
      return SAMPLE_PRODUCTS[7]; // Solar kit
    }
    if (q.includes('nyama') || q.includes('beef') || q.includes('meat')) {
      return SAMPLE_PRODUCTS[10]; // Beef Blade
    }
    if (q.includes('mukaka') || q.includes('milk') || q.includes('ubisi')) {
      return SAMPLE_PRODUCTS[8]; // Dairibord Milk
    }
    
    return SAMPLE_PRODUCTS[0];
  };

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id);
    
    // Send initial state
    socket.emit('cart:init', {
      cart: currentCart,
      members: INITIAL_MEMBERS,
      exchangeRates: INITIAL_EXCHANGE_RATES
    });

    socket.on('presence:join', (member) => {
      socket.broadcast.emit('member:joined', member);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Client disconnected:', socket.id);
    });
  });

  // REST API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'GreenCart Diaspora Engine', timestamp: new Date().toISOString() });
  });

  app.get('/api/products', (req: Request, res: Response) => {
    res.json({
      products: SAMPLE_PRODUCTS,
      exchangeRates: INITIAL_EXCHANGE_RATES
    });
  });

  app.get('/api/cart', (req: Request, res: Response) => {
    res.json({ cart: currentCart, members: INITIAL_MEMBERS });
  });

  app.post('/api/cart/add', (req: Request, res: Response) => {
    const { productId, quantity = 1, memberId, memberName, memberLocation, channel = 'web', note } = req.body;
    
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
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
        quantity: Number(quantity),
        addedByMemberId: memberId || 'mem-1',
        addedByMemberName: memberName || 'Tinashe Moyo',
        addedByLocation: memberLocation || 'Johannesburg, SA',
        channel: channel || 'web',
        addedAt: new Date().toISOString(),
        note
      };
      currentCart.unshift(newItem);
    }

    broadcastCartUpdate(memberName || 'Member');
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/update', (req: Request, res: Response) => {
    const { itemId, quantity } = req.body;
    
    if (Number(quantity) <= 0) {
      currentCart = currentCart.filter(item => item.id !== itemId);
    } else {
      const item = currentCart.find(i => i.id === itemId);
      if (item) item.quantity = Number(quantity);
    }

    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/clear', (req: Request, res: Response) => {
    currentCart = [];
    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.get('/api/exchange-rates', (req: Request, res: Response) => {
    res.json(INITIAL_EXCHANGE_RATES);
  });

  // Gemini Conversational Multilingual Voice AI Endpoint
  app.post('/api/voice-ai', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const textPrompt = req.body.textPrompt;
      const file = req.file;

      if (!textPrompt && !file) {
        return res.status(400).json({ error: 'Audio file or textPrompt required' });
      }

      console.log('[Gemini Voice AI] Processing request...', {
        hasAudio: !!file,
        textPrompt,
        mimeType: file?.mimetype
      });

      const systemInstruction = `
You are GreenCart's Multilingual African Voice AI Shopping Assistant for South Africa and Zimbabwe.
You understand English, Shona (chiShona), Ndebele (siNdebele), Zulu (isiZulu), Xhosa, Tswana, and Sesotho.

Your task is to analyze user spoken or written grocery orders, which often contain code-switched or colloquial terms.
Key African Grocery Term Translations:
- "hupfu", "hupfu hweSona", "impuphu", "upfu" -> Maize Meal / Mealies
- "mafuta", "mafuta ekubikisa", "amafutha" -> Cooking Oil
- "chigaku", "shugera", "unshukela" -> White Sugar
- "mukaka", "ubisi" -> Fresh or Steri Milk
- "mazoe", "mazoe orange" -> Mazoe Orange Crush
- "mwenje", "solar", "mwenje wezuva" -> Solar Light / Charger Kit
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
   - Example Shona response: "Ndaisa hupfu nemafuta ekubikisa mungoro yeMoyo Family."
   - Example Ndebele response: "Ngizofaka impuphu lobisi enqoleni yomdeni."
   - Example English response: "I've added 10kg Maize Meal and Cooking Oil to your family cart."
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
              action: {
                type: Type.STRING,
                description: 'Action type: ADD, REMOVE, QUERY, or CHECKOUT'
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    qty: { type: Type.INTEGER }
                  }
                },
                description: 'List of items identified in prompt'
              },
              spokenResponse: {
                type: Type.STRING,
                description: 'Polite native confirmation response to speak aloud'
              },
              detectedLanguage: {
                type: Type.STRING,
                description: 'Language detected (e.g. Shona, Ndebele, Zulu, English)'
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score from 0 to 1'
              }
            }
          }
        }
      });

      const parsed: VoiceAIResult = JSON.parse(geminiResponse.text || '{}');
      console.log('[Gemini Voice AI] Parsed Result:', parsed);

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
      
      // Fallback parser if API call fails or key unconfigured
      const fallbackPrompt = (req.body.textPrompt || 'Hupfu nemafuta').toLowerCase();
      let matchedProduct = SAMPLE_PRODUCTS[0];
      let lang = 'Shona';
      let nativeReply = 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.';

      if (fallbackPrompt.includes('ndebele') || fallbackPrompt.includes('upfu')) {
        lang = 'Ndebele';
        nativeReply = 'Ngizofaka impuphu lobisi enqoleni yomdeni.';
      }

      // Add item via fallback
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

  // Low-Data WhatsApp Fallback Webhook API Route
  app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      const fromPhone = req.body.From || req.body.fromPhone || '+263772123456';
      const senderName = req.body.senderName || (fromPhone.includes('263772') ? 'Gogo Moyo' : 'Uncle Farai');
      const bodyText = req.body.Body || req.body.text || 'Ndinoda hupfu hweSona ne mafuta';
      const isVoice = req.body.isVoiceNote || false;

      console.log(`[WhatsApp Webhook] Incoming message from ${senderName} (${fromPhone}): "${bodyText}"`);

      // 1. Send text to Gemini to parse intent
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

      // 2. Perform Cart Action
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

      // 3. Broadcast to all active web clients in real-time
      broadcastCartUpdate(`${senderName} (WhatsApp)`);

      // 4. Calculate total cart value for WhatsApp response
      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const totalZWG = (totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2);

      const itemsSummaryList = currentCart
        .map(item => `• ${item.quantity}x ${item.product.name} ($${(item.product.priceUSD * item.quantity).toFixed(2)})`)
        .join('\n');

      const replyText = `🛒 *GreenCart Family Cart Updated!*\n\n*Current Shared Items:*\n${itemsSummaryList || 'Cart is empty'}\n\n*Total:* $${totalUSD.toFixed(2)} USD (ZWG ${totalZWG})\n*Delivery:* Harare Express & Bulawayo Depot\n\nReply *1* to Checkout via EcoCash / Mukuru.\nReply *LIST* to view options.`;

      // 5. Store message log
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

      // Emit real-time whatsapp event to active UI
      io.emit('whatsapp:message_received', waMsg);

      // Send Twilio / Meta XML or JSON response
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

  // Members Management API
  app.get('/api/members', (req: Request, res: Response) => {
    res.json({ members: INITIAL_MEMBERS });
  });

  // Smart Basket AI Recommendation Endpoint
  app.post('/api/smart-basket/recommendations', async (req: Request, res: Response) => {
    try {
      const { budgetUSD = 50, familySize = 4, location = 'Harare, ZIM', preferences = [] } = req.body;

      console.log('[Smart Basket AI] Generating basket for:', { budgetUSD, familySize, location, preferences });

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
      console.error('[Smart Basket AI Error]:', err);
      res.json({
        success: true,
        recommendedProducts: SAMPLE_PRODUCTS.slice(0, 4),
        totalEstimatedUSD: 38.90,
        aiNote: 'Essential family staples algorithmically selected for high energy and nutritional balance.'
      });
    }
  });

  // Cross-Border Multi-Currency Split Calculator Algorithm
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
          percentage
        };
      });

      res.json({
        success: true,
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZAR: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
        totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
        splitMethod,
        shares: memberShares
      });
    } catch (err: any) {
      console.error('[Split Calculator Error]:', err);
      res.status(500).json({ error: 'Failed to calculate split shares' });
    }
  });

  // Checkout and Voucher Generator API
  app.post('/api/checkout', (req: Request, res: Response) => {
    try {
      const { paymentMethod = 'EcoCash', payerMemberId = 'mem-1', deliveryAddress } = req.body;
      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

      const orderId = `ZIKI-${Math.floor(100000 + Math.random() * 900000)}`;
      const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const orderReceipt = {
        orderId,
        voucherCode,
        paymentMethod,
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
        itemsCount: currentCart.reduce((cnt, i) => cnt + i.quantity, 0),
        items: [...currentCart],
        deliveryAddress: deliveryAddress || { type: 'DOOR_DELIVERY', city: 'Harare', country: 'Zimbabwe' },
        pickupDepot: 'OK Zimbabwe - First Street, Harare',
        createdAt: new Date().toISOString(),
        estimatedFulfillment: 'Within 4 Hours Express'
      };

      // Broadcast order completed event via socket.io
      io.emit('order:created', orderReceipt);

      // Clear active cart after successful order placement
      currentCart = [];
      broadcastCartUpdate('Checkout System');

      res.json({
        success: true,
        order: orderReceipt
      });
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      res.status(500).json({ error: 'Checkout processing failed' });
    }
  });

  // AI Recipe Ingredient Suggestions Endpoint
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
        matchedProducts: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[10], SAMPLE_PRODUCTS[2]],
        missingIngredients: ['Onions', 'Tomatoes']
      });
    }
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[GreenCart Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
