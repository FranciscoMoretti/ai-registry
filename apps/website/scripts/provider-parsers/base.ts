import type { ProviderParseResult } from "./types";

export abstract class ProviderParser {
  abstract readonly providerSlug: string;
  abstract readonly reportPath: string;
  abstract readonly sourceUrl: string;

  protected buildHeaders(): HeadersInit {
    return {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "ai-registry-provider-parser/1.0",
    };
  }

  protected async fetchSource(): Promise<string> {
    const response = await fetch(this.sourceUrl, {
      headers: this.buildHeaders(),
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `${this.providerSlug} source returned ${response.status} ${response.statusText}`
      );
    }

    return response.text();
  }

  abstract parse(html: string): ProviderParseResult["models"];

  async run(): Promise<{ rawHtml: string; result: ProviderParseResult }> {
    const rawHtml = await this.fetchSource();
    const models = this.parse(rawHtml);

    return {
      rawHtml,
      result: {
        provider: this.providerSlug,
        reportPath: this.reportPath,
        sourceUrl: this.sourceUrl,
        fetchedAt: new Date().toISOString(),
        modelCount: models.length,
        models,
      },
    };
  }
}
