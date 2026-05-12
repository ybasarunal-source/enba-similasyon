import { DEFAULT_APP_SETTINGS } from '../../utils/appSettings';
import type { GiderKalem } from '../../utils/fastPlanCalc';
import type { PlanCard, PlanVersion } from './types';

export const KALEM_ORDER: GiderKalem[] = ['enerji', 'kira', 'bakim', 'pazarlama', 'yonetim', 'diger'];
export const KALEM_LABEL: Record<GiderKalem, string> = {
  enerji: 'Enerji & Hizmetler',
  kira: 'Kira & Tesis',
  bakim: 'Bakım & Onarım',
  pazarlama: 'Pazarlama & Satış',
  yonetim: 'Yönetim & Ofis',
  diger: 'Diğer Giderler',
};

export const STORAGE_KEY = 'enba_fast_plans_v2';

export const fmt = (n: number) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmtDec = (n: number, d = 1) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function makeVarsayilanParams(s: typeof DEFAULT_APP_SETTINGS) {
  return {
    aylikTon: 0, alisFiyati: 0, satisFiyati: 0,
    alisNakliye: 0, satisNakliye: 0, uretimFiresi: 0,
    copOrani: 0, ayiklamaVar: false, elektrikKwFiyat: s.elektrikBirimFiyat,
    aylikGun: s.aylikGun, gunlukSaat: 8, vardiyaSayisi: 1,
    personelListesi: [],
    ektraGiderler: [], yatirimlar: [],
    muhasebeGider: 0, kiraGider: 0, forkliftGider: 0,
    bakimGider: 0, elektrikGider: 0, cevreMuhGider: 0,
    amortismanAy: 36,
    asgariUcret: s.asgariUcret,
    asgariSgk: s.asgariSgk,
    yemekUcreti: s.yemekUcreti,
  };
}

export function versionToCard(plan: PlanCard, vIdx: number): PlanCard {
  const v = (plan.versions ?? [])[vIdx] as PlanVersion | undefined;
  if (!v) return plan;
  return {
    ...plan,
    baslik: `${plan.baslik} — V${vIdx + 1}`,
    params: v.params,
    sonuc: v.sonuc,
    createdAt: v.tarih,
    updatedAt: undefined,
    versions: [],
  };
}
