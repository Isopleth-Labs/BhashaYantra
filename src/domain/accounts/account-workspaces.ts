export type AccountWorkspaceRole = "student" | "institute";

export interface StudentWorkspaceProfile {
  readonly displayName: string;
  readonly candidateId: string;
  readonly targetExam: string;
  readonly studyLanguage: "hi" | "en";
}

export interface InstituteWorkspaceProfile {
  readonly instituteName: string;
  readonly instituteCode: string;
  readonly administratorName: string;
  readonly seatLimit: number;
}

export const STUDENT_WORKSPACE_KEY = "bhashayantra:account:student-v1";
export const INSTITUTE_WORKSPACE_KEY = "bhashayantra:account:institute-v1";
export const ACTIVE_WORKSPACE_ROLE_KEY = "bhashayantra:account:role-v1";

export const DEFAULT_STUDENT_WORKSPACE: StudentWorkspaceProfile = {
  displayName: "",
  candidateId: "",
  targetExam: "SSC Stenographer",
  studyLanguage: "hi",
};

export const DEFAULT_INSTITUTE_WORKSPACE: InstituteWorkspaceProfile = {
  instituteName: "",
  instituteCode: "",
  administratorName: "",
  seatLimit: 25,
};

export const WORKSPACE_PERMISSIONS = {
  student: [
    "Personal practice plan",
    "Private attempts and result reports",
    "Personal typing and stenography settings",
  ],
  institute: [
    "Student roster and batches",
    "Institute assignments and lab defaults",
    "Server-verified institute reports",
  ],
} as const satisfies Record<AccountWorkspaceRole, readonly string[]>;

export function isAccountWorkspaceRole(value: unknown): value is AccountWorkspaceRole {
  return value === "student" || value === "institute";
}

export function sanitizeSeatLimit(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_INSTITUTE_WORKSPACE.seatLimit;
  return Math.min(5000, Math.max(1, Math.round(value)));
}

export function readStoredObject<T>(key: string, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}
