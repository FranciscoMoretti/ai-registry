"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useModels } from "@/app/(models)/models/models-store-context";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LogRangeSlider } from "@/components/ui/log-range-slider";
import { formatNumberCompact } from "@/lib/format-number-compact";
import { MODEL_CATEGORIES } from "@/lib/model-explorer/model-categories";
import { cn } from "@/lib/utils";

const roundTokens = (v: number) => Math.max(0, Math.round(v / 1000) * 1000);
const roundCents = (v: number) => Math.max(0, Math.round(v * 100) / 100);
const formatPrice = (v: number) => (v <= 0 ? "FREE" : `$${v.toFixed(2)}`);

export type FilterState = {
  inputModalities: string[];
  outputModalities: string[];
  contextLength: [number, number];
  inputPricing: [number, number];
  outputPricing: [number, number];
  maxTokens: [number, number];
  providers: string[];
  features: {
    reasoning?: boolean;
    toolCall?: boolean;
  };
  // legacy fields kept for compatibility
  series: string[];
  categories: string[];
  supportedParameters: string[];
};

function InputModalitiesFilter() {
  const inputModalities = useModels.useInputModalities();
  const setInputModalities = useModels.useSetInputModalities();
  const toggle = (modality: string, checked: boolean) => {
    const next = checked
      ? [...inputModalities, modality]
      : inputModalities.filter((m) => m !== modality);
    setInputModalities(next);
  };

  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {["text", "image", "audio", "pdf", "video"].map((modality) => (
        <div className="flex items-center space-x-2" key={modality}>
          <Checkbox
            checked={inputModalities.includes(modality)}
            id={`input-${modality}`}
            onCheckedChange={(checked) => toggle(modality, !!checked)}
          />
          <label
            className="cursor-pointer text-sm capitalize"
            htmlFor={`input-${modality}`}
          >
            {modality}
          </label>
        </div>
      ))}
    </CollapsibleContent>
  );
}

function OutputModalitiesFilter() {
  const outputModalities = useModels.useOutputModalities();
  const setOutputModalities = useModels.useSetOutputModalities();

  const toggle = (modality: string, checked: boolean) => {
    const next = checked
      ? [...outputModalities, modality]
      : outputModalities.filter((m) => m !== modality);
    setOutputModalities(next);
  };

  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {["text", "image", "audio"].map((modality) => (
        <div className="flex items-center space-x-2" key={modality}>
          <Checkbox
            checked={outputModalities.includes(modality)}
            id={`output-${modality}`}
            onCheckedChange={(checked) => toggle(modality, !!checked)}
          />
          <label
            className="cursor-pointer text-sm capitalize"
            htmlFor={`output-${modality}`}
          >
            {modality}
          </label>
        </div>
      ))}
    </CollapsibleContent>
  );
}

function LimitsFilter() {
  const contextLength = useModels.useContextLength();
  const maxTokens = useModels.useMaxTokens();
  const setContextLength = useModels.useSetContextLength();
  const setMaxTokens = useModels.useSetMaxTokens();
  const rangeLimits = useModels.useRangeLimits();
  return (
    <CollapsibleContent className="space-y-4 pt-3 pb-2">
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Context length (tokens)
        </div>
        <LogRangeSlider
          formatLabel={formatNumberCompact}
          max={rangeLimits.context[1]}
          min={rangeLimits.context[0]}
          onValueChange={setContextLength}
          roundValue={roundTokens}
          value={contextLength}
        />
      </div>
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Max output tokens (tokens)
        </div>
        <LogRangeSlider
          formatLabel={formatNumberCompact}
          max={rangeLimits.maxTokens[1]}
          min={rangeLimits.maxTokens[0]}
          onValueChange={setMaxTokens}
          roundValue={roundTokens}
          value={maxTokens}
        />
      </div>
    </CollapsibleContent>
  );
}

function ProvidersFilter() {
  const selectedProviders = useModels.useProviders();
  const setProviders = useModels.useSetProviders();
  const allModels = useModels.useAllModels();
  const providers = useMemo(
    () =>
      Array.from(new Set(allModels.map((m) => m.owned_by)))
        .filter(Boolean)
        .sort(),
    [allModels]
  );
  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {providers.map((provider) => (
        <div className="flex items-center space-x-2" key={provider}>
          <Checkbox
            checked={selectedProviders.includes(provider)}
            id={`provider-${provider}`}
            onCheckedChange={(checked) => {
              const next = checked
                ? [...selectedProviders, provider]
                : selectedProviders.filter((p) => p !== provider);
              setProviders(next);
            }}
          />
          <label
            className="cursor-pointer text-sm capitalize"
            htmlFor={`provider-${provider}`}
          >
            {provider}
          </label>
        </div>
      ))}
    </CollapsibleContent>
  );
}

function PricingFilter() {
  const inputPricing = useModels.useInputPricing();
  const outputPricing = useModels.useOutputPricing();
  const setInputPricing = useModels.useSetInputPricing();
  const setOutputPricing = useModels.useSetOutputPricing();
  const rangeLimits = useModels.useRangeLimits();
  return (
    <CollapsibleContent className="space-y-4 pt-3 pb-2">
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Input price ($/1M tokens)
        </div>
        <LogRangeSlider
          formatLabel={formatPrice}
          max={rangeLimits.inputPricing[1]}
          min={rangeLimits.inputPricing[0]}
          onValueChange={setInputPricing}
          roundValue={roundCents}
          value={inputPricing}
        />
      </div>
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Output price ($/1M tokens)
        </div>
        <LogRangeSlider
          formatLabel={formatPrice}
          max={rangeLimits.outputPricing[1]}
          min={rangeLimits.outputPricing[0]}
          onValueChange={setOutputPricing}
          roundValue={roundCents}
          value={outputPricing}
        />
      </div>
    </CollapsibleContent>
  );
}

function FeaturesFilter() {
  const features = useModels.useFeatures();
  const setFeatures = useModels.useSetFeatures();
  const toggle = (key: "reasoning" | "toolCall", checked: boolean) => {
    setFeatures({ [key]: !!checked });
  };
  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {[
        { key: "reasoning", label: "Reasoning" },
        { key: "toolCall", label: "Tools" },
      ].map((f) => (
        <div className="flex items-center space-x-2" key={f.key}>
          <Checkbox
            checked={!!features[f.key as "reasoning" | "toolCall"]}
            id={`feature-${f.key}`}
            onCheckedChange={(checked) =>
              toggle(f.key as "reasoning" | "toolCall", !!checked)
            }
          />
          <label
            className="cursor-pointer text-sm"
            htmlFor={`feature-${f.key}`}
          >
            {f.label}
          </label>
        </div>
      ))}
    </CollapsibleContent>
  );
}

export function ModelFilters({ className }: { className?: string }) {
  const [openSections, setOpenSections] = useState({
    inputModalities: true,
    outputModalities: true,
    limits: true,
    pricing: true,
    providers: true,
    features: true,
    supportedParameters: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={cn("h-full w-full border-r bg-background p-4", className)}>
      <div className="sticky top-4 space-y-4 pr-2">
        <Collapsible
          onOpenChange={() => toggleSection("inputModalities")}
          open={openSections.inputModalities}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.inputModalities.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Input Modalities</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.inputModalities ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <InputModalitiesFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection("outputModalities")}
          open={openSections.outputModalities}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.outputModalities.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Output Modalities</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.outputModalities ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <OutputModalitiesFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection("limits")}
          open={openSections.limits}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.limits.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Limits</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.limits ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <LimitsFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection("pricing")}
          open={openSections.pricing}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.pricing.Icon className="h-4 w-4 text-muted-foreground" />
              <span>{MODEL_CATEGORIES.pricing.label}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.pricing ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <PricingFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection("features")}
          open={openSections.features}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.features.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Features</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.features ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <FeaturesFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection("providers")}
          open={openSections.providers}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.providers.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Providers</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.providers ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <ProvidersFilter />
        </Collapsible>
      </div>
    </div>
  );
}
