export function formatDate(date: string | null | undefined) {
  if (!date) return 'Sem data';

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | null | undefined) {
  if (!date) return 'Sem data';

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';

  return new Intl.NumberFormat('pt-PT', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatQuantity(value: number | null | undefined, unit?: string | null) {
  if (value === null || value === undefined) return unit?.trim() || 'q.b.';

  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

export function slugifyRuleKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function sanitizeOptionalText(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function parseOptionalNumber(value: string) {
  const trimmed = value.trim().replace(',', '.');

  if (!trimmed) return null;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

export function isPastDate(date: string | null | undefined) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(date) < today;
}
