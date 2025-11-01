"use client";

import { memo } from "react";
import { useModels } from "@/app/(models)/models/models-store-context";
import { Button } from "@/components/ui/button";

export const PureEmptyState = memo(function PureEmptyState() {
  const reset = useModels.useResetFiltersAndSearch();

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
