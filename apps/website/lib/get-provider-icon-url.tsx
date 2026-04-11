export function getProviderIconUrl(provider: string): string | null {
  if (!provider) {
    return null;
  }
  return `https://models.dev/logos/${provider}.svg`;
}
