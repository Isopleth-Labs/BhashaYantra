export type ProductTier = "free" | "pro" | "institution";

export type ProductFeature =
  | "smart-typing"
  | "classic-typing"
  | "basic-text-conversion"
  | "starter-lessons"
  | "advanced-layouts"
  | "custom-layout-studio"
  | "full-exam-library"
  | "advanced-analytics"
  | "document-conversion"
  | "cloud-sync"
  | "stenography"
  | "admin-dashboard"
  | "managed-seat-licensing";

const FREE_FEATURES: readonly ProductFeature[] = [
  "smart-typing",
  "classic-typing",
  "basic-text-conversion",
  "starter-lessons",
];

const PRO_FEATURES: readonly ProductFeature[] = [
  ...FREE_FEATURES,
  "advanced-layouts",
  "custom-layout-studio",
  "full-exam-library",
  "advanced-analytics",
  "document-conversion",
  "cloud-sync",
  "stenography",
];

const INSTITUTION_FEATURES: readonly ProductFeature[] = [
  ...PRO_FEATURES,
  "admin-dashboard",
  "managed-seat-licensing",
];

export const PRODUCT_ENTITLEMENTS: Readonly<Record<ProductTier, readonly ProductFeature[]>> = {
  free: FREE_FEATURES,
  pro: PRO_FEATURES,
  institution: INSTITUTION_FEATURES,
};

export function hasEntitlement(tier: ProductTier, feature: ProductFeature) {
  return PRODUCT_ENTITLEMENTS[tier].includes(feature);
}
