// Package categories available in the system
export const PACKAGE_CATEGORIES = [
  "HIDROTERAPIA",
  "CUMPLE_MES",
  "GRUPAL",
] as const;

export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number];
