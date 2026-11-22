import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ConsultationDashboard } from "@/components/consultation-dashboard";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard | Contour LMS",
  description: "View and manage your consultations",
};

export const instant = false;

export default async function DashboardPage() {
  await connection();
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (isAdmin(user)) {
    redirect("/admin/consultations");
  }

  return <ConsultationDashboard />;
}
