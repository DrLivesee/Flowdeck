const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string) {
  const cachedFormatter = dateFormatterCache.get(locale);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  dateFormatterCache.set(locale, formatter);

  return formatter;
}

function getDateTimeFormatter(locale: string) {
  const cachedFormatter = dateTimeFormatterCache.get(locale);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  dateTimeFormatterCache.set(locale, formatter);

  return formatter;
}

export function formatDate(date: Date | string, locale = "ru-RU") {
  return getDateFormatter(locale).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale = "ru-RU") {
  return getDateTimeFormatter(locale).format(new Date(date));
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getTodayISODate() {
  return toISODate(new Date());
}

export function isPastDate(date: Date | string, now = new Date()) {
  return new Date(date).getTime() < now.getTime();
}
