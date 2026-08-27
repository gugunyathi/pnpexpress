import React, { useState } from 'react';
import { ShoppingCart, Users, ChevronDown } from 'lucide-react';
import { Currency, Member, CartItem } from '../types';
import { PnPLogo } from './PnPLogo';
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

const STORES_BY_REGION: Record<string, string[]> = {
  'Harare Region': [
    'PICK n PAY BORROWDALE',
    'PICK n PAY MSASA',
    'PICK n PAY KAMFINSA',
    'PICK n PAY CHIREMBA',
    'PICK n PAY AVONDALE',
    'PICK n PAY JOINA CITY',
    'PICK n PAY NEWLANDS',
    'TM PICK n PAY ORR STREET',
    'TM PICK n PAY STRATHAVEN',
    'TM PICK n PAY MAKONI',
    'TM PICK n PAY BUDIRIRO',
    'TM PICK n PAY KENNETH KAUNDA',
    'TM PICK n PAY RUWA',
    'PICK n PAY ARUNDEL',
    'PICK n PAY WESTGATE',
    'PICK n PAY SAM NUJOMA',
    'PICK n PAY ASPINDALE',
    'TM PICK n PAY MACHIPISA',
    'TM PICK n PAY CHADCOMBE',
    'TM PICK n PAY ZENGEZA',
    'PICK n PAY HIGHLAND PARK',
    'PICK n PAY MADOKERO',
    'PICK n PAY SIMON MAZORODZE',
    'PICK n PAY HOGERTY HILL',
  ],
  'Bulawayo Region': [
    'TM PICK n PAY COWDRAY PARK',
    'TM PICK n PAY JASON MOYO',
    'PICK n PAY ASCOT',
    'PICK n PAY HYPER',
    'TM PICK n PAY NORTHEND',
    'PICK n PAY BRADFIELD',
    'TM PICK n PAY LOBENGULA',
    'TM PICK n PAY FIFE ST',
  ],
  'Manicaland Region': [
    'TM PICK n PAY RUSAPE',
    'PICK n PAY MUTARE',
    'TM PICK n PAY CHIPINGE',
    'PICK n PAY SAKUBVA',
  ],
  'Mashonaland Central Region': [
    'TM PICK n PAY BINDURA',
  ],
  'Mashonaland East Region': [
    'TM PICK n PAY MUTOKO',
    'PICK n PAY MARONDERA',
    'PICK n PAY CHIVHU',
  ],
  'Mashonaland West Region': [
    'TM PICK n PAY KADOMA',
    'TM PICK n PAY CHINHOYI',
    'TM PICK n PAY KARIBA',
    'TM PICK n PAY CHINHOYI SOUTH',
    'TM PICK n PAY KAROI',
    'TM PICK n PAY NORTON',
  ],
  'Masvingo Region': [
    'TM PICK n PAY CHIREDZI',
    'TM PICK n PAY TRIANGLE',
    'PICK n PAY MASVINGO',
  ],
  'Matabeleland North Region': [
    'PICK n PAY VICTORIA FALLS',
    'PICK n PAY HWANGE',
  ],
  'Matabeleland South Region': [
    'PICK n PAY GWANDA',
  ],
  'Midlands Region': [
    'PICK n PAY GWERU MEGAWATT',
    'TM PICK n PAY ZVISHAVANE',
    'PICK n PAY GWERU',
    'PICK n PAY KWEKWE MAIN ST',
    'PICK n PAY SHURUGWI',
  ],
};

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
  const [selectedRegion, setSelectedRegion] = useState<string>('Harare Region');
  const [selectedStore, setSelectedStore] = useState<string>('PICK n PAY MSASA');

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const onlineCount = members.filter(m => m.isOnline).length;
  const currentCurrencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.GBP;

  return (
    <header className="sticky top-0 z-40 bg-[#C51D4A] text-white shadow-md border-b border-[#a8143d]">
      {/* Top Banner Example Bar with Region & Store Selection in #C51D4A */}
      <div className="bg-[#C51D4A] text-white text-xs py-1.5 px-3 sm:px-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-4 sm:gap-8 overflow-x-auto no-scrollbar font-bold">
          {/* Region Selector */}
          <div className="relative flex items-center gap-1 cursor-pointer hover:opacity-90 whitespace-nowrap">
            <span className="font-bold">Region:</span>
            <span className="font-extrabold">{selectedRegion}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-90 stroke-[2.5]" />
            <select
              value={selectedRegion}
              onChange={(e) => {
                const newRegion = e.target.value;
                setSelectedRegion(newRegion);
                const regionStores = STORES_BY_REGION[newRegion];
                if (regionStores && regionStores.length > 0) {
                  setSelectedStore(regionStores[0]);
                }
              }}
              aria-label="Select Region"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer bg-white text-stone-900"
            >
              {Object.keys(STORES_BY_REGION).map((reg) => (
                <option key={reg} value={reg} className="text-stone-900 font-medium py-1">
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Store Selector */}
          <div className="relative flex items-center gap-1 cursor-pointer hover:opacity-90 whitespace-nowrap">
            <span className="font-bold">Store:</span>
            <span className="font-extrabold">{selectedStore}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-90 stroke-[2.5]" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              aria-label="Select Store"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer bg-white text-stone-900"
            >
              {(STORES_BY_REGION[selectedRegion] || []).map((st) => (
                <option key={st} value={st} className="text-stone-900 font-medium py-1">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar in #C51D4A */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* PnP Brand with Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-white px-2.5 py-1 rounded-lg shadow-sm flex items-center justify-center border border-stone-200">
            <PnPLogo height={32} showClickCollect={true} />
          </div>
        </div>

        {/* Currency Switcher, AI Tools & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Members Presence */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#a3153c] px-2.5 py-1 rounded-full border border-white/20">
            <Users className="w-3.5 h-3.5 text-[#FFB81C]" />
            <span className="text-xs text-white font-medium">{onlineCount} Active</span>
            <div className="flex -space-x-1.5 ml-1">
              {members.map(m => (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={`${m.name} (${m.location})`}
                  className="w-5 h-5 rounded-full border border-white object-cover"
                />
              ))}
            </div>
          </div>

          {/* Clickable Currency Selector Dropdown */}
          <div className="relative flex items-center bg-[#a3153c] hover:bg-[#921134] rounded-xl border border-white/20 shadow-sm transition-all">
            <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-bold text-white pointer-events-none">
              <span className="text-sm">{currentCurrencyInfo.flag}</span>
              <span className="text-[#FFB81C] font-black">{currentCurrencyInfo.symbol}</span>
              <span className="hidden xs:inline text-stone-100">{currentCurrencyInfo.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-200 ml-0.5" />
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
            className="relative flex items-center gap-1.5 bg-[#002D62] hover:bg-[#001D42] text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md border border-[#003B80] transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Cart</span>
            {totalItemCount > 0 && (
              <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


