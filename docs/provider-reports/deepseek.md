# DeepSeek Provider Report

## Summary

DeepSeek is usable as a provider source, but today it appears much less rich than Anthropic, Google, or Mistral.

What is easy:

- public docs expose concrete API model names
- the pricing page links model names to a provider model version
- reasoning and non-reasoning split is explicit

What is harder:

- the public surface is narrow
- only a small number of exposed API IDs are clearly documented on the public page
- marketing/web versions may differ from API versions

Overall assessment:

- canonical identity source: medium
- release date source: weak-medium
- mapping usefulness: medium

## Source Surfaces

### Official Docs

Primary source:

- [DeepSeek models and pricing](https://api-docs.deepseek.com/quick_start/pricing)

This page is useful because it explicitly states:

- `deepseek-chat`
- `deepseek-reasoner`
- both correspond to model version `DeepSeek-V3.2`

It also exposes:

- context length
- max output defaults and maximums
- feature support
- pricing

Observed mapping from the page:

- `deepseek-chat` -> `DeepSeek-V3.2` non-thinking mode
- `deepseek-reasoner` -> `DeepSeek-V3.2` thinking mode

The page also notes that these differ from the APP/WEB version, which is important for canonical modeling.

## Fields We Can Reliably Extract

From the public docs page:

- public API ID
- internal/provider model version string
- reasoning mode
- context window
- output limits
- feature support
- pricing

## Mapping Usefulness

DeepSeek is valuable specifically because it gives an official bridge between API listing names and an underlying provider version.

That helps explain differences like:

- gateway model ID showing a versioned family such as `deepseek-v3.2`
- provider API exposing simpler names like `deepseek-chat`

This should be modeled as:

- canonical origin model: `deepseek/deepseek-v3.2`
- provider aliases:
  - `deepseek-chat`
  - `deepseek-reasoner`

with reasoning mode represented separately

## Release Date Situation

The public pricing page does not expose a clean explicit release date.

Recommended priority:

1. DeepSeek changelog or release notes
2. enrichment sources such as Artificial Analysis
3. gateway `released` values only as weak corroboration

## Recommended Ingestion Strategy

1. Scrape the public pricing/models page.
2. Extract the alias-to-version mapping.
3. Treat reasoning and non-reasoning as variant dimensions, not unrelated models.
4. Backfill release dates from enrichment sources until a better official source is found.

Suggested parser dimensions:

- public API ID
- underlying version string
- reasoning mode
- context window
- max output

## Risks

- provider public docs may lag the actual API inventory
- app/web naming is explicitly different from API naming
- the available public source is smaller and less table-rich than other providers

## Recommended Confidence

- API alias extraction: high
- canonical version inference from docs: medium-high
- release date extraction: low-medium

## Sources

- [DeepSeek models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
