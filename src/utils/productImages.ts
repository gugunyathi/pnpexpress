import React from 'react';

/**
 * Product Image Resolution & Fallback Engine
 * Uses the authentic packshot images stored in /public/images/ and provides instant SVG fallbacks.
 */

// Local packshot image paths covering both original and uploaded filename variants
const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  // Rice / Tastic (5kg)
  'tastic': '/images/tastic_rice.jpg',
  'tastic_rice': '/images/tastic_rice.jpg',
  'tastic rice 5kg': '/images/tastic_rice.jpg',
  'tastic rice 5kg.webp': '/images/tastic_rice.jpg',
  'rice': '/images/tastic_rice.jpg',
  'mupunga': '/images/tastic_rice.jpg',
  'ilayisi': '/images/tastic_rice.jpg',
  
  // Maize Meal / White Star (5kg) / Hupfu
  'white star': '/images/white_star_maize.jpg',
  'white_star_maize': '/images/white_star_maize.jpg',
  'mealie meal': '/images/white_star_maize.jpg',
  'mealie meal.webp': '/images/white_star_maize.jpg',
  'maize': '/images/white_star_maize.jpg',
  'mealie': '/images/white_star_maize.jpg',
  'hupfu': '/images/white_star_maize.jpg',
  'impuphu': '/images/white_star_maize.jpg',
  
  // Fruit & Vegetable Box (10kg)
  'fruit': '/images/fruit_veg_box.jpg',
  'veg': '/images/fruit_veg_box.jpg',
  'vegetable': '/images/fruit_veg_box.jpg',
  'fruit_veg_box': '/images/fruit_veg_box.jpg',
  'vegetable box 10kg': '/images/fruit_veg_box.jpg',
  'vegetable box 10kg.jpg': '/images/fruit_veg_box.jpg',
  'fruit and vegetable box 10kg': '/images/fruit_veg_box.jpg',
  'fruit and vegetable box 10kg.jpg': '/images/fruit_veg_box.jpg',
  'produce': '/images/fruit_veg_box.jpg',
  
  // Cooking Oil / Sunfoil (2L / 5L)
  'sunfoil': '/images/sunfoil_oil.jpg',
  'sunfoil_oil': '/images/sunfoil_oil.jpg',
  'cooking oil': '/images/sunfoil_oil.jpg',
  'cooking oil 2l': '/images/sunfoil_oil.jpg',
  'cooking oil 2l.webp': '/images/sunfoil_oil.jpg',
  'cooking oil 5l': '/images/sunfoil_oil.jpg',
  'cooking oil 5l.webp': '/images/sunfoil_oil.jpg',
  'oil': '/images/sunfoil_oil.jpg',
  'cooking': '/images/sunfoil_oil.jpg',
  'mafuta': '/images/sunfoil_oil.jpg',
  
  // Sugar / Huletts (5kg)
  'sugar': '/images/huletts_sugar.jpg',
  'huletts': '/images/huletts_sugar.jpg',
  'huletts_sugar': '/images/huletts_sugar.jpg',
  'sugar 5kg': '/images/huletts_sugar.jpg',
  'sugar 5kg.webp': '/images/huletts_sugar.jpg',
  'chigaku': '/images/huletts_sugar.jpg',
  'unshukela': '/images/huletts_sugar.jpg',
  
  // Mazoe Orange Crush (2L)
  'mazoe': '/images/mazoe_orange_crush.jpg',
  'mazoe_orange_crush': '/images/mazoe_orange_crush.jpg',
  'mazoe orange crush 2l': '/images/mazoe_orange_crush.jpg',
  'mazoe orange crush 2l.webp': '/images/mazoe_orange_crush.jpg',
  'crush': '/images/mazoe_orange_crush.jpg',
  'orange': '/images/mazoe_orange_crush.jpg',
  'cordial': '/images/mazoe_orange_crush.jpg',
  
  // Tanganda Tea (100s)
  'tea': '/images/tanganda_tea.jpg',
  'tanganda': '/images/tanganda_tea.jpg',
  'tanganda_tea': '/images/tanganda_tea.jpg',
  'tanganda tagless tea bags 100': '/images/tanganda_tea.jpg',
  'tanganda tagless tea bags 100.webp': '/images/tanganda_tea.jpg',
  'tii': '/images/tanganda_tea.jpg',
  'chai': '/images/tanganda_tea.jpg',
  
  // Solar Kit / Lighting System
  'solar': '/images/solar_lighting_system.jpg',
  'solar_lighting_system': '/images/solar_lighting_system.jpg',
  'solar kit': '/images/solar_lighting_system.jpg',
  'solar kit.webp': '/images/solar_lighting_system.jpg',
  'power': '/images/solar_lighting_system.jpg',
  'lighting': '/images/solar_lighting_system.jpg',
  'liteng': '/images/solar_lighting_system.jpg',
  'gizzu': '/images/solar_lighting_system.jpg',
  
  // Milk / Clover UHT (6x1L)
  'milk': '/images/clover_milk.jpg',
  'clover': '/images/clover_milk.jpg',
  'clover_milk': '/images/clover_milk.jpg',
  'full cream milk carton 6x1l': '/images/clover_milk.jpg',
  'full cream milk carton 6x1l.webp': '/images/clover_milk.jpg',
  'mukaka': '/images/clover_milk.jpg',
  'ubisi': '/images/clover_milk.jpg',
  
  // Soap / Sunlight (500g)
  'soap': '/images/sunlight_soap.jpg',
  'sunlight': '/images/sunlight_soap.jpg',
  'sunlight_soap': '/images/sunlight_soap.jpg',
  'bar soap': '/images/sunlight_soap.jpg',
  'bar soap.webp': '/images/sunlight_soap.jpg',
  'sipo': '/images/sunlight_soap.jpg',
  'isipho': '/images/sunlight_soap.jpg',
  
  // Beef Blade Roast (2kg) / Meat
  'beef': '/images/fresh_beef.jpg',
  'fresh_beef': '/images/fresh_beef.jpg',
  'beef blade roast 2kg': '/images/fresh_beef.jpg',
  'beef blade roast 2kg.webp': '/images/fresh_beef.jpg',
  'meat': '/images/fresh_beef.jpg',
  'roast': '/images/fresh_beef.jpg',
  'nyama': '/images/fresh_beef.jpg',
  'butchery': '/images/fresh_beef.jpg',
  'eggs': '/images/fresh_beef.jpg',
  
  // Pampers Pants Size 3 (56s)
  'pampers': '/images/pampers_pants.jpg',
  'pampers_pants': '/images/pampers_pants.jpg',
  'pampers 56': '/images/pampers_pants.jpg',
  'pampers 56.webp': '/images/pampers_pants.jpg',
  'baby': '/images/pampers_pants.jpg',
  'pants': '/images/pampers_pants.jpg',
  'diaper': '/images/pampers_pants.jpg',
  'nappy': '/images/pampers_pants.jpg',
};

const DEFAULT_GROCERY_IMAGE = '/images/fruit_veg_box.jpg';

/**
 * Creates an inline high-definition SVG Packshot Data URI
 * Guaranteed to render instantly in all browsers even without network access.
 */
function createSvgDataUri(title: string, subtitle: string, brand: string, bgGradient: [string, string], accentColor: string): string {
  const cleanTitle = title.replace(/[<>&"]/g, '');
  const cleanSub = subtitle.replace(/[<>&"]/g, '');
  const cleanBrand = brand.replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="100%" stop-color="${bgGradient[1]}" />
      </linearGradient>
      <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="28" fill="url(#bg)" />
    <rect width="400" height="180" rx="28" fill="url(#shine)" />
    <circle cx="200" cy="170" r="105" fill="#ffffff" fill-opacity="0.16" />
    <circle cx="200" cy="170" r="85" fill="#ffffff" fill-opacity="0.25" stroke="${accentColor}" stroke-width="4" />
    
    <!-- Central Packshot Badge -->
    <rect x="70" y="130" width="260" height="80" rx="16" fill="#ffffff" stroke="${accentColor}" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))" />
    <text x="200" y="158" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="${bgGradient[0]}" text-anchor="middle" letter-spacing="1">${cleanBrand}</text>
    <text x="200" y="188" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#334155" text-anchor="middle">${cleanTitle}</text>
    
    <!-- Top & Bottom Meta -->
    <rect x="130" y="32" width="140" height="28" rx="14" fill="#ffffff" fill-opacity="0.9" />
    <text x="200" y="51" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11" fill="${bgGradient[0]}" text-anchor="middle" letter-spacing="0.5">DIASPORA ESSENTIAL</text>
    
    <text x="200" y="320" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#ffffff" text-anchor="middle">${cleanSub}</text>
    <rect x="150" y="340" width="100" height="24" rx="12" fill="${accentColor}" />
    <text x="200" y="356" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#ffffff" text-anchor="middle">VERIFIED STOCK</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a guaranteed vector SVG packshot based on product name / query.
 */
export function getProductSvgPackshot(productName?: string, category?: string): string {
  const query = `${productName || ''} ${category || ''}`.toLowerCase();

  if (query.includes('rice') || query.includes('tastic') || query.includes('mupunga')) {
    return createSvgDataUri('Parboiled Long Grain Rice (5kg)', 'TASTIC HOUSE OF RICE', 'TASTIC', ['#8B1E0F', '#540D04'], '#EAB308');
  }
  if (query.includes('maize') || query.includes('white star') || query.includes('hupfu') || query.includes('mealie')) {
    return createSvgDataUri('Super Maize Meal (5kg)', 'SHAY NA WHITE STAR', 'WHITE STAR', ['#047857', '#064E3B'], '#EF4444');
  }
  if (query.includes('oil') || query.includes('sunfoil') || query.includes('mafuta')) {
    return createSvgDataUri('Pure Sunflower Cooking Oil (5L)', 'HEART OF GOOD COOKING', 'SUNFOIL', ['#EAB308', '#CA8A04'], '#2563EB');
  }
  if (query.includes('sugar') || query.includes('huletts') || query.includes('chigaku')) {
    return createSvgDataUri('SunSweet Pure White Sugar (5kg)', 'A LITTLE SWEETNESS GOES A LONG WAY', 'HULETTS', ['#DC2626', '#991B1B'], '#3B82F6');
  }
  if (query.includes('mazoe') || query.includes('crush') || query.includes('cordial')) {
    return createSvgDataUri('Orange Crush Syrup (2L)', 'AUTHENTIC ZIMBABWEAN FLAVOR', 'MAZOE', ['#EA580C', '#C2410C'], '#16A34A');
  }
  if (query.includes('tea') || query.includes('tanganda') || query.includes('tii')) {
    return createSvgDataUri('Special Blend Tea Bags (100s)', 'EASTERN HIGHLANDS QUALITY', 'TANGANDA', ['#1E3A8A', '#172554'], '#22C55E');
  }
  if (query.includes('milk') || query.includes('clover') || query.includes('mukaka')) {
    return createSvgDataUri('Full Cream UHT Milk (6x1L)', 'MADE WITH LOVE & FRESHNESS', 'CLOVER', ['#2563EB', '#1D4ED8'], '#F59E0B');
  }
  if (query.includes('soap') || query.includes('sunlight') || query.includes('sipo')) {
    return createSvgDataUri('Mild & Gentle Laundry Bar (500g)', 'MILD & GENTLE FRESHNESS', 'SUNLIGHT', ['#EAB308', '#A16207'], '#16A34A');
  }
  if (query.includes('beef') || query.includes('meat') || query.includes('nyama') || query.includes('roast')) {
    return createSvgDataUri('Fresh Butchery Beef Blade (2kg)', 'PRIME GRADE A CHOICE CUT', 'ZIM FRESH BEEF', ['#991B1B', '#7F1D1D'], '#F97316');
  }
  if (query.includes('pampers') || query.includes('baby') || query.includes('diaper')) {
    return createSvgDataUri('Ultra Comfort Pants Size 3 (56s)', 'ANTI-RASH SHIELD WITH ALOE', 'PAMPERS', ['#0D9488', '#115E59'], '#F43F5E');
  }
  if (query.includes('solar') || query.includes('power') || query.includes('lighting')) {
    return createSvgDataUri('Solar Lighting System & Charger', 'LOAD-SHEDDING RESILIENT KIT', 'LITENG SOLAR', ['#1E293B', '#0F172A'], '#38BDF8');
  }
  
  // Default Fresh Fruit & Veg Box
  return createSvgDataUri('Farm Fresh Vegetable Box (10kg)', 'HARARE & BULAWAYO COLD CHAIN', 'FRESH PRODUCE', ['#15803D', '#14532D'], '#FACC15');
}

/**
 * Normalizes an image path to work seamlessly across root, relative, or nested routing URLs.
 */
export function getProductImagePath(imagePath?: string): string {
  if (!imagePath) return DEFAULT_GROCERY_IMAGE;
  
  // If it's already an external absolute URL or data URI, return directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Clean up relative paths
  let clean = imagePath.trim();
  
  // Check if filename without leading slash matches our catalog dictionary
  const lookupKey = clean.replace(/^\/images\//, '').replace(/^\//, '').toLowerCase();
  if (LOCAL_PRODUCT_IMAGES[lookupKey]) {
    return LOCAL_PRODUCT_IMAGES[lookupKey];
  }
  
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  
  return clean;
}

/**
 * Returns a guaranteed local packshot image URL or SVG vector fallback based on product name or category.
 */
export function getProductFallbackImage(productName?: string, category?: string): string {
  const query = `${productName || ''} ${category || ''}`.toLowerCase();
  
  for (const [key, imagePath] of Object.entries(LOCAL_PRODUCT_IMAGES)) {
    if (query.includes(key)) {
      return imagePath;
    }
  }
  
  return DEFAULT_GROCERY_IMAGE;
}

/**
 * Helper to handle image error events on <img> elements gracefully.
 * Replaces any broken src with the matching packshot image, and if secondary error triggers,
 * swaps to the high-definition inline SVG Data URI so the UI never displays broken image icons.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  productName?: string,
  category?: string
): void {
  const target = e.currentTarget;
  
  // First attempt: try matching local packshot path
  const step = target.dataset.errorStep || '0';
  
  if (step === '0') {
    target.dataset.errorStep = '1';
    const fallbackPath = getProductFallbackImage(productName, category);
    if (target.src !== fallbackPath && !target.src.endsWith(fallbackPath)) {
      target.src = fallbackPath;
      return;
    }
  }
  
  // Second attempt: try direct SVG packshot data URI (100% offline & load-safe)
  target.dataset.errorStep = '2';
  const svgDataUri = getProductSvgPackshot(productName, category);
  target.src = svgDataUri;
}

