# @airegistry/vercel-gateway

Typed model registry and helpers for the Vercel AI Gateway. Gives you a stable set of `ProviderId`, `ModelId`, rich `ModelDefinition` metadata (context window, pricing, modalities, tags), and small utilities for working with model ids.

## Install

```bash
npm i @airegistry/vercel-gateway
```

## Quick start

```ts
import {
  allModels,
  getModelDefinition,
  providers,
  getModelAndProvider,
  type ModelId,
  type ProviderId,
} from "@airegistry/vercel-gateway";

// list providers
providers; // readonly ProviderId[]

// list all model definitions
allModels; // ModelDefinition[]

// look up one model by id
const def = getModelDefinition("openai/gpt-4o" satisfies ModelId);
def.context_window; // number
def.pricing.input; // string price per token

// split a model id
getModelAndProvider("openai/gpt-4o"); // { provider: "openai", model: "gpt-4o" }
```

## Exports

- **types**: `ModelId`, `ProviderId`, `ModelDefinition`
- **lists**: `providers: readonly ProviderId[]`
- **data**:
  - `allModels: ModelDefinition[]` (alias of `modelDefinitions`)
  - `modelDefinitionMap: Map<ModelId, ModelDefinition>`
  - `getModelDefinition(modelId): ModelDefinition`
- **utils**: `getModelAndProvider(modelId | ImageModelId)` → `{ provider, model }`
- Also re-exports image model data when available: `imageModelsData`, `type ImageModelData`

## ModelDefinition shape

Each entry merges generated gateway data with extra metadata:

```ts
type ModelDefinition = {
  id: ModelId;
  owned_by: ProviderId;
  name: string;
  description: string;
  type: "language" | "embedding";
  tags?: (
    | "file-input"
    | "image-generation"
    | "implicit-caching"
    | "reasoning"
    | "tool-use"
    | "vision"
  )[];
  context_window: number;
  max_tokens: number;
  pricing: {
    input: string;
    output: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
  reasoning: boolean;
  toolCall: boolean;
  input: {
    image: boolean;
    text: boolean;
    pdf: boolean;
    video: boolean;
    audio: boolean;
  };
  output: { image: boolean; text: boolean; audio: boolean };
  // plus extra fields like releaseDate
};
```

## Notes

- All exports are fully typed. Unknown model ids throw in `getModelDefinition`.
- IDs follow the `provider/model` convention; use `getModelAndProvider` to parse.

## License

MIT
