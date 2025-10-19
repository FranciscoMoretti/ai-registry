# Models pipeline

Commands:

- Fetch base models, ids and providers
  ```bash
  bun run models:fetch
  ```
- Generate features (delta-based), write missing list
  ```bash
  bun run models:features
  ```
- Full sync + typecheck
  ```bash
  bun run models:sync
  ```

Artifacts / snapshots:

- `lib/models/responses/gateway/models.json` — snapshot of GET /v1/models
- `lib/models/responses/gateway/<provider>/<model>/endpoints.json` — per-model endpoint snapshot
- `lib/models/responses/models-dev/models.json` — snapshot of models.dev catalog

Generated data:

- `lib/models/models.generated.ts` — structured models built from gateway + endpoints
- `lib/models/outputs/models-list.json` — list of supported model ids (source for features step)
- `lib/models/outputs/providers-list.json` — provider ids
- `lib/models/model-extra.generated.ts` — releaseDate from models.dev for delta
- `lib/models/model-extra.manual.ts` — hand-curated releaseDate for ids not in models.dev
- `lib/models/model-extra.ts` — aggregator of generated + manual
- `lib/models/outputs/missing-model-extra.json` — new delta ids still lacking releaseDate

Notes:

- The features step computes the delta as: supported ids − generated keys − manual keys.
- Edit only the manual file for missing IDs; re-run sync to clear the missing list.
- To skip already-fetched endpoints, use `bun run models:sync` (skip mode). To refetch all, use `bun run models:sync:all`.

