import React from 'react';

/**
 * Product Image Resolution & Fallback Engine
 * Uses the 12 authentic product packshots stored in /public/images/.
 */

// Local packshot image paths for Zimbabwean & South African Diaspora Staples
const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  // Rice / Tastic
  'tastic': '/images/tastic_rice.jpg',
  'rice': '/images/tastic_rice.jpg',
  'mupunga': '/images/tastic_rice.jpg',
  'ilayisi': '/images/tastic_rice.jpg',
  
  // Maize / White Star / Meal / Hupfu
  'white star': '/images/white_star_maize.jpg',
  'maize': '/images/white_star_maize.jpg',
  'mealie': '/images/white_star_maize.jpg',
  'hupfu': '/images/white_star_maize.jpg',
  'impuphu': '/images/white_star_maize.jpg',
  
  // Fruit & Veg
  'fruit': '/images/fruit_veg_box.jpg',
  'veg': '/images/fruit_veg_box.jpg',
  'vegetable': '/images/fruit_veg_box.jpg',
  'produce': '/images/fruit_veg_box.jpg',
  
  // Cooking Oil / Sunfoil
  'oil': '/images/sunfoil_oil.jpg',
  'sunfoil': '/images/sunfoil_oil.jpg',
  'cooking': '/images/sunfoil_oil.jpg',
  'mafuta': '/images/sunfoil_oil.jpg',
  
  // Sugar / Huletts
  'sugar': '/images/huletts_sugar.jpg',
  'huletts': '/images/huletts_sugar.jpg',
  'chigaku': '/images/huletts_sugar.jpg',
  'unshukela': '/images/huletts_sugar.jpg',
  
  // Mazoe / Cordial / Juice
  'mazoe': '/images/mazoe_orange_crush.jpg',
  'crush': '/images/mazoe_orange_crush.jpg',
  'orange': '/images/mazoe_orange_crush.jpg',
  'cordial': '/images/mazoe_orange_crush.jpg',
  
  // Tea / Tanganda
  'tea': '/images/tanganda_tea.jpg',
  'tanganda': '/images/tanganda_tea.jpg',
  'tii': '/images/tanganda_tea.jpg',
  'chai': '/images/tanganda_tea.jpg',
  
  // Solar / Power
  'solar': '/images/solar_lighting_system.jpg',
  'power': '/images/solar_lighting_system.jpg',
  'lighting': '/images/solar_lighting_system.jpg',
  'liteng': '/images/solar_lighting_system.jpg',
  
  // Milk / Clover
  'milk': '/images/clover_milk.jpg',
  'clover': '/images/clover_milk.jpg',
  'mukaka': '/images/clover_milk.jpg',
  'ubisi': '/images/clover_milk.jpg',
  
  // Soap / Sunlight
  'soap': '/images/sunlight_soap.jpg',
  'sunlight': '/images/sunlight_soap.jpg',
  'sipo': '/images/sunlight_soap.jpg',
  'isipho': '/images/sunlight_soap.jpg',
  
  // Beef / Meat
  'beef': '/images/fresh_beef.jpg',
  'meat': '/images/fresh_beef.jpg',
  'roast': '/images/fresh_beef.jpg',
  'nyama': '/images/fresh_beef.jpg',
  
  // Diapers / Pampers / Baby
  'pampers': '/images/pampers_pants.jpg',
  'baby': '/images/pampers_pants.jpg',
  'pants': '/images/pampers_pants.jpg',
  'diaper': '/images/pampers_pants.jpg',
  'nappy': '/images/pampers_pants.jpg',
};

const DEFAULT_GROCERY_IMAGE = '/images/fruit_veg_box.jpg';

/**
 * Normalizes an image path to work seamlessly in all router / nested URL configurations.
 */
export function getProductImagePath(imagePath?: string): string {
  if (!imagePath) return DEFAULT_GROCERY_IMAGE;
  
  // If it's already an external absolute URL, return directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Clean up relative paths
  let clean = imagePath.trim();
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  
  return clean;
}

/**
 * Returns a guaranteed local packshot image URL based on product name or category.
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
 * Replaces any broken src with the matching local packshot image.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  productName?: string,
  category?: string
): void {
  const target = e.currentTarget;
  const fallback = getProductFallbackImage(productName, category);
  
  // Avoid infinite loops if fallback is already applied
  if (!target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
