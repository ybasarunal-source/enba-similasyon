import { describe, it, expect } from 'vitest';
import { hesapla, type PlanParams } from '../fastPlanCalc';
import { ASGARI_NET, ASGARI_SGK, DEFAULT_DAILY_MEAL } from '../constants';

const BASE: PlanParams = {
  aylikTon: 100,
  alisFiyati: 5000,
  satisFiyati: 8000,
  alisNakliye: 0,
  satisNakliye: 0,
  uretimFiresi: 0,
  copOrani: 0,
  ayiklamaVar: false,
  elektrikKwFiyat: 0,
  aylikGun: 26,
  gunlukSaat: 8,
  vardiyaSayisi: 1,
  personelListesi: [],
  ektraGiderler: [],
  yatirimlar: [],
  muhasebeGider: 0,
  kiraGider: 0,
  forkliftGider: 0,
  bakimGider: 0,
  elektrikGider: 0,
  cevreMuhGider: 0,
  amortismanAy: 36,
};

describe('hesapla — temel gelir/gider', () => {
  it('fire ve çöp yokken tüm ton satışa gider', () => {
    const s = hesapla(BASE);
    expect(s.satisTon).toBe(100);
    expect(s.satisGeliri).toBe(800_000);
    expect(s.malAlisGideri).toBe(500_000);
    expect(s.ebitda).toBe(300_000);
  });

  it('üretim firesi satisTon ve geliri düşürür', () => {
    const s = hesapla({ ...BASE, uretimFiresi: 10 });
    expect(s.satisTon).toBeCloseTo(90);
    expect(s.satisGeliri).toBeCloseTo(720_000);
  });

  it('ayıklama açıkken çöp oranı satisTon\'u düşürür', () => {
    // 100 ton, %20 çöp → 80 ton satışa gider (fire 0)
    const s = hesapla({ ...BASE, ayiklamaVar: true, copOrani: 20 });
    expect(s.satisTon).toBeCloseTo(80);
    expect(s.satisGeliri).toBeCloseTo(640_000);
  });

  it('ayiklamaVar false iken copOrani dikkate alınmaz', () => {
    const s = hesapla({ ...BASE, ayiklamaVar: false, copOrani: 50 });
    expect(s.satisTon).toBe(100);
  });

  it('ayıklama + fire birlikte doğru hesaplanır', () => {
    // 100 ton, %20 çöp → 80 ton; %10 fire → 72 ton
    const s = hesapla({ ...BASE, ayiklamaVar: true, copOrani: 20, uretimFiresi: 10 });
    expect(s.satisTon).toBeCloseTo(72);
  });
});

describe('hesapla — personel maliyeti', () => {
  it('1 kişi, 1 vardiya, 0 ek maaş → asgari ücret bazlı maliyet', () => {
    const s = hesapla({
      ...BASE,
      personelListesi: [{ id: 1, unvan: 'Operatör', kisiSayisi: 1, ekMaas: 0, isAyiklama: false }],
    });
    expect(s.toplamMaas).toBeCloseTo(ASGARI_NET);
    expect(s.toplamSgk).toBeCloseTo(ASGARI_SGK);
    expect(s.toplamYemek).toBeCloseTo(DEFAULT_DAILY_MEAL * 26);
  });

  it('ek maaş toplam maaşa yansır', () => {
    const ekMaas = 5000;
    const s = hesapla({
      ...BASE,
      personelListesi: [{ id: 1, unvan: 'Usta', kisiSayisi: 1, ekMaas, isAyiklama: false }],
    });
    expect(s.toplamMaas).toBeCloseTo(ASGARI_NET + ekMaas);
  });

  it('2 vardiya personel maliyeti 2 katına çıkar', () => {
    const s1 = hesapla({
      ...BASE,
      vardiyaSayisi: 1,
      personelListesi: [{ id: 1, unvan: 'İşçi', kisiSayisi: 2, ekMaas: 0, isAyiklama: false }],
    });
    const s2 = hesapla({
      ...BASE,
      vardiyaSayisi: 2,
      personelListesi: [{ id: 1, unvan: 'İşçi', kisiSayisi: 2, ekMaas: 0, isAyiklama: false }],
    });
    expect(s2.toplamMaas).toBeCloseTo(s1.toplamMaas * 2);
  });
});

describe('hesapla — başabaş noktası', () => {
  it('sabit gider yoksa başabaş 0 ton', () => {
    // Personel ve ekstra gider yok, alis/satis fiyatı arasında fark var
    const s = hesapla(BASE);
    expect(s.basabasNokta).toBe(0);
  });

  it('sabit gider varsa başabaş doğru hesaplanır', () => {
    // kiraGider=100_000, satışFiyatı=8000, alisFiyatı=5000 → değişken=5000, fark=3000
    // başabaş = 100_000 / 3000 ≈ 33.33 ton
    const s = hesapla({ ...BASE, kiraGider: 100_000 });
    expect(s.basabasNokta).toBeCloseTo(100_000 / 3000, 1);
  });

  it('satış fiyatı değişken maliyetin altındaysa başabaş Infinity', () => {
    // alisFiyatı > satisFiyatı → kâra geçmek imkânsız
    const s = hesapla({ ...BASE, alisFiyati: 10_000, satisFiyati: 8_000 });
    expect(s.basabasNokta).toBe(Infinity);
  });
});

describe('hesapla — geri ödeme süresi', () => {
  it('CAPEX yoksa geri ödeme null', () => {
    const s = hesapla(BASE);
    expect(s.geriOdemeSuresi).toBeNull();
  });

  it('kârlı planda geri ödeme CAPEX / netKar', () => {
    const capex = 1_200_000;
    const s = hesapla({ ...BASE, yatirimlar: [{ id: 1, ad: 'Makine', tutar: capex }], amortismanAy: 36 });
    // aylikAmortisman = 1_200_000 / 36 = 33_333.33
    // ebitda = 800_000 - 500_000 = 300_000
    // netKar = 300_000 - 33_333.33 ≈ 266_667
    // geriOdeme = 1_200_000 / 266_667 ≈ 4.5 ay
    expect(s.geriOdemeSuresi).not.toBeNull();
    expect(s.geriOdemeSuresi!).toBeCloseTo(capex / s.netKar, 4);
  });

  it('zararda geri ödeme null', () => {
    // Yüksek gider → zarar
    const s = hesapla({ ...BASE, alisFiyati: 9_000, yatirimlar: [{ id: 1, ad: 'Makine', tutar: 500_000 }] });
    expect(s.geriOdemeSuresi).toBeNull();
  });
});

describe('hesapla — EBITDA marjı', () => {
  it('satış geliri 0 iken marj 0', () => {
    const s = hesapla({ ...BASE, aylikTon: 0 });
    expect(s.ebitdaMarji).toBe(0);
  });

  it('kârlı senaryoda marj doğru hesaplanır', () => {
    const s = hesapla(BASE);
    // ebitda = 300_000, satisGeliri = 800_000 → %37.5
    expect(s.ebitdaMarji).toBeCloseTo(37.5, 1);
  });
});
