'use client';

import type { ModelDefinition, ProviderId } from '@ai-registry/vercel-gateway';
import { Check, ChevronDown, Minus, SquareDashed, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getProviderIcon } from '@/lib/get-provider-icon';
import {
  ChatModelButton,
  CompareModelButton,
  GoToModelButton,
} from '@/components/model-action-buttons';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MODEL_CAPABILITIES } from '@/lib/model-explorer/model-capabilities';
import { MODEL_CATEGORIES } from '@/lib/model-explorer/model-categories';
import { formatNumberCompact } from '../../../lib/format-number-compact';

type ModelComparisonCardProps = {
  model: ModelDefinition | null;

  enabledActions?: {
    goToModel?: boolean;
    chat?: boolean;
    compare?: boolean;
  };
};

const ModalityIcon = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span
        aria-label={label}
        className={
          'grid size-6 place-items-center rounded-md border bg-muted text-foreground/80'
        }
        role="img"
      >
        {children}
      </span>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const CapabilityIcon = ({
  label,
  Icon,
}: {
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => (
  <ModalityIcon label={label}>
    <Icon className="size-3.5" />
  </ModalityIcon>
);

const NotAvailableIcon = () => (
  <span
    aria-label="Not available"
    className={'grid size-6 place-items-center text-foreground/80'}
    role="img"
  >
    <Minus className="h-4 w-4" />
  </span>
);

const Section = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
      <Icon className="h-3.5 w-3.5" />
      <span>{title}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

export function ModelDetailsCard({
  model,
  enabledActions,
}: ModelComparisonCardProps) {
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
    useState(false);
  const clampedRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = clampedRef.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const overflowing = el.scrollHeight > el.clientHeight + 1;
      setIsDescriptionOverflowing(overflowing);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  if (!model) {
    return (
      <Card className="h-full border-2 border-muted-foreground/20 bg-muted/10">
        <CardContent className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <SquareDashed
            aria-hidden="true"
            className="size-8 text-muted-foreground/50"
          />
          <div className="mt-2 font-medium text-foreground/70 text-sm">
            No model selected
          </div>
          <p className="mt-1 text-xs">
            Use the selector above to choose a model.
          </p>
        </CardContent>
      </Card>
    );
  }

  const provider = model.owned_by as ProviderId;
  const contextCompact = formatNumberCompact(model.context_window);
  const actions = {
    goToModel: true,
    chat: true,
    compare: true,
    ...(enabledActions ?? {}),
  };

  return (
    <Card className="group p h-full gap-2 transition-all duration-200 hover:border-primary/20 hover:shadow-lg">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Created by</span>
          <div className="flex items-center gap-2 font-medium text-sm">
            {getProviderIcon(provider, 18)}
            <span className="capitalize">{provider}</span>
          </div>
        </div>
        <div className="mt-1 text-muted-foreground text-sm">
          Released{' '}
          {model.releaseDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <Separator className="my-2" />
        <Collapsible className="w-full [&[data-state=closed]_.trigger-open]:hidden [&[data-state=open]_.clamped]:hidden [&[data-state=open]_.trigger-closed]:hidden">
          <p
            className="clamped mt-2 line-clamp-2 text-pretty text-muted-foreground text-sm leading-relaxed"
            ref={clampedRef}
          >
            {model.description}
          </p>
          <CollapsibleContent className="pb-0">
            <p className="mt-2 text-pretty text-muted-foreground text-sm leading-relaxed">
              {model.description}
            </p>
          </CollapsibleContent>
          <div className="mt-1 flex min-h-[1.25rem] justify-end gap-1">
            {isDescriptionOverflowing && (
              <CollapsibleTrigger
                aria-label="Expand description"
                className="trigger-closed grid h-5 w-5 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
            )}
            <CollapsibleTrigger
              aria-label="Collapse description"
              className="trigger-open grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 rotate-180 transition-transform duration-200" />
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <Separator />
          <Section
            Icon={MODEL_CATEGORIES.limits.Icon}
            title={MODEL_CATEGORIES.limits.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Context Length
              </span>
              <span className="font-medium text-sm">{contextCompact}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Max Output Tokens
              </span>
              <span className="font-medium text-sm">
                {model.max_tokens
                  ? formatNumberCompact(Number(model.max_tokens))
                  : '--'}
              </span>
            </div>
          </Section>
          <Separator />

          <Section
            Icon={MODEL_CATEGORIES.pricing.Icon}
            title={MODEL_CATEGORIES.pricing.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Pricing (Input)
              </span>
              <span className="font-medium text-sm">
                $
                {(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(
                  2,
                )}
                /M tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Pricing (Output)
              </span>
              <span className="font-medium text-sm">
                $
                {(Number.parseFloat(model.pricing.output) * 1_000_000).toFixed(
                  2,
                )}
                /M tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Caching</span>
              {model.pricing.input_cache_read ||
              model.pricing.input_cache_write ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          </Section>
          <Separator />

          <Section
            Icon={MODEL_CATEGORIES.inputModalities.Icon}
            title={MODEL_CATEGORIES.inputModalities.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.text.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.input?.text ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.text;
                    return <CapabilityIcon Icon={Icon} label={`${label} in`} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.image.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.input?.image ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.image;
                    return <CapabilityIcon Icon={Icon} label={`${label} in`} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.pdf.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.input?.pdf ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.pdf;
                    return <CapabilityIcon Icon={Icon} label={`${label} in`} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.audio.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.input?.audio ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.audio;
                    return <CapabilityIcon Icon={Icon} label={`${label} in`} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
          </Section>
          <Separator />

          <Section
            Icon={MODEL_CATEGORIES.outputModalities.Icon}
            title={MODEL_CATEGORIES.outputModalities.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.text.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.output?.text ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.text;
                    return (
                      <CapabilityIcon Icon={Icon} label={`${label} out`} />
                    );
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Image</span>
              <div className="flex items-center gap-1.5">
                {model.output?.image ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.image;
                    return (
                      <CapabilityIcon Icon={Icon} label={`${label} out`} />
                    );
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.audio.label}
              </span>
              <div className="flex items-center gap-1.5">
                {model.output?.audio ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.audio;
                    return (
                      <CapabilityIcon Icon={Icon} label={`${label} out`} />
                    );
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </div>
          </Section>
          <Separator />

          <Section
            Icon={MODEL_CATEGORIES.features.Icon}
            title={MODEL_CATEGORIES.features.label}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.reasoning.label}
              </span>
              {model.reasoning ? (
                (() => {
                  const { Icon, label } = MODEL_CAPABILITIES.reasoning;
                  return <CapabilityIcon Icon={Icon} label={label} />;
                })()
              ) : (
                <NotAvailableIcon />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.tools.label}
              </span>
              {model.toolCall ? (
                (() => {
                  const { Icon, label } = MODEL_CAPABILITIES.tools;
                  return <CapabilityIcon Icon={Icon} label={label} />;
                })()
              ) : (
                <NotAvailableIcon />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {MODEL_CAPABILITIES.temperature.label}
              </span>
              {model.fixedTemperature === undefined ? (
                (() => {
                  const { Icon, label } = MODEL_CAPABILITIES.temperature;
                  return <CapabilityIcon Icon={Icon} label={label} />;
                })()
              ) : (
                <NotAvailableIcon />
              )}
            </div>
          </Section>
        </div>

      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-stretch justify-center m-auto max-w-[200px] flex-col gap-2">
          {actions.goToModel ? (
            <GoToModelButton
              className="bg-transparent transition-colors hover:bg-accent"
              modelId={model.id}
            />
          ) : null}
          {actions.compare ? (
            <CompareModelButton
              className="bg-transparent transition-colors hover:bg-accent"
              modelId={model.id}
              variant="outline"
            />
          ) : null}
          {actions.chat ? <ChatModelButton modelId={model.id} /> : null}
        </div>
      </CardFooter>
    </Card>
  );
}
