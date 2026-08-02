import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Mic, 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Sun, 
  ShoppingBag, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface HeroCarouselProps {
  onOpenVoiceAI: () => void;
  onOpenWhatsAppSim: () => void;
  onSelectTab?: (tab: string) => void;
}

interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  region: string;
  title: string;
  description: string;
  bgGradient: string;
  icon: React.ReactNode;
  primaryBtnText: string;
  secondaryBtnText: string;
  primaryAction: 'voice' | 'whatsapp' | 'discover';
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onOpenVoiceAI,
  onOpenWhatsAppSim,
  onSelectTab,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const slides: Slide[] = [
    {
      id: 'diaspora-cart',
      badge: 'Diaspora Collaborative Grocery',
      badgeColor: 'bg-[#ff4f38]',
      region: 'UK, US, EU, NZ, AU, UAE, SA, ZIM, NIG, KEN',
      title: 'One Shared Cart for Sponsors & Local Relatives',
      description: 'Order groceries from OK Zim, Pick n Pay & SA Wholesalers. Relatives with low data can order via WhatsApp voice notes in Shona & Ndebele!',
      bgGradient: 'from-[#1a115e] via-[#241a7d] to-[#100a3d]',
      icon: <Globe className="w-3.5 h-3.5 text-[#298bf5] flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'voice',
    },
    {
      id: 'staples-promo',
      badge: '20% OFF Staples Promo',
      badgeColor: 'bg-[#ffb81c] text-stone-900',
      region: 'Harare • Bulawayo • Mutare • Gweru',
      title: 'Moyo Family Monthly Care Pack',
      description: 'Bulk Maize Meal (Hupfu), Cooking Oil, Sugar & Rice pre-packed at wholesale depots for fast 24h pickup or home delivery.',
      bgGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#311042]',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#ffb81c] flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'discover',
    },
    {
      id: 'braai-promo',
      badge: 'Weekend Shisa Nyama Special',
      badgeColor: 'bg-emerald-500 text-white',
      region: 'Fresh Grade-A Butchery Supplies',
      title: 'Weekend Braai & Meat Box with Free Spices',
      description: 'Sponsor fresh beef T-bones, pork chops, boerewors & charcoal for family gatherings back home with guaranteed cold-chain delivery.',
      bgGradient: 'from-[#14532d] via-[#064e3b] to-[#022c22]',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'whatsapp',
    },
    {
      id: 'solar-promo',
      badge: 'Load Shedding Relief Kit',
      badgeColor: 'bg-amber-500 text-slate-900',
      region: 'SA Depot Cross-Border Dispatch',
      title: 'Solar Power Lamps & Emergency Kits',
      description: 'Keep your relatives lit and connected during power cuts with long-life solar lanterns, powerbanks & premium tea hampers.',
      bgGradient: 'from-[#451a03] via-[#78350f] to-[#1e1b4b]',
      icon: <Sun className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'voice',
    },
    {
      id: 'mazoe-fiesta',
      badge: 'Zim Heritage Drinks',
      badgeColor: 'bg-sky-500 text-white',
      region: 'Original Mazoe Orange Cordial',
      title: 'Bulk Refreshments & Mazoe Cordials',
      description: 'Stock up your family pantry with genuine 2L Mazoe Orange, Peach Cordials, Tanganda Tea & Cascade juices at local prices.',
      bgGradient: 'from-[#075985] via-[#0c4a6e] to-[#1e1b4b]',
      icon: <Zap className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'whatsapp',
    },
  ];

  // Auto-play interval
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const slide = slides[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.2,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0.2,
    }),
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-md border border-[#2a1d82]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className={`bg-gradient-to-r ${slide.bgGradient} text-white p-3.5 sm:p-5 relative min-h-[145px] sm:min-h-[160px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}
        >
          <div className="space-y-1 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${slide.badgeColor} text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs`}>
                {slide.badge}
              </span>
              <span className="text-blue-200 text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                {slide.icon} {slide.region}
              </span>
            </div>

            <h2 className="text-[13px] xs:text-sm sm:text-lg md:text-xl font-black font-sans text-white tracking-tight leading-tight whitespace-nowrap sm:whitespace-normal">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
              {slide.description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto relative z-10 pt-1 md:pt-0">
            <button
              onClick={onOpenVoiceAI}
              className="flex-1 sm:flex-none bg-[#ffb81c] hover:bg-[#ffc63b] text-[#1a115e] px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-[#1a115e] flex-shrink-0" />
              <span>{slide.primaryBtnText}</span>
            </button>

            <button
              onClick={onOpenWhatsAppSim}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shadow border border-emerald-400/40 transition-all active:scale-95 whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{slide.secondaryBtnText}</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Swipe / Navigation Left Button */}
      <button
        onClick={handlePrev}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-xs transition-all active:scale-90"
        aria-label="Previous promo slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Swipe / Navigation Right Button */}
      <button
        onClick={handleNext}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-xs transition-all active:scale-90"
        aria-label="Next promo slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === idx
                ? 'w-4 bg-[#ffb81c]'
                : 'w-1.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
