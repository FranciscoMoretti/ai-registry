"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"div">) {
  return (
    <div className={cn("container mx-auto max-w-4xl", className)} {...props}>
      {children}
    </div>
  );
}
