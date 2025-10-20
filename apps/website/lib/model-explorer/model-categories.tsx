"use client";

import {
  Building2,
  DollarSign,
  LogIn,
  LogOut,
  Ruler,
  Sparkles,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type CategoryKey =
  | "inputModalities"
  | "outputModalities"
  | "limits"
  | "providers"
  | "pricing"
  | "features";

export type CategoryEntry = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const MODEL_CATEGORIES: Record<CategoryKey, CategoryEntry> = {
  inputModalities: { label: "Input Modalities", Icon: LogIn },
  outputModalities: { label: "Output Modalities", Icon: LogOut },
  limits: { label: "Limits", Icon: Ruler },
  providers: { label: "Providers", Icon: Building2 },
  pricing: { label: "Pricing", Icon: DollarSign },
  features: { label: "Features", Icon: Sparkles },
};

export const MODEL_CATEGORIES_LIMITS: Record<
  "contextLength" | "maxTokens",
  CategoryEntry
> = {
  contextLength: { label: "Context Length", Icon: Ruler },
  maxTokens: { label: "Max Output Tokens", Icon: Ruler },
};
