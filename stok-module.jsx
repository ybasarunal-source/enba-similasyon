// ============================================================
//  Stok & Ticaret Takip Modülü — window.StokModulu
// ============================================================
;(function () {

const VARSAYILAN_HAMMADDE = [
    'Plastik (PET)', 'Plastik (HDPE)', 'Plastik (PP)', 'Plastik (PVC)',
    'Metal (Demir)', 'Metal (Alüminyum)', 'Metal (Bakır)',
    'Kağıt / Karton', 'Cam', 'Tekstil', 'Elektronik Atık', 'Diğer'
];
const VARSAYILAN_MAMUL = [
    'Plastik Granül', 'Metal Balya', 'Kağıt Balya', 'Cam Kırığı',
    'Tekstil Balya', 'İşlenmiş Ürün', 'Diğer'
];

// ---- Renk sabitleri ----
const BG     = '#0e2035';
const CARD   = '#163049';
const CARD2  = '#1b3a58';
const INP    = '#0c1d2d';
const BRD    = 'rgba(110,175,220,0.22)';
const BRD_IN = 'rgba(110,175,220,0.32)';
const TXT    = '#ddeeff';
const TXT2   = '#7fb8d8';
const TXT3   = '#5a8dad';
const LBL    = '#6da8c8';
const GREEN  = '#27c76f';
const BLUE   = '#4fa8f5';
const PURPLE = '#a07cf5';
const AMBER  = '#e8a020';
const RED    = '#f06060';
const TEAL   = '#28c9a0';

function fmtN(n, d) {
    if (window.fmt) return window.fmt(n, d !== undefined ? d : 0);
    return (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}

function tarihFmt(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}

function ayFmt(iso) {
    if (!iso) return '—';
    const [y, m] = iso.split('-');
    const ay = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return `${ay[parseInt(m, 10) - 1]} ${y}`;
}

function hesaplaNetMiktar(brut, ym, nem) {
    const b = parseFloat(brut) || 0, y = parseFloat(ym) || 0, n = parseFloat(nem) || 0;
    return b * (1 - y / 100) * (1 - n / 100);
}
function hesaplaBirimMaliyet(brut, fiyat, nakliye, net) {
    const nm = parseFloat(net) || 0;
    if (!nm) return 0;
    return ((parseFloat(brut) || 0) * (parseFloat(fiyat) || 0) + (parseFloat(nakliye) || 0)) / nm;
}
function hesaplaStokOzeti(alislar, satislar) {
    const oz = {};
    alislar.forEach(a => {
        const t = a.hammaddeTuru || 'Diğer';
        if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
        const nm = parseFloat(a.netMiktar) || 0, bm = parseFloat(a.birimMaliyet) || 0;
        oz[t].netAlis  += nm;
        oz[t].toplaMal += nm * bm;
    });
    satislar.filter(s => s.stokTuru === 'hammadde').forEach(s => {
        const t = s.hammaddeTuru || 'Diğer';
        if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
        oz[t].satilanKg += parseFloat(s.miktar) || 0;
    });
    Object.keys(oz).forEach(t => {
        const o = oz[t];
        o.ortMal  = o.netAlis > 0 ? o.toplaMal / o.netAlis : 0;
        o.netStok = o.netAlis - o.satilanKg;
        o.stokDeg = Math.max(0, o.netStok) * o.ortMal;
    });
    return oz;
}
function hesaplaMamulStok(satislar, uretimKayitlari = []) {
    const toplamUretim = uretimKayitlari.reduce((s, x) => s + (parseFloat(x.cikanUrun) || 0), 0);
    const mamulSatis = satislar.filter(s => s.stokTuru === 'mamul').reduce((s, x) => s + (parseFloat(x.miktar) || 0), 0);
    return { toplamUretim, mamulSatis, netMamul: Math.max(0, toplamUretim - mamulSatis) };
}

const BOSH_ALIS  = () => ({ tarih: new Date().toISOString().slice(0, 10), tedarikciAdi: '', hammaddeTuru: '', brutMiktar: '', alisFiyati: '', nakliyeBedeli: '0', ymFire: '0', nemFire: '0', notlar: '' });
const BOSH_SATIS = () => ({ tarih: new Date().toISOString().slice(0, 10), musteriAdi: '', stokTuru: 'hammadde', hammaddeTuru: '', mamulTuru: '', miktar: '', satisFiyati: '', nakliyeBedeli: '0', notlar: '' });
const BOSH_TED   = () => ({ id: '', adi: '', telefon: '', eposta: '', adres: '', notlar: '' });
const BOSH_MUS   = () => ({ id: '', adi: '', telefon: '', eposta: '', adres: '', notlar: '' });

// ============================================================
//  Ana Bileşen
// ============================================================
function StokModulu() {
    const [aktifTab, setAktifTab] = React.useState('alislar');
    const [loading,  setLoading]  = React.useState(true);

    // ---- Veri state ----
    const [alislar,        setAlislar]        = React.useState([]);
    const [satislar,       setSatislar]       = React.useState([]);
    const [hammaddeler,    setHammaddeler]    = React.useState(VARSAYILAN_HAMMADDE);
    const [mamulListesi,   setMamulListesi]   = React.useState(VARSAYILAN_MAMUL);
    const [tedarikciler,   setTedarikciler]   = React.useState([]);
    const [musteriler,     setMusteriler]     = React.useState([]);
    const [uretimKayitlari, setUretimKayitlari] = React.useState([]);

    // ---- Form state ----
    const [alisForm,       setAlisForm]       = React.useState(BOSH_ALIS());
    const [alisDuzenleId,  setAlisDuzenleId]  = React.useState(null);
    const [alisFiltre,     setAlisFiltre]     = React.useState({ tedarikci: '', tur: '', donemBas: '', donemBit: '' });
    const [satisForm,      setSatisForm]      = React.useState(BOSH_SATIS());
    const [satisDuzenleId, setSatisDuzenleId] = React.useState(null);
    const [satisFiltre,    setSatisFiltre]    = React.useState({ musteri: '', donemBas: '', donemBit: '' });
    const [silOnay,        setSilOnay]        = React.useState(null);

    // ---- Ayarlar state ----
    const [ayarAlt,        setAyarAlt]        = React.useState('hammadde');
    const [yeniHammadde,   setYeniHammadde]   = React.useState('');
    const [yeniMamul,      setYeniMamul]      = React.useState('');
    const [duzenleHam,     setDuzenleHam]     = React.useState(null);
    const [duzenleMam,     setDuzenleMam]     = React.useState(null);
    const [tedForm,        setTedForm]        = React.useState(BOSH_TED());
    const [tedDuzenleId,   setTedDuzenleId]   = React.useState(null);
    const [musForm,        setMusForm]        = React.useState(BOSH_MUS());
    const [musDuzenleId,   setMusDuzenleId]   = React.useState(null);

    // ---- Data Fetching ----
    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [a, s, t, m, u] = await Promise.all([
                    window.DataService.getAlislar(),
                    window.DataService.getSatislar(),
                    window.DataService.getTedarikciler(),
                    window.DataService.getMusteriler(),
                    window.DataService.getProductionRecords ? window.DataService.getProductionRecords() : Promise.resolve([])
                ]);
                setAlislar(a);
                setSatislar(s);
                setTedarikciler(t);
                setMusteriler(m);
                setUretimKayitlari(u);
            } catch (err) {
                console.error("Veri yükleme hatası:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ---- Hesaplamalar ----
    const alisNetMiktar    = React.useMemo(() => hesaplaNetMiktar(alisForm.brutMiktar, alisForm.ymFire, alisForm.nemFire), [alisForm.brutMiktar, alisForm.ymFire, alisForm.nemFire]);
    const alisBirimMaliyet = React.useMemo(() => hesaplaBirimMaliyet(alisForm.brutMiktar, alisForm.alisFiyati, alisForm.nakliyeBedeli, alisNetMiktar), [alisForm.brutMiktar, alisForm.alisFiyati, alisForm.nakliyeBedeli, alisNetMiktar]);
    const stokOzeti        = React.useMemo(() => hesaplaStokOzeti(alislar, satislar),  [alislar, satislar]);
    const mamulStok        = React.useMemo(() => hesaplaMamulStok(satislar, uretimKayitlari), [satislar, uretimKayitlari]);

    const filtreliAlislar  = React.useMemo(() => alislar.filter(a => {
        if (alisFiltre.tedarikci && !a.tedarikciAdi.toLowerCase().includes(alisFiltre.tedarikci.toLowerCase())) return false;
        if (alisFiltre.tur && a.hammaddeTuru !== alisFiltre.tur) return false;
        if (alisFiltre.donemBas && a.tarih < alisFiltre.donemBas) return false;
        if (alisFiltre.donemBit && a.tarih > alisFiltre.donemBit) return false;
        return true;
    }), [alislar, alisFiltre]);

    const filtreliSatislar = React.useMemo(() => satislar.filter(s => {
        if (satisFiltre.musteri && !s.musteriAdi.toLowerCase().includes(satisFiltre.musteri.toLowerCase())) return false;
        if (satisFiltre.donemBas && s.tarih < satisFiltre.donemBas) return false;
        if (satisFiltre.donemBit && s.tarih > satisFiltre.donemBit) return false;
        return true;
    }), [satislar, satisFiltre]);

    const topAlisKg  = alislar.reduce((s, a) => s + (parseFloat(a.netMiktar)    || 0), 0);
    const topAlisTL  = alislar.reduce((s, a) => s + (parseFloat(a.netMiktar)    || 0) * (parseFloat(a.birimMaliyet) || 0), 0);
    const topSatisKg = satislar.reduce((s, a) => s + (parseFloat(a.miktar)      || 0), 0);
    const topSatisTL = satislar.reduce((s, a) => s + (parseFloat(a.miktar)      || 0) * (parseFloat(a.satisFiyati)  || 0) - (parseFloat(a.nakliyeBedeli) || 0), 0);
    const topStokDeg = Object.values(stokOzeti).reduce((s, o) => s + (o.stokDeg || 0), 0);

    // ---- Handlers ----
    async function alisKaydet() {
        if (!alisForm.tedarikciAdi.trim() || !alisForm.brutMiktar || !alisForm.alisFiyati) return;
        setLoading(true);
        try {
            const payload = { ...alisForm, netMiktar: alisNetMiktar, birimMaliyet: alisBirimMaliyet, type: 'alis' };
            if (alisDuzenleId) {
                const updated = await window.DataService.updateData('stock_records', alisDuzenleId, payload);
                setAlislar(p => p.map(a => a.id === alisDuzenleId ? updated : a));
                setAlisDuzenleId(null);
            } else {
                const inserted = await window.DataService.insertData('stock_records', payload);
                setAlislar(p => [inserted, ...p]);
            }
            setAlisForm(BOSH_ALIS());
        } catch (err) { alert("Hata: " + err.message); }
        finally { setLoading(false); }
    }

    async function satisKaydet() {
        if (!satisForm.musteriAdi.trim() || !satisForm.miktar || !satisForm.satisFiyati) return;
        setLoading(true);
        try {
            if (satisDuzenleId) {
                const updated = await window.DataService.updateData('sales_records', satisDuzenleId, satisForm);
                setSatislar(p => p.map(s => s.id === satisDuzenleId ? updated : s));
                setSatisDuzenleId(null);
            } else {
                const inserted = await window.DataService.insertData('sales_records', satisForm);
                setSatislar(p => [inserted, ...p]);
            }
            setSatisForm(BOSH_SATIS());
        } catch (err) { alert("Hata: " + err.message); }
        finally { setLoading(false); }
    }

    async function tedKaydet() {
        if (!tedForm.adi.trim()) return;
        setLoading(true);
        try {
            const payload = { ...tedForm, contact_type: 'supplier' };
            if (tedDuzenleId) {
                const updated = await window.DataService.updateData('contacts', tedDuzenleId, payload);
                setTedarikciler(p => p.map(t => t.id === tedDuzenleId ? updated : t));
                setTedDuzenleId(null);
            } else {
                const inserted = await window.DataService.insertData('contacts', payload);
                setTedarikciler(p => [inserted, ...p]);
            }
            setTedForm(BOSH_TED());
        } catch (err) { alert("Hata: " + err.message); }
        finally { setLoading(false); }
    }

    async function musKaydet() {
        if (!musForm.adi.trim()) return;
        setLoading(true);
        try {
            const payload = { ...musForm, contact_type: 'customer' };
            if (musDuzenleId) {
                const updated = await window.DataService.updateData('contacts', musDuzenleId, payload);
                setMusteriler(p => p.map(m => m.id === musDuzenleId ? updated : m));
                setMusDuzenleId(null);
            } else {
                const inserted = await window.DataService.insertData('contacts', payload);
                setMusteriler(p => [inserted, ...p]);
            }
            setMusForm(BOSH_MUS());
        } catch (err) { alert("Hata: " + err.message); }
        finally { setLoading(false); }
    }

    async function silGercekles() {
        if (!silOnay || !window.DataService) return;
        setLoading(true);
        try {
            const { tip, id } = silOnay;
            const tablo = tip === 'alis' ? 'stock_records' : (tip === 'satis' ? 'sales_records' : 'contacts');
            await window.DataService.deleteData(tablo, id);
            
            if (tip === 'alis')  setAlislar(p => p.filter(x => x.id !== id));
            if (tip === 'satis') setSatislar(p => p.filter(x => x.id !== id));
            if (tip === 'ted')   setTedarikciler(p => p.filter(x => x.id !== id));
            if (tip === 'mus')   setMusteriler(p => p.filter(x => x.id !== id));
            
            setSilOnay(null);
        } catch (err) { alert("Hata: " + err.message); }
        finally { setLoading(false); }
    }


    // ---- Stil şablonları ----
    const card = { background: CARD, borderRadius: '1rem', padding: '20px', border: `1px solid ${BRD}`, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' };
    const inp  = { width: '100%', padding: '9px 12px', borderRadius: '0.6rem', border: `1px solid ${BRD_IN}`, background: INP, color: TXT, fontFamily: "'Inter',sans-serif", fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
    const lbl  = { display: 'block', fontSize: '11px', fontWeight: 700, color: LBL, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' };
    const btnG = { padding: '10px 20px', background: '#1a9a52', color: '#fff', border: 'none', borderRadius: '0.6rem', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: "'Inter',sans-serif" };
    const btnB = { ...( {} ), padding: '10px 20px', background: '#1a5ea0', color: '#fff', border: 'none', borderRadius: '0.6rem', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: "'Inter',sans-serif" };
    const btnS = { padding: '8px 14px', background: 'rgba(110,175,220,0.1)', color: TXT2, border: `1px solid ${BRD}`, borderRadius: '0.5rem', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter',sans-serif" };
    const thS  = { padding: '10px 12px', textAlign: 'left', color: LBL, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: CARD2, borderBottom: `1px solid ${BRD}` };
    const tdR  = { padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', color: TXT };
    const tdL  = { padding: '9px 12px', fontSize: '13px', color: TXT };
    const trHover = { borderBottom: `1px solid ${BRD}`, transition: 'background 0.15s' };

    // ============================================================
    //  TAB: ALIŞLAR
    // ============================================================
    function renderAlislar() {
        const topBrut = filtreliAlislar.reduce((s, a) => s + (parseFloat(a.brutMiktar)  || 0), 0);
        const topNet  = filtreliAlislar.reduce((s, a) => s + (parseFloat(a.netMiktar)   || 0), 0);
        const topMal  = filtreliAlislar.reduce((s, a) => s + (parseFloat(a.netMiktar)   || 0) * (parseFloat(a.birimMaliyet) || 0), 0);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: GREEN, fontFamily: "'Inter',sans-serif" }}>
                        {alisDuzenleId ? <><i className="ph ph-pencil-simple"></i> Alış Kaydını Düzenle</> : <><i className="ph ph-plus-circle"></i> Yeni Alış Kaydı</>}
                    </h3>
                    {/* Datalists */}
                    <datalist id="ted-list">{tedarikciler.map(t => <option key={t.id} value={t.adi} />)}</datalist>
                    <datalist id="ham-list">{hammaddeler.map(h => <option key={h} value={h} />)}</datalist>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px' }}>
                        <div><label style={lbl}>Tarih</label>
                            <input type="date" style={inp} value={alisForm.tarih} onChange={e => setAlisForm(f => ({ ...f, tarih: e.target.value }))} /></div>
                        <div><label style={lbl}>Tedarikçi Adı *</label>
                            <input type="text" list="ted-list" style={inp} placeholder="Tedarikçi..." value={alisForm.tedarikciAdi} onChange={e => setAlisForm(f => ({ ...f, tedarikciAdi: e.target.value }))} /></div>
                        <div><label style={lbl}>Hammadde Türü</label>
                            <input type="text" list="ham-list" style={inp} placeholder="Tür seçin veya yazın..." value={alisForm.hammaddeTuru} onChange={e => setAlisForm(f => ({ ...f, hammaddeTuru: e.target.value }))} /></div>
                        <div><label style={lbl}>Brüt Miktar (kg) *</label>
                            <input type="number" min="0" style={inp} placeholder="0" value={alisForm.brutMiktar} onChange={e => setAlisForm(f => ({ ...f, brutMiktar: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Alış Fiyatı (₺/kg) *</label>
                            <input type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={alisForm.alisFiyati} onChange={e => setAlisForm(f => ({ ...f, alisFiyati: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Nakliye Bedeli (₺)</label>
                            <input type="number" min="0" style={inp} placeholder="0" value={alisForm.nakliyeBedeli} onChange={e => setAlisForm(f => ({ ...f, nakliyeBedeli: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Yab. Madde Fire (%)</label>
                            <input type="number" min="0" max="100" step="0.1" style={inp} placeholder="0" value={alisForm.ymFire} onChange={e => setAlisForm(f => ({ ...f, ymFire: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Nem Fire (%)</label>
                            <input type="number" min="0" max="100" step="0.1" style={inp} placeholder="0" value={alisForm.nemFire} onChange={e => setAlisForm(f => ({ ...f, nemFire: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Notlar</label>
                            <input type="text" style={inp} placeholder="..." value={alisForm.notlar} onChange={e => setAlisForm(f => ({ ...f, notlar: e.target.value }))} /></div>
                    </div>

                    {(parseFloat(alisForm.brutMiktar) > 0 || parseFloat(alisForm.alisFiyati) > 0) && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '14px', padding: '14px 18px', background: 'rgba(39,199,111,0.08)', borderRadius: '0.8rem', border: '1px solid rgba(39,199,111,0.25)' }}>
                            {[
                                { lbl: 'Net Kabul (kg)', val: fmtN(alisNetMiktar, 0), c: GREEN },
                                { lbl: 'Toplam Fire',    val: (100 - (alisNetMiktar / (parseFloat(alisForm.brutMiktar) || 1) * 100)).toFixed(1) + '%', c: AMBER },
                                { lbl: '₺/kg (nakliye dahil)', val: alisBirimMaliyet.toFixed(2), c: TXT },
                                { lbl: 'Toplam Maliyet ₺', val: fmtN(alisNetMiktar * alisBirimMaliyet), c: TXT },
                            ].map(x => (
                                <div key={x.lbl}>
                                    <div style={{ fontSize: '11px', color: TXT2, marginBottom: '3px' }}>{x.lbl}</div>
                                    <div style={{ fontSize: '17px', fontWeight: 700, color: x.c, fontFamily: "'Manrope',sans-serif" }}>{x.val}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button style={btnG} onClick={alisKaydet}>{alisDuzenleId ? '⚡  Güncelle' : '✅ Kaydet'}</button>
                        {alisDuzenleId && <button style={btnS} onClick={() => { setAlisDuzenleId(null); setAlisForm(BOSH_ALIS()); }}>İptal</button>}
                    </div>
                </div>

                {/* Filtre */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" style={{ ...inp, maxWidth: '200px' }} placeholder="🔍 Tedarikçi ara..."
                        value={alisFiltre.tedarikci} onChange={e => setAlisFiltre(f => ({ ...f, tedarikci: e.target.value }))} />
                    <select style={{ ...inp, maxWidth: '190px' }} value={alisFiltre.tur} onChange={e => setAlisFiltre(f => ({ ...f, tur: e.target.value }))}>
                        <option value="">Tüm türler</option>
                        {hammaddeler.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" style={{ ...inp, maxWidth: '155px' }} value={alisFiltre.donemBas} onChange={e => setAlisFiltre(f => ({ ...f, donemBas: e.target.value }))} />
                    <span style={{ color: TXT3 }}>—</span>
                    <input type="date" style={{ ...inp, maxWidth: '155px' }} value={alisFiltre.donemBit} onChange={e => setAlisFiltre(f => ({ ...f, donemBit: e.target.value }))} />
                    {(alisFiltre.tedarikci || alisFiltre.tur || alisFiltre.donemBas || alisFiltre.donemBit) &&
                        <button style={btnS} onClick={() => setAlisFiltre({ tedarikci: '', tur: '', donemBas: '', donemBit: '' })}>✕ Temizle</button>}
                </div>

                {filtreliAlislar.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { lbl: 'Kayıt',          val: filtreliAlislar.length + ' adet', c: BLUE },
                            { lbl: 'Brüt Alış',      val: fmtN(topBrut, 0) + ' kg',        c: PURPLE },
                            { lbl: 'Net Kabul',      val: fmtN(topNet, 0) + ' kg',          c: GREEN },
                            { lbl: 'Toplam Maliyet', val: '₺ ' + fmtN(topMal),              c: AMBER },
                        ].map(x => (
                            <div key={x.lbl} style={{ padding: '8px 14px', background: CARD2, borderRadius: '0.6rem', border: `1px solid ${BRD}` }}>
                                <div style={{ fontSize: '10px', color: TXT3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{x.lbl}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: x.c }}>{x.val}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                            <thead>
                                <tr>{['Tarih','Tedarikçi','Tür','Brüt kg','Y.M. Fire','Nem Fire','Net kg','₺/kg','Nakliye','Birim Mal.','Toplam ₺','Notlar',''].map(h => <th key={h} style={{ ...thS, textAlign: h===''?'center':'left' }}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {filtreliAlislar.length === 0 ? (
                                    <tr><td colSpan={13} style={{ padding: '36px', textAlign: 'center', color: TXT3, fontStyle: 'italic' }}>Kayıt bulunamadı</td></tr>
                                ) : filtreliAlislar.map(a => (
                                    <tr key={a.id} style={trHover}
                                        onMouseEnter={e => e.currentTarget.style.background = CARD2}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ ...tdL, color: TXT2, whiteSpace: 'nowrap' }}>{tarihFmt(a.tarih)}</td>
                                        <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{a.tedarikciAdi}</td>
                                        <td style={{ ...tdL, color: TXT2 }}>{a.hammaddeTuru}</td>
                                        <td style={tdR}>{fmtN(parseFloat(a.brutMiktar) || 0, 0)}</td>
                                        <td style={{ ...tdR, color: AMBER }}>{parseFloat(a.ymFire) || 0}%</td>
                                        <td style={{ ...tdR, color: AMBER }}>{parseFloat(a.nemFire) || 0}%</td>
                                        <td style={{ ...tdR, color: GREEN, fontWeight: 700 }}>{fmtN(parseFloat(a.netMiktar) || 0, 0)}</td>
                                        <td style={tdR}>{parseFloat(a.alisFiyati) || 0}</td>
                                        <td style={tdR}>{fmtN(parseFloat(a.nakliyeBedeli) || 0)}</td>
                                        <td style={{ ...tdR, fontWeight: 700 }}>{(parseFloat(a.birimMaliyet) || 0).toFixed(2)}</td>
                                        <td style={{ ...tdR, color: AMBER }}>{fmtN((parseFloat(a.netMiktar) || 0) * (parseFloat(a.birimMaliyet) || 0))}</td>
                                        <td style={{ ...tdL, color: TXT3, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notlar}</td>
                                        <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <button style={{ ...btnS, padding: '4px 9px', marginRight: '4px' }} onClick={() => { setAlisForm({ ...a }); setAlisDuzenleId(a.id); window.scrollTo(0,0); }}>✏️</button>
                                            <button style={{ ...btnS, padding: '4px 9px', color: RED }} onClick={() => setSilOnay({ tip: 'alis', id: a.id })}>⚡ ️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    //  TAB: SATIŞLAR
    // ============================================================
    function renderSatislar() {
        const topKg      = filtreliSatislar.reduce((s, a) => s + (parseFloat(a.miktar)        || 0), 0);
        const topGelir   = filtreliSatislar.reduce((s, a) => s + (parseFloat(a.miktar)        || 0) * (parseFloat(a.satisFiyati) || 0), 0);
        const topNakliye = filtreliSatislar.reduce((s, a) => s + (parseFloat(a.nakliyeBedeli) || 0), 0);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: BLUE, fontFamily: "'Inter',sans-serif" }}>
                        {satisDuzenleId ? <><i className="ph ph-pencil-simple"></i> Satış Kaydını Düzenle</> : <><i className="ph ph-plus-circle"></i> Yeni Satış Kaydı</>}
                    </h3>
                    <datalist id="mus-list">{musteriler.map(m => <option key={m.id} value={m.adi} />)}</datalist>
                    <datalist id="ham-list2">{hammaddeler.map(h => <option key={h} value={h} />)}</datalist>
                    <datalist id="mam-list">{mamulListesi.map(m => <option key={m} value={m} />)}</datalist>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px' }}>
                        <div><label style={lbl}>Tarih</label>
                            <input type="date" style={inp} value={satisForm.tarih} onChange={e => setSatisForm(f => ({ ...f, tarih: e.target.value }))} /></div>
                        <div><label style={lbl}>Müşteri Adı *</label>
                            <input type="text" list="mus-list" style={inp} placeholder="Müşteri..." value={satisForm.musteriAdi} onChange={e => setSatisForm(f => ({ ...f, musteriAdi: e.target.value }))} /></div>
                        <div><label style={lbl}>Ürün Tipi</label>
                            <select style={inp} value={satisForm.stokTuru} onChange={e => setSatisForm(f => ({ ...f, stokTuru: e.target.value }))}>
                                <option value="hammadde">⚡ ️ Hammadde</option>
                                <option value="mamul">⚡  Mamül Ürün</option>
                            </select></div>
                        <div><label style={lbl}>{satisForm.stokTuru === 'hammadde' ? 'Hammadde Türü' : 'Mamül Türü'}</label>
                            <input type="text" list={satisForm.stokTuru === 'hammadde' ? 'ham-list2' : 'mam-list'} style={inp} placeholder="Tür..."
                                value={satisForm.stokTuru === 'hammadde' ? satisForm.hammaddeTuru : satisForm.mamulTuru}
                                onChange={e => setSatisForm(f => satisForm.stokTuru === 'hammadde' ? { ...f, hammaddeTuru: e.target.value } : { ...f, mamulTuru: e.target.value })} /></div>
                        <div><label style={lbl}>Miktar (kg) *</label>
                            <input type="number" min="0" style={inp} placeholder="0" value={satisForm.miktar} onChange={e => setSatisForm(f => ({ ...f, miktar: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Satış Fiyatı (₺/kg) *</label>
                            <input type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={satisForm.satisFiyati} onChange={e => setSatisForm(f => ({ ...f, satisFiyati: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Nakliye Bedeli (₺)</label>
                            <input type="number" min="0" style={inp} placeholder="0" value={satisForm.nakliyeBedeli} onChange={e => setSatisForm(f => ({ ...f, nakliyeBedeli: e.target.value }))} onFocus={window.selectOnFocus} /></div>
                        <div><label style={lbl}>Notlar</label>
                            <input type="text" style={inp} placeholder="..." value={satisForm.notlar} onChange={e => setSatisForm(f => ({ ...f, notlar: e.target.value }))} /></div>
                    </div>

                    {(parseFloat(satisForm.miktar) > 0 && parseFloat(satisForm.satisFiyati) > 0) && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '14px', padding: '14px 18px', background: 'rgba(79,168,245,0.08)', borderRadius: '0.8rem', border: '1px solid rgba(79,168,245,0.25)' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: TXT2, marginBottom: '3px' }}>Brüt Satış Tutarı</div>
                                <div style={{ fontSize: '17px', fontWeight: 700, color: BLUE, fontFamily: "'Manrope',sans-serif" }}>₺ {fmtN((parseFloat(satisForm.miktar) || 0) * (parseFloat(satisForm.satisFiyati) || 0))}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: TXT2, marginBottom: '3px' }}>Net Satış Geliri</div>
                                <div style={{ fontSize: '17px', fontWeight: 700, color: GREEN, fontFamily: "'Manrope',sans-serif" }}>₺ {fmtN((parseFloat(satisForm.miktar) || 0) * (parseFloat(satisForm.satisFiyati) || 0) - (parseFloat(satisForm.nakliyeBedeli) || 0))}</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button style={btnB} onClick={satisKaydet}>{satisDuzenleId ? '⚡  Güncelle' : '✅ Kaydet'}</button>
                        {satisDuzenleId && <button style={btnS} onClick={() => { setSatisDuzenleId(null); setSatisForm(BOSH_SATIS()); }}>İptal</button>}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" style={{ ...inp, maxWidth: '200px' }} placeholder="⚡  Müşteri ara..."
                        value={satisFiltre.musteri} onChange={e => setSatisFiltre(f => ({ ...f, musteri: e.target.value }))} />
                    <input type="date" style={{ ...inp, maxWidth: '155px' }} value={satisFiltre.donemBas} onChange={e => setSatisFiltre(f => ({ ...f, donemBas: e.target.value }))} />
                    <span style={{ color: TXT3 }}>—</span>
                    <input type="date" style={{ ...inp, maxWidth: '155px' }} value={satisFiltre.donemBit} onChange={e => setSatisFiltre(f => ({ ...f, donemBit: e.target.value }))} />
                    {(satisFiltre.musteri || satisFiltre.donemBas || satisFiltre.donemBit) &&
                        <button style={btnS} onClick={() => setSatisFiltre({ musteri: '', donemBas: '', donemBit: '' })}>✕ Temizle</button>}
                </div>

                {filtreliSatislar.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { lbl: 'Kayıt',       val: filtreliSatislar.length + ' adet',    c: BLUE },
                            { lbl: 'Toplam kg',   val: fmtN(topKg, 0) + ' kg',              c: PURPLE },
                            { lbl: 'Brüt Gelir',  val: '₺ ' + fmtN(topGelir),              c: GREEN },
                            { lbl: 'Net Gelir',   val: '₺ ' + fmtN(topGelir - topNakliye), c: TEAL },
                        ].map(x => (
                            <div key={x.lbl} style={{ padding: '8px 14px', background: CARD2, borderRadius: '0.6rem', border: `1px solid ${BRD}` }}>
                                <div style={{ fontSize: '10px', color: TXT3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{x.lbl}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: x.c }}>{x.val}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                            <thead>
                                <tr>{['Tarih','Müşteri','Tür','Ürün','Miktar kg','₺/kg','Nakliye','Net Gelir ₺','Notlar',''].map(h => <th key={h} style={{ ...thS, textAlign: h===''?'center':'left' }}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {filtreliSatislar.length === 0 ? (
                                    <tr><td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: TXT3, fontStyle: 'italic' }}>Kayıt bulunamadı</td></tr>
                                ) : filtreliSatislar.map(s => {
                                    const urun     = s.stokTuru === 'hammadde' ? s.hammaddeTuru : s.mamulTuru;
                                    const netGelir = (parseFloat(s.miktar) || 0) * (parseFloat(s.satisFiyati) || 0) - (parseFloat(s.nakliyeBedeli) || 0);
                                    return (
                                        <tr key={s.id} style={trHover}
                                            onMouseEnter={e => e.currentTarget.style.background = CARD2}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ ...tdL, color: TXT2, whiteSpace: 'nowrap' }}>{tarihFmt(s.tarih)}</td>
                                            <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{s.musteriAdi}</td>
                                            <td style={tdL}>
                                                <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '1rem', background: s.stokTuru === 'mamul' ? 'rgba(160,124,245,0.18)' : 'rgba(39,199,111,0.15)', color: s.stokTuru === 'mamul' ? PURPLE : GREEN, fontWeight: 700 }}>
                                                    {s.stokTuru === 'mamul' ? 'Mamül' : 'Hammadde'}
                                                </span>
                                            </td>
                                            <td style={{ ...tdL, color: TXT2 }}>{urun}</td>
                                            <td style={tdR}>{fmtN(parseFloat(s.miktar) || 0, 0)}</td>
                                            <td style={tdR}>{parseFloat(s.satisFiyati) || 0}</td>
                                            <td style={tdR}>{fmtN(parseFloat(s.nakliyeBedeli) || 0)}</td>
                                            <td style={{ ...tdR, fontWeight: 700, color: netGelir >= 0 ? GREEN : RED }}>{fmtN(netGelir)}</td>
                                            <td style={{ ...tdL, color: TXT3, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notlar}</td>
                                            <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <button style={{ ...btnS, padding: '4px 9px', marginRight: '4px' }} onClick={() => { setSatisForm({ ...s }); setSatisDuzenleId(s.id); window.scrollTo(0,0); }}>✏️</button>
                                                <button style={{ ...btnS, padding: '4px 9px', color: RED }} onClick={() => setSilOnay({ tip: 'satis', id: s.id })}>⚡ ️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    //  TAB: STOK DURUMU
    // ============================================================
    function renderStok() {
        const turler     = Object.keys(stokOzeti);
        const topNetStok = turler.reduce((s, t) => s + Math.max(0, stokOzeti[t].netStok || 0), 0);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {[
                        { lbl: 'Hammadde Stok', val: fmtN(topNetStok, 0) + ' kg', sub: '₺ ' + fmtN(topStokDeg), c: GREEN, ico: '⚡ ️' },
                        { lbl: 'Mamül Stok',    val: fmtN(mamulStok.netMamul, 0) + ' kg', sub: 'Üretim − Satış', c: PURPLE, ico: '⚡ ' },
                        { lbl: 'Stok Değeri',   val: '₺ ' + fmtN(topStokDeg), sub: 'Ağırlıklı ort. maliyet', c: AMBER, ico: '⚡ ' },
                        { lbl: 'Toplam Net Alış', val: fmtN(topAlisKg, 0) + ' kg', sub: alislar.length + ' alış kaydı', c: BLUE, ico: '⚡ ' },
                    ].map(k => (
                        <div key={k.lbl} style={{ ...card, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '18px' }}>{k.ico}</span>
                                <span style={{ fontSize: '11px', color: TXT2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{k.lbl}</span>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: k.c, fontFamily: "'Manrope',sans-serif" }}>{k.val}</div>
                            <div style={{ fontSize: '12px', color: TXT3, marginTop: '4px' }}>{k.sub}</div>
                        </div>
                    ))}
                </div>

                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡ ️ Hammadde Stok — Türe Göre</h3>
                    {turler.length === 0
                        ? <div style={{ textAlign: 'center', padding: '28px', color: TXT3, fontStyle: 'italic' }}>Henüz alış kaydı yok</div>
                        : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                                    <thead>
                                        <tr>{['Hammadde Türü','Toplam Alınan','Toplam Satılan','Mevcut Stok','Ort. Maliyet ₺/kg','Stok Değeri ₺','Durum'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {turler.map(tur => {
                                            const o = stokOzeti[tur];
                                            const dur = o.netStok <= 0 ? { lbl: 'Tükendi', c: RED } : o.netStok < o.netAlis * 0.1 ? { lbl: 'Kritik', c: AMBER } : { lbl: 'Normal', c: GREEN };
                                            return (
                                                <tr key={tur} style={trHover}
                                                    onMouseEnter={e => e.currentTarget.style.background = CARD2}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{tur}</td>
                                                    <td style={tdR}>{fmtN(o.netAlis, 0)} kg</td>
                                                    <td style={tdR}>{fmtN(o.satilanKg, 0)} kg</td>
                                                    <td style={{ ...tdR, fontWeight: 700, color: o.netStok > 0 ? GREEN : RED }}>{fmtN(Math.max(0, o.netStok), 0)} kg</td>
                                                    <td style={tdR}>{o.ortMal.toFixed(2)}</td>
                                                    <td style={{ ...tdR, color: AMBER, fontWeight: 700 }}>{fmtN(o.stokDeg)}</td>
                                                    <td style={tdL}><span style={{ fontSize: '11px', padding: '3px 11px', borderRadius: '1rem', background: dur.c + '22', color: dur.c, fontWeight: 700 }}>{dur.lbl}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>

                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡  Mamül Ürün Stoku</h3>
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        {[
                            { lbl: 'Toplam Üretim', val: fmtN(mamulStok.toplamUretim, 0) + ' kg', c: BLUE },
                            { lbl: 'Satılan Mamül', val: fmtN(mamulStok.mamulSatis, 0) + ' kg',   c: RED },
                            { lbl: 'Mevcut Stok',   val: fmtN(mamulStok.netMamul, 0) + ' kg',     c: PURPLE },
                        ].map(x => (
                            <div key={x.lbl}>
                                <div style={{ fontSize: '11px', color: TXT2, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{x.lbl}</div>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: x.c, fontFamily: "'Manrope',sans-serif" }}>{x.val}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: TXT3 }}>* Üretim rakamları Günlük Üretim Takibi modülünden alınmaktadır.</div>
                </div>
            </div>
        );
    }

    // ============================================================
    //  TAB: RAPORLAR
    // ============================================================
    function renderRaporlar() {
        const tedOz = {};
        alislar.forEach(a => {
            const k = a.tedarikciAdi || 'Bilinmiyor';
            if (!tedOz[k]) tedOz[k] = { brutKg: 0, netKg: 0, mal: 0, adet: 0 };
            tedOz[k].brutKg += parseFloat(a.brutMiktar) || 0;
            tedOz[k].netKg  += parseFloat(a.netMiktar)  || 0;
            tedOz[k].mal    += (parseFloat(a.netMiktar) || 0) * (parseFloat(a.birimMaliyet) || 0);
            tedOz[k].adet++;
        });
        const musOz = {};
        satislar.forEach(s => {
            const k = s.musteriAdi || 'Bilinmiyor';
            if (!musOz[k]) musOz[k] = { kg: 0, gelir: 0, adet: 0 };
            musOz[k].kg    += parseFloat(s.miktar)      || 0;
            musOz[k].gelir += (parseFloat(s.miktar) || 0) * (parseFloat(s.satisFiyati) || 0) - (parseFloat(s.nakliyeBedeli) || 0);
            musOz[k].adet++;
        });
        const ayOz = {};
        alislar.forEach(a => {
            const ay = (a.tarih || '').slice(0, 7) || '?';
            if (!ayOz[ay]) ayOz[ay] = { alisKg: 0, alisMal: 0, satisKg: 0, satisGelir: 0 };
            ayOz[ay].alisKg  += parseFloat(a.netMiktar)    || 0;
            ayOz[ay].alisMal += (parseFloat(a.netMiktar) || 0) * (parseFloat(a.birimMaliyet) || 0);
        });
        satislar.forEach(s => {
            const ay = (s.tarih || '').slice(0, 7) || '?';
            if (!ayOz[ay]) ayOz[ay] = { alisKg: 0, alisMal: 0, satisKg: 0, satisGelir: 0 };
            ayOz[ay].satisKg    += parseFloat(s.miktar)      || 0;
            ayOz[ay].satisGelir += (parseFloat(s.miktar) || 0) * (parseFloat(s.satisFiyati) || 0) - (parseFloat(s.nakliyeBedeli) || 0);
        });
        const aylar = Object.keys(ayOz).sort();

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: GREEN, fontFamily: "'Inter',sans-serif" }}>⚡  Tedarikçi Bazında Alış Raporu</h3>
                    {Object.keys(tedOz).length === 0 ? <div style={{ textAlign: 'center', padding: '24px', color: TXT3, fontStyle: 'italic' }}>Veri yok</div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                                <thead><tr>{['Tedarikçi','Alış Adedi','Brüt kg','Net kg','Toplam Maliyet ₺','Ort. Birim Maliyet'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {Object.entries(tedOz).sort((a, b) => b[1].mal - a[1].mal).map(([adi, o]) => (
                                        <tr key={adi} style={trHover} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{adi}</td>
                                            <td style={tdR}>{o.adet}</td>
                                            <td style={tdR}>{fmtN(o.brutKg, 0)}</td>
                                            <td style={{ ...tdR, color: GREEN, fontWeight: 700 }}>{fmtN(o.netKg, 0)}</td>
                                            <td style={{ ...tdR, color: AMBER, fontWeight: 700 }}>₺ {fmtN(o.mal)}</td>
                                            <td style={tdR}>{o.netKg > 0 ? (o.mal / o.netKg).toFixed(2) : '—'} ₺/kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: BLUE, fontFamily: "'Inter',sans-serif" }}>⚡  Müşteri Bazında Satış Raporu</h3>
                    {Object.keys(musOz).length === 0 ? <div style={{ textAlign: 'center', padding: '24px', color: TXT3, fontStyle: 'italic' }}>Veri yok</div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                                <thead><tr>{['Müşteri','Satış Adedi','Toplam kg','Net Gelir ₺','Ort. Satış Fiyatı'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {Object.entries(musOz).sort((a, b) => b[1].gelir - a[1].gelir).map(([adi, o]) => (
                                        <tr key={adi} style={trHover} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{adi}</td>
                                            <td style={tdR}>{o.adet}</td>
                                            <td style={tdR}>{fmtN(o.kg, 0)}</td>
                                            <td style={{ ...tdR, color: GREEN, fontWeight: 700 }}>₺ {fmtN(o.gelir)}</td>
                                            <td style={tdR}>{o.kg > 0 ? (o.gelir / o.kg).toFixed(2) : '—'} ₺/kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: PURPLE, fontFamily: "'Inter',sans-serif" }}>⚡  Aylık Alış / Satış ve Marjin Özeti</h3>
                    {aylar.length === 0 ? <div style={{ textAlign: 'center', padding: '24px', color: TXT3, fontStyle: 'italic' }}>Veri yok</div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                                <thead><tr>{['Dönem','Alış kg','Alış Maliyeti','Satış kg','Satış Geliri','Net Marjin','Marjin %'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {aylar.map(ay => {
                                        const o = ayOz[ay];
                                        const marjin = o.satisGelir - o.alisMal;
                                        const pct    = o.alisMal > 0 ? marjin / o.alisMal * 100 : 0;
                                        return (
                                            <tr key={ay} style={trHover} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{ayFmt(ay + '-01')}</td>
                                                <td style={tdR}>{fmtN(o.alisKg, 0)}</td>
                                                <td style={{ ...tdR, color: RED }}>₺ {fmtN(o.alisMal)}</td>
                                                <td style={tdR}>{fmtN(o.satisKg, 0)}</td>
                                                <td style={{ ...tdR, color: GREEN }}>₺ {fmtN(o.satisGelir)}</td>
                                                <td style={{ ...tdR, fontWeight: 700, color: marjin >= 0 ? GREEN : RED }}>₺ {fmtN(marjin)}</td>
                                                <td style={{ ...tdR, fontWeight: 700, color: pct >= 0 ? TEAL : RED }}>{pct.toFixed(1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================
    //  TAB: AYARLAR
    // ============================================================
    function renderAyarlar() {
        const altTabs = [
            { id: 'hammadde', lbl: '⚡ ️ Hammadde Türleri' },
            { id: 'mamul',    lbl: '⚡  Mamül Türleri' },
            { id: 'tedarikciler', lbl: '⚡  Tedarikçiler' },
            { id: 'musteriler',   lbl: '⚡  Müşteriler' },
        ];

        const liStyle = (aktif) => ({
            padding: '8px 18px', border: 'none', borderRadius: '0.6rem', cursor: 'pointer',
            background: aktif ? CARD2 : 'transparent', color: aktif ? TXT : TXT2,
            fontWeight: aktif ? 700 : 500, fontFamily: "'Inter',sans-serif", fontSize: '13px',
            transition: 'all 0.15s',
        });

        const contactForm = (form, setForm, duzenleId, kaydet, iptal, tip) => (
            <div style={{ ...card, background: CARD2, marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: duzenleId ? AMBER : GREEN, marginBottom: '14px' }}>
                    {duzenleId ? <><i className="ph ph-pencil-simple"></i> {tip} Düzenle</> : <><i className="ph ph-plus-circle"></i> Yeni {tip} Ekle</>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    <div><label style={lbl}>Ad / Unvan *</label><input type="text" style={inp} placeholder={`${tip} adı...`} value={form.adi} onChange={e => setForm(f => ({ ...f, adi: e.target.value }))} /></div>
                    <div><label style={lbl}>Telefon</label><input type="text" style={inp} placeholder="0xxx..." value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} /></div>
                    <div><label style={lbl}>E-posta</label><input type="email" style={inp} placeholder="@..." value={form.eposta} onChange={e => setForm(f => ({ ...f, eposta: e.target.value }))} /></div>
                    <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Adres</label><input type="text" style={inp} placeholder="Adres..." value={form.adres} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))} /></div>
                    <div><label style={lbl}>Notlar</label><input type="text" style={inp} placeholder="..." value={form.notlar} onChange={e => setForm(f => ({ ...f, notlar: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button style={{ ...btnG, background: duzenleId ? '#b07800' : '#1a9a52' }} onClick={kaydet}>{duzenleId ? '⚡  Güncelle' : '✅ Kaydet'}</button>
                    {duzenleId && <button style={btnS} onClick={iptal}>İptal</button>}
                </div>
            </div>
        );

        const contactTable = (liste, duzenleBaslat, silFn, cols) => (
            liste.length === 0
                ? <div style={{ textAlign: 'center', padding: '24px', color: TXT3, fontStyle: 'italic' }}>Henüz kayıt yok</div>
                : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                            <thead><tr>{[...cols, ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                            <tbody>
                                {liste.map(x => (
                                    <tr key={x.id} style={trHover} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ ...tdL, fontWeight: 600, color: TXT }}>{x.adi}</td>
                                        <td style={{ ...tdL, color: TXT2 }}>{x.telefon || '—'}</td>
                                        <td style={{ ...tdL, color: TXT2 }}>{x.eposta  || '—'}</td>
                                        <td style={{ ...tdL, color: TXT3, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.adres || '—'}</td>
                                        <td style={{ ...tdL, color: TXT3, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.notlar || '—'}</td>
                                        <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <button style={{ ...btnS, padding: '4px 9px', marginRight: '4px' }} onClick={() => duzenleBaslat(x)}>✏️</button>
                                            <button style={{ ...btnS, padding: '4px 9px', color: RED }} onClick={() => silFn(x.id)}>⚡ ️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
        );

        function MalzemeListesi({ liste, setListe, yeni, setYeni, duzenle, setDuzenle, baslik }) {
            return (
                <div>
                    {/* Yeni ekle */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input type="text" style={{ ...inp, flex: 1, maxWidth: '300px' }} placeholder={`Yeni ${baslik.toLowerCase()} türü...`}
                            value={yeni} onChange={e => setYeni(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && yeni.trim() && !liste.includes(yeni.trim())) { setListe(l => [...l, yeni.trim()]); setYeni(''); } }} />
                        <button style={btnG} onClick={() => { if (yeni.trim() && !liste.includes(yeni.trim())) { setListe(l => [...l, yeni.trim()]); setYeni(''); } }}>Ekle</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {liste.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: CARD2, borderRadius: '0.6rem', border: `1px solid ${BRD}` }}>
                                {duzenle && duzenle.idx === i
                                    ? <>
                                        <input type="text" style={{ ...inp, flex: 1 }} value={duzenle.val}
                                            onChange={e => setDuzenle(d => ({ ...d, val: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter' && duzenle.val.trim()) { setListe(l => l.map((x, j) => j === i ? duzenle.val.trim() : x)); setDuzenle(null); } if (e.key === 'Escape') setDuzenle(null); }} />
                                        <button style={{ ...btnG, padding: '5px 12px', fontSize: '12px' }} onClick={() => { if (duzenle.val.trim()) { setListe(l => l.map((x, j) => j === i ? duzenle.val.trim() : x)); setDuzenle(null); } }}>✓</button>
                                        <button style={{ ...btnS, padding: '5px 10px', fontSize: '12px' }} onClick={() => setDuzenle(null)}>✕</button>
                                      </>
                                    : <>
                                        <span style={{ flex: 1, color: TXT, fontSize: '13px', fontWeight: 500 }}>{m}</span>
                                        <button style={{ ...btnS, padding: '4px 9px', fontSize: '11px' }} onClick={() => setDuzenle({ idx: i, val: m })}>✏️</button>
                                        <button style={{ ...btnS, padding: '4px 9px', fontSize: '11px', color: RED }} onClick={() => setListe(l => l.filter((_, j) => j !== i))}>⚡ ️</button>
                                      </>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Alt tab bar */}
                <div style={{ display: 'flex', gap: '4px', background: CARD2, borderRadius: '0.8rem', padding: '4px', width: 'fit-content', flexWrap: 'wrap', border: `1px solid ${BRD}` }}>
                    {altTabs.map(t => <button key={t.id} style={liStyle(ayarAlt === t.id)} onClick={() => setAyarAlt(t.id)}>{t.lbl}</button>)}
                </div>

                {ayarAlt === 'hammadde' && (
                    <div style={card}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡ ️ Hammadde Türleri</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', color: TXT2 }}>Alış formunda otomatik tamamlama için kullanılır. İstediğiniz türü ekleyip düzenleyebilirsiniz.</p>
                        {MalzemeListesi({ liste: hammaddeler, setListe: setHammaddeler, yeni: yeniHammadde, setYeni: setYeniHammadde, duzenle: duzenleHam, setDuzenle: setDuzenleHam, baslik: 'Hammadde' })}
                    </div>
                )}

                {ayarAlt === 'mamul' && (
                    <div style={card}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡  Mamül Ürün Türleri</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '12px', color: TXT2 }}>Satış formundaki mamül ürün türleri için kullanılır.</p>
                        {MalzemeListesi({ liste: mamulListesi, setListe: setMamulListesi, yeni: yeniMamul, setYeni: setYeniMamul, duzenle: duzenleMam, setDuzenle: setDuzenleMam, baslik: 'Mamül' })}
                    </div>
                )}

                {ayarAlt === 'tedarikciler' && (
                    <div style={card}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡  Tedarikçi Kayıtları</h3>
                        {contactForm(tedForm, setTedForm, tedDuzenleId, tedKaydet, () => { setTedDuzenleId(null); setTedForm(BOSH_TED()); }, 'Tedarikçi')}
                        {contactTable(tedarikciler,
                            x => { setTedForm({ ...x }); setTedDuzenleId(x.id); },
                            id => setTedarikciler(p => p.filter(t => t.id !== id)),
                            ['Ad / Unvan', 'Telefon', 'E-posta', 'Adres', 'Notlar']
                        )}
                    </div>
                )}

                {ayarAlt === 'musteriler' && (
                    <div style={card}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: TXT, fontFamily: "'Inter',sans-serif" }}>⚡  Müşteri Kayıtları</h3>
                        {contactForm(musForm, setMusForm, musDuzenleId, musKaydet, () => { setMusDuzenleId(null); setMusForm(BOSH_MUS()); }, 'Müşteri')}
                        {contactTable(musteriler,
                            x => { setMusForm({ ...x }); setMusDuzenleId(x.id); },
                            id => setMusteriler(p => p.filter(m => m.id !== id)),
                            ['Ad / Unvan', 'Telefon', 'E-posta', 'Adres', 'Notlar']
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ============================================================
    //  RENDER
    // ============================================================
    const TABS = [
        { id: 'alislar',  lbl: '⚡  Alışlar',     cnt: alislar.length },
        { id: 'satislar', lbl: '⚡  Satışlar',     cnt: satislar.length },
        { id: 'stok',     lbl: '⚡  Stok Durumu',  cnt: null },
        { id: 'raporlar', lbl: '⚡  Raporlar',     cnt: null },
        { id: 'ayarlar',  lbl: '⚙️ Ayarlar',      cnt: null },
    ];

    return (
        <div style={{ minHeight: '100vh', background: BG, padding: '24px 28px', fontFamily: "'Inter',sans-serif" }}>

            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: TXT, fontFamily: "'Manrope',sans-serif", letterSpacing: '-0.5px' }}>⚡  Stok & Ticaret Takibi</h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: TXT2 }}>Hammadde alış / satış kayıtları, fire takibi, stok durumu ve raporlar</p>
            </div>

            {/* Özet kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                    { lbl: 'Toplam Alış (net)', val: fmtN(topAlisKg, 0) + ' kg', sub: '₺ ' + fmtN(topAlisTL),    c: GREEN },
                    { lbl: 'Toplam Satış',       val: fmtN(topSatisKg, 0) + ' kg', sub: '₺ ' + fmtN(topSatisTL), c: BLUE },
                    { lbl: 'Ham. Stok Değeri',   val: '₺ ' + fmtN(topStokDeg), sub: 'Ağırlıklı ort. maliyet',    c: AMBER },
                    { lbl: 'Mamül Stok',         val: fmtN(mamulStok.netMamul, 0) + ' kg', sub: 'Üretim − Satış', c: PURPLE },
                ].map(k => (
                    <div key={k.lbl} style={{ background: CARD, borderRadius: '0.9rem', padding: '14px 16px', border: `1px solid ${BRD}`, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: '10px', color: TXT2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: 600 }}>{k.lbl}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: k.c, fontFamily: "'Manrope',sans-serif" }}>{k.val}</div>
                        <div style={{ fontSize: '11px', color: TXT3, marginTop: '3px' }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: CARD, borderRadius: '0.8rem', padding: '5px', width: 'fit-content', border: `1px solid ${BRD}`, flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setAktifTab(t.id)} style={{
                        padding: '8px 18px', border: 'none', borderRadius: '0.6rem', cursor: 'pointer',
                        background: aktifTab === t.id ? CARD2 : 'transparent',
                        color: aktifTab === t.id ? TXT : TXT2,
                        fontWeight: aktifTab === t.id ? 700 : 500,
                        fontFamily: "'Inter',sans-serif", fontSize: '13px',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: aktifTab === t.id ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
                    }}>
                        {t.lbl}
                        {t.cnt !== null && <span style={{ fontSize: '10px', background: 'rgba(110,175,220,0.15)', color: TXT2, padding: '1px 7px', borderRadius: '1rem', fontWeight: 600 }}>{t.cnt}</span>}
                    </button>
                ))}
            </div>

            {aktifTab === 'alislar'   && renderAlislar()}
            {aktifTab === 'satislar'  && renderSatislar()}
            {aktifTab === 'stok'      && renderStok()}
            {aktifTab === 'raporlar'  && renderRaporlar()}
            {aktifTab === 'ayarlar'   && renderAyarlar()}

            {/* Yükleniyor Overlay */}
            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding:'20px 40px', background:CARD, borderRadius:'1rem', border:`1px solid ${BRD}`, display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 10px 40px rgba(0,0,0,0.5)' }}>
                        <div className="spinner" style={{ width:'20px', height:'20px', border:'3px solid rgba(255,255,255,0.1)', borderTopColor: BLUE, borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
                        <span style={{ color: TXT, fontWeight: 700, fontSize:'14px' }}>İşleniyor...</span>
                    </div>
                </div>
            )}

            {/* Silme onay modal */}
            {silOnay && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: CARD, borderRadius: '1rem', padding: '28px 32px', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: `1px solid ${BRD}` }}>
                        <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚡ ️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: TXT, textAlign: 'center', fontFamily: "'Inter',sans-serif" }}>Kaydı Sil</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: TXT2, textAlign: 'center' }}>Bu kayıt kalıcı olarak silinecek. Emin misiniz?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button style={btnS} onClick={() => setSilOnay(null)}>İptal</button>
                            <button style={{ ...btnG, background: '#c0392b' }} onClick={silGercekles}>Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.StokModulu = StokModulu;
})();

