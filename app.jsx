const { useState, useEffect } = React;

function App() {
    const [aktifSayfa, setAktifSayfa] = useState('anaSayfa'); 
    const [planSekmesi, setPlanSekmesi] = useState('operasyon'); 
    const [duzenlenenPlanId, setDuzenlenenPlanId] = useState(null);
    const [sihirbazAcik, setSihirbazAcik] = useState(false);
    const [sihirbazAdim, setSihirbazAdim] = useState(0); 
    const [sihirbazVeri, setSihirbazVeri] = useState({
        baslik: '', aciklama: '', model: { alSat: false, uretim: false, komisyon: false },
        atıkCinsi: '', hedefUrun: '', alSatUrun: '', komisyonIsi: '',
        ayristirmaVar: true, aylikTon: '', symFire: '', nemFire: '', uretimFiresi: '',
        elektrikKwFiyat: '4.07', kiraTesis: '', kiraDiger: '',
        personelSayisi: '', ayiklamaHizi: '1', makineKapasite: '',
        alisFiyatiKg: '', alisNakliyeKg: '', satisFiyatiKg: '', satisNakliyeKg: '',
        bakimOnarimYuzde: '2', genelYonetimYuzde: '5'
    });
    
    const [sidebarAcik, setSidebarAcik] = useState(true);
    const [mobileSidebarAcik, setMobileSidebarAcik] = useState(false);

    const [grupGosterim, setGrupGosterim] = useState({
        G1: true, G2: true, G3: true, G4: true, G5: true
    });

    const [bekleyenPlanlar, setBekleyenPlanlar] = useState([]);
    const [aktifPlanlar, setAktifPlanlar] = useState([]);
    const [asgariNet, setAsgariNet] = useState(28075.5); 
    const [asgariSgk, setAsgariSgk] = useState(12799.13); 

    // Verileri Supabase'den çek
    useEffect(() => {
        const load = async () => {
            try {
                const allPlans = await window.DataService.getPlans();
                const extracted = allPlans.map(p => ({ 
                    ...p, 
                    id: p.id, 
                    status: p.status 
                }));
                // Hızlı planlama modülünde sadece ilgili planları göster
                setBekleyenPlanlar(extracted.filter(p => p.status === 'pending' && p.plan_type !== 'detailed'));
                setAktifPlanlar(extracted.filter(p => p.status === 'active' && p.plan_type !== 'detailed'));

                const net = await window.DataService.getSetting('asgariNet', 28075.5);
                const sgk = await window.DataService.getSetting('asgariSgk', 12799.13);
                setAsgariNet(Number(net));
                setAsgariSgk(Number(sgk));
            } catch (err) {
                console.error("Başlangıç verileri yüklenemedi:", err);
            }
        };
        load();
    }, []);

    // Ayar değişikliklerini kaydet
    useEffect(() => {
        window.DataService.updateSetting('asgariNet', asgariNet);
        window.DataService.updateSetting('asgariSgk', asgariSgk);
    }, [asgariNet, asgariSgk]);

    const [yeniPlanBaslik, setYeniPlanBaslik] = useState("");
    const [yeniPlanGiderler, setYeniPlanGiderler] = useState({});
    const [yeniPlanGelirler, setYeniPlanGelirler] = useState({});
    const [satisDetaylari, setSatisDetaylari] = useState([]); 

    const [disHizmetlerListesi, setDisHizmetlerListesi] = useState([]);
    const [yeniDisHizmet, setYeniDisHizmet] = useState({ ad: '', tutar: '' });

    const [kiralamaListesi, setKiralamaListesi] = useState([]);
    const [yeniKiralama, setYeniKiralama] = useState({ ad: '', tutar: '' });

    const [kurulumKalemleri, setKurulumKalemleri] = useState([]);
    const [yeniKurulum, setYeniKurulum] = useState({
        ad: '', tutar: '', isMakine: false, kapasite: '', verimlilik: 80, motorlar: []
    });
    const [yeniMotor, setYeniMotor] = useState({ ad: '', gucu: '', yukKatsayisi: 70 });
    const [amortismanSuresi, setAmortismanSuresi] = useState(36);

    const [planParametreleri, setPlanParametreleri] = useState({
        aylikTon: 0, alisFiyati: 0, satisFiyati: 0, aylikGun: 26, gunlukSaat: 8, vardiyaSayisi: 1,
        elektrikKwFiyat: 4.07, gunlukYemekUcreti: 200, alisNakliye: 0, satisNakliye: 0, ayiklamaHizi: 1
    });
    
    const [uretimRecetesi, setUretimRecetesi] = useState({
        ayristirmaVar: false, copOrani: 5, copBertarafFiyati: 0, uretimFiresi: 3, altUrunler: []
    });
    
    const [kutleDengesiOzet, setKutleDengesiOzet] = useState({
        girenTon: 0, copTon: 0, uretimGirenTon: 0, uretimFireTon: 0, toplamSatisTon: 0, netAnaUrunTon: 0
    });

    const [ayiklamaKapasitesi, setAyiklamaKapasitesi] = useState(0);
    const [personelListesi, setPersonelListesi] = useState([]);
    const [yeniPersonel, setYeniPersonel] = useState({ unvan: '', kisiSayisi: 1, ekMaas: 0, ekSgk: 0, ekYemek: 0, isAyiklama: false });

    // PDF DIŞA AKTARMA FONKSİYONU
    const exportToPDF = () => {
        const element = document.getElementById('exportable-report');
        const opt = {
            margin:       10,
            filename:     'Enba_Finansal_Rapor.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    // EXCEL DIŞA AKTARMA FONKSİYONU
    const exportToExcel = () => {
        const table = document.getElementById('tkko-table');
        const wb = XLSX.utils.table_to_book(table, {sheet: "Enba_TKKÖ"});
        XLSX.writeFile(wb, "Enba_Finansal_Rapor.xlsx");
    };

    const sablonIndir = () => {
        const satirlar = [];

        // Başlık satırı
        satirlar.push(["KOD", "KALEM ADI", "TUTAR (₺)"]);

        // Gelirler bölümü
        satirlar.push(["--- GELİRLER ---", "", ""]);
        window.SABLON_GELIRLER.forEach(g => {
            satirlar.push([g.kodu, g.adi, ""]);
        });

        // Giderler bölümü - gruplara göre
        window.GIDER_GRUPLARI.forEach(grup => {
            satirlar.push([`--- ${grup.ad.toUpperCase()} ---`, "", ""]);
            window.SABLON_GIDERLER.filter(g => g.grup === grup.id).forEach(g => {
                satirlar.push([g.kodu, g.adi, ""]);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(satirlar);

        // Sütun genişlikleri
        ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 18 }];

        // Başlık satırı kalın
        const headerCells = ['A1', 'B1', 'C1'];
        headerCells.forEach(ref => {
            if (ws[ref]) ws[ref].s = { font: { bold: true } };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "İPK Şablonu");
        XLSX.writeFile(wb, "Enba_IPK_Sablonu.xlsx");
    };

    const excelIceAktar = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const planAdi = window.prompt("Yüklenecek İPK için bir plan adı girin:", file.name.replace(/\.[^/.]+$/, ""));
        if (!planAdi || !planAdi.trim()) {
            e.target.value = null;
            return;
        }

        const gelirKodlari = new Set(window.SABLON_GELIRLER.map(g => g.kodu));

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });

                const planData = { gelirler: {}, giderler: {}, opex: 0, gelir: 0 };

                wb.SheetNames.forEach(sheetName => {
                    const sheet = wb.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    json.forEach(row => {
                        // Şablon formatı: [KOD, KALEM ADI, TUTAR]
                        const kod = String(row[0] || "").trim();
                        const tutar = Number(row[2]);

                        // Yalnızca 2-3 haneli sayısal kod olan satırları işle
                        if (/^\d{2,3}$/.test(kod) && tutar > 0) {
                            if (gelirKodlari.has(kod)) {
                                planData.gelir += tutar;
                                planData.gelirler[kod] = (planData.gelirler[kod] || 0) + tutar;
                            } else {
                                planData.opex += tutar;
                                planData.giderler[kod] = (planData.giderler[kod] || 0) + tutar;
                            }
                        }
                    });
                });

                if (planData.opex > 0 || planData.gelir > 0) {
                    const yeniPlan = {
                        id: "excel_ipk_" + Date.now(),
                        baslik: planAdi.trim(),
                        parametreler: { aylikTon: 0, alisFiyati: 0, satisFiyati: 0, aylikGun: 26, gunlukSaat: 10, elektrikKwFiyat: 4.07, gunlukYemekUcreti: 200, alisNakliye: 0, satisNakliye: 0, ayiklamaHizi: 1 },
                        uretimRecetesi: { ayristirmaVar: false, copOrani: 5, copBertarafFiyati: 0, uretimFiresi: 3, altUrunler: [] },
                        kutleDengesi: { girenTon: 0, copTon: 0, uretimGirenTon: 0, uretimFireTon: 0, toplamSatisTon: 0, netAnaUrunTon: 0 },
                        personelListesi: [], disHizmetlerListesi: [], satisDetaylari: [], kurulumKalemleri: [], amortismanSuresi: 36, aylikAmortisman: 0,
                        gelirler: planData.gelirler,
                        giderler: planData.giderler,
                        ozetGelir: planData.gelir,
                        ozetOpex: planData.opex,
                        ebitda: planData.gelir - planData.opex,
                        netKar: planData.gelir - planData.opex
                    };
                    setBekleyenPlanlar(prev => [...prev, yeniPlan]);
                    alert(`"${planAdi.trim()}" adıyla yeni İPK oluşturuldu!`);
                } else {
                    alert("İşlenebilir bir finansal veri bulunamadı. Lütfen şablonu kullanarak C sütununa tutarları girdiğinizden emin olun.");
                }
            } catch (error) {
                alert("Dosya okunurken bir hata oluştu: " + error.message);
            }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    useEffect(() => {
        if (aktifSayfa === 'planEkle') {
            let girenTon = Number(planParametreleri.aylikTon);
            let copTon = 0; let uretimGirenTon = 0; let uretimFireTon = 0;
            let toplamSatisTon = 0; let toplamSatisGeliri = 0;
            let geciciSatisDetaylari = [];

            if (uretimRecetesi.ayristirmaVar) {
                copTon = girenTon * (Number(uretimRecetesi.copOrani) / 100);
                let toplamAltUrunOrani = 0;
                let anaUrunRawTon = 0;

                uretimRecetesi.altUrunler.forEach(u => {
                    let uTonRaw = girenTon * (Number(u.oran) / 100);
                    toplamAltUrunOrani += Number(u.oran);
                    let uTonNet = 0;

                    if (u.uretimeGirer) {
                        uretimGirenTon += uTonRaw; 
                        uTonNet = uTonRaw * (1 - Number(uretimRecetesi.uretimFiresi) / 100);
                        let uGeliri = uTonNet * Number(u.fiyat);
                        toplamSatisGeliri += uGeliri;
                        toplamSatisTon += uTonNet;
                        if(uTonNet > 0 || uGeliri > 0) geciciSatisDetaylari.push({ ad: u.ad + ' (İşlenmiş)', tutar: uGeliri, ton: uTonNet });
                    } else {
                        uTonNet = uTonRaw; 
                        let uGeliri = uTonNet * Number(u.fiyat);
                        toplamSatisGeliri += uGeliri;
                        toplamSatisTon += uTonNet;
                        if(uTonNet > 0 || uGeliri > 0) geciciSatisDetaylari.push({ ad: u.ad + ' (Doğrudan)', tutar: uGeliri, ton: uTonNet });
                    }
                });

                let anaUrunOrani = 100 - Number(uretimRecetesi.copOrani) - toplamAltUrunOrani;
                if(anaUrunOrani < 0) anaUrunOrani = 0; 
                anaUrunRawTon = girenTon * (anaUrunOrani / 100);
                
                uretimGirenTon += anaUrunRawTon;
                let netAnaUrunTon = anaUrunRawTon * (1 - Number(uretimRecetesi.uretimFiresi) / 100);
                toplamSatisTon += netAnaUrunTon;

                let anaUrunSatisGeliri = netAnaUrunTon * Number(planParametreleri.satisFiyati);
                toplamSatisGeliri += anaUrunSatisGeliri;
                geciciSatisDetaylari.unshift({ ad: 'Ana Ürün', tutar: anaUrunSatisGeliri, ton: netAnaUrunTon });
                
                uretimFireTon = uretimGirenTon * (Number(uretimRecetesi.uretimFiresi) / 100);

            } else {
                uretimGirenTon = girenTon; 
                uretimFireTon = uretimGirenTon * (Number(uretimRecetesi.uretimFiresi) / 100);
                let netAnaUrunTon = uretimGirenTon - uretimFireTon;
                toplamSatisTon = netAnaUrunTon;

                let anaUrunSatisGeliri = netAnaUrunTon * Number(planParametreleri.satisFiyati);
                toplamSatisGeliri += anaUrunSatisGeliri;
                geciciSatisDetaylari.push({ ad: 'Ana Ürün', tutar: anaUrunSatisGeliri, ton: netAnaUrunTon });
            }

            setKutleDengesiOzet({ girenTon, copTon, uretimGirenTon, uretimFireTon, toplamSatisTon, netAnaUrunTon: toplamSatisTon });
            setSatisDetaylari(geciciSatisDetaylari);

            let malAlisGideri = girenTon * Number(planParametreleri.alisFiyati);
            let alisNakliyeGideri = girenTon * Number(planParametreleri.alisNakliye);
            let satisNakliyeGideri = toplamSatisTon * Number(planParametreleri.satisNakliye); 

            let copBertarafGideri = uretimRecetesi.ayristirmaVar ? (copTon * Number(uretimRecetesi.copBertarafFiyati)) : 0;
            let manuelDisHizmetler = disHizmetlerListesi.reduce((sum, h) => sum + Number(h.tutar), 0);
            let toplamDisHizmetGideri = copBertarafGideri + manuelDisHizmetler;

            let toplamKiralamaGideri = kiralamaListesi.reduce((sum, h) => sum + Number(h.tutar), 0);

            let toplamMaas = 0; let toplamSgk = 0; let toplamYemek = 0; let ayiklamaciSayisi = 0;
            const tabanYemekAylik = Number(planParametreleri.gunlukYemekUcreti) * Number(planParametreleri.aylikGun);
            
            const vardiyaSayisi = Number(planParametreleri.vardiyaSayisi || 1);
            personelListesi.forEach(p => {
                const kisiSayisi = Number(p.kisiSayisi) * vardiyaSayisi;
                toplamMaas += (asgariNet + Number(p.ekMaas)) * kisiSayisi;
                toplamSgk += (asgariSgk + Number(p.ekSgk)) * kisiSayisi;
                toplamYemek += (tabanYemekAylik + Number(p.ekYemek)) * kisiSayisi;
                if(p.isAyiklama) ayiklamaciSayisi += kisiSayisi;
            });

            const kapasite = ayiklamaciSayisi * Number(planParametreleri.aylikGun) * Number(planParametreleri.gunlukSaat) * Number(planParametreleri.vardiyaSayisi || 1) * Number(planParametreleri.ayiklamaHizi);
            setAyiklamaKapasitesi(kapasite);

            let makineElektrikGideri = 0;
            kurulumKalemleri.forEach(k => {
                if(k.isMakine) {
                    const aylikSaat = Number(planParametreleri.aylikGun) * Number(planParametreleri.gunlukSaat) * Number(planParametreleri.vardiyaSayisi || 1);
                    if (k.motorlar && k.motorlar.length > 0) {
                        k.motorlar.forEach(m => {
                            const kwh = Number(m.gucu) * (Number(m.yukKatsayisi) / 100);
                            makineElektrikGideri += kwh * aylikSaat * Number(planParametreleri.elektrikKwFiyat);
                        });
                    } else {
                        // geriye dönük uyumluluk
                        const kwh = Number(k.motorGucu) * (Number(k.elektrikYuku || 70) / 100);
                        makineElektrikGideri += kwh * aylikSaat * Number(planParametreleri.elektrikKwFiyat);
                    }
                }
            });

            setYeniPlanGelirler(prev => ({ ...prev, "109": toplamSatisGeliri }));
            
            setYeniPlanGiderler(prev => {
                const guncel = { ...prev };
                
                if (girenTon > 0) {
                    guncel["305"] = malAlisGideri;
                    guncel["301"] = alisNakliyeGideri;
                    guncel["302"] = satisNakliyeGideri;
                }
                if (toplamDisHizmetGideri > 0 || uretimRecetesi.ayristirmaVar) {
                    guncel["609"] = toplamDisHizmetGideri; 
                }
                if (toplamKiralamaGideri > 0) {
                    guncel["610"] = toplamKiralamaGideri;
                }
                if(personelListesi.length > 0) {
                    guncel["450"] = toplamMaas;
                    guncel["455"] = toplamSgk;
                    guncel["480"] = toplamYemek;
                }
                if (kurulumKalemleri.some(k => k.isMakine)) {
                    guncel["405"] = makineElektrikGideri;
                }
                
                return guncel;
            });
        }
    }, [personelListesi, asgariNet, asgariSgk, planParametreleri, uretimRecetesi, kurulumKalemleri, disHizmetlerListesi, kiralamaListesi, aktifSayfa]);

    const parametreDegisti = (alan, deger) => { setPlanParametreleri({ ...planParametreleri, [alan]: deger }); };

    const altUrunEkle = () => {
        const yeniId = Date.now();
        setUretimRecetesi({ ...uretimRecetesi, altUrunler: [...uretimRecetesi.altUrunler, { id: yeniId, ad: 'Yeni Alt Ürün', oran: 0, fiyat: 0, uretimeGirer: false }] });
    };
    const altUrunSil = (id) => { setUretimRecetesi({ ...uretimRecetesi, altUrunler: uretimRecetesi.altUrunler.filter(u => u.id !== id) }); };
    const altUrunGuncelle = (id, alan, deger) => { setUretimRecetesi({ ...uretimRecetesi, altUrunler: uretimRecetesi.altUrunler.map(u => u.id === id ? { ...u, [alan]: deger } : u) }); };

    const personelEkle = () => {
        if (!yeniPersonel.unvan || yeniPersonel.kisiSayisi < 1) return;
        setPersonelListesi([...personelListesi, { ...yeniPersonel, id: Date.now() }]);
        setYeniPersonel({ unvan: '', kisiSayisi: 1, ekMaas: 0, ekSgk: 0, ekYemek: 0, isAyiklama: false }); 
    };
    const personelSil = (id) => { setPersonelListesi(personelListesi.filter(p => p.id !== id)); };
    const personelDuzenle = (p) => {
        setYeniPersonel({ unvan: p.unvan, kisiSayisi: p.kisiSayisi, ekMaas: p.ekMaas, ekSgk: p.ekSgk, ekYemek: p.ekYemek, isAyiklama: p.isAyiklama });
        setPersonelListesi(personelListesi.filter(item => item.id !== p.id));
    };

    const disHizmetEkle = () => {
        if (!yeniDisHizmet.ad || !yeniDisHizmet.tutar) return;
        setDisHizmetlerListesi([...disHizmetlerListesi, { id: Date.now(), ad: yeniDisHizmet.ad, tutar: Number(yeniDisHizmet.tutar) }]);
        setYeniDisHizmet({ ad: '', tutar: '' });
    };
    const disHizmetSil = (id) => { setDisHizmetlerListesi(disHizmetlerListesi.filter(h => h.id !== id)); };
    const disHizmetDuzenle = (h) => {
        setYeniDisHizmet({ ad: h.ad, tutar: h.tutar });
        setDisHizmetlerListesi(disHizmetlerListesi.filter(item => item.id !== h.id));
    };

    const kiralamaEkle = () => {
        if (!yeniKiralama.ad || !yeniKiralama.tutar) return;
        setKiralamaListesi([...kiralamaListesi, { id: Date.now(), ad: yeniKiralama.ad, tutar: Number(yeniKiralama.tutar) }]);
        setYeniKiralama({ ad: '', tutar: '' });
    };
    const kiralamaSil = (id) => { setKiralamaListesi(kiralamaListesi.filter(h => h.id !== id)); };
    const kiralamaDuzenle = (h) => {
        setYeniKiralama({ ad: h.ad, tutar: h.tutar });
        setKiralamaListesi(kiralamaListesi.filter(item => item.id !== h.id));
    };

    const motorToplamGucu = (motorlar) => motorlar.reduce((t, m) => t + (Number(m.gucu) || 0), 0);

    const motorEkle = () => {
        if (!yeniMotor.ad || !yeniMotor.gucu) return;
        setYeniKurulum(prev => ({
            ...prev,
            motorlar: [...prev.motorlar, { id: Date.now(), ad: yeniMotor.ad, gucu: Number(yeniMotor.gucu), yukKatsayisi: Number(yeniMotor.yukKatsayisi) }]
        }));
        setYeniMotor({ ad: '', gucu: '', yukKatsayisi: 70 });
    };

    const motorSil = (motorId) => {
        setYeniKurulum(prev => ({ ...prev, motorlar: prev.motorlar.filter(m => m.id !== motorId) }));
    };

    const kurulumEkle = () => {
        if(!yeniKurulum.ad || !yeniKurulum.tutar) return;
        setKurulumKalemleri([...kurulumKalemleri, {
            id: Date.now(),
            ad: yeniKurulum.ad,
            tutar: Number(yeniKurulum.tutar),
            isMakine: yeniKurulum.isMakine,
            motorlar: yeniKurulum.motorlar,
            motorGucu: motorToplamGucu(yeniKurulum.motorlar),
            kapasite: Number(yeniKurulum.kapasite),
            verimlilik: Number(yeniKurulum.verimlilik)
        }]);
        setYeniKurulum({ ad: '', tutar: '', isMakine: false, kapasite: '', verimlilik: 80, motorlar: [] });
        setYeniMotor({ ad: '', gucu: '', yukKatsayisi: 70 });
    };
    
    const kurulumSil = (id) => { setKurulumKalemleri(kurulumKalemleri.filter(k => k.id !== id)); };

    const kurulumDuzenle = (k) => {
        setYeniKurulum({
            ad: k.ad,
            tutar: k.tutar,
            isMakine: k.isMakine || false,
            kapasite: k.kapasite || '',
            verimlilik: k.verimlilik || 80,
            motorlar: k.motorlar || []
        });
        setKurulumKalemleri(kurulumKalemleri.filter(item => item.id !== k.id));
    };

    const suruklemeBasladi = (e, planId) => e.dataTransfer.setData("planId", planId);
    const suruklemeUzerinde = (e) => e.preventDefault();
    const fabrikayaBrakildi = async (e) => {
        e.preventDefault();
        const planId = e.dataTransfer.getData("planId");
        const tasinanPlan = bekleyenPlanlar.find(p => p.id === planId);
        if (!tasinanPlan) return;
        
        try {
            const updated = await window.DataService.savePlan({ ...tasinanPlan, status: 'active' });
            setBekleyenPlanlar(bekleyenPlanlar.filter(p => p.id !== planId));
            setAktifPlanlar([...aktifPlanlar, { ...updated.content, id: updated.id, status: updated.status }]);
        } catch (err) { alert(window.getErrorMessage(err)); }
    };

    const kartiCikar = async (planId) => {
        const cikarilanPlan = aktifPlanlar.find(p => p.id === planId);
        if (!cikarilanPlan) return;
        
        try {
            const updated = await window.DataService.savePlan({ ...cikarilanPlan, status: 'pending' });
            setAktifPlanlar(aktifPlanlar.filter(p => p.id !== planId));
            setBekleyenPlanlar([...bekleyenPlanlar, { ...updated.content, id: updated.id, status: updated.status }]);
        } catch (err) { alert(window.getErrorMessage(err)); }
    };

    const yeniIpkBaslat = () => {
        setDuzenlenenPlanId(null);
        setSihirbazAdim(0);
        setSihirbazAcik(true);
        // Reset wizard data if needed
        setSihirbazVeri({
            baslik: '', aciklama: '', model: { alSat: false, uretim: false, komisyon: false },
            atıkCinsi: '', hedefUrun: '', alSatUrun: '', komisyonIsi: '',
            ayristirmaVar: true, aylikTon: '', symFire: '', nemFire: '', uretimFiresi: '',
            elektrikKwFiyat: '4.07', kiraTesis: '', kiraDiger: '',
            personelSayisi: '', ayiklamaHizi: '1', makineKapasite: '',
            alisFiyatiKg: '', alisNakliyeKg: '', satisFiyatiKg: '', satisNakliyeKg: '',
            bakimOnarimYuzde: '2', genelYonetimYuzde: '5'
        });
    };

    const klasikIpkBaslat = () => {
        setYeniPlanBaslik("");
        setPlanParametreleri({ aylikTon: 0, alisFiyati: 0, satisFiyati: 0, aylikGun: 26, gunlukSaat: 10, elektrikKwFiyat: 4.07, gunlukYemekUcreti: 200, alisNakliye: 0, satisNakliye: 0, ayiklamaHizi: 1 });
        setUretimRecetesi({ ayristirmaVar: false, copOrani: 5, copBertarafFiyati: 0, uretimFiresi: 3, altUrunler: [] });
        setYeniPlanGiderler({});
        setYeniPlanGelirler({});
        setPersonelListesi([]);
        setDisHizmetlerListesi([]); 
        setKiralamaListesi([]);
        setKurulumKalemleri([]);
        setPlanSekmesi('operasyon');
        setAktifSayfa('planEkle');
        setSihirbazAcik(false);
    };
    const IpkDuzenle = (p) => {
        setDuzenlenenPlanId(p.id);
        setYeniPlanBaslik(p.baslik);
        setPlanParametreleri(p.parametreler);
        setUretimRecetesi(p.uretimRecetesi);
        setPersonelListesi(p.personelListesi);
        setDisHizmetlerListesi(p.disHizmetlerListesi || []); 
        setKiralamaListesi(p.kiralamaListesi || []);
        setKurulumKalemleri(p.kurulumKalemleri || []);
        setAmortismanSuresi(p.amortismanSuresi || 36);
        setYeniPlanGiderler(p.giderler || {});
        setYeniPlanGelirler(p.gelirler || {});
        setPlanSekmesi('operasyon');
        setAktifSayfa('planEkle');
    };

    const IpkSil = async (id) => {
        if(window.confirm("Bu İPK tamamen silinecek. Emin misiniz?")) {
            try {
                await window.DataService.deleteData('business_plans', id);
                setBekleyenPlanlar(bekleyenPlanlar.filter(x => x.id !== id));
                setAktifPlanlar(aktifPlanlar.filter(x => x.id !== id));
            } catch (err) { alert(window.getErrorMessage(err)); }
        }
    };

    const sablonIndir = () => {
        if (!window.XLSX) { alert("Excel kütüphanesi yüklenemedi!"); return; }
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Operasyonel Parametreler
        const paramData = [
            ["Parametre", "Değer", "Açıklama"],
            ["aylikTon", 100, "Aylık giren malzeme miktarı (Ton)"],
            ["alisFiyati", 5000, "Mal alış fiyatı (₺/Ton)"],
            ["satisFiyati", 15000, "Mal satış fiyatı (₺/Ton)"],
            ["aylikGun", 26, "Aylık çalışma gün sayısı"],
            ["gunlukSaat", 10, "Günlük çalışma saati"],
            ["vardiyaSayisi", 1, "Vardiya sayısı (1-3)"],
            ["ayiklamaHizi", 1, "Personel ayıklama hızı (Ton/Saat)"],
            ["alisNakliye", 500, "Alış nakliye (₺/Ton)"],
            ["satisNakliye", 500, "Satış nakliye (₺/Ton)"],
            ["elektrikKwFiyat", 4.07, "Elektrik birim fiyatı (₺/kWh)"],
            ["gunlukYemekUcreti", 200, "Günlük yemek ücreti (₺)"]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paramData), "Parametreler");

        // Sheet 2: Gider Kalemleri (Dinamik)
        const giderHeaders = [["KOD", "KALEM ADI", "AYLIK TUTAR (₺)"]];
        const giderRows = window.SABLON_GIDERLER.map(g => [g.kodu, g.adi, 0]);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...giderHeaders, ...giderRows]), "Giderler");

        // Sheet 3: Personel Listesi
        const personelData = [
            ["UNVAN", "KISI SAYISI", "AYIKLAMA YAPAR MI? (Evet/Hayır)", "EK MAAS (₺)", "EK SGK (₺)", "EK YEMEK (₺)"],
            ["Vasıfsız İşçi", 2, "Evet", 0, 0, 0],
            ["Usta Basi", 1, "Hayır", 5000, 1000, 500]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(personelData), "Personel");

        XLSX.writeFile(wb, "Enba_Hizli_Planlama_Sablonu.xlsx");
    };

    const excelIceAktar = (e) => {
        if (!window.XLSX) { alert("Excel kütüphanesi yüklenemedi!"); return; }
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const wb = XLSX.read(data, { type: 'binary' });
                
                // Read Parameters
                const paramSheet = wb.Sheets["Parametreler"];
                if (paramSheet) {
                    const params = XLSX.utils.sheet_to_json(paramSheet);
                    setPlanParametreleri(prev => {
                        const next = { ...prev };
                        params.forEach(p => {
                            if (p.Parametre && p.Değer !== undefined) next[p.Parametre] = Number(p.Değer);
                        });
                        return next;
                    });
                }

                // Read Giderler
                const giderSheet = wb.Sheets["Giderler"];
                if (giderSheet) {
                    const giderler = XLSX.utils.sheet_to_json(giderSheet);
                    const newGiderler = {};
                    giderler.forEach(g => {
                        const tutar = Number(g["AYLIK TUTAR (₺)"]);
                        if (g.KOD && !isNaN(tutar) && tutar > 0) {
                            newGiderler[String(g.KOD)] = tutar;
                        }
                    });
                    setYeniPlanGiderler(newGiderler);
                }

                // Read Personel
                const personelSheet = wb.Sheets["Personel"];
                if (personelSheet) {
                    const personelRaw = XLSX.utils.sheet_to_json(personelSheet);
                    const newList = personelRaw.map((p, idx) => ({
                        id: Date.now() + idx,
                        unvan: p.UNVAN || "Belirtilmedi",
                        kisiSayisi: Number(p["KISI SAYISI"]) || 1,
                        isAyiklama: String(p["AYIKLAMA YAPAR MI? (Evet/Hayır)"]).toLowerCase() === 'evet',
                        ekMaas: Number(p["EK MAAS (₺)"]) || 0,
                        ekSgk: Number(p["EK SGK (₺)"]) || 0,
                        ekYemek: Number(p["EK YEMEK (₺)"]) || 0
                    }));
                    setPersonelListesi(newList);
                }
                
                alert("Excel verileri başarıyla yüklendi!");
            } catch (err) { alert("Excel okuma hatası: " + err.message); }
        };
        reader.readAsBinaryString(file);
        e.target.value = ""; 
    };

    const sonuc = window.EnbaFinance.anasayfaHesapla(aktifPlanlar);

    const planKaydet = async () => {
        if(!yeniPlanBaslik) { alert("Lütfen İPK'ya bir isim verin!"); return; }
        
        let toplamOran = Number(uretimRecetesi.copOrani);
        uretimRecetesi.altUrunler.forEach(u => toplamOran += Number(u.oran));
        if(uretimRecetesi.ayristirmaVar && toplamOran > 100) {
            alert("Hata: Çöp ve Alt Ürünlerin % oranları toplamı 100'ü geçemez!"); return;
        }

        let planToplamGelir = Object.values(yeniPlanGelirler).reduce((a, b) => a + (Number(b) || 0), 0);
        let planToplamOpex = Object.values(yeniPlanGiderler).reduce((a, b) => a + (Number(b) || 0), 0);
        
        let toplamKurulumCaliyeti = kurulumKalemleri.reduce((a, b) => a + b.tutar, 0);
        let aylikAmortisman = toplamKurulumCaliyeti > 0 ? (toplamKurulumCaliyeti / amortismanSuresi) : 0;
        
        let ebitda = planToplamGelir - planToplamOpex;
        let netKar = ebitda - aylikAmortisman;

        const planData = {
            id: duzenlenenPlanId, // Update ise dolu, yeni ise null
            baslik: yeniPlanBaslik,
            parametreler: { ...planParametreleri },
            uretimRecetesi: { ...uretimRecetesi },
            kutleDengesi: { ...kutleDengesiOzet },
            personelListesi: [...personelListesi],
            disHizmetlerListesi: [...disHizmetlerListesi],
            kiralamaListesi: [...kiralamaListesi],
            satisDetaylari: [...satisDetaylari], 
            kurulumKalemleri: [...kurulumKalemleri],
            amortismanSuresi: amortismanSuresi,
            aylikAmortisman: aylikAmortisman,
            gelirler: { ...yeniPlanGelirler },
            giderler: { ...yeniPlanGiderler },
            ozetGelir: planToplamGelir,
            ozetOpex: planToplamOpex,
            ebitda: ebitda,
            netKar: netKar,
            plan_type: 'fast',
            status: duzenlenenPlanId ? (aktifPlanlar.some(p => p.id === duzenlenenPlanId) ? 'active' : 'pending') : 'pending'
        };
        
        try {
            const savedPlan = await window.DataService.savePlan(planData);
            
            if (!savedPlan) {
                alert("Hata: Kayıt işlemi başarısız oldu.");
                return;
            }

            if (duzenlenenPlanId) {
                if (savedPlan.status === 'active') {
                    setAktifPlanlar(aktifPlanlar.map(p => p.id === duzenlenenPlanId ? savedPlan : p));
                } else {
                    setBekleyenPlanlar(bekleyenPlanlar.map(p => p.id === duzenlenenPlanId ? savedPlan : p));
                }
            } else {
                setBekleyenPlanlar([...bekleyenPlanlar, savedPlan]);
            }
            setAktifSayfa('anaSayfa');
        } catch (err) { alert(window.getErrorMessage(err)); }
    };

    const finalizeWizard = () => {
        const v = sihirbazVeri;
        setYeniPlanBaslik(v.baslik);
        
        // Birim dönüşümleri (kg -> Ton)
        const alisFiyati = (Number(v.alisFiyatiKg) || 0) * 1000;
        const alisNakliye = (Number(v.alisNakliyeKg) || 0) * 1000;
        const satisFiyati = (Number(v.satisFiyatiKg) || 0) * 1000;
        const satisNakliye = (Number(v.satisNakliyeKg) || 0) * 1000;

        setPlanParametreleri({
            ...planParametreleri,
            aylikTon: Number(v.aylikTon) || 0,
            alisFiyati,
            alisNakliye,
            satisFiyati,
            satisNakliye,
            elektrikKwFiyat: Number(v.elektrikKwFiyat) || 4.07,
            ayiklamaHizi: Number(v.ayiklamaHizi) || 1
        });

        const topFire = (Number(v.symFire) || 0) + (Number(v.nemFire) || 0);
        setUretimRecetesi({
            ...uretimRecetesi,
            ayristirmaVar: v.ayristirmaVar,
            copOrani: topFire,
            uretimFiresi: Number(v.uretimFiresi) || 0
        });

        // Kira kalemleri
        const kiralar = [];
        if (v.kiraTesis) kiralar.push({ id: Date.now() + 1, ad: 'Tesis Kirası', tutar: Number(v.kiraTesis) });
        if (v.kiraDiger) kiralar.push({ id: Date.now() + 2, ad: 'Diğer Kiralamalar', tutar: Number(v.kiraDiger) });
        setKiralamaListesi(kiralar);

        // Personel
        if (v.personelSayisi) {
            setPersonelListesi([{
                id: Date.now() + 3,
                unvan: 'Tesis Personeli (Sihirbaz)',
                kisiSayisi: Number(v.personelSayisi),
                ekMaas: 0, ekSgk: 0, ekYemek: 0,
                isAyiklama: v.ayristirmaVar
            }]);
        }

        // Ek Giderler (Bakım & Genel Yönetim)
        const disHizmetler = [];
        const alisMaliyeti = (Number(v.aylikTon) || 0) * alisFiyati;
        
        if (v.bakimOnarimYuzde) {
            const tutar = (alisMaliyeti * Number(v.bakimOnarimYuzde) / 100);
            disHizmetler.push({ id: Date.now() + 5, ad: `Bakım-Onarım Fonu (%${v.bakimOnarimYuzde})`, tutar });
        }
        if (v.genelYonetimYuzde) {
            const tutar = (alisMaliyeti * Number(v.genelYonetimYuzde) / 100);
            disHizmetler.push({ id: Date.now() + 6, ad: `Genel Yönetim Gideri (%${v.genelYonetimYuzde})`, tutar });
        }
        setDisHizmetlerListesi(disHizmetler);

        setSihirbazAcik(false);
        setAktifSayfa('planEkle');
    };

    const verileriSifirla = () => {
        if(window.confirm("Tüm planlar ve hesaplamalar silinecek. Emin misiniz?")) {
            localStorage.clear();
            setAktifPlanlar([]);
            setBekleyenPlanlar([]);
        }
    };

    const renderSihirbaz = () => {
        if (!sihirbazAcik) return null;

        const next = () => setSihirbazAdim(sihirbazAdim + 1);
        const prev = () => setSihirbazAdim(sihirbazAdim - 1);
        const update = (field, val) => setSihirbazVeri({ ...sihirbazVeri, [field]: val });

        // Hesaplamalar
        const v = sihirbazVeri;
        const symFireKg = (Number(v.aylikTon) || 0) * 1000 * (Number(v.symFire) / 100 || 0);
        const nemFireKg = (Number(v.aylikTon) || 0) * 1000 * (Number(v.nemFire) / 100 || 0);
        const uretimFireKg = (Number(v.aylikTon) || 0) * 1000 * (Number(v.uretimFiresi) / 100 || 0);
        const totalLossKg = symFireKg + nemFireKg + uretimFireKg;
        const lossTl = totalLossKg * (Number(v.alisFiyatiKg) || 0);
        
        const netProductKg = ((Number(v.aylikTon) || 0) * 1000) - totalLossKg;
        const realUnitCost = netProductKg > 0 ? ((Number(v.aylikTon) || 0) * 1000 * (Number(v.alisFiyatiKg) || 0)) / netProductKg : 0;

        const capacityMonthly = (Number(v.personelSayisi) || 0) * (Number(v.ayiklamaHizi) || 1) * 26 * 8; // Basit hesap
        const isCapacityOk = capacityMonthly >= (Number(v.aylikTon) || 0);

        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                <div style={{ backgroundColor: '#fff', width: '90%', maxWidth: '700px', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
                    
                    {/* Progress Bar */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '30px' }}>
                        {[0,1,2,3,4,5,6].map(i => (
                            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: i <= sihirbazAdim ? 'var(--enba-orange)' : '#eee' }}></div>
                        ))}
                    </div>

                    {sihirbazAdim === 0 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚀</div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--enba-dark)' }}>Yeni Bir İş Planı Başlatalım</h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>İşinizi adım adım, akıllı maliyet öngörüleriyle birlikte planlamak ister misiniz?</p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button className="btn btn-warning" style={{ padding: '15px 30px', fontSize: '16px', borderRadius: '12px' }} onClick={next}>✨ Adım Adım Başla</button>
                                <button className="btn btn-outline" style={{ padding: '15px 30px', fontSize: '16px', borderRadius: '12px', border: '1px solid #ddd' }} onClick={klasikIpkBaslat}>Hızlı Boş Form</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 1 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>1. İşinize Bir İsim Verin</h3>
                            <div className="form-group">
                                <label>PLAN BAŞLIĞI</label>
                                <input type="text" placeholder="Örn: 2026 LDPE Geri Dönüşüm Projesi" value={v.baslik} onChange={e => update('baslik', e.target.value)} onFocus={window.selectOnFocus} />
                            </div>
                            <div className="form-group">
                                <label>KISA AÇIKLAMA</label>
                                <textarea placeholder="Bu plan neyi hedefliyor?" value={v.aciklama} onChange={e => update('aciklama', e.target.value)} style={{ width: '100%', height: '80px', borderRadius: '10px', padding: '10px', border: '1px solid #ddd' }} onFocus={window.selectOnFocus}></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" disabled={!v.baslik} onClick={next}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 2 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>2. İş Modelinizi Seçin</h3>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Bu projenin gelir kaynakları neler olacak? (Birden fazla seçebilirsiniz)</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', border: '1px solid #eee', borderRadius: '15px', cursor: 'pointer', backgroundColor: v.model.uretim ? 'rgba(227,82,5,0.05)' : '#fff' }}>
                                    <input type="checkbox" checked={v.model.uretim} onChange={e => update('model', { ...v.model, uretim: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <div>
                                        <div style={{ fontWeight: 800 }}>⚙️ Üretim & Geri Dönüşüm</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>Atığı hammaddeye veya ürüne dönüştürme</div>
                                    </div>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', border: '1px solid #eee', borderRadius: '15px', cursor: 'pointer', backgroundColor: v.model.alSat ? 'rgba(227,82,5,0.05)' : '#fff' }}>
                                    <input type="checkbox" checked={v.model.alSat} onChange={e => update('model', { ...v.model, alSat: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <div>
                                        <div style={{ fontWeight: 800 }}>📦 Al-Sat (Ticaret)</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>Hammadde veya ürün ticareti</div>
                                    </div>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', border: '1px solid #eee', borderRadius: '15px', cursor: 'pointer', backgroundColor: v.model.komisyon ? 'rgba(227,82,5,0.05)' : '#fff' }}>
                                    <input type="checkbox" checked={v.model.komisyon} onChange={e => update('model', { ...v.model, komisyon: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <div>
                                        <div style={{ fontWeight: 800 }}>💰 Komisyon</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>İş bağlama veya aracılık hizmetleri</div>
                                    </div>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" disabled={!(v.model.uretim || v.model.alSat || v.model.komisyon)} onClick={next}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 3 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>3. İş Detayları</h3>
                            
                            {v.model.uretim && (
                                <div style={{ marginBottom: '25px', padding: '15px', background: '#fcfcfc', borderRadius: '10px' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--enba-orange)', marginBottom: '10px' }}>ÜRETİM ROTASI</div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Girdi atık (Örn: Buruşuk Naylon)" value={v.atıkCinsi} onChange={e => update('atıkCinsi', e.target.value)} onFocus={window.selectOnFocus} />
                                        <span>➔</span>
                                        <input type="text" placeholder="Çıktı ürün (Örn: LDPE Granül)" value={v.hedefUrun} onChange={e => update('hedefUrun', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                    <div style={{ marginTop: '15px', padding: '15px', background: '#f0f0f0', borderRadius: '10px', border: '1px solid #ddd' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={v.ayristirmaVar} onChange={e => update('ayristirmaVar', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                            <span style={{ fontWeight: 700 }}>Ürün ayrıştırmaya (sorting/manuel ayıklama) girecek mi?</span>
                                        </label>
                                        {!v.ayristirmaVar && <p style={{ fontSize: '11px', color: '#888', margin: '5px 0 0 28px' }}>Plandan ayrıştırma/manuel işçilik maliyetleri ve hız hesaplamaları çıkarılacaktır.</p>}
                                    </div>
                                </div>
                            )}

                            {v.model.alSat && (
                                <div className="form-group">
                                    <label>TİCARETİ YAPILACAK ÜRÜN</label>
                                    <input type="text" placeholder="Örn: ABS Levha Çapağı" value={v.alSatUrun} onChange={e => update('alSatUrun', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                            )}

                            {v.model.komisyon && (
                                <div className="form-group">
                                    <label>KOMİSYON ALINACAK İŞ TANIMI</label>
                                    <input type="text" placeholder="Örn: Hurda Satış Aracılığı" value={v.komisyonIsi} onChange={e => update('komisyonIsi', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" onClick={next}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 4 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>4. Operasyonel Veriler</h3>
                            
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>AYLIK GİRECEK MALZEME (TON/AY)</label>
                                    <input type="number" value={v.aylikTon} onChange={e => update('aylikTon', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                                
                                {v.ayristirmaVar && (
                                    <div className="form-group">
                                        <label>AYRIŞTIRMA HIZI (TON/SAAT/KİŞİ)</label>
                                        <input type="number" value={v.ayiklamaHizi} onChange={e => update('ayiklamaHizi', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                )}

                                <div className="form-group" style={{ gridColumn: 'span 2', padding: '15px', border: '1px solid #FFEBE0', borderRadius: '15px', background: '#FFF7F2' }}>
                                    <label style={{ color: 'var(--enba-orange)', fontWeight: 800 }}>FİRE ORANLARI (%)</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        {v.ayristirmaVar && (
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '10px' }}>YABANCI MADDE</label>
                                                <input type="number" placeholder="%" value={v.symFire} onChange={e => update('symFire', e.target.value)} onFocus={window.selectOnFocus} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '10px' }}>NEM FİRESİ</label>
                                            <input type="number" placeholder="%" value={v.nemFire} onChange={e => update('nemFire', e.target.value)} onFocus={window.selectOnFocus} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '10px' }}>ÜRETİM FİRESİ</label>
                                            <input type="number" placeholder="%" value={v.uretimFiresi} onChange={e => update('uretimFiresi', e.target.value)} onFocus={window.selectOnFocus} />
                                        </div>
                                    </div>
                                    
                                    {totalLossKg > 0 && (
                                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed var(--enba-orange)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                <span>Toplam Fire Kaybı:</span>
                                                <strong style={{ color: '#e74c3c' }}>{window.fmt(totalLossKg)} kg</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                                                <span>Kaybedilen Değer:</span>
                                                <strong style={{ color: '#e74c3c' }}>{window.fmt(lossTl)} ₺</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>SİSTEME PERSONEL SAYISI (ADET)</label>
                                    <input type="number" value={v.personelSayisi} onChange={e => update('personelSayisi', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>

                                <div className="form-group">
                                    <label>MAKİNE SAATLİK KAPASİTE (TON/H)</label>
                                    <input type="number" value={v.makineKapasite} onChange={e => update('makineKapasite', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" onClick={next}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 5 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>5. Giderler ve Operetif Parametreler</h3>
                            
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>TESİS KİRASI (AYLIK ₺)</label>
                                    <input type="number" value={v.kiraTesis} onChange={e => update('kiraTesis', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                                <div className="form-group">
                                    <label>DİĞER KİRALAMALAR (₺)</label>
                                    <input type="number" placeholder="Forklift, araç vb." value={v.kiraDiger} onChange={e => update('kiraDiger', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>
                                <div className="form-group">
                                    <label>ELEKTRİK BİRİM (₺/kWh)</label>
                                    <input type="number" value={v.elektrikKwFiyat} onChange={e => update('elektrikKwFiyat', e.target.value)} onFocus={window.selectOnFocus} />
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#fcfcfc', padding: '15px', borderRadius: '15px', border: '1px solid #eee' }}>
                                    <div className="form-group">
                                        <label>BAKIM-ONARIM PAYI (%)</label>
                                        <input type="number" value={v.bakimOnarimYuzde} onChange={e => update('bakimOnarimYuzde', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                    <div className="form-group">
                                        <label>GENEL YÖNETİM GİDERİ (%)</label>
                                        <input type="number" value={v.genelYonetimYuzde} onChange={e => update('genelYonetimYuzde', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                    <p style={{ gridColumn: 'span 2', fontSize: '11px', color: '#999', margin: 0 }}>* Bu oranlar ciro üzerinden tahmini gider olarak planda varsayılan olarak yer alacaktır.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" onClick={next}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 6 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>6. Alış ve Satış Parametreleri</h3>
                            <p style={{ fontSize: '12px', color: '#7F8C8D', marginBottom: '20px' }}>Lütfen verileri sahada kullanılan <b>TL/kg</b> biriminden giriniz.</p>
                            
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: '#F4F9F1', padding: '20px', borderRadius: '15px', border: '1px solid #D5E8D4' }}>
                                    <div style={{ fontWeight: 800, color: '#1a7f4b', marginBottom: '15px', borderBottom: '1px solid #D5E8D4', paddingBottom: '10px' }}>📥 ALIŞ (KG BAZLI)</div>
                                    <div className="form-group">
                                        <label>HAMMADDE ALIŞ (₺/kg)</label>
                                        <input type="number" value={v.alisFiyatiKg} onChange={e => update('alisFiyatiKg', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>ALIŞ NAKLİYESİ (₺/kg)</label>
                                        <input type="number" value={v.alisNakliyeKg} onChange={e => update('alisNakliyeKg', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                </div>

                                <div style={{ background: '#FFF7EF', padding: '20px', borderRadius: '15px', border: '1px solid #FFEBE0' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--enba-orange)', marginBottom: '15px', borderBottom: '1px solid #FFEBE0', paddingBottom: '10px' }}>📤 SATIŞ (KG BAZLI)</div>
                                    <div className="form-group">
                                        <label>MAMUL SATIŞ (₺/kg)</label>
                                        <input type="number" value={v.satisFiyatiKg} onChange={e => update('satisFiyatiKg', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>SATIŞ NAKLİYESİ (₺/kg)</label>
                                        <input type="number" value={v.satisNakliyeKg} onChange={e => update('satisNakliyeKg', e.target.value)} onFocus={window.selectOnFocus} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '20px', background: '#F8F9FA', borderRadius: '15px', border: '1px solid #eee' }}>
                                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Görünür Alış:</span><strong>{v.alisFiyatiKg} ₺/kg</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                                    <span>Fire Sonrası <b>Gerçek Maliyet</b>:</span>
                                    <strong style={{ fontSize: '18px' }}>{window.fmt(realUnitCost)} ₺/kg</strong>
                                </div>
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '10px', fontStyle: 'italic' }}>* Fireler nedeniyle kaybettiğiniz miktar, kalan ürünün birim maliyetini bu seviyeye çıkarmaktadır.</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Geri</button>
                                <button className="btn btn-warning" style={{ background: 'var(--enba-dark)', color: '#fff' }} onClick={next}>Son Özeti Gör</button>
                            </div>
                        </div>
                    )}

                    {sihirbazAdim === 7 && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>🏁 Plan Özeti ve Kapasite Kontrolü</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ padding: '20px', background: isCapacityOk ? '#F1F9F1' : '#FFF1F1', borderRadius: '15px', textAlign: 'center', border: `1px solid ${isCapacityOk ? '#D5E8D4' : '#FADBD8'}` }}>
                                    <div style={{ fontSize: '12px', color: '#666' }}>PERSONEL KAPASİTESİ</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: isCapacityOk ? '#1a7f4b' : '#c0392b' }}>
                                        {isCapacityOk ? '✓ Yeterli' : '⚠ Yetersiz'}
                                    </div>
                                    <div style={{ fontSize: '11px', marginTop: '5px' }}>Talep: {v.aylikTon} T | Mevcut: {window.fmt(capacityMonthly)} T</div>
                                </div>
                                
                                <div style={{ padding: '20px', background: '#F8F9FA', borderRadius: '15px', textAlign: 'center', border: '1px solid #eee' }}>
                                    <div style={{ fontSize: '12px', color: '#666' }}>TAHMİNİ NET KÂR MARJI</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--enba-orange)' }}>
                                        %{window.fmt(( (Number(v.satisFiyatiKg) - realUnitCost - (Number(v.alisNakliyeKg) || 0) - (Number(v.satisNakliyeKg) || 0)) / (Number(v.satisFiyatiKg) || 1) ) * 100)}
                                    </div>
                                    <div style={{ fontSize: '11px', marginTop: '5px' }}>(Brüt Operasyonel Marj)</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #eee', borderRadius: '15px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Öne Çıkan Notlar:</h4>
                                <ul style={{ fontSize: '13px', color: '#666', paddingLeft: '20px' }}>
                                    <li>Fire nedeniyle toplam <b>{window.fmt(lossTl)} ₺</b> kayıp yaşanıyor.</li>
                                    <li>Ton başına alış maliyetiniz: <b>{window.fmt(realUnitCost * 1000)} ₺</b></li>
                                    <li>Operasyonel ton maliyetine %{v.bakimOnarimYuzde} bakım ve %{v.genelYonetimYuzde} G.Y.G eklendi.</li>
                                </ul>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                                <button className="btn btn-outline" onClick={prev}>Düzenle</button>
                                <button className="btn btn-warning" style={{ padding: '15px 40px', fontSize: '16px' }} onClick={finalizeWizard}>VERİLERİ TABLOYA AKTAR VE BİTİR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    const DashboardMatrix = window.DashboardMatrix;

    if (aktifSayfa === 'anaSayfa') {
        return (
            <div className="container">
                {renderSihirbaz()}
                <div className={`sidebar-overlay${mobileSidebarAcik ? ' visible' : ''}`} onClick={() => setMobileSidebarAcik(false)} />

                <Sidebar 
                    sidebarAcik={sidebarAcik} setSidebarAcik={setSidebarAcik}
                    mobileSidebarAcik={mobileSidebarAcik} setMobileSidebarAcik={setMobileSidebarAcik}
                    bekleyenPlanlar={bekleyenPlanlar} setBekleyenPlanlar={setBekleyenPlanlar}
                    aktifPlanlar={aktifPlanlar} setAktifPlanlar={setAktifPlanlar}
                    yeniIpkBaslat={yeniIpkBaslat}
                    excelIceAktar={excelIceAktar}
                    sablonIndir={sablonIndir}
                    suruklemeBasladi={suruklemeBasladi}
                    IpkDuzenle={IpkDuzenle}
                    IpkSil={IpkSil}
                    verileriSifirla={verileriSifirla}
                />

                <div className="factory" onDragOver={suruklemeUzerinde} onDrop={fabrikayaBrakildi}>
                    <div className="factory-header"><span className="enba">enba</span><span className="recycling">recycling</span></div>
                    <div className="factory-subheader">KÖMÜRCÜLER TESİSİ - KAPASİTE VE FİNANS SİMÜLASYONU</div>
                    
                    <DashboardMatrix 
                        aktifPlanlar={aktifPlanlar}
                        sonuc={sonuc}
                        grupGosterim={grupGosterim}
                        setGrupGosterim={setGrupGosterim}
                    />

                    <h4 style={{color: 'var(--enba-dark)', margin: '15px 0 10px 0', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px'}}>Tesisteki Aktif İPK'lar:</h4>
                    <div className="active-cards">
                        {aktifPlanlar
                            .filter(p => !p.plan_type || p.plan_type === 'fast')
                            .map(plan => (
                            <div key={plan.id} className="active-card" onClick={() => IpkDuzenle(plan)} style={{cursor: 'pointer'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <span style={{fontWeight: 'bold', color: 'var(--enba-dark)', textTransform: 'uppercase', fontSize: '14px'}}>{plan.baslik}</span>
                                    <span style={{fontSize: '14px'}}>✏️</span>
                                </div>
                                <div style={{fontSize: '11px', color: '#7F8C8D', marginBottom: '5px'}}>Giriş: {window.fmt(plan.parametreler?.aylikTon)} T | Çıkış: {window.fmt(plan.kutleDengesi?.toplamSatisTon)} T</div>
                                
                                <div style={{fontSize:'12px', color:'#34495E', borderTop:'1px dashed var(--border-grey)', paddingTop:'8px', paddingBottom:'8px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span>Gelir:</span> <span style={{color:'var(--enba-orange-dark)', fontWeight: '600'}}>+ {window.fmt(plan.ozetGelir)} ₺</span></div>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span>OPEX:</span> <span style={{color:'var(--btn-red-dark)', fontWeight: '600'}}>- {window.fmt(plan.ozetOpex)} ₺</span></div>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px', fontWeight:'700'}}><span>FAVÖK:</span> <span>{window.fmt(plan.ebitda)} ₺</span></div>
                                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Amortisman:</span> <span style={{color:'var(--btn-red-dark)', fontWeight: '600'}}>- {window.fmt(plan.aylikAmortisman)} ₺</span></div>
                                </div>

                                <div style={{fontSize:'14px', display:'flex', justifyContent:'space-between', marginTop:'4px', paddingTop:'8px', borderTop:'1px solid var(--border-grey)'}}>
                                    <span style={{fontWeight: '600', color: 'var(--enba-dark)'}}>Net Kâr:</span> <strong style={{color: plan.netKar >= 0 ? 'var(--enba-orange-dark)' : 'var(--btn-red-dark)'}}>{window.fmt(plan.netKar)} ₺</strong>
                                </div>

                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); kartiCikar(plan.id); }}>Geri Al / Durdur</button>
                            </div>
                        ))}
                    </div>

                </div>

                <nav className="mobile-bottom-nav">
                    <button className="mobile-nav-btn" onClick={() => { setMobileSidebarAcik(false); }}>
                        <span className="nav-icon">📊</span>
                        ÖZET
                    </button>
                    <button className="mobile-nav-btn" style={{position:'relative'}} onClick={() => setMobileSidebarAcik(a => !a)}>
                        <span className="nav-icon">📋</span>
                        İPK LİSTESİ
                        {bekleyenPlanlar.length > 0 && <span className="mobile-nav-badge">{bekleyenPlanlar.length}</span>}
                    </button>
                    <button className="mobile-nav-btn" onClick={yeniIpkBaslat}>
                        <span className="nav-icon">🚀</span>
                        YENİ İPK
                    </button>
                </nav>
            </div>
        );
    }

    return (
        <React.Fragment>
        <div className="page-container">
        <div className="page-header">
            <h2 style={{ margin: 0, color: 'var(--enba-dark)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '-0.5px' }}>{duzenlenenPlanId ? '✏️ İPK DÜZENLE' : '⚡  YENİ İPK TASARLA'}</h2>
            <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setAktifSayfa('anaSayfa')}>Vazgeç</button>
                <button className="btn btn-success" onClick={planKaydet}>⚡  İPK KAYDET</button>
            </div>
        </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-grey)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', marginRight: '20px', textTransform: 'uppercase', color: 'var(--enba-dark)', letterSpacing: '1px' }}>İPK ADI:</label>
                <input type="text" style={{ flex: 1, padding: '12px 15px', fontSize: '16px', border: '2px solid var(--border-grey)', borderRadius: '8px', fontFamily: 'Poppins, sans-serif', outline: 'none' }} placeholder="Örn: LDPE Mevcut Durum" value={yeniPlanBaslik} onChange={(e) => setYeniPlanBaslik(e.target.value)} onFocus={window.selectOnFocus} />
            </div>

            {/* SEKME MENÜSÜ */}
            <div className="tabs">
                <button className={`tab-btn ${planSekmesi === 'operasyon' ? 'active' : ''}`} onClick={() => setPlanSekmesi('operasyon')}>1. Üretim ve Operasyon</button>
                <button className={`tab-btn ${planSekmesi === 'kurulum' ? 'active' : ''}`} onClick={() => setPlanSekmesi('kurulum')}>2. Kurulum ve Yatırım (CAPEX)</button>
            </div>

            {/* 1. SEKME: OPERASYON VE ÜRETİM */}
            <div style={{ display: planSekmesi === 'operasyon' ? 'block' : 'none' }}>
                <div className="params-zone">
                    <h3 style={{marginTop: 0, color: 'var(--warning-orange)', textTransform: 'uppercase', fontSize: '15px', marginBottom: '5px', letterSpacing: '1px'}}>⚙️ planlama girdileri</h3>
                    <p style={{fontSize: '12px', color: '#7F8C8D', margin: 0}}>Tesise giren hammadde ve genel çalışma parametreleri.</p>
                    
                    <div className="params-grid">
                        <div className="param-box"><label>aylık giren malzeme (ton)</label><input type="number" value={planParametreleri.aylikTon} onChange={(e) => parametreDegisti('aylikTon', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>mal alış fiyatı (₺/ton)</label><input type="number" value={planParametreleri.alisFiyati} onChange={(e) => parametreDegisti('alisFiyati', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>ana ürün satış fiyatı (₺/ton)</label><input type="number" value={planParametreleri.satisFiyati} onChange={(e) => parametreDegisti('satisFiyati', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        
                        <div className="param-box"><label>aylık çalışma gün sayısı</label><input type="number" value={planParametreleri.aylikGun} onChange={(e) => parametreDegisti('aylikGun', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>tek vardiya çalışma saati</label><input type="number" value={planParametreleri.gunlukSaat} onChange={(e) => parametreDegisti('gunlukSaat', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>vardiya sayısı</label><input type="number" min="1" max="3" value={planParametreleri.vardiyaSayisi} onChange={(e) => parametreDegisti('vardiyaSayisi', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>ayıklama personeli saatlik hızı (ton)</label><input type="number" step="0.1" value={planParametreleri.ayiklamaHizi} onChange={(e) => parametreDegisti('ayiklamaHizi', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        
                        <div className="param-box"><label>alış nakliye (₺/ton)</label><input type="number" value={planParametreleri.alisNakliye} onChange={(e) => parametreDegisti('alisNakliye', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>satış nakliye (₺/ton)</label><input type="number" value={planParametreleri.satisNakliye} onChange={(e) => parametreDegisti('satisNakliye', e.target.value)} onFocus={window.selectOnFocus} /></div>
                        <div className="param-box"><label>elektrik kw fiyatı (₺)</label><input type="number" step="0.01" value={planParametreleri.elektrikKwFiyat} onChange={(e) => parametreDegisti('elektrikKwFiyat', e.target.value)} onFocus={window.selectOnFocus} /></div>
                    </div>
                </div>

                <div className="mass-balance-zone">
                    <h3 style={{marginTop: 0, color: 'var(--info-blue)', textTransform: 'uppercase', fontSize: '15px', marginBottom: '15px', letterSpacing: '1px'}}>♻️ Kütle Dengesi ve Üretim Reçetesi</h3>
                    <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: 'var(--info-blue)', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #AED6F1' }}>
                        <input type="checkbox" checked={uretimRecetesi.ayristirmaVar} onChange={e => setUretimRecetesi({...uretimRecetesi, ayristirmaVar: e.target.checked})} style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }} />
                        Tesiste Ayrıştırma / Ayıklama (Sorting) işlemi yapılacak
                    </label>
                    <div className="mass-balance-grid">
                        <div>
                            {uretimRecetesi.ayristirmaVar && (
                                <div className="mass-box" style={{marginBottom: '20px'}}>
                                    <h4>1. Ayrıştırma Aşaması (Çıkanlar)</h4>
                                    <div className="sub-product-row">
                                        <input type="text" value="⚡ ️ Ayrıştırma Çöpü / Fire" disabled style={{fontWeight: '600', color: 'var(--btn-red-dark)', backgroundColor: '#FDEDEC'}}/>
                                        <input type="number" placeholder="Oran %" value={uretimRecetesi.copOrani} onChange={e => setUretimRecetesi({...uretimRecetesi, copOrani: e.target.value})} onFocus={window.selectOnFocus} />
                                        <span style={{fontSize: '12px', color: '#7F8C8D', flex: 1, fontWeight: '600'}}>% (Çöp)</span>
                                    </div>
                                    <div className="sub-product-row">
                                        <span style={{flex: 2}}></span>
                                        <input type="number" placeholder="Bertaraf ₺/Ton" value={uretimRecetesi.copBertarafFiyati} onChange={e => setUretimRecetesi({...uretimRecetesi, copBertarafFiyati: e.target.value})} onFocus={window.selectOnFocus} />
                                        <span style={{fontSize: '12px', color: '#7F8C8D', flex: 1, fontWeight: '600'}}>₺/Ton Gider</span>
                                    </div>
                                    
                                    <h5 style={{color: 'var(--enba-dark)', fontSize: '13px', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase'}}>Ayrıştırılan Alt Ürünler:</h5>
                                    {uretimRecetesi.altUrunler.map((urun) => (
                                        <div key={urun.id} className="sub-product-row" style={{background: 'var(--light-grey)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-grey)'}}>
                                            <input type="text" value={urun.ad} onChange={(e) => altUrunGuncelle(urun.id, 'ad', e.target.value)} placeholder="Ürün Adı"/>
                                            <input type="number" value={urun.oran} onChange={(e) => altUrunGuncelle(urun.id, 'oran', e.target.value)} placeholder="% Oran" onFocus={window.selectOnFocus} />
                                            <input type="number" value={urun.fiyat} onChange={(e) => altUrunGuncelle(urun.id, 'fiyat', e.target.value)} placeholder="Satış ₺/Ton" onFocus={window.selectOnFocus} />
                                            <label style={{fontSize: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.8, fontWeight: '600', color: 'var(--enba-dark)'}}>
                                                <span>Üretime Girer</span>
                                                <input type="checkbox" checked={urun.uretimeGirer} onChange={(e) => altUrunGuncelle(urun.id, 'uretimeGirer', e.target.checked)} style={{marginTop: '4px'}}/>
                                            </label>
                                            <button onClick={() => altUrunSil(urun.id)} style={{background: 'none', border: 'none', color: 'var(--btn-red)', cursor: 'pointer', padding: '5px', fontSize: '14px', fontWeight: 'bold'}}>✖</button>
                                        </div>
                                    ))}
                                    <button className="btn btn-info" style={{fontSize: '11px', padding: '8px 15px', marginTop: '10px'}} onClick={altUrunEkle}>+ ALT ÜRÜN EKLE</button>
                                </div>
                            )}

                            <div className="mass-box">
                                <h4>2. Üretim Aşaması (Makine)</h4>
                                <div className="sub-product-row">
                                    <span style={{flex: 2, fontWeight: '600', color: 'var(--enba-dark)'}}>⚙️ Üretim Firesi (Buhar, Gaz vb.):</span>
                                    <input type="number" value={uretimRecetesi.uretimFiresi} onChange={e => setUretimRecetesi({...uretimRecetesi, uretimFiresi: e.target.value})} style={{flex: 1}} onFocus={window.selectOnFocus} />
                                    <span style={{flex: 1, fontSize: '12px', fontWeight: '600', color: '#7F8C8D'}}>% (Fire)</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="summary-box">
                                <h4 style={{margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', color: '#fff', fontSize: '14px', letterSpacing: '1px'}}>⚖️ KÜTLE DENGESİ ÖZETİ</h4>
                                <div className="summary-item"><span>Ana Girdi Malzeme:</span> <strong>{window.fmt(kutleDengesiOzet.girenTon)} Ton</strong></div>
                                {uretimRecetesi.ayristirmaVar && (
                                    <div className="summary-item" style={{color: '#F5B7B1'}}><span>- Ayrıştırma Çöpü:</span> <strong>{window.fmt(kutleDengesiOzet.copTon)} Ton</strong></div>
                                )}
                                <div className="summary-item" style={{marginTop: '10px', paddingTop: '10px', borderTop: '2px solid rgba(255,255,255,0.2)'}}>
                                    <span>Makineye / Üretime Giren:</span> <strong>{window.fmt(kutleDengesiOzet.uretimGirenTon)} Ton</strong>
                                </div>
                                <div className="summary-item" style={{color: '#F5B7B1'}}><span>- Üretim Firesi:</span> <strong>{window.fmt(kutleDengesiOzet.uretimFireTon)} Ton</strong></div>
                                <div className="summary-item" style={{fontSize: '16px', color: 'var(--enba-orange)', borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '10px', paddingTop: '15px'}}>
                                    <span>SATIŞA HAZIR TOPLAM ÜRÜN:</span> <strong>{window.fmt(kutleDengesiOzet.toplamSatisTon)} Ton</strong>
                                </div>
                            </div>

                            {uretimRecetesi.ayristirmaVar && (
                                <div className={`capacity-alert ${ayiklamaKapasitesi >= planParametreleri.aylikTon ? 'capacity-success' : 'capacity-error'}`}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                        {ayiklamaKapasitesi >= planParametreleri.aylikTon ? '✅ Ayrıştırma Kapasitesi Yeterli' : '⚠️ Kapasite Yetersiz! Ayıklama personeli ekleyin.'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '13px' }}>
                                        Hedeflenen: <strong>{window.fmt(planParametreleri.aylikTon)} Ton</strong> | Personel Kapasitesi: <strong>{window.fmt(ayiklamaKapasitesi)} Ton</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="personnel-zone">
                    <h3 style={{marginTop: 0, color: 'var(--enba-orange-dark)', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡  personel maliyet yönetimi</h3>
                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid var(--enba-orange)' }}>
                        <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Asgari Ücret (Net):</strong> <input type="number" step="0.01" style={{width: '100px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={asgariNet} onChange={e=>setAsgariNet(Number(e.target.value))} onFocus={window.selectOnFocus} /> ₺</div>
                        <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Asgari SGK Maliyeti:</strong> <input type="number" step="0.01" style={{width: '100px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={asgariSgk} onChange={e=>setAsgariSgk(Number(e.target.value))} onFocus={window.selectOnFocus} /> ₺</div>
                        <div style={{fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--enba-dark)'}}><strong>Günlük Yemek:</strong> <input type="number" step="0.01" style={{width: '80px', padding: '6px', border: '1px solid var(--border-grey)', borderRadius: '4px', marginLeft: '5px', outline: 'none'}} value={planParametreleri.gunlukYemekUcreti} onChange={e=>parametreDegisti('gunlukYemekUcreti', e.target.value)} onFocus={window.selectOnFocus} /> ₺</div>
                    </div>

                    {personelListesi.length > 0 && (
                        <table className="personnel-table">
                            <thead>
                                <tr>
                                    <th>Ünvan</th>
                                    <th>Nitelik</th>
                                    <th>Kişi/Vardiya</th>
                                    <th>Maaş (Asgari+Ek)</th>
                                    <th>Sgk (Asgari+Ek)</th>
                                    <th>Yemek (Aylık)</th>
                                    <th>Aylık Toplam ({planParametreleri.vardiyaSayisi || 1} vardiya)</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personelListesi.map(p => {
                                    const kisiMaasi = asgariNet + Number(p.ekMaas);
                                    const kisiSgk = asgariSgk + Number(p.ekSgk);
                                    const kisiYemek = (Number(planParametreleri.gunlukYemekUcreti) * Number(planParametreleri.aylikGun)) + Number(p.ekYemek);
                                    const kisiAylikMaliyet = (kisiMaasi + kisiSgk + kisiYemek) * Number(p.kisiSayisi) * Number(planParametreleri.vardiyaSayisi || 1);
                                    return (
                                        <tr key={p.id}>
                                            <td style={{fontWeight: '600', color: 'var(--enba-dark)'}}>{p.unvan}</td>
                                            <td>{p.isAyiklama ? <span style={{backgroundColor: '#EBF5FB', color: 'var(--info-blue)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}}>Ayıklama</span> : <span style={{color: '#95A5A6'}}>-</span>}</td>
                                            <td style={{fontWeight: '600'}}>{p.kisiSayisi}</td>
                                            <td>{window.fmt(kisiMaasi)} ₺</td>
                                            <td>{window.fmt(kisiSgk)} ₺</td>
                                            <td>{window.fmt(kisiYemek)} ₺</td>
                                            <td style={{fontWeight: 'bold', color: 'var(--btn-red)'}}>{window.fmt(kisiAylikMaliyet)} ₺</td>
                                            <td style={{whiteSpace: 'nowrap'}}>
                                                <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => personelDuzenle(p)}>Düzenle</button>
                                                <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => personelSil(p.id)}>Sil</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}

                    <div className="personnel-form">
                        <div className="form-group" style={{flex: 2}}><label>ünvan</label><input type="text" placeholder="Örn: Vasıfsız İşçi" value={yeniPersonel.unvan} onChange={e => setYeniPersonel({...yeniPersonel, unvan: e.target.value})} onFocus={window.selectOnFocus} /></div>
                        <div className="form-group" style={{ flex: 0.5, alignItems: 'center', justifyContent: 'center', paddingBottom: '8px' }}>
                            <label style={{textAlign: 'center', color: 'var(--enba-dark)'}}>Ayıklama<br/>Yapar mı?</label>
                            <input type="checkbox" checked={yeniPersonel.isAyiklama} onChange={e => setYeniPersonel({...yeniPersonel, isAyiklama: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        </div>
                        <div className="form-group"><label>kişi sayısı</label><input type="number" min="1" value={yeniPersonel.kisiSayisi} onChange={e => setYeniPersonel({...yeniPersonel, kisiSayisi: e.target.value})} onFocus={window.selectOnFocus} /></div>
                        <div className="form-group"><label>ek maaş (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekMaas} onChange={e => setYeniPersonel({...yeniPersonel, ekMaas: e.target.value})} onFocus={window.selectOnFocus} /></div>
                        <div className="form-group"><label>ek sgk (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekSgk} onChange={e => setYeniPersonel({...yeniPersonel, ekSgk: e.target.value})} onFocus={window.selectOnFocus} /></div>
                        <div className="form-group"><label>ek yemek (+₺)</label><input type="number" placeholder="0" value={yeniPersonel.ekYemek} onChange={e => setYeniPersonel({...yeniPersonel, ekYemek: e.target.value})} onFocus={window.selectOnFocus} /></div>
                        <button className="btn btn-info" style={{marginBottom: '0', padding: '10px 20px'}} onClick={personelEkle}>+ EKLE</button>
                    </div>
                </div>

                <div className="personnel-zone" style={{borderColor: 'var(--info-blue)', backgroundColor: '#EBF5FB', marginTop: '25px'}}>
                    <h3 style={{marginTop: 0, color: 'var(--info-blue)', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡  DIŞ HİZMETLER YÖNETİMİ (609)</h3>
                    <p style={{fontSize: '12px', color: '#34495E', margin: '0 0 15px 0'}}>Muhasebe, Güvenlik, Çevre Danışmanlığı, İSG gibi bu modele özel dışarıdan alınan hizmetleri (609) buradan ekleyebilirsiniz.</p>
                    
                    <div className="personnel-form" style={{border: '1px solid #AED6F1', backgroundColor: '#fff'}}>
                        <div className="form-group" style={{flex: 2}}>
                            <label style={{color: 'var(--info-blue)'}}>HİZMET ADI</label>
                            <input type="text" placeholder="Örn: Muhasebe / Güvenlik Hizmeti" value={yeniDisHizmet.ad} onChange={e => setYeniDisHizmet({...yeniDisHizmet, ad: e.target.value})} style={{borderColor: '#AED6F1'}} onFocus={window.selectOnFocus} />
                        </div>
                        <div className="form-group">
                            <label style={{color: 'var(--info-blue)'}}>AYLIK TUTAR (₺)</label>
                            <input type="number" placeholder="0" value={yeniDisHizmet.tutar} onChange={e => setYeniDisHizmet({...yeniDisHizmet, tutar: e.target.value})} style={{borderColor: '#AED6F1'}} onFocus={window.selectOnFocus} />
                        </div>
                        <button className="btn btn-info" style={{marginBottom: '0', padding: '10px 20px', backgroundColor: 'var(--info-blue)'}} onClick={disHizmetEkle}>+ EKLE</button>
                    </div>

                    {(disHizmetlerListesi.length > 0 || uretimRecetesi.ayristirmaVar) && (
                        <table className="personnel-table" style={{marginTop:'15px', border: '1px solid #AED6F1'}}>
                            <thead>
                                <tr>
                                    <th style={{backgroundColor: 'var(--info-blue)'}}>Hizmet / Gider Kalemi</th>
                                    <th style={{backgroundColor: 'var(--info-blue)'}}>Aylık Tutar</th>
                                    <th style={{backgroundColor: 'var(--info-blue)'}}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uretimRecetesi.ayristirmaVar && (
                                    <tr style={{backgroundColor: '#FDEDEC'}}>
                                        <td>
                                            <strong>Atık Bertaraf Gideri (Otomatik)</strong>
                                            <div style={{fontSize:'11px', color:'#7F8C8D'}}>Kütle dengesindeki çöp oranından hesaplanır</div>
                                        </td>
                                        <td style={{fontWeight: 'bold', color: 'var(--btn-red-dark)'}}>{window.fmt(kutleDengesiOzet.copTon * Number(uretimRecetesi.copBertarafFiyati))} ₺</td>
                                        <td style={{fontSize: '11px', color: '#95A5A6', fontStyle: 'italic'}}>Otomatik</td>
                                    </tr>
                                )}
                                {disHizmetlerListesi.map(h => (
                                    <tr key={h.id}>
                                        <td style={{fontWeight: '600', color: 'var(--enba-dark)'}}>{h.ad}</td>
                                        <td style={{fontWeight: 'bold'}}>{window.fmt(h.tutar)} ₺</td>
                                        <td style={{whiteSpace: 'nowrap'}}>
                                            <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => disHizmetDuzenle(h)}>Düzenle</button>
                                            <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => disHizmetSil(h.id)}>Sil</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="personnel-zone" style={{borderColor: '#E67E22', backgroundColor: '#FDF2E9', marginTop: '25px'}}>
                    <h3 style={{marginTop: 0, color: '#D35400', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px'}}>⚡ TESİS & EKİPMAN KİRA YÃ–NETİMİ (610)</h3>
                    <p style={{fontSize: '12px', color: '#34495E', margin: '0 0 15px 0'}}>Tesis kirası, forklift, lojistik araç, kantar kirası gibi tüm aylık kira kalemlerinizi (610) listeyebilirsiniz.</p>
                    
                    <div className="personnel-form" style={{border: '1px solid #F6DDCC', backgroundColor: '#fff'}}>
                        <div className="form-group" style={{flex: 2}}>
                            <label style={{color: '#D35400'}}>KİRALAMA MADDE ADI</label>
                            <input type="text" placeholder="Örn: Tesis Kirası / Elektrikli Forklift" value={yeniKiralama.ad} onChange={e => setYeniKiralama({...yeniKiralama, ad: e.target.value})} style={{borderColor: '#F5CBA7'}} onFocus={window.selectOnFocus} />
                        </div>
                        <div className="form-group">
                            <label style={{color: '#D35400'}}>AYLIK KİRA (₺)</label>
                            <input type="number" placeholder="0" value={yeniKiralama.tutar} onChange={e => setYeniKiralama({...yeniKiralama, tutar: e.target.value})} style={{borderColor: '#F5CBA7'}} onFocus={window.selectOnFocus} />
                        </div>
                        <button className="btn btn-warning" style={{marginBottom: '0', padding: '10px 20px', backgroundColor: '#D35400', color: 'white'}} onClick={kiralamaEkle}>+ EKLE</button>
                    </div>

                    {kiralamaListesi.length > 0 && (
                        <table className="personnel-table" style={{marginTop:'15px', border: '1px solid #F6DDCC'}}>
                            <thead>
                                <tr>
                                    <th style={{backgroundColor: '#E67E22'}}>Kira Kalemi</th>
                                    <th style={{backgroundColor: '#E67E22'}}>Aylık Tutar</th>
                                    <th style={{backgroundColor: '#E67E22'}}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kiralamaListesi.map(h => (
                                    <tr key={h.id}>
                                        <td style={{fontWeight: '600', color: '#D35400'}}>{h.ad}</td>
                                        <td style={{fontWeight: 'bold'}}>{window.fmt(h.tutar)} ₺</td>
                                        <td style={{whiteSpace: 'nowrap'}}>
                                            <button className="btn btn-warning" style={{padding: '5px 10px', fontSize: '11px', marginRight: '5px'}} onClick={() => kiralamaDuzenle(h)}>Düzenle</button>
                                            <button className="btn btn-danger" style={{padding: '5px 10px', fontSize: '11px'}} onClick={() => kiralamaSil(h.id)}>Sil</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="form-grid">
                    <div className="form-section" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ color: 'var(--btn-red)', borderBottom: '2px solid var(--btn-red)', paddingBottom: '10px', marginTop: 0, textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px' }}>operasyonel gider kalemleri (opex)</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            {window.GIDER_GRUPLARI.map(grup => (
                                <div key={grup.id} style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-grey)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'var(--enba-dark)', borderBottom: '1px solid #eee', paddingBottom: '8px', textTransform: 'uppercase' }}>{grup.ad}</h4>
                                    {window.SABLON_GIDERLER.filter(k => k.grup === grup.id).map(kalem => {
                                        const isOtoHesaplanan = 
                                            (personelListesi.length > 0 && ['450', '455', '480'].includes(kalem.kodu)) ||
                                            (['301', '302', '305', '609'].includes(kalem.kodu)) ||
                                            (kiralamaListesi.length > 0 && kalem.kodu === '610') ||
                                            (kurulumKalemleri.some(k => k.isMakine) && kalem.kodu === '405');
                                        
                                        return (
                                            <div className="input-row" key={kalem.kodu}>
                                                <label>{kalem.kodu} - {kalem.adi}:</label>
                                                <input type="number" placeholder="0 ₺" value={yeniPlanGiderler[kalem.kodu] || ""} onChange={(e) => setYeniPlanGiderler({...yeniPlanGiderler, [kalem.kodu]: e.target.value})} disabled={isOtoHesaplanan} onFocus={window.selectOnFocus} />
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-section" style={{ gridColumn: 'span 2' }}>
                        <h3 style={{ color: 'var(--enba-orange)', borderBottom: '2px solid var(--enba-orange)', paddingBottom: '10px', marginTop: 0, textTransform: 'uppercase', fontSize: '15px', letterSpacing: '1px' }}>gelir kalemleri</h3>
                        {window.SABLON_GELIRLER.map(kalem => (
                            <div key={kalem.kodu} style={{ maxWidth: '500px', marginTop: '20px' }}>
                                <div className="input-row">
                                    <label>{kalem.kodu} - {kalem.adi}:</label>
                                    <input type="number" placeholder="0 ₺" value={yeniPlanGelirler[kalem.kodu] || ""} onChange={(e) => setYeniPlanGelirler({...yeniPlanGelirler, [kalem.kodu]: e.target.value})} disabled={kalem.kodu === '109'} style={{fontSize: '16px', color: 'var(--enba-orange)', fontWeight: 'bold'}} onFocus={window.selectOnFocus} />
                                </div>
                                
                                {kalem.kodu === '109' && satisDetaylari.length > 0 && (
                                    <div style={{ marginTop: '15px', marginBottom: '15px', padding: '20px', background: '#F4F9F0', borderRadius: '10px', border: '1px solid var(--enba-orange)' }}>
                                        <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: 'var(--enba-dark)', textTransform: 'uppercase', borderBottom: '1px solid #D5E8D4', paddingBottom: '8px' }}>109 Konsolide Alt Girdileri:</h4>
                                        {satisDetaylari.map((detay, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', borderBottom: '1px dashed #D5E8D4', paddingBottom: '6px' }}>
                                                <span style={{color: 'var(--text-dark)'}}>{detay.ad} <span style={{color: '#7F8C8D', fontSize:'12px'}}>({window.fmt(detay.ton)} Ton)</span></span>
                                                <strong style={{color: 'var(--enba-orange-dark)'}}>{window.fmt(detay.tutar)} ₺</strong>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. SEKME: KURULUM VE YATIRIM (CAPEX) */}
            <div style={{ display: planSekmesi === 'kurulum' ? 'block' : 'none' }}>
                <div className="capex-zone">
                    <h3 style={{marginTop: 0, color: 'var(--capex-purple)', textTransform: 'uppercase', fontSize: '16px', marginBottom: '5px', letterSpacing: '1px'}}>🏭 KURULUM VE YATIRIM MALİYETLERİ (CAPEX)</h3>
                    <p style={{fontSize: '13px', color: '#7F8C8D', margin: 0, marginBottom: '25px'}}>
                        Makine, Trafo, İnşaat gibi ilk kurulum harcamalarınızı girin. Bu maliyetler "FAVÖK" hesabına girmez, belirlediğiniz ay süresince bölünerek "Net Kâr"dan düşülür.
                    </p>
                    
                    <div className="capex-box">
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
                            <div className="input-row" style={{ flex: 2, marginBottom: 0 }}>
                                <label style={{color: 'var(--capex-purple)'}}>Yatırım Kalemi Adı (Örn: Kırma Makinesi)</label>
                                <input type="text" value={yeniKurulum.ad} onChange={e => setYeniKurulum({...yeniKurulum, ad: e.target.value})} style={{borderColor: '#D7BDE2'}} onFocus={window.selectOnFocus} />
                            </div>
                            <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                                <label style={{color: 'var(--capex-purple)'}}>Tutar (₺)</label>
                                <input type="number" value={yeniKurulum.tutar} onChange={e => setYeniKurulum({...yeniKurulum, tutar: e.target.value})} style={{borderColor: '#D7BDE2'}} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', padding: '10px', background: '#F5EEF8', borderRadius: '6px', border: '1px solid #EBDEF0' }}>
                                <input type="checkbox" id="isMakineCheck" checked={yeniKurulum.isMakine} onChange={e => setYeniKurulum({...yeniKurulum, isMakine: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                                <label htmlFor="isMakineCheck" style={{fontSize: '13px', fontWeight: 'bold', color: 'var(--capex-purple)', cursor: 'pointer', textTransform: 'none', margin: 0}}>Makine Ekliyorum</label>
                            </div>
                        </div>

                        {yeniKurulum.isMakine && (
                            <div style={{ background: '#F5EEF8', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px dashed #D7BDE2' }}>
                                {/* Kapasite & Verimlilik */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div className="input-row" style={{marginBottom: 0}}>
                                        <label style={{color: '#6A1B9A', fontSize: '11px'}}>Üretim Kapasitesi (Ton/Saat)</label>
                                        <input type="number" step="0.1" value={yeniKurulum.kapasite} onChange={e => setYeniKurulum({...yeniKurulum, kapasite: e.target.value})} placeholder="Örn: 5" style={{borderColor: '#D7BDE2'}} onFocus={window.selectOnFocus} />
                                    </div>
                                    <div className="input-row" style={{marginBottom: 0}}>
                                        <label style={{color: '#6A1B9A', fontSize: '11px'}}>Verimlilik Katsayısı (%)</label>
                                        <input type="number" value={yeniKurulum.verimlilik} onChange={e => setYeniKurulum({...yeniKurulum, verimlilik: e.target.value})} style={{borderColor: '#D7BDE2'}} onFocus={window.selectOnFocus} />
                                    </div>
                                </div>

                                {/* Motor Listesi */}
                                <div style={{ borderTop: '1px dashed #D7BDE2', paddingTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <strong style={{ color: '#6A1B9A', fontSize: '13px' }}>⚡ Motorlar / Tüketim Kaynakları</strong>
                                        <span style={{ fontSize: '13px', color: '#6A1B9A', fontWeight: 'bold' }}>
                                            Toplam Güç: {motorToplamGucu(yeniKurulum.motorlar)} kW
                                        </span>
                                    </div>

                                    {yeniKurulum.motorlar.length > 0 && (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#EBDEF0' }}>
                                                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#6A1B9A', fontWeight: 600 }}>Motor / Kaynak Adı</th>
                                                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Güç (kW)</th>
                                                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Yük Katsayısı (%)</th>
                                                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#6A1B9A', fontWeight: 600 }}>Eff. kW</th>
                                                    <th style={{ padding: '8px 10px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yeniKurulum.motorlar.map(m => (
                                                    <tr key={m.id} style={{ background: '#fff' }}>
                                                        <td style={{ padding: '7px 10px' }}>{m.ad}</td>
                                                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{m.gucu}</td>
                                                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>%{m.yukKatsayisi}</td>
                                                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#6A1B9A' }}>{(m.gucu * m.yukKatsayisi / 100).toFixed(1)}</td>
                                                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                                                            <button onClick={() => motorSil(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontWeight: 'bold', fontSize: '14px' }}>✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    {/* Motor Ekleme Satırı */}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                        <div className="input-row" style={{ flex: 3, marginBottom: 0 }}>
                                            <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Motor / Kaynak Adı</label>
                                            <input type="text" value={yeniMotor.ad} onChange={e => setYeniMotor({...yeniMotor, ad: e.target.value})} placeholder="Örn: Ana Motor, Fanlı Soğutucu" style={{ borderColor: '#D7BDE2' }} onFocus={window.selectOnFocus} />
                                        </div>
                                        <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                                            <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Güç (kW)</label>
                                            <input type="number" value={yeniMotor.gucu} onChange={e => setYeniMotor({...yeniMotor, gucu: e.target.value})} placeholder="kW" style={{ borderColor: '#D7BDE2' }} onFocus={window.selectOnFocus} />
                                        </div>
                                        <div className="input-row" style={{ flex: 1, marginBottom: 0 }}>
                                            <label style={{ color: '#6A1B9A', fontSize: '11px' }}>Yük Katsayısı (%)</label>
                                            <input type="number" value={yeniMotor.yukKatsayisi} onChange={e => setYeniMotor({...yeniMotor, yukKatsayisi: e.target.value})} style={{ borderColor: '#D7BDE2' }} onFocus={window.selectOnFocus} />
                                        </div>
                                        <button className="btn btn-purple" style={{ padding: '10px 18px', fontSize: '12px', whiteSpace: 'nowrap' }} onClick={motorEkle}>+ Motor Ekle</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div style={{textAlign: 'right'}}>
                            <button className="btn btn-purple" style={{padding: '12px 35px', fontSize: '14px'}} onClick={kurulumEkle}>+ EKLE</button>
                        </div>

                        {kurulumKalemleri.length > 0 && (
                            <div style={{overflowX: 'auto', marginTop: '25px'}}>
                                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                                    <button className="btn btn-success" style={{fontSize: '12px', padding: '8px 18px'}} onClick={() => {
                                        const satirlar = [["Yatırım Kalemi", "Makine mi?", "Toplam Güç (kW)", "Kapasite (T/h)", "Verimlilik (%)", "Tutar (₺)", "", "Motor / Kaynak Adı", "Güç (kW)", "Yük Katsayısı (%)", "Efektif kW"]];
                                        kurulumKalemleri.forEach(k => {
                                            const motorlar = k.motorlar || [];
                                            const ilkMotor = motorlar[0];
                                            satirlar.push([
                                                k.ad,
                                                k.isMakine ? "Evet" : "Hayır",
                                                k.isMakine ? motorToplamGucu(motorlar) : "-",
                                                k.isMakine ? k.kapasite : "-",
                                                k.isMakine ? k.verimlilik : "-",
                                                k.tutar,
                                                "",
                                                ilkMotor ? ilkMotor.ad : "",
                                                ilkMotor ? ilkMotor.gucu : "",
                                                ilkMotor ? ilkMotor.yukKatsayisi : "",
                                                ilkMotor ? (ilkMotor.gucu * ilkMotor.yukKatsayisi / 100).toFixed(1) : ""
                                            ]);
                                            motorlar.slice(1).forEach(m => {
                                                satirlar.push(["","","","","","","", m.ad, m.gucu, m.yukKatsayisi, (m.gucu * m.yukKatsayisi / 100).toFixed(1)]);
                                            });
                                        });
                                        satirlar.push(["TOPLAM YATIRIM MALİYETİ", "", "", "", "", kurulumKalemleri.reduce((a, b) => a + b.tutar, 0)]);
                                        const ws = XLSX.utils.aoa_to_sheet(satirlar);
                                        ws['!cols'] = [{wch:30},{wch:12},{wch:15},{wch:14},{wch:14},{wch:16},{wch:4},{wch:28},{wch:12},{wch:18},{wch:12}];
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, "Ekipman Listesi");
                                        XLSX.writeFile(wb, `${yeniPlanBaslik || 'IPK'}_Ekipman_Listesi.xlsx`);
                                    }}>⚡  Excel'e Aktar</button>
                                </div>
                                <table className="capex-table" style={{minWidth: '600px', background: '#fff', borderRadius: '8px', overflow: 'hidden'}}>
                                    <thead>
                                        <tr>
                                            <th>Yatırım Kalemi</th>
                                            <th>Tutar</th>
                                            <th>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kurulumKalemleri.map(k => (
                                            <tr key={k.id}>
                                                <td>
                                                    <strong style={{color: 'var(--enba-dark)', fontSize: '14px'}}>{k.ad}</strong>
                                                    {k.isMakine && (
                                                        <div style={{fontSize: '12px', color: '#7F8C8D', marginTop: '6px'}}>
                                                            <span style={{background: '#F5EEF8', display: 'inline-block', padding: '3px 8px', borderRadius: '4px', marginRight: '6px'}}>
                                                                Toplam Güç: {motorToplamGucu(k.motorlar || [])} kW | Kapasite: {k.kapasite} T/h (Verim: %{k.verimlilik})
                                                            </span>
                                                            {(k.motorlar || []).map(m => (
                                                                <span key={m.id} style={{background: '#EBDEF0', display: 'inline-block', padding: '3px 8px', borderRadius: '4px', marginRight: '4px', marginTop: '4px', color: '#6A1B9A'}}>
                                                                    {m.ad}: {m.gucu}kW @%{m.yukKatsayisi}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{fontWeight: 'bold', verticalAlign: 'middle', color: 'var(--enba-dark)'}}>{window.fmt(k.tutar)} ₺</td>
                                                <td style={{width: '160px', verticalAlign: 'middle', whiteSpace: 'nowrap'}}>
                                                    <button className="btn btn-warning" style={{padding: '6px 12px', fontSize: '11px', marginRight: '8px'}} onClick={() => kurulumDuzenle(k)}>DÜZENLE</button>
                                                    <button className="btn btn-danger" style={{padding: '6px 12px', fontSize: '11px'}} onClick={() => kurulumSil(k.id)}>SİL</button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{backgroundColor: '#F5EEF8'}}>
                                            <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--capex-purple)'}}>TOPLAM YATIRIM MALİYETİ:</td>
                                            <td colSpan="2" style={{fontWeight: 'bold', color: 'var(--capex-purple)', fontSize: '16px'}}>{window.fmt(kurulumKalemleri.reduce((a, b) => a + b.tutar, 0))} ₺</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="capex-box" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5EEF8', border: '1px solid #D7BDE2'}}>
                        <div style={{flex: 1}}>
                            <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--capex-purple)', display: 'block', marginBottom: '8px'}}>AMORTİSMAN / GERİ ÖDEME SÜRESİ (AY):</label>
                            <p style={{fontSize: '12px', color: '#7F8C8D', margin: '0 0 12px 0'}}>Toplam maliyet bu süreye bölünerek net kârdan düşülecektir.</p>
                            <input type="number" value={amortismanSuresi} onChange={e => setAmortismanSuresi(Number(e.target.value))} style={{padding: '12px', fontSize: '18px', border: '2px solid var(--capex-purple)', borderRadius: '8px', width: '150px', outline: 'none', color: 'var(--enba-dark)', fontWeight: 'bold'}} onFocus={window.selectOnFocus} />
                        </div>
                        <div style={{flex: 1, textAlign: 'right'}}>
                            <span style={{fontSize: '14px', color: '#7F8C8D', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>Aylık Kârdan Düşülecek Amortisman Payı:</span>
                            <span style={{fontSize: '28px', fontWeight: 'bold', color: 'var(--btn-red)'}}>- { window.fmt(kurulumKalemleri.reduce((a, b) => a + b.tutar, 0) / (amortismanSuresi || 1)) } ₺ / Ay</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* Mobil alt navigasyon — İPK formu */}
        <nav className="mobile-bottom-nav">
            <button className="mobile-nav-btn" onClick={() => setAktifSayfa('anaSayfa')}>
                <span className="nav-icon">◀</span>
                GERİ
            </button>
            <button className={`mobile-nav-btn${planSekmesi === 'operasyon' ? ' active' : ''}`} onClick={() => setPlanSekmesi('operasyon')}>
                <span className="nav-icon">⚙️</span>
                OPERASYON
            </button>
            <button className={`mobile-nav-btn${planSekmesi === 'kurulum' ? ' active' : ''}`} onClick={() => setPlanSekmesi('kurulum')}>
                <span className="nav-icon">⚡ ️</span>
                CAPEX
            </button>
            <button className="mobile-nav-btn" onClick={planKaydet}>
                <span className="nav-icon">⚡ </span>
                KAYDET
            </button>
        </nav>
        </React.Fragment>
    );
}

// App bileşeni router tarafından kullanılır — burada render yok

window.App = App;