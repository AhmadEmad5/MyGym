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
