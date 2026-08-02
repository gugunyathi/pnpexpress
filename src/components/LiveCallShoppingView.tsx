import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  UserPlus, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Calculator, 
  Users, 
  X, 
  Radio, 
  Camera, 
  Sparkles, 
  Smile, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  LayoutGrid,
  Columns,
  Store,
  LogOut
} from 'lucide-react';
import { CartItem, Member, Currency, SplitMethod, ExchangeRates, Product, ProductCategory } from '../types';
import { formatPrice } from '../utils/currency';
import { SAMPLE_PRODUCTS } from '../data/products';

export interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  location: string;
  mode: 'video' | 'audio-only';
  role?: string;
}

interface LiveCallShoppingViewProps {
  cart: CartItem[];
  members: Member[];
  currency: Currency;
  exchangeRates: ExchangeRates;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
  onAddToCart: (productId: string, memberId: string, note?: string) => void;
  onEndCall: () => void; // Ends call for all participants
  onLeaveCall?: () => void; // User leaves call while others carry on
  onOpenWhatsAppSim?: () => void;
}

export const LiveCallShoppingView: React.FC<LiveCallShoppingViewProps> = ({
  cart,
  members,
  currency,
  exchangeRates,
  onUpdateQuantity,
  onClearCart,
  onAddToCart,
  onEndCall,
  onLeaveCall,
  onOpenWhatsAppSim
}) => {
  // Suggestion index state for Live Shopping recommendations
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);

  const LIVE_SUGGESTIONS = [
    {
      id: 'sug-1',
      name: 'Eggbert Large Eggs 30-Pack',
      category: 'Meats & Proteins' as ProductCategory,
      priceUSD: 3.46,
      originalPriceUSD: 4.99,
      unit: '30-Pack Crate',
      image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400',
      tag: 'REGULARS',
      discount: 'SAVE £1.53',
      deliveryInfo: '7-8 AM Delivery • Added by Amanda',
      description: 'Farm fresh grade-A large chicken eggs packed for family breakfasts.',
    },
    {
      id: 'sug-2',
      name: 'Everfine Pure Sunflower Oil',
      category: 'Cooking & Oils' as ProductCategory,
      priceUSD: 4.12,
      originalPriceUSD: 5.50,
      unit: '2 Litre Bottle',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
      tag: 'POPULAR',
      discount: 'SAVE £1.38',
      deliveryInfo: 'Same-day Dispatch • Mazai Makuru',
      description: '100% triple refined sunflower cooking oil for deep frying and cooking.',
    },
    {
      id: 'sug-3',
      name: 'Huletts Pure White Sugar',
      category: 'Maize & Staples' as ProductCategory,
      priceUSD: 2.85,
      originalPriceUSD: 3.80,
      unit: '2kg Bag',
      image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400',
      tag: 'DAILY ESSENTIAL',
      discount: 'SAVE £0.95',
      deliveryInfo: 'Harare Central Depot • In Stock',
      description: 'Pure sun-crystallized cane sugar perfect for tea and baking.',
    },
    {
      id: 'sug-4',
      name: 'Fresh Dairy Pasteurised Milk',
      category: 'Dairy & Fresh' as ProductCategory,
      priceUSD: 2.10,
      originalPriceUSD: 2.80,
      unit: '2L Bottle',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400',
      tag: 'FRESH DAIRY',
      discount: 'SAVE £0.70',
      deliveryInfo: 'Cold-chain Express • Local Farm',
      description: 'Chilled full-cream fresh milk bottled daily.',
    }
  ];

  // Call state
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [callTimer, setCallTimer] = useState<number>(185); // 03:05 initial time
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('mem-2'); // Gogo Moyo speaking
  const [speakingBadgeMap, setSpeakingBadgeMap] = useState<Record<string, boolean>>({});
  const [callToast, setCallToast] = useState<string | null>(
    '📹 Live Video Call Connected — Shopping Cart is synced in real-time!'
  );
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  useEffect(() => {
    if (activeSpeakerId) {
      setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: true }));
      const timer = setTimeout(() => {
        setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeSpeakerId]);

  // Layout View Mode: 'split' (side-by-side equal), 'max-cart' (expanded cart), 'max-video' (expanded video)
  const [viewLayoutMode, setViewLayoutMode] = useState<'split' | 'max-cart' | 'max-video'>('split');

  // Split method state
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('BY_SUBMITTER');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false);

  // Quick Add Modal / Target member selection
  const [selectedMemberForAdd, setSelectedMemberForAdd] = useState<Member | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Invite / Add Member Modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberLocation, setNewMemberLocation] = useState<string>('Harare, Zimbabwe');
  const [newMemberMode, setNewMemberMode] = useState<'video' | 'audio-only'>('video');

  // Participants List
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>(() =>
    members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      location: m.location,
      mode: m.id === 'mem-4' || m.id === 'mem-5' ? 'audio-only' : 'video',
      role: m.role
    }))
  );

  // Sync if new members added
  useEffect(() => {
    if (members.length > callParticipants.length) {
      const missing = members.filter((m) => !callParticipants.some((cp) => cp.id === m.id));
      if (missing.length > 0) {
        setCallParticipants((prev) => [
          ...prev,
          ...missing.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            location: m.location,
            mode: 'video' as const,
            role: m.role
          }))
        ]);
      }
    }
  }, [members]);

  // Real WebRTC Camera Stream
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);

  // Video call timer increment
  useEffect(() => {
    const interval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Speaker rotation for natural group feel
  useEffect(() => {
    const speakerInterval = setInterval(() => {
      if (callParticipants.length > 0) {
        const randomMember = callParticipants[Math.floor(Math.random() * callParticipants.length)];
        setActiveSpeakerId(randomMember.id);
      }
    }, 5500);
    return () => clearInterval(speakerInterval);
  }, [callParticipants]);

  // MediaStream camera initialization
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    async function startCamera() {
      if (!isCameraOff) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: !isMicMuted
          });
          streamInstance = stream;
          setCameraStream(stream);
          setHasCameraPermission(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn('Camera access unavailable:', err);
          setHasCameraPermission(false);
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
          setCameraStream(null);
        }
      }
    }

    startCamera();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOff, isMicMuted]);

  useEffect(() => {
    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Format call timer mm:ss
  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Leave call (initiating/current user exits, others carry on)
  const handleLeaveCall = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (onLeaveCall) {
      onLeaveCall();
    } else {
      onEndCall();
    }
  };

  // End call for everyone in the group
  const handleEndCallAll = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    onEndCall();
  };

  // Reactions
  const triggerReaction = (emoji: string) => {
    const reaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.floor(Math.random() * 65) + 20
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2200);
  };

  // Handle adding new participant to call
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    ];
    const newParticipant: CallParticipant = {
      id: `call-mem-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      location: newMemberLocation,
      mode: newMemberMode,
      role: 'Family Member'
    };

    setCallParticipants((prev) => [...prev, newParticipant]);
    setCallToast(`🎉 ${newParticipant.name} joined the Live Call (${newMemberMode === 'video' ? 'Video' : 'Audio Only'})!`);
    triggerReaction('🎉');
    setShowAddMemberModal(false);
    setNewMemberName('');
    setTimeout(() => setCallToast(null), 4000);
  };

  // Toggle participant mode
  const toggleParticipantMode = (id: string) => {
    setCallParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextMode = p.mode === 'video' ? 'audio-only' : 'video';
          setCallToast(`🎙️ ${p.name.split(' ')[0]} switched to ${nextMode === 'video' ? 'Live Video' : 'Audio Only'}`);
          setTimeout(() => setCallToast(null), 3000);
          return { ...p, mode: nextMode };
        }
        return p;
      })
    );
  };

  // Handle Quick Add item
  const handleQuickAddItem = (product: Product, targetMember?: Member | CallParticipant) => {
    const member = targetMember || selectedMemberForAdd || members[0];
    onAddToCart(product.id, member.id, 'Added during Live Video Shopping Call');
    setCallToast(`🛒 ${member.name.split(' ')[0]} added ${product.name} to the cart!`);
    triggerReaction('🛒');
    setShowQuickAddModal(false);
    setSelectedMemberForAdd(null);
    setTimeout(() => setCallToast(null), 4000);
  };

  // Total USD
  const totalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalZAR = totalUSD * exchangeRates.USD_ZAR;
  const totalZWG = totalUSD * exchangeRates.USD_ZWG;

  const formatCurrency = (valUSD: number) => formatPrice(valUSD, currency);

  // Group items by added member
  const memberSubtotals = members.map((member) => {
    const memberItems = cart.filter(
      (i) =>
        i.addedByMemberId === member.id ||
        i.addedByMemberName.toLowerCase().includes(member.name.toLowerCase().split(' ')[0])
    );
    return {
      member,
      subtotalUSD: memberItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0),
      itemCount: memberItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  });

  return (
    <div className="min-h-screen bg-[#071320] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. TOP DEDICATED HEADER BAR */}
      <header className="bg-[#0b1f36] border-b border-[#18395e] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2 sticky top-0 z-50 shadow-xl overflow-x-hidden">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-1 sm:p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center gap-1 shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <h1 className="font-black text-xs sm:text-base text-white tracking-wide whitespace-nowrap truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                Zikishop Live Shopping Call
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {formatCallTime(callTimer)}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-200/80 hidden md:block">
              {callParticipants.length} Family Members Connected • Real-Time Cart Sync
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* View Mode Toggle: Side-by-Side Split, Maximize Cart, Maximize Video */}
          <div className="hidden lg:flex bg-[#122e4d] p-1 rounded-xl border border-blue-400/20 text-xs gap-1">
            <button
              onClick={() => setViewLayoutMode('split')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'split'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Side-by-Side Split View (Cart Left, Video Right)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side View</span>
            </button>

            <button
              onClick={() => setViewLayoutMode('max-cart')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'max-cart'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Maximize Cart View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Cart</span>
            </button>

            <button
              onClick={() => setViewLayoutMode('max-video')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'max-video'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Maximize Video Call Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Video</span>
            </button>
          </div>

          {/* + Invite Member Button */}
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95 shrink-0"
            title="Add user to call"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">+ Invite User</span>
          </button>

          {/* LEAVE CALL BUTTON: User exits call while others carry on */}
          <button
            onClick={handleLeaveCall}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-extrabold px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
            title="Leave the video call while other family members carry on"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Leave Call</span>
          </button>

          {/* END CALL FOR ALL BUTTON: Terminates call session for everyone */}
          <button
            onClick={handleEndCallAll}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-lg shadow-red-600/30 transition-transform active:scale-95 shrink-0 whitespace-nowrap"
            title="End Video Call for all family members"
          >
            <PhoneOff className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">End Call for All</span>
            <span className="sm:hidden">End All</span>
          </button>
        </div>
      </header>

      {/* Floating Call Toast Banner */}
      {callToast && (
        <div className="bg-gradient-to-r from-cyan-950 via-[#0d3152] to-emerald-950 border-b border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-200 flex items-center justify-between shadow-md">
          <span className="truncate pr-2">{callToast}</span>
          <button onClick={() => setCallToast(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA: SIDE-BY-SIDE SPLIT GRID (Cart on Left, TikTok Video Grid on Right) */}
      <div className="flex-1 p-2 sm:p-5 grid grid-cols-12 gap-2 sm:gap-4 items-start max-w-7xl mx-auto w-full">
        {/* ========================================================= */}
        {/* LEFT SIDE: FAMILY CART & CHECKOUT ENGINE */}
        {/* ========================================================= */}
        <div
          className={`space-y-3 transition-all duration-300 col-span-6 ${
            viewLayoutMode === 'max-cart'
              ? 'col-span-8 lg:col-span-8'
              : viewLayoutMode === 'max-video'
              ? 'col-span-4 lg:col-span-4'
              : 'col-span-6 lg:col-span-6'
          }`}
        >
          {/* Cart Header Panel */}
          <div className="bg-[#0b1d30] rounded-2xl p-4 border border-[#16385d] shadow-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#ffb703]" />
                <h2 className="font-extrabold text-base text-white">
                  Shared Family Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Items selected live during video call with family
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedMemberForAdd(members[0]);
                  setShowQuickAddModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add Item</span>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="bg-[#091728] rounded-2xl border border-dashed border-blue-500/30 p-8 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-blue-400/40 mx-auto" />
              <h3 className="font-bold text-white text-sm">Cart is currently empty</h3>
              <p className="text-xs text-blue-200/60 max-w-xs mx-auto">
                Use the Quick Add button above or click on any participant tile on the right to select grocery items live on camera!
              </p>
              <button
                onClick={() => {
                  if (SAMPLE_PRODUCTS.length > 0) {
                    handleQuickAddItem(SAMPLE_PRODUCTS[0], members[0]);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add 10kg Roller Meal (£5.78)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent">
              {cart.map((item) => {
                const itemTotalUSD = item.product.priceUSD * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-[#0b1d30] rounded-2xl p-2 sm:p-3.5 border border-[#183a61] shadow-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 hover:border-cyan-500/40 transition-colors"
                  >
                    {/* Item Image & Description */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover border border-blue-400/20 bg-stone-900 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs sm:text-sm leading-tight">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-blue-200/80 mt-0.5">
                          <span>{item.product.unit}</span>
                          <span>•</span>
                          <span className="font-semibold text-amber-300">
                            {formatCurrency(item.product.priceUSD)} each
                          </span>
                        </div>

                        {/* Member Attribution Badge */}
                        <div className="mt-1 flex items-center gap-1">
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Added by {item.addedByMemberName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Subtotal */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#071320] rounded-xl p-0.5 border border-[#183a61]">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-black text-xs text-amber-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[65px]">
                        <span className="text-[9px] text-blue-300/60 block uppercase font-bold">Subtotal</span>
                        <span className="font-black text-xs sm:text-sm text-cyan-300">
                          {formatCurrency(itemTotalUSD)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE: LIVE TIKTOK / INSTAGRAM VIDEO PARTICIPANTS GRID */}
        {/* ========================================================= */}
        <div
          className={`space-y-3 transition-all duration-300 col-span-6 ${
            viewLayoutMode === 'max-video'
              ? 'col-span-8 lg:col-span-8'
              : viewLayoutMode === 'max-cart'
              ? 'col-span-4 lg:col-span-4'
              : 'col-span-6 lg:col-span-6'
          }`}
        >
          {/* Live Video Canvas Container */}
          <div className="bg-[#030a12] border-2 border-cyan-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-4 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[380px]">
            {/* Ambient Lighting background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Floating Reactions Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute text-3xl animate-bounce transition-all duration-1000"
                  style={{
                    left: `${r.x}%`,
                    bottom: '20%',
                    animation: 'floatUp 2.2s ease-out forwards'
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* 2x3 TikTok Style Video Participants Tile Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 flex-1 my-1">
              {callParticipants.slice(0, 6).map((participant) => {
                const isSpeaking = activeSpeakerId === participant.id;
                const showSpeakingBadge = speakingBadgeMap[participant.id];
                const isSelf = participant.id === 'mem-1';
                const isAudioOnly = participant.mode === 'audio-only';

                return (
                  <div key={participant.id} className="flex flex-col items-center min-w-0 w-full">
                    <div
                      onClick={() => {
                        const foundMember = members.find((x) => x.id === participant.id);
                        setSelectedMemberForAdd(foundMember || members[0]);
                        setShowQuickAddModal(true);
                      }}
                      className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border-2 transition-all cursor-pointer group shadow-lg ${
                        isSpeaking
                          ? 'border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/40 animate-pulse'
                          : 'border-cyan-500/30 hover:border-cyan-400'
                      }`}
                      title={`Click tile to add product for ${participant.name}`}
                    >
                      {/* Real Local Camera Feed for initiating user */}
                      {isSelf && !isCameraOff && hasCameraPermission ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : isAudioOnly ? (
                        /* Audio-Only Mode Screen */
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2a47] via-[#091b2e] to-[#040f1a] flex flex-col items-center justify-center p-1 text-center">
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      ) : isSelf && isCameraOff ? (
                        <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center text-stone-500 space-y-1">
                          <Camera className="w-7 h-7 text-stone-600" />
                          <span className="text-[9px] font-bold">Camera Off</span>
                        </div>
                      ) : (
                        /* Remote Video Tile */
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      {/* Briefly show Speaking overlay badge for 3 seconds when speaking starts */}
                      {showSpeakingBadge && (
                        <div className="absolute top-1.5 left-1.5 z-20 bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider animate-in fade-in duration-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          Speaking
                        </div>
                      )}

                      {/* Subtle Quick Add Button on Tile Bottom Right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const member = members.find((m) => m.id === participant.id) || members[0];
                          setSelectedMemberForAdd(member);
                          setShowQuickAddModal(true);
                        }}
                        className="absolute bottom-1.5 right-1.5 z-20 bg-emerald-500 hover:bg-emerald-400 text-stone-950 p-1 rounded-full shadow-md transition-transform group-hover:scale-110 active:scale-95 flex items-center justify-center"
                        title={`Add item for ${participant.name}`}
                      >
                        <Plus className="w-3 h-3 font-black" />
                      </button>
                    </div>

                    {/* Participant Name placed BELOW the square video box */}
                    <span className="font-extrabold text-[10px] sm:text-xs text-stone-200 block text-center mt-1 truncate max-w-full tracking-tight">
                      {participant.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Interactive Toolbar Controls */}
            <div className="relative z-20 bg-[#0a1c2e]/95 border border-cyan-500/30 rounded-2xl p-1.5 sm:p-2.5 mt-2 flex items-center justify-between gap-1 sm:gap-2 backdrop-blur-md overflow-hidden">
              {/* Mic & Camera Toggles */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 ${
                    isMicMuted
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-emerald-400'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                <button
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 ${
                    isCameraOff
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-emerald-400'
                  }`}
                  title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
                >
                  {isCameraOff ? <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              {/* Floating Emoji Reaction Triggers */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                {['🛒', '❤️', '🎉', '🔥', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="p-1 bg-stone-800/80 hover:bg-cyan-900 rounded-lg text-xs sm:text-sm transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Quick Actions: Add Item, Leave Call, End Call for All */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setSelectedMemberForAdd(members[0]);
                    setShowQuickAddModal(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0"
                  title="Add Item"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Add Item</span>
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  title="Leave call (others carry on)"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Leave</span>
                </button>

                <button
                  onClick={handleEndCallAll}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  title="End call for everyone"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">End All</span>
                </button>
              </div>
            </div>
          </div>

          {/* LIVE PRODUCT SUGGESTIONS CARD (Dynamic positioning directly below video frame) */}
          {LIVE_SUGGESTIONS.length > 0 && (
            <div className="bg-[#0b1d30] border border-[#183a61] rounded-2xl p-2.5 sm:p-3.5 space-y-2.5 shadow-xl relative overflow-hidden transition-all duration-300">
              {/* Top Header */}
              <div className="flex flex-col gap-1.5 border-b border-[#183a61]/60 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    <h3 className="font-extrabold text-xs text-white tracking-wide truncate">
                      Suggestion
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="text-[10px] text-cyan-300 hover:text-white font-bold underline shrink-0 whitespace-nowrap"
                  >
                    Expand Details
                  </button>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-amber-500/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/30 uppercase tracking-wider whitespace-nowrap">
                    {LIVE_SUGGESTIONS[suggestionIndex].tag}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-emerald-400/30 whitespace-nowrap">
                    {LIVE_SUGGESTIONS[suggestionIndex].discount}
                  </span>
                </div>
              </div>

              {/* Suggestion Body: Product Image, Details & Quick Action */}
              <div className="bg-[#071320] rounded-xl p-2 sm:p-2.5 border border-[#183a61] flex items-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src={LIVE_SUGGESTIONS[suggestionIndex].image}
                  alt={LIVE_SUGGESTIONS[suggestionIndex].name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-stone-900 border border-cyan-500/30 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-extrabold text-xs text-white truncate leading-tight">
                    {LIVE_SUGGESTIONS[suggestionIndex].name}
                  </h4>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-cyan-300 whitespace-nowrap">
                      {formatCurrency(LIVE_SUGGESTIONS[suggestionIndex].priceUSD)}
                    </span>
                    <span className="text-[10px] text-stone-400 line-through whitespace-nowrap">
                      {formatCurrency(LIVE_SUGGESTIONS[suggestionIndex].originalPriceUSD)}
                    </span>
                  </div>
                  <p className="text-[9px] text-blue-200/70 truncate">
                    {LIVE_SUGGESTIONS[suggestionIndex].deliveryInfo}
                  </p>
                </div>
              </div>

              {/* Bottom Control Actions (Skip, Pagination, Add) */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5 min-w-0">
                <button
                  onClick={() =>
                    setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length)
                  }
                  className="bg-[#071320] hover:bg-[#122e4d] text-stone-300 border border-[#183a61] px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                >
                  ↑ Skip
                </button>

                <div className="flex items-center gap-1 bg-[#071320] px-1.5 py-0.5 rounded-lg border border-[#183a61] text-[9px] font-mono text-cyan-300 shrink-0">
                  <button
                    onClick={() =>
                      setSuggestionIndex((prev) =>
                        prev === 0 ? LIVE_SUGGESTIONS.length - 1 : prev - 1
                      )
                    }
                    className="hover:text-white px-0.5"
                  >
                    ‹
                  </button>
                  <span className="whitespace-nowrap">
                    {suggestionIndex + 1}/{LIVE_SUGGESTIONS.length}
                  </span>
                  <button
                    onClick={() =>
                      setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length)
                    }
                    className="hover:text-white px-0.5"
                  >
                    ›
                  </button>
                </div>

                <button
                  onClick={() => {
                    const sug = LIVE_SUGGESTIONS[suggestionIndex];
                    const prodToInsert: Product = {
                      id: sug.id,
                      name: sug.name,
                      brand: 'Standard',
                      category: sug.category as ProductCategory,
                      storeId: 'OK_ZIM',
                      storeName: 'OK Zimbabwe',
                      priceUSD: sug.priceUSD,
                      priceZAR: sug.priceUSD * 24,
                      priceZWG: sug.priceUSD * 32,
                      unit: sug.unit,
                      image: sug.image,
                      fulfillmentTag: 'Harare Express',
                      inStock: true
                    };
                    handleQuickAddItem(prodToInsert, selectedMemberForAdd || members[0]);
                    setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2.5 py-1 rounded-lg text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 text-stone-950 shrink-0" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FULL WIDTH BOTTOM SECTION: LIVE SPLIT SHARES BREAKDOWN */}
        {/* ========================================================= */}
        {cart.length > 0 && (
          <div className="col-span-12 bg-[#0b1d30] rounded-2xl sm:rounded-3xl border border-[#16385d] p-4 sm:p-5 space-y-4 shadow-2xl mt-2">
            {/* Header row: Icon, Title, and Split Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#183a61] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl shrink-0">
                  <Calculator className="w-5 h-5 text-[#ffb703]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                    Live Split Shares Breakdown
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Real-time calculation per family member or split evenly across order
                  </p>
                </div>
              </div>

              {/* Mode Toggle Buttons (By Request vs Split Equally) */}
              <div className="flex bg-[#071320] p-1 rounded-2xl border border-[#183a61] text-xs w-full sm:w-auto min-w-[260px] max-w-sm shrink-0">
                <button
                  onClick={() => setSplitMethod('BY_SUBMITTER')}
                  className={`flex-1 px-4 py-2 font-black rounded-xl transition-all text-center whitespace-nowrap ${
                    splitMethod === 'BY_SUBMITTER'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  By Request
                </button>
                <button
                  onClick={() => setSplitMethod('EQUAL')}
                  className={`flex-1 px-4 py-2 font-black rounded-xl transition-all text-center whitespace-nowrap ${
                    splitMethod === 'EQUAL'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  Split Equally
                </button>
              </div>
            </div>

            {/* Member Shares Grid: Full width 4 columns on desktop, 2 on mobile */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
              {memberSubtotals.map(({ member, subtotalUSD, itemCount }) => {
                let shareUSD = subtotalUSD;
                if (splitMethod === 'EQUAL') {
                  shareUSD = totalUSD / members.length;
                }

                return (
                  <div
                    key={member.id}
                    className="bg-[#071320] rounded-2xl p-3 sm:p-3.5 border border-[#16385d] hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-cyan-400/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-white block truncate leading-tight">
                          {member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.
                        </span>
                        <span className="text-[10px] text-blue-300/70">{itemCount} items</span>
                      </div>
                    </div>

                    <span className="font-black text-sm sm:text-base text-[#ffb703] shrink-0">
                      {formatCurrency(shareUSD)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Total Order & Pay & Dispatch Button */}
            <div className="pt-3 border-t border-[#183a61] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] sm:text-xs text-blue-300/70 uppercase font-black block tracking-wider">
                    Total Order
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {formatCurrency(totalUSD)}
                    </span>
                    <span className="text-xs sm:text-sm text-blue-200/70 font-mono font-bold">
                      ({totalZAR.toFixed(2)} ZAR)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-5 h-5 text-stone-950" />
                <span>Pay & Dispatch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD MEMBER TO LIVE CALL MODAL */}
      {/* ========================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-cyan-600/20 border border-cyan-400/30 rounded-2xl">
                <UserPlus className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Invite Family Member to Call</h3>
                <p className="text-xs text-blue-200/70">Connect video or audio live for collaborative shopping</p>
              </div>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uncle Farai Moyo"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-[#071320] border border-[#183a61] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Location / Country</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. London, UK or Bulawayo, ZIM"
                  value={newMemberLocation}
                  onChange={(e) => setNewMemberLocation(e.target.value)}
                  className="w-full bg-[#071320] border border-[#183a61] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Initial Connection Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberMode('video')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      newMemberMode === 'video'
                        ? 'bg-cyan-600 border-cyan-300 text-white shadow-md'
                        : 'bg-[#071320] border-[#183a61] text-stone-300'
                    }`}
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span>Live Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMemberMode('audio-only')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      newMemberMode === 'audio-only'
                        ? 'bg-cyan-600 border-cyan-300 text-white shadow-md'
                        : 'bg-[#071320] border-[#183a61] text-stone-300'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Audio Only</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 bg-[#071320] hover:bg-stone-800 text-stone-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95"
                >
                  Connect Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUICK ADD PRODUCT TO CART MODAL */}
      {/* ========================================================= */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowQuickAddModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl">
                <Plus className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Add Item for {selectedMemberForAdd ? selectedMemberForAdd.name : 'Family Member'}
                </h3>
                <p className="text-xs text-blue-200/70">Select staples to add directly to the Live Cart</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {SAMPLE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#071320] rounded-2xl p-3 border border-[#183a61] flex items-center justify-between gap-3 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-stone-700"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">{prod.name}</h4>
                      <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        {formatCurrency(prod.priceUSD)} • {prod.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAddItem(prod, selectedMemberForAdd || members[0])}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHECKOUT SUCCESS MODAL */}
      {/* ========================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="font-black text-xl text-white">Order Confirmed & Dispatched!</h3>
            <p className="text-xs text-blue-200">
              Cross-border order for Moyo Family has been split across selected payment providers and dispatched to Harare & Bulawayo depots!
            </p>

            <div className="bg-[#071320] rounded-2xl p-3 text-xs text-left space-y-1.5 border border-[#183a61]">
              <div className="flex justify-between">
                <span className="text-stone-400">Total USD:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Total ZAR Equivalent:</span>
                <span className="font-bold text-amber-300">{totalZAR.toFixed(2)} ZAR</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCheckoutModal(false);
                onClearCart();
                onEndCall();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black py-3 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
            >
              Return to Family Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
