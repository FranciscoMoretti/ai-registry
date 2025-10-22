"use client";

import type {
  ModelDefinition,
  ModelId,
  ProviderId,
} from "@airegistry/vercel-gateway";
import { ChevronUpIcon, FilterIcon } from "lucide-react";
import {
  type ComponentProps,
  memo,
  startTransition,
  useCallback,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem as UICommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEnabledFeatures } from "@/lib/features-config";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { cn } from "@/lib/utils";

type FeatureFilter = Record<string, boolean>;

// Base interface that both ModelDefinition and AppModelDefinition satisfy
export type ModelDefinitionLike = {
  id: string;
  name: string;
  owned_by: string;
  reasoning?: boolean;
  toolCall?: boolean;
  input?: {
    image?: boolean;
    pdf?: boolean;
    audio?: boolean;
  };
  output?: {
    image?: boolean;
    audio?: boolean;
    text?: boolean;
  };
};

const enabledFeatures = getEnabledFeatures();
const initialFilters = enabledFeatures.reduce<FeatureFilter>((acc, feature) => {
  acc[feature.key] = false;
  return acc;
}, {});

function getFeatureIcons(modelDefinition: ModelDefinitionLike) {
  const features = modelDefinition;

  const icons: React.ReactNode[] = [];

  const enabled = getEnabledFeatures();
  const featureIconMap = [
    {
      key: "functionCalling",
      condition: features.toolCall,
      config: enabled.find((f) => f.key === "functionCalling"),
    },
    {
      key: "imageInput",
      condition: features.input?.image,
      config: enabled.find((f) => f.key === "imageInput"),
    },
    {
      key: "pdfInput",
      condition: features.input?.pdf,
      config: enabled.find((f) => f.key === "pdfInput"),
    },
  ];

  featureIconMap.forEach(({ condition, config }) => {
    if (condition && config) {
      const IconComponent = config.icon;
      icons.push(
        <div
          className="flex items-center"
          key={config.key}
          title={config.description}
        >
          <IconComponent className="h-3 w-3 text-muted-foreground" />
        </div>
      );
    }
  });

  return icons;
}

function PureCommandItem<
  TModelId extends string,
  TModelDefinition extends ModelDefinitionLike,
>({
  id,
  definition,
  disabled,
  isSelected,
  onSelectModel,
}: {
  id: TModelId;
  definition: TModelDefinition;
  disabled?: boolean;
  isSelected: boolean;
  onSelectModel: (id: TModelId) => void;
}) {
  const provider = definition.owned_by as ProviderId;
  const featureIcons = useMemo(() => getFeatureIcons(definition), [definition]);
  const hasReasoning = useMemo(() => definition.reasoning, [definition]);
  const searchValue = useMemo(
    () =>
      `${definition.name} ${hasReasoning ? "reasoning" : ""} ${definition.owned_by} `.toLowerCase(),
    [definition, hasReasoning]
  );

  return (
    <UICommandItem
      className={cn(
        "flex h-9 cursor-pointer items-center justify-between px-3 py-1.5 transition-all",
        isSelected && "border-l-2 border-l-primary bg-primary/10",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onSelect={() => {
        if (disabled) {
          return;
        }
        onSelectModel(id);
      }}
      value={searchValue}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="shrink-0">{getProviderIcon(provider)}</div>
        <span className="flex items-center gap-1.5 truncate font-medium text-sm">
          {definition.name}
          {hasReasoning
            ? (() => {
                const cfg = getEnabledFeatures().find(
                  (f) => f.key === "reasoning"
                );
                if (!cfg) {
                  return null;
                }
                const IconComponent = cfg.icon;
                return (
                  <span
                    className="inline-flex shrink-0 items-center gap-1"
                    title={cfg.description}
                  >
                    <IconComponent className="h-3 w-3 text-muted-foreground" />
                  </span>
                );
              })()
            : null}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {featureIcons.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">{featureIcons}</div>
        )}
      </div>
    </UICommandItem>
  );
}

const CommandItem = memo(
  PureCommandItem as typeof PureCommandItem<string, ModelDefinitionLike>,
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.definition === nextProps.definition
) as typeof PureCommandItem;
function PureModelSelectorPopoverContent<
  TModelId extends string,
  TModelDefinition extends ModelDefinitionLike,
>({
  enableFilters,
  filterOpen,
  onFilterOpenChange,
  activeFilterCount,
  clearFilters,
  featureFilters,
  onUpdateFeatureFilters,
  topContent,
  filteredModels,
  optimisticModelId,
  onSelectModel,
  commandItemComponent: CommandItemComponent,
}: {
  enableFilters: boolean;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  featureFilters: FeatureFilter;
  onUpdateFeatureFilters: (
    updater: (prev: FeatureFilter) => FeatureFilter
  ) => void;
  topContent?: React.ReactNode;
  filteredModels: Array<{
    id: TModelId;
    definition: TModelDefinition;
    disabled?: boolean;
  }>;
  optimisticModelId?: TModelId;
  onSelectModel: (id: TModelId) => void;
  commandItemComponent: (props: {
    id: TModelId;
    definition: TModelDefinition;
    disabled?: boolean;
    isSelected: boolean;
    onSelectModel: (id: TModelId) => void;
  }) => React.ReactNode;
}) {
  const enabledFeatures = getEnabledFeatures();

  return (
    <Command>
      <div className="flex items-center border-b">
        <CommandInput
          className="px-3"
          containerClassName="w-full border-0 h-11"
          placeholder="Search models..."
        />
        {enableFilters && (
          <Popover onOpenChange={onFilterOpenChange} open={filterOpen}>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "relative mr-3 h-8 w-8 p-0",
                  activeFilterCount > 0 && "text-primary"
                )}
                size="sm"
                variant="ghost"
              >
                <FilterIcon className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    className="-top-1 -right-1 absolute flex h-4 min-w-[16px] items-center justify-center p-0 text-xs"
                    variant="secondary"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0">
              <div className="p-4">
                <div className="mb-3 flex h-7 items-center justify-between">
                  <div className="font-medium text-sm">Filter by Tools</div>
                  {activeFilterCount > 0 && (
                    <Button
                      className="h-6 text-xs"
                      onClick={clearFilters}
                      size="sm"
                      variant="ghost"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {enabledFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        className="flex items-center space-x-2"
                        key={feature.key}
                      >
                        <Checkbox
                          checked={featureFilters[feature.key]}
                          id={feature.key}
                          onCheckedChange={(checked) =>
                            onUpdateFeatureFilters((prev) => ({
                              ...prev,
                              [feature.key]: Boolean(checked),
                            }))
                          }
                        />
                        <Label
                          className="flex items-center gap-1.5 text-sm"
                          htmlFor={feature.key}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                          {feature.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {topContent}
      <CommandList
        className="max-h[400px] max-h-[400px]"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <CommandEmpty>No model found.</CommandEmpty>
        <CommandGroup>
          <ScrollArea className="*:data-radix-scroll-area-viewport:max-h-[350px]">
            {filteredModels.map((item) => {
              const { id, definition, disabled } = item;
              const isSelected = id === optimisticModelId;
              return (
                <CommandItemComponent
                  definition={definition}
                  disabled={disabled}
                  id={id}
                  isSelected={isSelected}
                  key={id}
                  onSelectModel={onSelectModel}
                />
              );
            })}
          </ScrollArea>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export const ModelSelectorPopoverContent = memo(
  PureModelSelectorPopoverContent as typeof PureModelSelectorPopoverContent<
    string,
    ModelDefinitionLike
  >
) as typeof PureModelSelectorPopoverContent;

export type ModelSelectorBaseItem<
  TModelId extends string = ModelId,
  TModelDefinition extends ModelDefinitionLike = ModelDefinition,
> = {
  id: TModelId;
  definition: TModelDefinition;
  disabled?: boolean;
};

export function PureModelSelectorBase<
  TModelId extends string = ModelId,
  TModelDefinition extends ModelDefinitionLike = ModelDefinition,
>({
  models,
  selectedModelId,
  onModelChange,
  className,
  placeholder,
  topContent,
  enableFilters = true,
  initialChevronDirection = "up",
}: {
  models: ModelSelectorBaseItem<TModelId, TModelDefinition>[];
  selectedModelId?: TModelId;
  onModelChange?: (modelId: TModelId) => void;
  placeholder?: string;
  topContent?: React.ReactNode;
  enableFilters?: boolean;
  initialChevronDirection?: "up" | "down";
} & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const [featureFilters, setFeatureFilters] =
    useState<FeatureFilter>(initialFilters);

  const filteredModels = useMemo(() => {
    const hasActiveFilters =
      enableFilters && Object.values(featureFilters).some(Boolean);
    if (!hasActiveFilters) {
      return models;
    }
    return models.filter((item) => {
      const features = item.definition;
      if (!features) {
        return false;
      }
      return Object.entries(featureFilters).every(([key, isActive]) => {
        if (!isActive) {
          return true;
        }
        switch (key) {
          case "reasoning":
            return features.reasoning;
          case "functionCalling":
            return features.toolCall;
          case "imageInput":
            return features.input?.image;
          case "pdfInput":
            return features.input?.pdf;
          case "audioInput":
            return features.input?.audio;
          case "imageOutput":
            return features.output?.image;
          case "audioOutput":
            return features.output?.audio;
          default:
            return true;
        }
      });
    });
  }, [models, featureFilters, enableFilters]);

  const selectedItem = useMemo(
    () => models.find((m) => m.id === optimisticModelId),
    [models, optimisticModelId]
  );

  const selectedProviderIcon = useMemo(() => {
    if (!selectedItem) {
      return null;
    }
    const provider = selectedItem.definition.owned_by as ProviderId;
    return getProviderIcon(provider);
  }, [selectedItem]);

  const reasoningFeatureConfig = useMemo(
    () => getEnabledFeatures().find((f) => f.key === "reasoning"),
    []
  );

  const activeFilterCount = useMemo(
    () => Object.values(featureFilters).filter(Boolean).length,
    [featureFilters]
  );

  const clearFilters = () => setFeatureFilters(initialFilters);

  const selectModel = useCallback(
    (id: TModelId) => {
      startTransition(() => {
        setOptimisticModelId(id);
        onModelChange?.(id);
        setOpen(false);
      });
    },
    [onModelChange, setOptimisticModelId]
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("flex justify-between gap-2 md:px-2", className)}
          data-testid="model-selector"
          role="combobox"
          variant="ghost"
        >
          <div className="flex items-center gap-2">
            {selectedProviderIcon && (
              <div className="shrink-0">{selectedProviderIcon}</div>
            )}
            <p className="inline-flex items-center gap-1.5 truncate">
              {selectedItem?.definition.name || placeholder || "Select model"}
              {selectedItem?.definition.reasoning && reasoningFeatureConfig
                ? (() => {
                    const IconComponent = reasoningFeatureConfig.icon;
                    return (
                      <span
                        className="inline-flex shrink-0 items-center gap-1"
                        title={reasoningFeatureConfig.description}
                      >
                        <IconComponent className="h-3 w-3 text-muted-foreground" />
                      </span>
                    );
                  })()
                : null}
            </p>
          </div>
          <ChevronUpIcon
            className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform",
              (initialChevronDirection === "up") === open && "rotate-180"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[350px] p-0">
        {open ? (
          <ModelSelectorPopoverContent
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            commandItemComponent={CommandItem}
            enableFilters={enableFilters}
            featureFilters={featureFilters}
            filteredModels={filteredModels}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            onSelectModel={selectModel}
            onUpdateFeatureFilters={setFeatureFilters}
            optimisticModelId={optimisticModelId}
            topContent={topContent}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export const ModelSelectorBase = memo(
  PureModelSelectorBase as typeof PureModelSelectorBase<
    string,
    ModelDefinitionLike
  >,
  (prevProps, nextProps) =>
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.className === nextProps.className &&
    prevProps.onModelChange === nextProps.onModelChange &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.models === nextProps.models &&
    prevProps.enableFilters === nextProps.enableFilters
) as typeof PureModelSelectorBase;
