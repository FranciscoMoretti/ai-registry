# AI Registry

https://github.com/user-attachments/assets/bfc21467-2d39-47fd-8667-cc359269175d

Typed model registry, utilities, and a model explorer website for Vercel AI Gateway.

## Monorepo Info

This monorepo contains:

- packages: reusable libraries published to npm
  - `@airegistry/vercel-gateway`: typed model list/metadata and small helpers for Vercel AI Gateway
- apps: end-user applications
  - `website`: a Next.js model explorer to browse all gateway models, compare specs/pricing, and discover capabilities

## Monorepo quick start

Prerequisites:

- Node.js >= 18
- pnpm (repo uses `packageManager: pnpm@10.x`)

Install dependencies at the root:

```bash
pnpm install
```

Common scripts (powered by Turbo):

- develop everything: `pnpm dev`
- build everything: `pnpm build`
- test everything: `pnpm test`

Run a single workspace:

```bash
# website (Next.js app)
pnpm --filter website dev

# vercel-gateway package
pnpm --filter @airegistry/vercel-gateway build
pnpm --filter @airegistry/vercel-gateway test
```

## Packages

### @airegistry/vercel-gateway

Typed model registry and helpers for the Vercel AI Gateway. Provides a stable set of `ProviderId`, `ModelId`, rich `ModelDefinition` metadata (context window, pricing, modalities, tags), and utilities.

Install:

```bash
npm i @airegistry/vercel-gateway
# or
pnpm add @airegistry/vercel-gateway
```

Quick start:

```ts
import {
  allModels,
  getModelDefinition,
  providers,
  getModelAndProvider,
  type ModelId,
  type ProviderId,
} from "@airegistry/vercel-gateway";

providers; // readonly ProviderId[]
allModels; // ModelDefinition[]

const def = getModelDefinition("openai/gpt-4o" satisfies ModelId);
def.context_window; // number
def.pricing.input; // price per token (string)

getModelAndProvider("openai/gpt-4o");
// { provider: "openai", model: "gpt-4o" }
```

Exports:

- types: `ModelId`, `ProviderId`, `ModelDefinition`
- lists/data: `providers`, `allModels`, `modelDefinitionMap`, `getModelDefinition(id)`
- utils: `getModelAndProvider(modelId | ImageModelId)`

## Apps

### website (Model Explorer)

Next.js app to explore Vercel AI Gateway models:

- browse providers and models
- compare context window, max tokens, pricing, and capabilities (vision, tools, reasoning, etc.)
- search/filter across the full registry

Develop locally:

```bash
pnpm --filter website dev
```

Build/start:

```bash
pnpm --filter website build
pnpm --filter website start
```

## Releases & publishing

This repo uses Changesets and GitHub Actions to version and publish packages. Merging PRs with changesets will trigger a version PR; publishing happens automatically on merge to `main`.

## License

MIT. See `LICENSE` for details.
