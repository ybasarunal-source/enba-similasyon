import React, { useState, useEffect, useMemo } from 'react';
import { DataService, StockRecord, SalesRecord } from '../api/dataService';
import { fmt } from '../utils/formatters';
import {
  PlusCircle, Pencil, Trash2, X, Check, Package,
  Truck, Users, BarChart3, Settings, AlertTriangle, ChevronDown,
  RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { parasutService, ParasutItem } from '../api/parasut';

const VARSAYILAN_HAMMADDE = [
  'Plastik (PET)', 'Plastik (HDPE)', 'Plastik (PP)', 'Plastik (PVC)',
  'Metal (Demir)', 'Metal (Alüminyum)', 'Metal (Bakır)',
  'Kağıt / Karton', 'Cam', 'Tekstil', 'Elektronik Atık', 'Diğer'
];
const VARSAYILAN_MAMUL = [
  'Plastik Granül', 'Metal Balya', 'Kağıt Balya', 'Cam Kırığı',
  'Tekstil Balya', 'İşlenmiş Ürün', 'Diğer'
];

interface ContactRecord {
  id: string;
  name?: string;
  adi?: string;
  telefon?: string;
  eposta?: string;
  adres?: string;
  notlar?: string;
  contact_type: 'supplier' | 'customer';
}

interface SilOnay { tip: 'alis' | 'satis' | 'ted' | 'mus'; id: string; }

const BOSH_ALIS = (): StockRecord => ({
  tarih: new Date().toISOString().slice(0, 10),
  tedarikciAdi: '', hammaddeTuru: '', brutMiktar: 0,
  netMiktar: 0, alisFiyati: 0, nakliyeBedeli: 0,
  ymFire: 0, nemFire: 0, notlar: ''
});
const BOSH_SATIS = (): SalesRecord => ({
  tarih: new Date().toISOString().slice(0, 10),
  musteriAdi: '', stokTuru: 'hammadde', hammadde_turu: '',
  mamul_turu: '', miktar: 0, satisFiyati: 0, nakliyeBedeli: 0, notlar: ''
});
const BOSH_CONTACT = () => ({ id: '', name: '', telefon: '', eposta: '', adres: '', notlar: '' });

function tarihFmt(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function ayFmt(iso: string) {
  if (!iso) return '—';
  const [y, m] = iso.split('-');
  const aylar = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  return `${aylar[parseInt(m, 10) - 1]} ${y}`;
}

export const Stock: React.FC = () => {
  const [aktifTab, setAktifTab] = useState<'alislar'|'satislar'|'stok'|'raporlar'|'ayarlar'>('alislar');
  const [loading, setLoading] = useState(true);

  const [alislar, setAlislar]           = useState<StockRecord[]>([]);
  const [satislar, setSatislar]         = useState<SalesRecord[]>([]);
  const [tedarikciler, setTedarikciler] = useState<ContactRecord[]>([]);
  const [musteriler, setMusteriler]     = useState<ContactRecord[]>([]);
  const [hammaddeler, setHammaddeler]   = useState<string[]>(VARSAYILAN_HAMMADDE);
  const [mamulListesi, setMamulListesi] = useState<string[]>(VARSAYILAN_MAMUL);

  const [alisForm, setAlisForm]         = useState<StockRecord>(BOSH_ALIS());
  const [alisDuzenleId, setAlisDuzenleId] = useState<string|null>(null);
  const [alisFiltre, setAlisFiltre]     = useState({ tedarikci: '', tur: '', bas: '', bit: '' });

  const [satisForm, setSatisForm]       = useState<SalesRecord>(BOSH_SATIS());
  const [satisDuzenleId, setSatisDuzenleId] = useState<string|null>(null);
  const [satisFiltre, setSatisFiltre]   = useState({ musteri: '', bas: '', bit: '' });

  const [tedForm, setTedForm]           = useState(BOSH_CONTACT());
  const [tedDuzenleId, setTedDuzenleId] = useState<string|null>(null);
  const [musForm, setMusForm]           = useState(BOSH_CONTACT());
  const [musDuzenleId, setMusDuzenleId] = useState<string|null>(null);
  const [ayarAlt, setAyarAlt]           = useState<'hammadde'|'mamul'|'tedarikciler'|'musteriler'>('hammadde');
  const [yeniHammadde, setYeniHammadde] = useState('');
  const [yeniMamul, setYeniMamul]       = useState('');

  const [silOnay, setSilOnay]           = useState<SilOnay|null>(null);

  // Paraşüt Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [parasutItems, setParasutItems] = useState<ParasutItem[]>([]);
  const [parasutConnected, setParasutConnected] = useState(parasutService.isLoggedIn());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, s, contacts] = await Promise.all([
          DataService.getAlislar(),
          DataService.getSatislar(),
          DataService.fetchData<any>('contacts', '*'),
        ]);
        setAlislar(a);
        setSatislar(s);
        setTedarikciler(contacts.filter((x: any) => x.contact_type === 'supplier'));
        setMusteriler(contacts.filter((x: any) => x.contact_type === 'customer'));
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const alisNetMiktar = useMemo(() => {
    const b = Number(alisForm.brutMiktar) || 0;
    const y = Number(alisForm.ymFire) || 0;
    const n = Number(alisForm.nemFire) || 0;
    return b * (1 - y / 100) * (1 - n / 100);
  }, [alisForm.brutMiktar, alisForm.ymFire, alisForm.nemFire]);

  const alisBirimMaliyet = useMemo(() => {
    if (!alisNetMiktar) return 0;
    return ((Number(alisForm.brutMiktar) || 0) * (Number(alisForm.alisFiyati) || 0) + (Number(alisForm.nakliyeBedeli) || 0)) / alisNetMiktar;
  }, [alisForm.brutMiktar, alisForm.alisFiyati, alisForm.nakliyeBedeli, alisNetMiktar]);

  const stokOzeti = useMemo(() => {
    const oz: Record<string, { netAlis: number; toplaMal: number; satilanKg: number; ortMal?: number; netStok?: number; stokDeg?: number }> = {};
    alislar.forEach(a => {
      const t = a.hammaddeTuru || 'Diğer';
      if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
      const nm = Number(a.netMiktar) || 0, bm = Number(a.birimMaliyet) || 0;
      oz[t].netAlis  += nm;
      oz[t].toplaMal += nm * bm;
    });
    satislar.filter(s => s.stokTuru === 'hammadde').forEach(s => {
      const t = s.hammadde_turu || 'Diğer';
      if (!oz[t]) oz[t] = { netAlis: 0, toplaMal: 0, satilanKg: 0 };
      oz[t].satilanKg += Number(s.miktar) || 0;
    });
    Object.keys(oz).forEach(t => {
      const o = oz[t];
      o.ortMal  = o.netAlis > 0 ? o.toplaMal / o.netAlis : 0;
      o.netStok = o.netAlis - o.satilanKg;
      o.stokDeg = Math.max(0, o.netStok) * (o.ortMal || 0);
    });
    return oz;
  }, [alislar, satislar]);

  const filtreliAlislar = useMemo(() => alislar.filter(a => {
    if (alisFiltre.tedarikci && !a.tedarikciAdi.toLowerCase().includes(alisFiltre.tedarikci.toLowerCase())) return false;
    if (alisFiltre.tur && a.hammaddeTuru !== alisFiltre.tur) return false;
    if (alisFiltre.bas && a.tarih < alisFiltre.bas) return false;
    if (alisFiltre.bit && a.tarih > alisFiltre.bit) return false;
    return true;
  }), [alislar, alisFiltre]);

  const filtreliSatislar = useMemo(() => satislar.filter(s => {
    if (satisFiltre.musteri && !s.musteriAdi.toLowerCase().includes(satisFiltre.musteri.toLowerCase())) return false;
    if (satisFiltre.bas && s.tarih < satisFiltre.bas) return false;
    if (satisFiltre.bit && s.tarih > satisFiltre.bit) return false;
    return true;
  }), [satislar, satisFiltre]);

  const topAlisKg  = alislar.reduce((s, a) => s + (Number(a.netMiktar) || 0), 0);
  const topSatisKg = satislar.reduce((s, a) => s + (Number(a.miktar) || 0), 0);
  const topSatisTL = satislar.reduce((s, a) => s + (Number(a.miktar) || 0) * (Number(a.satisFiyati) || 0) - (Number(a.nakliyeBedeli) || 0), 0);
  const topStokDeg = Object.values(stokOzeti).reduce((s, o) => s + (o.stokDeg || 0), 0);
  const topNetStok = Object.values(stokOzeti).reduce((s, o) => s + Math.max(0, o.netStok || 0), 0);

  async function alisKaydet() {
    if (!alisForm.tedarikciAdi?.trim() || !alisForm.brutMiktar) return;
    setLoading(true);
    try {
      const payload = { ...alisForm, netMiktar: alisNetMiktar, birimMaliyet: alisBirimMaliyet };
      if (alisDuzenleId) {
        const updated = await DataService.updateData('stock_records', alisDuzenleId, payload);
        setAlislar(p => p.map(a => a.id === alisDuzenleId ? updated : a));
        setAlisDuzenleId(null);
      } else {
        const inserted = await DataService.insertData('stock_records', payload);
        setAlislar(p => [inserted, ...p]);
      }
      setAlisForm(BOSH_ALIS());
    } catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  }

  async function satisKaydet() {
    if (!satisForm.musteriAdi?.trim() || !satisForm.miktar) return;
    setLoading(true);
    try {
      if (satisDuzenleId) {
        const updated = await DataService.updateData('sales_records', satisDuzenleId, satisForm);
        setSatislar(p => p.map(s => s.id === satisDuzenleId ? updated : s));
        setSatisDuzenleId(null);
      } else {
        const inserted = await DataService.insertData('sales_records', satisForm);
        setSatislar(p => [inserted, ...p]);
      }
      setSatisForm(BOSH_SATIS());
    } catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  }

  async function tedKaydet() {
    if (!tedForm.name.trim()) return;
    setLoading(true);
    try {
      const payload = { ...tedForm, contact_type: 'supplier' };
      if (tedDuzenleId) {
        const updated = await DataService.updateData('contacts', tedDuzenleId, payload);
        setTedarikciler(p => p.map(t => t.id === tedDuzenleId ? updated : t));
        setTedDuzenleId(null);
      } else {
        const inserted = await DataService.insertData('contacts', payload);
        setTedarikciler(p => [...p, inserted]);
      }
      setTedForm(BOSH_CONTACT());
    } catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  }

  async function musKaydet() {
    if (!musForm.name.trim()) return;
    setLoading(true);
    try {
      const payload = { ...musForm, contact_type: 'customer' };
      if (musDuzenleId) {
        const updated = await DataService.updateData('contacts', musDuzenleId, payload);
        setMusteriler(p => p.map(m => m.id === musDuzenleId ? updated : m));
        setMusDuzenleId(null);
      } else {
        const inserted = await DataService.insertData('contacts', payload);
        setMusteriler(p => [...p, inserted]);
      }
      setMusForm(BOSH_CONTACT());
    } catch { alert('Kayıt hatası oluştu'); }
    finally { setLoading(false); }
  }

  async function silGercekles() {
    if (!silOnay) return;
    setLoading(true);
    try {
      const { tip, id } = silOnay;
      const tablo = tip === 'alis' ? 'stock_records' : tip === 'satis' ? 'sales_records' : 'contacts';
      await DataService.deleteData(tablo, id);
      if (tip === 'alis')  setAlislar(p => p.filter(x => x.id !== id));
      if (tip === 'satis') setSatislar(p => p.filter(x => x.id !== id));
      if (tip === 'ted')   setTedarikciler(p => p.filter(x => x.id !== id));
      if (tip === 'mus')   setMusteriler(p => p.filter(x => x.id !== id));
      setSilOnay(null);
    } catch { alert('Silme hatası oluştu'); }
    finally { setLoading(false); }
  }

  async function handleParasutSync() {
    if (!parasutConnected) return;
    const company = parasutService.getCompany();
    if (!company) {
      alert("Lütfen önce Paraşüt modülünden bir firma seçin.");
      return;
    }

    setIsSyncing(true);
    try {
      const items = await parasutService.getItems(company.id);
      setParasutItems(items);
      
      // Optionally, we could auto-map these to our categories if the names match
      // For now, let's just display them in a separate section or as a reference
    } catch (err: any) {
      console.error("Paraşüt sync error:", err);
      alert("Paraşüt verileri çekilirken bir hata oluştu: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  const cName = (c: ContactRecord) => c.name || (c as any).adi || '—';

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-[var(--enba-orange)]/60 focus:ring-2 focus:ring-orange-500/10 transition-all text-gray-700";
  const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1.5 ml-0.5";
  const thCls    = "px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100";
  const thRCls   = thCls + " text-right";
  const tdCls    = "px-4 py-3.5 text-sm text-gray-700 border-b border-slate-50";
  const tdRCls   = tdCls + " text-right font-mono";

  const TABS = [
    { id: 'alislar',  label: 'Hammadde Alış', icon: <Package size={14}/> },
    { id: 'satislar', label: 'Satış Kayıtları', icon: <Truck size={14}/> },
    { id: 'stok',     label: 'Stok Durumu', icon: <BarChart3 size={14}/> },
    { id: 'raporlar', label: 'Raporlar', icon: <ChevronDown size={14}/> },
    { id: 'ayarlar',  label: 'Ayarlar', icon: <Settings size={14}/> },
  ] as const;

  function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
      <div className="enba-card !p-5 flex flex-col gap-1">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{label}</div>
        <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
    );
  }

  function FilterBar({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-wrap gap-2 items-center">{children}</div>;
  }

  function SummaryBadges({ items }: { items: { lbl: string; val: string; color: string }[] }) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(x => (
          <div key={x.lbl} className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{x.lbl}</div>
            <div className={`text-sm font-black ${x.color}`}>{x.val}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── ALIŞLAR ─────────────────────────────────────────────────────────────────
  function renderAlislar() {
    const topBrut = filtreliAlislar.reduce((s, a) => s + (Number(a.brutMiktar) || 0), 0);
    const topNet  = filtreliAlislar.reduce((s, a) => s + (Number(a.netMiktar)  || 0), 0);
    const topMal  = filtreliAlislar.reduce((s, a) => s + (Number(a.netMiktar)  || 0) * (Number(a.birimMaliyet) || 0), 0);
    const showCalc = (Number(alisForm.brutMiktar) > 0);
    return (
      <div className="flex flex-col gap-6">
        {/* Form */}
        <div className="enba-card border-t-4 border-t-emerald-500">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><PlusCircle size={16}/></span>
            {alisDuzenleId ? 'Alış Kaydını Düzenle' : 'Yeni Alış Kaydı'}
          </h3>
          <datalist id="ted-list">{tedarikciler.map(t => <option key={t.id} value={cName(t)}/>)}</datalist>
          <datalist id="ham-list">{hammaddeler.map(h => <option key={h} value={h}/>)}</datalist>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div><label className={labelCls}>Tarih</label>
              <input type="date" className={inputCls} value={alisForm.tarih} onChange={e => setAlisForm(f => ({...f, tarih: e.target.value}))}/></div>
            <div><label className={labelCls}>Tedarikçi *</label>
              <input type="text" list="ted-list" className={inputCls} placeholder="Tedarikçi..." value={alisForm.tedarikciAdi} onChange={e => setAlisForm(f => ({...f, tedarikciAdi: e.target.value}))}/></div>
            <div><label className={labelCls}>Hammadde Türü</label>
              <input type="text" list="ham-list" className={inputCls} placeholder="Tür seçin..." value={alisForm.hammaddeTuru} onChange={e => setAlisForm(f => ({...f, hammaddeTuru: e.target.value}))}/></div>
            <div><label className={labelCls}>Brüt Miktar (kg) *</label>
              <input type="number" min="0" className={inputCls} placeholder="0" value={alisForm.brutMiktar || ''} onChange={e => setAlisForm(f => ({...f, brutMiktar: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Alış Fiyatı (₺/kg) *</label>
              <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={alisForm.alisFiyati || ''} onChange={e => setAlisForm(f => ({...f, alisFiyati: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Nakliye Bedeli (₺)</label>
              <input type="number" min="0" className={inputCls} placeholder="0" value={alisForm.nakliyeBedeli || ''} onChange={e => setAlisForm(f => ({...f, nakliyeBedeli: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Yab. Madde Fire (%)</label>
              <input type="number" min="0" max="100" step="0.1" className={inputCls} placeholder="0" value={alisForm.ymFire || ''} onChange={e => setAlisForm(f => ({...f, ymFire: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Nem Fire (%)</label>
              <input type="number" min="0" max="100" step="0.1" className={inputCls} placeholder="0" value={alisForm.nemFire || ''} onChange={e => setAlisForm(f => ({...f, nemFire: Number(e.target.value)}))}/></div>
            <div className="sm:col-span-2"><label className={labelCls}>Notlar</label>
              <input type="text" className={inputCls} placeholder="..." value={alisForm.notlar || ''} onChange={e => setAlisForm(f => ({...f, notlar: e.target.value}))}/></div>
          </div>
          {showCalc && (
            <div className="mt-4 flex flex-wrap gap-6 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              {[
                { lbl: 'Net Kabul (kg)',       val: fmt(alisNetMiktar, 0), c: 'text-emerald-700' },
                { lbl: 'Toplam Fire',          val: `${(100 - (alisNetMiktar / (Number(alisForm.brutMiktar) || 1) * 100)).toFixed(1)}%`, c: 'text-amber-600' },
                { lbl: '₺/kg (nakliye dahil)', val: alisBirimMaliyet.toFixed(2), c: 'text-gray-700' },
                { lbl: 'Toplam Maliyet ₺',     val: fmt(alisNetMiktar * alisBirimMaliyet), c: 'text-amber-600' },
              ].map(x => (
                <div key={x.lbl}>
                  <div className="text-[10px] text-slate-500 mb-0.5">{x.lbl}</div>
                  <div className={`text-lg font-black ${x.c}`}>{x.val}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={alisKaydet} disabled={loading} className="btn-premium btn-premium-dark px-6 py-2.5 text-sm flex items-center gap-2">
              <Check size={14}/>{alisDuzenleId ? 'Güncelle' : 'Kaydet'}
            </button>
            {alisDuzenleId && <button onClick={() => { setAlisDuzenleId(null); setAlisForm(BOSH_ALIS()); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"><X size={14}/>İptal</button>}
          </div>
        </div>

        {/* Filtre */}
        <FilterBar>
          <input type="text" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--enba-orange)]/50 w-44" placeholder="Tedarikçi ara..." value={alisFiltre.tedarikci} onChange={e => setAlisFiltre(f => ({...f, tedarikci: e.target.value}))}/>
          <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--enba-orange)]/50" value={alisFiltre.tur} onChange={e => setAlisFiltre(f => ({...f, tur: e.target.value}))}>
            <option value="">Tüm türler</option>
            {hammaddeler.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={alisFiltre.bas} onChange={e => setAlisFiltre(f => ({...f, bas: e.target.value}))}/>
          <span className="text-slate-300 font-bold">—</span>
          <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={alisFiltre.bit} onChange={e => setAlisFiltre(f => ({...f, bit: e.target.value}))}/>
          {(alisFiltre.tedarikci || alisFiltre.tur || alisFiltre.bas || alisFiltre.bit) && (
            <button onClick={() => setAlisFiltre({ tedarikci:'', tur:'', bas:'', bit:'' })} className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"><X size={12}/>Temizle</button>
          )}
        </FilterBar>

        {filtreliAlislar.length > 0 && (
          <SummaryBadges items={[
            { lbl: 'Kayıt',          val: filtreliAlislar.length + ' adet', color: 'text-blue-600' },
            { lbl: 'Brüt Alış',      val: fmt(topBrut, 0) + ' kg',         color: 'text-purple-600' },
            { lbl: 'Net Kabul',      val: fmt(topNet, 0) + ' kg',           color: 'text-emerald-600' },
            { lbl: 'Toplam Maliyet', val: '₺ ' + fmt(topMal),              color: 'text-amber-600' },
          ]}/>
        )}

        {/* Tablo */}
        <div className="enba-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Tarih','Tedarikçi','Tür','Brüt kg','YM Fire','Nem Fire','Net kg','₺/kg','Nakliye','Birim Mal.','Toplam ₺','Notlar',''].map(h => (
                    <th key={h} className={h===''||h==='Toplam ₺'||h==='Birim Mal.'||h==='Nakliye'||h==='₺/kg'||h==='Net kg'||h==='Nem Fire'||h==='YM Fire'||h==='Brüt kg' ? thRCls : thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtreliAlislar.length === 0 ? (
                  <tr><td colSpan={13} className="py-16 text-center text-slate-400 italic text-sm">Kayıt bulunamadı</td></tr>
                ) : filtreliAlislar.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={tdCls + ' text-slate-500 whitespace-nowrap'}>{tarihFmt(a.tarih)}</td>
                    <td className={tdCls + ' font-semibold'}>{a.tedarikciAdi}</td>
                    <td className={tdCls + ' text-slate-500'}>{a.hammaddeTuru}</td>
                    <td className={tdRCls}>{fmt(Number(a.brutMiktar)||0, 0)}</td>
                    <td className={tdRCls + ' text-amber-600'}>{Number(a.ymFire)||0}%</td>
                    <td className={tdRCls + ' text-amber-600'}>{Number(a.nemFire)||0}%</td>
                    <td className={tdRCls + ' font-bold text-emerald-600'}>{fmt(Number(a.netMiktar)||0, 0)}</td>
                    <td className={tdRCls}>{Number(a.alisFiyati)||0}</td>
                    <td className={tdRCls}>{fmt(Number(a.nakliyeBedeli)||0)}</td>
                    <td className={tdRCls + ' font-bold'}>{(Number(a.birimMaliyet)||0).toFixed(2)}</td>
                    <td className={tdRCls + ' text-amber-600 font-bold'}>{fmt((Number(a.netMiktar)||0)*(Number(a.birimMaliyet)||0))}</td>
                    <td className={tdCls + ' text-slate-400 max-w-[100px] truncate'}>{a.notlar}</td>
                    <td className="px-3 py-3.5 border-b border-slate-50 whitespace-nowrap">
                      <button onClick={() => { setAlisForm({...a}); setAlisDuzenleId(a.id!); window.scrollTo(0,0); }} className="p-1.5 text-slate-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-colors mr-1" title="Düzenle"><Pencil size={14}/></button>
                      <button onClick={() => setSilOnay({ tip:'alis', id: a.id! })} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sil"><Trash2 size={14}/></button>
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

  // ── SATIŞLAR ────────────────────────────────────────────────────────────────
  function renderSatislar() {
    const topKg      = filtreliSatislar.reduce((s, a) => s + (Number(a.miktar) || 0), 0);
    const topGelir   = filtreliSatislar.reduce((s, a) => s + (Number(a.miktar)||0)*(Number(a.satisFiyati)||0), 0);
    const topNakliye = filtreliSatislar.reduce((s, a) => s + (Number(a.nakliyeBedeli)||0), 0);
    const showCalc   = Number(satisForm.miktar) > 0 && Number(satisForm.satisFiyati) > 0;
    return (
      <div className="flex flex-col gap-6">
        <div className="enba-card border-t-4 border-t-blue-500">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><PlusCircle size={16}/></span>
            {satisDuzenleId ? 'Satış Kaydını Düzenle' : 'Yeni Satış Kaydı'}
          </h3>
          <datalist id="mus-list">{musteriler.map(m => <option key={m.id} value={cName(m)}/>)}</datalist>
          <datalist id="ham-list2">{hammaddeler.map(h => <option key={h} value={h}/>)}</datalist>
          <datalist id="mam-list">{mamulListesi.map(m => <option key={m} value={m}/>)}</datalist>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div><label className={labelCls}>Tarih</label>
              <input type="date" className={inputCls} value={satisForm.tarih} onChange={e => setSatisForm(f => ({...f, tarih: e.target.value}))}/></div>
            <div><label className={labelCls}>Müşteri Adı *</label>
              <input type="text" list="mus-list" className={inputCls} placeholder="Müşteri..." value={satisForm.musteriAdi} onChange={e => setSatisForm(f => ({...f, musteriAdi: e.target.value}))}/></div>
            <div><label className={labelCls}>Ürün Tipi</label>
              <select className={inputCls} value={satisForm.stokTuru} onChange={e => setSatisForm(f => ({...f, stokTuru: e.target.value as 'hammadde'|'mamul'}))}>
                <option value="hammadde">Hammadde</option>
                <option value="mamul">Mamül Ürün</option>
              </select></div>
            <div><label className={labelCls}>{satisForm.stokTuru === 'hammadde' ? 'Hammadde Türü' : 'Mamül Türü'}</label>
              <input type="text" list={satisForm.stokTuru === 'hammadde' ? 'ham-list2' : 'mam-list'} className={inputCls} placeholder="Tür..."
                value={satisForm.stokTuru === 'hammadde' ? (satisForm.hammadde_turu||'') : (satisForm.mamul_turu||'')}
                onChange={e => setSatisForm(f => satisForm.stokTuru === 'hammadde' ? {...f, hammadde_turu: e.target.value} : {...f, mamul_turu: e.target.value})}/></div>
            <div><label className={labelCls}>Miktar (kg) *</label>
              <input type="number" min="0" className={inputCls} placeholder="0" value={satisForm.miktar||''} onChange={e => setSatisForm(f => ({...f, miktar: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Satış Fiyatı (₺/kg) *</label>
              <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={satisForm.satisFiyati||''} onChange={e => setSatisForm(f => ({...f, satisFiyati: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Nakliye Bedeli (₺)</label>
              <input type="number" min="0" className={inputCls} placeholder="0" value={satisForm.nakliyeBedeli||''} onChange={e => setSatisForm(f => ({...f, nakliyeBedeli: Number(e.target.value)}))}/></div>
            <div><label className={labelCls}>Notlar</label>
              <input type="text" className={inputCls} placeholder="..." value={satisForm.notlar||''} onChange={e => setSatisForm(f => ({...f, notlar: e.target.value}))}/></div>
          </div>
          {showCalc && (
            <div className="mt-4 flex flex-wrap gap-6 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Brüt Satış Tutarı</div>
                <div className="text-lg font-black text-blue-700">₺ {fmt((Number(satisForm.miktar)||0)*(Number(satisForm.satisFiyati)||0))}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Net Satış Geliri</div>
                <div className="text-lg font-black text-emerald-600">₺ {fmt((Number(satisForm.miktar)||0)*(Number(satisForm.satisFiyati)||0)-(Number(satisForm.nakliyeBedeli)||0))}</div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={satisKaydet} disabled={loading} className="btn-premium btn-premium-dark px-6 py-2.5 text-sm flex items-center gap-2">
              <Check size={14}/>{satisDuzenleId ? 'Güncelle' : 'Kaydet'}
            </button>
            {satisDuzenleId && <button onClick={() => { setSatisDuzenleId(null); setSatisForm(BOSH_SATIS()); }} className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"><X size={14}/>İptal</button>}
          </div>
        </div>

        <FilterBar>
          <input type="text" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--enba-orange)]/50 w-44" placeholder="Müşteri ara..." value={satisFiltre.musteri} onChange={e => setSatisFiltre(f => ({...f, musteri: e.target.value}))}/>
          <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={satisFiltre.bas} onChange={e => setSatisFiltre(f => ({...f, bas: e.target.value}))}/>
          <span className="text-slate-300 font-bold">—</span>
          <input type="date" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={satisFiltre.bit} onChange={e => setSatisFiltre(f => ({...f, bit: e.target.value}))}/>
          {(satisFiltre.musteri || satisFiltre.bas || satisFiltre.bit) && (
            <button onClick={() => setSatisFiltre({ musteri:'', bas:'', bit:'' })} className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"><X size={12}/>Temizle</button>
          )}
        </FilterBar>

        {filtreliSatislar.length > 0 && (
          <SummaryBadges items={[
            { lbl: 'Kayıt',      val: filtreliSatislar.length + ' adet',      color: 'text-blue-600' },
            { lbl: 'Toplam kg',  val: fmt(topKg, 0) + ' kg',                  color: 'text-purple-600' },
            { lbl: 'Brüt Gelir', val: '₺ ' + fmt(topGelir),                  color: 'text-emerald-600' },
            { lbl: 'Net Gelir',  val: '₺ ' + fmt(topGelir - topNakliye),     color: 'text-teal-600' },
          ]}/>
        )}

        <div className="enba-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Tarih','Müşteri','Tür','Ürün','Miktar kg','₺/kg','Nakliye','Net Gelir ₺','Notlar',''].map(h => (
                    <th key={h} className={['Miktar kg','₺/kg','Nakliye','Net Gelir ₺'].includes(h) ? thRCls : thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtreliSatislar.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-slate-400 italic text-sm">Kayıt bulunamadı</td></tr>
                ) : filtreliSatislar.map(s => {
                  const urun     = s.stokTuru === 'hammadde' ? s.hammadde_turu : s.mamul_turu;
                  const netGelir = (Number(s.miktar)||0)*(Number(s.satisFiyati)||0)-(Number(s.nakliyeBedeli)||0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={tdCls + ' text-slate-500 whitespace-nowrap'}>{tarihFmt(s.tarih)}</td>
                      <td className={tdCls + ' font-semibold'}>{s.musteriAdi}</td>
                      <td className={tdCls}>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${s.stokTuru==='mamul' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {s.stokTuru === 'mamul' ? 'Mamül' : 'Hammadde'}
                        </span>
                      </td>
                      <td className={tdCls + ' text-slate-500'}>{urun}</td>
                      <td className={tdRCls}>{fmt(Number(s.miktar)||0, 0)}</td>
                      <td className={tdRCls}>{Number(s.satisFiyati)||0}</td>
                      <td className={tdRCls}>{fmt(Number(s.nakliyeBedeli)||0)}</td>
                      <td className={tdRCls + (netGelir >= 0 ? ' text-emerald-600 font-bold' : ' text-red-500 font-bold')}>{fmt(netGelir)}</td>
                      <td className={tdCls + ' text-slate-400 max-w-[100px] truncate'}>{s.notlar}</td>
                      <td className="px-3 py-3.5 border-b border-slate-50 whitespace-nowrap">
                        <button onClick={() => { setSatisForm({...s}); setSatisDuzenleId(s.id!); window.scrollTo(0,0); }} className="p-1.5 text-slate-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-colors mr-1" title="Düzenle"><Pencil size={14}/></button>
                        <button onClick={() => setSilOnay({ tip:'satis', id: s.id! })} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sil"><Trash2 size={14}/></button>
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

  // ── STOK DURUMU ─────────────────────────────────────────────────────────────
  function renderStok() {
    const turler = Object.keys(stokOzeti);
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Hammadde Stok" value={fmt(topNetStok, 0) + ' kg'} sub={'₺ ' + fmt(topStokDeg)} color="text-[var(--enba-orange)]"/>
          <KpiCard label="Stok Değeri"   value={'₺ ' + fmt(topStokDeg)} sub="Ağırlıklı ort. maliyet" color="text-[var(--enba-orange)]"/>
          <KpiCard label="Toplam Net Alış" value={fmt(topAlisKg, 0) + ' kg'} sub={alislar.length + ' alış kaydı'} color="text-[var(--enba-dark)]"/>
          <KpiCard label="Toplam Satış" value={fmt(topSatisKg, 0) + ' kg'} sub={'₺ ' + fmt(topSatisTL)} color="text-[var(--enba-dark)]"/>
        </div>

        <div className="enba-card">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-5 flex items-center gap-2">
            <Package size={16} className="text-[var(--enba-orange)]"/> Hammadde Stok — Türe Göre
          </h3>
          {turler.length === 0
            ? <div className="text-center py-12 text-slate-400 italic text-sm">Henüz alış kaydı yok</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>{['Hammadde Türü','Toplam Alınan','Toplam Satılan','Mevcut Stok','Ort. Mal. ₺/kg','Stok Değeri ₺','Durum'].map(h => (
                      <th key={h} className={['Toplam Alınan','Toplam Satılan','Mevcut Stok','Ort. Mal. ₺/kg','Stok Değeri ₺'].includes(h) ? thRCls : thCls}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {turler.map(tur => {
                      const o = stokOzeti[tur];
                      const ns = o.netStok || 0;
                      const dur = ns <= 0 ? { lbl:'Tükendi', cls:'bg-red-100 text-red-700' } : ns < (o.netAlis * 0.1) ? { lbl:'Kritik', cls:'bg-amber-100 text-amber-700' } : { lbl:'Normal', cls:'bg-emerald-100 text-emerald-700' };
                      return (
                        <tr key={tur} className="hover:bg-slate-50/80 transition-colors">
                          <td className={tdCls + ' font-semibold'}>{tur}</td>
                          <td className={tdRCls}>{fmt(o.netAlis, 0)} kg</td>
                          <td className={tdRCls}>{fmt(o.satilanKg, 0)} kg</td>
                          <td className={tdRCls + (ns > 0 ? ' text-emerald-600 font-bold' : ' text-red-500 font-bold')}>{fmt(Math.max(0, ns), 0)} kg</td>
                          <td className={tdRCls}>{(o.ortMal||0).toFixed(2)}</td>
                          <td className={tdRCls + ' text-amber-600 font-bold'}>{fmt(o.stokDeg||0)}</td>
                          <td className={tdCls}><span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${dur.cls}`}>{dur.lbl}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Paraşüt Entegrasyon Paneli */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <RefreshCw size={80} />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${parasutConnected ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                        <LinkIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-enba-dark tracking-tight">Paraşüt Ürün & Stok Senkronizasyonu</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {parasutConnected 
                                ? "Paraşüt'teki tüm ürünleri ve güncel stok miktarlarını buraya yansıtın." 
                                : "Bu özelliği kullanmak için önce Paraşüt modülünden giriş yapmalısınız."}
                        </p>
                    </div>
                </div>

                {parasutConnected && (
                    <button
                        onClick={handleParasutSync}
                        disabled={isSyncing}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-enba-orange text-white hover:bg-enba-dark shadow-lg shadow-enba-orange/20'}`}
                    >
                        {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        {isSyncing ? 'Senkronize Ediliyor...' : 'Paraşüt\'ten Veri Çek'}
                    </button>
                )}
            </div>
        </div>

        {parasutItems.length > 0 && (
          <div className="enba-card border-t-4 border-t-orange-400">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight flex items-center gap-2">
                <RefreshCw size={16} className="text-orange-500"/> Paraşüt'ten Gelen Ürünler
              </h3>
              <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full">{parasutItems.length} Ürün Bulundu</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Ürün Adı','Kod','Kategori','Stok Miktarı','Birim','Liste Fiyatı','Döviz'].map(h => (
                      <th key={h} className={['Stok Miktarı','Liste Fiyatı'].includes(h) ? thRCls : thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parasutItems.map(pi => (
                    <tr key={pi.id} className="hover:bg-orange-50/30 transition-colors border-b border-slate-50">
                      <td className={tdCls + ' font-bold'}>{pi.name}</td>
                      <td className={tdCls + ' text-slate-500'}>{pi.code || '—'}</td>
                      <td className={tdCls}><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{pi.category_name || 'Genel'}</span></td>
                      <td className={tdRCls + ' text-orange-600 font-black'}>{fmt(pi.stock_count, 0)}</td>
                      <td className={tdCls + ' text-center text-slate-400 font-bold'}>{pi.unit}</td>
                      <td className={tdRCls}>{fmt(pi.list_price)}</td>
                      <td className={tdCls + ' text-center font-bold text-slate-500'}>{pi.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[10px] text-gray-400 italic font-medium">* Bu tablo Paraşüt API'sinden çekilen anlık verileri gösterir. Yerel stok kayıtlarını etkilemez.</p>
          </div>
        )}
      </div>
    );
  }

  // ── RAPORLAR ────────────────────────────────────────────────────────────────
  function renderRaporlar() {
    const tedOz: Record<string, { brutKg:number; netKg:number; mal:number; adet:number }> = {};
    alislar.forEach(a => {
      const k = a.tedarikciAdi || 'Bilinmiyor';
      if (!tedOz[k]) tedOz[k] = { brutKg:0, netKg:0, mal:0, adet:0 };
      tedOz[k].brutKg += Number(a.brutMiktar)||0;
      tedOz[k].netKg  += Number(a.netMiktar)||0;
      tedOz[k].mal    += (Number(a.netMiktar)||0)*(Number(a.birimMaliyet)||0);
      tedOz[k].adet++;
    });
    const musOz: Record<string, { kg:number; gelir:number; adet:number }> = {};
    satislar.forEach(s => {
      const k = s.musteriAdi || 'Bilinmiyor';
      if (!musOz[k]) musOz[k] = { kg:0, gelir:0, adet:0 };
      musOz[k].kg    += Number(s.miktar)||0;
      musOz[k].gelir += (Number(s.miktar)||0)*(Number(s.satisFiyati)||0)-(Number(s.nakliyeBedeli)||0);
      musOz[k].adet++;
    });
    const ayOz: Record<string, { alisKg:number; alisMal:number; satisKg:number; satisGelir:number }> = {};
    alislar.forEach(a => {
      const ay = (a.tarih||'').slice(0,7)||'?';
      if (!ayOz[ay]) ayOz[ay] = { alisKg:0, alisMal:0, satisKg:0, satisGelir:0 };
      ayOz[ay].alisKg  += Number(a.netMiktar)||0;
      ayOz[ay].alisMal += (Number(a.netMiktar)||0)*(Number(a.birimMaliyet)||0);
    });
    satislar.forEach(s => {
      const ay = (s.tarih||'').slice(0,7)||'?';
      if (!ayOz[ay]) ayOz[ay] = { alisKg:0, alisMal:0, satisKg:0, satisGelir:0 };
      ayOz[ay].satisKg    += Number(s.miktar)||0;
      ayOz[ay].satisGelir += (Number(s.miktar)||0)*(Number(s.satisFiyati)||0)-(Number(s.nakliyeBedeli)||0);
    });
    const aylar = Object.keys(ayOz).sort();
    const empty = (cols: number) => <tr><td colSpan={cols} className="py-10 text-center text-slate-400 italic text-sm">Veri yok</td></tr>;

    return (
      <div className="flex flex-col gap-6">
        {/* Tedarikçi raporu */}
        <div className="enba-card">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-5 flex items-center gap-2">
            <Truck size={16} className="text-[var(--enba-orange)]"/> Tedarikçi Bazında Alış Raporu
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{['Tedarikçi','Alış Adedi','Brüt kg','Net kg','Toplam Maliyet ₺','Ort. Birim Mal.'].map(h => (
                <th key={h} className={['Alış Adedi','Brüt kg','Net kg','Toplam Maliyet ₺','Ort. Birim Mal.'].includes(h) ? thRCls : thCls}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {Object.keys(tedOz).length === 0 ? empty(6) : Object.entries(tedOz).sort((a,b) => b[1].mal - a[1].mal).map(([adi, o]) => (
                  <tr key={adi} className="hover:bg-slate-50/80 transition-colors">
                    <td className={tdCls + ' font-semibold'}>{adi}</td>
                    <td className={tdRCls}>{o.adet}</td>
                    <td className={tdRCls}>{fmt(o.brutKg, 0)}</td>
                    <td className={tdRCls + ' text-emerald-600 font-bold'}>{fmt(o.netKg, 0)}</td>
                    <td className={tdRCls + ' text-amber-600 font-bold'}>₺ {fmt(o.mal)}</td>
                    <td className={tdRCls}>{o.netKg > 0 ? (o.mal/o.netKg).toFixed(2) : '—'} ₺/kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Müşteri raporu */}
        <div className="enba-card">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-5 flex items-center gap-2">
            <Users size={16} className="text-[var(--enba-orange)]"/> Müşteri Bazında Satış Raporu
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{['Müşteri','Satış Adedi','Toplam kg','Net Gelir ₺','Ort. Satış Fiyatı'].map(h => (
                <th key={h} className={['Satış Adedi','Toplam kg','Net Gelir ₺','Ort. Satış Fiyatı'].includes(h) ? thRCls : thCls}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {Object.keys(musOz).length === 0 ? empty(5) : Object.entries(musOz).sort((a,b) => b[1].gelir - a[1].gelir).map(([adi, o]) => (
                  <tr key={adi} className="hover:bg-slate-50/80 transition-colors">
                    <td className={tdCls + ' font-semibold'}>{adi}</td>
                    <td className={tdRCls}>{o.adet}</td>
                    <td className={tdRCls}>{fmt(o.kg, 0)}</td>
                    <td className={tdRCls + ' text-emerald-600 font-bold'}>₺ {fmt(o.gelir)}</td>
                    <td className={tdRCls}>{o.kg > 0 ? (o.gelir/o.kg).toFixed(2) : '—'} ₺/kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aylık özet */}
        <div className="enba-card">
          <h3 className="text-sm font-black text-[var(--enba-dark)] uppercase tracking-tight mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--enba-orange)]"/> Aylık Alış / Satış ve Marjin Özeti
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{['Dönem','Alış kg','Alış Maliyeti','Satış kg','Satış Geliri','Net Marjin','Marjin %'].map(h => (
                <th key={h} className={h !== 'Dönem' ? thRCls : thCls}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {aylar.length === 0 ? empty(7) : aylar.map(ay => {
                  const o = ayOz[ay];
                  const marjin = o.satisGelir - o.alisMal;
                  const pct    = o.alisMal > 0 ? marjin / o.alisMal * 100 : 0;
                  return (
                    <tr key={ay} className="hover:bg-slate-50/80 transition-colors">
                      <td className={tdCls + ' font-semibold'}>{ayFmt(ay + '-01')}</td>
                      <td className={tdRCls}>{fmt(o.alisKg, 0)}</td>
                      <td className={tdRCls + ' text-red-500'}>₺ {fmt(o.alisMal)}</td>
                      <td className={tdRCls}>{fmt(o.satisKg, 0)}</td>
                      <td className={tdRCls + ' text-emerald-600'}>₺ {fmt(o.satisGelir)}</td>
                      <td className={tdRCls + (marjin >= 0 ? ' text-emerald-600 font-bold' : ' text-red-500 font-bold')}>₺ {fmt(marjin)}</td>
                      <td className={tdRCls + (pct >= 0 ? ' text-teal-600 font-bold' : ' text-red-500 font-bold')}>{pct.toFixed(1)}%</td>
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

  // ── AYARLAR ─────────────────────────────────────────────────────────────────
  function renderAyarlar() {
    const ALT_TABS = [
      { id: 'hammadde',    label: 'Hammadde Türleri' },
      { id: 'mamul',       label: 'Mamül Türleri' },
      { id: 'tedarikciler',label: 'Tedarikçiler' },
      { id: 'musteriler',  label: 'Müşteriler' },
    ] as const;

    function ContactForm({ form, setForm, duzenleId, kaydet, iptal, tip }: {
      form: ReturnType<typeof BOSH_CONTACT>; setForm: any;
      duzenleId: string|null; kaydet: ()=>void; iptal: ()=>void; tip: string;
    }) {
      return (
        <div className="bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-100">
          <div className={`text-xs font-black uppercase tracking-widest mb-4 ${duzenleId ? 'text-amber-600' : 'text-emerald-600'}`}>
            {duzenleId ? `${tip} Düzenle` : `Yeni ${tip} Ekle`}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Ad / Unvan *</label>
              <input type="text" className={inputCls} placeholder={`${tip} adı...`} value={form.name} onChange={e => setForm((f: any) => ({...f, name: e.target.value}))}/></div>
            <div><label className={labelCls}>Telefon</label>
              <input type="text" className={inputCls} placeholder="0xxx..." value={form.telefon} onChange={e => setForm((f: any) => ({...f, telefon: e.target.value}))}/></div>
            <div><label className={labelCls}>E-posta</label>
              <input type="email" className={inputCls} placeholder="@..." value={form.eposta} onChange={e => setForm((f: any) => ({...f, eposta: e.target.value}))}/></div>
            <div className="sm:col-span-2"><label className={labelCls}>Adres</label>
              <input type="text" className={inputCls} placeholder="Adres..." value={form.adres} onChange={e => setForm((f: any) => ({...f, adres: e.target.value}))}/></div>
            <div><label className={labelCls}>Notlar</label>
              <input type="text" className={inputCls} placeholder="..." value={form.notlar} onChange={e => setForm((f: any) => ({...f, notlar: e.target.value}))}/></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={kaydet} className="btn-premium btn-premium-dark px-5 py-2 text-sm flex items-center gap-1"><Check size={13}/>{duzenleId ? 'Güncelle' : 'Kaydet'}</button>
            {duzenleId && <button onClick={iptal} className="px-4 py-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"><X size={13}/>İptal</button>}
          </div>
        </div>
      );
    }

    function ContactTable({ liste, onEdit, onSil, tip }: { liste: ContactRecord[]; onEdit: (c: ContactRecord)=>void; onSil: (id: string)=>void; tip: 'ted'|'mus' }) {
      return liste.length === 0
        ? <div className="text-center py-10 text-slate-400 italic text-sm">Henüz kayıt yok</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{['Ad / Unvan','Telefon','E-posta','Adres','Notlar',''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {liste.map(x => (
                  <tr key={x.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={tdCls + ' font-semibold'}>{cName(x)}</td>
                    <td className={tdCls + ' text-slate-500'}>{x.telefon||'—'}</td>
                    <td className={tdCls + ' text-slate-500'}>{x.eposta||'—'}</td>
                    <td className={tdCls + ' text-slate-400 max-w-[160px] truncate'}>{x.adres||'—'}</td>
                    <td className={tdCls + ' text-slate-400 max-w-[120px] truncate'}>{x.notlar||'—'}</td>
                    <td className="px-3 py-3.5 border-b border-slate-50 whitespace-nowrap">
                      <button onClick={() => onEdit(x)} className="p-1.5 text-slate-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-colors mr-1" title="Düzenle"><Pencil size={14}/></button>
                      <button onClick={() => onSil(x.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sil"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }

    function ListeYonetim({ liste, setListe, yeni, setYeni, baslik }: { liste: string[]; setListe: (l: string[])=>void; yeni: string; setYeni: (s:string)=>void; baslik: string }) {
      return (
        <div>
          <div className="flex gap-2 mb-4">
            <input type="text" className={inputCls + ' max-w-xs'} placeholder={`Yeni ${baslik.toLowerCase()} türü...`}
              value={yeni} onChange={e => setYeni(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && yeni.trim() && !liste.includes(yeni.trim())) { setListe([...liste, yeni.trim()]); setYeni(''); }}}/>
            <button onClick={() => { if (yeni.trim() && !liste.includes(yeni.trim())) { setListe([...liste, yeni.trim()]); setYeni(''); }}} className="btn-premium btn-premium-dark px-4 py-2 text-sm">Ekle</button>
          </div>
          <div className="flex flex-col gap-1">
            {liste.map((item, i) => (
              <div key={item} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
                <span className="text-sm font-medium text-gray-700">{item}</span>
                {i >= (baslik === 'Hammadde' ? VARSAYILAN_HAMMADDE.length : VARSAYILAN_MAMUL.length) && (
                  <button onClick={() => setListe(liste.filter((_,j) => j !== i))} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12}/></button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="enba-card">
        <div className="flex gap-1 mb-6 bg-slate-100/60 p-1 rounded-xl self-start w-fit">
          {ALT_TABS.map(t => (
            <button key={t.id} onClick={() => setAyarAlt(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${ayarAlt === t.id ? 'bg-white text-[var(--enba-orange)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {ayarAlt === 'hammadde' && <ListeYonetim liste={hammaddeler} setListe={setHammaddeler} yeni={yeniHammadde} setYeni={setYeniHammadde} baslik="Hammadde"/>}
        {ayarAlt === 'mamul'    && <ListeYonetim liste={mamulListesi} setListe={setMamulListesi} yeni={yeniMamul} setYeni={setYeniMamul} baslik="Mamül"/>}
        {ayarAlt === 'tedarikciler' && (
          <>
            <ContactForm form={tedForm} setForm={setTedForm} duzenleId={tedDuzenleId} kaydet={tedKaydet} iptal={() => { setTedDuzenleId(null); setTedForm(BOSH_CONTACT()); }} tip="Tedarikçi"/>
            <ContactTable liste={tedarikciler} onEdit={c => { setTedForm({id:c.id, name:cName(c), telefon:c.telefon||'', eposta:c.eposta||'', adres:c.adres||'', notlar:c.notlar||''}); setTedDuzenleId(c.id); }} onSil={id => setSilOnay({tip:'ted', id})} tip="ted"/>
          </>
        )}
        {ayarAlt === 'musteriler' && (
          <>
            <ContactForm form={musForm} setForm={setMusForm} duzenleId={musDuzenleId} kaydet={musKaydet} iptal={() => { setMusDuzenleId(null); setMusForm(BOSH_CONTACT()); }} tip="Müşteri"/>
            <ContactTable liste={musteriler} onEdit={c => { setMusForm({id:c.id, name:cName(c), telefon:c.telefon||'', eposta:c.eposta||'', adres:c.adres||'', notlar:c.notlar||''}); setMusDuzenleId(c.id); }} onSil={id => setSilOnay({tip:'mus', id})} tip="mus"/>
          </>
        )}
      </div>
    );
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 p-10 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-enba-dark rounded-[1.2rem] flex items-center justify-center text-enba-orange shadow-2xl border border-white/5">
            <Package size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-enba-dark tracking-tighter uppercase leading-none">Stok Yönetimi</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px] mt-2">Alım · Satış · Stok · Raporlar</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-2xl self-start border border-slate-200/50 shadow-inner">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setAktifTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all
              ${aktifTab === tab.id
                ? 'bg-white text-[var(--enba-orange)] shadow-lg shadow-black/5 ring-1 ring-slate-100'
                : 'text-slate-400 hover:text-[var(--enba-dark)]'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab içerikleri */}
      {aktifTab === 'alislar'  && renderAlislar()}
      {aktifTab === 'satislar' && renderSatislar()}
      {aktifTab === 'stok'     && renderStok()}
      {aktifTab === 'raporlar' && renderRaporlar()}
      {aktifTab === 'ayarlar'  && renderAyarlar()}

      {/* Silme onay dialog */}
      {silOnay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSilOnay(null)}>
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-2xl"><AlertTriangle size={20} className="text-red-500"/></div>
              <div>
                <div className="text-sm font-black text-gray-800">Kaydı Sil</div>
                <div className="text-xs text-slate-400">Bu işlem geri alınamaz</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">Bu kaydı kalıcı olarak silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={silGercekles} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">Evet, Sil</button>
              <button onClick={() => setSilOnay(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
