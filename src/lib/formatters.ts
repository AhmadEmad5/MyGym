import { format } from 'date-fns';

export function formatMetric(value: number | null | undefined, unit = '', locale = 'en-US') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDuration(minutes: number | null | undefined, locale = 'en-US') {
  if (!minutes || minutes < 1) return locale.startsWith('ar') ? '0 د' : '0 min';
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${new Intl.NumberFormat(locale).format(rounded)} ${locale.startsWith('ar') ? 'د' : 'min'}`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder === 0
    ? `${hours}${locale.startsWith('ar') ? 'س' : 'h'}`
    : `${hours}${locale.startsWith('ar') ? 'س' : 'h'} ${remainder}${locale.startsWith('ar') ? 'د' : 'm'}`;
}

export function formatSet(weight: number, reps: number, unit: 'kg' | 'lb', locale = 'en-US') {
  return `${formatMetric(weight, unit, locale)} × ${new Intl.NumberFormat(locale).format(reps)} ${locale.startsWith('ar') ? 'تكرار' : 'reps'}`;
}

export function formatDateRange(start: Date, end: Date, locale = 'en-US') {
  const pattern = locale.startsWith('ar') ? 'd MMM' : 'MMM d';
  return `${format(start, pattern)} – ${format(end, pattern)}`;
}

export function getDirectionAwareArrow(isRTL: boolean) {
  return isRTL ? '←' : '→';
}
