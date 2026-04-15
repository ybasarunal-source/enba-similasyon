/**
 * Enba Similasyon - Finansal Hesaplama Motoru
 * Bu dosya tüm modüller tarafından kullanılan merkezi hesaplama mantığını içerir.
 */

window.EnbaFinance = {
    /**
     * Aylık detaylı plan sonuçlarını hesaplar
     */
    hesaplaAylikSonuc: (ayData, tedarikciler, musteriler) => {
        let gelir = 0; let satisNakliye = 0; let toplamSatisTon = 0;
        musteriler.forEach(m => {
            const mus = ayData.musteriler?.[m.id] || { miktar: 0, fiyat: 0, nakliye: 0 };
            toplamSatisTon += mus.miktar;
            gelir += mus.miktar * mus.fiyat;
            satisNakliye += mus.miktar * mus.nakliye;
        });

        let alisTon = 0; let alisGideri = 0; let alisNakliye = 0;
        tedarikciler.forEach(t => {
            const ted = ayData.tedarikler?.[t.id] || { miktar: 0, fiyat: 0, nakliye: 0 };
            alisTon += ted.miktar;
            alisGideri += ted.miktar * ted.fiyat;
            alisNakliye += ted.miktar * ted.nakliye;
        });

        let digerOpex = 0;
        Object.keys(ayData.giderler || {}).forEach(kodu => { digerOpex += Number(ayData.giderler[kodu]) || 0; });

        const opex = alisGideri + alisNakliye + satisNakliye + digerOpex;
        const ebitda = gelir - opex;

        return { gelir, opex, ebitda, alisTon, toplamSatisTon, alisGideri, alisNakliye, satisNakliye, digerOpex };
    },

    /**
     * Ana sayfadaki tesis konsolide kârlılık özetini (TKKÖ) hesaplar
     */
    anasayfaHesapla: (aktifPlanlar) => {
        let toplamGelir = 0; let toplamOpex = 0; let toplamAmortisman = 0; 
        let kalemBazliOzet = {}; let giderDetaylari = {};

        aktifPlanlar.forEach(plan => {
            // Gelir Hesapla
            Object.keys(plan.gelirler || {}).forEach(kodu => {
                const tutar = Number(plan.gelirler[kodu]) || 0;
                toplamGelir += tutar;
                if(tutar > 0) {
                    if (kodu === '109' && plan.satisDetaylari && plan.satisDetaylari.length > 0) {
                        plan.satisDetaylari.forEach((detay) => {
                            if(!kalemBazliOzet[detay.ad]) kalemBazliOzet[detay.ad] = { adi: detay.ad, tutar: 0, tip: 'gelir' };
                            kalemBazliOzet[detay.ad].tutar += detay.tutar;
                        });
                    }
                }
            });

            // Gider Hesapla
            Object.keys(plan.giderler || {}).forEach(kodu => {
                const tutar = Number(plan.giderler[kodu]) || 0;
                toplamOpex += tutar;
                if(tutar > 0) {
                    const bulunanGider = (window.SABLON_GIDERLER || []).find(g => g.kodu === kodu);
                    if(!giderDetaylari[kodu]) giderDetaylari[kodu] = { adi: bulunanGider ? bulunanGider.adi : kodu, tutar: 0, tip: 'gider', grup: bulunanGider?.grup };
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
            ebitda: ebitda, 
            amortisman: toplamAmortisman, 
            net: netDurum, 
            gelirDetaylari: kalemBazliOzet, 
            giderDetaylari: giderDetaylari 
        };
    }
};
