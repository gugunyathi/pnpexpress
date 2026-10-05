import React, { useState } from 'react';
import { 
  Home, 
  Compass, 
  Store, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Mic,
  MessageCircle,
  Smartphone,
  ShoppingBag
} from 'lucide-react';

export type NavTab = 'home' | 'discover' | 'myshop' | 'profile' | 'cart' | 'livecall';

interface FloatingBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount: number;
  onOpenVoiceAI?: () => void;
  onOpenWhatsAppSim?: () => void;
  onOpenSmartBasket?: () => void;
  isBasketTilting?: boolean;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  onOpenVoiceAI,
  onOpenWhatsAppSim,
  onOpenSmartBasket,
  isBasketTilting,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hide bottom nav and vertical menu buttons completely during Live Video Call for a clean page
  if (activeTab === 'livecall') {
    return null;
  }

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'discover', label: 'Discover', icon: <Compass className="w-5 h-5" /> },
    { id: 'myshop', label: 'My Shop', icon: <Store className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart className="w-5 h-5" />, badge: cartCount },
  ];

  return (
    <>
      {/* TikTok-Style Vertical Floating Action Icons (Bottom Right Stack) */}
      <div 
        className={`fixed right-3 sm:right-5 z-[999999] flex flex-col items-end gap-2.5 transition-all duration-300 pointer-events-auto ${
          isCollapsed ? 'bottom-20 sm:bottom-20' : 'bottom-[5.5rem] sm:bottom-[5.75rem]'
        }`}
      >
        {/* 0. Real Live WhatsApp Action Button (Top of Stack, Above Smart Basket) */}
        <a
          href="https://wa.me/27630718449"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-full shadow-2xl border-2 border-emerald-200 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
          title="Live WhatsApp Order (+27 63 071 8449)"
          aria-label="Live WhatsApp Chat"
        >
          {/* Online Status Dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 rounded-full border-2 border-stone-900 animate-ping opacity-80" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />

          {/* WhatsApp Brand SVG Icon */}
          <svg className="w-5 h-5 fill-current text-white group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-0.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.375-.883-.71-1.48-1.588-1.653-1.886-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.422s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>

          {/* Floating Tooltip Pill */}
          <span className="absolute right-14 bg-[#111b21]/95 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-emerald-500/40">
            Live WhatsApp (+27 63 071 8449)
          </span>
        </a>

        {/* 1. Smart Basket Action Button (Top of Stack, Above WhatsApp) */}
        {onOpenSmartBasket && (
          <button
            onClick={onOpenSmartBasket}
            className={`group relative bg-gradient-to-tr from-[#0284c7] via-[#0d9488] to-[#14b8a6] hover:from-[#0369a1] hover:to-[#0f766e] text-white p-3 rounded-full shadow-2xl border-2 border-cyan-300 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110 ${
              isBasketTilting ? 'animate-wobble ring-4 ring-cyan-400/60' : ''
            }`}
            title="Smart Basket (Swipable Staples)"
            aria-label="Smart Basket"
          >
            {/* Glowing ring animation */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-300 rounded-full border-2 border-stone-900 animate-ping opacity-75" />
            <ShoppingBag className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#0a232e]/95 text-cyan-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-cyan-500/40">
              Smart Basket
            </span>
          </button>
        )}

        {/* 2. WhatsApp Action Button (Middle of Stack) */}
        {onOpenWhatsAppSim && (
          <button
            onClick={onOpenWhatsAppSim}
            className="group relative bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-2xl border-2 border-emerald-300/80 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
            title="WhatsApp Voice & Order Fallback"
            aria-label="WhatsApp Order"
          >
            {/* Online Status Dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            <Smartphone className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-stone-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-stone-700">
              WhatsApp Order
            </span>
          </button>
        )}

        {/* 3. Voice AI Assistant Button (Bottom of Stack) */}
        {onOpenVoiceAI && (
          <button
            onClick={onOpenVoiceAI}
            className="group relative bg-gradient-to-tr from-[#1a115e] via-[#241a7d] to-[#298bf5] hover:from-[#241a7d] hover:to-[#60a5fa] text-[#ffb81c] p-3 rounded-full shadow-2xl border-2 border-[#ffb81c] flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
            title="Voice AI Assistant (Shona/Ndebele/English)"
            aria-label="Voice AI Assistant"
          >
            {/* Glowing ring animation */}
            <span className="absolute inset-0 rounded-full border border-[#ffb81c]/50 animate-ping opacity-40" />
            <Sparkles className="w-5 h-5 text-[#ffb81c] group-hover:scale-110 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#1a115e]/95 text-[#ffb81c] text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-[#2a1d82]">
              Voice AI Assistant
            </span>
          </button>
        )}
      </div>

      {/* Floating Bottom Navigation Bar (Fixed to Viewport Bottom Screen) */}
      {isCollapsed ? (
        /* Collapsed Pill Button at Bottom Right Screen */
        <div className="fixed bottom-3 right-3 sm:right-5 z-[999999] pointer-events-auto">
          <button
            onClick={() => setIsCollapsed(false)}
            className="relative bg-[#C51D4A] hover:bg-[#a8143a] text-white px-3.5 py-2.5 rounded-full shadow-2xl border-2 border-[#FFB81C] flex items-center justify-center gap-2 transition-all transform active:scale-95 hover:scale-105"
            title="Expand Navigation Menu"
            aria-label="Expand Navigation Menu"
          >
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#002D62] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                {cartCount}
              </span>
            )}
            <Sparkles className="w-4 h-4 text-[#FFB81C] animate-pulse" />
            <span className="text-xs font-black text-white pr-0.5">Nav Menu</span>
            <ChevronUp className="w-4 h-4 text-[#FFB81C]" />
          </button>
        </div>
      ) : (
        /* Expanded Floating Bottom Nav Bar Across Screen */
        <div className="fixed bottom-2 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-[999999] pointer-events-auto transition-all duration-300">
          <div className="bg-[#C51D4A]/95 backdrop-blur-xl text-white rounded-2xl px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-2xl border border-[#a8143a]/90 flex items-center justify-between relative">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-around flex-1 gap-0.5 sm:gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-xl transition-all relative flex-1 ${
                      isActive
                        ? 'text-[#FFB81C] font-black scale-105 bg-black/20 shadow-inner'
                        : 'text-stone-100 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-[#002D62] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#C51D4A] shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] mt-0.5 shadow-2xs" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 sm:p-2 text-stone-100 hover:text-white bg-[#941135]/90 hover:bg-[#7d0d2c] rounded-xl transition-all ml-1 border border-[#8a0f31]/80 flex-shrink-0"
              title="Collapse Navigation"
              aria-label="Collapse Navigation"
            >
              <ChevronDown className="w-4 h-4 text-[#FFB81C]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

