# AI Registry

Typed model registry, utilities, and a model explorer website for Vercel AI Gateway.

This monorepo contains:

- packages: reusable libraries published to npm
  - `@ai-registry/vercel-gateway`: typed model list/metadata and small helpers for Vercel AI Gateway
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
pnpm --filter @ai-registry/vercel-gateway build
pnpm --filter @ai-registry/vercel-gateway test
```

## Packages

### @ai-registry/vercel-gateway

Typed model registry and helpers for the Vercel AI Gateway. Provides a stable set of `ProviderId`, `ModelId`, rich `ModelDefinition` metadata (context window, pricing, modalities, tags), and utilities.

Install:

```bash
npm i @ai-registry/vercel-gateway
# or
pnpm add @ai-registry/vercel-gateway
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
} from "@ai-registry/vercel-gateway";

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

## Contributing

Issues and PRs welcome. See `CONTRIBUTING.md` for setup, workflow, and commit conventions, and `CODE_OF_CONDUCT.md` for community guidelines.

## License

MIT. See `LICENSE` for details.

## Links

- Homepage: `https://ai-registry.dev`
- Package: `@ai-registry/vercel-gateway`
