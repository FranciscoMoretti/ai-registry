# AI Registry

https://github.com/user-attachments/assets/bfc21467-2d39-47fd-8667-cc359269175d

A model explorer website for AI gateways. Auto-fetches the latest models from Vercel AI Gateway and lets you browse, compare, and filter them.

## Monorepo Info

This monorepo contains:

- `apps/website`: a Next.js model explorer that fetches models at runtime from supported AI gateways (currently Vercel AI Gateway), with caching and a build-time fallback snapshot

## Monorepo quick start

Prerequisites:

- Node.js >= 22
- pnpm (repo uses `packageManager: pnpm@10.x`)

Install dependencies at the root:

```bash
pnpm install
```

Common scripts (powered by Turbo):

- develop everything: `pnpm dev`
- build everything: `pnpm build`
- typecheck: `pnpm check-types`

Run the website:

```bash
pnpm --filter website dev
```

## How models are loaded

The website fetches models on the server using `unstable_cache` (1-hour TTL, tag-based revalidation). The active gateway is resolved via a registry abstraction in `apps/website/lib/ai/gateways/`, currently providing Vercel AI Gateway. Adding more gateways is just a matter of implementing the `GatewayProvider` interface and registering it.

If the live fetch fails (e.g. during build with no network), a generated snapshot at `apps/website/lib/ai/models.generated.ts` is used as a fallback. Refresh it with:

```bash
pnpm fetch:models
```

The Vercel gateway requires an `AI_GATEWAY_API_KEY` (or `VERCEL_OIDC_TOKEN`) at runtime/build time when fetching live data.

## License

MIT. See `LICENSE` for details.
