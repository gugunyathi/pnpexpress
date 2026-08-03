import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { MultiStoreCatalog } from './components/MultiStoreCatalog';
import { FamilyCart } from './components/FamilyCart';
import { VoiceAIAssistant } from './components/VoiceAIAssistant';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { MonorepoDocsModal } from './components/MonorepoDocsModal';
import { FloatingBottomNav, NavTab } from './components/FloatingBottomNav';
import { HeroCarousel } from './components/HeroCarousel';
import { SmartBasketModal } from './components/SmartBasketModal';
import { DiscoverView } from './components/DiscoverView';
import { MyShopView } from './components/MyShopView';
import { ProfileView } from './components/ProfileView';
import { LiveCallShoppingView } from './components/LiveCallShoppingView';
import { 
  CartItem, 
  Member, 
  Currency, 
  Product, 
  ExchangeRates, 
  WhatsAppMessage 
} from './types';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from './data/products';
import { 
  Users, 
  Smartphone, 
  Mic, 
  Sparkles, 
  Zap, 
  ShoppingCart, 
  ShieldCheck, 
  Globe, 
  Check, 
  Bell,
  ArrowRight,
  Compass,
  Store,
  User,
  Home
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(INITIAL_EXCHANGE_RATES);
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isLiveCallOngoing, setIsLiveCallOngoing] = useState<boolean>(false);

  // Modals / Drawers
  const [showVoiceAI, setShowVoiceAI] = useState<boolean>(false);
  const [showWhatsAppSim, setShowWhatsAppSim] = useState<boolean>(false);
  const [showSmartBasket, setShowSmartBasket] = useState<boolean>(false);
  const [isBasketTilting, setIsBasketTilting] = useState<boolean>(false);
  const [showDocs, setShowDocs] = useState<boolean>(false);

  const triggerBasketTilt = () => {
    setIsBasketTilting(true);
    setTimeout(() => setIsBasketTilting(false), 700);
  };

  // Real-Time Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(
    '🟢 Connected live to TENGA Socket.io & WhatsApp Engine'
  );

  useEffect(() => {
    // Hide initial toast after 5s
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial cart from backend REST API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) throw new Error(`API unavailable (${res.status})`);
        const data = await res.json();
        if (data.cart) setCart(data.cart);
        if (data.members) setMembers(data.members);
      } catch (err) {
        console.warn('Backend unavailable — using local placeholder data:', err);
        // Keep SAMPLE_PRODUCTS and INITIAL_MEMBERS already set as default state
      }
    };
    fetchInitialData();
  }, []);

  // Socket.io Real-Time Synchronization
  useEffect(() => {
    let socket: Socket;
    try {
      socket = io();

      socket.on('cart:init', (data) => {
        if (data.cart) setCart(data.cart);
        if (data.members) setMembers(data.members);
        if (data.exchangeRates) setExchangeRates(data.exchangeRates);
      });

      socket.on('cart:update', (data) => {
        if (data.cart) setCart(data.cart);
        if (data.initiator) {
          triggerToast(`⚡ Cart updated in real-time by ${data.initiator}`);
        }
      });

      socket.on('whatsapp:message_received', (waMsg: WhatsAppMessage) => {
        triggerToast(`💬 WhatsApp message received from ${waMsg.senderName}`);
      });
    } catch (e) {
      console.warn('Socket.io client connection error:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Cart operations — with local fallback when backend is unavailable
  const handleAddToCart = async (productId: string, memberId: string, note?: string) => {
    const member = members.find((m) => m.id === memberId) || members[0];
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: 1,
          memberId: member.id,
          memberName: member.name,
          memberLocation: member.location,
          channel: member.channel,
          note
        })
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
        triggerToast(`Added ${product.name} for ${member.name}`);
        return;
      }
    } catch (err) {
      console.warn('Add to cart — backend unavailable, using local state:', err);
    }
    // Local fallback: add directly to in-memory cart
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === productId && i.addedByMemberId === member.id
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        {
          id: `cart-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          product,
          quantity: 1,
          addedByMemberId: member.id,
          addedByMemberName: member.name,
          addedByLocation: member.location,
          channel: member.channel || 'web',
          addedAt: new Date().toISOString(),
          note,
        },
        ...prev,
      ];
    });
    triggerToast(`Added ${product.name} for ${member.name}`);
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity })
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.cart) { setCart(data.cart); return; }
    } catch (err) {
      console.warn('Update quantity — backend unavailable, using local state:', err);
    }
    // Local fallback
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== itemId)
        : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch('/api/cart/clear', { method: 'POST' });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.cart !== undefined) { setCart(data.cart); triggerToast('Cart cleared'); return; }
    } catch (err) {
      console.warn('Clear cart — backend unavailable, using local state:', err);
    }
    // Local fallback
    setCart([]);
    triggerToast('Cart cleared');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-stone-900 font-sans flex flex-col justify-between selection:bg-[#ffb81c] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 bg-[#1a115e] text-[#ffb81c] px-4 py-3 rounded-2xl shadow-2xl border border-[#298bf5]/30 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <Bell className="w-4 h-4 text-[#ff4f38] flex-shrink-0 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cart={cart}
        members={members}
        currency={currency}
        onCurrencyChange={setCurrency}
        lowDataMode={lowDataMode}
        onToggleLowData={() => setLowDataMode(!lowDataMode)}
        onOpenVoiceAI={() => setShowVoiceAI(true)}
        onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
        onOpenDocs={() => setShowDocs(true)}
        onOpenCart={() => setActiveTab('cart')}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 pb-28 sm:pb-32 flex-1 w-full space-y-3 sm:space-y-6">
        {/* Feature Hero Bar Carousel - Shown on Home Tab */}
        {activeTab === 'home' && (
          <HeroCarousel
            onOpenVoiceAI={() => setShowVoiceAI(true)}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
            onSelectTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {/* View Toggle Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'home'
                  ? 'bg-[#1a115e] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Home className="w-4 h-4 text-[#ffb81c]" />
              <span>Home Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'discover'
                  ? 'bg-[#1a115e] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Compass className="w-4 h-4 text-[#298bf5]" />
              <span>Discover</span>
            </button>

            <button
              onClick={() => setActiveTab('myshop')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'myshop'
                  ? 'bg-[#1a115e] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>My Shop</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-[#1a115e] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <User className="w-4 h-4 text-purple-600" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 relative whitespace-nowrap ${
                activeTab === 'cart'
                  ? 'bg-[#1a115e] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-[#ff4f38]" />
              <span>Family Cart ({totalCartCount})</span>
              {totalCartCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#ff4f38] animate-ping" />
              )}
            </button>
          </div>

          <button
            onClick={() => setShowDocs(true)}
            className="text-xs font-bold text-[#1a115e] hover:underline flex items-center gap-1 whitespace-nowrap pl-2"
          >
            <span className="hidden sm:inline">Monorepo Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#298bf5]" />
          </button>
        </div>

        {/* Dynamic Main Views */}
        {activeTab === 'home' && (
          <MultiStoreCatalog
            products={products}
            members={members}
            currency={currency}
            lowDataMode={lowDataMode}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            products={products}
            members={members}
            currency={currency}
            onAddToCart={(prod, mId, qty) => {
              handleAddToCart(prod.id, mId);
              triggerToast(`Added ${prod.name} to Family Cart`);
            }}
            onOpenVoiceAI={() => setShowVoiceAI(true)}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
          />
        )}

        {activeTab === 'myshop' && (
          <MyShopView
            members={members}
            products={products}
            currency={currency}
            onAddToCart={handleAddToCart}
            onSelectStoreFilter={() => setActiveTab('home')}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currency={currency}
            onCurrencyChange={setCurrency}
            lowDataMode={lowDataMode}
            onToggleLowData={() => setLowDataMode(!lowDataMode)}
          />
        )}

        {activeTab === 'cart' && (
          <FamilyCart
            cart={cart}
            members={members}
            currency={currency}
            exchangeRates={exchangeRates}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={handleClearCart}
            onClose={() => setActiveTab('home')}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
            onAddToCart={(productId, memberId, note) => handleAddToCart(productId, memberId, note)}
            onStartLiveCall={() => {
              setIsLiveCallOngoing(true);
              setActiveTab('livecall');
            }}
            isLiveCallOngoing={isLiveCallOngoing}
            onEndLiveCall={() => setIsLiveCallOngoing(false)}
          />
        )}
      </main>

      {/* Render Clean Dedicated Full-Page Live Video Call Shopping View */}
      {activeTab === 'livecall' && (
        <div className="fixed inset-0 z-[999999] bg-[#071320] overflow-y-auto">
          <LiveCallShoppingView
            cart={cart}
            members={members}
            currency={currency}
            exchangeRates={exchangeRates}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={handleClearCart}
            onAddToCart={(productId, memberId, note) => handleAddToCart(productId, memberId, note)}
            onLeaveCall={() => {
              // Initiating/current user leaves call while others carry on
              setActiveTab('cart');
            }}
            onEndCall={() => {
              // Terminates call for all family members
              setIsLiveCallOngoing(false);
              setActiveTab('cart');
            }}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#100a3d] text-blue-200/90 border-t border-[#1a115e] py-6 px-4 text-xs mt-10 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-black text-sm">
              <span>TENGA</span>
              <span className="bg-[#ff4f38] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">asap!</span>
              <span className="text-[#ffb81c] font-sans text-xs">• MERN Workspaces</span>
            </div>
            <p className="text-[11px] text-stone-300/80">
              Cross-border collaborative grocery shopping engine for South Africa (SA) and Zimbabwe (ZIM). Powered by Socket.io, Gemini Voice & WhatsApp API.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-[#ffb81c]">
            <button onClick={() => setShowDocs(true)} className="hover:underline">
              Monorepo Guide
            </button>
            <span>•</span>
            <button onClick={() => setShowVoiceAI(true)} className="hover:underline">
              Voice AI Assistant
            </button>
            <span>•</span>
            <button onClick={() => setShowWhatsAppSim(true)} className="hover:underline">
              WhatsApp Fallback
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Navigation Bar & TikTok Vertical Action Stack */}
      <FloatingBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={totalCartCount}
        onOpenVoiceAI={() => setShowVoiceAI(true)}
        onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
        onOpenSmartBasket={() => setShowSmartBasket(true)}
        isBasketTilting={isBasketTilting}
      />

      {/* Modals */}
      <SmartBasketModal
        isOpen={showSmartBasket}
        onClose={() => setShowSmartBasket(false)}
        onAddToCart={handleAddToCart}
        onItemDroppedInBasket={triggerBasketTilt}
        currency={currency}
        members={members}
        selectedMemberId={members[0]?.id || 'mem-1'}
        onOpenCart={() => setActiveTab('cart')}
      />

      {showVoiceAI && (
        <VoiceAIAssistant
          onClose={() => setShowVoiceAI(false)}
          onVoiceSuccess={() => {
            setActiveTab('cart');
          }}
        />
      )}

      {showWhatsAppSim && (
        <WhatsAppSimulator
          onClose={() => setShowWhatsAppSim(false)}
          onWhatsAppSuccess={() => {
            setActiveTab('cart');
          }}
        />
      )}

      {showDocs && <MonorepoDocsModal onClose={() => setShowDocs(false)} />}
    </div>
  );
}
