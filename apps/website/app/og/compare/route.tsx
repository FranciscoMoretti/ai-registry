import { allModels } from '@ai-registry/vercel-gateway';
import { ImageResponse } from '@vercel/og';
import {
  OGCard,
  OGContainer,
  OGFooter,
  OGIcon,
  OGTitle,
} from '@/lib/og/components';
import { ModalitiesRow } from '@/lib/og/ModalitiesRow';
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
  truncate,
} from '@/lib/og/shared';
import { getProviderIconUrl } from '../../../lib/get-provider-icon-url';

export const runtime = 'edge';

const size = OG_SIZE;

// remove local helpers in favor of shared utilities

export async function GET(req: Request) {
  const url = new URL(req.url);
  const modelId1 = url.searchParams.get('modelId1');
  const modelId2 = url.searchParams.get('modelId2');

  if (!modelId1) {
    return new ImageResponse(
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1220',
          color: 'white',
          fontSize: 28,
        }}
      >
        Missing required query parameter: modelId1
      </div>,
      { width: size.width, height: size.height },
    );
  }

  const left = allModels.find((m) => m.id === modelId1) || null;
  const right = modelId2
    ? allModels.find((m) => m.id === modelId2) || null
    : null;

  // modelId1 is required, so no ecosystem summary branch

  const leftProvider = capitalizeFirst(
    (left?.owned_by || (modelId1?.split('/')?.[0] ?? '')) as string,
  );
  const rightProvider = right
    ? capitalizeFirst(
        (right?.owned_by || (modelId2?.split('/')?.[0] ?? '')) as string,
      )
    : '';
  const leftTitle = truncate(
    `${left?.name || modelId1?.split('/')?.[1] || ''}`.trim(),
    30,
  );

  const rightTitle = right
    ? truncate(`${right?.name || modelId2?.split('/')?.[1] || ''}`.trim(), 30)
    : 'Other Models';
  const baseUrl = getBaseUrl();
  const leftIcon = left ? getProviderIconUrl(left.owned_by, baseUrl) : null;
  const rightIcon = right ? getProviderIconUrl(right.owned_by, baseUrl) : null;
  const appIcon = getAppIconUrl(baseUrl);
  const arrowRight = getArrowRightUrl(baseUrl);
  const capabilityIcons = getCapabilityIcons(baseUrl);

  return new ImageResponse(
    <OGContainer backgroundImage={OG_BACKGROUND_IMAGE}>
      <OGCard
        roundedTw="rounded-3xl"
        style={{ position: 'relative', gap: '3rem' }}
      >
        <div
          style={{ display: 'flex', gap: '2rem' }}
          tw="flex flex-1 justify-between"
        >
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexDirection: 'column',
              width: '450px',
            }}
            tw="flex-1 flex-col"
          >
            <div
              style={{ display: 'flex', gap: '1.25rem' }}
              tw="flex items-center h-[105px] "
            >
              {leftIcon ? (
                <OGIcon alt={`${leftProvider} logo`} size="sm" src={leftIcon} />
              ) : (
                <div
                  style={{ display: 'flex' }}
                  tw="w-[84px] h-[84px] rounded-xl bg-white/10 flex items-center justify-center text-white/80 text-4xl font-bold"
                >
                  {leftProvider.slice(0, 1)}
                </div>
              )}
              <div style={{ display: 'flex' }} tw="flex flex-col">
                <OGTitle
                  largeTw="text-[44px]"
                  maxWidthPx={350}
                  smallTw="text-[40px]"
                  text={leftTitle}
                  threshold={20}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '.5rem',
                alignItems: 'flex-start',
              }}
              tw="flex flex-col text-2xl text-slate-300"
            >
              {buildBulletItems(left).map((item, idx) => (
                <span
                  key={`l-${item.label}-${idx}`}
                  style={{ display: 'flex', gap: '.5rem' }}
                >
                  <span>{item.label}</span>
                  <span tw="text-white">{item.value}</span>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex' }} tw="">
              <ModalitiesRow
                arrowRightUrl={arrowRight}
                capabilityIcons={capabilityIcons}
                inputKeys={inputModalitiesOrder.filter(
                  (key) => left?.input?.[key],
                )}
                outputKeys={outputModalitiesOrder.filter(
                  (key) => left?.output?.[key],
                )}
                size="md"
              />
            </div>
          </div>

          <div
            style={{
              width: '50px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pointerEvents: 'none',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '1px',
                height: '150px',
                background: 'rgba(255,255,255,0.10)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '90px',
                height: '90px',
                borderRadius: '9999px',
                // background: 'rgba(255,255,255,0.05)',
                // border: '1px solid rgba(255,255,255,0.10)',
              }}
              tw="text-[50px] font-bold text-slate-100"
            >
              <div style={{ display: 'flex' }}>VS</div>
            </div>
            <div
              style={{
                width: '1px',
                height: '150px',
                background: 'rgba(255,255,255,0.10)',
              }}
            />
          </div>

          {right ? (
            <div
              style={{ display: 'flex', gap: '1.5rem', width: '450px' }}
              tw="flex-1 flex flex-col items-end"
            >
              <div
                style={{ display: 'flex', gap: '1.25rem' }}
                tw="flex items-center justify-end h-[105px]"
              >
                <div style={{ display: 'flex' }} tw="flex flex-col items-end">
                  <OGTitle
                    largeTw="text-[44px]"
                    maxWidthPx={350}
                    smallTw="text-[40px]"
                    text={rightTitle}
                    threshold={20}
                  />
                </div>
                {rightIcon ? (
                  <OGIcon
                    alt={`${rightProvider} logo`}
                    size="sm"
                    src={rightIcon}
                  />
                ) : (
                  <div
                    style={{ display: 'flex' }}
                    tw="w-[84px] h-[84px] rounded-xl bg-white/10 flex items-center justify-center text-white/80 text-4xl font-bold"
                  >
                    {rightProvider.slice(0, 1)}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '.5rem',
                  alignItems: 'flex-end',
                }}
                tw="flex flex-col items-end text-2xl text-slate-300"
              >
                {buildBulletItems(right).map((item, idx) => (
                  <span
                    key={`r-${item.label}-${idx}`}
                    style={{ display: 'flex', gap: '.5rem' }}
                  >
                    <span>{item.label}</span>
                    <span tw="text-white">{item.value}</span>
                  </span>
                ))}
              </div>

              <div
                style={{ display: 'flex' }}
                tw="flex items-center justify-end"
              >
                <ModalitiesRow
                  arrowRightUrl={arrowRight}
                  capabilityIcons={capabilityIcons}
                  inputKeys={inputModalitiesOrder.filter(
                    (key) => right?.input?.[key],
                  )}
                  outputKeys={outputModalitiesOrder.filter(
                    (key) => right?.output?.[key],
                  )}
                  size="md"
                />
              </div>
            </div>
          ) : (
            <div
              style={{ display: 'flex', width: '450px' }}
              tw="flex-1 flex items-center justify-center"
            >
              <div
                style={{ display: 'flex' }}
                tw="text-[44px] leading-[1.1] font-bold text-white tracking-tight"
              >
                {rightTitle}
              </div>
            </div>
          )}
        </div>

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
    },
  );
}
