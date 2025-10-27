"use client";
import type { ModelDefinition } from "@airegistry/vercel-gateway";
import { allModels, getModelDefinition } from "@airegistry/vercel-gateway";
import { ModelDetailsCard } from "@/app/(models)/compare/model-details-card";
import { ChatModelButton } from "@/components/model-action-buttons";
import { ModelSelectorBase } from "@/components/model-selector-base";
import { cn } from "@/lib/utils";

export function ModelDetails({
  className,
  modelDefinition,
  onModelChangeAction,
  enabledActions,
}: {
  className?: string;
  modelDefinition: ModelDefinition | null;
  onModelChangeAction: (nextId: string) => void;
  enabledActions?: {
    goToModel?: boolean;
    chat?: boolean;
    compare?: boolean;
  };
}) {
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
            definition: getModelDefinition(m.id),
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
