# OpenAI Provider Report

## Summary

OpenAI is a strong source for canonical model identity.

What is easy:

- official list endpoint exists
- official docs expose current flagship and specialized models
- model IDs are explicit and stable-looking

What is weaker:

- the list endpoint is sparse
- some rich metadata is only present in docs, not in the basic list response
- release dates are not clearly exposed in the list endpoint

Overall assessment:

- canonical identity source: strong
- release date source: medium
- gateway mapping friendliness: strong

## Source Surfaces

### Structured API

Official endpoint:

- `GET https://api.openai.com/v1/models`

Official reference:

- [List models](https://developers.openai.com/api/reference/resources/models/methods/list)

Observed from docs:

- the endpoint lists models and returns `id`, `created`, `object`, and `owned_by`
- this is enough for canonical IDs, but not enough for a rich model card

Evidence:

- [OpenAI API reference](https://developers.openai.com/api/reference/resources/models/methods/list)
- the docs state: `GET /models` and “Lists the currently available models” with fields including `id`, `created`, and `owned_by`

### Structured Docs

Official catalog page:

- [OpenAI models catalog](https://developers.openai.com/api/docs/models)

This page is useful because it exposes:

- model IDs
- reasoning modes
- context window
- max output
- tools
- knowledge cutoff
- specialized models like image, realtime, speech, and transcription

Examples from the page:

- `gpt-5.4`
- `gpt-5.4-mini`
- `gpt-5.4-nano`
- `gpt-image-1-mini`

## Fields We Can Reliably Extract

From the API:

- model ID
- owner
- created timestamp

From the docs:

- display name
- model ID
- family and tier
- reasoning support
- input/output pricing
- latency tier
- max output
- context window
- tool support
- knowledge cutoff
- specialized-task grouping

## Mapping Usefulness

OpenAI is relatively mapping-friendly because:

- model IDs are already in the form the ecosystem tends to reuse
- Vercel and OpenRouter often preserve the same IDs for core models
- punctuation normalization is usually enough for many matches

Common mapping patterns to expect:

- exact: `openai/gpt-5`
- punctuation normalization: `gpt-5.4` vs `gpt-5-4`
- variant expansion:
  - provider: `gpt-5.4`
  - registry or benchmark: `gpt-5-4`
- specialized families:
  - `gpt-image-*`
  - `gpt-realtime-*`
  - `gpt-4o-*`
  - `o*`

## Release Date Situation

OpenAI’s list endpoint exposes `created`, not a clearly documented model release date.

The catalog page exposes “knowledge cutoff” and “latest” positioning, but not a consistent explicit release date field for every model card.

Recommended priority for release date:

1. OpenAI release notes or model announcement pages when available
2. enrichment source such as Artificial Analysis
3. API `created` only as a fallback

## Recommended Ingestion Strategy

1. Use the models API as the canonical inventory source.
2. Use the official model catalog docs to enrich metadata.
3. Parse dotted versions and family tiers explicitly.
4. Store a normalized comparison form without replacing the official ID.

Suggested parser dimensions:

- family: `gpt`, `gpt-image`, `gpt-realtime`, `o`
- version: `5.4`, `4.1`, `4o`
- tier: `mini`, `nano`, `pro`
- specialization: `codex`, `audio`, `image`, `transcribe`

## Risks

- “latest” and marketing text should not become canonical IDs
- knowledge cutoff is not the same thing as release date
- specialized models may appear in docs before or after list endpoint changes

## Recommended Confidence

- canonical ID extraction: high
- gateway mapping: high
- release date extraction: medium

## Sources

- [OpenAI list models API reference](https://developers.openai.com/api/reference/resources/models/methods/list)
- [OpenAI models catalog](https://developers.openai.com/api/docs/models)
