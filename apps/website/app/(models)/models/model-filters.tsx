'use client';

import { providers } from '@ai-registry/vercel-gateway';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  MODEL_RANGE_LIMITS,
  useModels,
} from '@/app/(models)/models/models-store-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { MODEL_CATEGORIES } from '@/lib/model-explorer/model-categories';
import { cn } from '@/lib/utils';
import { formatNumberCompact } from '@/lib/format-number-compact';

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
    temperatureControl?: boolean; // true => supports adjustable temperature
  };
  // legacy fields kept for compatibility
  series: string[];
  categories: string[];
  supportedParameters: string[];
};

function InputModalitiesFilter() {
  const inputModalities = useModels((s) => s.filters.inputModalities);
  const updateFilters = useModels((s) => s.updateFilters);

  const toggle = (modality: string, checked: boolean) => {
    const next = checked
      ? [...inputModalities, modality]
      : inputModalities.filter((m) => m !== modality);
    updateFilters({ inputModalities: next });
  };

  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {['text', 'image', 'audio', 'pdf', 'video'].map((modality) => (
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
  const outputModalities = useModels((s) => s.filters.outputModalities);
  const updateFilters = useModels((s) => s.updateFilters);

  const toggle = (modality: string, checked: boolean) => {
    const next = checked
      ? [...outputModalities, modality]
      : outputModalities.filter((m) => m !== modality);
    updateFilters({ outputModalities: next });
  };

  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {['text', 'image', 'audio'].map((modality) => (
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
  const contextLength = useModels((s) => s.filters.contextLength);
  const maxTokens = useModels((s) => s.filters.maxTokens);
  const updateFilters = useModels((s) => s.updateFilters);
  return (
    <CollapsibleContent className="space-y-4 pt-3 pb-2">
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Context length (tokens)
        </div>
        <Slider
          className="w-full"
          max={MODEL_RANGE_LIMITS.context[1]}
          min={MODEL_RANGE_LIMITS.context[0]}
          onValueChange={(value) =>
            updateFilters({ contextLength: value as [number, number] })
          }
          step={1000}
          value={contextLength}
        />
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>{formatNumberCompact(contextLength[0])}</span>
          <span>{formatNumberCompact(contextLength[1])}</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Max output tokens (tokens)
        </div>
        <Slider
          className="w-full"
          max={MODEL_RANGE_LIMITS.maxTokens[1]}
          min={MODEL_RANGE_LIMITS.maxTokens[0]}
          onValueChange={(value) =>
            updateFilters({ maxTokens: value as [number, number] })
          }
          step={512}
          value={maxTokens}
        />
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>{formatNumberCompact(maxTokens[0])}</span>
          <span>{formatNumberCompact(maxTokens[1])}</span>
        </div>
      </div>
    </CollapsibleContent>
  );
}

function ProvidersFilter() {
  const selectedProviders = useModels((s) => s.filters.providers);
  const updateFilters = useModels((s) => s.updateFilters);
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
              updateFilters({ providers: next });
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
  const inputPricing = useModels((s) => s.filters.inputPricing);
  const outputPricing = useModels((s) => s.filters.outputPricing);
  const updateFilters = useModels((s) => s.updateFilters);
  return (
    <CollapsibleContent className="space-y-4 pt-3 pb-2">
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Input price ($/1M tokens)
        </div>
        <Slider
          className="w-full"
          max={MODEL_RANGE_LIMITS.inputPricing[1]}
          min={MODEL_RANGE_LIMITS.inputPricing[0]}
          onValueChange={(value) =>
            updateFilters({ inputPricing: value as [number, number] })
          }
          step={0.01}
          value={inputPricing}
        />
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>${inputPricing[0].toFixed(2)}</span>
          <span>${inputPricing[1].toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Output price ($/1M tokens)
        </div>
        <Slider
          className="w-full"
          max={MODEL_RANGE_LIMITS.outputPricing[1]}
          min={MODEL_RANGE_LIMITS.outputPricing[0]}
          onValueChange={(value) =>
            updateFilters({ outputPricing: value as [number, number] })
          }
          step={0.01}
          value={outputPricing}
        />
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>${outputPricing[0].toFixed(2)}</span>
          <span>${outputPricing[1].toFixed(2)}</span>
        </div>
      </div>
    </CollapsibleContent>
  );
}

function FeaturesFilter() {
  const features = useModels((s) => s.filters.features);
  const updateFilters = useModels((s) => s.updateFilters);
  const toggle = (
    key: 'reasoning' | 'toolCall' | 'temperatureControl',
    checked: boolean,
  ) => {
    updateFilters({ features: { ...features, [key]: !!checked } });
  };
  return (
    <CollapsibleContent className="space-y-2 pt-3 pb-2">
      {[
        { key: 'reasoning', label: 'Reasoning' },
        { key: 'toolCall', label: 'Tools' },
        { key: 'temperatureControl', label: 'Temperature control' },
      ].map((f) => (
        <div className="flex items-center space-x-2" key={f.key}>
          <Checkbox
            checked={
              !!features[
                f.key as 'reasoning' | 'toolCall' | 'temperatureControl'
              ]
            }
            id={`feature-${f.key}`}
            onCheckedChange={(checked) =>
              toggle(
                f.key as 'reasoning' | 'toolCall' | 'temperatureControl',
                !!checked,
              )
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
    <div className={cn('h-full w-full border-r bg-background p-4', className)}>
      <div className="sticky top-4 space-y-4 pr-2">
        <Collapsible
          onOpenChange={() => toggleSection('inputModalities')}
          open={openSections.inputModalities}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.inputModalities.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Input Modalities</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.inputModalities ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <InputModalitiesFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection('outputModalities')}
          open={openSections.outputModalities}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.outputModalities.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Output Modalities</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.outputModalities ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <OutputModalitiesFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection('limits')}
          open={openSections.limits}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.limits.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Limits</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.limits ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <LimitsFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection('providers')}
          open={openSections.providers}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.providers.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Providers</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.providers ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <ProvidersFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection('pricing')}
          open={openSections.pricing}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.pricing.Icon className="h-4 w-4 text-muted-foreground" />
              <span>{MODEL_CATEGORIES.pricing.label}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.pricing ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <PricingFilter />
        </Collapsible>

        <Collapsible
          onOpenChange={() => toggleSection('features')}
          open={openSections.features}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between border-b py-2 font-medium text-sm transition-colors hover:text-primary">
            <div className="flex items-center gap-2">
              <MODEL_CATEGORIES.features.Icon className="h-4 w-4 text-muted-foreground" />
              <span>Features</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.features ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <FeaturesFilter />
        </Collapsible>
      </div>
    </div>
  );
}
