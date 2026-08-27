import React from 'react';

/**
 * Product Image Resolution & Fallback Engine
 * Uses the authentic packshot images uploaded by the user stored in /public/images/.
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
 * Normalizes an image path to work seamlessly across root, relative, or nested routing URLs.
 */
export function getProductImagePath(imagePath?: string): string {
  if (!imagePath) return DEFAULT_GROCERY_IMAGE;
  
  // If it's already an external absolute URL, return directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
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
 * Returns the exact authentic photo image URL based on product name or category.
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
 * Helper to handle image error events on <img> elements.
 * Replaces any broken src with the matching real packshot photo from /public/images/.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  productName?: string,
  category?: string
): void {
  const target = e.currentTarget;
  const fallbackPath = getProductFallbackImage(productName, category);
  
  if (target.src !== fallbackPath && !target.src.endsWith(fallbackPath)) {
    target.src = fallbackPath;
  }
}
