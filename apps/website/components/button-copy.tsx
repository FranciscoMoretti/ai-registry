"use client";

import { Check, Copy } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonCopyProps = {
  code: string;
  className?: string;
};

export function ButtonCopy({ code, className }: ButtonCopyProps) {
  const [copied, setCopied] = useState(false);
  const COPY_RESET_MS = 2000 as const;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("Model ID copied to clipboard", { description: code });
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // Swallow error to avoid noisy UI in production
    }
  };

  return (
    <Button
      aria-label="Copy model id"
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handleCopy();
      }}
      size="sm"
      type="button"
      variant="ghost"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
    </Button>
  );
}
