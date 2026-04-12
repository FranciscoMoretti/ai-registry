# Model Mapping System

## Goal

Build a provider-first registry that:

- has one canonical identity for each origin model
- maps gateway listings from Vercel and OpenRouter onto those origin models
- tracks where each model is available
- supports filtering by gateway, provider, modality, reasoning, release date, pricing, context window, and other metadata
- scales as providers, gateways, and naming schemes evolve

This document is the design for a robust system, not a one-off string-matching script.

## Core Principle

Do not use gateway model IDs as the canonical identity.

Use origin providers as the source of truth for canonical identity whenever possible, then attach gateway listings as availability records.

In practice:

- provider docs and provider APIs define what the model is
- gateway catalogs define where the model is available and how the gateway exposes it
- benchmark registries enrich the model with release dates, scores, and cross-provider evidence

## Why This Is Hard

Different sources represent the same model in different ways:

- punctuation changes: `gpt-5.4` vs `gpt-5-4`
- provider aliases: `xai` vs `x-ai`, `mistral` vs `mistralai`, `zai` vs `z-ai`
- cloud wrappers:
  - Anthropic API: `claude-opus-4-20250514`
  - Bedrock: `anthropic.claude-opus-4-20250514-v1:0`
  - Vertex: `claude-opus-4@20250514`
- gateway productization:
  - `:free`
  - `-thinking`
  - `-fast`
  - `-preview`
  - `-beta`
- stable aliases vs snapshots:
  - Google explicitly distinguishes stable, preview, latest, and experimental versions
  - Anthropic explicitly distinguishes aliases from dated snapshots
- some gateways split variants that the provider does not split
- some providers expose models only in docs or HTML tables, not structured APIs

This means a single global normalization rule will not be enough. The system needs:

- generic parsing
- provider-specific parsers
- source-priority rules
- confidence-scored mappings
- manual review for ambiguous cases

## Source Categories

### 1. Origin Sources

These are the preferred identity sources.

- Provider APIs that list models
- Provider docs that explicitly enumerate model IDs or model cards
- Cloud model catalogs that preserve provider identity

Examples:

- OpenAI Models API
- Anthropic Models API and models overview
- Gemini `models.list`
- Bedrock supported models table
- Vertex AI Model Garden pages

### 2. Gateway Sources

These are availability sources, not identity sources.

- OpenRouter models API
- Vercel AI Gateway models API

Use these to answer:

- is this model available on this gateway?
- what gateway-specific price is shown?
- what capabilities does this gateway expose?

Do not let gateway IDs define canonical identity.

### 3. Registry / Enrichment Sources

These help with release dates, independent evidence, and extra cross-source signals.

- Artificial Analysis
- LiteLLM registry

Use them to enrich, not to override provider truth.

## Source Priority

For canonical identity:

1. provider structured API
2. provider official docs with explicit model IDs
3. cloud catalogs that preserve provider naming
4. gateway catalogs
5. enrichment registries

For release date:

1. provider official release notes or model page
2. provider structured metadata
3. Artificial Analysis `release_date`
4. inferred snapshot date in model ID, if the provider has a documented naming scheme

For capabilities and limits:

1. provider official docs/API
2. gateway structured metadata
3. enrichment registries

For gateway availability:

1. the gateway’s own live models list

## Canonical Data Model

The main design choice is to model identity separately from listings.

### `origin_provider`

Represents the model creator.

Fields:

- `id`
- `slug`
- `display_name`
- `official_domains`
- `source_priority`
- `aliases[]`

Examples:

- `openai`
- `anthropic`
- `google`
- `deepseek`
- `mistral`
- `xai`

### `origin_model`

Represents a canonical provider model or snapshot.

Fields:

- `id`
- `provider_id`
- `canonical_slug`
- `display_name`
- `family`
- `variant`
- `snapshot_date`
- `release_date`
- `status`
- `modality_in`
- `modality_out`
- `reasoning_mode`
- `context_window`
- `max_output_tokens`
- `knowledge_cutoff`
- `source_of_truth`

Important:

- `snapshot_date` and `release_date` are different
- `family` and `variant` should be parsed explicitly

Examples:

- `anthropic/claude-opus-4-1@20250805`
- `google/gemini-2.5-pro`
- `openai/gpt-5.2`

### `model_alias`

Represents alternate names for the same origin model.

Fields:

- `origin_model_id`
- `source_type`
- `source_name`
- `alias_id`
- `alias_kind`
- `active_from`
- `active_to`

Examples:

- Anthropic alias like `claude-opus-4-1`
- Google stable/latest aliases
- provider punctuation variants

### `gateway_listing`

Represents how a model appears on a gateway.

Fields:

- `id`
- `gateway`
- `gateway_model_id`
- `gateway_provider_slug`
- `display_name`
- `pricing`
- `context_window`
- `capabilities`
- `raw_payload`
- `last_seen_at`

Examples:

- `openrouter/openai/gpt-5`
- `vercel/google/gemini-3-pro`

### `gateway_mapping`

The edge from a gateway listing to an origin model.

Fields:

- `gateway_listing_id`
- `origin_model_id`
- `match_type`
- `confidence`
- `evidence[]`
- `review_status`
- `review_notes`

This is the critical table for gateway availability.

### `provider_surface`

Represents a fetchable source for a provider.

Fields:

- `provider_id`
- `surface_type`
- `surface_url`
- `auth_type`
- `fetch_strategy`
- `parser_name`
- `refresh_interval`
- `health_status`

Examples:

- structured API
- HTML model table
- docs page with cards
- release notes feed

## Ingestion Strategy

### A. Structured API First

When a provider offers a list models endpoint, use it.

Examples:

- OpenAI list models
- Anthropic list models
- Gemini `models.list`

Benefits:

- stable fields
- machine-readable limits
- lower parser maintenance

### B. Structured Docs Scraping

When the provider exposes a clear models page or model cards but not a good list API, scrape the docs page.

Examples:

- model overview tables
- static docs pages with canonical model IDs
- cloud catalog tables

Use:

- HTML extraction first
- then JSON-LD or embedded JSON if available
- screenshots only as last resort

### C. Cloud Catalog Parsers

Treat Bedrock and Vertex as special structured sources because they often preserve provider identity in a documented way.

Anthropic is the best example here because the docs explicitly map the same model across:

- Anthropic API
- AWS Bedrock
- GCP Vertex AI

That kind of table should become direct canonical mapping rules.

### D. Gateway Pollers

Poll gateways frequently.

For your use case:

- Vercel models list
- OpenRouter models list

These should produce `gateway_listing` rows, not `origin_model` rows.

### E. Enrichment Pollers

Poll enrichment sources less frequently.

Examples:

- Artificial Analysis model registry
- LiteLLM registry

Use cases:

- release dates
- benchmark links
- extra provider hints
- cross-source conflict detection

## Parsing Pipeline

Every ingested model string should go through a parser pipeline.

### Step 1. Raw extraction

Capture:

- original ID
- name
- provider string
- source URL
- raw metadata

Do not discard raw text.

### Step 2. Generic tokenizer

Split into:

- provider prefix
- family tokens
- numeric size tokens
- dated snapshot tokens
- modality tokens
- variant markers

Recognize tokens like:

- `preview`
- `latest`
- `experimental`
- `thinking`
- `reasoning`
- `fast`
- `mini`
- `nano`
- `vision`
- `image`
- `audio`
- `tts`
- `vl`
- `instruct`

### Step 3. Provider alias normalization

Examples:

- `x-ai` -> `xai`
- `mistralai` -> `mistral`
- `z-ai` -> `zai`
- `qwen` -> `alibaba`
- `meta-llama` -> `meta`
- `bytedance-seed` -> `bytedance`
- `moonshot-ai` -> `moonshotai`

This should be a maintained alias table, not hardcoded in ten places.

### Step 4. Provider-specific parser

This is where the system gets robust.

#### Anthropic parser

Rules:

- parse dated snapshots like `claude-opus-4-20250514`
- parse aliases like `claude-opus-4-0`
- parse Bedrock wrappers
- parse Vertex forms with `@YYYYMMDD`

This provider should be one of the first you implement because the official docs explicitly map all three surfaces.

#### Google parser

Rules:

- parse stable vs preview vs latest vs experimental
- parse explicit version codes like `-001`
- treat `latest` as alias, not canonical identity
- treat preview as separate lifecycle state

#### OpenAI parser

Rules:

- distinguish family vs tier: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- preserve dots in semantic versions but normalize for comparison
- parse `codex`, `chat`, `audio`, `image`, embeddings, moderation, search-preview

#### Qwen / Alibaba parser

Rules:

- handle provider alias `qwen` vs `alibaba`
- parse dense and MoE forms
- parse dated snapshots when present
- separate coder, vision-language, thinking, and preview variants

#### xAI parser

Rules:

- distinguish `grok-4`, `grok-4-fast`, `grok-4.20-*`
- keep `reasoning` and `non-reasoning` as explicit variant dimensions
- do not collapse beta/fast/reasoning variants unless intentional

#### Mistral parser

Rules:

- dated snapshots like `-2508`
- family generation upgrades
- distinct lines: `devstral`, `ministral`, `pixtral`, `codestral`, `mistral-small`

#### DeepSeek parser

Rules:

- handle renamed families where one registry uses `chat` and another uses versioned `v3.x`
- use description, context, and release date corroboration

### Step 5. Candidate generation

Generate origin model candidates for each gateway listing using:

- exact ID
- normalized punctuation
- provider alias rewrite
- same family token set
- snapshot date similarity
- same modality
- same reasoning mode
- same context window

### Step 6. Evidence scoring

Each mapping gets an evidence bundle.

Signals:

- exact official ID match
- exact official alias match
- provider alias match
- snapshot date match
- family tokens match
- modality match
- context window match
- same release date
- same provider docs URL reference
- same Artificial Analysis creator and slug shape

### Step 7. Confidence assignment

Suggested classes:

- `exact`
- `alias_exact`
- `normalized`
- `provider_alias`
- `curated`
- `lossy`
- `unsupported`

Suggested confidence scores:

- `1.00` exact
- `0.98` official alias
- `0.95` punctuation-only normalization
- `0.90` provider alias + exact family
- `0.75` curated family-specific rule
- `0.50` lossy collapse
- `0.00` unsupported

## Mapping Rules

### Safe auto-mapping

Auto-accept when one of these is true:

- exact canonical ID match
- exact official alias match
- provider alias + exact normalized suffix
- official doc explicitly states cross-platform equivalents

### Curated mapping

Needs provider-specific rules but can be auto-suggested:

- Bedrock wrapper to Anthropic API ID
- Vertex wrapper to Anthropic API ID
- Google stable ID to dated stable snapshot
- OpenRouter snapshot suffix to provider stable family

### Lossy mapping

Store, but do not use as canonical default unless the product explicitly asks for family-level grouping.

Examples:

- preview to stable
- fast to standard
- reasoning to non-reasoning
- gateway-specific beta variant collapsed to base family

### Unsupported

When there is no responsible mapping:

- no credible provider source
- multiple equally plausible targets
- image/audio/video family drift without clear official confirmation

## Product Model for Availability

For the site, gateway availability should be derived from mappings, not stored as a flat string list on the model.

Example query model:

- page is keyed by `origin_model`
- availability badges come from accepted `gateway_mapping` rows

This enables:

- "show all origin models available on OpenRouter"
- "show all origin models available on Vercel"
- "show all origin models available on both"
- "show origin models missing on OpenRouter but present on Vercel"

It also lets you attach gateway-specific price and capability deltas separately.

## Provider Onboarding Strategy

Do not try to build every provider parser to completion at once.

Use tiers.

### Tier 1: Highest ROI

Implement first:

- OpenAI
- Anthropic
- Google
- Mistral
- DeepSeek
- xAI
- Alibaba/Qwen
- MiniMax
- MoonshotAI

Reason:

- they appear across gateways
- they have many variants
- they drive most of the catalog complexity

### Tier 2: Important but lower complexity

- Cohere
- Perplexity
- Meta
- Nvidia
- Voyage
- Recraft

### Tier 3: Long tail

- image/video-specialized providers
- providers only available through one gateway
- providers with poor or unstable public docs

## Operational Workflow

### Nightly jobs

1. fetch provider sources
2. fetch gateway sources
3. fetch enrichment sources
4. normalize and parse
5. recompute candidate mappings
6. auto-accept high-confidence mappings
7. emit review queue for curated/lossy cases
8. publish derived catalog

### Monitoring

Track:

- fetch failures
- parser failures
- field drift
- sudden mapping drops
- new gateway listings with no candidate origin model
- origin models that disappear from a provider source

### Review queue

The system should produce a small review queue rather than failing silently.

Review items should show:

- gateway listing
- top candidate origin models
- evidence
- diff from previous accepted mapping

## Recommended Initial Implementation

### Phase 1

Build the core graph and get good results for the providers that matter most.

- tables for `origin_provider`, `origin_model`, `model_alias`, `gateway_listing`, `gateway_mapping`
- ingestion for:
  - Vercel
  - OpenRouter
  - Artificial Analysis
  - OpenAI
  - Anthropic
  - Google
- provider alias table
- exact + normalized + provider-alias matching

### Phase 2

Add cross-cloud provider mapping.

- Bedrock
- Vertex
- Azure catalog

### Phase 3

Add provider-specific parsers and review tooling.

- Mistral
- Qwen
- DeepSeek
- xAI
- MiniMax
- MoonshotAI

### Phase 4

Add scraper-backed providers with poor structured access.

## What Not To Do

- do not let OpenRouter or Vercel IDs define canonical identity
- do not flatten provider and gateway listings into one model table
- do not map based on fuzzy string match alone
- do not treat `latest` aliases as canonical
- do not overwrite raw source payloads
- do not store only the final mapping result without evidence

## Why This Will Scale

This design scales because:

- identity is separated from availability
- new gateways only add `gateway_listing` and `gateway_mapping`
- new providers only need one parser and one source bundle
- confidence-scored edges keep bad mappings from silently poisoning the catalog
- raw payload storage lets you re-run parsers when naming schemes change

## Recommended First Concrete Deliverables

1. canonical schema migration
2. source registry with fetch strategies
3. provider alias dictionary
4. Anthropic parser
5. Google parser
6. OpenAI parser
7. gateway ingestion for Vercel and OpenRouter
8. mapping scorer and review queue
9. nightly sync job
10. site query layer that derives gateway availability from accepted mappings
