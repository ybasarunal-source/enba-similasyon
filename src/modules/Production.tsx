import React, { useState, useEffect } from 'react';
import { DataService } from '../api/dataService';
import { fmt } from '../utils/formatters';
import { Factory, Pencil, Trash2, FileSpreadsheet, X, AlertTriangle, UserPlus } from 'lucide-react';

interface ProductionRecord {
  id?: string;
  tarih: string;
  vardiya: string;
  baslamaSaati: string;
  bitisSaati: string;
  calisanlar: { id: string; name: string; overtime: number }[];
  girenHammadde: number;
  cikanUrun: number;
  sayacBasi: number;
  sayacSonu: number;
  fireMiktar: number;
  fireOran: number;
  elektrikSarfiyat: number;
  calismaSureSaat: number;
}

interface Personnel {
  id: string;
  name: string;
  department?: string;
}

function sureHesapla(bas: string, bit: string): number {
  if (!bas || !bit) return 0;
  const [bH, bM] = bas.split(':').map(Number);
  const [eH, eM] = bit.split(':').map(Number);
  let basDak = bH * 60 + bM;
  let bitDak = eH * 60 + eM;
  if (bitDak < basDak) bitDak += 1440;
  return (bitDak - basDak) / 60;
}

function tarihFmt(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export const Production: React.FC = () => {
  const [kayitlar, setKayitlar]         = useState<ProductionRecord[]>([]);
  const [personelListesi, setPersonelListesi] = useState<Personnel[]>([]);
  const [loading, setLoading]           = useState(true);
  const [silOnayId, setSilOnayId]       = useState<string | null>(null);

  // Form
  const [tarih, setTarih]               = useState(new Date().toISOString().slice(0, 10));
  const [vardiya, setVardiya]           = useState('1. Vardiya');
  const [baslamaSaati, setBaslamaSaati] = useState('08:00');
  const [bitisSaati, setBitisSaati]     = useState('16:00');
  const [girenHammadde, setGirenHammadde] = useState('');
  const [cikanUrun, setCikanUrun]       = useState('');
  const [sayacBasi, setSayacBasi]       = useState('');
  const [sayacSonu, setSayacSonu]       = useState('');
  const [calisanlar, setCalisanlar]     = useState<{ id: string; name: string; overtime: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recs, pers] = await Promise.all([
        DataService.fetchData<any>('production_records'),
        DataService.fetchData<any>('personnel', '*'),
      ]);
      const mapped: ProductionRecord[] = (recs || []).map((r: any) => ({
        id:               r.id,
        tarih:            r.tarih,
        vardiya:          r.vardiya,
        baslamaSaati:     r.baslama_saati,
        bitisSaati:       r.bitis_saati,
        calisanlar:       r.calisanlar || [],
        girenHammadde:    Number(r.giren_hammadde)   || 0,
        cikanUrun:        Number(r.cikan_urun)        || 0,
        sayacBasi:        Number(r.sayac_basi)        || 0,
        sayacSonu:        Number(r.sayac_sonu)        || 0,
        fireMiktar:       Number(r.fire_miktar)       || 0,
        fireOran:         Number(r.fire_oran)         || 0,
        elektrikSarfiyat: Number(r.elektrik_sarfiyat) || 0,
        calismaSureSaat:  Number(r.calisma_sure_saat) || 0,
      }));
      mapped.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
      setKayitlar(mapped);
      setPersonelListesi((pers || []).filter((p: any) => p.department === 'Üretim'));
      // Sayaç başını son kayıttan otomatik doldur
      if (mapped.length > 0 && mapped[0].sayacSonu) {
        setSayacBasi(mapped[0].sayacSonu.toString());
      }
    } catch (e) {
      console.error('Üretim verileri yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const eklePersonel = (id: string) => {
    const p = personelListesi.find(x => x.id === id);
    if (p && !calisanlar.find(c => c.id === id)) {
      setCalisanlar(prev => [...prev, { id: p.id, name: p.name, overtime: 0 }]);
    }
  };

  const cikarPersonel = (id: string) => setCalisanlar(prev => prev.filter(c => c.id !== id));

  const guncelleFazlaMesai = (id: string, val: string) =>
    setCalisanlar(prev => prev.map(c => c.id === id ? { ...c, overtime: Number(val) || 0 } : c));

  const kayitEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    const giren = Number(girenHammadde) || 0;
    const cikan = Number(cikanUrun) || 0;
    const basi  = Number(sayacBasi) || 0;
    const sonu  = Number(sayacSonu) || 0;

    const fireMiktar       = giren - cikan;
    const fireOran         = giren > 0 ? (fireMiktar / giren) * 100 : 0;
    const elektrikSarfiyat = sonu - basi;
    const calismaSureSaat  = sureHesapla(baslamaSaati, bitisSaati);

    const payload = {
      tarih,
      vardiya,
      baslama_saati:     baslamaSaati,
      bitis_saati:       bitisSaati,
      calisanlar,
      giren_hammadde:    giren,
      cikan_urun:        cikan,
      sayac_basi:        basi,
      sayac_sonu:        sonu,
      fire_miktar:       fireMiktar,
      fire_oran:         fireOran,
      elektrik_sarfiyat: elektrikSarfiyat,
      calisma_sure_saat: calismaSureSaat,
    };

    try {
      await DataService.insertData('production_records', payload);
      await loadData();
      setGirenHammadde('');
      setCikanUrun('');
      setSayacSonu('');
      setCalisanlar([]);
    } catch { alert('Kayıt eklenemedi.'); }
  };

  const kayitSil = async () => {
    if (!silOnayId) return;
    try {
      await DataService.deleteData('production_records', silOnayId);
      setKayitlar(prev => prev.filter(k => k.id !== silOnayId));
      setSilOnayId(null);
    } catch { alert('Kayıt silinemedi.'); }
  };

  // Canlı hesaplamalar (form önizlemesi)
  const prevGiren     = Number(girenHammadde) || 0;
  const prevCikan     = Number(cikanUrun) || 0;
  const prevFire      = prevGiren - prevCikan;
  const prevFireOran  = prevGiren > 0 ? (prevFire / prevGiren) * 100 : 0;
  const prevElektrik  = (Number(sayacSonu) || 0) - (Number(sayacBasi) || 0);
  const prevSure      = sureHesapla(baslamaSaati, bitisSaati);
  const showPreview   = prevGiren > 0 || prevCikan > 0;

  const inputCls = "w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-enba-dark focus:bg-white focus:ring-2 focus:ring-[var(--enba-orange)]/20 outline-none transition-all";
  const labelCls = "block text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-2 ml-1";

  return (
    <div className="flex flex-col gap-8 p-2 animate-in fade-in duration-500">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--enba-dark)] rounded-2xl flex items-center justify-center text-[var(--enba-orange)] shadow-xl">
          <Factory size={26}/>
        </div>
        <div>
          <h2 className="text-2xl font-black text-[var(--enba-dark)] tracking-tight uppercase leading-none">
            Günlük Üretim Takibi
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Vardiya Bazlı Fabrika Operasyonel Kayıt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ── FORM ── */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-8 shadow-card border border-gray-100 sticky top-6">
          <div className="flex items-center justify-between mb-7">
            <h3 className="text-xs font-black text-[var(--enba-dark)] uppercase tracking-[3px] flex items-center gap-2">
              <Pencil size={16} className="text-[var(--enba-orange)]"/> Vardiya Kayıt Formu
            </h3>
            <div className="w-2 h-2 rounded-full bg-[var(--enba-orange)] animate-pulse"/>
          </div>

          <form onSubmit={kayitEkle} className="flex flex-col gap-5">
            {/* Tarih + Vardiya */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tarih</label>
                <input type="date" required className={inputCls} value={tarih} onChange={e => setTarih(e.target.value)}/>
              </div>
              <div>
                <label className={labelCls}>Vardiya</label>
                <select required className={inputCls + ' appearance-none'} value={vardiya} onChange={e => setVardiya(e.target.value)}>
                  <option>1. Vardiya</option>
                  <option>2. Vardiya</option>
                  <option>3. Vardiya</option>
                </select>
              </div>
            </div>

            {/* Başlama / Bitiş */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Başlama Saati</label>
                <input type="time" required className={inputCls} value={baslamaSaati} onChange={e => setBaslamaSaati(e.target.value)}/>
              </div>
              <div>
                <label className={labelCls}>Bitiş Saati</label>
                <input type="time" required className={inputCls} value={bitisSaati} onChange={e => setBitisSaati(e.target.value)}/>
              </div>
            </div>

            {/* Personel Seçimi */}
            <div>
              <label className={labelCls + ' flex items-center gap-1'}><UserPlus size={11}/>Personel Seçimi</label>
              <select
                className={inputCls + ' appearance-none mb-3'}
                onChange={e => { if (e.target.value) { eklePersonel(e.target.value); e.target.value = ''; }}}
                defaultValue=""
              >
                <option value="" disabled>Personel ekle...</option>
                {personelListesi.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-3 border border-slate-100 min-h-[52px]">
                {calisanlar.length === 0
                  ? <div className="text-xs text-slate-400 text-center py-2">Henüz personel eklenmedi</div>
                  : calisanlar.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <div className="flex-1 text-xs font-bold text-[var(--enba-dark)]">{c.name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-[var(--enba-orange)]">FM:</span>
                        <input
                          type="number" step="0.5" min="0"
                          className="w-12 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-[var(--enba-orange)]/50 bg-slate-50"
                          value={c.overtime}
                          onChange={e => guncelleFazlaMesai(c.id, e.target.value)}
                        />
                        <span className="text-[9px] text-slate-400">s</span>
                      </div>
                      <button type="button" onClick={() => cikarPersonel(c.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X size={12}/></button>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Hammadde / Ürün */}
            <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[var(--enba-orange)] uppercase tracking-[3px] mb-2 ml-1">Giren Hammadde (kg)</label>
                  <input
                    type="number" step="0.01" min="0" required placeholder="0"
                    className="w-full bg-white border-2 border-[var(--enba-orange)] rounded-2xl px-4 py-3 text-lg font-black text-[var(--enba-dark)] outline-none focus:ring-2 focus:ring-orange-300/30 transition-all tabular-nums"
                    value={girenHammadde}
                    onChange={e => setGirenHammadde(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[3px] mb-2 ml-1">Çıkan Ürün (kg)</label>
                  <input
                    type="number" step="0.01" min="0" required placeholder="0"
                    className="w-full bg-white border-2 border-emerald-400 rounded-2xl px-4 py-3 text-lg font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-300/30 transition-all tabular-nums"
                    value={cikanUrun}
                    onChange={e => setCikanUrun(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sayaç */}
            <div className="p-5 bg-[var(--enba-dark)] rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-2 ml-1">Sayaç Başı (kWh)</label>
                <input
                  type="number" step="0.1" placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base font-black text-[var(--enba-orange)] outline-none focus:bg-white/10 transition-all tabular-nums"
                  value={sayacBasi}
                  onChange={e => setSayacBasi(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-2 ml-1">Sayaç Sonu (kWh)</label>
                <input
                  type="number" step="0.1" placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base font-black text-[var(--enba-orange)] outline-none focus:bg-white/10 transition-all tabular-nums"
                  value={sayacSonu}
                  onChange={e => setSayacSonu(e.target.value)}
                />
              </div>
            </div>

            {/* Canlı önizleme */}
            {showPreview && (
              <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div><div className="text-slate-400 mb-0.5">Çalışma Süresi</div><div className="font-black text-[var(--enba-dark)]">{prevSure.toFixed(1)} saat</div></div>
                <div><div className="text-slate-400 mb-0.5">Fire Miktarı</div><div className="font-black text-red-500">{fmt(prevFire, 1)} kg</div></div>
                <div><div className="text-slate-400 mb-0.5">Fire Oranı</div><div className="font-black text-amber-600">% {prevFireOran.toFixed(1)}</div></div>
                {prevElektrik > 0 && <div><div className="text-slate-400 mb-0.5">Elektrik</div><div className="font-black text-slate-600">{fmt(prevElektrik, 1)} kWh</div></div>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--enba-dark)] text-white rounded-2xl py-4 font-black text-xs uppercase tracking-[4px] shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              Üretimi Kaydet
            </button>
          </form>
        </div>

        {/* ── TABLO ── */}
        <div className="xl:col-span-8 bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-7 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div>
              <h3 className="text-base font-black text-[var(--enba-dark)] uppercase tracking-tight">Üretim Operasyon Arşivi</h3>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[3px] mt-0.5">Vardiya Bazlı Fabrika Performans Kayıtları</p>
            </div>
            <button
              onClick={() => {
                const rows = kayitlar.map(k => ({
                  Tarih: k.tarih, Vardiya: k.vardiya,
                  'Başlama': k.baslamaSaati, 'Bitiş': k.bitisSaati, 'Süre (s)': k.calismaSureSaat,
                  'Personel': k.calisanlar?.map(c => c.name).join(', ') || '',
                  'Giren kg': k.girenHammadde, 'Çıkan kg': k.cikanUrun,
                  'Fire kg': k.fireMiktar, 'Fire %': k.fireOran,
                  'Elektrik kWh': k.elektrikSarfiyat,
                }));
                const csv = [Object.keys(rows[0] || {}).join(';'), ...rows.map(r => Object.values(r).join(';'))].join('\n');
                const a = document.createElement('a');
                a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
                a.download = `Enba_Uretim_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              disabled={kayitlar.length === 0}
              className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase border border-emerald-100 bg-white px-5 py-2.5 rounded-2xl transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16}/> CSV İndir
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  {[
                    ['Tarih / Vardiya', ''],
                    ['Saat / Süre', ''],
                    ['Personel', ''],
                    ['Hammadde kg', 'text-right'],
                    ['Mamul kg', 'text-right'],
                    ['Fire', 'text-right'],
                    ['Elektrik', 'text-right'],
                    ['', 'text-center'],
                  ].map(([h, align]) => (
                    <th key={h} className={`px-6 py-5 text-[9px] font-black text-gray-400 uppercase tracking-[3px] border-b border-gray-100 ${align}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kayitlar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <Factory size={32} className="text-gray-200"/>
                        </div>
                        <span className="text-[10px] font-black text-gray-300 tracking-[4px] uppercase">Kayıtlı üretim verisi bulunamadı</span>
                      </div>
                    </td>
                  </tr>
                ) : kayitlar.map(k => (
                  <tr key={k.id} className="group hover:bg-gray-50/80 transition-all">
                    {/* Tarih / Vardiya */}
                    <td className="px-6 py-5">
                      <div className="text-sm font-black text-[var(--enba-dark)] tracking-tight tabular-nums">{tarihFmt(k.tarih)}</div>
                      <div className="mt-1 px-2 py-0.5 bg-[var(--enba-dark)]/5 text-[var(--enba-dark)] text-[9px] font-black uppercase tracking-widest inline-block rounded-md">{k.vardiya}</div>
                    </td>
                    {/* Saat / Süre */}
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-gray-600 tabular-nums">{k.baslamaSaati} — {k.bitisSaati}</div>
                      <div className="text-[10px] font-black text-slate-400 mt-0.5">{fmt(k.calismaSureSaat, 1)} saat</div>
                    </td>
                    {/* Personel */}
                    <td className="px-6 py-5 max-w-[160px]">
                      {Array.isArray(k.calisanlar) && k.calisanlar.length > 0
                        ? <div className="flex flex-col gap-1">
                            {k.calisanlar.map(c => (
                              <div key={c.id} className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                <span className="text-[11px] font-semibold text-gray-700">{c.name}</span>
                                {c.overtime > 0 && (
                                  <span className="text-[9px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">+{c.overtime}s FM</span>
                                )}
                              </div>
                            ))}
                          </div>
                        : <span className="text-xs text-slate-300">—</span>
                      }
                    </td>
                    {/* Hammadde */}
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-[var(--enba-orange)] tabular-nums">{fmt(k.girenHammadde)}</span>
                    </td>
                    {/* Mamul */}
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-emerald-600 tabular-nums">{fmt(k.cikanUrun)}</span>
                    </td>
                    {/* Fire */}
                    <td className="px-6 py-5 text-right">
                      <div className="text-sm font-black text-red-500 tabular-nums">{fmt(k.fireMiktar)} kg</div>
                      <div className="text-[10px] font-black text-red-400">% {fmt(k.fireOran, 1)}</div>
                    </td>
                    {/* Elektrik */}
                    <td className="px-6 py-5 text-right">
                      <div className="text-xs font-bold text-slate-600 tabular-nums">{fmt(k.elektrikSarfiyat, 1)} kWh</div>
                      <div className="text-[9px] text-slate-400">{k.sayacBasi} → {k.sayacSonu}</div>
                    </td>
                    {/* Silme */}
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => setSilOnayId(k.id!)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-rose-100 opacity-0 group-hover:opacity-100"
                        title="Sil"
                      >
                        <Trash2 size={15}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Silme Onay Dialog */}
      {silOnayId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSilOnayId(null)}>
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-2xl"><AlertTriangle size={20} className="text-red-500"/></div>
              <div>
                <div className="text-sm font-black text-gray-800">Kaydı Sil</div>
                <div className="text-xs text-slate-400">Bu işlem geri alınamaz</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">Bu üretim kaydını kalıcı olarak silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={kayitSil} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">Evet, Sil</button>
              <button onClick={() => setSilOnayId(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
