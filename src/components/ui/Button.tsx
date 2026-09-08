import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-bas-primary text-bas-on-primary hover:bg-bas-primary-active disabled:bg-bas-primary-disabled disabled:text-bas-muted",
  secondary:
    "bg-bas-card text-bas-body hover:bg-bas-elevated border border-bas-hairline",
  ghost: "bg-transparent text-bas-body hover:bg-bas-card",
  danger: "bg-bas-down text-white hover:opacity-90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = `inline-flex h-10 items-center justify-center rounded-[6px] px-6 text-sm font-semibold transition-colors ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
