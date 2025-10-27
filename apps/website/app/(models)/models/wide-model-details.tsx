"use client";

import type { ModelDefinition, ProviderId } from "@airegistry/vercel-gateway";
import { useMemo } from "react";
import { ButtonCopy } from "@/components/button-copy";
import {
  ChatModelButton,
  CompareModelButton,
} from "@/components/model-action-buttons";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumberCompact } from "@/lib/format-number-compact";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { MODEL_CAPABILITIES } from "@/lib/model-explorer/model-capabilities";
import { MODEL_CATEGORIES } from "@/lib/model-explorer/model-categories";

export function WideModelDetails({
  model,
  enabledActions,
}: {
  model: ModelDefinition;
  enabledActions?: {
    goToModel?: boolean;
    chat?: boolean;
    compare?: boolean;
  };
}) {
  const provider = model?.owned_by as ProviderId | undefined;
  const contextCompact = useMemo(
    () => (model ? formatNumberCompact(model.context_window) : "--"),
    [model?.id, model?.context_window, model]
  );

  const actions = {
    chat: true,
    compare: true,
    ...(enabledActions ?? {}),
  };

  return (
    <div className="w-full space-y-6">
      {/* Header: title + provider + primary actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            {provider ? getProviderIcon(provider, 48) : null}
            <div className="min-w-0">
              <div className="mb-0.5 font-semibold text-2xl tracking-tight sm:text-3xl">
                {model?.name ?? "Model"}
              </div>
              <div className="font-medium text-muted-foreground text-sm capitalize">
                {`By ${provider || "Unknown Provider"}`}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions.compare && model ? (
            <CompareModelButton
              className="h-9 px-3"
              modelId={model.id}
              size="lg"
              variant="outline"
            />
          ) : null}
          {actions.chat && model ? (
            <ChatModelButton className="h-9 px-3" modelId={model.id} size="lg">
              Chat
            </ChatModelButton>
          ) : null}
        </div>
      </div>

      {/* Release date + description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <code className="truncate font-mono">{model.id}</code>
            <ButtonCopy className="h-6 w-6" code={model.id} />
          </span>
          <span className="text-muted-foreground text-xs">|</span>
          <span className="text-muted-foreground text-xs">
            Released{" "}
            {model.releaseDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-foreground text-sm leading-6">{model.description}</p>
      </div>

      {/* Pricing */}
      <ResponsiveSection
        Icon={MODEL_CATEGORIES.pricing.Icon}
        title={MODEL_CATEGORIES.pricing.label}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <KeyValue
            label="Pricing (Input)"
            value={
              model
                ? `$${(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(2)}/M tokens`
                : "--"
            }
          />
          <KeyValue
            label="Pricing (Output)"
            value={
              model
                ? `$${(Number.parseFloat(model.pricing.output) * 1_000_000).toFixed(2)}/M tokens`
                : "--"
            }
          />
          <KeyValue
            label="Caching"
            value={
              model &&
              (model.pricing.input_cache_read ||
                model.pricing.input_cache_write)
                ? "Yes"
                : "No"
            }
          />
        </div>
      </ResponsiveSection>

      {/* Limits */}
      <ResponsiveSection
        Icon={MODEL_CATEGORIES.limits.Icon}
        title={MODEL_CATEGORIES.limits.label}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <KeyValue label="Context Length" value={contextCompact} />
          <KeyValue
            label="Max Output Tokens"
            value={
              model?.max_tokens
                ? formatNumberCompact(Number(model.max_tokens))
                : "--"
            }
          />
        </div>
      </ResponsiveSection>

      {/* Input Modalities */}
      <ResponsiveSection
        Icon={MODEL_CATEGORIES.inputModalities.Icon}
        title={MODEL_CATEGORIES.inputModalities.label}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalityRow
            enabled={!!model?.input?.text}
            Icon={MODEL_CAPABILITIES.text.Icon}
            label={MODEL_CAPABILITIES.text.label}
          />
          <ModalityRow
            enabled={!!model?.input?.image}
            Icon={MODEL_CAPABILITIES.image.Icon}
            label={MODEL_CAPABILITIES.image.label}
          />
          <ModalityRow
            enabled={!!model?.input?.pdf}
            Icon={MODEL_CAPABILITIES.pdf.Icon}
            label={MODEL_CAPABILITIES.pdf.label}
          />
          <ModalityRow
            enabled={!!model?.input?.audio}
            Icon={MODEL_CAPABILITIES.audio.Icon}
            label={MODEL_CAPABILITIES.audio.label}
          />
        </div>
      </ResponsiveSection>

      {/* Output Modalities */}
      <ResponsiveSection
        Icon={MODEL_CATEGORIES.outputModalities.Icon}
        title={MODEL_CATEGORIES.outputModalities.label}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalityRow
            enabled={!!model?.output?.text}
            Icon={MODEL_CAPABILITIES.text.Icon}
            label={MODEL_CAPABILITIES.text.label}
          />
          <ModalityRow
            enabled={!!model?.output?.image}
            Icon={MODEL_CAPABILITIES.image.Icon}
            label={MODEL_CAPABILITIES.image.label}
          />
          <ModalityRow
            enabled={!!model?.output?.audio}
            Icon={MODEL_CAPABILITIES.audio.Icon}
            label={MODEL_CAPABILITIES.audio.label}
          />
        </div>
      </ResponsiveSection>

      {/* Features */}
      <ResponsiveSection
        Icon={MODEL_CATEGORIES.features.Icon}
        title={MODEL_CATEGORIES.features.label}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModalityRow
            enabled={!!model?.reasoning}
            Icon={MODEL_CAPABILITIES.reasoning.Icon}
            label={MODEL_CAPABILITIES.reasoning.label}
          />
          <ModalityRow
            enabled={!!model?.toolCall}
            Icon={MODEL_CAPABILITIES.tools.Icon}
            label={MODEL_CAPABILITIES.tools.label}
          />
          <ModalityRow
            enabled={model?.fixedTemperature === undefined}
            Icon={MODEL_CAPABILITIES.temperature.Icon}
            label={MODEL_CAPABILITIES.temperature.label}
          />
        </div>
      </ResponsiveSection>
    </div>
  );
}

function ResponsiveSection({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 border-border/50 border-b pt-3 pb-4 last:border-b-0 sm:grid-cols-[180px_1fr]">
      {/* Category title - left side on sm+, top on mobile */}
      <div className="flex items-start gap-2 font-semibold text-base">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
      </div>

      {/* Content - right side on sm+, below title on mobile */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-3">
      <CardContent className="px-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-xs">{label}</span>
          <span className="font-semibold text-base tabular-nums">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ModalityRow({
  label,
  enabled,
  Icon,
}: {
  label: string;
  enabled: boolean;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          enabled ? "bg-muted" : "bg-muted/40"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${enabled ? "" : "text-muted-foreground/50"}`}
        />
      </div>
      <div className="flex flex-col">
        <span
          className={`text-sm ${enabled ? "text-foreground" : "text-muted-foreground"}`}
        >
          {label}
        </span>
        <span className={"text-muted-foreground text-xs"}>
          {enabled ? "Supported" : "Not supported"}
        </span>
      </div>
    </div>
  );
}

// No separate FeatureRow: features reuse ModalityRow style for visual parity
