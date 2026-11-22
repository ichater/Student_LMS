import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
  findById: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/services/consultation.service", () => {
  class ConsultationStateError extends Error {
    constructor(public readonly code: string, message: string) {
      super(message);
    }
  }

  class ConsultationService {
    findById = mocks.findById;
    patch = mocks.patch;
  }

  return { ConsultationService, ConsultationStateError };
});

import { GET, PATCH } from "./route";

const context = (id: string) => ({ params: Promise.resolve({ id }) });
const consultationId = "9ddc4ef7-0b5d-4e71-a8d7-bd0a3f40dc12";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({});
});

describe("individual consultation routes", () => {
  it("returns 401 for unauthenticated reads", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context(consultationId));

    expect(response.status).toBe(401);
  });

  it("returns 404 for an unknown or cross-user consultation", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });
    mocks.findById.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context(consultationId));

    expect(response.status).toBe(404);
    expect(mocks.findById).toHaveBeenCalledWith("student-1", consultationId);
  });

  it("returns 422 for a past reschedule time", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });

    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: "2020-01-01T10:00:00Z" }),
    }), context(consultationId));

    expect(response.status).toBe(422);
  });

  it("passes exactly one status operation to the service", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });
    mocks.patch.mockResolvedValue({ id: consultationId, status: "completed" });

    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    }), context(consultationId));

    expect(response.status).toBe(200);
    expect(mocks.patch).toHaveBeenCalledWith("student-1", consultationId, { status: "completed" });
  });

  it("returns 409 for an invalid state transition", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "student-1" });

    const { ConsultationStateError } = await import("@/services/consultation.service");
    mocks.patch.mockRejectedValue(new ConsultationStateError("INVALID_STATUS_TRANSITION", "This status change is not allowed"));

    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }), context(consultationId));

    expect(response.status).toBe(409);
  });
});
