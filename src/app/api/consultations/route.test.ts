import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
  listForUser: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/services/consultation.service", () => ({
  ConsultationService: class {
    listForUser = mocks.listForUser;
    create = mocks.create;
  },
}));

import { GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({});
});

describe("GET /api/consultations", () => {
  it("returns 401 for an unauthenticated request", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "UNAUTHORIZED",
    });
  });

  it("lists consultations for the authenticated student", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });
    mocks.listForUser.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.listForUser).toHaveBeenCalledWith("student-1");
  });
});

describe("POST /api/consultations", () => {
  it("rejects malformed JSON", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });

    const response = await POST(new Request("http://localhost/api/consultations", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(400);
  });

  it("rejects past consultation times", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });

    const response = await POST(new Request("http://localhost/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Ada",
        last_name: "Lovelace",
        reason: "Course planning",
        scheduled_at: "2020-01-01T10:00:00Z",
      }),
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      errors: [{ field: "scheduled_at", message: "Choose a future date and time" }],
    });
  });

  it("creates a consultation for the authenticated student", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });
    mocks.create.mockResolvedValue({ id: "consultation-1", status: "booked" });

    const response = await POST(new Request("http://localhost/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Ada",
        last_name: "Lovelace",
        reason: "Course planning",
        scheduled_at: "2099-01-01T10:00:00Z",
      }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith("student-1", expect.objectContaining({
      first_name: "Ada",
      last_name: "Lovelace",
    }));
  });
});
