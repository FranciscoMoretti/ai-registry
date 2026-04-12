# Mistral Provider Report

## Summary

Mistral is a good provider source if you treat the docs page as a structured table rather than trying to infer everything from gateway IDs.

What is easy:

- the docs enumerate many model IDs directly
- the page includes version strings and dates
- model lines are clearly separated: Mistral, Ministral, Pixtral, Codestral, Magistral, Devstral

What is harder:

- many model names are family names while IDs include dated snapshot suffixes
- the docs page is richer than a simple API list and needs a parser
- open-weight and hosted lines coexist

Overall assessment:

- canonical identity source: strong
- lifecycle/snapshot source: strong
- mapping difficulty: medium

## Source Surfaces

### Official Docs

Primary source:

- [Mistral models docs](https://docs.mistral.ai/getting-started/models)

This page exposes many explicit IDs alongside product names and dates.

Observed examples:

- `mistral-small-2503`
- `codestral-2501`
- `pixtral-large-2411`
- `ministral-3b-2410`
- `ministral-8b-2410`
- `mistral-large-2407`
- `open-codestral-mamba`
- `open-mixtral-8x22b`

It also appears to include date columns, which are useful for release tracking and retirement windows.

## Fields We Can Reliably Extract

From the docs:

- display name
- model family
- explicit model ID
- version suffix
- associated dates shown in the table
- distinction between hosted and open models

## Mapping Usefulness

Mistral is highly mappable if the parser understands dated snapshot suffixes.

Common patterns:

- family marketing name vs specific model ID
- dated snapshot suffixes:
  - `-2501`
  - `-2411`
  - `-2407`
- open-weight prefixes:
  - `open-mistral-*`
  - `open-mixtral-*`

This means you should not map `mistral-small` to every `mistral-small-*` variant automatically.

Instead:

- canonical model should usually be the dated provider ID when one is explicitly listed
- family aliases should be stored separately

## Release Date Situation

Mistral’s docs are better than many providers here because the table visibly contains dates near the model IDs.

Those dates still need field-level parsing and validation, but this is a strong base.

Recommended priority:

1. Mistral docs table dates
2. Mistral release notes if needed
3. enrichment sources for backfill

## Recommended Ingestion Strategy

1. Scrape the models docs table.
2. Parse the explicit model IDs and date columns.
3. Split hosted and open model lines.
4. Map gateway aliases back to the dated provider IDs when possible.

Suggested parser dimensions:

- family: `mistral`, `ministral`, `pixtral`, `codestral`, `magistral`, `devstral`
- snapshot suffix: `YYMM`
- hosting type: hosted vs open
- generation number embedded in display name vs explicit dated API ID

## Risks

- family names are easy to confuse with specific dated API IDs
- older lines may remain in docs while newer lines become default in gateways
- open-weight and hosted lines should not be merged accidentally

## Recommended Confidence

- canonical ID extraction: high
- release/snapshot extraction: high
- gateway mapping: medium-high

## Sources

- [Mistral models docs](https://docs.mistral.ai/getting-started/models)
