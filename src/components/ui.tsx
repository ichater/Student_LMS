import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Eyebrow({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm font-semibold text-[#176b54] ${className}`} {...props} />;
}

export function PageTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={`mt-2 text-3xl font-semibold tracking-tight ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`font-semibold ${className}`} {...props} />;
}

interface MutedTextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: "default" | "error";
}

export function MutedText({ className = "", tone = "default", ...props }: MutedTextProps) {
  const textColor = tone === "error" ? "text-[#765050]" : "text-[#607080]";
  return <p className={`text-sm ${textColor} ${className}`} {...props} />;
}

export function ErrorTitle({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`font-semibold text-[#963e3e] ${className}`} {...props} />;
}

export function ConsultationReason({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-3 text-sm leading-6 text-[#607080] ${className}`} {...props} />;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "dangerMuted";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  weight?: "medium" | "semibold";
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[#176b54] text-white hover:bg-[#11543f]",
  secondary: "border border-[#ccd5dc] hover:border-[#176b54]",
  danger: "border border-[#dfbebe] text-[#963e3e] hover:border-[#963e3e]",
  dangerMuted: "border border-[#cdaaaa] text-[#963e3e] hover:border-[#963e3e]",
};

const buttonSizes: Record<ButtonSize, string> = {
  small: "px-3 py-2",
  medium: "px-4 py-2.5",
  large: "px-4 py-3",
};

export function Button({
  children,
  className = "",
  variant = "secondary",
  size = "small",
  weight = "semibold",
  ...props
}: ButtonProps) {
  const fontWeight = weight === "medium" ? "font-medium" : "font-semibold";

  return (
    <button
      className={`cursor-pointer rounded-md text-sm ${fontWeight} disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
