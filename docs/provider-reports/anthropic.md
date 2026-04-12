# Anthropic Provider Report

## Summary

Anthropic is one of the best providers for cross-surface mapping.

What is easy:

- official docs provide explicit model comparison tables
- the docs list Anthropic API IDs, AWS Bedrock IDs, and Vertex AI IDs side by side
- aliases and dated snapshots are explicit

What is weaker:

- the public docs are stronger than the public unauthenticated API surface
- some historical models may move or be summarized rather than fully enumerated

Overall assessment:

- canonical identity source: very strong
- cross-cloud mapping source: excellent
- release date source: medium

## Source Surfaces

### Official Docs

Primary source:

- [Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview)

This page is unusually valuable because it explicitly states that models are available via:

- Claude API
- AWS Bedrock
- Google Vertex AI

It also includes side-by-side identifiers for those surfaces.

Observed example from the page:

- Claude API ID: `claude-opus-4-6`
- Claude API alias: `claude-opus-4-6`
- AWS Bedrock ID: `anthropic.claude-opus-4-6-v1`
- GCP Vertex AI ID: `claude-opus-4-6`

For another model:

- Claude API ID: `claude-haiku-4-5-20251001`
- Claude API alias: `claude-haiku-4-5`
- AWS Bedrock ID: `anthropic.claude-haiku-4-5-20251001-v1:0`
- Vertex AI ID: `claude-haiku-4-5@20251001`

This is exactly the kind of official mapping evidence the registry system should trust highly.

### Structured API

Anthropic offers an authenticated API, but for mapping purposes the public docs already provide unusually good structured mapping signals.

That means Anthropic can be onboarded early even before using auth-backed API ingestion.

## Fields We Can Reliably Extract

From the docs page:

- display name
- family
- Anthropic API ID
- Anthropic alias
- Bedrock ID
- Vertex AI ID
- pricing
- context window
- max output
- thinking support
- knowledge cutoff

## Mapping Usefulness

Anthropic should be one of the first providers onboarded because it gives you direct official mapping rules across surfaces.

Important mapping patterns:

- canonical provider ID vs alias
- provider ID vs dated snapshot
- Bedrock wrapper:
  - `anthropic.claude-...-v1:0`
- Vertex wrapper:
  - `claude-...@YYYYMMDD`

This lets you write high-confidence parser rules instead of relying on fuzzy matching.

## Release Date Situation

The overview page includes rich metadata like knowledge cutoff and training cutoff, but not a standardized explicit release date field for every row.

Still, Anthropic’s snapshot naming is strong enough that dated variants can often be anchored by the official IDs themselves.

Recommended priority:

1. Anthropic official docs and release notes
2. explicit dated snapshot in model IDs
3. enrichment sources such as Artificial Analysis

## Recommended Ingestion Strategy

1. Scrape the models overview page as a first-class source.
2. Build an Anthropic-specific parser for:
   - provider ID
   - alias
   - Bedrock ID
   - Vertex ID
   - optional snapshot date
3. Store these as official alias edges, not heuristic matches.

Suggested parser dimensions:

- family: `opus`, `sonnet`, `haiku`
- generation: `4`, `4.1`, `4.6`
- snapshot date if present
- alias vs dated snapshot
- platform wrapper: `claude api`, `bedrock`, `vertex`

## Risks

- some Bedrock IDs include wrapper suffixes like `-v1:0`
- some models use alias IDs while others use explicit dated snapshots
- older doc pages may change structure over time

## Recommended Confidence

- canonical ID extraction: high
- official alias extraction: high
- Bedrock and Vertex mapping: very high
- release date extraction: medium

## Sources

- [Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
