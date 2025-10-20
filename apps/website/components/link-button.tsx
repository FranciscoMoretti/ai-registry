import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import type * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LinkButton({
  className,
  variant,
  size,
  href,
  disabled,
  children,
  ...props
}: {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  href: string;
  disabled?: boolean;
  children?: React.ReactNode;
  props?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}) {
  return (
    <Link
      aria-disabled={disabled}
      className={cn(
        buttonVariants({ variant, size, className }),
        disabled && "pointer-events-none opacity-50"
      )}
      href={href}
      tabIndex={disabled ? -1 : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}

export { LinkButton };
