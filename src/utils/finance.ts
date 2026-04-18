/**
 * Enba Similasyon - Finansal Hesaplama Motoru (TypeScript)
 */

export interface MonthlyResult {
  gelir: number;
  opex: number;
  ebitda: number;
  alisTon: number;
  toplamSatisTon: number;
  alisGideri: number;
  alisNakliye: number;
  satisNakliye: number;
  digerOpex: number;
}

export interface ConsolidatedSummary {
  gelir: number;
  opex: number;
  ebitda: number;
  amortisman: number;
  net: number;
  gelirDetaylari: Record<string, any>;
  giderDetaylari: Record<string, any>;
}

export const financeUtils = {
  /**
   * Aylık detaylı plan sonuçlarını hesaplar
   */
  hesaplaAylikSonuc: (ayData: any, tedarikciler: any[], musteriler: any[]): MonthlyResult => {
    let gelir = 0;
    let satisNakliye = 0;
    let toplamSatisTon = 0;

    musteriler.forEach((m) => {
      const mus = ayData.musteriler?.[m.id] || { miktar: 0, fiyat: 0, nakliye: 0 };
      toplamSatisTon += Number(mus.miktar) || 0;
      gelir += (Number(mus.miktar) || 0) * (Number(mus.fiyat) || 0);
      satisNakliye += (Number(mus.miktar) || 0) * (Number(mus.nakliye) || 0);
    });

    let alisTon = 0;
    let alisGideri = 0;
    let alisNakliye = 0;

    tedarikciler.forEach((t) => {
      const ted = ayData.tedarikler?.[t.id] || { miktar: 0, fiyat: 0, nakliye: 0 };
      alisTon += Number(ted.miktar) || 0;
      alisGideri += (Number(ted.miktar) || 0) * (Number(ted.fiyat) || 0);
      alisNakliye += (Number(ted.miktar) || 0) * (Number(ted.nakliye) || 0);
    });

    let digerOpex = 0;
    Object.keys(ayData.giderler || {}).forEach((kodu) => {
      digerOpex += Number(ayData.giderler[kodu]) || 0;
    });

    const opex = alisGideri + alisNakliye + satisNakliye + digerOpex;
    const ebitda = gelir - opex;

    return {
      gelir,
      opex,
      ebitda,
      alisTon,
      toplamSatisTon,
      alisGideri,
      alisNakliye,
      satisNakliye,
      digerOpex,
    };
  },

  /**
   * Ana sayfadaki tesis konsolide kârlılık özetini (TKKÖ) hesaplar
   */
  anasayfaHesapla: (aktifPlanlar: any[]): ConsolidatedSummary => {
    let toplamGelir = 0;
    let toplamOpex = 0;
    let toplamAmortisman = 0;
    let kalemBazliOzet: Record<string, any> = {};
    let giderDetaylari: Record<string, any> = {};

    aktifPlanlar.forEach((plan) => {
      // Gelir Hesapla
      Object.keys(plan.gelirler || {}).forEach((kodu) => {
        const tutar = Number(plan.gelirler[kodu]) || 0;
        toplamGelir += tutar;
        if (tutar > 0) {
          if (kodu === '109' && plan.satisDetaylari && Array.isArray(plan.satisDetaylari)) {
            plan.satisDetaylari.forEach((detay: any) => {
              if (!kalemBazliOzet[detay.ad]) {
                kalemBazliOzet[detay.ad] = { adi: detay.ad, tutar: 0, tip: 'gelir' };
              }
              kalemBazliOzet[detay.ad].tutar += detay.tutar;
            });
          }
        }
      });

      // Gider Hesapla
      Object.keys(plan.giderler || {}).forEach((kodu) => {
        const tutar = Number(plan.giderler[kodu]) || 0;
        toplamOpex += tutar;
        if (tutar > 0) {
          // SABLON_GIDERLER globalden veya merkezi bir constant'tan gelmeli
          const sablonGiderler = (window as any).SABLON_GIDERLER || [];
          const bulunanGider = sablonGiderler.find((g: any) => g.kodu === kodu);
          if (!giderDetaylari[kodu]) {
            giderDetaylari[kodu] = {
              adi: bulunanGider ? bulunanGider.adi : kodu,
              tutar: 0,
              tip: 'gider',
              grup: bulunanGider?.grup,
            };
          }
          giderDetaylari[kodu].tutar += tutar;
        }
      });
      toplamAmortisman += Number(plan.aylikAmortisman) || 0;
    });

    const ebitda = toplamGelir - toplamOpex;
    const netDurum = ebitda - toplamAmortisman;

    return {
      gelir: toplamGelir,
      opex: toplamOpex,
      ebitda,
      amortisman: toplamAmortisman,
      net: netDurum,
      gelirDetaylari: kalemBazliOzet,
      giderDetaylari,
    };
  },
};

// Global erişim (Legacy desteği)
if (typeof window !== 'undefined') {
  (window as any).EnbaFinance = financeUtils;
}
