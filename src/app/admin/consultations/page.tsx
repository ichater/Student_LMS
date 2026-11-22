import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminConsultations } from "@/components/admin-consultations";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Consultations | Contour LMS",
  description: "Review all consultations across Contour LMS",
};

export const instant = false;

export default async function AdminConsultationsPage() {
  await connection();
  const user = await getAuthenticatedUser();

  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  return <AdminConsultations />;
}
