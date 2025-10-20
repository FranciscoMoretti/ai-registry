"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useModels } from "../models-store-context";

export const PureEmptyState = memo(function PureEmptyState() {
  const reset = useModels((s) => s.resetFiltersAndSearch);

  return (
    <div className="py-12 text-center">
      <p className="mb-4 text-muted-foreground">
        No models found matching your criteria.
      </p>
      <Button onClick={reset} variant="outline">
        Clear all filters
      </Button>
    </div>
  );
});
