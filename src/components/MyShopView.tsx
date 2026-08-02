import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  Share2, 
  Plus, 
  Copy, 
  Check, 
  ShoppingBag, 
  RotateCcw, 
  Search, 
  History, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  ArrowRight, 
  Package,
  ShoppingBasket
} from 'lucide-react';
import { Member, StoreId, Currency, Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { formatPrice } from '../utils/currency';

interface MyShopViewProps {
  members: Member[];
  products?: Product[];
  currency?: Currency;
  onAddToCart?: (productId: string, memberId: string, note?: string) => void;
  onSelectStoreFilter?: (storeId: StoreId) => void;
  onOpenWhatsAppSim: () => void;
}

interface PreviousOrder {
  orderId: string;
  date: string;
  status: 'Delivered' | 'Collected' | 'Completed';
  deliveryMode: 'Door Delivery' | 'Store Pickup';
  destination: string;
  storeName: string;
  totalUSD: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceUSD: number;
    recipientMemberId: string;
    recipientName: string;
  }>;
}

const PREVIOUS_ORDERS: PreviousOrder[] = [
  {
    orderId: 'ZKS-8921',
    date: '24 Jul 2026',
    status: 'Delivered',
    deliveryMode: 'Door Delivery',
    destination: '78 Samora Machel Ave, Harare',
    storeName: 'OK Zimbabwe (Harare First St)',
    totalUSD: 48.50,
    items: [
      { productId: 'prod-1', productName: 'Tastic Parboiled Rice (10kg)', quantity: 1, priceUSD: 14.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-2', productName: 'Mazoe Blackberry Flavoured Syrup (2L)', quantity: 2, priceUSD: 11.00, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-3', productName: 'Sunfoil Pure Sunflower Cooking Oil (2L)', quantity: 1, priceUSD: 6.80, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-5', productName: 'White Star Super Maize Meal (10kg)', quantity: 1, priceUSD: 16.20, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
    ]
  },
  {
    orderId: 'ZKS-7740',
    date: '10 Jul 2026',
    status: 'Delivered',
    deliveryMode: 'Door Delivery',
    destination: 'Fife St & 12th Ave, Bulawayo',
    storeName: 'Pick n Pay Zimbabwe (Bulawayo)',
    totalUSD: 62.10,
    items: [
      { productId: 'prod-6', productName: 'Iwisa No.1 Super Maize Meal (10kg)', quantity: 2, priceUSD: 30.00, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-4', productName: 'Huletts SunSweet Pure Sugar (2kg)', quantity: 2, priceUSD: 7.60, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-7', productName: 'Dettol Herbal Hygiene Soap (175g 4-pack)', quantity: 2, priceUSD: 7.00, recipientMemberId: 'mem-1', recipientName: 'Uncle Farai' },
      { productId: 'prod-10', productName: 'Sunlight Auto Washing Powder (2kg)', quantity: 1, priceUSD: 17.50, recipientMemberId: 'mem-1', recipientName: 'Uncle Farai' },
    ]
  },
  {
    orderId: 'ZKS-6102',
    date: '28 Jun 2026',
    status: 'Collected',
    deliveryMode: 'Store Pickup',
    destination: 'SA Direct Wholesale Depot (Joburg ➔ Zim)',
    storeName: 'SA Wholesale Depot',
    totalUSD: 31.80,
    items: [
      { productId: 'prod-1', productName: 'Tastic Parboiled Rice (10kg)', quantity: 1, priceUSD: 14.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-9', productName: 'Gloria Cake Wheat Flour (2kg)', quantity: 2, priceUSD: 9.80, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-8', productName: 'Anchor Instant Dry Yeast (100g)', quantity: 3, priceUSD: 7.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
    ]
  }
];

const PREVIOUSLY_BOUGHT_META: Record<string, {
  timesBought: number;
  lastOrdered: string;
  boughtBy: string;
  defaultRecipientId: string;
}> = {
  'prod-1': { timesBought: 6, lastOrdered: '24 Jul 2026', boughtBy: 'You & Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-2': { timesBought: 5, lastOrdered: '24 Jul 2026', boughtBy: 'You (For Gogo)', defaultRecipientId: 'mem-2' },
  'prod-3': { timesBought: 4, lastOrdered: '24 Jul 2026', boughtBy: 'Tinashe Moyo', defaultRecipientId: 'mem-3' },
  'prod-4': { timesBought: 3, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
  'prod-5': { timesBought: 7, lastOrdered: '24 Jul 2026', boughtBy: 'Family Group Favorite', defaultRecipientId: 'mem-2' },
  'prod-6': { timesBought: 4, lastOrdered: '10 Jul 2026', boughtBy: 'Tinashe Moyo', defaultRecipientId: 'mem-3' },
  'prod-7': { timesBought: 3, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
  'prod-8': { timesBought: 2, lastOrdered: '28 Jun 2026', boughtBy: 'Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-9': { timesBought: 3, lastOrdered: '28 Jun 2026', boughtBy: 'Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-10': { timesBought: 2, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
};

export const MyShopView: React.FC<MyShopViewProps> = ({
  members,
  products = SAMPLE_PRODUCTS,
  currency = 'USD' as Currency,
  onAddToCart,
  onSelectStoreFilter,
  onOpenWhatsAppSim,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'depots' | 'myitems' | 'family'>('depots');
  const [myItemsSection, setMyItemsSection] = useState<'frequent' | 'orders'>('frequent');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipientMap, setSelectedRecipientMap] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>('ZKS-8921');

  const depots: {
    id: StoreId;
    name: string;
    logo: string;
    location: string;
    hours: string;
    expressDelivery: string;
    coverage: string;
    status: 'Operational' | 'Express Active';
    phone: string;
  }[] = [
    {
      id: 'OK_ZIM',
      name: 'OK Zimbabwe Superstores',
      logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80',
      location: 'First Street Branch & Avondale, Harare',
      hours: '08:00 - 19:00 Daily',
      expressDelivery: 'Same-day 2-Hour Express',
      coverage: 'Harare, Chitungwiza, Ruwa, Norton',
      status: 'Express Active',
      phone: '+263 77 123 4567',
    },
    {
      id: 'TM_PNP',
      name: 'Pick n Pay Zimbabwe',
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80',
      location: 'Sam Levy’s Village & Borrowdale, Harare',
      hours: '07:30 - 20:00 Daily',
      expressDelivery: '60 Min Express Delivery',
      coverage: 'Harare Metropolitan & Bulawayo Central',
      status: 'Express Active',
      phone: '+263 78 987 6543',
    },
    {
      id: 'SA_WHOLESALE',
      name: 'SA Direct Wholesale Depot',
      logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150&auto=format&fit=crop&q=80',
      location: 'City Deep, Johannesburg ➔ Beitbridge Cross-Border',
      hours: '06:00 - 18:00 (Mon-Sat)',
      expressDelivery: 'Direct SA-to-Zim Truck (24 hrs)',
      coverage: 'Nationwide Delivery in Zimbabwe',
      status: 'Operational',
      phone: '+27 11 400 9988',
    },
    {
      id: 'SPAR_ZIM',
      name: 'SPAR Zimbabwe',
      logo: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=150&auto=format&fit=crop&q=80',
      location: 'Fife Street, Bulawayo',
      hours: '08:00 - 18:30 Daily',
      expressDelivery: 'Click & Collect (Free)',
      coverage: 'Bulawayo & Matabeleland',
      status: 'Operational',
      phone: '+263 29 223 4455',
    },
  ];

  // List of previously bought items
  const previouslyBoughtProducts = useMemo(() => {
    return products.filter((p) => PREVIOUSLY_BOUGHT_META[p.id]);
  }, [products]);

  // Filtered list based on search query
  const filteredBoughtProducts = useMemo(() => {
    if (!searchQuery.trim()) return previouslyBoughtProducts;
    const q = searchQuery.toLowerCase().trim();
    return previouslyBoughtProducts.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.nativeName && p.nativeName.toLowerCase().includes(q))
    );
  }, [previouslyBoughtProducts, searchQuery]);

  const copyInviteLink = () => {
    navigator.clipboard?.writeText('https://zikishop.app/join/moyo-family-group');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddSingleProduct = (productId: string) => {
    if (!onAddToCart) return;
    const prod = products.find((p) => p.id === productId);
    const meta = PREVIOUSLY_BOUGHT_META[productId];
    const memberId = selectedRecipientMap[productId] || meta?.defaultRecipientId || members[0]?.id || 'mem-2';
    const recipient = members.find((m) => m.id === memberId) || members[0];

    onAddToCart(productId, memberId, `Reordered from My Items`);
    setToastMsg(`Added ${prod?.name || 'Item'} for ${recipient?.name || 'Family Member'} to Family Cart! 🛒`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleBuyAgainOrder = (order: PreviousOrder) => {
    if (!onAddToCart) return;
    order.items.forEach((item) => {
      const recipientId = item.recipientMemberId || members[0]?.id || 'mem-2';
      for (let i = 0; i < item.quantity; i++) {
        onAddToCart(item.productId, recipientId, `Reordered from Order #${order.orderId}`);
      }
    });

    setToastMsg(`Re-added all ${order.items.length} items from Order #${order.orderId} to Family Cart! 🛒`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6 relative">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-[#1a115e] text-[#ffb81c] px-4 py-3 rounded-2xl shadow-2xl border border-[#298bf5]/40 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <ShoppingBag className="w-4 h-4 text-[#ff4f38] flex-shrink-0 animate-bounce" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a115e] via-[#241a7d] to-[#100a3d] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#2a1d82] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#ff4f38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              My Outlets & Group
            </span>
            <span className="text-blue-200 text-xs font-semibold">
              Moyo Family Hub
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-sans">
            Store Outlets & Diaspora Group Hub
          </h2>
          <p className="text-xs text-blue-100/90 mt-0.5 max-w-xl">
            Manage your preferred grocery outlets in Zimbabwe and South Africa, check depot stock status, reorder previous items, and invite family members.
          </p>
        </div>

        {/* Tab Toggle (Supply Depots, My Items, Family Group) */}
        <div className="flex bg-[#100a3d] p-1.5 rounded-xl border border-[#241a7d] text-xs font-bold gap-1 flex-wrap sm:flex-nowrap w-full md:w-auto justify-stretch sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveTab('depots')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'depots'
                ? 'bg-[#298bf5] text-white shadow-xs font-extrabold'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#ffb81c]" />
            <span>Supply Depots ({depots.length})</span>
          </button>

          {/* MY ITEMS TAB - Positioned in the space highlighted in screenshot */}
          <button
            type="button"
            onClick={() => setActiveTab('myitems')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'myitems'
                ? 'bg-[#ff4f38] text-white shadow-xs font-black'
                : 'bg-amber-500/10 text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-400/30'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
            <span>My Items ({previouslyBoughtProducts.length})</span>
            <span className="bg-amber-300 text-stone-900 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
              Reorder
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'family'
                ? 'bg-[#298bf5] text-white shadow-xs font-extrabold'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-300" />
            <span>Family Group ({members.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: SUPPLY DEPOTS --- */}
      {activeTab === 'depots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <Store className="w-5 h-5 text-[#298bf5]" />
              <span>Partner Supermarkets & Regional Fulfillment Depots</span>
            </h3>
            <span className="text-xs text-stone-500 font-semibold hidden sm:inline">
              Live Socket.io Depot Sync 🟢
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {depots.map((depot) => (
              <div
                key={depot.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={depot.logo}
                      alt={depot.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                        {depot.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#298bf5]" />
                        <span>{depot.location}</span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {depot.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-stone-150">
                    <span className="text-[10px] text-stone-400 block font-semibold">
                      Operating Hours
                    </span>
                    <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#ffb81c]" />
                      {depot.hours}
                    </span>
                  </div>

                  <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-stone-150">
                    <span className="text-[10px] text-stone-400 block font-semibold">
                      Express Speed
                    </span>
                    <span className="font-bold text-[#1a115e] mt-0.5 block truncate">
                      {depot.expressDelivery}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-stone-500 text-[11px]">
                    <span className="font-bold text-stone-700">Coverage:</span> {depot.coverage}
                  </span>

                  {onSelectStoreFilter && (
                    <button
                      onClick={() => onSelectStoreFilter(depot.id)}
                      className="bg-[#1a115e] hover:bg-[#241a7d] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      View Catalog
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: MY ITEMS (PREVIOUSLY BOUGHT & ORDERS REORDER HUB) --- */}
      {activeTab === 'myitems' && (
        <div className="space-y-5">
          {/* Top Sub-Header Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-200">
                <History className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <span>My Previously Bought Items & Orders</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Auto-Add & Reorder 🛍️
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Easily re-add staple items previously ordered by you or your Moyo family group
                </p>
              </div>
            </div>

            {/* Sub-Section Switcher */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMyItemsSection('frequent')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer ${
                  myItemsSection === 'frequent'
                    ? 'bg-[#1a115e] text-white shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShoppingBasket className="w-3.5 h-3.5 text-amber-400" />
                <span>Frequently Bought ({previouslyBoughtProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMyItemsSection('orders')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer ${
                  myItemsSection === 'orders'
                    ? 'bg-[#1a115e] text-white shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Previous Orders ({PREVIOUS_ORDERS.length})</span>
              </button>
            </div>
          </div>

          {/* --- SUB-SECTION 1: FREQUENTLY BOUGHT ITEMS --- */}
          {myItemsSection === 'frequent' && (
            <div className="space-y-4">
              {/* Search Bar for Previously Bought Items */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search previous items (Rice, Sugar, Mazoe...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#298bf5] text-stone-900 font-medium placeholder:text-stone-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-stone-500 font-bold flex items-center gap-2 self-end sm:self-auto">
                  <span>Showing {filteredBoughtProducts.length} items</span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                    Group Staples
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredBoughtProducts.map((product) => {
                  const meta = PREVIOUSLY_BOUGHT_META[product.id];
                  const currentRecipientId = selectedRecipientMap[product.id] || meta?.defaultRecipientId || members[0]?.id || 'mem-2';

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group hover:border-amber-300"
                    >
                      <div className="space-y-2.5">
                        {/* Top Metadata Row */}
                        <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold border-b border-stone-100 pb-2">
                          <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Bought {meta?.timesBought || 1}x by {meta?.boughtBy || 'Group'}
                          </span>
                          <span className="text-stone-400 font-medium">
                            Last: {meta?.lastOrdered || 'Recently'}
                          </span>
                        </div>

                        {/* Product Info Row */}
                        <div className="flex items-start gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 rounded-xl object-contain bg-stone-50 border border-stone-200 p-1 flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                              <span>{product.brand}</span>
                              <span>•</span>
                              <span className="text-[#298bf5]">{product.category}</span>
                            </div>

                            <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                              {product.name}
                            </h4>

                            {product.nativeName && (
                              <span className="text-[10px] text-amber-800 font-bold italic block mt-0.5">
                                "{product.nativeName}"
                              </span>
                            )}

                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-stone-900 font-black text-sm">
                                {formatPrice(product.priceUSD, currency)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">
                                ({product.unit})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recipient Selection Dropdown */}
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
                            <span>Assign Recipient:</span>
                            <span className="text-[#298bf5]">Select Member</span>
                          </div>
                          <select
                            value={currentRecipientId}
                            onChange={(e) =>
                              setSelectedRecipientMap((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-white text-stone-900 font-bold text-xs py-1 px-2 rounded-lg border border-stone-300 focus:outline-none cursor-pointer"
                          >
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                For: {m.name} ({m.location.split(',')[0]})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSingleProduct(product.id)}
                        className="w-full bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#ffb81c]" />
                        <span>Add to Family Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SUB-SECTION 2: PREVIOUS ORDERS & BUY AGAIN REORDER --- */}
          {myItemsSection === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#298bf5]" />
                  <span>Past Family Group Orders History</span>
                </h4>
                <span className="text-xs text-stone-500 font-medium">
                  Click "Buy Again" to auto-add all items in an order
                </span>
              </div>

              <div className="space-y-3.5">
                {PREVIOUS_ORDERS.map((order) => {
                  const isExpanded = expandedOrderId === order.orderId;

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden hover:border-stone-300 transition-all"
                    >
                      {/* Order Header Row */}
                      <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-stone-900 text-sm sm:text-base font-mono">
                              Order #{order.orderId}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {order.status}
                            </span>
                            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              {order.deliveryMode}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium flex-wrap">
                            <span>📅 {order.date}</span>
                            <span>•</span>
                            <span>🏬 {order.storeName}</span>
                            <span>•</span>
                            <span className="text-stone-700 font-bold">📍 {order.destination}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block font-bold uppercase">Total Price</span>
                            <span className="font-black text-stone-900 text-base">
                              {formatPrice(order.totalUSD, currency)}
                            </span>
                          </div>

                          {/* Primary Buy Again Button */}
                          <button
                            type="button"
                            onClick={() => handleBuyAgainOrder(order)}
                            className="bg-[#ff4f38] hover:bg-[#e03e28] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            title="Auto-add all items from this order to Family Cart"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-white" />
                            <span>Buy Again 🛒</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Items Breakdown */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-500 border-b border-stone-100 pb-2">
                          <span>Items in this Order ({order.items.length}):</span>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)}
                            className="text-[#298bf5] hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Collapse' : 'Expand Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className={`space-y-2 ${isExpanded ? 'block' : 'line-clamp-2'}`}>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="bg-[#1a115e] text-white text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0">
                                  {item.quantity}x
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 truncate block">
                                    {item.productName}
                                  </span>
                                  <span className="text-[10px] text-stone-500 block">
                                    Recipient: <strong className="text-stone-700">{item.recipientName}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="font-extrabold text-stone-900">
                                  {formatPrice(item.priceUSD * item.quantity, currency)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleAddSingleProduct(item.productId)}
                                  className="bg-white hover:bg-stone-100 text-[#1a115e] border border-stone-300 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  title="Add just this item to cart"
                                >
                                  <Plus className="w-3 h-3 text-[#298bf5]" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FAMILY GROUP MEMBERS --- */}
      {activeTab === 'family' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff4f38]" />
                <span>Moyo Family Group Members</span>
              </h3>
              <p className="text-xs text-stone-500">
                Shared cart participants in Johannesburg SA and Harare ZIM
              </p>
            </div>

            <button
              onClick={copyInviteLink}
              className="bg-[#298bf5] hover:bg-[#1f7cd9] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Member'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-[#f8fafc] p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        member.isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm">
                      {member.name}
                    </h4>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#298bf5]" />
                      {member.location}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-[#1a115e] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full block mb-1">
                    {member.role}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {member.channel === 'whatsapp' ? '📱 WhatsApp' : '🌐 Web Live'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Low data family members can order via WhatsApp Voice Notes in Shona or Ndebele!</span>
            </div>
            <button
              onClick={onOpenWhatsAppSim}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer"
            >
              Test WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
