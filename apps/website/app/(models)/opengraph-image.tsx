import type { ProviderId } from "@airegistry/vercel-gateway";

import { allModels } from "@airegistry/vercel-gateway";
import { ImageResponse } from "@vercel/og";
import { formatNumberCompact } from "@/lib/format-number-compact";
import { OGCard, OGContainer, OGFooter, OGTitle } from "@/lib/og/components";
import {
  getAppIconUrl,
  getBaseUrl,
  OG_BACKGROUND_IMAGE,
  OG_SITE_NAME,
  OG_SIZE,
  titleCase,
} from "@/lib/og/shared";
import { getProviderIconUrl } from "../../lib/get-provider-icon-url";

export const runtime = "edge";
export const contentType = "image/png";
export const size = OG_SIZE;

export default function OGImage() {
  const numModels = allModels.length;
  const providers = Array.from(
    new Set(
      allModels
        .map((m) => (m.owned_by || "").trim())
        .filter((p): p is string => Boolean(p))
    )
  );

  const numProviders = providers.length;
  const topProviderIcons = providers
    .map((p) => ({
      name: p,
      iconUrl: getProviderIconUrl(p as ProviderId, getBaseUrl()),
    }))
    .filter((p) => p.iconUrl);

  const pageTitle = "Browse AI Models";
  const pageDescription =
    "Explore models across providers from Vercel AI Gateway. Filter and compare by provider, context window, and pricing.";
  const baseUrl = getBaseUrl();
  const appIcon = getAppIconUrl(baseUrl);

  return new ImageResponse(
    <OGContainer backgroundImage={OG_BACKGROUND_IMAGE}>
      <OGCard paddingTw="p-14">
        <div style={{ display: "flex" }} tw="flex items-center">
          <div style={{ display: "flex" }} tw="flex flex-col">
            <OGTitle
              largeTw="text-[64px]"
              smallTw="text-[64px]"
              text={pageTitle}
            />
            <div
              style={{ display: "flex" }}
              tw="text-[22px] text-slate-200 mt-3 max-w-[900px]"
            >
              {pageDescription}
            </div>
            <div style={{ display: "flex" }} tw="mt-5 text-2xl text-slate-300">
              <span>Providers</span>
              <span tw="text-white ml-1">
                {formatNumberCompact(numProviders)}
              </span>
              <span tw="mx-2">•</span>
              <span>Models</span>
              <span tw="text-white ml-1">{formatNumberCompact(numModels)}</span>
            </div>
          </div>
        </div>

        <div tw="mt-10 h-[1px] bg-white/10" />

        <div
          style={{ display: "flex" }}
          tw="mt-8 flex items-center justify-start text-slate-300"
        >
          {topProviderIcons.length > 0 && (
            <div
              style={{ display: "flex", gap: ".625rem" }}
              tw="flex flex-wrap items-center justify-center max-w-[960px]"
            >
              {topProviderIcons.slice(0, 18).map((p) => (
                <span
                  key={p.name}
                  style={{ display: "flex" }}
                  title={titleCase(p.name)}
                  tw="p-2.5 w-[52px] h-[52px] rounded-xl bg-white/10 flex items-center justify-center"
                >
                  {p.iconUrl ? (
                    // biome-ignore lint/performance/noImgElement: Next/Image isn't supported in edge OG Image rendering
                    <img
                      alt={`${p.name} logo`}
                      height={30}
                      src={p.iconUrl}
                      width={30}
                    />
                  ) : (
                    <span tw="text-white/80 text-lg font-bold">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <OGFooter
          appIconUrl={appIcon}
          containerTw="mt-auto"
          iconSize={36}
          siteName={OG_SITE_NAME}
          textSizeTw="text-[20px]"
        />
      </OGCard>
    </OGContainer>,
    {
      width: size.width,
      height: size.height,
    }
  );
}
