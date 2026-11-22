"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ApiError, ApiSuccess } from "@/types/api";
import { notifyAuthStateChanged } from "@/lib/auth/navigation";
import { Button, Eyebrow, MutedText, PageTitle } from "@/components/ui";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ApiError;
        setErrorMessage(body.errors?.[0]?.message ?? body.message);
        return;
      }

      if (mode === "register") {
        setSuccessMessage("Account created. You can now sign in.");
        event.currentTarget.reset();
        return;
      }

      const body = (await response.json()) as ApiSuccess<{ role: "student" | "admin" }>;
      notifyAuthStateChanged();
      router.push(body.data.role === "admin" ? "/admin/consultations" : "/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const registration = mode === "register";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5 py-12">
      <div className="w-full">
        <Eyebrow>{registration ? "Create account" : "Student and admin access"}</Eyebrow>
        <PageTitle>
          {registration ? "Register for Contour LMS" : "Sign in to Contour LMS"}
        </PageTitle>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-[#ccd5dc] bg-white px-3 py-3 outline-none focus:border-[#176b54]"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={registration ? 8 : 1}
              autoComplete={registration ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-md border border-[#ccd5dc] bg-white px-3 py-3 outline-none focus:border-[#176b54]"
            />
          </label>

          {successMessage ? (
            <p role="status" className="rounded-md border border-[#acd1c4] bg-[#f1faf6] px-3 py-2 text-sm text-[#176b54]">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p role="alert" className="rounded-md border border-[#e4b8b8] bg-[#fff7f7] px-3 py-2 text-sm text-[#9a3030]">
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            size="large"
            className="w-full"
          >
            {submitting ? "Please wait" : registration ? "Create account" : "Sign in"}
          </Button>
        </form>

        <MutedText className="mt-5">
          {registration ? "Already have an account? " : "New to Contour LMS? "}
          <Link href={registration ? "/login" : "/register"} className="font-semibold text-[#176b54]">
            {registration ? "Sign in" : "Create account"}
          </Link>
        </MutedText>
      </div>
    </section>
  );
}
