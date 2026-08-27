import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
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
    '🟢 Connected live to PnP Socket.io & WhatsApp Engine'
  );

  useEffect(() => {
    // Hide initial toast after 5s
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial cart from backend REST API
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data) {
          if (data.cart) setCart(data.cart);
          if (data.members) setMembers(data.members);
        }
      } catch (err) {
        // Quiet fallback to default local state
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Socket.io Real-Time Synchronization
  useEffect(() => {
    socket.on('connect_error', () => {
      // Silently handle socket connection error
    });

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

    return () => {
      socket.off('cart:init');
      socket.off('cart:update');
      socket.off('whatsapp:message_received');
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Cart operations
  const handleAddToCart = async (productId: string, memberId: string, note?: string, quantity: number = 1) => {
    const member = members.find((m) => m.id === memberId) || members[0];

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: quantity || 1,
          memberId: member.id,
          memberName: member.name,
          memberLocation: member.location,
          channel: member.channel,
          note
        })
      });
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
        triggerToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}item for ${member.name}`);
      }
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity })
      });
      const data = await res.json();
      if (data.cart) setCart(data.cart);
    } catch (err) {
      console.error('Update quantity error:', err);
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch('/api/cart/clear', { method: 'POST' });
      const data = await res.json();
      if (data.cart) setCart(data.cart);
      triggerToast('Cart cleared');
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans flex flex-col justify-between selection:bg-[#FFB81C] selection:text-[#002D62]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 bg-[#002D62] text-[#FFB81C] px-4 py-3 rounded-2xl shadow-2xl border border-[#004A99]/50 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <Bell className="w-4 h-4 text-[#D0021B] flex-shrink-0 animate-bounce" />
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
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Home className="w-4 h-4 text-[#FFB81C]" />
              <span>Home Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Compass className="w-4 h-4 text-[#0082C8]" />
              <span>Discover</span>
            </button>

            <button
              onClick={() => setActiveTab('myshop')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'myshop'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>My Shop</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <User className="w-4 h-4 text-purple-600" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 relative whitespace-nowrap cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-[#D0021B]" />
              <span>Family Cart ({totalCartCount})</span>
              {totalCartCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#D0021B] animate-ping" />
              )}
            </button>
          </div>

          <button
            onClick={() => setShowDocs(true)}
            className="text-xs font-bold text-[#002D62] hover:underline flex items-center gap-1 whitespace-nowrap pl-2 cursor-pointer"
          >
            <span className="hidden sm:inline">Monorepo Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0082C8]" />
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
      <footer className="bg-[#001D42] text-blue-200/90 border-t border-[#002D62] py-6 px-4 text-xs mt-10 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-black text-sm">
              <span>PnP (TM Pick n Pay)</span>
              <span className="bg-[#D0021B] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Express</span>
              <span className="text-[#FFB81C] font-sans text-xs">• Cross-Border Grocery</span>
            </div>
            <p className="text-[11px] text-stone-300/80">
              TM Pick n Pay cross-border collaborative grocery shopping engine for South Africa (SA) and Zimbabwe (ZIM). Powered by Socket.io, Gemini Voice & WhatsApp API.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-[#FFB81C]">
            <button onClick={() => setShowDocs(true)} className="hover:underline cursor-pointer">
              Monorepo Guide
            </button>
            <span>•</span>
            <button onClick={() => setShowVoiceAI(true)} className="hover:underline cursor-pointer">
              Voice AI Assistant
            </button>
            <span>•</span>
            <button onClick={() => setShowWhatsAppSim(true)} className="hover:underline cursor-pointer">
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
