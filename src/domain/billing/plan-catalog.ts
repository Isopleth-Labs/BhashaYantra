export type PlanId = "exam-30" | "exam-90" | "pro-annual" | "institution";

export interface PlanCatalogItem {
  readonly id: PlanId;
  readonly name: string;
  readonly description: string;
  readonly priceLabel: string;
  readonly cadence: string;
  readonly badge?: string;
  readonly features: readonly string[];
}

export const DEVELOPMENT_PLAN_CATALOG: readonly PlanCatalogItem[] = [
  {
    id: "exam-30",
    name: "30-day Exam Pass",
    description: "A focused sprint for an upcoming typing or stenography exam.",
    priceLabel: "₹149",
    cadence: "one-time preview",
    features: ["Complete exam simulator", "All practice lessons", "Offline attempt analytics"],
  },
  {
    id: "exam-90",
    name: "90-day Exam Pass",
    description: "A full preparation cycle with enough time to build accuracy and speed.",
    priceLabel: "₹349",
    cadence: "one-time preview",
    badge: "Most practical",
    features: ["Everything in 30-day Pass", "Stenography Studio", "Advanced progress reports"],
  },
  {
    id: "pro-annual",
    name: "Individual Pro",
    description: "The complete BhashaYantra workstation for regular professional use.",
    priceLabel: "₹799",
    cadence: "annual preview",
    badge: "Best value",
    features: ["All layouts and converters", "Custom Layout Studio", "Cloud backup when available"],
  },
  {
    id: "institution",
    name: "Institution",
    description: "Managed seats, reporting, and deployment support for training centres.",
    priceLabel: "Custom",
    cadence: "contact sales",
    features: ["Managed student seats", "Instructor reporting", "Deployment assistance"],
  },
] as const;

export const BILLING_RELEASE_STATUS = {
  purchasable: false,
  label: "Checkout preview",
  message: "Secure billing is not connected in this development build. No payment will be collected.",
} as const;
