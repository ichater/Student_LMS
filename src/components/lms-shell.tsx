import type { ReactNode } from "react";
import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";

interface LmsShellProps {
  children: ReactNode;
}

export function LmsShell({ children }: LmsShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#18212f]">
      <header className="border-b border-[#dfe5ea] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#176b54] text-sm text-white">
              C
            </span>
            <span>Contour LMS</span>
          </Link>

          <AccountNavigation />
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
