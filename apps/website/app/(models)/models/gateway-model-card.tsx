"use client";
import type { ModelDefinition, ProviderId } from "@airegistry/vercel-gateway";
import Link from "next/link";
import { type ComponentType, memo, type SVGProps } from "react";
import { ButtonCopy } from "@/components/button-copy";
import { LazyTooltip } from "@/components/lazy-tooltip";
import { CompareModelButton } from "@/components/model-action-buttons";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { formatUsdPerMTokens } from "@/lib/format-usd-per-m-tokens";
import { getProviderIcon } from "@/lib/get-provider-icon";
import { MODEL_CAPABILITIES } from "@/lib/model-explorer/model-capabilities";
import { cn } from "@/lib/utils";
import { formatNumberCompact } from "../../../lib/format-number-compact";

function ModalityIcon({
  label,
  className,
  children,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <LazyTooltip content={label}>
      <span
        aria-label={label}
        className={cn(
          "grid size-6 place-items-center rounded-md border bg-muted text-foreground/80",
          className
        )}
        role="img"
      >
        {children}
      </span>
    </LazyTooltip>
  );
}

function CapabilityIcon({
  label,
  Icon,
}: {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <ModalityIcon className={"z-20"} label={label}>
      <Icon className="size-3.5" />
    </ModalityIcon>
  );
}

const PROVIDER_ICON_SIZE = 28;

function ModelInputOutputSection({ model }: { model: ModelDefinition }) {
  const hasInput = Boolean(
    model.input?.text ||
      model.input?.image ||
      model.input?.pdf ||
      model.input?.audio
  );
  const hasOutput = Boolean(
    model.output?.text || model.output?.image || model.output?.audio
  );
  return (
    <div className="flex flex-col justify-start gap-3 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {hasInput && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Input</span>
            <div className="flex items-center gap-1.5">
              {model.input?.text && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.text.Icon}
                  label={`${MODEL_CAPABILITIES.text.label} in`}
                />
              )}
              {model.input?.image && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.image.Icon}
                  label={`${MODEL_CAPABILITIES.image.label} in`}
                />
              )}
              {model.input?.pdf && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.pdf.Icon}
                  label={`${MODEL_CAPABILITIES.pdf.label} in`}
                />
              )}
              {model.input?.audio && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.audio.Icon}
                  label={`${MODEL_CAPABILITIES.audio.label} in`}
                />
              )}
            </div>
          </div>
        )}
        {hasInput && hasOutput && (
          <span className="hidden text-muted-foreground/40 sm:inline">/</span>
        )}
        {hasOutput && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Output</span>
            <div className="flex items-center gap-1.5">
              {model.output?.text && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.text.Icon}
                  label={`${MODEL_CAPABILITIES.text.label} out`}
                />
              )}
              {model.output?.image && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.image.Icon}
                  label={`${MODEL_CAPABILITIES.image.label} out`}
                />
              )}
              {model.output?.audio && (
                <CapabilityIcon
                  Icon={MODEL_CAPABILITIES.audio.Icon}
                  label={`${MODEL_CAPABILITIES.audio.label} out`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelFeaturesSection({ model }: { model: ModelDefinition }) {
  if (
    !(model.reasoning || model.toolCall || model.fixedTemperature === undefined)
  ) {
    return null;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden text-muted-foreground/40 sm:inline">/</span>
      <span className="text-muted-foreground text-xs">Features</span>
      <div className="flex items-center gap-1.5">
        {model.reasoning && (
          <CapabilityIcon
            Icon={MODEL_CAPABILITIES.reasoning.Icon}
            label={MODEL_CAPABILITIES.reasoning.label}
          />
        )}
        {model.toolCall && (
          <CapabilityIcon
            Icon={MODEL_CAPABILITIES.tools.Icon}
            label={MODEL_CAPABILITIES.tools.label}
          />
        )}
        {model.fixedTemperature === undefined && (
          <CapabilityIcon
            Icon={MODEL_CAPABILITIES.temperature.Icon}
            label={MODEL_CAPABILITIES.temperature.label}
          />
        )}
      </div>
    </div>
  );
}

function ModelCapabilitiesRow({ model }: { model: ModelDefinition }) {
  return (
    <div className="flex flex-col justify-start gap-3 sm:flex-row sm:items-center sm:gap-2">
      <ModelInputOutputSection model={model} />
      <ModelFeaturesSection model={model} />
    </div>
  );
}

function ModelMetaRow({ model }: { model: ModelDefinition }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
      <span>
        Context{" "}
        <span className="font-medium text-foreground">
          {formatNumberCompact(model.context_window)}
        </span>
      </span>
      <span>•</span>
      <span>
        Max out{" "}
        <span className="font-medium text-foreground">
          {formatNumberCompact(model.max_tokens)}
        </span>
      </span>
      <span>•</span>
      <span>
        Input{" "}
        <span className="font-medium text-foreground">
          {formatUsdPerMTokens(model.pricing.input)}
        </span>
      </span>
      <span>•</span>
      <span>
        Output{" "}
        <span className="font-medium text-foreground">
          {formatUsdPerMTokens(model.pricing.output)}
        </span>
      </span>
      <span>•</span>
      <span>
        Released{" "}
        <span className="font-medium text-foreground">
          {model.releaseDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </span>
    </div>
  );
}

function PureModelCard({ model }: { model: ModelDefinition }) {
  const provider = model.owned_by as ProviderId;

  return (
    <Card className="group relative cursor-pointer gap-4 transition-all duration-200 hover:border-primary/20 hover:shadow-lg">
      <Link
        aria-label={`Open ${model.name}`}
        className="absolute inset-0 z-10"
        href={`/models/${model.id}`}
        tabIndex={-1}
      >
        <span className="sr-only">Open {model.name}</span>
      </Link>
      <CardHeader className="">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
          <div className="flex flex-1 items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-muted">
              {getProviderIcon(provider, PROVIDER_ICON_SIZE)}
            </div>
            <div className="">
              <h3 className="text-balance font-semibold text-foreground transition-colors group-hover:text-primary">
                {model.name}
              </h3>
              <div className="relative z-20 flex items-center gap-2 text-muted-foreground text-sm">
                <span>by {model.owned_by.toLowerCase()}</span>
                <span>•</span>
                <span className="font-mono text-foreground">{model.id}</span>
                <ButtonCopy className="-ml-1" code={model.id} />
              </div>
            </div>
          </div>
          <div className="z-20 hidden shrink-0 items-center gap-2 sm:block">
            <CompareModelButton
              className="transition-all duration-200"
              modelId={model.id}
              size="sm"
              variant="outline"
            />
          </div>
        </div>
        {/* Secondary info row below the header line */}
        <ModelMetaRow model={model} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-2 text-pretty text-muted-foreground text-sm leading-relaxed">
          {model.description}
        </p>
        <ModelCapabilitiesRow model={model} />
      </CardContent>
      <CardFooter className="pt-0 sm:hidden">
        <div className="relative z-20 flex w-full items-center justify-end gap-2">
          <CompareModelButton
            className="grow transition-all duration-200"
            modelId={model.id}
            size="sm"
            variant="outline"
          />
        </div>
      </CardFooter>
    </Card>
  );
}

export const ModelCard = memo(
  PureModelCard,
  (prevProps, nextProps) => prevProps.model.id === nextProps.model.id
);
