import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth/session";

export const instant = false;

export default async function Home() {
  await connection();
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(isAdmin(user) ? "/admin/consultations" : "/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase text-[#176b54]">Contour LMS</p>
        <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Consultation planning, without the paperwork.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#607080]">
          Students can book, review, complete, and reschedule consultations. Administrators can review activity across the system.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-md bg-[#176b54] px-5 py-3 text-sm font-semibold text-white hover:bg-[#11543f]">
            Sign in
          </Link>
          <Link href="/register" className="rounded-md border border-[#ccd5dc] bg-white px-5 py-3 text-sm font-semibold hover:border-[#176b54] hover:text-[#176b54]">
            Create account
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-4 border-t border-[#dfe5ea] pt-8 sm:grid-cols-3">
        <article>
          <p className="text-sm font-semibold">For students</p>
          <p className="mt-2 text-sm leading-6 text-[#607080]">Create consultations and manage their dates and status.</p>
        </article>
        <article>
          <p className="text-sm font-semibold">For administrators</p>
          <p className="mt-2 text-sm leading-6 text-[#607080]">Review consultation records across the LMS.</p>
        </article>
        <article>
          <p className="text-sm font-semibold">Secure by default</p>
          <p className="mt-2 text-sm leading-6 text-[#607080]">Supabase authentication and PostgreSQL ownership rules.</p>
        </article>
      </div>
    </div>
  );
}
