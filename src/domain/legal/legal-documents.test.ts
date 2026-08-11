import { describe, expect, it } from "vitest";

import {
  LEGAL_DOCUMENTS,
  LEGAL_EFFECTIVE_DATE,
  SECURITY_REPORT_URL,
  SOURCE_REPOSITORY_URL,
  SUPPORT_ISSUES_URL,
} from "./legal-documents";

describe("legal document manifest", () => {
  it("ships one versioned privacy policy and one terms document", () => {
    expect(LEGAL_DOCUMENTS.map((document) => document.id)).toEqual(["privacy", "terms"]);
    expect(LEGAL_DOCUMENTS.every((document) => document.sections.length >= 4)).toBe(true);
    expect(LEGAL_EFFECTIVE_DATE).toMatch(/2026/);
  });

  it("uses HTTPS for public support destinations", () => {
    expect(SUPPORT_ISSUES_URL).toMatch(/^https:\/\//);
    expect(SECURITY_REPORT_URL).toMatch(/^https:\/\//);
    expect(SOURCE_REPOSITORY_URL).toMatch(/^https:\/\//);
  });
});
