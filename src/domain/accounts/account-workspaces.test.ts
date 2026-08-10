import { describe, expect, it } from "vitest";

import { isAccountWorkspaceRole, sanitizeSeatLimit, WORKSPACE_PERMISSIONS } from "./account-workspaces";

describe("account workspaces", () => {
  it("keeps student and institute permissions separate", () => {
    expect(WORKSPACE_PERMISSIONS.student).not.toEqual(WORKSPACE_PERMISSIONS.institute);
    expect(WORKSPACE_PERMISSIONS.student.join(" ")).not.toContain("roster");
    expect(WORKSPACE_PERMISSIONS.institute.join(" ")).toContain("roster");
  });

  it("validates roles and seat limits", () => {
    expect(isAccountWorkspaceRole("student")).toBe(true);
    expect(isAccountWorkspaceRole("admin")).toBe(false);
    expect(sanitizeSeatLimit(0)).toBe(1);
    expect(sanitizeSeatLimit(99999)).toBe(5000);
  });
});
