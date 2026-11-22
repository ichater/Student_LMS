"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRoleLandingPage,
  notifyAuthStateChanged,
  subscribeToAuthStateChanges,
  type AppRole,
} from "@/lib/auth/navigation";
import { Button } from "@/components/ui";

export function AccountNavigation() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshRole() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = response.ok
          ? (await response.json()) as { data?: { role?: AppRole } }
          : null;
        if (active) setRole(body?.data?.role ?? null);
      } catch {
        if (active) setRole(null);
      } finally {
        if (active) setChecking(false);
      }
    }

    void refreshRole();
    const unsubscribe = subscribeToAuthStateChanges(() => void refreshRole());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) return;

      setRole(null);
      notifyAuthStateChanged();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (checking) {
    return <nav aria-label="Account navigation" />;
  }

  if (role) {
    return (
      <nav className="flex items-center gap-5 text-sm" aria-label="Primary navigation">
        <Link href={getRoleLandingPage(role)} className="hover:text-[#176b54]">
          {role === "admin" ? "Consultations" : "Dashboard"}
        </Link>
        <Button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          variant="secondary"
          size="small"
          weight="medium"
          className="hover:text-[#176b54]"
        >
          {signingOut ? "Signing out" : "Sign out"}
        </Button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm" aria-label="Account navigation">
      <Link href="/login" className="font-medium hover:text-[#176b54]">
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-md bg-[#176b54] px-3 py-2 font-medium text-white hover:bg-[#11543f]"
      >
        Register
      </Link>
    </nav>
  );
}
