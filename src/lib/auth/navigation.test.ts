import { describe, expect, it } from "vitest";
import { getRoleLandingPage } from "./navigation";

describe("getRoleLandingPage", () => {
  it("routes administrators to the all-consultations page", () => {
    expect(getRoleLandingPage("admin")).toBe("/admin/consultations");
  });

  it("routes students to the student dashboard", () => {
    expect(getRoleLandingPage("student")).toBe("/dashboard");
  });
});
