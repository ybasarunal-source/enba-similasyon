/**
 * pnlStructure.ts — P&L hiyerarşi tanımı ve satır oluşturucu
 *
 * Tüm M-kodları mcodeList.ts'ten gelir.
 * Her satır "hesaplanan" (ProductionCalcResult'tan) veya "girilen" (PlanMCodeEntry'den)
 * veya "CostCenter" (tesis sabit giderinden) olabilir.
 */
import { MCODE_LIST } from '@/api/mcodeList';
import {
  PlanMCodeEntry, PlanMCodeStatus, PnLRow,
  ProductionCalcResult, FixedExpense, CostCenter,
} from './dpData';

// ─── Kaynak tipleri ───────────────────────────────────────────────────────────
type RowSource =
  | 'calc_revenue'        // productOutputs toplam geliri
  | 'calc_fraction'       // fractionOutputs satış geliri
  | 'calc_input_material' // inputMaterialCost (M305 düzeyi)
  | 'calc_material'       // totalMaterialCost (ham + yardımcı)
  | 'calc_energy'         // totalEnergyCost
  | 'calc_labor'          // totalLaborCost
  | 'calc_packaging'      // ambalaj toplamı
  | 'calc_other'          // otherCosts toplamı
  | 'mcode_entry'         // plan.mcodeEntries içinden
  | 'cost_center'         // CostCenter.fixedExpenses içinden (mcode eşleşmesi)
  | 'formula_subtotal'    // diğer satırların toplamı — UI'da hesaplanır
  | 'tax';                // EBIT × 0.22 otomatik

// ─── Tek kalem tanımı ────────────────────────────────────────────────────────
interface PnLItemDef {
  mcode:     string;
  isExpense: boolean;     // true = P&L'de eksi gösterilir
  source:    RowSource;
  level:     0 | 1 | 2;
}

// ─── Bölüm tanımı ────────────────────────────────────────────────────────────
interface PnLSectionDef {
  id:         string;
  label:      string;
  colorCls:   string;      // Tailwind border-color class
  subtotalMcode: string;   // bu bölümün toplam M-kodu
  items:      PnLItemDef[];
}

// ─── Tam P&L Hiyerarşisi ─────────────────────────────────────────────────────
export const PNL_SECTIONS: PnLSectionDef[] = [

  // ── 1. HASILAT ──────────────────────────────────────────────────────────────
  {
    id: 'hasilat', label: 'HASILAT', colorCls: 'border-emerald-500',
    subtotalMcode: 'M179',
    items: [
      { mcode: 'M105', isExpense: false, source: 'calc_revenue',   level: 1 },
      { mcode: 'M106', isExpense: false, source: 'mcode_entry',    level: 1 },
      { mcode: 'M109', isExpense: false, source: 'formula_subtotal', level: 1 }, // Brüt Satışlar
      { mcode: 'M115', isExpense: true,  source: 'mcode_entry',    level: 2 }, // Ciro Primi (indirim)
      { mcode: 'M116', isExpense: true,  source: 'mcode_entry',    level: 2 },
      { mcode: 'M120', isExpense: true,  source: 'mcode_entry',    level: 2 },
      { mcode: 'M125', isExpense: true,  source: 'mcode_entry',    level: 2 },
      { mcode: 'M126', isExpense: true,  source: 'mcode_entry',    level: 2 },
      { mcode: 'M130', isExpense: true,  source: 'mcode_entry',    level: 2 },
      { mcode: 'M139', isExpense: true,  source: 'formula_subtotal', level: 1 }, // İndirimler Toplam
      { mcode: 'M145', isExpense: false, source: 'mcode_entry',    level: 1 },
      { mcode: 'M146', isExpense: false, source: 'mcode_entry',    level: 1 },
      { mcode: 'M149', isExpense: false, source: 'formula_subtotal', level: 1 },
      { mcode: 'M155', isExpense: false, source: 'calc_fraction',  level: 1 },
      { mcode: 'M156', isExpense: false, source: 'mcode_entry',    level: 1 },
      { mcode: 'M159', isExpense: false, source: 'formula_subtotal', level: 1 },
      // M179 = TOPLAM NET SATIŞLAR (subtotal — formül)
    ],
  },

  // ── 2. SATIŞ GİDERLERİ ──────────────────────────────────────────────────────
  {
    id: 'satis_gider', label: 'SATIŞ GİDERLERİ', colorCls: 'border-orange-400',
    subtotalMcode: 'M249',
    items: [
      { mcode: 'M209', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M215', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M220', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M225', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M226', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M230', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M235', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M240', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M245', isExpense: true, source: 'mcode_entry', level: 1 },
      // M249 subtotal
    ],
  },

  // ── 3. MALZEME GİDERLERİ ────────────────────────────────────────────────────
  {
    id: 'malzeme', label: 'MALZEME GİDERLERİ', colorCls: 'border-red-500',
    subtotalMcode: 'M369',
    items: [
      { mcode: 'M305', isExpense: true, source: 'calc_input_material', level: 1 },
      { mcode: 'M310', isExpense: true, source: 'mcode_entry',         level: 1 },
      { mcode: 'M315', isExpense: true, source: 'calc_material',       level: 1 },
      { mcode: 'M320', isExpense: true, source: 'mcode_entry',         level: 1 },
      { mcode: 'M325', isExpense: true, source: 'mcode_entry',         level: 1 },
      { mcode: 'M339', isExpense: true, source: 'formula_subtotal',    level: 1 },
      { mcode: 'M349', isExpense: true, source: 'mcode_entry',         level: 1 },
      { mcode: 'M359', isExpense: true, source: 'mcode_entry',         level: 1 },
      // M369 subtotal + M399 (BRÜT KATKI PAYI) = ayrı toplam satırı
    ],
  },

  // ── 4. ENERJİ ────────────────────────────────────────────────────────────────
  {
    id: 'enerji', label: 'ENERJİ TÜKETİMİ', colorCls: 'border-yellow-500',
    subtotalMcode: 'M419',
    items: [
      { mcode: 'M405', isExpense: true, source: 'calc_energy',   level: 1 },
      { mcode: 'M410', isExpense: true, source: 'mcode_entry',   level: 1 },
      { mcode: 'M415', isExpense: true, source: 'mcode_entry',   level: 1 },
      // M419 subtotal
    ],
  },

  // ── 5. PERSONEL ──────────────────────────────────────────────────────────────
  {
    id: 'personel', label: 'PERSONEL GİDERLERİ', colorCls: 'border-blue-400',
    subtotalMcode: 'M489',
    items: [
      { mcode: 'M450', isExpense: true, source: 'calc_labor',  level: 1 },
      { mcode: 'M455', isExpense: true, source: 'mcode_entry', level: 2 },
      { mcode: 'M460', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M465', isExpense: true, source: 'mcode_entry', level: 2 },
      { mcode: 'M470', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M475', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M480', isExpense: true, source: 'mcode_entry', level: 1 },
      // M489 subtotal
    ],
  },

  // ── 6. BAKIM & ÇEVRE ─────────────────────────────────────────────────────────
  // mcode_entry: kullanıcı plan bazlı girer (cost_center değil — editable olmalı)
  {
    id: 'bakim_cevre', label: 'BAKIM & ÇEVRE', colorCls: 'border-teal-500',
    subtotalMcode: '',   // ayrı toplam yok
    items: [
      { mcode: 'M509', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M529', isExpense: true, source: 'mcode_entry', level: 1 },
    ],
  },

  // ── 7. GENEL GİDERLER ────────────────────────────────────────────────────────
  {
    id: 'genel_gider', label: 'GENEL GİDERLER', colorCls: 'border-slate-400',
    subtotalMcode: 'M689',
    items: [
      { mcode: 'M604', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M605', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M610', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M615', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M620', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M625', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M630', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M635', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M640', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M641', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M645', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M650', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M655', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M660', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M665', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M689', isExpense: true, source: 'mcode_entry', level: 1 },
      // M689 subtotal
    ],
  },

  // ── 8. DİĞER FAALİYET GELİRLERİ ────────────────────────────────────────────
  {
    id: 'diger_gelir', label: 'DİĞER FAALİYET GELİRLERİ', colorCls: 'border-green-400',
    subtotalMcode: 'M739',
    items: [
      { mcode: 'M705', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M710', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M711', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M715', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M720', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M725', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M726', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M739', isExpense: false, source: 'formula_subtotal', level: 1 },
      // M769 = EBITDA — ayrı toplam satırı
    ],
  },

  // ── 9. AMORTİSMAN ────────────────────────────────────────────────────────────
  {
    id: 'amortisman', label: 'AMORTİSMAN', colorCls: 'border-gray-400',
    subtotalMcode: 'M789',
    items: [
      { mcode: 'M759', isExpense: true, source: 'mcode_entry', level: 1 }, // Finansal kiralama
      { mcode: 'M775', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M780', isExpense: true, source: 'mcode_entry', level: 1 },
      { mcode: 'M785', isExpense: true, source: 'mcode_entry', level: 1 },
      // M789 subtotal → M799 = EBIT
    ],
  },

  // ── 10. FİNANSMAN ─────────────────────────────────────────────────────────────
  {
    id: 'finansman', label: 'FİNANSMAN', colorCls: 'border-purple-400',
    subtotalMcode: 'M869',
    items: [
      { mcode: 'M800', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M801', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M805', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M810', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M815', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M820', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M825', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M827', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M829', isExpense: false, source: 'formula_subtotal', level: 1 }, // Finansal gelirler
      { mcode: 'M835', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M840', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M845', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M846', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M850', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M857', isExpense: true,  source: 'mcode_entry', level: 1 },
      { mcode: 'M859', isExpense: true,  source: 'formula_subtotal', level: 1 }, // Finansman giderleri
      // M869 = Net Finansman Sonucu → M879 = Olağan Faaliyet Karı → M899 = EBT
    ],
  },

  // ── 11. OLAĞANDIŞI ────────────────────────────────────────────────────────────
  {
    id: 'olagandisi', label: 'OLAĞANDIŞI', colorCls: 'border-gray-300',
    subtotalMcode: 'M889',
    items: [
      { mcode: 'M885', isExpense: false, source: 'mcode_entry', level: 1 },
      { mcode: 'M887', isExpense: true,  source: 'mcode_entry', level: 1 },
      // M889 subtotal
    ],
  },

  // ── 12. VERGİ ─────────────────────────────────────────────────────────────────
  // subtotalMcode='' çünkü M919 = NET KAR (vergi toplamı değil) — milestone satırında gösterilir
  {
    id: 'vergi', label: 'VERGİ', colorCls: 'border-gray-300',
    subtotalMcode: '',
    items: [
      // M899 = EBT (grand total, önceki bölümlerden geliyor)
      { mcode: 'M909', isExpense: true, source: 'tax', level: 1 }, // Kurumlar Vergisi %22
      { mcode: 'M910', isExpense: false, source: 'formula_subtotal', level: 1 },
      { mcode: 'M915', isExpense: true, source: 'mcode_entry', level: 1 },
      // M919 = NET KAR → M999 = NİHAİ DAĞITILABİLİR NET KAR
    ],
  },
];

// ─── Label yardımcısı (mcodeList'ten) ────────────────────────────────────────
const MCODE_MAP = new Map(MCODE_LIST.map(m => [m.code, m.tr]));
export const getMcodeLabel = (mcode: string): string =>
  MCODE_MAP.get(mcode) ?? mcode;

// ─── buildPnLRows ─────────────────────────────────────────────────────────────
/**
 * Plan verisinden ve üretim hesabından tam P&L satır listesi üretir.
 * Toplam/Subtotal satırları da dahil edilir.
 *
 * @param calc       calcProductionResults() çıktısı (null ise hesaplanan=0)
 * @param entries    plan.mcodeEntries — kullanıcının manual girdiği kalemler
 * @param ccExpenses CostCenter sabit giderleri (M420, M509, M529, vb.)
 */
export function buildPnLRows(
  calc:       ProductionCalcResult | null,
  entries:    PlanMCodeEntry[],
  ccExpenses: FixedExpense[],
): PnLRow[] {
  const rows: PnLRow[] = [];

  // Yardımcı: entries içinden mcode'a karşılık gelen kaydı bul
  const entryFor = (mcode: string): PlanMCodeEntry | undefined =>
    entries.find(e => e.mcode === mcode);

  // Yardımcı: CostCenter'dan mcode için aylık toplam
  const ccMonthly = (mcode: string): number =>
    ccExpenses.filter(e => e.mcode === mcode).reduce((s, e) => s + e.monthly, 0);

  // Yardımcı: kaynak türüne göre aylık değer hesapla
  const resolveMonthly = (item: PnLItemDef): { monthly: number; status: PlanMCodeStatus; editable: boolean } => {
    switch (item.source) {
      case 'calc_revenue':
        return { monthly: calc?.totalRevenue ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_fraction':
        return { monthly: calc?.fractionOutputs.reduce((s, f) => s + f.revenue, 0) ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_input_material':
        return { monthly: calc?.inputMaterialCost ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_material':
        return { monthly: calc?.totalMaterialCost ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_energy':
        return { monthly: calc?.totalEnergyCost ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_labor':
        return { monthly: calc?.totalLaborCost ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_packaging':
        return { monthly: calc?.productOutputs.reduce((s, p) => s + p.packagingCost, 0) ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'calc_other':
        return { monthly: calc?.totalOtherCost ?? 0, status: calc ? 'calculated' : 'empty', editable: false };
      case 'cost_center': {
        const val = ccMonthly(item.mcode);
        return { monthly: val, status: val > 0 ? 'filled' : 'empty', editable: false };
      }
      case 'tax': {
        // EBIT × 0.22 — hesaplanmış değil, UI'da toplam satırından yapılacak
        return { monthly: 0, status: 'calculated', editable: false };
      }
      case 'formula_subtotal':
        // Subtotal satırları UI tarafında hesaplanır — burada 0
        return { monthly: 0, status: 'calculated', editable: false };
      case 'mcode_entry':
      default: {
        const e = entryFor(item.mcode);
        if (!e) return { monthly: 0, status: 'empty', editable: true };
        return { monthly: e.monthly, status: e.status, editable: true };
      }
    }
  };

  // Bölümleri ve kalemleri düz listeye çevir
  for (const section of PNL_SECTIONS) {
    // Bölüm başlığı satırı
    rows.push({
      id:        `section_${section.id}`,
      mcode:     '',
      label:     section.label,
      sectionId: section.id,
      type:      'section',
      level:     0,
      monthly:   0,
      status:    'calculated',
      isExpense: false,
      editable:  false,
    });

    // Kalem satırları
    for (const item of section.items) {
      const { monthly, status, editable } = resolveMonthly(item);
      rows.push({
        id:        item.mcode,
        mcode:     item.mcode,
        label:     getMcodeLabel(item.mcode),
        sectionId: section.id,
        type:      item.source === 'formula_subtotal' ? 'subtotal' : 'item',
        level:     item.level,
        monthly,
        status,
        isExpense: item.isExpense,
        editable,
      });
    }

    // Bölüm subtotal satırı (varsa)
    if (section.subtotalMcode) {
      rows.push({
        id:        `total_${section.id}`,
        mcode:     section.subtotalMcode,
        label:     getMcodeLabel(section.subtotalMcode),
        sectionId: section.id,
        type:      'subtotal',
        level:     0,
        monthly:   0,  // UI tarafında hesaplanır
        status:    'calculated',
        isExpense: false,
        editable:  false,
      });
    }
  }

  return rows;
}

// ─── Önemli ara toplam M-kodları ─────────────────────────────────────────────
// PnLPanel'de bu M-kodlar özel vurgu ile gösterilir
export const PNL_MILESTONE_MCODES = new Set([
  'M179',  // TOPLAM NET SATIŞLAR
  'M299',  // NET GELİR (satış giderleri sonrası)
  'M399',  // BRÜT KATKI PAYI
  'M769',  // EBITDA
  'M799',  // EBIT
  'M879',  // OLAĞAN FAALİYET KARI
  'M899',  // VERGİ ÖNCESİ KAR (EBT)
  'M919',  // NET KAR
  'M999',  // NİHAİ DAĞITILABİLİR NET KAR
]);

// ─── "Girilen" grup kalemleri — Adım 4 Maliyet Kontrol Defteri'nde gösterilecek ──
// Her biri için kullanıcı: tutar gir | N/A işaretle
export const MCODE_CONTROL_LIST: { mcode: string; priority: 'required' | 'recommended' | 'optional' }[] = [
  { mcode: 'M509', priority: 'recommended' },   // Bakım-Onarım
  { mcode: 'M529', priority: 'recommended' },   // Çevre/Atık/İSG
  { mcode: 'M635', priority: 'recommended' },   // Sigorta
  { mcode: 'M775', priority: 'recommended' },   // Amortisman (M775 = maddi varlık)
  { mcode: 'M789', priority: 'recommended' },   // Amortisman toplam
  { mcode: 'M625', priority: 'optional'     },  // Danışmanlık/Hukuk
  { mcode: 'M620', priority: 'optional'     },  // İletişim
  { mcode: 'M615', priority: 'optional'     },  // Seyahat
  { mcode: 'M630', priority: 'optional'     },  // Pazarlama
  { mcode: 'M640', priority: 'optional'     },  // BT/Yazılım
  { mcode: 'M650', priority: 'optional'     },  // Banka/Komisyon
  { mcode: 'M665', priority: 'optional'     },  // Vergi/Harç
  { mcode: 'M845', priority: 'optional'     },  // Faiz gideri
  { mcode: 'M660', priority: 'optional'     },  // Diğer genel
];
