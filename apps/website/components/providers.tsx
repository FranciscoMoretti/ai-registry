"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

type ProvidersProps = {
  children: ReactNode;
};

export function   Providers({ children }: ProvidersProps) {
  return (
    <NuqsAdapter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </NuqsAdapter>
  );
}
