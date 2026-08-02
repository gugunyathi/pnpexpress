import React from 'react';
import { ShoppingCart, Users, ChevronDown } from 'lucide-react';
import { Currency, Member, CartItem } from '../types';
import { ZikiLogo } from './ZikiLogo';
import { ALL_CURRENCIES, CURRENCY_MAP } from '../utils/currency';

interface NavbarProps {
  cart: CartItem[];
  members: Member[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onOpenVoiceAI: () => void;
  onOpenWhatsAppSim: () => void;
  onOpenDocs: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cart,
  members,
  currency,
  onCurrencyChange,
  lowDataMode,
  onToggleLowData,
  onOpenVoiceAI,
  onOpenWhatsAppSim,
  onOpenDocs,
  onOpenCart
}) => {
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const onlineCount = members.filter(m => m.isOnline).length;
  const currentCurrencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.GBP;

  return (
    <header className="sticky top-0 z-40 bg-[#1a115e] text-white shadow-md border-b border-[#2a1d82]">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Zikishop Brand with Logo (No ASAP badge) */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center border border-stone-100">
            <ZikiLogo size={28} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-xl sm:text-2xl tracking-tight text-white font-sans">
                Ziki<span className="text-[#ff4f38]">shop</span>
              </h1>
            </div>
            <p className="text-[10px] text-blue-200/90 hidden sm:block font-medium">
              Cross-Border Grocery Engine
            </p>
          </div>
        </div>

        {/* Currency Switcher, AI Tools & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Members Presence */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#100a3d]/90 px-2.5 py-1 rounded-full border border-[#241a7d]">
            <Users className="w-3.5 h-3.5 text-[#ffb81c]" />
            <span className="text-xs text-blue-100 font-medium">{onlineCount} Active</span>
            <div className="flex -space-x-1.5 ml-1">
              {members.map(m => (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={`${m.name} (${m.location})`}
                  className="w-5 h-5 rounded-full border border-[#1a115e] object-cover"
                />
              ))}
            </div>
          </div>

          {/* Clickable Currency Selector Dropdown */}
          <div className="relative flex items-center bg-[#100a3d] hover:bg-[#181057] rounded-xl border border-[#2e2294] shadow-sm transition-all">
            <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-bold text-stone-100 pointer-events-none">
              <span className="text-sm">{currentCurrencyInfo.flag}</span>
              <span className="text-[#ffb81c] font-black">{currentCurrencyInfo.symbol}</span>
              <span className="hidden xs:inline text-stone-200">{currentCurrencyInfo.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
            </div>

            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              aria-label="Select Currency"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-stone-900 bg-white"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="text-stone-900 font-medium py-1">
                  {c.flag} {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-[#ffb81c] hover:bg-[#ffc63b] text-[#1a115e] px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-[#1a115e]" />
            <span className="hidden sm:inline">Cart</span>
            {totalItemCount > 0 && (
              <span className="bg-[#ff4f38] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

