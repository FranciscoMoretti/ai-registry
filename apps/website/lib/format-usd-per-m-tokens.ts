const MILLION = 1_000_000;
const TWO_DECIMAL_THRESHOLD = 0.01;
const THREE_DECIMAL_THRESHOLD = 0.001;
const CURRENCY_LOCALE = "en-US";
const CURRENCY_CODE = "USD";
const FRACTION_DIGITS_DEFAULT = 4;
const FRACTION_DIGITS_TWO = 2;
const FRACTION_DIGITS_THREE = 3;

export function formatUsdPerMTokens(value?: string | number | null): string {
  if (value === null || value === undefined) {
    return "--";
  }
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return `$${String(value)}/token`;
  }
  const perMillion = numeric * MILLION;
  let fractionDigits = FRACTION_DIGITS_DEFAULT;
  if (perMillion >= TWO_DECIMAL_THRESHOLD) {
    fractionDigits = FRACTION_DIGITS_TWO;
  } else if (perMillion >= THREE_DECIMAL_THRESHOLD) {
    fractionDigits = FRACTION_DIGITS_THREE;
  }
  try {
    const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: "currency",
      currency: CURRENCY_CODE,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    })
      .format(perMillion)
      .replace("$", "");
    return `$${formatted}/M`;
  } catch {
    return `$${perMillion.toFixed(fractionDigits)}/M`;
  }
}
