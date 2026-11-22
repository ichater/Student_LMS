import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { LmsShell } from "@/components/lms-shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Contour LMS",
  description: "Consultation management for students and administrators",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full antialiased`}>
        <LmsShell>{children}</LmsShell>
      </body>
    </html>
  );
}
