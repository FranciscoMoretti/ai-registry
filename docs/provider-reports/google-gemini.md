# Google Gemini Provider Report

## Summary

Google is a strong provider source, but it requires more careful lifecycle parsing than Anthropic or OpenAI.

What is easy:

- official `models.list` exists
- official docs clearly explain naming patterns
- the docs distinguish stable, preview, latest, and experimental

What is harder:

- aliasing is part of the product design
- lifecycle states matter a lot
- some model lines are deprecated or shut down quickly

Overall assessment:

- canonical identity source: strong
- lifecycle semantics: very strong
- mapping difficulty: medium-high

## Source Surfaces

### Structured API

Official reference:

- [Gemini API models methods](https://ai.google.dev/api/models)

The docs explicitly expose:

- `GET https://generativelanguage.googleapis.com/v1beta/models`
- `models.list`

They state that `models.list` returns the models available through the Gemini API and supports pagination.

### Structured Docs

Primary catalog page:

- [Gemini models catalog](https://ai.google.dev/gemini-api/docs/models)

This page is important because it explicitly documents the model version naming system:

- stable
- preview
- latest
- experimental

Observed examples:

- stable: `gemini-2.5-flash`
- preview: `gemini-2.5-flash-preview-09-2025`
- latest: `gemini-flash-latest`

The docs also explicitly note that some previous models are deprecated or shut down, which makes lifecycle handling mandatory.

## Fields We Can Reliably Extract

From `models.list`:

- model name
- supported actions
- paginated inventory of available models

From the docs:

- family
- lifecycle state
- deprecation and shutdown notices
- modality groups
- positioning text for model families

## Mapping Usefulness

Google is mapping-friendly if you model lifecycle explicitly.

Without lifecycle modeling, it becomes brittle.

Examples of important distinctions:

- `gemini-2.5-flash` is a stable model
- `gemini-2.5-flash-preview-09-2025` is a preview model
- `gemini-flash-latest` is an alias that can hot-swap

This means:

- `latest` should never be canonical
- preview should usually remain a distinct listing or alias edge
- shutdown/deprecated models need status tracking

## Release Date Situation

Google’s public docs are better at lifecycle than at explicit uniform release-date fields.

The naming convention sometimes includes month and year, but that is not always the true origin release date.

Recommended priority:

1. explicit Google release notes or model announcements
2. lifecycle docs when tied to exact model strings
3. Artificial Analysis release dates as enrichment

## Recommended Ingestion Strategy

1. Use `models.list` as the primary structured inventory.
2. Scrape the public models catalog page for lifecycle semantics.
3. Build a Gemini parser that separates:
   - family
   - version
   - lifecycle state
   - dated preview suffix
   - alias markers like `latest`

Suggested parser dimensions:

- family: `gemini`, `imagen`, `veo`, `lyria`, `embedding`
- generation: `2.5`, `3`, `3.1`
- lifecycle: `stable`, `preview`, `experimental`, `latest`, `deprecated`, `shut_down`
- modality: text, image, audio, video, embeddings, tools

## Risks

- `latest` aliases can move
- preview IDs can look very close to stable IDs
- deprecated models remain important for historical mapping but should not be treated as current canonical listings

## Recommended Confidence

- canonical inventory extraction: high
- lifecycle extraction: high
- gateway mapping: medium-high
- release date extraction: medium

## Sources

- [Gemini API models method docs](https://ai.google.dev/api/models)
- [Gemini models catalog](https://ai.google.dev/gemini-api/docs/models)
