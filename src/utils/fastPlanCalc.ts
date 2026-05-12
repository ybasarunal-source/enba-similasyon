export { ASGARI_NET, ASGARI_SGK, DEFAULT_DAILY_MEAL, DEFAULT_WORK_DAYS } from './constants';

export type GiderKalem = 'enerji' | 'kira' | 'bakim' | 'pazarlama' | 'yonetim' | 'diger';

export interface PersonelItem {
  id: number;
  unvan: string;
  kisiSayisi: number;
  ekMaas: number;
  isAyiklama: boolean;
}

export interface GiderItem {
  id: number;
  ad: string;
  tutar: number;
  kalem: GiderKalem;
}

export interface YatirimItem {
  id: number;
  ad: string;
  tutar: number;
}

export interface PlanParams {
  aylikTon: number;
  alisFiyati: number;
  satisFiyati: number;
  alisNakliye: number;
  satisNakliye: number;
  uretimFiresi: number;
  copOrani: number;
  ayiklamaVar: boolean;
  elektrikKwFiyat: number;
  aylikGun: number;
  gunlukSaat: number;
  vardiyaSayisi: number;
  // Değişken sabitler — her plan kendi değerini taşır
  asgariUcret: number;
  asgariSgk: number;
  yemekUcreti: number;
  personelListesi: PersonelItem[];
  ektraGiderler: GiderItem[];
  yatirimlar: YatirimItem[];
  muhasebeGider: number;
  kiraGider: number;
  forkliftGider: number;
  bakimGider: number;
  elektrikGider: number;
  cevreMuhGider: number;
  amortismanAy: number;
}

export interface PlanSonuc {
  satisTon: number;
  satisGeliri: number;
  malAlisGideri: number;
  alisNakliyeGideri: number;
  satisNakliyeGideri: number;
  toplamMaas: number;
  toplamSgk: number;
  toplamYemek: number;
  toplamEktra: number;
  giderKırılım: Record<GiderKalem, number>;
  totalGider: number;
  ebitda: number;
  netKar: number;
  ebitdaMarji: number;
  aylikAmortisman: number;
  birimMaliyet: number;
  basabasNokta: number;
  geriOdemeSuresi: number | null;
}

export function hesapla(p: PlanParams): PlanSonuc {
  const copTon = p.ayiklamaVar ? p.aylikTon * (p.copOrani / 100) : 0;
  const satisTon = (p.aylikTon - copTon) * (1 - p.uretimFiresi / 100);
  const satisGeliri = satisTon * p.satisFiyati;
  const malAlisGideri = p.aylikTon * p.alisFiyati;
  const alisNakliyeGideri = p.aylikTon * p.alisNakliye;
  const satisNakliyeGideri = satisTon * p.satisNakliye;

  let toplamMaas = 0, toplamSgk = 0, toplamYemek = 0;
  p.personelListesi.forEach(per => {
    const kisi = per.kisiSayisi * p.vardiyaSayisi;
    toplamMaas += (p.asgariUcret + per.ekMaas) * kisi;
    toplamSgk += p.asgariSgk * kisi;
    toplamYemek += p.yemekUcreti * p.aylikGun * kisi;
  });

  const giderKırılım: Record<GiderKalem, number> = {
    enerji: p.elektrikGider || 0,
    kira: (p.kiraGider || 0) + (p.forkliftGider || 0),
    bakim: p.bakimGider || 0,
    pazarlama: 0,
    yonetim: (p.muhasebeGider || 0) + (p.cevreMuhGider || 0),
    diger: 0,
  };
  p.ektraGiderler.forEach(g => {
    const k = g.kalem || 'diger';
    giderKırılım[k] = (giderKırılım[k] || 0) + g.tutar;
  });

  const toplamEktra = Object.values(giderKırılım).reduce((s, v) => s + v, 0);
  const totalGider =
    malAlisGideri + alisNakliyeGideri + satisNakliyeGideri +
    toplamMaas + toplamSgk + toplamYemek + toplamEktra;

  const toplamYatirim = p.yatirimlar.reduce((s, y) => s + y.tutar, 0);
  const aylikAmortisman = toplamYatirim > 0 ? toplamYatirim / p.amortismanAy : 0;
  const ebitda = satisGeliri - totalGider;
  const netKar = ebitda - aylikAmortisman;
  const ebitdaMarji = satisGeliri > 0 ? (ebitda / satisGeliri) * 100 : 0;
  const birimMaliyet = satisTon > 0 ? totalGider / satisTon : 0;

  const degiskenMaliyetPerTon = satisTon > 0
    ? (malAlisGideri + alisNakliyeGideri + satisNakliyeGideri) / satisTon
    : 0;
  const sabitGiderler = toplamMaas + toplamSgk + toplamYemek + toplamEktra + aylikAmortisman;
  const basabasNokta = p.satisFiyati > degiskenMaliyetPerTon
    ? sabitGiderler / (p.satisFiyati - degiskenMaliyetPerTon)
    : Infinity;

  const geriOdemeSuresi = toplamYatirim > 0 && netKar > 0 ? toplamYatirim / netKar : null;

  return {
    satisTon, satisGeliri, malAlisGideri, alisNakliyeGideri, satisNakliyeGideri,
    toplamMaas, toplamSgk, toplamYemek, toplamEktra, giderKırılım, totalGider,
    ebitda, netKar, ebitdaMarji, aylikAmortisman, birimMaliyet,
    basabasNokta, geriOdemeSuresi,
  };
}
