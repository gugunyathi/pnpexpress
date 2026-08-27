import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Mic, 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Utensils, 
  Beef, 
  Wheat, 
  Apple, 
  Gift, 
  Wine, 
  ShoppingBag
} from 'lucide-react';
import { getProductImagePath } from '../utils/productImages';

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
  mainHeading: React.ReactNode;
  title: string;
  description: string;
  bgGradient: string;
  bgImage?: string;
  icon: React.ReactNode;
  primaryBtnText: string;
  secondaryBtnText: string;
  primaryAction: 'voice' | 'whatsapp' | 'catalog';
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
      id: 'platters-banner',
      badge: 'TM Pick n Pay Specials',
      badgeColor: 'bg-[#D0021B] text-white',
      region: 'Harare • Bulawayo • Mutare • Nationwide',
      mainHeading: (
        <div className="flex flex-col items-start leading-none mb-1">
          <span className="text-xl xs:text-2xl sm:text-3xl font-black font-serif text-amber-300 tracking-wider uppercase drop-shadow-md">
            THE PERFECT PLATTERS
          </span>
          <span className="text-[10px] sm:text-xs font-black text-white bg-[#D0021B] px-2 py-0.5 rounded-md mt-1 shadow-xs tracking-wide">
            ORDER DELICIOUS PLATTERS FROM TM PICK N PAY!
          </span>
        </div>
      ),
      title: 'Sandwich, Meat, Fish, Cold Meat & Veggie Platters',
      description: 'Order custom function platters online for fast click & collect or direct delivery to family events in Harare & Bulawayo.',
      bgGradient: 'from-[#001D42]/95 via-[#002D62]/85 to-[#00142e]/70',
      bgImage: '/images/fresh_beef.jpg',
      icon: <Utensils className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0" />,
      primaryBtnText: 'Voice AI Order',
      secondaryBtnText: 'WhatsApp Order',
      primaryAction: 'voice',
    },
    {
      id: 'bakers-banner',
      badge: 'Fresh Oven Daily',
      badgeColor: 'bg-[#FFB81C] text-[#002D62]',
      region: 'TM Pick n Pay In-Store Bakery',
      mainHeading: (
        <div className="flex items-baseline gap-2 font-black leading-none mb-1">
          <span className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
            BAKER'S
          </span>
          <span className="text-xl xs:text-2xl sm:text-3xl text-[#FFB81C] font-serif italic tracking-normal">
            best bakes
          </span>
        </div>
      ),
      title: 'Artisanal Breads, Soft Rolls & Oven Pastries',
      description: 'Freshly baked daily in our local TM Pick n Pay bakery ovens — hot crispy loaves, croissants, buns & sweet treats.',
      bgGradient: 'from-[#1a120b]/95 via-[#2a1d13]/85 to-[#120b06]/70',
      bgImage: '/images/white_star_maize.jpg',
      icon: <Wheat className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0" />,
      primaryBtnText: 'Order Fresh Bread',
      secondaryBtnText: 'WhatsApp Assistant',
      primaryAction: 'catalog',
    },
    {
      id: 'butchers-banner',
      badge: 'Grade-A Fresh Butchery',
      badgeColor: 'bg-[#78AC00] text-white',
      region: 'Cold-Chain Guaranteed Butchery',
      mainHeading: (
        <div className="flex items-baseline gap-2 font-black leading-none mb-1">
          <span className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#88C425] tracking-tighter uppercase drop-shadow-md">
            BUTCHER'S
          </span>
          <span className="text-xl xs:text-2xl sm:text-3xl text-white font-serif italic tracking-normal">
            best cuts
          </span>
        </div>
      ),
      title: 'Prime Beef Cutlets, Braai Meats & Tender Chops',
      description: 'Fresh Grade-A beef blade roasts, T-bones, pork chops, lamb cutlets & boerewors prepared fresh by TM master butchers.',
      bgGradient: 'from-[#141414]/95 via-[#1c1613]/85 to-[#0d0d0d]/70',
      bgImage: '/images/fresh_beef.jpg',
      icon: <Beef className="w-3.5 h-3.5 text-[#88C425] flex-shrink-0" />,
      primaryBtnText: 'Voice AI Order',
      secondaryBtnText: 'WhatsApp Meat Box',
      primaryAction: 'voice',
    },
    {
      id: 'fresh-farm-banner',
      badge: 'Farm Fresh Produce',
      badgeColor: 'bg-emerald-600 text-white',
      region: 'Direct from Zim & SA Farmers',
      mainHeading: (
        <div className="flex items-baseline gap-2 font-black leading-none mb-1">
          <span className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-md">
            FRESH
          </span>
          <span className="text-base xs:text-lg sm:text-2xl text-emerald-300 font-serif italic tracking-normal bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40">
            off the farm
          </span>
        </div>
      ),
      title: 'Crisp Organic Vegetables, Greens & Fruit Crates',
      description: 'Daily farm-fresh harvests including ripe tomatoes, crisp spinach, cabbages, garlic, radishes & sweet fruit crates.',
      bgGradient: 'from-[#05220c]/95 via-[#0b3314]/85 to-[#031407]/70',
      bgImage: '/images/fruit_veg_box.jpg',
      icon: <Apple className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />,
      primaryBtnText: 'Order Veggie Crate',
      secondaryBtnText: 'WhatsApp Assistant',
      primaryAction: 'catalog',
    },
    {
      id: 'giftcard-banner',
      badge: 'TM Pick n Pay Gift Card',
      badgeColor: 'bg-[#D0021B] text-white',
      region: 'Diaspora Cross-Border Gift Voucher',
      mainHeading: (
        <div className="flex flex-col items-start leading-none mb-1">
          <span className="text-lg xs:text-xl sm:text-2xl font-serif italic text-amber-200">
            Giving you more ways to give.
          </span>
          <span className="text-xs xs:text-sm sm:text-base font-black text-white tracking-wide mt-1">
            Give the gift of Real Value with the TM Pick n Pay Gift Card
          </span>
        </div>
      ),
      title: 'Instant Cross-Border Grocery Gift Card',
      description: 'Send digital TM Pick n Pay gift cards directly from the UK, SA or USA to family back home in Zimbabwe.',
      bgGradient: 'from-[#4d020a]/95 via-[#6e030f]/85 to-[#300106]/70',
      bgImage: '/images/huletts_sugar.jpg',
      icon: <Gift className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />,
      primaryBtnText: 'Send Gift Card',
      secondaryBtnText: 'WhatsApp Assistant',
      primaryAction: 'catalog',
    },
    {
      id: 'liquor-banner',
      badge: 'TM Liquor Best Buys',
      badgeColor: 'bg-purple-700 text-white',
      region: 'In-Store & Online Liquor Depot',
      mainHeading: (
        <div className="flex items-baseline gap-2 font-black leading-none mb-1">
          <span className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-md">
            LIQUOR
          </span>
          <span className="text-xl xs:text-2xl sm:text-3xl text-purple-300 font-serif italic tracking-normal">
            best buys
          </span>
        </div>
      ),
      title: 'Ice-Cold Beers, Fine Wines & Imported Spirits',
      description: 'Unbeatable liquor specials on fine wines, craft spirits, local ciders, lagers & party mixers for weekend celebrations.',
      bgGradient: 'from-[#1e072b]/95 via-[#2f0e42]/85 to-[#12031a]/70',
      bgImage: '/images/mazoe_orange_crush.jpg',
      icon: <Wine className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />,
      primaryBtnText: 'Shop Liquor Specials',
      secondaryBtnText: 'WhatsApp Order',
      primaryAction: 'catalog',
    },
    {
      id: 'diaspora-cart',
      badge: 'Diaspora Collaborative Grocery',
      badgeColor: 'bg-[#002D62] text-white',
      region: 'UK, US, EU, NZ, AU, UAE, SA, ZIM',
      mainHeading: (
        <div className="flex flex-col items-start leading-none mb-1">
          <span className="text-xl xs:text-2xl sm:text-3xl font-black text-white tracking-tight">
            One Shared Cart for Sponsors & Relatives
          </span>
        </div>
      ),
      title: 'TM Pick n Pay Cross-Border Shopping Engine',
      description: 'Order groceries from TM Pick n Pay & SA Wholesalers. Relatives with low data can order via WhatsApp voice notes in Shona & Ndebele!',
      bgGradient: 'from-[#002D62]/95 via-[#003B80]/85 to-[#001D42]/70',
      bgImage: '/images/tastic_rice.jpg',
      icon: <Globe className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0" />,
      primaryBtnText: 'Voice AI Assistant',
      secondaryBtnText: 'WhatsApp Fallback',
      primaryAction: 'voice',
    },
  ];

  // Auto-play interval
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
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
      className="relative rounded-2xl overflow-hidden shadow-lg border border-[#002D62]/40 bg-stone-900 group"
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
          className="relative min-h-[165px] sm:min-h-[185px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 sm:p-6 text-white overflow-hidden"
        >
          {/* Background Image with Dark Gradient Overlay */}
          {slide.bgImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url('${getProductImagePath(slide.bgImage)}')` }}
            />
          )}

          {/* Gradient Tint Overlay for perfect readability */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} backdrop-blur-[1px]`} />

          {/* Main Slide Content */}
          <div className="space-y-1.5 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${slide.badgeColor} text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1`}>
                {slide.badge}
              </span>
              <span className="text-stone-200 text-[11px] sm:text-xs font-semibold flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-md backdrop-blur-xs">
                {slide.icon} {slide.region}
              </span>
            </div>

            {/* Banner Main Title Artwork */}
            <div className="pt-0.5">
              {slide.mainHeading}
            </div>

            <p className="text-xs sm:text-sm text-stone-200/95 leading-snug max-w-xl font-medium drop-shadow-sm">
              {slide.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto relative z-10 pt-2 md:pt-0">
            <button
              onClick={() => {
                if (slide.primaryAction === 'voice') {
                  onOpenVoiceAI();
                } else if (onSelectTab) {
                  onSelectTab('home');
                } else {
                  onOpenVoiceAI();
                }
              }}
              className="flex-1 sm:flex-none bg-[#FFB81C] hover:bg-[#ffc63b] text-[#002D62] px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer border border-[#FFB81C]/50"
            >
              {slide.primaryAction === 'voice' ? (
                <Mic className="w-4 h-4 text-[#002D62] flex-shrink-0" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-[#002D62] flex-shrink-0" />
              )}
              <span>{slide.primaryBtnText}</span>
            </button>

            <button
              onClick={onOpenWhatsAppSim}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md border border-emerald-400/40 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Smartphone className="w-4 h-4 flex-shrink-0" />
              <span>{slide.secondaryBtnText}</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Left Button */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md border border-white/20 cursor-pointer"
        aria-label="Previous promo slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Navigation Right Button */}
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md border border-white/20 cursor-pointer"
        aria-label="Next promo slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentIndex === idx
                ? 'w-5 bg-[#FFB81C]'
                : 'w-2 bg-white/40 hover:bg-white/80'
            }`}
            title={s.badge}
            aria-label={`Go to ${s.badge} slide`}
          />
        ))}
      </div>
    </div>
  );
};
