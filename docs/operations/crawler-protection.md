# Crawler protection and comparison caching

Prepared October 7, 2026 against production source `8b68f69ca53d2fb726b227ad804bc59ba8481bda`. Publication is pending user authorization; neither this document nor the JSON changes Vercel configuration automatically.

## Application change

Comparison pages now return an empty array from `generateStaticParams`, enabling on-demand static generation without enumerating model pairs. Existing page revalidation and the model data's 3,600-second revalidation remain in place. The cached page's effective freshness also depends on its cached data. Base comparisons remain indexable; parameterized comparisons remain noindex.

`public/robots.txt` disallows both `meta-externalagent` and `meta-webindexer`. Other agents retain the existing allow policy. Robots directives depend on crawler cooperation; the firewall change below supplies enforcement before application execution. Each uncached comparison URL still incurs initial rendering, so caching alone does not solve bulk crawling of distinct URLs.

## Pending production firewall change

Project: `ai-registry` (`prj_FR2WIgGRL64Liqnix4RGD47eaYNT`), team `francisco-morettis-projects`.

After authorization, open the project's Firewall custom rules. Re-read the active configuration and inspect any draft before editing; do not overwrite concurrent changes. Edit existing rule `rule_block_meta_external_agent_f6febr` (currently “Block Meta external agent”) to match the reviewed rule in [meta-crawler-rule.json](meta-crawler-rule.json). This file is one rule, not a full configuration or API request body.

Use action **Deny** with these two OR groups:

- User Agent contains `meta-externalagent` AND Request Path does not equal `/robots.txt`.
- User Agent contains `meta-webindexer` AND Request Path does not equal `/robots.txt`.

The `/robots.txt` exception must be present in both groups. Vercel documents these operators as case-insensitive. Keep the rule active, review the draft diff, and publish only the authorized change. Leave managed Bot Protection, AI Bots, and other rules at their existing settings. Neither condition matches `facebookexternalhit` or `Facebot`, preserving the existing link-preview policy. No billing change is required by this plan.

## Verification

Run the application checks from the repository root:

```sh
pnpm --filter website build
pnpm --filter website check-types
pnpm --filter website start
```

With the production server running, in a separate terminal:

```sh
node apps/website/scripts/check-compare-cache.mjs
```

The script checks base, single-model, and paired paths twice, requiring shared-cache headers, a repeated-request cache HIT, and the existing robots metadata. Override `CHECK_BASE_URL` to check another server. For production, also inspect `x-vercel-cache`, `age`, and the Vercel cache metrics; CDN header presentation may differ from `next start`.

After authorized code deployment and firewall publication, verify `/`, a comparison URL, and `/api/og/compare` with each blocked agent: expect 403. Verify `/robots.txt` with both blocked agents: expect 200 and both disallow tokens. Verify regular browser, `facebookexternalhit`, and `Facebot` requests to the same page paths: expect 200. Check an actual shared link preview and its OG image. Confirm meta-webindexer traffic moves to denied requests, then compare function invocations and Fluid CPU over comparable traffic windows. Do not infer savings from HTTP cache headers alone.

Rollback the firewall by removing only the added web-indexer OR group and restoring the prior name/description, then reviewing and publishing. Application rollback is a redeploy of the prior production commit; keep it separate from firewall rollback.

References: [Next.js runtime static generation](https://nextjs.org/docs/app/api-reference/functions/generate-static-params), [Vercel rule configuration](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration).
