import React from 'react';
import { fmt } from '../utils/formatters';
import { Layout, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';

interface DashboardMatrixProps {
  aktifPlanlar: any[];
  sonuc: any;
  grupGosterim: Record<string, boolean>;
  setGrupGosterim: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  exportToExcel: () => void;
  exportToPDF: () => void;
}

export const DashboardMatrix: React.FC<DashboardMatrixProps> = ({
  aktifPlanlar,
  sonuc,
  grupGosterim,
  setGrupGosterim,
  exportToExcel,
  exportToPDF
}) => {
  if (aktifPlanlar.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-3xl p-8 shadow-card border border-[var(--border-subtle)] mt-8" id="exportable-report">
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-enba-orange">
            <Layout className="text-xl" size={20} /> TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ
          </h3>
        </div>
        <div className="text-center py-20 text-[var(--text-muted)] italic font-medium">
          Tesiste henüz veri yok. İPK ekleyerek başlayın.
        </div>
      </div>
    );
  }

  const uniqueGelirler = new Set<string>();
  const uniqueGiderKodlari = new Set<string>();
  
  aktifPlanlar.forEach(p => {
    p.satisDetaylari?.forEach((d: any) => { if(d.tutar > 0) uniqueGelirler.add(d.ad); });
    Object.keys(p.giderler || {}).forEach(k => {
      if(Number(p.giderler[k]) > 0) uniqueGiderKodlari.add(k);
    });
  });

  const gelirAdlari = Array.from(uniqueGelirler);
  const giderKodlari = Array.from(uniqueGiderKodlari).sort();

  return (
    <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-100 mt-8" id="exportable-report">
      <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-4 mb-6">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-enba-orange">
          <Layout className="text-xl" size={20} /> TKKÖ - TESİS KONSOLİDE KÂRLILIK ÖZETİ
        </h3>
        <div className="flex gap-2" data-html2canvas-ignore="true">
          <button 
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] font-bold text-[var(--text-secondary)] transition-shadow hover:shadow-md"
            onClick={exportToExcel}
          >
            <FileSpreadsheet className="text-green-600" size={18} /> EXCEL
          </button>
          <button 
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] font-bold text-[var(--text-secondary)] transition-shadow hover:shadow-md"
            onClick={exportToPDF}
          >
            <FileText className="text-red-600" size={18} /> PDF
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm" id="tkko-table">
          <thead>
            <tr className="border-b-2 border-[var(--border-subtle)]">
               <th className="py-4 font-extrabold text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Finansal Kalemler</th>
              {aktifPlanlar.map(p => (
                <th key={p.id} className="py-4 px-4 font-bold text-[var(--text-primary)] text-right">{p.baslik}</th>
              ))}
              <th className="py-4 pl-4 font-black text-enba-orange text-right text-xs uppercase tracking-tight">Toplam Tesis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {/* Gelirler Header */}
            <tr className="bg-[var(--bg-surface-low)]">
              <td colSpan={aktifPlanlar.length + 2} className="py-3 px-4 text-[11px] font-black text-enba-orange-dark uppercase tracking-[2px]">
                <TrendingUp className="mr-2 inline" size={16} /> Gelirler
              </td>
            </tr>
            
            {gelirAdlari.map(ad => {
              let satirToplam = 0;
              return (
                <tr key={ad} className="hover:bg-[var(--bg-surface-low)] transition-colors">
                  <td className="py-3 px-4 font-medium text-[var(--text-secondary)]">{ad}</td>
                  {aktifPlanlar.map(p => {
                    const tutar = p.satisDetaylari?.filter((d: any) => d.ad === ad).reduce((a: number, b: any) => a + b.tutar, 0) || 0;
                    satirToplam += tutar;
                    return <td key={p.id} className="py-3 px-4 text-right tabular-nums">{tutar > 0 ? fmt(tutar) : '-'}</td>;
                  })}
                  <td className="py-3 px-4 text-right font-bold text-enba-orange tabular-nums">{fmt(satirToplam)} ₺</td>
                </tr>
              )
            })}

            <tr className="bg-orange-50/30 font-black border-t-2 border-orange-100">
              <td className="py-4 px-4 text-[var(--text-primary)]">TOPLAM GELİR</td>
              {aktifPlanlar.map(p => <td key={p.id} className="py-4 px-4 text-right tabular-nums">{fmt(p.ozetGelir)}</td>)}
              <td className="py-4 px-4 text-right text-enba-orange-dark text-base tabular-nums">{fmt(sonuc.gelir)} ₺</td>
            </tr>

            {/* Giderler Section Placeholder - To be fully implemented with groups mapping */}
            <tr className="bg-red-50/30 font-black">
              <td className="py-4 px-4 text-[var(--text-primary)]">TOPLAM OPEX</td>
              {aktifPlanlar.map(p => <td key={p.id} className="py-4 px-4 text-right tabular-nums text-red-600">{fmt(p.ozetOpex)}</td>)}
              <td className="py-4 px-4 text-right text-red-700 text-base tabular-nums font-black">{fmt(sonuc.opex)} ₺</td>
            </tr>

            <tr className="bg-enba-dark/5 font-black border-y-2 border-enba-dark/10">
              <td className="py-4 px-4 text-enba-dark text-base">FAVÖK (EBITDA)</td>
              {aktifPlanlar.map(p => <td key={p.id} className="py-4 px-4 text-right text-base tabular-nums">{fmt(p.ebitda)}</td>)}
              <td className="py-4 px-4 text-right text-lg text-enba-orange-dark tabular-nums font-black">{fmt(sonuc.ebitda)} ₺</td>
            </tr>

            <tr className="bg-orange-600 text-white font-black border-t-4 border-enba-orange-dark">
              <td className="py-6 px-6 text-lg tracking-tight uppercase">Net Durum (Kâr / Zarar)</td>
              {aktifPlanlar.map(p => <td key={p.id} className="py-6 px-6 text-right text-xl tabular-nums">{fmt(p.netKar)}</td>)}
              <td className="py-6 px-6 text-right text-3xl tabular-nums drop-shadow-md">{fmt(sonuc.net)} ₺</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
