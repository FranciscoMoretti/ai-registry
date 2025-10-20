import type { Metadata } from "next";
import { ModelFilters } from "@/app/(models)/models/model-filters";
import { ModelsProvider } from "@/app/(models)/models/models-store-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModelsResults } from "./models/models-results";

const pageTitle = "Models | AI Registry";
const pageDescription =
  "Browse models across providers form Vercel AI Gateway. Filter and compare by provider, context window, and pricing.";

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

export default function HomePage() {
  return (
    <ModelsProvider>
      <ModelsPageContent />
    </ModelsProvider>
  );
}

function ModelsPageContent() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[auto_1fr]">
      <aside className="hidden min-h-0 w-full bg-sidebar md:block md:h-full md:w-64">
        <ScrollArea className="h-full">
          <ModelFilters className="overflow-y-auto p-4" />
        </ScrollArea>
      </aside>

      <main className="h-full min-h-0">
        <ModelsResults />
      </main>
    </div>
  );
}
