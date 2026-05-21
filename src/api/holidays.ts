import { supabase } from './supabase';

export interface Holiday {
  date: string;      // YYYY-MM-DD
  name: string;
  localName: string;
  isCustom: boolean;
  isBridge: boolean;
}

const CACHE_TTL_DAYS = 30;
const cacheKey = (year: number) => `enba_holidays_${year}`;

async function fetchNager(year: number): Promise<Holiday[]> {
  const cached = localStorage.getItem(cacheKey(year));
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if ((Date.now() - ts) / 86_400_000 < CACHE_TTL_DAYS) return data;
    } catch { /* stale or corrupt — refetch */ }
  }

  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TR`);
  if (!res.ok) return [];
  const raw: { date: string; name: string; localName: string }[] = await res.json();

  const holidays: Holiday[] = raw.map(h => ({
    date: h.date,
    name: h.name,
    localName: h.localName,
    isCustom: false,
    isBridge: false,
  }));

  localStorage.setItem(cacheKey(year), JSON.stringify({ data: holidays, ts: Date.now() }));
  return holidays;
}

async function fetchCustom(year: number): Promise<Holiday[]> {
  const { data } = await supabase
    .from('custom_holidays')
    .select('date, name, is_bridge')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`);

  return (data ?? []).map((r: { date: string; name: string; is_bridge: boolean }) => ({
    date: r.date,
    name: r.name,
    localName: r.name,
    isCustom: true,
    isBridge: r.is_bridge ?? false,
  }));
}

export async function getHolidays(year: number): Promise<Holiday[]> {
  const [nagerResult, customResult] = await Promise.allSettled([
    fetchNager(year),
    fetchCustom(year),
  ]);
  const nager  = nagerResult.status  === 'fulfilled' ? nagerResult.value  : [];
  const custom = customResult.status === 'fulfilled' ? customResult.value : [];

  // Custom entries override Nager entries on the same date
  const customDates = new Set(custom.map(h => h.date));
  return [
    ...nager.filter(h => !customDates.has(h.date)),
    ...custom,
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export async function addCustomHoliday(date: string, name: string, isBridge: boolean): Promise<void> {
  await supabase
    .from('custom_holidays')
    .upsert({ date, name, is_bridge: isBridge }, { onConflict: 'date' });
}

export async function removeCustomHoliday(date: string): Promise<void> {
  await supabase.from('custom_holidays').delete().eq('date', date);
}
