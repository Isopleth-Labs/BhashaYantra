export const LEGAL_EFFECTIVE_DATE = "12 August 2026";
export const SUPPORT_ISSUES_URL = "https://github.com/Isopleth-Labs/BhashaYantra/issues";
export const SECURITY_REPORT_URL = "https://github.com/Isopleth-Labs/BhashaYantra/security/advisories";
export const SOURCE_REPOSITORY_URL = "https://github.com/Isopleth-Labs/BhashaYantra";

export interface LegalDocumentSection {
  readonly heading: string;
  readonly body: string;
}

export interface LegalDocument {
  readonly id: "privacy" | "terms";
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly LegalDocumentSection[];
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    summary: "What stays on your device, what cloud features receive, and how you control your data.",
    sections: [
      {
        heading: "Local-first data",
        body: "Typing drafts, preferences, local lesson progress, and local test results are stored on this device. BhashaYantra does not upload typed content merely because you use the typing, practice, test, or stenography workspaces.",
      },
      {
        heading: "Optional online services",
        body: "Account sign-in, institute sync, cloud translation, and future paid services require a deliberate online action. Only the information needed for the selected feature is sent to its configured provider. Provider use is identified before the action is available.",
      },
      {
        heading: "Accounts and retention",
        body: "Supabase Auth stores account identity and server-synced workspace data when login is enabled. Per-device licensing sends a SHA-256 digest of a random installation id, a generic label, and timestamps—not a hardware serial or browser fingerprint. Local backups exclude authentication sessions.",
      },
      {
        heading: "Your controls",
        body: "Data & privacy settings let you export or restore local BhashaYantra data. You can sign out at any time. Contact support for a cloud-account access or deletion request once production login is enabled.",
      },
    ],
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    summary: "Rules for beta software, accounts, exam simulations, and acceptable use.",
    sections: [
      {
        heading: "Beta software",
        body: "This build is a pre-release beta candidate. Features, data formats, compatibility profiles, and availability may change. Keep a current local backup before upgrading.",
      },
      {
        heading: "Exam preparation",
        body: "Exam profiles are practice simulations, not recruitment authorities. Linked official notices remain the final source for duration, keyboard layout, scoring, eligibility, and current rules.",
      },
      {
        heading: "User content and conduct",
        body: "You retain responsibility for text, documents, audio, and account information you provide. Personal ₹149, ₹349, and Individual Pro access is one named user on one registered device. Institutes use purchased capacity and separate member accounts; do not share one personal login across a lab or bypass access controls.",
      },
      {
        heading: "Compatibility and availability",
        body: "Unicode fonts change display, while legacy profiles change encoding. Compatibility labels state the validation level for each layout or converter. No unverified profile is represented as officially certified.",
      },
    ],
  },
] as const;
