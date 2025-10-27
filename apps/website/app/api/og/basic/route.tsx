import { ImageResponse } from "@vercel/og";
import { OGCard, OGContainer, OGFooter, OGTitle } from "@/lib/og/components";
import {
  getAppIconUrl,
  getBaseUrl,
  OG_BACKGROUND_IMAGE,
  OG_SIZE,
} from "@/lib/og/shared";

export const runtime = "edge";

const size = OG_SIZE;

function truncate(input: string, max: number) {
  if (!input) {
    return input;
  }
  return input.length > max ? `${input.slice(0, max - 3)}...` : input;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title");
  const description = url.searchParams.get("description");

  if (!(title && description)) {
    return new ImageResponse(
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1220",
          color: "white",
          fontSize: 28,
        }}
      >
        Missing required query parameters: title and description
      </div>,
      { width: size.width, height: size.height }
    );
  }

  const baseUrl = getBaseUrl();
  const appIcon = getAppIconUrl(baseUrl);

  const displayTitle = truncate(title, 60);
  const displayDescription = truncate(description, 160);

  return new ImageResponse(
    <OGContainer backgroundImage={OG_BACKGROUND_IMAGE}>
      <OGCard
        roundedTw="rounded-3xl"
        style={{ position: "relative", gap: "3rem" }}
      >
        <div style={{ display: "flex" }} tw="flex flex-1">
          <div style={{ display: "flex", gap: "1rem" }} tw="flex-1 flex-col">
            <div style={{ display: "flex" }} tw="flex items-start">
              <OGTitle
                largeTw="text-[80px]"
                maxWidthPx={980}
                smallTw="text-[60px]"
                text={displayTitle}
                threshold={40}
              />
            </div>

            <div
              style={{ display: "flex", maxWidth: "980px" }}
              tw="flex text-[40px] text-slate-300"
            >
              <span>{displayDescription}</span>
            </div>
          </div>
        </div>

        <OGFooter
          appIconUrl={appIcon}
          containerTw="mt-auto"
          siteName={"Sparka AI"}
        />
      </OGCard>
    </OGContainer>,
    {
      width: size.width,
      height: size.height,
    }
  );
}
