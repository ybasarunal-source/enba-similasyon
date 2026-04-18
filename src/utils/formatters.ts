/**
 * Enba Similasyon - Formatlama Yardımcıları
 */

export const fmt = (val: number | string, decimals?: number): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  const d = decimals ?? 0;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

// Global erişim (Legacy desteği)
if (typeof window !== 'undefined') {
  (window as any).fmt = fmt;
}
