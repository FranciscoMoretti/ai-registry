export const formatNumberCompact = (value: number): string => {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs < 1000) {
      return `${sign}${abs}`;
    }
    if (abs < 1_000_000) {
      return `${sign}${Math.round(abs / 100) / 10}K`;
    }
    if (abs < 1_000_000_000) {
      return `${sign}${Math.round(abs / 100_000) / 10}M`;
    }
    if (abs < 1_000_000_000_000) {
      return `${sign}${Math.round(abs / 100_000_000) / 10}B`;
    }
    return `${sign}${Math.round(abs / 100_000_000_000) / 10}T`;
  }
};
