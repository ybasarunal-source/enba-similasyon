// ============================================================
//  Enba Recycling — Makina, Teçhizat ve Demirbaşlar
// ============================================================

function MakinaKatalog() {

    // ── Makina verileri ─────────────────────────────────────
    const [makinalar, setMakinalar] = React.useState(() => {
        const k = localStorage.getItem('enba_makinalar_v2');
        if (k) return JSON.parse(k);
        return [
            { id: "m1", adi: "Kırma Makinası 1",  marka: "", motorGucu: 250, kapasite: 10, yatirimBedeli: 0, satinaalmaTarihi: "", kategori: "Üretim Makinası" },
            { id: "m2", adi: "Yıkama Hattı",       marka: "", motorGucu: 150, kapasite: 8,  yatirimBedeli: 0, satinaalmaTarihi: "", kategori: "Üretim Makinası" },
            { id: "m3", adi: "Taşıma Bandı",        marka: "", motorGucu: 15,  kapasite: 20, yatirimBedeli: 0, satinaalmaTarihi: "", kategori: "Konveyör" },
            { id: "m4", adi: "Ekstrüder",            marka: "", motorGucu: 300, kapasite: 5,  yatirimBedeli: 0, satinaalmaTarihi: "", kategori: "Üretim Makinası" }
        ];
    });

    // ── Demirbaş verileri ────────────────────────────────────
    const [demirbaslar, setDemirbaslar] = React.useState(() => {
        const k = localStorage.getItem('enba_demirbaslar');
        if (k) return JSON.parse(k);
        return [];
    });

    // ── Bakım/Onarım kayıtları ───────────────────────────────
    const [bakimKayitlari, setBakimKayitlari] = React.useState(() => {
        const k = localStorage.getItem('enba_bakim_kayitlari');
        if (k) return JSON.parse(k);
        return [];
    });

    // ── localStorage senkronizasyonu ─────────────────────────
    React.useEffect(() => { localStorage.setItem('enba_makinalar_v2',   JSON.stringify(makinalar));      }, [makinalar]);
    React.useEffect(() => { localStorage.setItem('enba_demirbaslar',     JSON.stringify(demirbaslar));    }, [demirbaslar]);
    React.useEffect(() => { localStorage.setItem('enba_bakim_kayitlari', JSON.stringify(bakimKayitlari)); }, [bakimKayitlari]);

    // ── Aktif sekme ──────────────────────────────────────────
    const [sekme, setSekme] = React.useState('makinalar'); // 'makinalar' | 'demirbaslar' | 'bakim'

    // ── Form: Makina ─────────────────────────────────────────
    const [mFormAcik,      setMFormAcik]      = React.useState(false);
    const [mDuzenlenen,    setMDuzenlenen]    = React.useState(null);
    const [mAdi,           setMAdi]           = React.useState('');
    const [mMarka,         setMMarka]         = React.useState('');
    const [mMotorGucu,     setMMotorGucu]     = React.useState('');
    const [mYatirim,       setMYatirim]       = React.useState('');
    const [mTarih,         setMTarih]         = React.useState('');
    const [mKategori,      setMKategori]      = React.useState('Üretim Makinası');
    const [mKapasite,       setMKapasite]       = React.useState('');
    const [mBoyut,          setMBoyut]          = React.useState('Orta');

    // ── Form: Demirbaş ────────────────────────────────────────
    const [dFormAcik,      setDFormAcik]      = React.useState(false);
    const [dDuzenlenen,    setDDuzenlenen]    = React.useState(null);
    const [dAdi,           setDAdi]           = React.useState('');
    const [dKategori,      setDKategori]      = React.useState('Ofis Ekipmanı');
    const [dYatirim,       setDYatirim]       = React.useState('');
    const [dTarih,         setDTarih]         = React.useState('');

    // ── Toplu Excel Yükleme ───────────────────────────────────
    const [topluFormAcik,   setTopluFormAcik]   = React.useState(false);
    const [topluOnizleme,   setTopluOnizleme]   = React.useState([]);   // parse edilmiş satırlar
    const [topluHata,       setTopluHata]       = React.useState('');
    const topluDosyaRef = React.useRef(null);

    const topluDosyaSecildi = (e) => {
        setTopluHata('');
        setTopluOnizleme([]);
        const dosya = e.target.files[0];
        if (!dosya) return;

        const okuyucu = new FileReader();
        okuyucu.onload = (ev) => {
            try {
                const veri = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(veri, { type: 'array', cellDates: true });
                const sayfa = workbook.Sheets[workbook.SheetNames[0]];
                const satirlar = XLSX.utils.sheet_to_json(sayfa, { header: 1, defval: '' });

                if (satirlar.length < 2) {
                    setTopluHata('Dosya boş veya yalnızca başlık satırı içeriyor.');
                    return;
                }

                // İlk satır başlık — atla
                const veriler = satirlar.slice(1).filter(r => r[0] && String(r[0]).trim());
                if (veriler.length === 0) {
                    setTopluHata('Geçerli makina satırı bulunamadı.');
                    return;
                }

                const formatliTarih = (val) => {
                    if (!val) return '';
                    if (val instanceof Date) {
                        return val.toISOString().slice(0, 10);
                    }
                    const s = String(val).trim();
                    // dd.mm.yyyy
                    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
                        const [g, ay, y] = s.split('.');
                        return `${y}-${ay.padStart(2,'0')}-${g.padStart(2,'0')}`;
                    }
                    return s;
                };

                const parsed = veriler.map((r, i) => ({
                    _row: i + 2,
                    adi:             String(r[0] || '').trim(),
                    marka:           String(r[1] || '').trim(),
                    motorGucu:       Number(r[2]) || 0,
                    kategori:        formatliTarih(r[3]) ? 'Üretim Makinası' : (r[3] || 'Üretim Makinası'),
                    kapasite:        Number(r[4]) || 0,
                    boyut:           r[7] || 'Orta',
                    satinaalmaTarihi: formatliTarih(r[5]),
                    yatirimBedeli:   Number(r[6]) || 0,
                }));

                setTopluOnizleme(parsed);
            } catch (err) {
                setTopluHata('Dosya okunamadı: ' + err.message);
            }
        };
        okuyucu.readAsArrayBuffer(dosya);
        // input'u sıfırla (aynı dosyayı tekrar seçebilsin)
        e.target.value = '';
    };

    const topluKaydet = () => {
        if (topluOnizleme.length === 0) return;
        const yeniMakinalar = topluOnizleme.map(p => ({
            ...p,
            id: 'mak_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
        }));
        // _row alanını temizle
        setMakinalar(prev => [...prev, ...yeniMakinalar.map(({ _row, ...rest }) => rest)]);
        setTopluFormAcik(false);
        setTopluOnizleme([]);
        setTopluHata('');
    };

    const orbekDosyaIndir = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['Makine Adı', 'Markası', 'Motor Gücü (kW)', 'Tipi', 'Kapasite (Ton/Saat)', 'Alış Tarihi (GG.AA.YYYY)', 'Alış Fiyatı (₺)', 'Görsel Boyut (Büyük/Orta/Küçük)'],
            ['Kırma Makinası', 'Metso', 250, 'Üretim Makinası', 10, '15.03.2023', 1200000, 'Büyük'],
            ['Yıkama Hattı', 'Terex', 150, 'Üretim Makinası', 12, '20.06.2022', 850000, 'Büyük'],
            ['Konveyör Bant', 'Enba', 15, 'Yardımcı Ekipman', 25, '01.01.2024', 250000, 'Küçük'],
        ]);
        ws['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Makinalar');
        XLSX.writeFile(wb, 'Makina_Sablonu.xlsx');
    };

    // ── Form: Bakım/Onarım ────────────────────────────────────
    const [bFormAcik,      setBFormAcik]      = React.useState(false);
    const [bDuzenlenen,    setBDuzenlenen]    = React.useState(null);
    const [bTarih,         setBTarih]         = React.useState('');
    const [bVarlikId,      setBVarlikId]      = React.useState('');
    const [bTur,           setBTur]           = React.useState('Bakım');
    const [bAciklama,      setBAciklama]      = React.useState('');
    const [bMaliyet,       setBMaliyet]       = React.useState('');

    // ── Makina form işlemleri ─────────────────────────────────
    const mFormAc = (m = null) => {
        if (m) {
            setMDuzenlenen(m.id); setMAdi(m.adi); setMMarka(m.marka || ''); setMMotorGucu(m.motorGucu);
            setMYatirim(m.yatirimBedeli || '');
            setMTarih(m.satinaalmaTarihi || ''); setMKategori(m.kategori || 'Üretim Makinası');
            setMKapasite(m.kapasite || '');
            setMBoyut(m.boyut || 'Orta');
        } else {
            setMDuzenlenen(null); setMAdi(''); setMMarka(''); setMMotorGucu('');
            setMYatirim(''); setMTarih(''); setMKategori('Üretim Makinası');
            setMKapasite('');
            setMBoyut('Orta');
        }
        setMFormAcik(true);
    };

    const mKaydet = () => {
        if (!mAdi) return;
        const yeni = {
            id: mDuzenlenen || "mak_" + Date.now(),
            adi: mAdi,
            marka:           mMarka,
            motorGucu:       Number(mMotorGucu)  || 0,
            yatirimBedeli:   Number(mYatirim)    || 0,
            satinaalmaTarihi: mTarih,
            kategori:        mKategori,
            kapasite:        Number(mKapasite) || 0,
            boyut:           mBoyut
        };
        if (mDuzenlenen) {
            setMakinalar(p => p.map(x => x.id === mDuzenlenen ? yeni : x));
        } else {
            setMakinalar(p => [...p, yeni]);
        }
        setMFormAcik(false);
    };

    const mSil = (id) => {
        if (window.confirm("Bu makinayı silmek istediğinize emin misiniz?"))
            setMakinalar(p => p.filter(x => x.id !== id));
    };

    // ── Demirbaş form işlemleri ───────────────────────────────
    const dFormAc = (d = null) => {
        if (d) {
            setDDuzenlenen(d.id); setDAdi(d.adi); setDKategori(d.kategori || 'Ofis Ekipmanı');
            setDYatirim(d.yatirimBedeli || ''); setDTarih(d.satinaalmaTarihi || '');
        } else {
            setDDuzenlenen(null); setDAdi(''); setDKategori('Ofis Ekipmanı'); setDYatirim(''); setDTarih('');
        }
        setDFormAcik(true);
    };

    const dKaydet = () => {
        if (!dAdi) return;
        const yeni = {
            id: dDuzenlenen || "dem_" + Date.now(),
            adi:             dAdi,
            kategori:        dKategori,
            yatirimBedeli:   Number(dYatirim) || 0,
            satinaalmaTarihi: dTarih
        };
        if (dDuzenlenen) {
            setDemirbaslar(p => p.map(x => x.id === dDuzenlenen ? yeni : x));
        } else {
            setDemirbaslar(p => [...p, yeni]);
        }
        setDFormAcik(false);
    };

    const dSil = (id) => {
        if (window.confirm("Bu demirbaşı silmek istediğinize emin misiniz?"))
            setDemirbaslar(p => p.filter(x => x.id !== id));
    };

    // ── Bakım form işlemleri ──────────────────────────────────
    const tumVarliklar = [
        ...makinalar.map(m => ({ id: m.id, adi: m.adi, tur: 'makina' })),
        ...demirbaslar.map(d => ({ id: d.id, adi: d.adi, tur: 'demirbaş' }))
    ];

    const bFormAc = (b = null, oncedenSeciliMakinaId = null) => {
        if (b) {
            setBDuzenlenen(b.id); setBTarih(b.tarih); setBVarlikId(b.varlikId);
            setBTur(b.tur); setBAciklama(b.aciklama); setBMaliyet(b.maliyet);
        } else {
            setBDuzenlenen(null); setBTarih(''); setBVarlikId(oncedenSeciliMakinaId || '');
            setBTur('Bakım'); setBAciklama(''); setBMaliyet('');
        }
        setBFormAcik(true);
    };

    const bKaydet = () => {
        if (!bTarih || !bVarlikId || !bMaliyet) return;
        const seciliVarlik = tumVarliklar.find(v => v.id === bVarlikId);
        const yeni = {
            id:          bDuzenlenen || "bkm_" + Date.now(),
            tarih:       bTarih,
            varlikId:    bVarlikId,
            varlikAdi:   seciliVarlik ? seciliVarlik.adi : '',
            varlikTuru:  seciliVarlik ? seciliVarlik.tur : '',
            tur:         bTur,
            aciklama:    bAciklama,
            maliyet:     Number(bMaliyet) || 0
        };
        if (bDuzenlenen) {
            setBakimKayitlari(p => p.map(x => x.id === bDuzenlenen ? yeni : x));
        } else {
            setBakimKayitlari(p => [...p, yeni]);
        }
        setBFormAcik(false);
    };

    const bSil = (id) => {
        if (window.confirm("Bu bakım/onarım kaydını silmek istediğinize emin misiniz?"))
            setBakimKayitlari(p => p.filter(x => x.id !== id));
    };

    // ── Özet hesaplamalar ─────────────────────────────────────
    const toplamMakinaYatirim   = makinalar.reduce((t, m) => t + (m.yatirimBedeli || 0), 0);
    const toplamDemirbasYatirim = demirbaslar.reduce((t, d) => t + (d.yatirimBedeli || 0), 0);
    const toplamYatirim         = toplamMakinaYatirim + toplamDemirbasYatirim;
    const toplamBakim           = bakimKayitlari.reduce((t, b) => t + (b.maliyet || 0), 0);
    const buYilBakim            = bakimKayitlari
        .filter(b => b.tarih && b.tarih.startsWith(new Date().getFullYear().toString()))
        .reduce((t, b) => t + (b.maliyet || 0), 0);

    // ── Ortak stiller ─────────────────────────────────────────
    const cardStyle = {
        background: 'var(--surface-container-lowest)',
        padding: '20px',
        borderRadius: '1.2rem',
        border: '1px solid var(--surface-container-highest)',
        boxShadow: 'var(--shadow-sm)'
    };

    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        borderRadius: '0.75rem',
        border: '1px solid var(--surface-container-highest)',
        outline: 'none',
        boxSizing: 'border-box',
        fontSize: '14px',
        background: 'var(--surface-container-low)',
        color: 'var(--on-surface)'
    };

    const labelStyle = {
        fontSize: '11px', fontWeight: 600,
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        display: 'block', marginBottom: '6px', letterSpacing: '0.5px'
    };

    const btnPrimary = {
        padding: '11px 22px', background: 'var(--enba-dark)', color: '#fff',
        border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
    };

    const btnSecondary = {
        padding: '11px 16px', background: 'var(--surface-container-high)',
        border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
    };

    const MAKINA_KATEGORILER = ['Üretim Makinası', 'Konveyör', 'Kompresör', 'Forklift', 'Vinç', 'Elektrik/Panel', 'Diğer'];
    const DEMIRBAS_KATEGORILER = ['Ofis Ekipmanı', 'Araç', 'Bilgisayar/IT', 'Güvenlik Sistemi', 'Aydınlatma', 'Mobilya', 'Diğer'];
    const BAKIM_TURLERI = ['Bakım', 'Onarım', 'Tadilat', 'Revizyon', 'Yedek Parça', 'Nakliye Ücreti', 'Kurulum', 'Diğer'];


    const turRengi = {
        'Bakım':          '#2196F3',
        'Onarım':         '#FF9800',
        'Tadilat':        '#9C27B0',
        'Revizyon':       '#009688',
        'Yedek Parça':    '#F44336',
        'Nakliye Ücreti': '#795548',
        'Kurulum':        '#00897B',
        'Diğer':          '#607D8B'
    };

    const turIkon = {
        'Bakım':          '⚡ ',
        'Onarım':         '⚡ ️',
        'Tadilat':        '⚡ ️',
        'Revizyon':       '⚡ ',
        'Yedek Parça':    '⚙️',
        'Nakliye Ücreti': '⚡ ',
        'Kurulum':        '⚡ ',
        'Diğer':          '⚡ '
    };

    // ── Sekme butonu ──────────────────────────────────────────
    const SekmeBtn = ({ id, label }) => (
        <button
            onClick={() => setSekme(id)}
            style={{
                padding: '10px 22px',
                borderRadius: '2rem',
                border: 'none',
                background: sekme === id ? 'var(--enba-dark)' : 'var(--surface-container-high)',
                color:      sekme === id ? '#fff' : 'var(--on-surface-variant)',
                fontWeight: 700,
                fontSize:   '14px',
                cursor:     'pointer',
                transition: 'all 0.18s'
            }}
        >{label}</button>
    );

    return (
        <div style={{ padding: '32px 40px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Başlık ─────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '26px', color: 'var(--enba-dark)', margin: '0 0 6px' }}>
                    ⚙️ {window.t('assets.title')}
                </h1>
                <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                    {window.t('assets.desc')}
                </p>
            </div>

            {/* ── Özet Kartlar ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {[
                    { baslik: window.t('assets.total_invest'),        deger: toplamYatirim,         renk: 'var(--enba-dark)',      alt: `${makinalar.length} ${window.t('assets.machineries')} + ${demirbaslar.length} ${window.t('assets.fixtures')}` },
                    { baslik: window.t('assets.machinery_invest'),    deger: toplamMakinaYatirim,   renk: '#1976D2',               alt: `${makinalar.length} ${window.t('assets.machineries')}` },
                    { baslik: window.t('assets.fixture_invest'),  deger: toplamDemirbasYatirim, renk: '#7B1FA2',               alt: `${demirbaslar.length} ${window.t('assets.fixtures')}` },
                    { baslik: window.t('assets.total_maintenance'),     deger: toplamBakim,           renk: '#D32F2F',               alt: window.t('common.all_time') || 'All Time' },
                    { baslik: window.t('assets.yearly_maintenance'),     deger: buYilBakim,            renk: '#F57C00',               alt: new Date().getFullYear() + ' yılı' },
                ].map((k, i) => (
                    <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${k.renk}` }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>{k.baslik}</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: k.renk, fontFamily: "'Manrope', sans-serif" }}>
                            {window.fmt(k.deger)} ₺
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{k.alt}</div>
                    </div>
                ))}
            </div>

            {/* ── Sekmeler ───────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <SekmeBtn id="makinalar"  label={`⚙️ ${window.t('assets.machineries')} (${makinalar.length})`} />
                <SekmeBtn id="demirbaslar" label={`⚡ ️ ${window.t('assets.fixtures')} (${demirbaslar.length})`} />
                <SekmeBtn id="bakim"       label={`⚡  ${window.t('assets.expenses')} (${bakimKayitlari.length})`} />
            </div>

            {/* ══════════════════════════════════════════════════
                SEKME 1 — MAKİNALAR
            ══════════════════════════════════════════════════ */}
            {sekme === 'makinalar' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }}>
                        <button onClick={orbekDosyaIndir} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚡  {window.t('assets.download_template')}
                        </button>
                        <button onClick={() => { setTopluFormAcik(true); setTopluOnizleme([]); setTopluHata(''); }} style={{ ...btnPrimary, background: '#1976D2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚡  {window.t('assets.bulk_excel')}
                        </button>
                        <button onClick={() => mFormAc()} style={{ ...btnPrimary, background: 'var(--enba-orange)' }}>+ {window.t('assets.new_machinery')}</button>
                    </div>

                    {/* ── Toplu Excel Yükleme Modalı ── */}
                    {topluFormAcik && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '1.4rem', padding: '32px', width: '100%', maxWidth: '820px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", color: 'var(--enba-dark)', fontSize: '20px' }}>⚡  {window.t('assets.bulk_upload_title')}</h2>
                                    <button onClick={() => setTopluFormAcik(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>✕</button>
                                </div>

                                {/* Beklenen format bilgisi */}
                                <div style={{ background: 'rgba(25,118,210,0.07)', border: '1px solid rgba(25,118,210,0.2)', borderRadius: '0.75rem', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                                    <strong style={{ color: '#1565C0' }}>{window.t('assets.excel_order')}</strong><br/>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                        A: {window.t('assets.name')} &nbsp;|&nbsp; B: {window.t('assets.brand')} &nbsp;|&nbsp; C: {window.t('assets.power')} (kW) &nbsp;|&nbsp; D: {window.t('assets.category')} &nbsp;|&nbsp; E: {window.t('assets.date')} &nbsp;|&nbsp; F: {window.t('assets.price')} (₺)
                                    </span>
                                </div>

                                {/* Dosya Seç */}
                                <input ref={topluDosyaRef} type="file" accept=".xlsx,.xls" onChange={topluDosyaSecildi} style={{ display: 'none' }} />
                                <button
                                    onClick={() => topluDosyaRef.current && topluDosyaRef.current.click()}
                                    style={{ ...btnPrimary, background: '#1976D2', width: '100%', marginBottom: '16px', fontSize: '15px', padding: '14px' }}
                                >
                                    ⚡  {window.t('assets.select_excel_file')}
                                </button>

                                {/* Hata */}
                                {topluHata && (
                                    <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '0.75rem', padding: '12px 16px', color: '#C62828', marginBottom: '16px', fontSize: '13px' }}>
                                        ⚠️ {topluHata}
                                    </div>
                                )}

                                {/* Önizleme Tablosu */}
                                {topluOnizleme.length > 0 && (
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--enba-dark)', marginBottom: '10px', fontSize: '14px' }}>
                                            ✅ {topluOnizleme.length} {window.t('assets.machineries').toLowerCase()} {window.t('common.ready') || 'ready'}
                                        </div>
                                        <div style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: '0.75rem', border: '1px solid var(--surface-container-highest)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--surface-container-low)' }}>
                                                        {['#', window.t('assets.name'), window.t('assets.brand'), window.t('assets.power'), window.t('assets.category'), window.t('assets.date'), window.t('assets.price')].map(h => (
                                                            <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '2px solid var(--surface-container-highest)' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topluOnizleme.map((p, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--surface-container-highest)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)' }}>
                                                            <td style={{ padding: '8px 12px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>{p._row}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--enba-dark)' }}>{p.adi || '—'}</td>
                                                            <td style={{ padding: '8px 12px' }}>{p.marka || '—'}</td>
                                                            <td style={{ padding: '8px 12px' }}>{p.motorGucu ? p.motorGucu + ' kW' : '—'}</td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{ background: 'rgba(25,118,210,0.1)', color: '#1565C0', padding: '2px 8px', borderRadius: '1rem', fontSize: '11px', fontWeight: 600 }}>{p.kategori || '—'}</span>
                                                            </td>
                                                            <td style={{ padding: '8px 12px' }}>{p.satinaalmaTarihi ? new Date(p.satinaalmaTarihi).toLocaleDateString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US') : '—'}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.yatirimBedeli ? window.fmt(p.yatirimBedeli) + ' ₺' : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setTopluOnizleme([]); setTopluHata(''); }} style={btnSecondary}>{window.t('assets.clear')}</button>
                                            <button onClick={topluKaydet} style={{ ...btnPrimary, background: 'var(--enba-orange)', fontSize: '15px', padding: '12px 28px' }}>
                                                ✅ {topluOnizleme.length} {window.t('assets.save_machineries')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Makina Formu */}
                    {mFormAcik && (
                        <div style={{ ...cardStyle, marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={labelStyle}>{window.t('assets.name')} *</label>
                                <input style={inputStyle} type="text" value={mAdi} onChange={e => setMAdi(e.target.value)} placeholder="Örn: Granül Makinesi" />
                            </div>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={labelStyle}>{window.t('assets.brand')}</label>
                                <input style={inputStyle} type="text" value={mMarka} onChange={e => setMMarka(e.target.value)} placeholder="Örn: Siemens, ABB..." />
                            </div>
                            <div style={{ flex: '1 1 130px' }}>
                                <label style={labelStyle}>{window.t('assets.power')} (kW)</label>
                                <input style={inputStyle} type="number" value={mMotorGucu} onChange={e => setMMotorGucu(e.target.value)} placeholder="Örn: 150" />
                            </div>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={labelStyle}>{window.t('assets.category')}</label>
                                <select style={inputStyle} value={mKategori} onChange={e => setMKategori(e.target.value)}>
                                    {MAKINA_KATEGORILER.map(k => <option key={k} value={k}>{window.t(`assets.categories.${k.toLowerCase().replace(' ', '_')}`) || k}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>{window.t('assets.date')}</label>
                                <input style={inputStyle} type="date" value={mTarih} onChange={e => setMTarih(e.target.value)} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label style={labelStyle}>{window.t('assets.capacity')} (Ton/Sa)</label>
                                <input style={inputStyle} type="number" value={mKapasite} onChange={e => setMKapasite(e.target.value)} placeholder="Örn: 10" />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label style={labelStyle}>{window.t('assets.size')}</label>
                                <select style={inputStyle} value={mBoyut} onChange={e => setMBoyut(e.target.value)}>
                                    <option value="Büyük">{localStorage.getItem('enba_lang') === 'TR' ? 'Büyük' : 'Large'}</option>
                                    <option value="Orta">{localStorage.getItem('enba_lang') === 'TR' ? 'Orta' : 'Medium'}</option>
                                    <option value="Küçük">{localStorage.getItem('enba_lang') === 'TR' ? 'Küçük' : 'Small'}</option>
                                </select>
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>{window.t('assets.price')} (₺)</label>
                                <input style={inputStyle} type="number" value={mYatirim} onChange={e => setMYatirim(e.target.value)} placeholder="Örn: 500000" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                <button onClick={() => setMFormAcik(false)} style={btnSecondary}>{window.t('common.cancel')}</button>
                                <button onClick={mKaydet} style={btnPrimary}>{mDuzenlenen ? window.t('common.update') : window.t('common.save')}</button>
                            </div>
                        </div>
                    )}

                    {/* Makina Tablosu */}
                    {makinalar.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-container-low)' }}>
                                        {[window.t('assets.name'), window.t('assets.brand'), window.t('assets.power'), window.t('assets.capacity'), window.t('assets.size'), window.t('assets.category'), window.t('assets.date'), window.t('assets.price'), 'B/O', window.t('assets.actions')].map(h => (
                                            <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '2px solid var(--surface-container-highest)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {makinalar.map((m, i) => (
                                        <tr key={m.id} style={{ borderBottom: '1px solid var(--surface-container-highest)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)' }}>
                                            <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--enba-dark)', fontSize: '13px' }}>{m.adi}</td>
                                            <td style={{ padding: '10px 8px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>{m.marka || '—'}</td>
                                            <td style={{ padding: '10px 8px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>{m.motorGucu ? m.motorGucu + ' kW' : '—'}</td>
                                            <td style={{ padding: '10px 8px', color: 'var(--enba-orange)', fontWeight: 700, fontSize: '13px' }}>{m.kapasite ? m.kapasite + ' t/h' : '—'}</td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <span style={{ 
                                                    background: m.boyut === 'Büyük' ? '#fff3e0' : (m.boyut === 'Küçük' ? '#f3e5f5' : '#e3f2fd'), 
                                                    color: m.boyut === 'Büyük' ? '#e65100' : (m.boyut === 'Küçük' ? '#7b1fa2' : '#1976d2'), 
                                                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 
                                                }}>
                                                    {m.boyut || 'Orta'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ background: 'rgba(25,118,210,0.1)', color: '#1565C0', padding: '3px 10px', borderRadius: '1rem', fontSize: '12px', fontWeight: 600 }}>{m.kategori || '—'}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: 'var(--on-surface-variant)' }}>
                                                {m.satinaalmaTarihi ? new Date(m.satinaalmaTarihi).toLocaleDateString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US') : '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: m.yatirimBedeli ? 'var(--enba-dark)' : 'var(--on-surface-variant)' }}>
                                                {m.yatirimBedeli ? window.fmt(m.yatirimBedeli) + ' ₺' : '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                {(() => {
                                                    const toplam = bakimKayitlari.filter(b => b.varlikId === m.id).reduce((t, b) => t + (b.maliyet || 0), 0);
                                                    const adet   = bakimKayitlari.filter(b => b.varlikId === m.id).length;
                                                    return toplam > 0
                                                        ? <span title={`${adet} kayıt`} style={{ fontWeight: 700, color: '#C62828' }}>{window.fmt(toplam)} ₺</span>
                                                        : <span style={{ color: 'var(--on-surface-variant)' }}>—</span>;
                                                })()}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                                                    <button
                                                        onClick={() => { setSekme('bakim'); bFormAc(null, m.id); }}
                                                        title={window.t('assets.expense_add')}
                                                        style={{ background: 'rgba(211,47,47,0.1)', border: '1px solid rgba(211,47,47,0.25)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', color: '#C62828', fontWeight: 600, whiteSpace: 'nowrap' }}
                                                    >⚡  {window.t('assets.expense_short') || 'Exp.'}</button>
                                                    <button onClick={() => mFormAc(m)} title={window.t('common.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-pencil-simple" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}></i></button>
                                                    <button onClick={() => mSil(m.id)} title={window.t('common.delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-trash" style={{ fontSize: '16px', color: '#e53935' }}></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--surface-container-low)', fontWeight: 700 }}>
                                        <td colSpan={7} style={{ padding: '10px 8px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>{window.t('common.total').toUpperCase()}</td>
                                        <td style={{ padding: '10px 8px', color: 'var(--enba-dark)', fontSize: '13px' }}>{window.fmt(toplamMakinaYatirim)} ₺</td>
                                        <td style={{ padding: '10px 8px', color: '#C62828', fontSize: '13px' }}>{window.fmt(toplamBakim)} ₺</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--on-surface-variant)' }}>
                            {window.t('common.no_records')}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                SEKME 2 — DEMİRBAŞLAR
            ══════════════════════════════════════════════════ */}
            {sekme === 'demirbaslar' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={() => dFormAc()} style={{ ...btnPrimary, background: '#7B1FA2' }}>+ {window.t('assets.new_fixture')}</button>
                    </div>

                    {/* Demirbaş Formu */}
                    {dFormAcik && (
                        <div style={{ ...cardStyle, marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 250px' }}>
                                <label style={labelStyle}>{window.t('assets.name')} *</label>
                                <input style={inputStyle} type="text" value={dAdi} onChange={e => setDAdi(e.target.value)} placeholder="Örn: Ofis Masası, Forklift..." />
                            </div>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={labelStyle}>{window.t('assets.category')}</label>
                                <select style={inputStyle} value={dKategori} onChange={e => setDKategori(e.target.value)}>
                                    {DEMIRBAS_KATEGORILER.map(k => <option key={k} value={k}>{window.t(`assets.categories.${k.toLowerCase().replace(' ', '_')}`) || k}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={labelStyle}>{window.t('assets.price')} (₺)</label>
                                <input style={inputStyle} type="number" value={dYatirim} onChange={e => setDYatirim(e.target.value)} placeholder="Örn: 25000" />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>{window.t('assets.date')}</label>
                                <input style={inputStyle} type="date" value={dTarih} onChange={e => setDTarih(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                <button onClick={() => setDFormAcik(false)} style={btnSecondary}>{window.t('common.cancel')}</button>
                                <button onClick={dKaydet} style={{ ...btnPrimary, background: '#7B1FA2' }}>{dDuzenlenen ? window.t('common.update') : window.t('common.save')}</button>
                            </div>
                        </div>
                    )}

                    {/* Demirbaş Tablosu */}
                    {demirbaslar.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-container-low)' }}>
                                        {[window.t('assets.name'), window.t('assets.category'), window.t('assets.price'), window.t('assets.date'), window.t('common.actions')].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '2px solid var(--surface-container-highest)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {demirbaslar.map((d, i) => (
                                        <tr key={d.id} style={{ borderBottom: '1px solid var(--surface-container-highest)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--enba-dark)' }}>{d.adi}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{ background: 'rgba(123,31,162,0.1)', color: '#6A1B9A', padding: '3px 10px', borderRadius: '1rem', fontSize: '12px', fontWeight: 600 }}>{d.kategori || '—'}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: d.yatirimBedeli ? '#7B1FA2' : 'var(--on-surface-variant)' }}>
                                                {d.yatirimBedeli ? window.fmt(d.yatirimBedeli) + ' ₺' : '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', color: 'var(--on-surface-variant)' }}>
                                                {d.satinaalmaTarihi ? new Date(d.satinaalmaTarihi).toLocaleDateString(localStorage.getItem('enba_lang') === 'TR' ? 'tr-TR' : 'en-US') : '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => dFormAc(d)} title={window.t('common.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-pencil-simple" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}></i></button>
                                                    <button onClick={() => dSil(d.id)} title={window.t('common.delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-trash" style={{ fontSize: '16px', color: '#e53935' }}></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--surface-container-low)', fontWeight: 700 }}>
                                        <td colSpan={2} style={{ padding: '12px 14px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>{window.t('common.total').toUpperCase()}</td>
                                        <td style={{ padding: '12px 14px', color: '#7B1FA2', fontSize: '15px' }}>{window.fmt(toplamDemirbasYatirim)} ₺</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--on-surface-variant)' }}>
                            {window.t('common.no_records')}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                SEKME 3 — BAKIM & ONARIM KAYITLARI
            ══════════════════════════════════════════════════ */}
            {sekme === 'bakim' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button
                            onClick={() => bFormAc()}
                            style={{ ...btnPrimary, background: '#D32F2F' }}
                            disabled={tumVarliklar.length === 0}
                            title={tumVarliklar.length === 0 ? window.t('assets.error_no_assets') : ''}
                        >
                            + {window.t('assets.new_expense')}
                        </button>
                    </div>

                    {tumVarliklar.length === 0 && (
                        <div style={{ ...cardStyle, background: '#FFF3E0', border: '1px solid #FFB300', color: '#E65100', padding: '16px 20px', marginBottom: '20px', fontSize: '14px' }}>
                            ⚠️ {window.t('assets.error_no_assets_warning') || 'Define assets first.'}
                        </div>
                    )}

                    {/* Bakım Formu */}
                    {bFormAcik && (
                        <div style={{ ...cardStyle, marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>{window.t('assets.date')} *</label>
                                <input style={inputStyle} type="date" value={bTarih} onChange={e => setBTarih(e.target.value)} />
                            </div>
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={labelStyle}>{window.t('assets.machinery_invest')} / {window.t('assets.fixtures')} *</label>
                                <select style={inputStyle} value={bVarlikId} onChange={e => setBVarlikId(e.target.value)}>
                                    <option value="">— {window.t('common.select') || 'Select'} —</option>
                                    {makinalar.length > 0 && (
                                        <optgroup label={window.t('assets.machineries')}>
                                            {makinalar.map(m => <option key={m.id} value={m.id}>{m.adi}</option>)}
                                        </optgroup>
                                    )}
                                    {demirbaslar.length > 0 && (
                                        <optgroup label={window.t('assets.fixtures')}>
                                            {demirbaslar.map(d => <option key={d.id} value={d.id}>{d.adi}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={labelStyle}>{window.t('assets.maintenance.type')}</label>
                                <select style={inputStyle} value={bTur} onChange={e => setBTur(e.target.value)}>
                                    {BAKIM_TURLERI.map(t => <option key={t} value={t}>{window.t(`assets.maintenance.${t.toLowerCase().replace(' ', '_')}`) || t}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '2 1 250px' }}>
                                <label style={labelStyle}>{window.t('common.description') || 'Description'}</label>
                                <input style={inputStyle} type="text" value={bAciklama} onChange={e => setBAciklama(e.target.value)} placeholder="Yapılan işlemin kısa açıklaması..." />
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={labelStyle}>{window.t('assets.price')} (₺) *</label>
                                <input style={inputStyle} type="number" value={bMaliyet} onChange={e => setBMaliyet(e.target.value)} placeholder="Örn: 15000" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                <button onClick={() => setBFormAcik(false)} style={btnSecondary}>{window.t('common.cancel')}</button>
                                <button onClick={bKaydet} style={{ ...btnPrimary, background: '#D32F2F' }}>{bDuzenlenen ? window.t('common.update') : window.t('common.save')}</button>
                            </div>
                        </div>
                    )}

                    {/* Bakım Tablosu */}
                    {bakimKayitlari.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-container-low)' }}>
                                        {['Tarih', window.t('assets.name'), window.t('assets.category'), window.t('assets.maintenance.type'), window.t('common.description'), 'Maliyet', window.t('common.actions')].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '2px solid var(--surface-container-highest)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...bakimKayitlari].sort((a, b) => b.tarih.localeCompare(a.tarih)).map((b, i) => (
                                        <tr key={b.id} style={{ borderBottom: '1px solid var(--surface-container-highest)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)' }}>
                                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                                                {b.tarih ? new Date(b.tarih + 'T00:00:00').toLocaleDateString('tr-TR') : '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--enba-dark)', fontSize: '13px' }}>
                                                {b.varlikAdi || '—'}
                                                {b.varlikTuru && <span style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(25,118,210,0.1)', color: '#1565C0', padding: '1px 5px', borderRadius: '4px', fontWeight: 500 }}>{b.varlikTuru}</span>}
                                            </td>
                                            <td style={{ padding: '12px 14px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                                                {b.varlikTuru || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                                                <span style={{ background: 'rgba(211,47,47,0.08)', color: '#C62828', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{b.tur || '—'}</span>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: 'var(--on-surface-variant)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.aciklama || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#C62828', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                {window.fmt(b.maliyet)} ₺
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => bFormAc(b)} title="Düzenle" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-pencil-simple" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}></i></button>
                                                    <button onClick={() => bSil(b.id)} title="Sil" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><i className="ph ph-trash" style={{ fontSize: '16px', color: '#e53935' }}></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--surface-container-low)', fontWeight: 700 }}>
                                        <td colSpan={5} style={{ padding: '12px 14px', color: 'var(--on-surface-variant)', fontSize: '13px' }}>TOPLAM</td>
                                        <td style={{ padding: '12px 14px', color: '#C62828', fontSize: '15px' }}>{window.fmt(toplamBakim)} ₺</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--on-surface-variant)' }}>
                            Henüz bakım/onarım kaydı yok.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

window.MakinaKatalog = MakinaKatalog;

