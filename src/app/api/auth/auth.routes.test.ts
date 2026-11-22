import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { POST as register } from "./register/route";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({
    auth: {
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
  });
});

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("authentication routes", () => {
  it("registers an account without accepting a role", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: { id: "student-1" } },
      error: null,
    });

    const response = await register(jsonRequest("http://localhost/api/auth/register", {
      email: "student@example.com",
      password: "password123",
      role: "admin",
    }));

    expect(response.status).toBe(201);
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "password123",
    });
  });

  it("rejects invalid registration input", async () => {
    const response = await register(jsonRequest("http://localhost/api/auth/register", {
      email: "not-an-email",
      password: "short",
    }));

    expect(response.status).toBe(422);
  });

  it("returns the trusted admin role after login", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin" } } },
      error: null,
    });

    const response = await login(jsonRequest("http://localhost/api/auth/login", {
      email: "admin@example.com",
      password: "password123",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { role: "admin" },
    });
  });

  it("returns an authentication error for invalid credentials", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const response = await login(jsonRequest("http://localhost/api/auth/login", {
      email: "student@example.com",
      password: "wrong-password",
    }));

    expect(response.status).toBe(401);
  });

  it("logs out through Supabase Auth", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    const response = await logout();

    expect(response.status).toBe(200);
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
