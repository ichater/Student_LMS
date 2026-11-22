import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create account | Contour LMS",
  description: "Create a Contour LMS student account",
};

export const instant = false;

export default async function RegisterPage() {
  await connection();
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(isAdmin(user) ? "/admin/consultations" : "/dashboard");
  }

  return <AuthForm mode="register" />;
}
