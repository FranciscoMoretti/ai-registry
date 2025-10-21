// Shared utilities and constants for Open Graph image generation

import type { ModelDefinition } from "@ai-registry/vercel-gateway";
import { formatNumberCompact } from "@/lib/format-number-compact";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_SITE_NAME = "AI Registry";

export function getBaseUrl(): string {
  return `http://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000"}`;
}

export function getAppIconUrl(baseUrl: string = getBaseUrl()): string {
  return `${baseUrl}/icon.svg`;
}

export const OG_BACKGROUND_IMAGE =
  "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 55%), radial-gradient(1000px 520px at 15% -10%, rgba(99,102,241,0.16), transparent), radial-gradient(1200px 680px at 85% 120%, rgba(59,130,246,0.14), transparent), radial-gradient(900px 420px at 50% 110%, rgba(16,185,129,0.10), transparent)";

export function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

export function capitalizeFirst(input: string): string {
  if (!input) {
    return input;
  }
  return input.slice(0, 1).toUpperCase() + input.slice(1);
}

export function truncate(input: string, max: number): string {
  if (!input) {
    return input;
  }
  return input.length > max ? `${input.slice(0, max - 3)}...` : input;
}

export function prettyUsdPerMTokens(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `$${value}/token`;
  }
  const perMillion = numeric * 1_000_000;
  const digits = perMillion >= 0.01 ? 2 : perMillion >= 0.001 ? 3 : 4;
  return `$${perMillion.toFixed(digits)}/M`;
}

export function buildBulletItems(model: ModelDefinition | null | undefined) {
  if (!model) {
    return [] as Array<{ label: string; value: string }>;
  }
  const contextWindow = model?.context_window || null;
  const maxOut = model?.max_tokens || null;
  const pricingIn = model?.pricing?.input || null;
  const pricingOut = model?.pricing?.output || null;
  const releaseDate = model?.releaseDate || null;
  const releaseDateDisplay = releaseDate
    ? releaseDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const bulletItems: Array<{ label: string; value: string }> = [];
  if (releaseDateDisplay) {
    bulletItems.push({ label: "Released", value: releaseDateDisplay });
  }
  if (contextWindow) {
    bulletItems.push({
      label: "Context",
      value: formatNumberCompact(contextWindow),
    });
  }
  if (maxOut) {
    bulletItems.push({ label: "Max out", value: formatNumberCompact(maxOut) });
  }
  if (pricingIn) {
    bulletItems.push({
      label: "Input",
      value: (prettyUsdPerMTokens(pricingIn) as string) || "",
    });
  }
  if (pricingOut) {
    bulletItems.push({
      label: "Output",
      value: (prettyUsdPerMTokens(pricingOut) as string) || "",
    });
  }

  return bulletItems;
}

export const inputModalitiesOrder: Array<
  "text" | "image" | "pdf" | "audio" | "video"
> = ["text", "image", "pdf", "audio", "video"];

export const outputModalitiesOrder: Array<"text" | "image" | "audio"> = [
  "text",
  "image",
  "audio",
];

export function getCapabilityIcons(
  baseUrl: string = getBaseUrl()
): Record<"text" | "image" | "pdf" | "audio" | "video", string> {
  return {
    text: `${baseUrl}/modalities/type.svg`,
    image: `${baseUrl}/modalities/image.svg`,
    pdf: `${baseUrl}/modalities/file-text.svg`,
    audio: `${baseUrl}/modalities/mic.svg`,
    video: `${baseUrl}/modalities/video.svg`,
  };
}

export function getArrowRightUrl(baseUrl: string = getBaseUrl()): string {
  return `${baseUrl}/modalities/arrow-right.svg`;
}
