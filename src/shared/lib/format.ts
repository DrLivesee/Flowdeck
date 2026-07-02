const compactNumberFormatters = new Map<string, Intl.NumberFormat>();

function getCompactNumberFormatter(locale: string) {
  const cachedFormatter = compactNumberFormatters.get(locale);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  compactNumberFormatters.set(locale, formatter);

  return formatter;
}

export function formatCompactNumber(value: number, locale = "ru-RU") {
  return getCompactNumberFormatter(locale).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
