// ============================================================
//  Enba Recycling — Nakit Akışı Modülü
//  Detaylı İş Planlama Modülü'ndeki aktif planlardan beslenur.
// ============================================================

const AYLAR_CF = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// ── Kredi amortisman tablosu (saf fonksiyon, bileşen dışı) ─────
function hesaplaKrediAmortismani(kredi) {
    const r  = (Number(kredi.faizYillik) || 0) / 12 / 100;
    const P  = Number(kredi.anapara)  || 0;
    const n  = Number(kredi.vadeAy)   || 1;
    const b  = Number(kredi.baslangicAy) || 0;
    const schedule = [];

    if (kredi.tur === 'esit_taksit') {
        const taksit = r > 0 ? P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1) : P / n;
        let kalan = P;
        for (let i = 0; i < n; i++) {
            const faiz = kalan * r;
            const ana  = taksit - faiz;
            schedule.push({ ay: b + i, taksit, anapara: ana, faiz, kalan });
            kalan = Math.max(0, kalan - ana);
        }
    } else {                                        // sabit anapara
        const ana = P / n;
        let kalan = P;
        for (let i = 0; i < n; i++) {
            const faiz = kalan * r;
            schedule.push({ ay: b + i, taksit: ana + faiz, anapara: ana, faiz, kalan });
            kalan = Math.max(0, kalan - ana);
        }
    }
    return schedule;
}

// ── Varsayılan parametreler ────────────────────────────────────
const CF_DEFAULT_PARAMS = {
    baslangicKasasi:    0,
    tahsilatVadesi:     30,  // gün
    tedarikciVadesi:    30,  // gün
    satisNakliyeVadesi: 30,  // gün
    vergiorani:         25,  // %
    vergiPeriyodu:      'ceyreklik',   // 'aylik' | 'ceyreklik' | 'yillik'
    krediler:           [],
    ozkaynakHareketler: []
};

// Gün bazlı kısmi tahsilat/ödeme dağılımı
// 45 gün = 1.5 ay → ay i'deki tahsilat:
//   %50 (floor kısmı) → i-1. ayın gelirinden
//   %50 (kesir kısmı) → i-2. ayın gelirinden
function getByDays(arr, field, monthIdx, days) {
    const dm = (days || 0) / 30;
    const fl = Math.floor(dm);
    const fr = dm - fl;
    let v = 0;
    const i1 = monthIdx - fl;
    const i2 = monthIdx - fl - 1;
    if (i1 >= 0 && arr[i1]) v += (1 - fr) * (arr[i1][field] || 0);
    if (fr > 0 && i2 >= 0 && arr[i2]) v += fr * (arr[i2][field] || 0);
    return v;
}

// ── Ana Bileşen ────────────────────────────────────────────────
function NakitAkisModulu({ aktifPlanlar = [] }) {
    // Seçili plan
    const [seciliPlanId, setSeciliPlanId] = React.useState('');
    const [params, setParamsState] = React.useState({ ...CF_DEFAULT_PARAMS });
    const [loading, setLoading] = React.useState(false);

    // Initial plan selection
    React.useEffect(() => {
        if (aktifPlanlar.length > 0 && !seciliPlanId) {
            setSeciliPlanId(aktifPlanlar[0].id);
        }
    }, [aktifPlanlar]);

    // ── Data Fetching & Sync ─────────────────────────────────
    const loadParams = async (planId) => {
        if (!planId || !window.DataService) return;
        setLoading(true);
        try {
            const p = await window.DataService.getCashFlowParams(planId);
            setParamsState(p || { ...CF_DEFAULT_PARAMS });
        } catch (e) {
            console.error("Parametreler çekilemedi:", e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (seciliPlanId) {
            loadParams(seciliPlanId);

            // Real-time Sync
            if (window.supabaseClient) {
                const channel = window.supabaseClient.channel(`cashflow_${seciliPlanId}`)
                    .on('postgres_changes', { 
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'cashflow_parameters', 
                        filter: `plan_id=eq.${seciliPlanId}` 
                    }, payload => {
                        if (payload.new && payload.new.parameters) {
                            setParamsState(payload.new.parameters);
                        }
                    })
                    .subscribe();
                return () => { window.supabaseClient.removeChannel(channel); };
            }
        }
    }, [seciliPlanId]);

    const setParams = async (updater) => {
        if (!seciliPlanId || !window.DataService) return;
        const newParams = typeof updater === 'function' ? updater(params) : updater;
        setParamsState(newParams); // İyimser güncelleme
        try {
            await window.DataService.saveCashFlowParams(seciliPlanId, newParams);
        } catch (e) {
            console.error("Kaydedilemedi:", e);
            alert("Değişiklikler kaydedilemedi!");
        }
    };

    const seciliPlan = aktifPlanlar.find(p => p.id === seciliPlanId) || null;

    // Sekmeler
    const [sekme, setSekme] = React.useState('parametreler');

    // ── Kredi formu ──────────────────────────────────────────
    const [krediFormAcik, setKrediFormAcik] = React.useState(false);
    const krediFormBos = { ad:'', anapara:'', faizYillik:'', vadeAy:60, baslangicAy:0, tur:'esit_taksit' };
    const [krediForm, setKrediForm] = React.useState(krediFormBos);
    const [krediDuzenlenenId, setKrediDuzenlenenId] = React.useState(null);

    const krediFormAc = (k = null) => {
        if (k) { setKrediDuzenlenenId(k.id); setKrediForm({ ...k }); }
        else    { setKrediDuzenlenenId(null); setKrediForm(krediFormBos); }
        setKrediFormAcik(true);
    };
    const krediKaydet = () => {
        if (!krediForm.ad || !krediForm.anapara) return;
        const entry = { ...krediForm, id: krediDuzenlenenId || 'krd_' + Date.now() };
        setParams(p => ({
            ...p,
            krediler: krediDuzenlenenId
                ? p.krediler.map(x => x.id === krediDuzenlenenId ? entry : x)
                : [...(p.krediler||[]), entry]
        }));
        setKrediFormAcik(false);
    };
    const krediSil = (id) => {
        setParams(p => ({ ...p, krediler: p.krediler.filter(x => x.id !== id) }));
    };

    // ── Öz kaynak / ek nakit formu ───────────────────────────
    const [ozFormAcik, setOzFormAcik] = React.useState(false);
    const ozFormBos = { ay:0, aciklama:'', tutar:'', tur:'giris' };
    const [ozForm, setOzForm] = React.useState(ozFormBos);
    const [ozDuzenlenenId, setOzDuzenlenenId] = React.useState(null);

    const ozFormAc = (h = null) => {
        if (h) { setOzDuzenlenenId(h.id); setOzForm({ ...h }); }
        else    { setOzDuzenlenenId(null); setOzForm(ozFormBos); }
        setOzFormAcik(true);
    };
    const ozKaydet = () => {
        if (!ozForm.tutar) return;
        const entry = { ...ozForm, id: ozDuzenlenenId || 'oz_' + Date.now() };
        setParams(p => ({
            ...p,
            ozkaynakHareketler: ozDuzenlenenId
                ? p.ozkaynakHareketler.map(x => x.id === ozDuzenlenenId ? entry : x)
                : [...(p.ozkaynakHareketler||[]), entry]
        }));
        setOzFormAcik(false);
    };
    const ozSil = (id) => {
        setParams(p => ({ ...p, ozkaynakHareketler: p.ozkaynakHareketler.filter(x => x.id !== id) }));
    };

    // ── Nakit Akışı Hesabı ───────────────────────────────────
    const nakitAkisi = React.useMemo(() => {
        if (!seciliPlan) return [];
        const { aylikSonuclar, aylikAmortismanlar, hesaplanmisAyVerileri, yatirimlar,
                baslangicAyi, baslangicYili } = seciliPlan;
        if (!aylikSonuclar || aylikSonuclar.length !== 12) return [];

        const { tahsilatVadesi, tedarikciVadesi, satisNakliyeVadesi,
                vergiorani, vergiPeriyodu, krediler, ozkaynakHareketler } = params;

        // CAPEX → ödeme ayı: erteleme ayında peşin
        const capexByMonth = Array(12).fill(0);
        (yatirimlar || []).forEach(y => {
            const m = Math.max(0, Math.min(11, Number(y.erteleme) || 0));
            capexByMonth[m] += (Number(y.maliyet) || 0);
        });

        // Kredi hareketleri
        const krediCekim    = Array(12).fill(0);
        const krediAnapara  = Array(12).fill(0);
        const krediFaiz     = Array(12).fill(0);
        (krediler || []).forEach(krd => {
            const startM = Math.min(11, Number(krd.baslangicAy) || 0);
            if (startM >= 0) krediCekim[startM] += Number(krd.anapara) || 0;
            hesaplaKrediAmortismani(krd).forEach(s => {
                if (s.ay >= 0 && s.ay < 12) {
                    krediAnapara[s.ay] += s.anapara;
                    krediFaiz[s.ay]    += s.faiz;
                }
            });
        });

        // Öz kaynak / diğer nakit girişleri
        const ozkaynakAy = Array(12).fill(0);
        (ozkaynakHareketler || []).forEach(h => {
            const m = Number(h.ay) || 0;
            if (m >= 0 && m < 12)
                ozkaynakAy[m] += (h.tur === 'giris' ? 1 : -1) * (Number(h.tutar) || 0);
        });

        // Vergi hesabı (kümülatif net kâr üzerinden)
        const vergiAy = Array(12).fill(0);
        if (vergiorani > 0) {
            let cumNet = 0;
            const cumNetArr = aylikSonuclar.map((s, i) => {
                cumNet += s.ebitda - (aylikAmortismanlar?.[i] || 0);
                return cumNet;
            });
            if (vergiPeriyodu === 'yillik') {
                if (cumNetArr[11] > 0) vergiAy[11] = cumNetArr[11] * vergiorani / 100;
            } else if (vergiPeriyodu === 'ceyreklik') {
                [2, 5, 8, 11].forEach((m, qi) => {
                    const prev = qi === 0 ? 0 : cumNetArr[[2,5,8,11][qi-1]];
                    const karlilik = cumNetArr[m] - prev;
                    if (karlilik > 0) vergiAy[m] = karlilik * vergiorani / 100;
                });
            } else {
                aylikSonuclar.forEach((s, i) => {
                    const net = s.ebitda - (aylikAmortismanlar?.[i] || 0);
                    if (net > 0) vergiAy[i] = net * vergiorani / 100;
                });
            }
        }

        // Aylık nakit akışı
        const sonuclar = [];
        let kasa = Number(params.baslangicKasasi) || 0;

        for (let i = 0; i < 12; i++) {
            const gercekAy  = (baslangicAyi + i) % 12;
            const gercekYil = baslangicYili + Math.floor((baslangicAyi + i) / 12);
            const ayData    = hesaplanmisAyVerileri?.[i];

            // Operasyonel girişler (gün bazlı kısmi dağılım)
            const musteriTahsilat   = getByDays(aylikSonuclar, 'gelir',        i, tahsilatVadesi);
            // Operasyonel çıkışlar
            const malOdeme          = getByDays(aylikSonuclar, 'alisGideri',   i, tedarikciVadesi);
            const alisNakliyeOdeme  = getByDays(aylikSonuclar, 'alisNakliye',  i, tedarikciVadesi);
            const satisNakliyeOdeme = getByDays(aylikSonuclar, 'satisNakliye', i, satisNakliyeVadesi);

            // Personel (peşin)
            let personelOdeme = 0;
            ['450','455','480'].forEach(k => { personelOdeme += Number(ayData?.giderler?.[k] || 0); });

            // Enerji/malzeme (peşin)
            let enerjiMalzeme = 0;
            ['405','410','415','315'].forEach(k => { enerjiMalzeme += Number(ayData?.giderler?.[k] || 0); });

            // Diğer giderler (peşin)
            const ATLA = new Set(['305','301','302','315','405','410','415','450','455','480','109']);
            let digerGider = 0;
            Object.keys(ayData?.giderler || {}).forEach(k => {
                if (!ATLA.has(k)) digerGider += Number(ayData.giderler[k] || 0);
            });

            const toplamCikis = malOdeme + alisNakliyeOdeme + satisNakliyeOdeme +
                                personelOdeme + enerjiMalzeme + digerGider;

            const operasyonel  = musteriTahsilat - toplamCikis;
            const yatirim      = -capexByMonth[i];
            const finansman    = krediCekim[i] - krediAnapara[i] - krediFaiz[i] + ozkaynakAy[i];
            const vergi        = -vergiAy[i];
            const netNakit     = operasyonel + yatirim + finansman + vergi;

            const donemBasi    = kasa;
            kasa += netNakit;

            sonuclar.push({
                i, gercekAy, gercekYil,
                donemBasi,
                // Girişşler
                musteriTahsilat,
                krediCekim:     krediCekim[i],
                ozkaynakGirişs:  Math.max(0, ozkaynakAy[i]),
                // Çıkışlar
                malOdeme, alisNakliyeOdeme, satisNakliyeOdeme,
                personelOdeme, enerjiMalzeme, digerGider,
                toplamCikis,
                krediAnapara:   krediAnapara[i],
                krediFaiz:      krediFaiz[i],
                capexOdeme:     capexByMonth[i],
                vergiOdeme:     vergiAy[i],
                // Toplamlar
                operasyonel, yatirim, finansman, vergi, netNakit,
                donemSonu: kasa
            });
        }
        return sonuclar;
    }, [seciliPlan, params]);

    // ── 5 Yıl Projeksiyonu ───────────────────────────────────
    const proj5Yil = React.useMemo(() => {
        if (!seciliPlan?.projeksiyon) return [];
        const { projeksiyon, aylikAmortismanlar, yatirimlar } = seciliPlan;
        const { vergiorani, krediler } = params;
        const yillikAmor = (aylikAmortismanlar || []).reduce((t, a) => t + a, 0);

        return projeksiyon.map((p, yi) => {
            const vergi = p.net > 0 ? p.net * vergiorani / 100 : 0;
            const operasyonelCF = p.ebitda - vergi;

            // Kredi servisi bu yıl (ay 12*yi .. 12*(yi+1)-1)
            let krediServis = 0;
            (krediler || []).forEach(krd => {
                hesaplaKrediAmortismani(krd).forEach(s => {
                    if (s.ay >= yi*12 && s.ay < (yi+1)*12) krediServis += s.taksit;
                });
            });

            // CAPEX sadece yıl 0'da
            const capex = yi === 0
                ? (yatirimlar || []).reduce((t, y) => t + (Number(y.maliyet)||0), 0)
                : 0;

            const netCF = operasyonelCF - krediServis - capex;

            return { yil: p.yil, gelir: p.gelir, ebitda: p.ebitda, amortisman: yillikAmor,
                     net: p.net, vergi, operasyonelCF, krediServis, capex, netCF };
        });
    }, [seciliPlan, params]);

    // ── Özet metrikler ───────────────────────────────────────
    const kasaBakiyeleri = nakitAkisi.map(a => a.donemSonu);
    const minKasa        = kasaBakiyeleri.length ? Math.min(...kasaBakiyeleri) : 0;
    const sonKasa        = kasaBakiyeleri.length ? kasaBakiyeleri[kasaBakiyeleri.length-1] : 0;
    const negAylar       = kasaBakiyeleri.filter(k => k < 0).length;
    const toplamKrediOdeme = nakitAkisi.reduce((t, a) => t + a.krediAnapara + a.krediFaiz, 0);
    const onerilKasa     = minKasa < 0 ? Math.ceil((-minKasa) / 10000) * 10000 : 0;

    // ── Stiller ─────────────────────────────────────────────
    const cardStyle = {
        background:'var(--surface-container-lowest)', padding:'20px',
        borderRadius:'1.2rem', border:'1px solid var(--surface-container-highest)',
        boxShadow:'var(--shadow-sm)'
    };
    const inputStyle = {
        width:'100%', padding:'10px 14px', borderRadius:'0.75rem',
        border:'1px solid var(--surface-container-highest)', outline:'none',
        boxSizing:'border-box', fontSize:'14px',
        background:'var(--surface-container-low)', color:'var(--on-surface)'
    };
    const labelStyle = {
        fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)',
        textTransform:'uppercase', display:'block', marginBottom:'6px', letterSpacing:'0.5px'
    };
    const btnPrimary   = { padding:'10px 20px', background:'var(--enba-dark)', color:'#fff', border:'none', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', fontSize:'14px' };
    const btnSecondary = { padding:'10px 14px', background:'var(--surface-container-high)', border:'none', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', fontSize:'14px' };

    const SekmeBtn = ({ id, label }) => (
        <button onClick={() => setSekme(id)} style={{
            padding:'10px 22px', borderRadius:'2rem', border:'none',
            background: sekme === id ? 'var(--enba-dark)' : 'var(--surface-container-high)',
            color:      sekme === id ? '#fff' : 'var(--on-surface-variant)',
            fontWeight:700, fontSize:'14px', cursor:'pointer', transition:'all 0.18s'
        }}>{label}</button>
    );

    const fmt = window.fmt || (v => Number(v||0).toLocaleString('tr-TR', {maximumFractionDigits:0}));
    const fmtS = (v) => `${v>=0?'+':''}${fmt(v)}`;

    // ── Boş durum ────────────────────────────────────────────
    if (aktifPlanlar.length === 0) {
        return (
            <div style={{ padding:'60px 40px', textAlign:'center', fontFamily:"'Inter', sans-serif" }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚡ </div>
                <h2 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', marginBottom:'12px' }}>
                    Aktif İş Planı Bulunamadı
                </h2>
                <p style={{ color:'var(--on-surface-variant)', maxWidth:'480px', margin:'0 auto' }}>
                    Nakit akışı modülü, Detaylı İş Planlama Modülü'ndeki <strong>aktif</strong> planlardan beslenir.
                    Önce bir plan oluşturup aktif hale getirin.
                </p>
            </div>
        );
    }

    // ── Cash Balance SVG Chart ───────────────────────────────
    const CashChart = () => {
        if (!nakitAkisi.length) return null;
        const values = nakitAkisi.map(a => a.donemSonu);
        const allVals = [params.baslangicKasasi || 0, ...values];
        const maxV = Math.max(...allVals, 0);
        const minV = Math.min(...allVals, 0);
        const range = maxV - minV || 1;

        const W = 1200, H = 200, padL = 20, padR = 20, padT = 20, padB = 30;
        const innerH = H - padT - padB;
        const innerW = W - padL - padR;
        const barW   = innerW / 12;
        const zeroY  = padT + innerH * (1 - (-minV / range));

        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'180px' }} preserveAspectRatio="none">
                {/* Zero line */}
                <line x1={padL} y1={zeroY} x2={W-padR} y2={zeroY} stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />

                {nakitAkisi.map((a, i) => {
                    const v    = a.donemSonu;
                    const barH = Math.abs(v / range) * innerH;
                    const x    = padL + i * barW + barW * 0.1;
                    const w    = barW * 0.8;
                    const y    = v >= 0 ? zeroY - barH : zeroY;
                    const fill = v >= 0 ? '#27ae60' : '#e74c3c';
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={w} height={barH} fill={fill} rx="2" opacity="0.85" />
                            <text
                                x={x + w/2} y={v >= 0 ? y - 4 : y + barH + 14}
                                textAnchor="middle" fontSize="28" fill={fill} fontWeight="700"
                            >{fmt(Math.round(v/1000))}K</text>
                            <text
                                x={x + w/2} y={H - 4}
                                textAnchor="middle" fontSize="26" fill="#888"
                            >{AYLAR_CF[(a.gercekAy)]?.slice(0,3)}</text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    // ── RENDER ───────────────────────────────────────────────
    return (
        <div style={{ padding:'32px 40px', maxWidth:'1180px', margin:'0 auto', fontFamily:"'Inter', sans-serif", opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {loading && (
                <div style={{ position:'fixed', top:'20px', right:'20px', background:'var(--enba-orange)', color:'#fff', padding:'8px 16px', borderRadius:'1rem', fontSize:'12px', fontWeight:700, zIndex:1000, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                    ⚡  Senkronize ediliyor...
                </div>
            )}

            {/* Başlık */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
                <div>
                    <h1 style={{ fontFamily:"'Manrope', sans-serif", fontSize:'26px', color:'var(--enba-dark)', margin:'0 0 6px' }}>
                        ⚡  Nakit Akışı Planlama
                    </h1>
                    <p style={{ margin:0, color:'var(--on-surface-variant)', fontSize:'14px' }}>
                        İş planı verilerini nakit akışı tahsilatlarıyla birleştirerek kasa projeksiyonu oluşturun.
                    </p>
                </div>

                {/* Plan seçimi */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <label style={{ ...labelStyle, margin:0 }}>İş Planı:</label>
                    <select value={seciliPlanId} onChange={e => setSeciliPlanId(e.target.value)}
                        style={{ ...inputStyle, width:'auto', minWidth:'220px' }}>
                        {aktifPlanlar.map(p => <option key={p.id} value={p.id}>{p.baslik}</option>)}
                    </select>
                </div>
            </div>

            {/* Özet Kartlar */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'14px', marginBottom:'24px' }}>
                {[
                    { baslik:'Başlangıç Kasası',   deger: params.baslangicKasasi || 0, renk:'#1565C0', alt: 'Plan başı nakit' },
                    { baslik:'Dönem Sonu Kasası',   deger: sonKasa,   renk: sonKasa >= 0 ? '#2E7D32' : '#C62828', alt: '12. ay sonu' },
                    { baslik:'En Düşük Kasa',       deger: minKasa,   renk: minKasa < 0 ? '#C62828' : '#2E7D32',  alt: 'Kritik ay değeri' },
                    { baslik:'Negatif Ay Sayısı',   deger: negAylar,  renk: negAylar > 0 ? '#E65100' : '#2E7D32', alt: 'Kasa eksi olan ay', birim:' ay', fmt: v => v },
                    { baslik:'Toplam Kredi Servisi', deger: toplamKrediOdeme, renk:'#6A1B9A', alt: '12 ay anapara+faiz' },
                ].map((k, i) => (
                    <div key={i} style={{ ...cardStyle, borderTop:`3px solid ${k.renk}` }}>
                        <div style={{ fontSize:'11px', fontWeight:600, color:'var(--on-surface-variant)', textTransform:'uppercase', marginBottom:'8px', letterSpacing:'0.5px' }}>{k.baslik}</div>
                        <div style={{ fontSize:'21px', fontWeight:800, color:k.renk, fontFamily:"'Manrope', sans-serif" }}>
                            {(k.fmt || fmt)(k.deger)}{k.birim || ' ₺'}
                        </div>
                        <div style={{ fontSize:'12px', color:'var(--on-surface-variant)', marginTop:'4px' }}>{k.alt}</div>
                    </div>
                ))}
            </div>

            {/* Uyarı: negatif kasa */}
            {minKasa < 0 && (
                <div style={{ background:'#FFF3E0', border:'1px solid #FFB300', borderRadius:'1rem', padding:'14px 20px', marginBottom:'20px', fontSize:'14px', color:'#E65100', display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'20px' }}>⚠️</span>
                    <span>
                        <strong>{nakitAkisi.filter(a=>a.donemSonu<0).length} ayda kasa negatife düşüyor.</strong>
                        {' '}Bunu önlemek için başlangıç kasasını en az <strong>{fmt(onerilKasa)} ₺</strong> artırın veya kredi/öz kaynak girişi ekleyin.
                    </span>
                </div>
            )}

            {/* Sekmeler */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
                <SekmeBtn id="parametreler" label="⚙️ Parametreler" />
                <SekmeBtn id="aylik"        label="⚡  Aylık Nakit Akışı" />
                <SekmeBtn id="projeksiyon"  label="⚡  5 Yıl Projeksiyonu" />
            </div>

            {/* ═══════════════════════════════════════════════
                SEKME 1 — PARAMETRELER
            ═══════════════════════════════════════════════ */}
            {sekme === 'parametreler' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

                    {/* Başlangıç kasası + vade */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:'0 0 20px', fontSize:'16px' }}>⚡  Temel Nakit Parametreleri</h3>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>

                            {/* Başlangıç Kasası */}
                            <div style={{ flex:'1 1 200px' }}>
                                <label style={labelStyle}>Başlangıç Kasası (₺)</label>
                                <input type="number" style={inputStyle} value={params.baslangicKasasi}
                                    onChange={e => setParams(p => ({ ...p, baslangicKasasi: Number(e.target.value)||0 }))}
                                    placeholder="Örn: 500000" onFocus={window.selectOnFocus} />
                            </div>

                            {/* Vade girişi — yardımcı bileşen */}
                            {[
                                { key:'tahsilatVadesi',     label:'Müşteri Tahsilat Vadesi' },
                                { key:'tedarikciVadesi',    label:'Tedarikçi Ödeme Vadesi' },
                                { key:'satisNakliyeVadesi', label:'Satış Nakliye Vadesi' },
                            ].map(({ key, label }) => {
                                const gun   = Number(params[key]) || 0;
                                const dm    = gun / 30;
                                const fl    = Math.floor(dm);
                                const fr    = Math.round((dm - fl) * 100);
                                const PRESETS = [0, 15, 30, 45, 60, 90];
                                let aciklama;
                                if (gun === 0)      aciklama = 'Peşin tahsilat / ödeme';
                                else if (fr === 0)  aciklama = `${fl} ay sonra tam tahsilat`;
                                else                aciklama = `${fl} ay: %${100-fr} + ${fl+1} ay: %${fr}`;
                                return (
                                    <div key={key} style={{ flex:'1 1 200px' }}>
                                        <label style={labelStyle}>{label}</label>
                                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                            <input
                                                type="number" min={0} max={180} step={1}
                                                style={{ ...inputStyle, width:'80px', flexShrink:0 }}
                                                value={gun}
                                                onChange={e => setParams(p => ({ ...p, [key]: Math.max(0, Number(e.target.value)||0) }))}
                                                onFocus={window.selectOnFocus}
                                            />
                                            <span style={{ fontSize:'13px', color:'var(--on-surface-variant)', flexShrink:0 }}>gün</span>
                                        </div>
                                        {/* Hızlı seçim */}
                                        <div style={{ display:'flex', gap:'4px', marginTop:'6px', flexWrap:'wrap' }}>
                                            {PRESETS.map(p => (
                                                <button key={p}
                                                    onClick={() => setParams(pr => ({ ...pr, [key]: p }))}
                                                    style={{
                                                        padding:'3px 9px', fontSize:'11px', fontWeight:700,
                                                        borderRadius:'1rem', border:'1px solid',
                                                        cursor:'pointer',
                                                        background: gun === p ? 'var(--enba-dark)' : 'transparent',
                                                        borderColor: gun === p ? 'var(--enba-dark)' : 'var(--surface-container-highest)',
                                                        color: gun === p ? '#fff' : 'var(--on-surface-variant)',
                                                    }}
                                                >{p === 0 ? 'Peşin' : p + 'g'}</button>
                                            ))}
                                        </div>
                                        {/* Açıklama */}
                                        <div style={{ fontSize:'11px', color:'var(--on-surface-variant)', marginTop:'5px', fontStyle:'italic' }}>
                                            {aciklama}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Vergi */}
                    <div style={{ ...cardStyle }}>
                        <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:'0 0 20px', fontSize:'16px' }}>⚡ ️ Kurumlar Vergisi</h3>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>
                            <div style={{ flex:'1 1 180px' }}>
                                <label style={labelStyle}>Vergi Oranı (%)</label>
                                <input type="number" style={inputStyle} value={params.vergiorani} min={0} max={100}
                                    onChange={e => setParams(p => ({ ...p, vergiorani: Number(e.target.value)||0 }))} onFocus={window.selectOnFocus} />
                            </div>
                            <div style={{ flex:'1 1 180px' }}>
                                <label style={labelStyle}>Ödeme Periyodu</label>
                                <select style={inputStyle} value={params.vergiPeriyodu}
                                    onChange={e => setParams(p => ({ ...p, vergiPeriyodu: e.target.value }))}>
                                    <option value="aylik">Aylık</option>
                                    <option value="ceyreklik">Çeyreklik (3 Ayda Bir)</option>
                                    <option value="yillik">Yıllık</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Krediler */}
                    <div style={{ ...cardStyle }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                            <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:0, fontSize:'16px' }}>⚡  Kredi ve Finansman</h3>
                            <button onClick={() => krediFormAc()} style={btnPrimary}>+ Kredi Ekle</button>
                        </div>

                        {krediFormAcik && (
                            <div style={{ background:'var(--surface-container-low)', padding:'20px', borderRadius:'1rem', marginBottom:'16px', display:'flex', flexWrap:'wrap', gap:'14px', alignItems:'flex-end' }}>
                                <div style={{ flex:'1 1 180px' }}>
                                    <label style={labelStyle}>Kredi Adı</label>
                                    <input type="text" style={inputStyle} value={krediForm.ad}
                                        onChange={e => setKrediForm(p=>({...p, ad:e.target.value}))} placeholder="Örn: Makina Kredisi" onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 150px' }}>
                                    <label style={labelStyle}>Anapara (₺)</label>
                                    <input type="number" style={inputStyle} value={krediForm.anapara}
                                        onChange={e => setKrediForm(p=>({...p, anapara:e.target.value}))} placeholder="Örn: 2000000" onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 130px' }}>
                                    <label style={labelStyle}>Yıllık Faiz (%)</label>
                                    <input type="number" style={inputStyle} value={krediForm.faizYillik}
                                        onChange={e => setKrediForm(p=>({...p, faizYillik:e.target.value}))} placeholder="Örn: 48" onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 120px' }}>
                                    <label style={labelStyle}>Vade (Ay)</label>
                                    <input type="number" style={inputStyle} value={krediForm.vadeAy}
                                        onChange={e => setKrediForm(p=>({...p, vadeAy:Number(e.target.value)}))} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 130px' }}>
                                    <label style={labelStyle}>Çekim Ayı (0-11)</label>
                                    <select style={inputStyle} value={krediForm.baslangicAy}
                                        onChange={e => setKrediForm(p=>({...p, baslangicAy:Number(e.target.value)}))}>
                                        {Array.from({length:12},(_,i)=><option key={i} value={i}>{`Ay ${i+1} — ${AYLAR_CF[(((seciliPlan?.baslangicAyi||0)+i)%12)]}`}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex:'1 1 150px' }}>
                                    <label style={labelStyle}>Geri Ödeme Tipi</label>
                                    <select style={inputStyle} value={krediForm.tur}
                                        onChange={e => setKrediForm(p=>({...p, tur:e.target.value}))}>
                                        <option value="esit_taksit">Eşit Taksit</option>
                                        <option value="sabit_anapara">Sabit Anapara</option>
                                    </select>
                                </div>
                                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                                    <button onClick={()=>setKrediFormAcik(false)} style={btnSecondary}>İptal</button>
                                    <button onClick={krediKaydet} style={btnPrimary}>{krediDuzenlenenId?'Güncelle':'Kaydet'}</button>
                                </div>
                            </div>
                        )}

                        {(params.krediler||[]).length > 0 ? (
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                                <thead>
                                    <tr style={{ background:'var(--surface-container-low)' }}>
                                        {['Kredi Adı','Anapara','Faiz %/Yıl','Vade','Çekim Ayı','Tip','Aylık Taksit','İşlem'].map(h=>(
                                            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--on-surface-variant)', textTransform:'uppercase', borderBottom:'2px solid var(--surface-container-highest)', whiteSpace:'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {params.krediler.map(krd => {
                                        const sch = hesaplaKrediAmortismani(krd);
                                        const ilkTaksit = sch[0]?.taksit || 0;
                                        return (
                                            <tr key={krd.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                                <td style={{ padding:'10px 12px', fontWeight:600 }}>{krd.ad}</td>
                                                <td style={{ padding:'10px 12px' }}>{fmt(krd.anapara)} ₺</td>
                                                <td style={{ padding:'10px 12px' }}>%{krd.faizYillik}</td>
                                                <td style={{ padding:'10px 12px' }}>{krd.vadeAy} ay</td>
                                                <td style={{ padding:'10px 12px' }}>Ay {Number(krd.baslangicAy)+1}</td>
                                                <td style={{ padding:'10px 12px' }}>{krd.tur === 'esit_taksit' ? 'Eşit Taksit' : 'Sabit Ana.'}</td>
                                                <td style={{ padding:'10px 12px', fontWeight:700, color:'#6A1B9A' }}>{fmt(Math.round(ilkTaksit))} ₺</td>
                                                <td style={{ padding:'10px 12px' }}>
                                                    <button onClick={()=>krediFormAc(krd)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px' }}>✏️</button>
                                                    <button onClick={()=>krediSil(krd.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px' }}>⚡ ️</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color:'var(--on-surface-variant)', fontSize:'14px', margin:0 }}>Henüz kredi eklenmedi.</p>
                        )}
                    </div>

                    {/* Öz Kaynak / Diğer Nakit */}
                    <div style={{ ...cardStyle }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                            <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:0, fontSize:'16px' }}>⚡  Öz Kaynak ve Diğer Nakit Hareketleri</h3>
                            <button onClick={() => ozFormAc()} style={{ ...btnPrimary, background:'#2E7D32' }}>+ Hareket Ekle</button>
                        </div>

                        {ozFormAcik && (
                            <div style={{ background:'var(--surface-container-low)', padding:'20px', borderRadius:'1rem', marginBottom:'16px', display:'flex', flexWrap:'wrap', gap:'14px', alignItems:'flex-end' }}>
                                <div style={{ flex:'1 1 130px' }}>
                                    <label style={labelStyle}>Ay</label>
                                    <select style={inputStyle} value={ozForm.ay}
                                        onChange={e => setOzForm(p=>({...p, ay:Number(e.target.value)}))}>
                                        {Array.from({length:12},(_,i)=><option key={i} value={i}>{`Ay ${i+1} — ${AYLAR_CF[(((seciliPlan?.baslangicAyi||0)+i)%12)]}`}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex:'2 1 200px' }}>
                                    <label style={labelStyle}>Açıklama</label>
                                    <input type="text" style={inputStyle} value={ozForm.aciklama}
                                        onChange={e => setOzForm(p=>({...p, aciklama:e.target.value}))} placeholder="Örn: Ortak sermaye girişi" onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 140px' }}>
                                    <label style={labelStyle}>Tutar (₺)</label>
                                    <input type="number" style={inputStyle} value={ozForm.tutar}
                                        onChange={e => setOzForm(p=>({...p, tutar:e.target.value}))} onFocus={window.selectOnFocus} />
                                </div>
                                <div style={{ flex:'1 1 140px' }}>
                                    <label style={labelStyle}>Tür</label>
                                    <select style={inputStyle} value={ozForm.tur}
                                        onChange={e => setOzForm(p=>({...p, tur:e.target.value}))}>
                                        <option value="giris">Nakit Girişşi (+)</option>
                                        <option value="cikis">Nakit Çıkışı (−)</option>
                                    </select>
                                </div>
                                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                                    <button onClick={()=>setOzFormAcik(false)} style={btnSecondary}>İptal</button>
                                    <button onClick={ozKaydet} style={{ ...btnPrimary, background:'#2E7D32' }}>{ozDuzenlenenId?'Güncelle':'Kaydet'}</button>
                                </div>
                            </div>
                        )}

                        {(params.ozkaynakHareketler||[]).length > 0 ? (
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                                <thead>
                                    <tr style={{ background:'var(--surface-container-low)' }}>
                                        {['Ay','Açıklama','Tutar','Tür','İşlem'].map(h=>(
                                            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--on-surface-variant)', textTransform:'uppercase', borderBottom:'2px solid var(--surface-container-highest)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {params.ozkaynakHareketler.map(h => (
                                        <tr key={h.id} style={{ borderBottom:'1px solid var(--surface-container-highest)' }}>
                                            <td style={{ padding:'10px 12px' }}>Ay {Number(h.ay)+1} — {AYLAR_CF[(((seciliPlan?.baslangicAyi||0)+Number(h.ay))%12)]}</td>
                                            <td style={{ padding:'10px 12px' }}>{h.aciklama||'—'}</td>
                                            <td style={{ padding:'10px 12px', fontWeight:700, color: h.tur==='giris'?'#2E7D32':'#C62828' }}>{h.tur==='giris'?'+':'-'}{fmt(h.tutar)} ₺</td>
                                            <td style={{ padding:'10px 12px' }}><span style={{ background: h.tur==='giris'?'#E8F5E9':'#FFEBEE', color:h.tur==='giris'?'#2E7D32':'#C62828', padding:'2px 10px', borderRadius:'1rem', fontSize:'12px', fontWeight:700 }}>{h.tur==='giris'?'Girişş':'Çıkış'}</span></td>
                                            <td style={{ padding:'10px 12px' }}>
                                                <button onClick={()=>ozFormAc(h)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px' }}>✏️</button>
                                                <button onClick={()=>ozSil(h.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px' }}>⚡ ️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color:'var(--on-surface-variant)', fontSize:'14px', margin:0 }}>Henüz ek nakit hareketi eklenmedi.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                SEKME 2 — AYLIK NAKİT AKIŞI
            ═══════════════════════════════════════════════ */}
            {sekme === 'aylik' && (
                <div>
                    {/* Chart */}
                    <div style={{ ...cardStyle, marginBottom:'24px' }}>
                        <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:'0 0 4px', fontSize:'16px' }}>Dönem Sonu Nakit Bakiyesi</h3>
                        <p style={{ color:'var(--on-surface-variant)', fontSize:'12px', margin:'0 0 16px' }}>Değerler: Bin TL (K)</p>
                        <CashChart />
                    </div>

                    {/* Detay Tablosu */}
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'900px' }}>
                            <thead>
                                <tr style={{ background:'var(--enba-dark)', color:'#fff' }}>
                                    <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, fontSize:'12px', position:'sticky', left:0, background:'var(--enba-dark)', whiteSpace:'nowrap' }}>Kalem</th>
                                    {nakitAkisi.map(a => (
                                        <th key={a.i} style={{ padding:'10px 8px', textAlign:'right', fontWeight:700, fontSize:'12px', whiteSpace:'nowrap' }}>
                                            {AYLAR_CF[a.gercekAy]?.slice(0,3)}<br/>
                                            <span style={{ fontSize:'10px', opacity:0.75 }}>{a.gercekYil}</span>
                                        </th>
                                    ))}
                                    <th style={{ padding:'10px 8px', textAlign:'right', fontWeight:700, fontSize:'12px', background:'rgba(255,255,255,0.1)', whiteSpace:'nowrap' }}>TOPLAM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Dönem Başı */}
                                {[
                                    { label:'Dönem Başı Nakit', field:'donemBasi', bg:'#E3F2FD', color:'#1565C0', bold:true },
                                    null,
                                    { label:'▸ Müşteri Tahsilatları', field:'musteriTahsilat', bg:'#E8F5E9', color:'#2E7D32' },
                                    { label:'▸ Kredi Çekimi', field:'krediCekim', bg:'#E8F5E9', color:'#2E7D32' },
                                    { label:'▸ Öz Kaynak Girişşi', field:'ozkaynakGirişs', bg:'#E8F5E9', color:'#2E7D32' },
                                    { label:'TOPLAM GİRİŞ', field:'_giris', bg:'#C8E6C9', color:'#1B5E20', bold:true },
                                    null,
                                    { label:'▸ Mal Alım Ödemesi', field:'malOdeme', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Alış Nakliye', field:'alisNakliyeOdeme', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Satış Nakliye', field:'satisNakliyeOdeme', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Personel Ödemeleri', field:'personelOdeme', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Enerji & Malzeme', field:'enerjiMalzeme', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Diğer Operasyonel', field:'digerGider', bg:'#FFEBEE', color:'#C62828', minus:true },
                                    { label:'▸ Kredi Anapara', field:'krediAnapara', bg:'#FCE4EC', color:'#880E4F', minus:true },
                                    { label:'▸ Kredi Faizi', field:'krediFaiz', bg:'#FCE4EC', color:'#880E4F', minus:true },
                                    { label:'▸ CAPEX Ödemesi', field:'capexOdeme', bg:'#EDE7F6', color:'#4527A0', minus:true },
                                    { label:'▸ Vergi Ödemesi', field:'vergiOdeme', bg:'#FFF3E0', color:'#E65100', minus:true },
                                    { label:'TOPLAM ÇIKIŞ', field:'_cikis', bg:'#FFCDD2', color:'#B71C1C', bold:true, minus:true },
                                    null,
                                    { label:'NET NAKİT DEĞİŞİMİ', field:'netNakit', bg:'#F3E5F5', color:'#6A1B9A', bold:true, signed:true },
                                    { label:'DÖNEM SONU NAKİT', field:'donemSonu', bg:'#E3F2FD', color:'#0D47A1', bold:true },
                                ].map((row, ri) => {
                                    if (!row) return (
                                        <tr key={`sep${ri}`}><td colSpan={nakitAkisi.length+2} style={{ height:'6px', background:'var(--surface-container-low)' }}></td></tr>
                                    );
                                    const total = row.field === '_giris'
                                        ? nakitAkisi.reduce((t,a)=>t+a.musteriTahsilat+a.krediCekim+a.ozkaynakGirişs,0)
                                        : row.field === '_cikis'
                                        ? nakitAkisi.reduce((t,a)=>t+a.toplamCikis+a.krediAnapara+a.krediFaiz+a.capexOdeme+a.vergiOdeme,0)
                                        : nakitAkisi.reduce((t,a)=>t+(a[row.field]||0),0);
                                    return (
                                        <tr key={ri} style={{ background: row.bg, borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding:'9px 12px', fontWeight: row.bold?700:400, color:row.color, fontSize:'13px', position:'sticky', left:0, background:row.bg, whiteSpace:'nowrap' }}>{row.label}</td>
                                            {nakitAkisi.map(a => {
                                                const v = row.field === '_giris'
                                                    ? a.musteriTahsilat+a.krediCekim+a.ozkaynakGirişs
                                                    : row.field === '_cikis'
                                                    ? a.toplamCikis+a.krediAnapara+a.krediFaiz+a.capexOdeme+a.vergiOdeme
                                                    : (a[row.field]||0);
                                                const show = v !== 0;
                                                return (
                                                    <td key={a.i} style={{ padding:'9px 8px', textAlign:'right', fontWeight:row.bold?700:400, color: row.signed?(v>=0?'#2E7D32':'#C62828'):row.color, fontSize:'13px' }}>
                                                        {show ? (row.minus?'-':row.signed?fmtS(v):'')+fmt(Math.abs(v)) : '—'}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding:'9px 8px', textAlign:'right', fontWeight:700, color:row.signed?(total>=0?'#2E7D32':'#C62828'):row.color, fontSize:'13px', background:'rgba(0,0,0,0.04)', whiteSpace:'nowrap' }}>
                                                {(row.minus?'-':row.signed?fmtS(total):'')+fmt(Math.abs(total))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                SEKME 3 — 5 YIL PROJEKSİYONU
            ═══════════════════════════════════════════════ */}
            {sekme === 'projeksiyon' && (
                <div>
                    <div style={{ ...cardStyle, marginBottom:'20px' }}>
                        <p style={{ margin:0, color:'var(--on-surface-variant)', fontSize:'13px' }}>
                            Operasyonel nakit akışı = FAVÖK − Kurumlar Vergisi. Kredi servisi planlanan kredilerin yıl bazındaki toplamıdır. CAPEX yalnızca 1. yılda dahil edilmiştir.
                        </p>
                    </div>

                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                            <thead>
                                <tr style={{ background:'var(--enba-dark)', color:'#fff' }}>
                                    {['Kalem', ...proj5Yil.map(p=>p.yil+'. Yıl')].map(h=>(
                                        <th key={h} style={{ padding:'12px 14px', textAlign: h==='Kalem'?'left':'right', fontWeight:700, fontSize:'13px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label:'Satış Geliri',          field:'gelir',          color:'#1B5E20', bg:'#E8F5E9' },
                                    { label:'FAVÖK (EBITDA)',         field:'ebitda',         color:'#1565C0', bg:'#E3F2FD', bold:true },
                                    { label:'Amortisman',            field:'amortisman',     color:'#6A1B9A', bg:'#EDE7F6', minus:true },
                                    { label:'Net Kâr (Vergi Öncesi)',field:'net',            color:'#0D47A1', bg:'#E3F2FD' },
                                    { label:'Kurumlar Vergisi',      field:'vergi',          color:'#E65100', bg:'#FFF3E0', minus:true },
                                    null,
                                    { label:'Operasyonel Nakit Akışı',field:'operasyonelCF', color:'#2E7D32', bg:'#C8E6C9', bold:true },
                                    { label:'CAPEX Ödemesi',         field:'capex',          color:'#4527A0', bg:'#EDE7F6', minus:true },
                                    { label:'Kredi Servisi',         field:'krediServis',    color:'#880E4F', bg:'#FCE4EC', minus:true },
                                    null,
                                    { label:'NET SERBEST NAKİT AKIŞI', field:'netCF',       color: null, bg:null, bold:true, signed:true },
                                ].map((row, ri) => {
                                    if (!row) return (
                                        <tr key={`sep${ri}`}><td colSpan={proj5Yil.length+1} style={{ height:'6px', background:'var(--surface-container-low)' }}></td></tr>
                                    );
                                    return (
                                        <tr key={ri} style={{ background: row.bg || 'transparent', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                                            <td style={{ padding:'12px 14px', fontWeight:row.bold?700:400, color: row.color||'var(--on-surface)', whiteSpace:'nowrap' }}>{row.label}</td>
                                            {proj5Yil.map((p, pi) => {
                                                const v = p[row.field] || 0;
                                                const dynColor = row.signed ? (v>=0?'#1B5E20':'#B71C1C') : (row.color||'var(--on-surface)');
                                                return (
                                                    <td key={pi} style={{ padding:'12px 14px', textAlign:'right', fontWeight:row.bold?700:400, color:dynColor }}>
                                                        {(row.minus?'−':row.signed?fmtS(v):'') + fmt(Math.abs(Math.round(v)))} ₺
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Kümülatif serbest nakit chart */}
                    {proj5Yil.length > 0 && (() => {
                        const cumVals = [];
                        let cum = 0;
                        proj5Yil.forEach(p => { cum += p.netCF; cumVals.push(cum); });
                        const allV = [0, ...cumVals];
                        const maxV = Math.max(...allV);
                        const minV = Math.min(...allV);
                        const range = maxV - minV || 1;
                        const W=600, H=160, pad=20;
                        const innerH = H - pad*2, innerW = W - pad*2;
                        const barW = innerW / cumVals.length;
                        const zeroY = pad + innerH * (1 - (-minV/range));
                        return (
                            <div style={{ ...cardStyle, marginTop:'24px' }}>
                                <h3 style={{ fontFamily:"'Manrope', sans-serif", color:'var(--enba-dark)', margin:'0 0 12px', fontSize:'16px' }}>Kümülatif Serbest Nakit Akışı</h3>
                                <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', maxWidth:'600px', height:'160px' }} preserveAspectRatio="none">
                                    <line x1={pad} y1={zeroY} x2={W-pad} y2={zeroY} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
                                    {cumVals.map((v, i) => {
                                        const barH = Math.abs(v / range) * innerH;
                                        const x = pad + i * barW + barW*0.1;
                                        const w = barW * 0.8;
                                        const y = v >= 0 ? zeroY - barH : zeroY;
                                        const fill = v >= 0 ? '#27ae60' : '#e74c3c';
                                        return (
                                            <g key={i}>
                                                <rect x={x} y={y} width={w} height={barH} fill={fill} rx="3" opacity="0.85" />
                                                <text x={x+w/2} y={v>=0?y-6:y+barH+14} textAnchor="middle" fontSize="20" fill={fill} fontWeight="700">
                                                    {fmt(Math.round(v/1000))}K ₺
                                                </text>
                                                <text x={x+w/2} y={H-4} textAnchor="middle" fontSize="18" fill="#666">
                                                    {proj5Yil[i]?.yil}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        );
                    })()}
                </div>
            )}

        </div>
    );
}

window.NakitAkisModulu = NakitAkisModulu;

