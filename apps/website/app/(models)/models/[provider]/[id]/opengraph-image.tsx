import { allModels } from "@airegistry/vercel-gateway";
import { ImageResponse } from "@vercel/og";
import {
  OGCard,
  OGContainer,
  OGFooter,
  OGIcon,
  OGTitle,
} from "@/lib/og/components";
import { ModalitiesRow } from "@/lib/og/ModalitiesRow";
import {
  buildBulletItems,
  capitalizeFirst,
  getAppIconUrl,
  getArrowRightUrl,
  getBaseUrl,
  getCapabilityIcons,
  inputModalitiesOrder,
  OG_BACKGROUND_IMAGE,
  OG_SITE_NAME,
  OG_SIZE,
  outputModalitiesOrder,
} from "@/lib/og/shared";
import { getProviderIconUrl } from "../../../../../lib/get-provider-icon-url";

export const runtime = "edge";
export const contentType = "image/png";
export const size = OG_SIZE;
const TITLE_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 165;

export default async function OGImage(
  props: PageProps<"/models/[provider]/[id]">
) {
  const { provider, id } = await props.params;
  const modelId = `${provider}/${id}`;
  const model = allModels.find((m) => m.id === modelId) || null;

  if (!model) {
    return new ImageResponse(
      <div>
        <h1>Model not found</h1>
      </div>,
      {
        width: size.width,
        height: size.height,
      }
    );
  }

  const providerDisplay = capitalizeFirst(
    (model?.owned_by || provider) as string
  );
  const modelDisplay = model?.name || id;

  const titleRaw = `${modelDisplay}`.trim();
  const title =
    titleRaw.length > TITLE_MAX_LENGTH
      ? `${titleRaw.slice(0, TITLE_MAX_LENGTH - 3)}...`
      : titleRaw;

  const baseUrl = getBaseUrl();
  const iconUrl = getProviderIconUrl(model.owned_by, baseUrl);

  // Extra data for richer OG card
  const _contextWindow = model?.context_window || null;
  const _maxOut = model?.max_tokens || null;
  const _pricingIn = model?.pricing?.input || null;
  const _pricingOut = model?.pricing?.output || null;
  const releaseDate = model?.releaseDate || null;
  const _releaseDateDisplay = releaseDate
    ? releaseDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const bulletItems = buildBulletItems(model);

  const descriptionRaw = model?.description || "";
  const description =
    descriptionRaw.length > DESCRIPTION_MAX_LENGTH
      ? `${descriptionRaw.slice(0, DESCRIPTION_MAX_LENGTH - 3)}...`
      : descriptionRaw;

  const capabilityIcons = getCapabilityIcons(baseUrl);
  const arrowRight = getArrowRightUrl(baseUrl);

  const enabledInputKeys = inputModalitiesOrder.filter(
    (key) => model?.input?.[key]
  );
  const enabledOutputKeys = outputModalitiesOrder.filter(
    (key) => model?.output?.[key]
  );

  const appIcon = getAppIconUrl(baseUrl);

  return new ImageResponse(
    <OGContainer backgroundImage={OG_BACKGROUND_IMAGE}>
      <OGCard roundedTw="rounded-2xl">
        <div style={{ display: "flex", gap: "1.5rem" }} tw="flex items-center">
          {iconUrl ? (
            <OGIcon alt={`${providerDisplay} logo`} size="lg" src={iconUrl} />
          ) : (
            <div
              style={{ display: "flex" }}
              tw="w-[96px] h-[96px] rounded-xl bg-white/10 flex items-center justify-center text-white/80 text-5xl font-bold"
            >
              {providerDisplay.slice(0, 1)}
            </div>
          )}

          <div style={{ display: "flex" }} tw="flex flex-col">
            <OGTitle
              largeTw="text-[64px]"
              smallTw="text-[52px]"
              text={title}
              threshold={22}
            />
            <div style={{ display: "flex" }} tw="text-xl text-slate-200 mt-1">
              by {providerDisplay.toLowerCase()}
            </div>
          </div>
        </div>

        {bulletItems.length > 0 && (
          <div style={{ display: "flex" }} tw="mt-6 text-xl text-slate-300">
            {bulletItems.map((item, idx) => (
              <span
                key={`${item.label}-${idx}`}
                style={{ display: "flex", gap: ".25rem" }}
              >
                <span>{`${item.label}`}</span>
                <span tw="text-white">{item.value}</span>
                {idx < bulletItems.length - 1 && <span tw="mx-2">•</span>}
              </span>
            ))}
          </div>
        )}

        {description && (
          <div style={{ display: "flex" }} tw="mt-6 text-2xl text-slate-200">
            {description}
          </div>
        )}

        {(enabledInputKeys.length > 0 || enabledOutputKeys.length > 0) && (
          <div
            style={{ display: "flex" }}
            tw="mt-4 flex items-center text-slate-300"
          >
            <ModalitiesRow
              arrowRightUrl={arrowRight}
              capabilityIcons={capabilityIcons}
              inputKeys={
                enabledInputKeys as Array<
                  "text" | "image" | "pdf" | "audio" | "video"
                >
              }
              outputKeys={
                enabledOutputKeys as Array<"text" | "image" | "audio">
              }
              size="md"
            />
          </div>
        )}

        <OGFooter
          appIconUrl={appIcon}
          containerTw="mt-auto"
          siteName={OG_SITE_NAME}
        />
      </OGCard>
    </OGContainer>,
    {
      width: size.width,
      height: size.height,
    }
  );
}
