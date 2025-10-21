import { allModels, providers } from "@ai-registry/vercel-gateway";
import type { Metadata } from "next";
import { ModelsHeader } from "./models-header";

const totalModels = allModels.length;
const totalProviders = providers.length;

const pageTitle = "Models | AI Registry";
const pageDescription = `Browse ${totalModels} models across ${totalProviders} providers from Vercel AI Gateway. Filter and compare by provider, context window, and pricing.`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "AI Registry",
    "Vercel AI Gateway",
    "models",
    "LLM",
    "AI models",
    "providers",
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const HEADER_HEIGHT = "2.75rem";

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid h-dvh max-h-dvh grid-rows-[auto_1fr]"
      style={
        {
          "--header-height": HEADER_HEIGHT,
        } as React.CSSProperties
      }
    >
      <ModelsHeader />
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
