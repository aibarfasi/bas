import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  target?: string;
  children: ReactNode;
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-[8px] px-2.5 text-xs font-medium",
  md: "h-10 gap-2 rounded-[8px] px-4 text-sm font-semibold",
};

const styles: Record<Variant, string> = {
  primary:
    "bg-bas-primary text-bas-on-primary hover:bg-bas-primary-active disabled:bg-bas-primary-disabled disabled:text-bas-muted",
  secondary:
    "border border-bas-hairline bg-bas-field text-bas-heading hover:border-bas-muted hover:bg-bas-elevated disabled:opacity-50",
  ghost: "text-bas-body hover:bg-bas-field hover:text-bas-heading disabled:opacity-50",
  danger:
    "border border-bas-down/40 bg-bas-down/10 text-bas-down hover:border-bas-down hover:bg-bas-down hover:text-white disabled:opacity-50",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  target,
  className = "",
  children,
  type,
  ...rest
}: Props) {
  const cls = `inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bas-primary/40 disabled:cursor-not-allowed ${sizes[size]} ${styles[variant]} ${className}`;
  const ext = href?.startsWith("http") || href?.startsWith("mailto:");
  if (href) {
    if (ext) {
      return (
        <a href={href} target={target ?? "_blank"} rel="noreferrer" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} target={target} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}
