import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  isAdmin: vi.fn(),
  createClient: vi.fn(),
  listAll: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  isAdmin: mocks.isAdmin,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/services/consultation.service", () => ({
  ConsultationService: class {
    listAll = mocks.listAll;
  },
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({});
});

describe("GET /api/admin/consultations", () => {
  it("returns 401 for an unauthenticated request", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 403 for a student", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1", app_metadata: { role: "student" } });
    mocks.isAdmin.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it("lists every consultation for an administrator", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "admin-1", app_metadata: { role: "admin" } });
    mocks.isAdmin.mockReturnValue(true);
    mocks.listAll.mockResolvedValue([{ id: "consultation-1" }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.listAll).toHaveBeenCalledOnce();
  });
});
