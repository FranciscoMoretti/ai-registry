"use client";
import { ModelDetailsCard } from "@/app/(models)/compare/model-details-card";
import { ModelSelectorBase } from "@/components/model-selector-base";
import type { ModelData } from "@/lib/ai/model-data";
import { cn } from "@/lib/utils";
import { useModels } from "./models-store-context";

export function ModelDetails({
  className,
  modelDefinition,
  onModelChangeAction,
  enabledActions,
}: {
  className?: string;
  modelDefinition: ModelData | null;
  onModelChangeAction: (nextId: string) => void;
  enabledActions?: {
    goToModel?: boolean;
    compare?: boolean;
  };
}) {
  const allModels = useModels.useAllModels();
  return (
    <div
      className={cn("mb-6 flex w-full max-w-[450px] flex-col gap-4", className)}
    >
      <div className="flex items-center gap-2">
        <ModelSelectorBase
          className="h-9 w-fit shrink grow truncate border bg-card text-base"
          enableFilters
          initialChevronDirection="down"
          models={allModels.map((m) => ({
            id: m.id,
            definition: m,
          }))}
          onModelChange={onModelChangeAction}
          selectedModelId={modelDefinition?.id}
        />
      </div>
      <ModelDetailsCard
        enabledActions={enabledActions}
        model={modelDefinition}
      />
    </div>
  );
}
