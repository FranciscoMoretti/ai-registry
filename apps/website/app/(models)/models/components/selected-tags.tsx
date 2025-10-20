"use client";

import { X } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";

export const PureSelectedTags = memo(function PureSelectedTags({
  selectedModelIds,
  resolveLabel,
  onRemove,
}: {
  selectedModelIds: string[];
  resolveLabel: (id: string) => string | null;
  onRemove: (id: string) => void;
}) {
  if (selectedModelIds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">
        Selected for comparison:
      </span>
      {selectedModelIds.map((modelId) => {
        const label = resolveLabel(modelId);
        if (!label) {
          return null;
        }
        return (
          <Badge className="gap-1" key={modelId} variant="secondary">
            {label}
            <button
              aria-label={`Remove ${label}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onRemove(modelId)}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
});
