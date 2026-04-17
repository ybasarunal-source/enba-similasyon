const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const DEGISKEN_GIDERLER = new Set(['305','301','315','405','410','415','480','302','609']);
const SABIT_GIDERLER    = new Set(['450','455','509','610','615','620','625','630','635','640','650','665','002','670']);
const HARIC_KODLAR      = new Set(['305','301','302','109']); // Bunlar özel olarak Tedarik/Müşteri sekmelerinde işleniyor
const ACILIR_KODLAR     = ['609', '610']; // Alt kalem girişine açılan kodlar

// Unified finance logic moved to finance-utils.js

function DetayliPlanWizard({ initialData, onSave, onCancel, varsayilanAyarlar }) {
    // Adım bileşenlerini window nesnesinden al (Babel Standalone JSX uyumu)
    const DetStep1_Suppliers = window.DetStep1_Suppliers;
    const DetStep2_Customers = window.DetStep2_Customers;
    const DetStep3_Operations = window.DetStep3_Operations;
    const DetStep4_Personnel = window.DetStep4_Personnel;
    const DetStep5_Expenses = window.DetStep5_Expenses;
    const DetStep6_Investment = window.DetStep6_Investment;
    const DetStep7_Report = window.DetStep7_Report;

    const [adim, setAdim] = React.useState(1);
    const plTableRef = React.useRef(null);

    const _varsayilan = varsayilanAyarlar || { paraBirimi: 'TRY', olcumBirimi: 'ton' };
    const [planParaBirimi, setPlanParaBirimi] = React.useState(initialData?.paraBirimi || _varsayilan.paraBirimi);
    const [planOlcumBirimi, setPlanOlcumBirimi] = React.useState(initialData?.olcumBirimi || _varsayilan.olcumBirimi);

    const [planAdi, setPlanAdi]           = React.useState(initialData?.baslik || 'Yeni Detaylı Plan');
    const [baslangicYili, setBaslangicYili] = React.useState(initialData?.baslangicYili || new Date().getFullYear());
    const [baslangicAyi, setBaslangicAyi]   = React.useState(initialData?.baslangicAyi || 0);
    const [yatirimlar, setYatirimlar] = React.useState(() => {
        if (initialData?.yatirimlar?.length) return initialData.yatirimlar;
        if (initialData?.aylikAmortisman > 0) return [{id:'legacy', ad:'Mevcut CAPEX', tur:'diger', maliyet: initialData.aylikAmortisman * 120, geriOdeme:120}];
        return [];
    });
    const [yeniYatirimAd, setYeniYatirimAd] = React.useState('');
    const [yeniYatirimTur, setYeniYatirimTur] = React.useState('makina');
    const [yeniYatirimMaliyet, setYeniYatirimMaliyet] = React.useState('');
    const [yeniYatirimGeriOdeme, setYeniYatirimGeriOdeme] = React.useState(60);
    const [yeniYatirimErteleme, setYeniYatirimErteleme] = React.useState(0);

    const [altGiderKalemleri, setAltGiderKalemleri] = React.useState(initialData?.altGiderKalemleri || []);
    const [yeniAltAdlar, setYeniAltAdlar] = React.useState({});
    const altKalemEkle = (parentKod) => {
        const ad = (yeniAltAdlar[parentKod] || '').trim();
        if (!ad) return;
        const id = 'alt_' + Date.now();
        setAltGiderKalemleri(prev => [...prev, { id, parentKod, ad }]);
        setYeniAltAdlar(p => ({ ...p, [parentKod]: '' }));
    };
    const altKalemSil = (altId) => {
        setAltGiderKalemleri(prev => prev.filter(k => k.id !== altId));
        setAyVerileri(prev => prev.map(a => {
            const yg = { ...a.giderler };
            delete yg[altId];
            return { ...a, giderler: yg };
        }));
    };

    const [tedarikciler, setTedarikciler] = React.useState(initialData?.tedarikciler || [{ id: Date.now(), ad: 'Tedarikçi 1' }]);
    const [yeniTedarikci, setYeniTedarikci] = React.useState('');

    const [musteriler, setMusteriler] = React.useState(initialData?.musteriler || [{ id: Date.now()+1, ad: 'Müşteri 1' }]);
    const [yeniMusteri, setYeniMusteri] = React.useState('');

    const defaultAylar = () => Array.from({ length: 12 }, (_, i) => ({ ay: i, tedarikler: {}, musteriler: {}, giderler: {}, personeller: {} }));
    const [ayVerileri, setAyVerileri] = React.useState(initialData?.ayVerileri || defaultAylar);
    
    // Ensure existing ayVerileri has personeller object
    React.useEffect(() => {
        if (ayVerileri.length > 0 && !ayVerileri[0].personeller) {
            setAyVerileri(prev => prev.map(a => ({ ...a, personeller: a.personeller || {} })));
        }
    }, []);

    const [acikAylar, setAcikAylar] = React.useState({});

    // Makine ve Operasyon State
    const [globalMakinalar] = React.useState(() => JSON.parse(localStorage.getItem('enba_makinalar') || '[]'));
    const [seciliMakinalar, setSeciliMakinalar] = React.useState(initialData?.seciliMakinalar || []);
    
    // Vardiya ve Çalışma Süresi Stated
    const [vardiyaSayisi, setVardiyaSayisi] = React.useState(initialData?.vardiyaSayisi || initialData?.personelVardiyaSayisi || 1);
    const [vardiyaSaatleri, setVardiyaSaatleri] = React.useState(() => {
        if (initialData?.vardiyaSaatleri) return initialData.vardiyaSaatleri;
        return { 1: initialData?.gunlukCalismaSaati || 8, 2: 8, 3: 8 };
    });

    const [aylikCalismaGunu, setAylikCalismaGunu] = React.useState(initialData?.aylikCalismaGunu || 26);
    const [elektrikBirimFiyat, setElektrikBirimFiyat] = React.useState(initialData?.elektrikBirimFiyat || 2.5);

    const [tonajBuyume,      setTonajBuyume]      = React.useState(initialData?.tonajBuyume ?? 5);
    const [fiyatBuyume,      setFiyatBuyume]       = React.useState(initialData?.fiyatBuyume ?? 10);
    const [sabitMaliyet,     setSabitMaliyet]      = React.useState(initialData?.sabitMaliyet ?? 8);
    const [degiskenMaliyet,  setDegiskenMaliyet]   = React.useState(initialData?.degiskenMaliyet ?? 10);

    const [opGider, setOpGider] = React.useState(initialData?.opGider || { cuvalKapasite: 1, cuvalFiyat: 0, yakitKatsayi: 0, suKatsayi: 0 });

    // Personel States
    const [asgariNet, setAsgariNet] = React.useState(initialData?.asgariNet || 27000);
    const [asgariSgk, setAsgariSgk] = React.useState(initialData?.asgariSgk || 11000);
    const [gunlukYemek, setGunlukYemek] = React.useState(initialData?.gunlukYemek || 200);
    const [personelListesi, setPersonelListesi] = React.useState(initialData?.personelListesi || []);
    
    const initialPersonelState = { unvan: '', isAyiklama: false, ekMaas: '', ekSgk: '', ekYemek: '' };
    const [yeniPersonel, setYeniPersonel] = React.useState(initialPersonelState);

    const ayGuncelle = (ayIdx, alan, deger) => { setAyVerileri(prev => prev.map((a, i) => i === ayIdx ? { ...a, [alan]: Number(deger) } : a)); };
    const tedarikGuncelle = (ayIdx, tedId, alan, deger) => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i !== ayIdx) return a; const yt = { ...a.tedarikler };
            if (!yt[tedId]) yt[tedId] = { miktar: 0, fiyat: 0, nakliye: 0 };
            yt[tedId] = { ...yt[tedId], [alan]: Number(deger) }; return { ...a, tedarikler: yt };
        }));
    };
    // Belirtilen aydan sonraki tüm aylara o tedarikçinin mevcut verisini kopyalar
    const tedarikSonrakiAylara = (ayIdx, tedId) => {
        setAyVerileri(prev => {
            const kaynak = prev[ayIdx]?.tedarikler?.[tedId];
            if (!kaynak) return prev;
            return prev.map((a, i) => {
                if (i <= ayIdx) return a;
                const yt = { ...a.tedarikler };
                yt[tedId] = { ...kaynak };
                return { ...a, tedarikler: yt };
            });
        });
    };


    const musteriGuncelle = (ayIdx, musId, alan, deger) => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i !== ayIdx) return a; const ym = { ...a.musteriler };
            if (!ym[musId]) ym[musId] = { miktar: 0, fiyat: 0, nakliye: 0 };
            ym[musId] = { ...ym[musId], [alan]: Number(deger) }; return { ...a, musteriler: ym };
        }));
    };
    // Belirtilen aydan sonraki tüm aylara o müşterinin mevcut verisini kopyalar
    const musteriSonrakiAylara = (ayIdx, musId) => {
        setAyVerileri(prev => {
            const kaynak = prev[ayIdx]?.musteriler?.[musId];
            if (!kaynak) return prev;
            return prev.map((a, i) => {
                if (i <= ayIdx) return a;
                const ym = { ...a.musteriler };
                ym[musId] = { ...kaynak };
                return { ...a, musteriler: ym };
            });
        });
    };


    const giderGuncelle = (ayIdx, kodu, deger) => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i !== ayIdx) return a; const yg = { ...a.giderler, [kodu]: Number(deger) }; return { ...a, giderler: yg };
        }));
    };

    // Statik uygulamalar kaldırılıp yerine eş zamanlı hesaplanmisAyVerileri getirildi.

    // --- PERSONEL YÖNETİMİ FONKSİYONLARI ---
    const personelEkle = () => {
        if (!yeniPersonel.unvan) return;
        setPersonelListesi([...personelListesi, { id: 'p_' + Date.now(), ...yeniPersonel }]);
        setYeniPersonel(initialPersonelState);
    };

    const personelSil = (id) => {
        setPersonelListesi(personelListesi.filter(p => p.id !== id));
        // Remove from ayVerileri
        setAyVerileri(prev => prev.map(a => {
            const ypp = { ...a.personeller };
            delete ypp[id];
            for (let v=1; v<=vardiyaSayisi; v++) {
                delete ypp[`${id}_v${v}`];
            }
            return { ...a, personeller: ypp };
        }));
    };

    const aylikPersonelGuncelle = (ayIdx, pKey, adet) => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i !== ayIdx) return a;
            const ypp = { ...a.personeller, [pKey]: Number(adet) };
            return { ...a, personeller: ypp };
        }));
    };

    const [topluPersonelDegerleri, setTopluPersonelDegerleri] = React.useState({});
    const guncelleTopluPersonel = (pKey, val) => {
        setTopluPersonelDegerleri(p => ({ ...p, [pKey]: val }));
    };
    const uygulaTopluPersonel = () => {
        setAyVerileri(prev => prev.map(a => {
            const ypp = { ...a.personeller };
            Object.keys(topluPersonelDegerleri).forEach(pKey => {
                if (topluPersonelDegerleri[pKey] !== '') {
                    ypp[pKey] = Number(topluPersonelDegerleri[pKey]);
                }
            });
            return { ...a, personeller: ypp };
        }));
    };

    const personelGiderleriniUygula = () => {
        setAyVerileri(prev => prev.map(a => {
            let topMaas = 0, topSgk = 0, topYemek = 0;
            
            personelListesi.forEach(pDef => {
                let totalAdetForRole = 0;
                // For older model compatibility
                if (a.personeller && a.personeller[pDef.id] !== undefined && a.personeller[`${pDef.id}_v1`] === undefined) {
                    totalAdetForRole += a.personeller[pDef.id];
                }
                // Loop all shifts up to current selected
                for (let v=1; v<=vardiyaSayisi; v++) {
                    totalAdetForRole += (a.personeller?.[`${pDef.id}_v${v}`] || 0);
                }
                
                if (totalAdetForRole > 0) {
                    const kisiMaasi = asgariNet + Number(pDef.ekMaas || 0);
                    const kisiSgk = asgariSgk + Number(pDef.ekSgk || 0);
                    const kisiYemek = gunlukYemek * 26 + Number(pDef.ekYemek || 0);
                    
                    topMaas += kisiMaasi * totalAdetForRole;
                    topSgk += kisiSgk * totalAdetForRole;
                    topYemek += kisiYemek * totalAdetForRole;
                }
            });

            const yg = { ...a.giderler };
            if (topMaas > 0) yg['450'] = Math.round(topMaas); else delete yg['450'];
            if (topSgk > 0) yg['455'] = Math.round(topSgk); else delete yg['455'];
            if (topYemek > 0) yg['480'] = Math.round(topYemek); else delete yg['480'];

            return { ...a, giderler: yg };
        }));
        alert("Personel maaş, SGK ve yemek giderleri 'Tesis Giderleri' (kod 450, 455, 480) adımına aylık olarak yansıtıldı!");
    };
    // Kapasite Analizi (Adım 3 için)
    const aylikKapasiteToplam = () => {
        let kapasite = 0;
        let toplamGunlukSaat = 0;
        for (let v=1; v<=vardiyaSayisi; v++) {
            toplamGunlukSaat += Number(vardiyaSaatleri[v]) || 0;
        }
        const saat = toplamGunlukSaat * aylikCalismaGunu * (opGider.vardiya || 1);
        seciliMakinalar.forEach(sm => {
            const gm = globalMakinalar.find(x => x.id === sm.makinaId);
            if(gm) kapasite += gm.kapasite * (sm.verimlilik / 100) * saat;
        });
        return kapasite; // Ton / Ay
    };

    const aylikKuruluKapasite = aylikKapasiteToplam();
    const hesaplanmisAyVerileri = ayVerileri.map(a => {
        let ayTon = 0;
        tedarikciler.forEach(t => { ayTon += (a.tedarikler?.[t.id]?.miktar || 0); });
        
        let dinamikGiderler = { ...a.giderler };
        
        // Dinamik Çuval
        if (opGider.cuvalKapasite > 0 && opGider.cuvalFiyat > 0 && ayTon > 0) {
            dinamikGiderler['315'] = Math.round((ayTon / opGider.cuvalKapasite) * opGider.cuvalFiyat);
        } else {
            dinamikGiderler['315'] = 0;
        }

        // Dinamik Elektrik
        let kapasiteOrani = aylikKuruluKapasite > 0 ? Math.min(1, ayTon / aylikKuruluKapasite) : 0;
        let toplamGunlukSaat = 0;
        for (let v = 1; v <= vardiyaSayisi; v++) {
            toplamGunlukSaat += Number(vardiyaSaatleri[v]) || 0;
        }
        const aylikSaat = toplamGunlukSaat * aylikCalismaGunu * (opGider.vardiya || 1);
        let toplamKwhAy = 0;
        seciliMakinalar.forEach(sm => {
            const gm = globalMakinalar.find(x => x.id === sm.makinaId);
            if (gm) toplamKwhAy += gm.motorGucu * sm.katsayi * aylikSaat;
        });
        const maxAylikElektrikTutar = Math.round(toplamKwhAy * elektrikBirimFiyat);
        dinamikGiderler['405'] = Math.round(maxAylikElektrikTutar * kapasiteOrani);

        return { ...a, giderler: dinamikGiderler, ayTon: ayTon };
    });

    const aylikSonuclar = hesaplanmisAyVerileri.map(a => window.EnbaFinance.hesaplaAylikSonuc(a, tedarikciler, musteriler));

    const yilOzet = aylikSonuclar.reduce((t, a) => ({
        gelir: (t.gelir || 0) + (a?.gelir || 0), 
        opex: (t.opex || 0) + (a?.opex || 0), 
        ebitda: (t.ebitda || 0) + (a?.ebitda || 0), 
        alisTon: (t.alisTon || 0) + (a?.alisTon || 0),
        toplamSatisTon: (t.toplamSatisTon || 0) + (a?.toplamSatisTon || 0), 
        alisGideri: (t.alisGideri || 0) + (a?.alisGideri || 0), 
        alisNakliye: (t.alisNakliye || 0) + (a?.alisNakliye || 0),
        satisNakliye: (t.satisNakliye || 0) + (a?.satisNakliye || 0), 
        digerOpex: (t.digerOpex || 0) + (a?.digerOpex || 0)
    }), { gelir:0, opex:0, ebitda:0, alisTon:0, toplamSatisTon:0, alisGideri:0, alisNakliye:0, satisNakliye:0, digerOpex:0 });

    const aylikAmortismanlar = Array.from({length:12}, (_, i) =>
        yatirimlar.reduce((t, y) => {
            const d = y.erteleme || 0;
            const active = i >= d && i < d + (y.geriOdeme || 1);
            return t + (active ? (y.maliyet || 0) / (y.geriOdeme || 1) : 0);
        }, 0)
    );
    const aylikAmortisman = aylikAmortismanlar[0]; // birleştirme uyumu için ilk ay değeri
    const yillikAmortismanToplam = aylikAmortismanlar.reduce((t, a) => t + a, 0);
    yilOzet.amortisman = yillikAmortismanToplam;
    yilOzet.net = yilOzet.ebitda - yilOzet.amortisman;

    let bazSabit = 0; let bazDegisken = 0;
    hesaplanmisAyVerileri.forEach(a => {
        Object.keys(a.giderler || {}).forEach(kodu => {
            const tutar = Number(a.giderler[kodu]) || 0;
            if(SABIT_GIDERLER.has(kodu)) bazSabit += tutar; else bazDegisken += tutar; 
        });
    });

    const bazAlisMaliyeti = yilOzet.alisGideri + yilOzet.alisNakliye + yilOzet.satisNakliye;

    const projeksiyon = Array.from({ length: 5 }, (_, yi) => {
        const yTonyuzde = tonajBuyume / 100;
        const factorTonaj = Math.pow(1 + yTonyuzde, yi);
        const factorFiyat = Math.pow(1 + fiyatBuyume / 100, yi);
        const factorSabit = Math.pow(1 + sabitMaliyet / 100, yi);
        const factorDegisken = Math.pow(1 + degiskenMaliyet / 100, yi);

        const gelir = yilOzet.gelir * factorTonaj * factorFiyat;
        
        const yilAlisMaliyeti = bazAlisMaliyeti * factorTonaj * factorDegisken;
        const yilDigerDegisken = bazDegisken * factorTonaj * factorDegisken;
        const yilSabit = bazSabit * factorSabit;
        
        const opex  = yilAlisMaliyeti + yilDigerDegisken + yilSabit;
        const ebitda = gelir - opex;
        const net = ebitda - yillikAmortismanToplam;

        return {
            yil: baslangicYili + yi, alisTon: Math.round(yilOzet.alisTon * factorTonaj), satisTon: Math.round(yilOzet.toplamSatisTon * factorTonaj),
            gelir, opex, ebitda, amortisman: yillikAmortismanToplam, net
        };
    });

    const excelExport = () => {
        const wb = XLSX.utils.book_new();
        const ayRows = [['Ay', 'Alış Tonajı', 'Satış Tonajı', 'Gelir', 'OPEX', 'EBITDA', 'Amortisman', 'Net Kâr']];
        aylikSonuclar.forEach((s, i) => {
            const gercekAyIdx = (baslangicAyi + i) % 12;
            ayRows.push([AYLAR[gercekAyIdx], Math.round(s.alisTon), Math.round(s.toplamSatisTon), Math.round(s.gelir), Math.round(s.opex), Math.round(s.ebitda), Math.round(aylikAmortismanlar[i]), Math.round(s.ebitda - aylikAmortismanlar[i])]);
        });
        ayRows.push(['TOPLAM', Math.round(yilOzet.alisTon), Math.round(yilOzet.toplamSatisTon), Math.round(yilOzet.gelir), Math.round(yilOzet.opex), Math.round(yilOzet.ebitda), Math.round(yilOzet.amortisman), Math.round(yilOzet.net)]);
        const ws1 = XLSX.utils.aoa_to_sheet(ayRows);
        ws1['!cols'] = [{wch:10},{wch:14},{wch:14},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16}];
        XLSX.utils.book_append_sheet(wb, ws1, '12 Aylık Özet');

        // Detaylı P&L Sayfası
        const ayBasliklari = Array.from({length:12}, (_,i) => AYLAR[(baslangicAyi + i) % 12]);
        const detayRows = [['Kod', 'Kalem / Açıklama', ...ayBasliklari, 'YILLIK TOPLAM']];
        // Gelir
        detayRows.push(['GELİR', '', ...Array(13).fill('')]);
        detayRows.push(['TON', 'Alış Tonajı', ...hesaplanmisAyVerileri.map(a => Math.round(a.ayTon)), Math.round(yilOzet.alisTon)]);
        detayRows.push(['TON', 'Satış Tonajı', ...aylikSonuclar.map(s => Math.round(s.toplamSatisTon)), Math.round(yilOzet.toplamSatisTon)]);
        detayRows.push(['109', 'MAL SATIŞ GELİRİ', ...aylikSonuclar.map(s => Math.round(s.gelir)), Math.round(yilOzet.gelir)]);
        // Doğrudan Maliyetler
        detayRows.push(['DOĞRUDAN MALİYETLER', '', ...Array(13).fill('')]);
        detayRows.push(['305', 'Mal Ödemesi (Tedarikçi)', ...aylikSonuclar.map(s => Math.round(s.alisGideri)), Math.round(yilOzet.alisGideri)]);
        detayRows.push(['301', 'Alış Nakliye', ...aylikSonuclar.map(s => Math.round(s.alisNakliye)), Math.round(yilOzet.alisNakliye)]);
        detayRows.push(['302', 'Satış Nakliye', ...aylikSonuclar.map(s => Math.round(s.satisNakliye)), Math.round(yilOzet.satisNakliye)]);
        // Diğer Gider Grupları
        const haricKodlar = new Set(['305','301','302','109']);
        const giderler = window.SABLON_GIDERLER || [];
        const gruplar = window.GIDER_GRUPLARI || [];
        gruplar.forEach(grp => {
            const grpGiderler = giderler.filter(g => g.grup === grp.id && !haricKodlar.has(g.kodu));
            if (!grpGiderler.length) return;
            detayRows.push([grp.ad.toUpperCase(), '', ...Array(13).fill('')]);
            grpGiderler.forEach(g => {
                const ayDegerleri = hesaplanmisAyVerileri.map(a => Math.round(Number(a.giderler?.[g.kodu]) || 0));
                const toplam = ayDegerleri.reduce((t,v) => t+v, 0);
                detayRows.push([g.kodu, g.adi, ...ayDegerleri, toplam]);
            });
        });
        // Özet
        detayRows.push(['ÖZET', '', ...Array(13).fill('')]);
        detayRows.push(['', 'TOPLAM OPEX', ...aylikSonuclar.map(s => Math.round(s.opex)), Math.round(yilOzet.opex)]);
        detayRows.push(['', 'FAVÖK (EBITDA)', ...aylikSonuclar.map(s => Math.round(s.ebitda)), Math.round(yilOzet.ebitda)]);
        detayRows.push(['CAPEX', 'Amortisman', ...aylikAmortismanlar.map(a => Math.round(a)), Math.round(yillikAmortismanToplam)]);
        detayRows.push(['', 'NET KÂR / ZARAR', ...aylikSonuclar.map((s, i) => Math.round(s.ebitda - aylikAmortismanlar[i])), Math.round(yilOzet.net)]);

        const wsDetay = XLSX.utils.aoa_to_sheet(detayRows);
        wsDetay['!cols'] = [{wch:10},{wch:36},...Array(12).fill({wch:14}),{wch:16}];
        XLSX.utils.book_append_sheet(wb, wsDetay, 'Detaylı P&L Kodlar');

        const yilRows = [['Yıl', 'Alış Tonajı', 'Satış Tonajı', 'Gelir', 'OPEX', 'EBITDA', 'Amortisman', 'Net Kâr']];
        projeksiyon.forEach(p => {
            yilRows.push([p.yil, Math.round(p.alisTon), Math.round(p.satisTon), Math.round(p.gelir), Math.round(p.opex), Math.round(p.ebitda), Math.round(p.amortisman), Math.round(p.net)]);
        });
        const wsProj = XLSX.utils.aoa_to_sheet(yilRows);
        wsProj['!cols'] = [{wch:8},{wch:14},{wch:14},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16}];
        XLSX.utils.book_append_sheet(wb, wsProj, '5 Yıllık Projeksiyon');

        XLSX.writeFile(wb, `${planAdi || 'DetayliPlan'}.xlsx`);
    };

    const detayliPdfExport = () => {
        const AYLAR_TR = ['Oca','\u015eub','Mar','Nis','May','Haz','Tem','A\u011fu','Eyl','Eki','Kas','Ara'];
        const ayBas = Array.from({length:12}, (_,i) => AYLAR_TR[(baslangicAyi + i) % 12]);
        const fmtN = v => Number(v||0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

        const th = (t,a='right') => `<th style="padding:7px 5px;text-align:${a};background:#1a3a5c;color:#fff;font-size:9.5px;font-weight:700;white-space:nowrap;border:1px solid #2d5080">${t}</th>`;
        const secHdr = (t,bg,c) => `<tr><td colspan="14" style="padding:7px 10px;background:${bg};color:${c};font-weight:800;font-size:9.5px;letter-spacing:0.8px;border:1px solid #333">${t}</td></tr>`;
        const row = (label,lBg,vals,vc='#c0392b',lc='#15222e',bold=false) => {
            const tot = vals.reduce((s,v)=>s+(Number(v)||0),0);
            const cells = vals.map(v => { const n=Number(v)||0; return `<td style="padding:6px 5px;text-align:right;background:#fff;color:${n>0?vc:'#bbb'};font-weight:${bold?700:400};font-size:9.5px;border:1px solid #e8e8e8;white-space:nowrap">${n>0?fmtN(n):'\u2014'}</td>`; }).join('');
            return `<tr><td style="padding:6px 10px;background:${lBg};color:${lc};font-weight:${bold?700:600};font-size:9.5px;border:1px solid #e8e8e8">${label}</td>${cells}<td style="padding:6px 6px;text-align:right;background:#f0f0f0;color:${bold?vc:'#333'};font-weight:700;font-size:9.5px;border:1px solid #ccc;white-space:nowrap">${tot>0?fmtN(tot):'\u2014'}</td></tr>`;
        };

        let rows = '';
        const cod = (c,bg='#555') => `<span style="background:${bg};color:#fff;padding:1px 4px;border-radius:3px;font-size:8.5px;font-family:monospace;margin-right:4px">${c}</span>`;

        rows += secHdr('\u25b8 GEL\u0130R','#0a3d22','#7fffb0');
        rows += row(cod('TON','#5a9a6a')+'Al\u0131\u015f Tonaj\u0131','#edfaf4',hesaplanmisAyVerileri.map(a=>a.ayTon),'#2c7a4e');
        rows += row(cod('TON','#5a9a6a')+'Sat\u0131\u015f Tonaj\u0131','#f5fdf8',aylikSonuclar.map(s=>s.toplamSatisTon),'#2c7a4e');
        rows += row(cod('109','#1a7f4b')+'MAL SATI\u015e GEL\u0130R\u0130','#d9f5e6',aylikSonuclar.map(s=>s.gelir),'#1a7f4b','#1a7f4b',true);

        rows += secHdr('\u25b8 DO\u011eRUDAN MAL\u0130YETLER','#3d2015','#ffb380');
        rows += row(cod('305','#c0392b')+'Mal \u00d6demesi (Tedarik\u00e7i)','#fdf0ee',aylikSonuclar.map(s=>s.alisGideri));
        rows += row(cod('301','#c0392b')+'Al\u0131\u015f Nakliye','#fff6f5',aylikSonuclar.map(s=>s.alisNakliye));
        rows += row(cod('302','#c0392b')+'Sat\u0131\u015f Nakliye','#fdf0ee',aylikSonuclar.map(s=>s.satisNakliye));

        const haric = new Set(['305','301','302','109']);
        const grps = window.GIDER_GRUPLARI || [];
        const gdrs = window.SABLON_GIDERLER || [];
        const gBg  = {G1:'#152b1e',G2:'#152233',G3:'#2a1a33',G4:'#33221a',G5:'#152233'};
        const gTxt = {G1:'#80ffb0',G2:'#80c8ff',G3:'#d4a0ff',G4:'#ffd080',G5:'#a0c4ff'};
        const gA   = {G1:'#eef8f2',G2:'#eef4fb',G3:'#f4eefa',G4:'#fdf4ea',G5:'#eef4fb'};
        const gB   = {G1:'#f7fcf9',G2:'#f5f9fd',G3:'#faf6fd',G4:'#fef9f3',G5:'#f5f9fd'};

        grps.forEach(grp => {
            const list = gdrs.filter(g => g.grup===grp.id && !haric.has(g.kodu));
            if (!list.length) return;
            rows += secHdr('\u25b8 '+grp.ad, gBg[grp.id]||'#1a2030', gTxt[grp.id]||'#c0d0ff');
            list.forEach((g,gi) => {
                const vals = hesaplanmisAyVerileri.map(a=>Number(a.giderler?.[g.kodu])||0);
                const bg = gi%2===0 ? (gA[grp.id]||'#eef0f8') : (gB[grp.id]||'#f6f7fb');
                rows += row(cod(g.kodu,'#15222e')+g.adi, bg, vals);
            });
        });

        rows += secHdr('\u25b8 \u00d6ZET / K\u00c2R-ZARAR','#1a2035','#a0c4ff');
        rows += row('TOPLAM OPEX','#fcecea',aylikSonuclar.map(s=>s.opex),'#c0392b','#c0392b',true);
        const eP = yilOzet.ebitda>=0;
        rows += row('FAV\u00d6K (EBITDA)',eP?'#e6f7ed':'#fcecea',aylikSonuclar.map(s=>s.ebitda),eP?'#1a7f4b':'#c0392b',eP?'#1a7f4b':'#c0392b',true);
        rows += row(cod('CAPEX','#8e44ad')+'Amortisman','#f5eefa',aylikAmortismanlar,'#8e44ad','#8e44ad');
        const nP = yilOzet.net>=0;
        rows += row('\ud83c\udfc6 NET K\u00c2R / ZARAR',nP?'#d2f0df':'#f9d9d6',aylikSonuclar.map((s,i)=>s.ebitda-aylikAmortismanlar[i]),nP?'#1a7f4b':'#c0392b',nP?'#1a7f4b':'#c0392b',true);

        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>P&L</title>'
            +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:10px}'
            +'h1{font-size:13px;font-weight:800;color:#15222e;margin-bottom:2px}'
            +'p{font-size:9px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}'
            +'@media print{@page{size:A3 landscape;margin:5mm}}'
            +'</style></head><body>'
            +`<h1>${planAdi||'Plan'} \u2014 Detayl\u0131 Ayl\u0131k P&L Tablosu</h1>`
            +`<p>Tüm tutarlar ₺ &nbsp;|&nbsp; ${new Date().toLocaleDateString('tr-TR')}</p>`
            +'<table><thead><tr>'
            +th('Gider Kodu / Kalem','left')
            +ayBas.map(a=>th(a)).join('')
            +th('YILLIK TOPLAM')
            +'</tr></thead><tbody>'+rows+'</tbody></table>'
            +'<scr'+'ipt>setTimeout(function(){window.print()},300)</scr'+'ipt>'
            +'</body></html>';

        const win = window.open('','_blank','width=1400,height=900,scrollbars=yes');
        if(!win){ alert('A\u00e7\u0131l\u0131r pencere engellendi. Taray\u0131c\u0131 izinlerinden bu siteye izin verin.'); return; }
        win.document.write(html);
        win.document.close();
    };


    const fmt = window.fmt || ((v) => Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
    const renk = (v) => v >= 0 ? 'var(--enba-orange-dark)' : 'var(--error)';
    const arka = (v) => v >= 0 ? '#f0fce6' : 'var(--error-container)';

    const adimCiz = (no, title, icon) => (
        <div onClick={() => setAdim(no)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', cursor:'pointer', opacity: adim === no ? 1 : 0.5, flex:1, position:'relative', padding: '10px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background: adim === no ? 'var(--enba-orange)' : 'var(--surface-container-high)', color: adim === no ? '#fff' : 'var(--on-surface-variant)', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'18px', fontWeight:700, transition:'all 0.3s' }}>{icon}</div>
            <div className="step-label" style={{ fontSize:'12px', fontWeight:600, color: adim === no ? 'var(--enba-orange-dark)' : 'var(--on-surface-variant)', textAlign:'center', transition:'all 0.3s' }}>{title}</div>
        </div>
    );

    const [topluGiderler, setTopluGiderler] = React.useState({});
    const guncelleTopluGider = (kodu, val) => {
        setTopluGiderler(p => ({ ...p, [kodu]: val }));
    };
    const uygulaTümAylaraGider = () => {
        setAyVerileri(prev => prev.map(a => {
            const yg = { ...a.giderler };
            Object.keys(topluGiderler).forEach(k => {
                if (topluGiderler[k] !== '') yg[k] = Number(topluGiderler[k]);
            });
            return { ...a, giderler: yg };
        }));
    };

    const [topluTedarikler, setTopluTedarikler] = React.useState({});
    const guncelleTopluTedarikUrun = (tId, val) => {
        setTopluTedarikler(p => ({ ...p, [tId]: { ...(p[tId] || {}), urun: val } }));
    };
    const guncelleTopluTedarikBaslangicAy = (tId, val) => {
        setTopluTedarikler(p => ({ ...p, [tId]: { ...(p[tId] || {}), baslangicAy: Number(val) } }));
    };
    // Editing the start month auto-propagates that field value to all following months
    const guncelleTopluTedarik = (tId, ayIdx, alan, val) => {
        setTopluTedarikler(prev => {
            const entry = prev[tId] || {};
            const baslangicAy = entry.baslangicAy || 0;
            const newEntry = { ...entry };
            if (ayIdx === baslangicAy) {
                for (let m = baslangicAy; m < 12; m++) {
                    const ayData = newEntry[m] || { miktar: '', fiyat: '', nakliye: '' };
                    newEntry[m] = { ...ayData, [alan]: val };
                }
            } else {
                const ayData = newEntry[ayIdx] || { miktar: '', fiyat: '', nakliye: '' };
                newEntry[ayIdx] = { ...ayData, [alan]: val };
            }
            return { ...prev, [tId]: newEntry };
        });
    };
    const uygulaTopluTedarik = () => {
        setAyVerileri(prev => prev.map((a, i) => {
            const yt = { ...a.tedarikler };
            Object.keys(topluTedarikler).forEach(tId => {
                const tData = topluTedarikler[tId];
                const baslangicAy = tData.baslangicAy || 0;
                if (i < baslangicAy) return;
                const ayData = tData[i];
                if (!ayData && !tData.urun) return;
                const mevcut = yt[tId] || { miktar: 0, fiyat: 0, nakliye: 0, urun: '' };
                yt[tId] = {
                    ...mevcut,
                    ...(tData.urun !== undefined && tData.urun !== '' ? { urun: tData.urun } : {}),
                    ...(ayData && ayData.miktar  !== undefined && ayData.miktar  !== '' ? { miktar:  planOlcumBirimi === 'kg' ? Number(ayData.miktar) / 1000 : Number(ayData.miktar)  } : {}),
                    ...(ayData && ayData.fiyat   !== undefined && ayData.fiyat   !== '' ? { fiyat:   Number(ayData.fiyat)   } : {}),
                    ...(ayData && ayData.nakliye !== undefined && ayData.nakliye !== '' ? { nakliye: Number(ayData.nakliye) } : {}),
                };
            });
            return { ...a, tedarikler: yt };
        }));
    };

    const tumTedarikVerileriniTemizle = () => {
        if(window.confirm('Tüm aylardaki tedarikçi verileri (miktar, fiyat, nakliye vb.) sıfırlanacak. Emin misiniz?')) {
            setAyVerileri(prev => prev.map(a => ({ ...a, tedarikler: {} })));
        }
    };

    const tedarikAyiTemizle = (ayIdx, tedId) => {
        if(window.confirm('Bu tedarikçinin bu aydaki verisi silinecek. Emin misiniz?')) {
            setAyVerileri(prev => prev.map((a, i) => {
                if (i !== ayIdx) return a;
                const yt = { ...a.tedarikler };
                delete yt[tedId];
                return { ...a, tedarikler: yt };
            }));
        }
    };

    const musteriAyiTemizle = (ayIdx, musId) => {
        if(window.confirm('Bu müşterinin bu aydaki verisi silinecek. Emin misiniz?')) {
            setAyVerileri(prev => prev.map((a, i) => {
                if (i !== ayIdx) return a;
                const ym = { ...a.musteriler };
                delete ym[musId];
                return { ...a, musteriler: ym };
            }));
        }
    };

    const fireGuncelle = (ayIdx, alan, deger) => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i !== ayIdx) return a;
            return { ...a, [alan]: alan === 'fireAktif' ? deger : Number(deger) };
        }));
    };

    const [topluFire, setTopluFire] = React.useState({ aktif: false, yuzde: '', baslangicAy: 0 });
    const uygulaTopluFire = () => {
        setAyVerileri(prev => prev.map((a, i) => {
            if (i < topluFire.baslangicAy) return a;
            const next = { ...a };
            if (topluFire.aktif !== undefined) next.fireAktif = topluFire.aktif;
            if (topluFire.yuzde !== '') next.fireYuzde = Number(topluFire.yuzde);
            return next;
        }));
    };

    const [topluMusteriler, setTopluMusteriler] = React.useState({});
    const guncelleTopluMusteriUrun = (mId, val) => {
        setTopluMusteriler(p => ({ ...p, [mId]: { ...(p[mId] || {}), urun: val } }));
    };
    const guncelleTopluMusteriBaslangicAy = (mId, val) => {
        setTopluMusteriler(p => ({ ...p, [mId]: { ...(p[mId] || {}), baslangicAy: Number(val) } }));
    };
    // Editing the start month auto-propagates that field to all following months
    const guncelleTopluMusteri = (mId, ayIdx, alan, val) => {
        setTopluMusteriler(prev => {
            const entry = prev[mId] || {};
            const baslangicAy = entry.baslangicAy || 0;
            const newEntry = { ...entry };
            if (ayIdx === baslangicAy) {
                for (let m = baslangicAy; m < 12; m++) {
                    const ayData = newEntry[m] || { miktar: '', fiyat: '', nakliye: '' };
                    newEntry[m] = { ...ayData, [alan]: val };
                }
            } else {
                const ayData = newEntry[ayIdx] || { miktar: '', fiyat: '', nakliye: '' };
                newEntry[ayIdx] = { ...ayData, [alan]: val };
            }
            return { ...prev, [mId]: newEntry };
        });
    };
    const uygulaTopluMusteri = () => {
        setAyVerileri(prev => prev.map((a, i) => {
            const ym = { ...a.musteriler };
            Object.keys(topluMusteriler).forEach(mId => {
                const mData = topluMusteriler[mId];
                const baslangicAy = mData.baslangicAy || 0;
                if (i < baslangicAy) return;
                const ayData = mData[i];
                if (!ayData && !mData.urun) return;
                const mevcut = ym[mId] || { miktar: 0, fiyat: 0, nakliye: 0, urun: '' };
                ym[mId] = {
                    ...mevcut,
                    ...(mData.urun !== undefined && mData.urun !== '' ? { urun: mData.urun } : {}),
                    ...(ayData && ayData.miktar  !== undefined && ayData.miktar  !== '' ? { miktar:  planOlcumBirimi === 'kg' ? Number(ayData.miktar) / 1000 : Number(ayData.miktar)  } : {}),
                    ...(ayData && ayData.fiyat   !== undefined && ayData.fiyat   !== '' ? { fiyat:   Number(ayData.fiyat)   } : {}),
                    ...(ayData && ayData.nakliye !== undefined && ayData.nakliye !== '' ? { nakliye: Number(ayData.nakliye) } : {}),
                };
            });
            return { ...a, musteriler: ym };
        }));
    };

    const gecerliGiderler = window.SABLON_GIDERLER?.filter(g => !HARIC_KODLAR.has(g.kodu)) || [];

    const [saveToast, setSaveToast] = React.useState(false);

    const handleSave = () => {
        onSave({
            id: initialData?.id || "d_ipk_" + Date.now(),
            baslik: planAdi, baslangicYili, baslangicAyi, aylikAmortisman, yatirimlar, aylikAmortismanlar,
            tedarikciler, musteriler, ayVerileri, altGiderKalemleri,
            seciliMakinalar, vardiyaSayisi, vardiyaSaatleri, aylikCalismaGunu, elektrikBirimFiyat,
            opGider,
            asgariNet, asgariSgk, gunlukYemek, personelListesi,
            tonajBuyume, fiyatBuyume, sabitMaliyet, degiskenMaliyet,
            yilOzet, projeksiyon, aylikSonuclar, hesaplanmisAyVerileri,
            paraBirimi: planParaBirimi, olcumBirimi: planOlcumBirimi
        });
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
    };

    return (
        <div style={{ minHeight:'100dvh', background:'var(--surface)', fontFamily:"'Inter', sans-serif", paddingBottom:'40px' }}>
            {/* Kayıt Bildirim Toast */}
            {saveToast && (
                <div style={{
                    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #1a7f4b, #27ae60)',
                    color: '#fff', padding: '14px 28px', borderRadius: '2rem',
                    boxShadow: '0 8px 24px rgba(39,174,96,0.4)',
                    fontWeight: 700, fontSize: '15px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    animation: 'fadeInUp 0.3s ease'
                }}>
                    <span style={{ fontSize: '20px' }}>✅</span>
                    <span>İş planı başarıyla kaydedildi!</span>
                </div>
            )}
            <div className="page-header" style={{ position:'sticky', top:0, zIndex:100, background:'linear-gradient(135deg, var(--primary-container), var(--primary))', color:'#fff', padding:'20px 40px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderBottom:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                    <button onClick={onCancel} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'8px 18px', borderRadius:'2rem', cursor:'pointer', fontSize:'13px', whiteSpace:'nowrap' }}>
                        ← İptal
                    </button>
                    <h1 style={{ fontFamily:"'Manrope', sans-serif", fontWeight:800, fontSize:'clamp(16px,4vw,24px)', margin:0 }}>⚡  İş Planlaması</h1>
                    <select value={planParaBirimi} onChange={e => setPlanParaBirimi(e.target.value)}
                        style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'6px 12px', borderRadius:'1rem', fontSize:'13px', cursor:'pointer', fontWeight:600 }}>
                        <option value="TRY">₺ TRY</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="GBP">£ GBP</option>
                    </select>
                    <select value={planOlcumBirimi} onChange={e => setPlanOlcumBirimi(e.target.value)}
                        style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'6px 12px', borderRadius:'1rem', fontSize:'13px', cursor:'pointer', fontWeight:600 }}>
                        <option value="ton">Ton</option>
                        <option value="kg">Kilogram</option>
                    </select>
                </div>
                <div className="btn-group">
                    <button onClick={handleSave} style={{ background:'var(--enba-orange)', color:'#fff', border:'none', padding:'10px 24px', borderRadius:'2rem', cursor:'pointer', fontWeight:800, fontSize:'14px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', width:'100%' }}>
                        ⚡  Kaydet
                    </button>
                </div>
            </div>

            <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'16px 24px' }}>
                <div className="step-indicators">
                    {adimCiz(1, '1: Yatırım', '⚡ ')}
                    {adimCiz(2, '2: Tedarik', '⚡ ')}
                    {adimCiz(3, '3: Operasyon', '⚙️')}
                    {adimCiz(4, '4: Personel', '⚡ ')}
                    {adimCiz(5, '5: Giderler', '⚡ ')}
                    {adimCiz(6, '6: Müşteri', '⚡ ')}
                    {adimCiz(7, '7: Sonuç', '⚡ ')}
                </div>

                {adim === 1 && (
                    <DetStep6_Investment
                        yatirimlar={yatirimlar} setYatirimlar={setYatirimlar}
                        yeniYatirimAd={yeniYatirimAd} setYeniYatirimAd={setYeniYatirimAd}
                        yeniYatirimTur={yeniYatirimTur} setYeniYatirimTur={setYeniYatirimTur}
                        yeniYatirimMaliyet={yeniYatirimMaliyet} setYeniYatirimMaliyet={setYeniYatirimMaliyet}
                        yeniYatirimGeriOdeme={yeniYatirimGeriOdeme} setYeniYatirimGeriOdeme={setYeniYatirimGeriOdeme}
                        yeniYatirimErteleme={yeniYatirimErteleme} setYeniYatirimErteleme={setYeniYatirimErteleme}
                        fmt={fmt} setAdim={setAdim}
                    />
                )}

                {adim === 2 && (
                    <DetStep1_Suppliers
                        planAdi={planAdi} setPlanAdi={setPlanAdi}
                        baslangicYili={baslangicYili} setBaslangicYili={setBaslangicYili}
                        baslangicAyi={baslangicAyi} setBaslangicAyi={setBaslangicAyi}
                        tedarikciler={tedarikciler} setTedarikciler={setTedarikciler}
                        yeniTedarikci={yeniTedarikci} setYeniTedarikci={setYeniTedarikci}
                        topluTedarikler={topluTedarikler} guncelleTopluTedarik={guncelleTopluTedarik}
                        guncelleTopluTedarikUrun={guncelleTopluTedarikUrun}
                        guncelleTopluTedarikBaslangicAy={guncelleTopluTedarikBaslangicAy}
                        uygulaTopluTedarik={uygulaTopluTedarik} tumTedarikVerileriniTemizle={tumTedarikVerileriniTemizle}
                        ayVerileri={ayVerileri} acikAylar={acikAylar} setAcikAylar={setAcikAylar}
                        tedarikGuncelle={tedarikGuncelle} tedarikSonrakiAylara={tedarikSonrakiAylara}
                        planOlcumBirimi={planOlcumBirimi}
                        fmt={fmt} AYLAR={AYLAR} setAdim={setAdim}
                    />
                )}

                {adim === 6 && (
                    <DetStep2_Customers
                        musteriler={musteriler} setMusteriler={setMusteriler}
                        yeniMusteri={yeniMusteri} setYeniMusteri={setYeniMusteri}
                        topluMusteriler={topluMusteriler} guncelleTopluMusteri={guncelleTopluMusteri}
                        guncelleTopluMusteriUrun={guncelleTopluMusteriUrun}
                        guncelleTopluMusteriBaslangicAy={guncelleTopluMusteriBaslangicAy}
                        uygulaTopluMusteri={uygulaTopluMusteri} ayVerileri={ayVerileri}
                        acikAylar={acikAylar} setAcikAylar={setAcikAylar}
                        musteriGuncelle={musteriGuncelle} fmt={fmt} AYLAR={AYLAR}
                        baslangicAyi={baslangicAyi} baslangicYili={baslangicYili}
                        topluFire={topluFire} setTopluFire={setTopluFire}
                        uygulaTopluFire={uygulaTopluFire} hesaplanmisAyVerileri={hesaplanmisAyVerileri}
                        fireGuncelle={fireGuncelle} musteriSonrakiAylara={musteriSonrakiAylara}
                        musteriAyiTemizle={musteriAyiTemizle} planOlcumBirimi={planOlcumBirimi}
                        aylikSonuclar={aylikSonuclar} aylikAmortismanlar={aylikAmortismanlar}
                        setAdim={setAdim}
                    />
                )}

                {adim === 3 && (
                    <DetStep3_Operations 
                        globalMakinalar={globalMakinalar} vardiyaSayisi={vardiyaSayisi} setVardiyaSayisi={setVardiyaSayisi}
                        vardiyaSaatleri={vardiyaSaatleri} setVardiyaSaatleri={setVardiyaSaatleri}
                        aylikCalismaGunu={aylikCalismaGunu} setAylikCalismaGunu={setAylikCalismaGunu}
                        elektrikBirimFiyat={elektrikBirimFiyat} setElektrikBirimFiyat={setElektrikBirimFiyat}
                        opGider={opGider} setOpGider={setOpGider}
                        seciliMakinalar={seciliMakinalar} setSeciliMakinalar={setSeciliMakinalar}
                        aylikKapasiteToplam={aylikKapasiteToplam} aylikSonuclar={aylikSonuclar}
                        AYLAR={AYLAR} baslangicAyi={baslangicAyi} fmt={fmt} setAdim={setAdim}
                    />
                )}

                {adim === 4 && (
                    <DetStep4_Personnel 
                        asgariNet={asgariNet} setAsgariNet={setAsgariNet}
                        asgariSgk={asgariSgk} setAsgariSgk={setAsgariSgk}
                        gunlukYemek={gunlukYemek} setGunlukYemek={setGunlukYemek}
                        personelListesi={personelListesi} personelSil={personelSil}
                        yeniPersonel={yeniPersonel} setYeniPersonel={setYeniPersonel}
                        personelEkle={personelEkle} topluPersonelDegerleri={topluPersonelDegerleri}
                        guncelleTopluPersonel={guncelleTopluPersonel} uygulaTopluPersonel={uygulaTopluPersonel}
                        ayVerileri={ayVerileri} vardiyaSayisi={vardiyaSayisi}
                        aylikPersonelGuncelle={aylikPersonelGuncelle} AYLAR={AYLAR}
                        baslangicAyi={baslangicAyi} personelGiderleriniUygula={personelGiderleriniUygula}
                        setAdim={setAdim}
                    />
                )}

                {adim === 5 && (
                    <DetStep5_Expenses 
                        gecerliGiderler={gecerliGiderler} topluGiderler={topluGiderler}
                        guncelleTopluGider={guncelleTopluGider} uygulaTümAylaraGider={uygulaTümAylaraGider}
                        ayVerileri={ayVerileri} AYLAR={AYLAR} baslangicAyi={baslangicAyi}
                        ACILIR_KODLAR={ACILIR_KODLAR} altGiderKalemleri={altGiderKalemleri}
                        yeniAltAdlar={yeniAltAdlar} setYeniAltAdlar={setYeniAltAdlar}
                        altKalemEkle={altKalemEkle} altKalemSil={altKalemSil}
                        giderGuncelle={giderGuncelle} setAdim={setAdim}
                    />
                )}


                {adim === 7 && (
                    <DetStep7_Report 
                        yilOzet={yilOzet} fmt={fmt} renk={renk} arka={arka}
                        plTableRef={plTableRef} hesaplanmisAyVerileri={hesaplanmisAyVerileri}
                        aylikSonuclar={aylikSonuclar} AYLAR={AYLAR} baslangicAyi={baslangicAyi}
                        gecerliGiderler={gecerliGiderler} ACILIR_KODLAR={ACILIR_KODLAR}
                        altGiderKalemleri={altGiderKalemleri} aylikAmortismanlar={aylikAmortismanlar}
                        yillikAmortismanToplam={yillikAmortismanToplam} tonajBuyume={tonajBuyume}
                        setTonajBuyume={setTonajBuyume} fiyatBuyume={fiyatBuyume}
                        setFiyatBuyume={setFiyatBuyume} sabitMaliyet={sabitMaliyet}
                        setSabitMaliyet={setSabitMaliyet} degiskenMaliyet={degiskenMaliyet}
                        setDegiskenMaliyet={setDegiskenMaliyet} projeksiyon={projeksiyon}
                        excelExport={excelExport} detayliPdfExport={detayliPdfExport}
                        setAdim={setAdim}
                    />
                )}
            </div>
        </div>
    );
}

function DetayliPlanModulu({ navigate, bekleyenPlanlar, setBekleyenPlanlar, aktifPlanlar, setAktifPlanlar, globalAyarlar }) {
    const varsayilanAyarlar = globalAyarlar || { paraBirimi: 'TRY', olcumBirimi: 'ton' };
    const [aktifSayfa, setAktifSayfa] = React.useState('dashboard'); // 'dashboard' or 'wizard'
    const [duzenlenenPlan, setDuzenlenenPlan] = React.useState(null);

    // Detaylı planları filtrele
    const detayliBekleyen = bekleyenPlanlar.filter(p => p.plan_type === 'detailed');
    const detayliAktif = aktifPlanlar.filter(p => p.plan_type === 'detailed');

    const [gorunum, setGorunum] = React.useState('yillik'); // 'aylik', 'yillik', 'yillikOrtalama'
    const [sidebarAcik, setSidebarAcik] = React.useState(true);
    const [birlestirmeAy, setBirlestirmeAy] = React.useState(() => new Date().getMonth());
    const [birlestirmeYil, setBirlestirmeYil] = React.useState(() => new Date().getFullYear());

    const yeniPlanBaslat = () => {
        setDuzenlenenPlan(null);
        setAktifSayfa('wizard');
    };

    const IpkDuzenle = (plan) => {
        setDuzenlenenPlan(plan);
        setAktifSayfa('wizard');
    };

    const IpkSil = async (id) => {
        if(window.confirm("Bu detaylı planı silmek istediğinize emin misiniz?")) {
            try {
                await window.DataService.deleteData('business_plans', id);
                setBekleyenPlanlar(prev => prev.filter(x => x.id !== id));
                setAktifPlanlar(prev => prev.filter(x => x.id !== id));
            } catch (err) { alert("Silme hatası: " + err.message); }
        }
    };

    const planGuncelle = async (plan) => {
        const planToSave = { ...plan, plan_type: 'detailed', status: plan.status || 'pending' };
        try {
            const saved = await window.DataService.savePlan(planToSave);
            const savedPlan = { ...saved };
            
            if (duzenlenenPlan) {
                setAktifPlanlar(prev => prev.map(x => x.id === saved.id ? savedPlan : x));
                setBekleyenPlanlar(prev => prev.map(x => x.id === saved.id ? savedPlan : x));
                setDuzenlenenPlan(savedPlan);
            } else {
                setBekleyenPlanlar(prev => [...prev.filter(x => x.id !== saved.id), savedPlan]);
                setDuzenlenenPlan(savedPlan);
            }
        } catch (err) { alert("Kaydetme hatası: " + err.message); }
    };

    const verileriSifirla = () => {
        if(window.confirm("Tüm detaylı planlar silinecek. Emin misiniz?")) {
            setBekleyenPlanlar([]);
            setAktifPlanlar([]);
        }
    };

    const suruklemeBasladi = (e, planId) => e.dataTransfer.setData("planId", planId);
    const suruklemeUzerinde = (e) => e.preventDefault();
    const fabrikayaBrakildi = async (e) => {
        e.preventDefault();
        const planId = e.dataTransfer.getData("planId");
        const tasinan = bekleyenPlanlar.find(p => p.id === planId);
        if (!tasinan) return;
        
        try {
            const updated = await window.DataService.savePlan({ ...tasinan, status: 'active', plan_type: 'detailed' });
            setBekleyenPlanlar(prev => prev.filter(p => p.id !== planId));
            setAktifPlanlar(prev => [...prev, { ...updated }]);
        } catch (err) { alert("Hata: " + err.message); }
    };
    const kartiCikar = async (planId) => {
        const cikarilan = aktifPlanlar.find(p => p.id === planId);
        if (!cikarilan) return;
        
        try {
            const updated = await window.DataService.savePlan({ ...cikarilan, status: 'pending', plan_type: 'detailed' });
            setAktifPlanlar(prev => prev.filter(p => p.id !== planId));
            setBekleyenPlanlar(prev => [...prev, { ...updated }]);
        } catch (err) { alert("Hata: " + err.message); }
    };

    const scaleData = (plan) => {
        const scaleFactor = gorunum === 'aylik' ? (1/12) : 1;
        if (gorunum === 'yillikOrtalama') {
            const proj = plan.projeksiyon || [];
            const avg = (key) => proj.length > 0 ? proj.reduce((acc, p) => acc + (p[key] || 0), 0) / proj.length : 0;
            return {
                gelir: avg('gelir'), opex: avg('opex'), ebitda: avg('ebitda'), amortisman: avg('amortisman'), net: avg('net'), alisTon: avg('alisTon'), satisTon: avg('satisTon'),
                alisGideri: 0, alisNakliye: 0, satisNakliye: 0, digerOpex: 0
            };
        } else {
            const ozet = plan.yilOzet || {};
            return {
                gelir: (ozet.gelir || 0) * scaleFactor, 
                opex: (ozet.opex || 0) * scaleFactor, 
                ebitda: (ozet.ebitda || 0) * scaleFactor, 
                amortisman: (ozet.amortisman || 0) * scaleFactor, 
                net: (ozet.net || 0) * scaleFactor, 
                alisTon: (ozet.alisTon || 0) * scaleFactor, 
                satisTon: (ozet.toplamSatisTon || 0) * scaleFactor,
                alisGideri: (ozet.alisGideri || 0) * scaleFactor, 
                alisNakliye: (ozet.alisNakliye || 0) * scaleFactor, 
                satisNakliye: (ozet.satisNakliye || 0) * scaleFactor, 
                digerOpex: (ozet.digerOpex || 0) * scaleFactor,
            };
        }
    };

    const toplamTesis = aktifPlanlar.reduce((t, plan) => {
        const scaled = scaleData(plan);
        return {
            gelir: (t.gelir || 0) + (scaled.gelir || 0), 
            opex: (t.opex || 0) + (scaled.opex || 0), 
            ebitda: (t.ebitda || 0) + (scaled.ebitda || 0), 
            amortisman: (t.amortisman || 0) + (scaled.amortisman || 0), 
            net: (t.net || 0) + (scaled.net || 0)
        }
    }, { gelir: 0, opex: 0, ebitda: 0, amortisman: 0, net: 0 });

    const birlestirmeExcelExport = () => {
        const AYLAR_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
        const fmtN = v => Number(v||0);
        const getOp = (p, i) => (birlestirmeYil * 12 + birlestirmeAy + i) - ((p.baslangicYili || birlestirmeYil) * 12 + p.baslangicAyi);
        const getAs = (p, i) => { const op=getOp(p,i); return (op>=0&&op<12)?p.aylikSonuclar[op]:null; };
        const getAmor = (p, i) => { const op=getOp(p,i); if(op<0||op>=12)return 0; return p.aylikAmortismanlar?.[op]??p.aylikAmortisman??0; };
        const getHm = (p, i) => { const op=getOp(p,i); return (op>=0&&op<12)?p.hesaplanmisAyVerileri[op]:null; };
        const headerRow = ['KALEM'];
        for(let i = 0; i < 12; i++) {
            const ay = (birlestirmeAy + i) % 12;
            const yil = birlestirmeYil + Math.floor((birlestirmeAy + i) / 12);
            aktifPlanlar.forEach(p => headerRow.push(`${AYLAR_TR[ay]} ${yil} / ${p.baslik}`));
        }
        aktifPlanlar.forEach(p => headerRow.push(`Yıl Toplamı / ${p.baslik}`));
        headerRow.push('KONSOLİDE TOPLAM');
        const rows = [headerRow];
        const addRow = (label, getVal, getTotal) => {
            const r = [label];
            for(let i = 0; i < 12; i++) aktifPlanlar.forEach(p => r.push(fmtN(getVal(p,i))));
            aktifPlanlar.forEach(p => r.push(fmtN(getTotal(p))));
            r.push(fmtN(aktifPlanlar.reduce((t,p) => t + getTotal(p), 0)));
            rows.push(r);
        };
        addRow('Alış Tonajı (T)',      (p,i)=>Math.round(getAs(p,i)?.alisTon||0),          p=>Math.round(p.yilOzet.alisTon||0));
        addRow('Satış Tonajı (T)',     (p,i)=>Math.round(getAs(p,i)?.toplamSatisTon||0),   p=>Math.round(p.yilOzet.toplamSatisTon||0));
        addRow('Satış Gelirleri',     (p,i)=>getAs(p,i)?.gelir||0,        p=>p.yilOzet.gelir);
        addRow('Hammadde Alış (150)', (p,i)=>getAs(p,i)?.alisGideri||0,   p=>p.yilOzet.alisGideri);
        addRow('Alış Nakliyesi (760)',(p,i)=>getAs(p,i)?.alisNakliye||0,  p=>p.yilOzet.alisNakliye);
        addRow('Satış Nakliyesi (760)',(p,i)=>getAs(p,i)?.satisNakliye||0,p=>p.yilOzet.satisNakliye);
        const tumKodlar = Array.from(new Set(aktifPlanlar.flatMap(p=>(p.hesaplanmisAyVerileri||[]).flatMap(a=>Object.keys(a.giderler||{}))))).sort();
        tumKodlar.forEach(kodu => {
            const sAd = window.SABLON_GIDERLER?.find(g=>g.kodu===kodu)?.adi || `Gider ${kodu}`;
            addRow(`${kodu} - ${sAd}`, (p,i)=>Number(getHm(p,i)?.giderler?.[kodu])||0,
                p=>(p.hesaplanmisAyVerileri||[]).reduce((t,hm)=>t+(Number(hm.giderler?.[kodu])||0),0));
        });
        addRow('Amortisman (CAPEX)',  (p,i)=>getAmor(p,i), p=>p.yilOzet.amortisman||0);
        addRow('Net Kâr / Zarar',    (p,i)=>{ const a=getAs(p,i); return a?(a.ebitda-getAmor(p,i)):0; }, p=>p.yilOzet.net);
        const kfVal = (num, den) => den > 0 ? Math.round(num / den) : 0;
        rows.push(['--- KEY FIGURES (₺/T) ---']);
        addRow('Alış Fiyatı (₺/T)',      (p,i)=>{ const a=getAs(p,i); return a&&a.alisTon>0?Math.round(a.alisGideri/a.alisTon):0; },        p=>kfVal(p.yilOzet.alisGideri,p.yilOzet.alisTon));
        addRow('Alış Nakliyesi (₺/T)',   (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?Math.round(a.alisNakliye/a.toplamSatisTon):0; },  p=>kfVal(p.yilOzet.alisNakliye,p.yilOzet.toplamSatisTon));
        addRow('Satış Nakliyesi (₺/T)',  (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?Math.round(a.satisNakliye/a.toplamSatisTon):0; }, p=>kfVal(p.yilOzet.satisNakliye,p.yilOzet.toplamSatisTon));
        addRow('Diğer Giderler (₺/T)',   (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?Math.round(a.digerOpex/a.toplamSatisTon):0; },    p=>kfVal(p.yilOzet.digerOpex,p.yilOzet.toplamSatisTon));
        addRow('Satış Fiyatı (₺/T)',     (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?Math.round(a.gelir/a.toplamSatisTon):0; },        p=>kfVal(p.yilOzet.gelir,p.yilOzet.toplamSatisTon));
        addRow('Ton Başı Kazanç (₺/T)',  (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?Math.round(a.ebitda/a.toplamSatisTon):0; },       p=>kfVal(p.yilOzet.ebitda,p.yilOzet.toplamSatisTon));
        const konsolide = ['TOPLAM TESİS NET (KONSOLİDE)'];
        for(let i = 0; i < 12; i++) {
            let net=0; aktifPlanlar.forEach(p=>{ const a=getAs(p,i); if(a) net+=a.ebitda-getAmor(p,i); });
            aktifPlanlar.forEach(()=>konsolide.push(net));
        }
        aktifPlanlar.forEach(p=>konsolide.push(p.yilOzet.net));
        konsolide.push(aktifPlanlar.reduce((t,p)=>t+p.yilOzet.net,0));
        rows.push(konsolide);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{wch:28}, ...Array(headerRow.length-1).fill({wch:16})];
        XLSX.utils.book_append_sheet(wb, ws, 'Kar-Zarar Akışı');
        XLSX.writeFile(wb, `Birlestirme_${AYLAR[birlestirmeAy]}_${birlestirmeYil}.xlsx`);
    };

    const birlestirmePdfExport = () => {
        const AYLAR_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
        const fmtN = v => Number(v||0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const getOpPdf = (p, i) => (birlestirmeYil * 12 + birlestirmeAy + i) - ((p.baslangicYili || birlestirmeYil) * 12 + p.baslangicAyi);
        const getAs = (p, i) => { const op=getOpPdf(p,i); return (op>=0&&op<12)?p.aylikSonuclar[op]:null; };
        const getAmor = (p, i) => { const op=getOpPdf(p,i); if(op<0||op>=12)return 0; return p.aylikAmortismanlar?.[op]??p.aylikAmortisman??0; };
        const getHm = (p, i) => { const op=getOpPdf(p,i); return (op>=0&&op<12)?p.hesaplanmisAyVerileri[op]:null; };
        const N = aktifPlanlar.length;
        const planRenk = ['#1a5c9e','#1a7f4b','#b06000','#8e1a5c','#4a1a8e'];
        const thS = (t, extra='') => `<th style="padding:5px 4px;font-size:8.5px;font-weight:700;background:#1a3a5c;color:#fff;border:1px solid #2d5080;white-space:nowrap;${extra}">${t}</th>`;
        const tdS = (v, c='#222', bg='#fff', bold=false) => `<td style="padding:4px 4px;font-size:8px;text-align:right;color:${c};background:${bg};font-weight:${bold?700:400};border:1px solid #e0e0e0;white-space:nowrap">${v}</td>`;
        const tumKodlar = Array.from(new Set(aktifPlanlar.flatMap(p=>(p.hesaplanmisAyVerileri||[]).flatMap(a=>Object.keys(a.giderler||{}))))).sort();

        let thead = '<tr>';
        thead += `<th rowspan="2" style="padding:5px 6px;font-size:8.5px;font-weight:700;background:#1a3a5c;color:#fff;border:1px solid #2d5080;min-width:120px;text-align:left">KALEM</th>`;
        for(let i=0;i<12;i++){
            const ay=(birlestirmeAy+i)%12; const yil=birlestirmeYil+Math.floor((birlestirmeAy+i)/12);
            thead += `<th colspan="${N}" style="padding:5px 4px;font-size:8px;font-weight:700;background:#15222e;color:#9dc4e8;border:1px solid #2d5080;text-align:center">${AYLAR_TR[ay]} ${yil}</th>`;
        }
        thead += `<th colspan="${N}" style="padding:5px 4px;font-size:8px;font-weight:700;background:#0a3d22;color:#7fffb0;border:1px solid #2d5080;text-align:center">Yıllık Toplam</th>`;
        thead += '</tr><tr>';
        for(let col=0;col<=12;col++) aktifPlanlar.forEach((p,pi)=>{ thead += thS(p.baslik.length>9?p.baslik.slice(0,8)+'…':p.baslik, `color:${planRenk[pi%planRenk.length]};background:#0e2035`); });
        thead += '</tr>';

        const buildRow = (label, getVal, getTotal, lBg='#f5f5f5', vc='#333', bold=false) => {
            let r = `<td style="padding:4px 6px;font-size:8px;background:${lBg};font-weight:${bold?700:500};border:1px solid #e0e0e0;white-space:nowrap">${label}</td>`;
            for(let i=0;i<12;i++) aktifPlanlar.forEach(p=>{ const v=getVal(p,i); r+=tdS(v!=null&&v!==0?fmtN(v):'—',v>0?vc:'#bbb',i%2===0?'#fff':'#f9f9f9',bold); });
            aktifPlanlar.forEach(p=>{ const v=getTotal(p); r+=tdS(v!==0?fmtN(v):'—',v>0?vc:'#bbb','#f0f0f0',bold); });
            return `<tr>${r}</tr>`;
        };

        let tbody = '';
        const secHdr = (t,bg,c) => `<tr><td colspan="${1+13*N}" style="padding:5px 8px;background:${bg};color:${c};font-weight:800;font-size:8.5px;border:1px solid #333">${t}</td></tr>`;
        const kfPdf = (num, den) => den > 0 ? Math.round(num / den) : null;
        const tdKf = (v, pos) => `<td style="padding:4px 4px;font-size:8px;text-align:right;color:${v==null?'#bbb':pos?'#1a7f4b':'#c0392b'};background:#f0f4ff;font-weight:${v==null?400:600};border:1px solid #e0e0e0;white-space:nowrap">${v!=null?Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }):'—'}</td>`;
        const buildKfRow = (label, getVal, getTotal, bold=false) => {
            let r = `<td style="padding:4px 6px;font-size:8px;background:#e8eeff;font-weight:${bold?700:500};border:1px solid #e0e0e0;white-space:nowrap">${label}</td>`;
            for(let i=0;i<12;i++) aktifPlanlar.forEach(p=>{ const v=getVal(p,i); r+=tdKf(v,v==null||v>=0); });
            aktifPlanlar.forEach(p=>{ const v=getTotal(p); r+=tdKf(v,v==null||v>=0); });
            return `<tr>${r}</tr>`;
        };
        tbody += secHdr('▸ TONAJ','#0a2035','#4FC3F7');
        tbody += buildRow('Alış Tonajı (T)',  (p,i)=>Math.round(getAs(p,i)?.alisTon||0),        p=>Math.round(p.yilOzet.alisTon||0),  '#e8f4ff','#1a5c9e');
        tbody += buildRow('Satış Tonajı (T)', (p,i)=>Math.round(getAs(p,i)?.toplamSatisTon||0), p=>Math.round(p.yilOzet.toplamSatisTon||0), '#edfaf4','#1a7f4b');
        tbody += secHdr('▸ GELİR','#0a3d22','#7fffb0');
        tbody += buildRow('Satış Gelirleri', (p,i)=>getAs(p,i)?.gelir||0, p=>p.yilOzet.gelir, '#edfaf4','#1a7f4b',true);
        tbody += secHdr('▸ MALİYETLER','#3d2015','#ffb380');
        tbody += buildRow('Hammadde Alış (150)', (p,i)=>getAs(p,i)?.alisGideri||0, p=>p.yilOzet.alisGideri);
        tbody += buildRow('Alış Nakliyesi (760)', (p,i)=>getAs(p,i)?.alisNakliye||0, p=>p.yilOzet.alisNakliye);
        tbody += buildRow('Satış Nakliyesi (760)', (p,i)=>getAs(p,i)?.satisNakliye||0, p=>p.yilOzet.satisNakliye);
        tumKodlar.forEach(kodu=>{
            const sAd=window.SABLON_GIDERLER?.find(g=>g.kodu===kodu)?.adi||`Gider ${kodu}`;
            tbody+=buildRow(`${kodu} - ${sAd}`, (p,i)=>Number(getHm(p,i)?.giderler?.[kodu])||0,
                p=>(p.hesaplanmisAyVerileri||[]).reduce((t,hm)=>t+(Number(hm.giderler?.[kodu])||0),0));
        });
        tbody += buildRow('Amortisman (CAPEX)', (p,i)=>getAmor(p,i), p=>p.yilOzet.amortisman||0,'#fdf5ff','#8e44ad');
        tbody += secHdr('▸ NET SONUÇ','#1a2035','#a0c4ff');
        tbody += buildRow('Net Kâr / Zarar', (p,i)=>{ const a=getAs(p,i); return a?(a.ebitda-getAmor(p,i)):0; },
            p=>p.yilOzet.net, '#e6f7ed','#1a7f4b',true);
        tbody += secHdr('▸ KEY FIGURES (₺/T)','#0d1a3d','#93c5fd');
        tbody += buildKfRow('Alış Fiyatı (₺/T)',      (p,i)=>{ const a=getAs(p,i); return a&&a.alisTon>0?kfPdf(a.alisGideri,a.alisTon):null; },        p=>kfPdf(p.yilOzet.alisGideri,p.yilOzet.alisTon));
        tbody += buildKfRow('Alış Nakliyesi (₺/T)',   (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?kfPdf(a.alisNakliye,a.toplamSatisTon):null; },  p=>kfPdf(p.yilOzet.alisNakliye,p.yilOzet.toplamSatisTon));
        tbody += buildKfRow('Satış Nakliyesi (₺/T)',  (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?kfPdf(a.satisNakliye,a.toplamSatisTon):null; }, p=>kfPdf(p.yilOzet.satisNakliye,p.yilOzet.toplamSatisTon));
        tbody += buildKfRow('Diğer Giderler (₺/T)',   (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?kfPdf(a.digerOpex,a.toplamSatisTon):null; },    p=>kfPdf(p.yilOzet.digerOpex,p.yilOzet.toplamSatisTon));
        tbody += buildKfRow('Satış Fiyatı (₺/T)',     (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?kfPdf(a.gelir,a.toplamSatisTon):null; },        p=>kfPdf(p.yilOzet.gelir,p.yilOzet.toplamSatisTon));
        tbody += buildKfRow('Ton Başı Kazanç (₺/T)',  (p,i)=>{ const a=getAs(p,i); return a&&a.toplamSatisTon>0?kfPdf(a.ebitda,a.toplamSatisTon):null; },       p=>kfPdf(p.yilOzet.ebitda,p.yilOzet.toplamSatisTon), true);
        // Konsolide row
        let konRow = `<tr><td style="padding:5px 8px;font-size:9px;font-weight:800;background:#0d3322;color:#2ecc71;border:1px solid #1a6644">TOPLAM TESİS (KONSOLİDE)</td>`;
        for(let i=0;i<12;i++){
            let net=0; aktifPlanlar.forEach(p=>{ const a=getAs(p,i); if(a) net+=a.ebitda-getAmor(p,i); });
            const c=net>=0?'#1a7f4b':'#c0392b';
            konRow += `<td colspan="${N}" style="padding:5px 4px;font-size:9px;font-weight:800;text-align:center;background:${net>=0?'#e6f7ed':'#fcecea'};color:${c};border:1px solid #ccc">${fmtN(net)}</td>`;
        }
        const totalNet=aktifPlanlar.reduce((t,p)=>t+p.yilOzet.net,0);
        konRow += `<td colspan="${N}" style="padding:5px 4px;font-size:10px;font-weight:800;text-align:center;background:${totalNet>=0?'#d2f0df':'#f9d9d6'};color:${totalNet>=0?'#1a7f4b':'#c0392b'};border:2px solid #1a6644">${fmtN(totalNet)} ₺</td></tr>`;
        tbody += konRow;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Birleştirme Kar/Zarar</title>`
            +`<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:8px}`
            +`h1{font-size:12px;font-weight:800;color:#15222e;margin-bottom:2px}p{font-size:8.5px;color:#666;margin-bottom:6px}`
            +`table{width:100%;border-collapse:collapse}@media print{@page{size:A2 landscape;margin:4mm}}</style>`
            +`</head><body>`
            +`<h1>DETAYLI TKKÖ BİRLEŞTİRME — 12 Aylık Kar/Zarar Akışı</h1>`
            +`<p>${AYLAR[birlestirmeAy]} ${birlestirmeYil} başlangıçlı 12 ay &nbsp;|&nbsp; Planlar: ${aktifPlanlar.map(p=>p.baslik).join(', ')} &nbsp;|&nbsp; ${new Date().toLocaleDateString('tr-TR')}</p>`
            +`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
            +`<scr`+`ipt>setTimeout(function(){window.print()},400)</scr`+`ipt></body></html>`;
        const win = window.open('','_blank','width=1600,height=900,scrollbars=yes');
        if(!win){ alert('Açılır pencere engellendi. Tarayıcı izinlerinden bu siteye izin verin.'); return; }
        win.document.write(html);
        win.document.close();
    };

    if (aktifSayfa === 'wizard') {
        return <DetayliPlanWizard initialData={duzenlenenPlan} onSave={planGuncelle} onCancel={() => setAktifSayfa('dashboard')} varsayilanAyarlar={varsayilanAyarlar} />;
    }

    const fmt = window.fmt || ((v) => Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

    return (
        <React.Fragment>
            <div className="page-container">
                <div className="container">
                    <div className={`sidebar${sidebarAcik ? '' : ' sidebar-hidden'}`}>
                        <button className="sidebar-toggle" onClick={() => setSidebarAcik(!sidebarAcik)} title='Paneli Gizle/Aç'>{sidebarAcik ? '◀' : '▶'}</button>
                        <div className="sidebar-content">
                            <button className="btn btn-primary" onClick={yeniPlanBaslat}>+ DETAYLI MODEL TASARLA</button>
                            <button className="btn btn-secondary" style={{marginBottom: '15px', backgroundColor: '#34495E'}} onClick={() => navigate('landing')}>⚡  ANA SAYFAYA DÖN</button>
                            
                            <h2 style={{ textTransform: 'lowercase' }}>⚡  BİRLEŞTİRME LİSTESİ</h2>
                            <p style={{ fontSize: '12px', color: '#607d8b' }}>Aşağıdaki detaylı planları karşılaştırmak ve birleştirmek için tesise sürükleyin.</p>
                            
                            {detayliBekleyen.map(plan => (
                                <div key={plan.id} className="card" draggable onDragStart={(e) => suruklemeBasladi(e, plan.id)}>
                                    <div className="card-title">{plan.baslik}</div>
                                    <div className="card-info">Satış: {fmt(plan.yilOzet?.toplamSatisTon || 0)} Ton/Yıl</div>
                                    <div style={{fontSize:'12px', display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:'5px', paddingTop:'5px'}}>
                                        <span>Net Kâr (Yıl 1):</span> <strong style={{color: (plan.yilOzet?.net || 0) >= 0 ? '#82A12E' : '#ef5350'}}>{fmt(plan.yilOzet?.net || 0)} ₺</strong>
                                    </div>
                                    <div style={{ display:'flex', gap:'5px', marginTop:'10px' }}>
                                        <button className="btn btn-warning" style={{flex:1, fontSize:'11px', padding:'8px 5px'}} 
                                            onClick={(e) => { e.stopPropagation(); IpkDuzenle(plan); }}>DÜZENLE</button>
                                        <button className="btn btn-success" style={{flex:1, fontSize:'11px', padding:'8px 5px'}} 
                                            onClick={(e) => { e.stopPropagation(); fabrikayaBrakildi({ preventDefault: () => {}, dataTransfer: { getData: () => plan.id } }); }}>AKTİF ET</button>
                                        <button className="btn btn-danger" 
                                            style={{padding:'10px 14px', fontSize:'14px', fontWeight:'800', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'8px', cursor:'pointer'}} 
                                            title="Bu Planı Tamamen Sil"
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); IpkSil(plan.id); }}>X</button>
                                    </div>
                                </div>
                            ))}
                            {detayliBekleyen.length === 0 && <p style={{color: '#999', fontSize: '14px', textTransform: 'lowercase'}}>henüz detaylı plan oluşturulmadı.</p>}
                            
                            <div className="reset-btn-container">
                                <button className="btn btn-reset" onClick={verileriSifirla}>⚡ ️ tüm detaylı planları sil</button>
                            </div>
                        </div>
                    </div>

                    <div className="factory" onDragOver={suruklemeUzerinde} onDrop={fabrikayaBrakildi}>
                        <div className="factory-header"><span className="enba">enba</span><span className="recycling">recycling</span></div>
                        <div className="factory-subheader">DETAYLI PLANLAMA - KONSOLİDE TESİS GÖRÜNÜMÜ</div>
                        
                        <div className="dashboard" id="exportable-report">
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '15px', marginBottom: '15px', flexWrap:'wrap', gap:'10px'}}>
                                <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>⚡  DETAYLI TKKÖ BİRLEŞTİRME</h3>
                                <div style={{display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px', overflowX:'auto'}}>
                                    <button onClick={()=>setGorunum('aylik')} style={{padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:gorunum==='aylik'?700:500, background: gorunum==='aylik'?'var(--enba-dark)':'transparent', color: gorunum==='aylik'?'#fff':'var(--on-surface-variant)', transition:'0.2s', whiteSpace:'nowrap'}}>Aylık (Ortalama)</button>
                                    <button onClick={()=>setGorunum('yillik')} style={{padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:gorunum==='yillik'?700:500, background: gorunum==='yillik'?'var(--enba-dark)':'transparent', color: gorunum==='yillik'?'#fff':'var(--on-surface-variant)', transition:'0.2s', whiteSpace:'nowrap'}}>1 Yıllık (Baz)</button>
                                    <button onClick={()=>setGorunum('yillikOrtalama')} style={{padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:gorunum==='yillikOrtalama'?700:500, background: gorunum==='yillikOrtalama'?'var(--enba-dark)':'transparent', color: gorunum==='yillikOrtalama'?'#fff':'var(--on-surface-variant)', transition:'0.2s', whiteSpace:'nowrap'}}>5 Yıllık Ortalama</button>
                                    <button onClick={()=>setGorunum('ayay')} style={{padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:gorunum==='ayay'?700:500, background: gorunum==='ayay'?'var(--enba-dark)':'transparent', color: gorunum==='ayay'?'#fff':'var(--on-surface-variant)', transition:'0.2s', whiteSpace:'nowrap'}}>12 Aylık Kar/Zarar Akışı</button>
                                </div>
                            </div>

                            {aktifPlanlar.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '15px'}}>
                                    Tesiste henüz aktif detaylı plan yok. Sol menüden sürükleyerek ekleyin.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                                    {gorunum === 'ayay' ? (
                                        <>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', padding:'6px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', flexWrap:'wrap', justifyContent:'space-between'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
                                                <span style={{fontSize:'12px', fontWeight:600, color:'var(--on-surface-variant)'}}>İş Başlangıcı:</span>
                                                <select value={birlestirmeAy} onChange={e=>setBirlestirmeAy(Number(e.target.value))} style={{padding:'5px 8px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.15)', background:'var(--surface-container)', color:'var(--on-surface)', fontSize:'12px'}}>
                                                    {AYLAR.map((ay, idx) => <option key={idx} value={idx}>{ay}</option>)}
                                                </select>
                                                <input type="number" value={birlestirmeYil} onChange={e=>setBirlestirmeYil(Number(e.target.value))} min="2020" max="2050" style={{width:'72px', padding:'5px 8px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.15)', background:'var(--surface-container)', color:'var(--on-surface)', fontSize:'12px'}} onFocus={window.selectOnFocus} />
                                            </div>
                                            <div style={{display:'flex', gap:'6px'}}>
                                                <button onClick={birlestirmeExcelExport} style={{display:'flex', alignItems:'center', gap:'5px', background:'#1a7f4b', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'2rem', cursor:'pointer', fontWeight:600, fontSize:'12px', whiteSpace:'nowrap'}}
                                                    onMouseEnter={e=>e.currentTarget.style.background='#15603a'} onMouseLeave={e=>e.currentTarget.style.background='#1a7f4b'}>
                                                    ⚡  Excel
                                                </button>
                                                <button onClick={birlestirmePdfExport} style={{display:'flex', alignItems:'center', gap:'5px', background:'#c0392b', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'2rem', cursor:'pointer', fontWeight:600, fontSize:'12px', whiteSpace:'nowrap'}}
                                                    onMouseEnter={e=>e.currentTarget.style.background='#922b21'} onMouseLeave={e=>e.currentTarget.style.background='#c0392b'}>
                                                    ⚡  PDF
                                                </button>
                                            </div>
                                        </div>
                                        <table className="matrix-table" id="detay-tkko-table-ayay">
                                            {(() => {
                                                const N = aktifPlanlar.length;
                                                const totalCols = 1 + 12 * N + N;
                                                const getAs = (p, i) => {
                                                    const colAbs = birlestirmeYil * 12 + birlestirmeAy + i;
                                                    const planStart = (p.baslangicYili || birlestirmeYil) * 12 + p.baslangicAyi;
                                                    const op = colAbs - planStart;
                                                    return (op >= 0 && op < 12) ? p.aylikSonuclar?.[op] : null;
                                                };
                                                const getHm = (p, i) => {
                                                    const colAbs = birlestirmeYil * 12 + birlestirmeAy + i;
                                                    const planStart = (p.baslangicYili || birlestirmeYil) * 12 + p.baslangicAyi;
                                                    const op = colAbs - planStart;
                                                    return (op >= 0 && op < 12) ? p.hesaplanmisAyVerileri[op] : null;
                                                };
                                                const getAmor = (p, i) => {
                                                    const colAbs = birlestirmeYil * 12 + birlestirmeAy + i;
                                                    const planStart = (p.baslangicYili || birlestirmeYil) * 12 + p.baslangicAyi;
                                                    const op = colAbs - planStart;
                                                    if (op < 0 || op >= 12) return 0;
                                                    return p.aylikAmortismanlar?.[op] ?? p.aylikAmortisman ?? 0;
                                                };
                                                const tumAltKalemler = aktifPlanlar.flatMap(p => p.altGiderKalemleri || []);
                                                const altIds = new Set(tumAltKalemler.map(k => k.id));
                                                const tumGiderKodlari = Array.from(new Set(
                                                    aktifPlanlar.flatMap(p => (p.hesaplanmisAyVerileri || []).flatMap(a => Object.keys(a.giderler || {}).filter(k => !altIds.has(k))))
                                                )).sort();
                                                const planRenkleri = ['#4FC3F7','#81C784','#FFB74D','#F06292','#CE93D8'];
                                                return (
                                                    <>
                                                    <thead>
                                                        <tr>
                                                            <th rowSpan={2} style={{verticalAlign:'middle', minWidth:'160px'}}>KALEM</th>
                                                            {Array.from({length:12}, (_, i) => {
                                                                const ay = (birlestirmeAy + i) % 12;
                                                                const yil = birlestirmeYil + Math.floor((birlestirmeAy + i) / 12);
                                                                return <th key={i} colSpan={N} style={{textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.12)'}}>{AYLAR[ay]}<br/><span style={{fontSize:'9px', opacity:0.5, fontWeight:400}}>{yil}</span></th>;
                                                            })}
                                                            <th colSpan={N} style={{color:'var(--enba-orange)', borderLeft:'2px solid rgba(255,255,255,0.2)'}}>Yıllık Toplam</th>
                                                        </tr>
                                                        <tr>
                                                            {Array.from({length:13}, (_, col) =>
                                                                aktifPlanlar.map((p, pi) => (
                                                                    <th key={`${col}-${pi}`} style={{fontSize:'10px', fontWeight:600, color: planRenkleri[pi % planRenkleri.length], borderLeft: pi === 0 ? '1px solid rgba(255,255,255,0.12)' : 'none', whiteSpace:'nowrap', maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis', padding:'4px 6px'}} title={p.baslik}>
                                                                        {p.baslik.length > 10 ? p.baslik.slice(0,9)+'…' : p.baslik}
                                                                    </th>
                                                                ))
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {aktifPlanlar.some(p => !p.aylikSonuclar || p.aylikSonuclar.length !== 12) && (
                                                            <tr><td colSpan={totalCols} style={{color:'#F59E0B', textAlign:'center', padding:'8px'}}>⚠ Bazı planlar eski kayıt — planı düzenleyip tekrar "Kaydet" yapınız.</td></tr>
                                                        )}
                                                        {[
                                                            { label:'Alış Tonajı (T)', get:(p,i) => { const a=getAs(p,i); return a ? {val:Math.round(a.alisTon), color:'#4FC3F7'} : null; }, total:(p)=>({val:Math.round(p.yilOzet.alisTon||0), color:'#4FC3F7'}) },
                                                            { label:'Satış Tonajı (T)', get:(p,i) => { const a=getAs(p,i); return a ? {val:Math.round(a.toplamSatisTon), color:'#81C784'} : null; }, total:(p)=>({val:Math.round(p.yilOzet.toplamSatisTon||0), color:'#81C784'}) },
                                                            { label:'Satış Gelirleri', get:(p,i) => { const a=getAs(p,i); return a ? {val:a.gelir, color:'var(--enba-orange)'} : null; }, total:(p)=>({val:p.yilOzet.gelir, color:'var(--enba-orange)'}) },
                                                            { label:'Hammadde Alış (150)', get:(p,i) => { const a=getAs(p,i); return a ? {val:a.alisGideri} : null; }, total:(p)=>({val:p.yilOzet.alisGideri}) },
                                                            { label:'Alış Nakliyesi (760)', get:(p,i) => { const a=getAs(p,i); return a ? {val:a.alisNakliye} : null; }, total:(p)=>({val:p.yilOzet.alisNakliye}) },
                                                            { label:'Satış Nakliyesi (760)', get:(p,i) => { const a=getAs(p,i); return a ? {val:a.satisNakliye} : null; }, total:(p)=>({val:p.yilOzet.satisNakliye}) },
                                                        ].map(row => (
                                                            <tr key={row.label}>
                                                                <td style={{paddingLeft:'14px', color:'#A0AEC0', fontSize:'12px'}}>{row.label}</td>
                                                                {Array.from({length:12}, (_, i) =>
                                                                    aktifPlanlar.map((p, pi) => {
                                                                        const r = row.get(p, i);
                                                                        return <td key={`${i}-${pi}`} style={{color: r ? (r.color || 'inherit') : '#444', borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize:'11px'}}>{r ? fmt(r.val) : '-'}</td>;
                                                                    })
                                                                )}
                                                                {aktifPlanlar.map((p, pi) => {
                                                                    const t = row.total(p);
                                                                    return <td key={pi} className="total-col" style={{color: t.color || 'inherit', borderLeft: pi===0 ? '2px solid rgba(255,255,255,0.15)' : 'none', fontSize:'11px'}}>{fmt(t.val)}</td>;
                                                                })}
                                                            </tr>
                                                        ))}
                                                        {tumGiderKodlari.map(kodu => {
                                                            const sablonG = window.SABLON_GIDERLER?.find(g => g.kodu === kodu);
                                                            const sAd = sablonG?.adi || `Gider ${kodu}`;
                                                            const isAcilir = ACILIR_KODLAR.includes(kodu);
                                                            const kodAltlar = isAcilir ? tumAltKalemler.filter(k => k.parentKod === kodu) : [];
                                                            const rows = [];
                                                            rows.push(
                                                                <tr key={kodu}>
                                                                    <td style={{paddingLeft:'14px', color: isAcilir ? '#FFB74D' : '#A0AEC0', fontSize:'12px', fontWeight: isAcilir ? 700 : 'normal'}}>{kodu} - {sAd}</td>
                                                                    {Array.from({length:12}, (_, i) =>
                                                                        aktifPlanlar.map((p, pi) => {
                                                                            const hm = getHm(p, i);
                                                                            const val = isAcilir
                                                                                ? (p.altGiderKalemleri || []).filter(k => k.parentKod === kodu).reduce((t,k) => t + (Number(hm?.giderler?.[k.id]) || 0), 0)
                                                                                : (hm?.giderler?.[kodu] || 0);
                                                                            return <td key={`${i}-${pi}`} style={{borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize:'11px'}}>{hm ? fmt(val) : '-'}</td>;
                                                                        })
                                                                    )}
                                                                    {aktifPlanlar.map((p, pi) => {
                                                                        const total = isAcilir
                                                                            ? (p.altGiderKalemleri || []).filter(k => k.parentKod === kodu).reduce((t,k) => t + (p.hesaplanmisAyVerileri||[]).reduce((s,hm) => s + (Number(hm.giderler?.[k.id])||0), 0), 0)
                                                                            : (p.hesaplanmisAyVerileri || []).reduce((t, hm) => t + (Number(hm.giderler?.[kodu]) || 0), 0);
                                                                        return <td key={pi} className="total-col" style={{borderLeft: pi===0 ? '2px solid rgba(255,255,255,0.15)' : 'none', fontSize:'11px'}}>{fmt(total)}</td>;
                                                                    })}
                                                                </tr>
                                                            );
                                                            if (isAcilir && kodAltlar.length > 0) {
                                                                const uniqueAltlar = Array.from(new Map(kodAltlar.map(k => [k.id, k])).values());
                                                                uniqueAltlar.forEach(k => {
                                                                    rows.push(
                                                                        <tr key={k.id}>
                                                                            <td style={{paddingLeft:'26px', color:'#A0AEC0', fontSize:'11px'}}>└ {k.ad}</td>
                                                                            {Array.from({length:12}, (_, i) =>
                                                                                aktifPlanlar.map((p, pi) => {
                                                                                    const hm = getHm(p, i);
                                                                                    return <td key={`${i}-${pi}`} style={{borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize:'10px', color:'#888'}}>{hm ? fmt(hm.giderler?.[k.id] || 0) : '-'}</td>;
                                                                                })
                                                                            )}
                                                                            {aktifPlanlar.map((p, pi) => (
                                                                                <td key={pi} className="total-col" style={{borderLeft: pi===0 ? '2px solid rgba(255,255,255,0.1)' : 'none', fontSize:'10px', color:'#888'}}>
                                                                                    {fmt((p.hesaplanmisAyVerileri||[]).reduce((t,hm) => t + (Number(hm.giderler?.[k.id])||0), 0))}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                });
                                                            }
                                                            return rows;
                                                        })}
                                                        <tr>
                                                            <td style={{paddingLeft:'14px', color:'#A0AEC0', fontSize:'12px'}}>Amortisman (CAPEX)</td>
                                                            {Array.from({length:12}, (_, i) =>
                                                                aktifPlanlar.map((p, pi) => {
                                                                    const a = getAs(p, i);
                                                                    return <td key={`${i}-${pi}`} style={{borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize:'11px'}}>{a ? fmt(Math.round(getAmor(p, i))) : '-'}</td>;
                                                                })
                                                            )}
                                                            {aktifPlanlar.map((p, pi) => (
                                                                <td key={pi} className="total-col" style={{borderLeft: pi===0 ? '2px solid rgba(255,255,255,0.15)' : 'none', fontSize:'11px'}}>{fmt(p.yilOzet.amortisman || 0)}</td>
                                                            ))}
                                                        </tr>
                                                        <tr style={{background:'rgba(255,255,255,0.04)', borderTop:'2px solid rgba(255,255,255,0.15)'}}>
                                                            <td style={{paddingLeft:'14px', fontWeight:'bold', fontSize:'13px'}}>Aylık Net Kâr / Zarar</td>
                                                            {Array.from({length:12}, (_, i) =>
                                                                aktifPlanlar.map((p, pi) => {
                                                                    const as = getAs(p, i);
                                                                    if(!as) return <td key={`${i}-${pi}`} style={{color:'#444', borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.08)' : 'none'}}>-</td>;
                                                                    const net = as.ebitda - getAmor(p, i);
                                                                    return <td key={`${i}-${pi}`} style={{fontWeight:'bold', color: net>=0?'#2ecc71':'#e74c3c', borderLeft: pi===0?'1px solid rgba(255,255,255,0.08)':'none'}}>{fmt(net)}</td>;
                                                                })
                                                            )}
                                                            {aktifPlanlar.map((p, pi) => (
                                                                <td key={pi} className="total-col" style={{fontWeight:'bold', color: p.yilOzet.net>=0?'var(--enba-orange)':'#E74C3C', borderLeft: pi===0?'2px solid rgba(255,255,255,0.15)':'none'}}>{fmt(p.yilOzet.net)}</td>
                                                            ))}
                                                        </tr>
                                                        <tr style={{height:'8px'}}><td colSpan={totalCols} style={{border:'none'}}></td></tr>
                                                        <tr><td colSpan={totalCols} style={{background:'rgba(79,195,247,0.06)', borderTop:'2px solid rgba(79,195,247,0.25)', borderBottom:'1px solid rgba(79,195,247,0.15)', paddingLeft:'14px', paddingTop:'7px', paddingBottom:'7px', fontWeight:700, fontSize:'11px', color:'#4FC3F7', letterSpacing:'0.06em', textTransform:'uppercase'}}>⚡  Key Figures — Ton Başı Analiz (₺/T)</td></tr>
                                                        {[
                                                            { label:'Alış Fiyatı (₺/T)', get:(p,i) => { const a=getAs(p,i); if(!a||a.alisTon<=0) return null; return {val:Math.round(a.alisGideri/a.alisTon), color:'#FFB74D'}; }, total:(p) => { const t=p.yilOzet; return t.alisTon>0 ? {val:Math.round(t.alisGideri/t.alisTon), color:'#FFB74D'} : {val:null}; } },
                                                            { label:'Alış Nakliyesi (₺/T)', get:(p,i) => { const a=getAs(p,i); if(!a||a.toplamSatisTon<=0) return null; return {val:Math.round(a.alisNakliye/a.toplamSatisTon)}; }, total:(p) => { const t=p.yilOzet; return {val: t.toplamSatisTon>0 ? Math.round(t.alisNakliye/t.toplamSatisTon) : null}; } },
                                                            { label:'Satış Nakliyesi (₺/T)', get:(p,i) => { const a=getAs(p,i); if(!a||a.toplamSatisTon<=0) return null; return {val:Math.round(a.satisNakliye/a.toplamSatisTon)}; }, total:(p) => { const t=p.yilOzet; return {val: t.toplamSatisTon>0 ? Math.round(t.satisNakliye/t.toplamSatisTon) : null}; } },
                                                            { label:'Diğer Giderler (₺/T)', get:(p,i) => { const a=getAs(p,i); if(!a||a.toplamSatisTon<=0) return null; return {val:Math.round(a.digerOpex/a.toplamSatisTon)}; }, total:(p) => { const t=p.yilOzet; return {val: t.toplamSatisTon>0 ? Math.round(t.digerOpex/t.toplamSatisTon) : null}; } },
                                                            { label:'Satış Fiyatı (₺/T)', get:(p,i) => { const a=getAs(p,i); if(!a||a.toplamSatisTon<=0) return null; return {val:Math.round(a.gelir/a.toplamSatisTon), color:'var(--enba-orange)'}; }, total:(p) => { const t=p.yilOzet; return t.toplamSatisTon>0 ? {val:Math.round(t.gelir/t.toplamSatisTon), color:'var(--enba-orange)'} : {val:null}; } },
                                                            { label:'Ton Başı Kazanç (₺/T)', bold:true, get:(p,i) => { const a=getAs(p,i); if(!a||a.toplamSatisTon<=0) return null; const v=Math.round(a.ebitda/a.toplamSatisTon); return {val:v, color:v>=0?'#2ecc71':'#e74c3c', bold:true}; }, total:(p) => { const t=p.yilOzet; if(t.toplamSatisTon<=0) return {val:null}; const v=Math.round(t.ebitda/t.toplamSatisTon); return {val:v, color:v>=0?'var(--enba-orange)':'#E74C3C', bold:true}; } },
                                                        ].map(row => (
                                                            <tr key={row.label} style={row.bold ? {background:'rgba(79,195,247,0.04)', borderBottom:'1px solid rgba(79,195,247,0.15)'} : {}}>
                                                                <td style={{paddingLeft:'14px', color: row.bold ? '#4FC3F7' : '#A0AEC0', fontSize:'12px', fontWeight: row.bold ? 700 : 'normal'}}>{row.label}</td>
                                                                {Array.from({length:12}, (_, i) =>
                                                                    aktifPlanlar.map((p, pi) => {
                                                                        const r = row.get(p, i);
                                                                        return <td key={`${i}-${pi}`} style={{color: r ? (r.color || '#A0AEC0') : '#333', borderLeft: pi===0 ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize:'11px', fontWeight: r?.bold ? 700 : 'normal'}}>{r && r.val != null ? r.val.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}</td>;
                                                                    })
                                                                )}
                                                                {aktifPlanlar.map((p, pi) => {
                                                                    const t = row.total(p);
                                                                    return <td key={pi} className="total-col" style={{color: t.color || '#A0AEC0', borderLeft: pi===0 ? '2px solid rgba(255,255,255,0.15)' : 'none', fontSize:'11px', fontWeight: t.bold ? 700 : 'normal'}}>{t.val != null ? t.val.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}</td>;
                                                                })}
                                                            </tr>
                                                        ))}
                                                        <tr style={{height:'8px'}}><td colSpan={totalCols} style={{border:'none'}}></td></tr>
                                                        <tr className="grand-total" style={{borderTop:'2px solid rgba(255,255,255,0.2)', background:'rgba(0,255,150,0.05)'}}>
                                                            <td style={{paddingTop:'10px', paddingBottom:'10px', fontWeight:'bold', fontSize:'13px', color:'var(--enba-orange)'}}>TOPLAM TESİS NET</td>
                                                            {Array.from({length:12}, (_, i) => {
                                                                let net = 0;
                                                                let ok = true;
                                                                aktifPlanlar.forEach(p => {
                                                                    if(!p.aylikSonuclar || p.aylikSonuclar.length !== 12) { ok=false; return; }
                                                                    const as = getAs(p, i);
                                                                    if(as) net += as.ebitda - getAmor(p, i);
                                                                });
                                                                return <td key={i} colSpan={N} style={{fontWeight:'bold', fontSize:'13px', textAlign:'center', color: ok ? (net>=0?'var(--enba-orange)':'#E74C3C') : '#A0AEC0', borderLeft:'1px solid rgba(255,255,255,0.1)'}}>{ok ? fmt(net) : '-'}</td>;
                                                            })}
                                                            <td colSpan={N} className="total-col" style={{fontWeight:'bold', fontSize:'14px', color: toplamTesis.net>=0?'var(--enba-orange)':'#E74C3C', borderLeft:'2px solid rgba(255,255,255,0.2)'}}>{fmt(toplamTesis.net)} ₺</td>
                                                        </tr>
                                                    </tbody>
                                                    </>
                                                );
                                            })()}
                                        </table>
                                        </>
                                    ) : (
                                        <table className="matrix-table" id="detay-tkko-table">
                                            <thead>
                                                <tr>
                                                    <th>FİNANSAL KALEMLER</th>
                                                    {aktifPlanlar.map(p => <th key={p.id}>{p.baslik}</th>)}
                                                    <th style={{color: 'var(--enba-orange)', fontSize: '14px'}}>TOPLAM TESİS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr><td colSpan={aktifPlanlar.length + 2} className="row-header" style={{color: 'var(--enba-orange)'}}>⚡  GELİRLER</td></tr>
                                                <tr>
                                                    <td>Toplam Satış Geliri</td>
                                                    {aktifPlanlar.map(p => <td key={p.id}>{fmt(scaleData(p).gelir)}</td>)}
                                                    <td className="total-col" style={{color: 'var(--enba-orange)', fontSize:'14px'}}>{fmt(toplamTesis.gelir)} ₺</td>
                                                </tr>

                                                <tr><td colSpan={aktifPlanlar.length + 2} className="row-header" style={{color: '#e74c3c'}}>⚡  OPEX (GİDERLER)</td></tr>
                                                {gorunum !== 'yillikOrtalama' && (
                                                    <>
                                                        <tr style={{backgroundColor: 'rgba(0,0,0,0.15)'}}>
                                                            <td style={{paddingLeft: '35px', color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>Alım Maliyeti (Malzeme)</td>
                                                            {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(scaleData(p).alisGideri)}</td>)}
                                                            <td className="total-col" style={{color: '#E74C3C', opacity: 0.8, borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(aktifPlanlar.reduce((t,p) => t + scaleData(p).alisGideri, 0))} ₺</td>
                                                        </tr>
                                                        <tr style={{backgroundColor: 'rgba(0,0,0,0.15)'}}>
                                                            <td style={{paddingLeft: '35px', color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>Alış Nakliyesi</td>
                                                            {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(scaleData(p).alisNakliye)}</td>)}
                                                            <td className="total-col" style={{color: '#E74C3C', opacity: 0.8, borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(aktifPlanlar.reduce((t,p) => t + scaleData(p).alisNakliye, 0))} ₺</td>
                                                        </tr>
                                                        <tr style={{backgroundColor: 'rgba(0,0,0,0.15)'}}>
                                                            <td style={{paddingLeft: '35px', color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>Satış Nakliyesi</td>
                                                            {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(scaleData(p).satisNakliye)}</td>)}
                                                            <td className="total-col" style={{color: '#E74C3C', opacity: 0.8, borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(aktifPlanlar.reduce((t,p) => t + scaleData(p).satisNakliye, 0))} ₺</td>
                                                        </tr>
                                                        <tr style={{backgroundColor: 'rgba(0,0,0,0.15)'}}>
                                                            <td style={{paddingLeft: '35px', color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>Tesis İçi Giderler (İşçilik, Elk vb.)</td>
                                                            {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0', borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(scaleData(p).digerOpex)}</td>)}
                                                            <td className="total-col" style={{color: '#E74C3C', opacity: 0.8, borderBottom: '1px dotted rgba(255,255,255,0.05)'}}>{fmt(aktifPlanlar.reduce((t,p) => t + scaleData(p).digerOpex, 0))} ₺</td>
                                                        </tr>
                                                    </>
                                                )}
                                                
                                                <tr className="grand-total" style={{ borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '15px' }}>
                                                    <td style={{ paddingTop: '15px' }}>TOPLAM OPEX</td>
                                                    {aktifPlanlar.map(p => <td key={p.id} style={{ paddingTop: '15px' }}>{fmt(scaleData(p).opex)}</td>)}
                                                    <td className="total-col" style={{color: '#E74C3C', fontSize:'14px', paddingTop: '15px'}}>{fmt(toplamTesis.opex)} ₺</td>
                                                </tr>

                                                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                    <td style={{ fontWeight: 'bold', fontSize: '14px', paddingTop: '15px' }}>FAVÖK (EBITDA)</td>
                                                    {aktifPlanlar.map(p => <td key={p.id} style={{ fontWeight: 'bold', fontSize: '14px', paddingTop: '15px', color: scaleData(p).ebitda >= 0 ? '#2ecc71' : '#e74c3c' }}>{fmt(scaleData(p).ebitda)}</td>)}
                                                    <td className="total-col" style={{ fontWeight: 'bold', fontSize: '15px', paddingTop: '15px', color: toplamTesis.ebitda >= 0 ? '#2ecc71' : '#e74c3c' }}>{fmt(toplamTesis.ebitda)} ₺</td>
                                                </tr>

                                                <tr>
                                                    <td style={{color: '#A0AEC0'}}>Amortisman (CAPEX)</td>
                                                    {aktifPlanlar.map(p => <td key={p.id} style={{color: '#A0AEC0'}}>{fmt(scaleData(p).amortisman)}</td>)}
                                                    <td className="total-col" style={{color: '#E74C3C'}}>{fmt(toplamTesis.amortisman)} ₺</td>
                                                </tr>

                                                <tr style={{ background: 'rgba(243, 156, 18, 0.1)' }}>
                                                    <td style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '16px' }}>NET DURUM (KÂR / ZARAR)</td>
                                                    {aktifPlanlar.map(p => <td key={p.id} style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '16px', color: scaleData(p).net >= 0 ? 'var(--enba-orange)' : '#E74C3C' }}>{fmt(scaleData(p).net)}</td>)}
                                                    <td className="total-col" style={{ padding: '18px 10px', fontWeight: 'bold', fontSize: '20px', color: toplamTesis.net >= 0 ? 'var(--enba-orange)' : '#E74C3C' }}>{fmt(toplamTesis.net)} ₺</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>

                        <h4 style={{color: 'var(--enba-dark)', margin: '15px 0 10px 0', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px'}}>Tesisteki Aktif Detaylı Planlar:</h4>
                         <div className="active-cards">
                            {detayliAktif.map(plan => {
                                const s = scaleData(plan);
                                return (
                                <div key={plan.id} className="active-card" onClick={() => IpkDuzenle(plan)} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{fontWeight: 'bold', color: 'var(--enba-dark)', textTransform: 'uppercase', fontSize: '14px'}}>{plan.baslik}</span>
                                        <span style={{fontSize: '14px'}}>✏️</span>
                                    </div>
                                    <div style={{fontSize: '11px', color: '#7F8C8D', marginBottom: '5px'}}>Gösterilen Satış: {fmt(s.satisTon)} T</div>
                                    
                                    <div style={{fontSize:'12px', color:'#34495E', borderTop:'1px dashed var(--border-grey)', paddingTop:'8px', paddingBottom:'8px'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span>Gelir:</span> <span style={{color:'var(--enba-orange-dark)', fontWeight: '600'}}>+ {fmt(s.gelir)} ₺</span></div>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span>OPEX:</span> <span style={{color:'var(--btn-red-dark)', fontWeight: '600'}}>- {fmt(s.opex)} ₺</span></div>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px', fontWeight:'700'}}><span>FAVÖK:</span> <span>{fmt(s.ebitda)} ₺</span></div>
                                        <div style={{display:'flex', justifyContent:'space-between'}}><span>Amortisman:</span> <span style={{color:'var(--btn-red-dark)', fontWeight: '600'}}>- {fmt(s.amortisman)} ₺</span></div>
                                    </div>

                                    <div style={{fontSize:'14px', display:'flex', justifyContent:'space-between', marginTop:'4px', paddingTop:'8px', borderTop:'1px solid var(--border-grey)'}}>
                                        <span style={{fontWeight: '600', color: 'var(--enba-dark)'}}>Net Kâr:</span> <strong style={{color: s.net >= 0 ? 'var(--enba-orange-dark)' : 'var(--btn-red-dark)'}}>{fmt(s.net)} ₺</strong>
                                    </div>

                                    <button className="remove-btn" 
                                        style={{padding:'12px 20px', fontSize:'12px', fontWeight:'800', background:'var(--error)', color:'#fff', marginTop:'15px'}}
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); kartiCikar(plan.id); }}>Geri Al / Durdur</button>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

window.DetayliPlanModulu = DetayliPlanModulu;

