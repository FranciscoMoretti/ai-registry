"use client";

import { useModels } from "@/app/(models)/models/models-store-context";

export function ModelResultsCount() {
  const count = useModels((s) => s.resultModels().length);
  return (
    <div className="text-muted-foreground text-sm">{count} models found</div>
  );
}
