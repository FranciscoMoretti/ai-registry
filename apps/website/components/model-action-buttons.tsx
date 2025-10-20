'use client';
import type { ModelId } from '@ai-registry/vercel-gateway';
import { ExternalLink, MessageSquare, Scale } from 'lucide-react';
import type React from 'react';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LinkButton } from '@/components/link-button';
import {
  OpenIn,
  OpenInContent,
  OpenInTrigger,
} from '@/components/ai-elements/open-in-chat';
import { OpenInSparka } from '@/components/ai-elements/open-in-chat';

export function ChatModelButton({
  modelId,
  className,
  children,
  hideIcon,
  size,
  variant = 'default',
}: {
  modelId?: ModelId | string | null;
  className?: string;
  children?: React.ReactNode;
  hideIcon?: boolean;
  size?: ComponentProps<typeof LinkButton>['size'];
  variant?: 'default' | 'outline';
}) {
  const query = useMemo(() => String(modelId ?? ''), [modelId]);

  return (
    <OpenIn query={query}>
      <OpenInTrigger />
      <OpenInContent >
        <OpenInSparka />
      </OpenInContent>
    </OpenIn>
  );
}

export function CompareModelButton({
  modelId,
  className,
  size,
  children,
  hideIcon,
  ...props
}: {
  modelId: string | ModelId;
  className?: string;
  size?: ComponentProps<typeof LinkButton>['size'];
  children?: React.ReactNode;
  hideIcon?: boolean;
} & Omit<ComponentProps<typeof LinkButton>, 'href'>) {
  return (
    <LinkButton
      className={cn('gap-2', className)}
      href={`/compare/${String(modelId)}`}
      size={size}
      {...props}
    >
      {hideIcon ? null : <Scale className="h-4 w-4" />}
      {children ?? 'Compare'}
    </LinkButton>
  );
}

export function GoToModelButton({
  modelId,
  className,
  children,
  hideIcon,
  size,
  variant = 'outline',
  ...props
}: {
  modelId: string | ModelId;
  className?: string;
  children?: React.ReactNode;
  hideIcon?: boolean;
  size?: ComponentProps<typeof LinkButton>['size'];
  variant?: ComponentProps<typeof LinkButton>['variant'];
} & Omit<ComponentProps<typeof LinkButton>, 'variant' | 'children' | 'href'>) {
  return (
    <LinkButton
      className={cn('gap-2', className)}
      href={`/models/${String(modelId)}`}
      size={size}
      variant={variant}
      {...props}
    >
      <span>{children ?? 'Go to model'}</span>
      {hideIcon ? null : <ExternalLink className="ml-0 h-4 w-4" />}
    </LinkButton>
  );
}
