import type { AthleteSummary } from '../../lib/adminData';

type Locale = 'ar' | 'en';

const localeTag = (locale: Locale) => (locale === 'ar' ? 'ar' : 'en-GB');

export const formatNumber = (value: number, locale: Locale, maximumFractionDigits = 0) =>
  new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits }).format(
    Number.isFinite(value) ? value : 0
  );

export const formatCompact = (value: number, locale: Locale) =>
  new Intl.NumberFormat(localeTag(locale), { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0
  );

export const formatDate = (value: string | undefined, locale: Locale) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(localeTag(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
};

export const formatDateTime = (value: string | undefined, locale: Locale) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
};

export const formatTime = (locale: Locale) =>
  new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

export const daysSince = (value: string | undefined) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
};

export const initialsOf = (name: string) => (name?.trim()?.charAt(0) || 'A').toUpperCase();

export const sortByKey = (a: AthleteSummary, b: AthleteSummary, key: string) => {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'tonnage':
      return b.totalTonnage - a.totalTonnage;
    case 'calories':
      return b.totalCaloriesBurned - a.totalCaloriesBurned;
    case 'recent': {
      const left = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const right = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return right - left;
    }
    default:
      return b.totalWorkouts - a.totalWorkouts;
  }
};

export const filterAthletes = (athletes: AthleteSummary[], filter: string) => {
  if (filter === 'all') return athletes;
  const cutoff = Date.now() - 30 * 86_400_000;
  if (filter === 'active') return athletes.filter((athlete) => athlete.lastActive && new Date(athlete.lastActive).getTime() >= cutoff);
  if (filter === 'elite') return athletes.filter((athlete) => athlete.tier === 'Elite' || athlete.tier === 'Pro');
  if (filter === 'rookie') return athletes.filter((athlete) => athlete.tier === 'Rookie' || athlete.tier === 'Dedicated');
  return athletes;
};

export const searchAthletes = (athletes: AthleteSummary[], query: string) => {
  const term = query.trim().toLowerCase();
  if (!term) return athletes;
  return athletes.filter(
    (athlete) =>
      athlete.name.toLowerCase().includes(term) ||
      athlete.email.toLowerCase().includes(term) ||
      athlete.uid.toLowerCase().includes(term)
  );
};

export const paginate = <T,>(items: T[], page: number, size: number) => {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * size;
  return { page: safePage, pageCount, slice: items.slice(start, start + size), total: items.length };
};
