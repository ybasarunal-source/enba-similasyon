export type PnlKategoriler = Record<string, Record<string, Record<string, number>>>;

export const PNL_CONFIG = [
  {
    section: 'I. HASILAT',
    items: [
      { id: 'M109', label: 'Mal Satışı (Toplam)', isRevenue: true },
      { id: 'M159', label: 'Diğer Satışlar', isRevenue: true },
      { id: 'M179', label: 'Toplam Satış', isTotal: true, formula: ['M109', 'M159'], isRevenue: true },
      { id: 'M249', label: 'SATIŞ Harcamaları', isRevenue: false },
      { id: 'M209', label: 'Nakliye', isRevenue: false },
      { id: 'M299', label: 'Hasılat', isTotal: true, formula: ['M179', '-M249', '-M209'], isRevenue: true },
    ],
  },
  {
    section: 'II. MAL MALİYETLERİ',
    items: [
      { id: 'M301', label: 'Alım Nakliye', isRevenue: false },
      { id: 'M305', label: 'Mal alım maliyeti', isRevenue: false },
      { id: 'M339', label: 'Mal Maliyetleri', isTotal: true, formula: ['M301', 'M305'], isRevenue: false },
      { id: 'M349', label: 'Ticaret Mal maliyeti', isRevenue: false },
      { id: 'M399', label: 'KATKI', isTotal: true, formula: ['M299', '-M339', '-M349'], isRevenue: true },
    ],
  },
  {
    section: 'III. ENERJİ MALİYETLERİ',
    items: [
      { id: 'M405', label: 'Elektrik', isRevenue: false },
      { id: 'M410', label: 'Yakıt', isRevenue: false },
      { id: 'M415', label: 'Su', isRevenue: false },
      { id: 'M419', label: 'Toplam enerji maliyeti', isTotal: true, formula: ['M405', 'M410', 'M415'], isRevenue: false },
    ],
  },
  {
    section: 'IV. PERSONEL MALİYETLERİ',
    items: [
      { id: 'M450', label: 'Maaşlar', isRevenue: false },
      { id: 'M455', label: 'Sigortalar', isRevenue: false },
      { id: 'M475', label: 'Yol', isRevenue: false },
      { id: 'M480', label: 'Yemek', isRevenue: false },
      { id: 'M489', label: 'Personel maliyetleri', isTotal: true, formula: ['M450', 'M455', 'M475', 'M480'], isRevenue: false },
    ],
  },
  {
    section: 'V. DİĞER GİDERLER',
    items: [
      { id: 'M509', label: 'Bakım Onarım', isRevenue: false },
      { id: 'M310', label: 'Kimyasallar', isRevenue: false },
      { id: 'M315', label: 'Tel ve diğer Malzeme ÇUVAL', isRevenue: false },
      { id: 'M609', label: 'DIŞ Hizmetler', isRevenue: false },
      { id: 'M610', label: 'Kiralama Ücretleri', isRevenue: false },
      { id: 'M615', label: 'Seyahat Giderleri', isRevenue: false },
      { id: 'M620', label: 'İletişim Ücretleri', isRevenue: false },
      { id: 'M625', label: 'Yasal Ücretler', isRevenue: false },
      { id: 'M630', label: 'Reklam', isRevenue: false },
      { id: 'M635', label: 'Sigortalar (Diğer)', isRevenue: false },
      { id: 'M640', label: 'Bilişim Harcamaları', isRevenue: false },
      { id: 'M650', label: 'Banka giderleri', isRevenue: false },
      { id: 'M660', label: 'Beklenmedik Giderler', isRevenue: false },
      { id: 'M665', label: 'Harçlar ve Vergiler', isRevenue: false },
      {
        id: 'M689', label: 'Toplam Diğer Maliyetler', isTotal: true,
        formula: ['M310', 'M315', 'M609', 'M610', 'M615', 'M620', 'M625', 'M630', 'M635', 'M640', 'M650', 'M660', 'M665'],
        isRevenue: false,
      },
    ],
  },
  {
    section: 'SONUÇ',
    items: [
      { id: 'TOTAL_COST', label: 'Toplam Maliyet', isTotal: true, formula: ['M689', 'M509', 'M489', 'M419'], isRevenue: false },
      { id: 'M769', label: 'EBITDA', isTotal: true, formula: ['M399', '-TOTAL_COST'], isRevenue: true },
    ],
  },
];

/** Formula'daki item'ları values map'inden toplayarak sonucu döndürür. '-X' çıkarma anlamına gelir. */
export function evalFormula(formula: string[], values: Record<string, number>): number {
  return formula.reduce((total, f) => {
    if (f.startsWith('-')) return total - (values[f.substring(1)] ?? 0);
    return total + (values[f] ?? 0);
  }, 0);
}

/**
 * PNL_CONFIG formüllerini verilen kategoriler üzerinde sırayla hesaplar.
 * Bağımlı formüller (TOTAL_COST → M769) doğru sırada işlenir çünkü PNL_CONFIG
 * section sırasına göre iterate edilir ve her toplam bir öncekinin üzerine yazar.
 */
export function applyPnlFormulas(
  kategoriler: PnlKategoriler,
  aylar: string[],
  modeller: string[],
): PnlKategoriler {
  const result: PnlKategoriler = JSON.parse(JSON.stringify(kategoriler));

  PNL_CONFIG.forEach(section => {
    section.items.forEach(item => {
      if (!item.isTotal || !item.formula) return;
      if (!result[item.id]) result[item.id] = {};
      aylar.forEach(ay => {
        if (!result[item.id][ay]) result[item.id][ay] = {};
        modeller.forEach(mod => {
          const values: Record<string, number> = {};
          for (const id in result) {
            values[id] = result[id]?.[ay]?.[mod] ?? 0;
          }
          result[item.id][ay][mod] = evalFormula(item.formula!, values);
        });
      });
    });
  });

  return result;
}
