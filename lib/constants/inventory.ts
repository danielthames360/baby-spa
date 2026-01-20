// Product categories available in the system
export const PRODUCT_CATEGORIES = [
  "DIAPERS",
  "OILS",
  "CREAMS",
  "TOWELS",
  "ACCESSORIES",
  "OTHER",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
