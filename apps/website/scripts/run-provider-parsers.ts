import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeProviderResult } from "./provider-normalizers";
import { AnthropicProviderParser } from "./provider-parsers/anthropic";
import { DeepSeekProviderParser } from "./provider-parsers/deepseek";
import { GoogleGeminiProviderParser } from "./provider-parsers/google-gemini";
import { MistralProviderParser } from "./provider-parsers/mistral";
import { OpenAIProviderParser } from "./provider-parsers/openai";
import type { ProviderParseResult } from "./provider-parsers/types";
import type { ProviderNormalizeResult } from "./provider-normalizers/types";

const outputRoot = join(process.cwd(), "scripts", "outputs", "provider-parsers");
const rawRoot = join(outputRoot, "raw");
const normalizedRoot = join(outputRoot, "normalized");

async function main() {
  mkdirSync(outputRoot, { recursive: true });
  mkdirSync(rawRoot, { recursive: true });
  mkdirSync(normalizedRoot, { recursive: true });

  const parsers = [
    new OpenAIProviderParser(),
    new AnthropicProviderParser(),
    new GoogleGeminiProviderParser(),
    new MistralProviderParser(),
    new DeepSeekProviderParser(),
  ];

  const results: ProviderParseResult[] = [];
  const normalizedResults: ProviderNormalizeResult[] = [];

  for (const parser of parsers) {
    console.log(`Fetching and parsing ${parser.providerSlug} from ${parser.sourceUrl}`);
    const { rawHtml, result } = await parser.run();

    writeFileSync(join(rawRoot, `${parser.providerSlug}.html`), rawHtml);
    writeFileSync(
      join(outputRoot, `${parser.providerSlug}.json`),
      `${JSON.stringify(result, null, 2)}\n`
    );

    const normalized = normalizeProviderResult(result);
    writeFileSync(
      join(normalizedRoot, `${parser.providerSlug}.json`),
      `${JSON.stringify(normalized, null, 2)}\n`
    );

    results.push(result);
    normalizedResults.push(normalized);
    console.log(`Parsed ${result.modelCount} models for ${parser.providerSlug}`);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    providers: results.map((result) => ({
      provider: result.provider,
      reportPath: result.reportPath,
      sourceUrl: result.sourceUrl,
      modelCount: result.modelCount,
      normalizedModelCount:
        normalizedResults.find((normalized) => normalized.provider === result.provider)
          ?.normalizedModelCount ?? null,
      aliasCount:
        normalizedResults.find((normalized) => normalized.provider === result.provider)
          ?.aliasCount ?? null,
    })),
  };

  writeFileSync(join(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
