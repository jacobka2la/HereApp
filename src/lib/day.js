export function getEasternDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function getCurrentDayKey(date = new Date()) {
  const parts = getEasternDateParts(date);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (parts.hour < 4) {
    base.setUTCDate(base.getUTCDate() - 1);
  }

  return base.toISOString().slice(0, 10);
}

export function normalizeUsername(input = '') {
  const cleaned = input.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) return '';
  return cleaned;
}

export function formatRelativeTime(timestampMillis) {
  if (!timestampMillis) return 'just now';
  const diffMs = Date.now() - timestampMillis;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  return `${hours}h ago`;
}
