export type PnlKategoriler = Record<string, Record<string, Record<string, number>>>;

export const PNL_CONFIG = [
  // ── 1. HASILAT ──────────────────────────────────────────────────────────────
  {
    section: 'HASILAT',
    items: [
      { id: 'M105', label: 'Yurt İçi Satışlar', isRevenue: true },
      { id: 'M106', label: 'Yurt Dışı Satışlar', isRevenue: true },
      { id: 'M109', label: 'Brüt Satışlar', isTotal: true, formula: ['M105', 'M106'], isRevenue: true },
      { id: 'M115', label: 'Ciro Primi / Müşteri Primi', isRevenue: false },
      { id: 'M116', label: 'Müşteri Primi (Grup)', isRevenue: false },
      { id: 'M120', label: 'Alacak Talebi / Şüpheli Alacak', isRevenue: false },
      { id: 'M125', label: 'Satış İskontosu', isRevenue: false },
      { id: 'M126', label: 'Satış İskontosu (Grup)', isRevenue: false },
      { id: 'M130', label: 'Navlun / Nakliye İadesi', isRevenue: false },
      { id: 'M139', label: 'İndirimler Toplamı', isTotal: true, formula: ['M115', 'M116', 'M120', 'M125', 'M126', 'M130'], isRevenue: false },
      { id: 'M145', label: 'Ticari Mal Satışları', isRevenue: true },
      { id: 'M146', label: 'Ticari Mal Satışları (Grup)', isRevenue: true },
      { id: 'M149', label: 'Ticari Mal Satışları (Net)', isTotal: true, formula: ['M145', 'M146'], isRevenue: true },
      { id: 'M155', label: 'Diğer Satışlar (3. Şahıslar)', isRevenue: true },
      { id: 'M156', label: 'Diğer Satışlar (Grup)', isRevenue: true },
      { id: 'M159', label: 'Diğer Satışlar Toplamı', isTotal: true, formula: ['M155', 'M156'], isRevenue: true },
      { id: 'M179', label: 'TOPLAM NET SATIŞLAR', isTotal: true, formula: ['M109', '-M139', 'M149', 'M159'], isRevenue: true },
    ],
  },

  // ── 2. SATIŞ GİDERLERİ ──────────────────────────────────────────────────────
  {
    section: 'SATIŞ GİDERLERİ',
    items: [
      { id: 'M209', label: 'Sevkiyat ve Nakliye', isRevenue: false },
      { id: 'M215', label: 'Depolama ve Antrepo', isRevenue: false },
      { id: 'M220', label: 'Gümrük Vergi ve Harçlar', isRevenue: false },
      { id: 'M225', label: 'Satış Komisyonları', isRevenue: false },
      { id: 'M226', label: 'Satış Komisyonları (Grup)', isRevenue: false },
      { id: 'M230', label: 'Nakliye Sigorta', isRevenue: false },
      { id: 'M235', label: 'Çeşitli Satış Giderleri', isRevenue: false },
      { id: 'M240', label: 'Şüpheli Alacak Karşılığı', isRevenue: false },
      { id: 'M245', label: 'Diğer Satış Giderleri', isRevenue: false },
      { id: 'M249', label: 'Satış Giderleri Toplamı', isTotal: true, formula: ['M209', 'M215', 'M220', 'M225', 'M226', 'M230', 'M235', 'M240', 'M245'], isRevenue: false },
    ],
  },

  // ── NET GELİR (milestone) ───────────────────────────────────────────────────
  {
    section: 'NET GELİR',
    items: [
      { id: 'M299', label: 'NET GELİR', isTotal: true, formula: ['M179', '-M249'], isRevenue: true },
    ],
  },

  // ── 3. MALZEME GİDERLERİ ────────────────────────────────────────────────────
  {
    section: 'MALZEME GİDERLERİ',
    items: [
      { id: 'M305', label: 'Hammadde ve Satın Alınan Parçalar', isRevenue: false },
      { id: 'M310', label: 'Kimyasal Madde Giderleri', isRevenue: false },
      { id: 'M315', label: 'Alet, Tel, Keçe ve Sarf Malzeme', isRevenue: false },
      { id: 'M320', label: 'Diğer Yardımcı ve İşletme Malzemeleri', isRevenue: false },
      { id: 'M325', label: 'Dışarıdan Sağlanan Üretim Hizmetleri', isRevenue: false },
      { id: 'M339', label: 'Ana İş Malzeme Giderleri', isTotal: true, formula: ['M305', 'M310', 'M315', 'M320', 'M325'], isRevenue: false },
      { id: 'M349', label: 'Satılan Ticari Mallar Maliyeti', isRevenue: false },
      { id: 'M359', label: 'Diğer Malzeme Giderleri', isRevenue: false },
      { id: 'M369', label: 'Toplam Malzeme Giderleri', isTotal: true, formula: ['M339', 'M349', 'M359'], isRevenue: false },
    ],
  },

  // ── BRÜT KATKI PAYI (milestone) ─────────────────────────────────────────────
  {
    section: 'BRÜT KATKI PAYI',
    items: [
      { id: 'M399', label: 'BRÜT KATKI PAYI', isTotal: true, formula: ['M299', '-M369'], isRevenue: true },
    ],
  },

  // ── 4. ENERJİ ────────────────────────────────────────────────────────────────
  {
    section: 'ENERJİ TÜKETİMİ',
    items: [
      { id: 'M405', label: 'Elektrik Enerjisi', isRevenue: false },
      { id: 'M410', label: 'Isınma, Yakıt ve Buhar', isRevenue: false },
      { id: 'M415', label: 'Su Tüketimi', isRevenue: false },
      { id: 'M419', label: 'Toplam Enerji Giderleri', isTotal: true, formula: ['M405', 'M410', 'M415'], isRevenue: false },
    ],
  },

  // ── 5. PERSONEL ──────────────────────────────────────────────────────────────
  {
    section: 'PERSONEL GİDERLERİ',
    items: [
      { id: 'M450', label: 'İşçi Ücretleri (Brüt)', isRevenue: false },
      { id: 'M455', label: 'İşçi SGK İşveren Payı', isRevenue: false },
      { id: 'M460', label: 'Personel Maaşları (Brüt)', isRevenue: false },
      { id: 'M465', label: 'Personel SGK İşveren Payı', isRevenue: false },
      { id: 'M470', label: 'Kıdem Tazminatı', isRevenue: false },
      { id: 'M475', label: 'Emeklilik Giderleri', isRevenue: false },
      { id: 'M480', label: 'Diğer Personel Sosyal Giderleri', isRevenue: false },
      { id: 'M489', label: 'Toplam Personel Giderleri', isTotal: true, formula: ['M450', 'M455', 'M460', 'M465', 'M470', 'M475', 'M480'], isRevenue: false },
    ],
  },

  // ── 6. BAKIM & ÇEVRE ─────────────────────────────────────────────────────────
  {
    section: 'BAKIM & ÇEVRE',
    items: [
      { id: 'M509', label: 'Bakım ve Onarım Giderleri', isRevenue: false },
      { id: 'M529', label: 'Çevre, Atık Yönetimi ve İSG', isRevenue: false },
    ],
  },

  // ── 7. GENEL GİDERLER ────────────────────────────────────────────────────────
  {
    section: 'GENEL GİDERLER',
    items: [
      { id: 'M604', label: 'Dışarıdan Sağlanan Üretim Hizmetleri', isRevenue: false },
      { id: 'M605', label: 'Dışarıdan Sağlanan Personel Hizmetleri', isRevenue: false },
      { id: 'M610', label: 'Kira Giderleri', isRevenue: false },
      { id: 'M615', label: 'Seyahat Giderleri', isRevenue: false },
      { id: 'M620', label: 'İletişim Giderleri', isRevenue: false },
      { id: 'M625', label: 'Hukuk / Danışmanlık / Denetim', isRevenue: false },
      { id: 'M630', label: 'Reklam ve Pazarlama', isRevenue: false },
      { id: 'M635', label: 'Sigortalar', isRevenue: false },
      { id: 'M640', label: 'Bilişim ve Yazılım', isRevenue: false },
      { id: 'M641', label: 'Ofis ve Kırtasiye', isRevenue: false },
      { id: 'M645', label: 'Temsil ve Ağırlama', isRevenue: false },
      { id: 'M650', label: 'Banka ve Finansal Hizmet Giderleri', isRevenue: false },
      { id: 'M655', label: 'Lisans ve Patent', isRevenue: false },
      { id: 'M660', label: 'Beklenmedik Giderler', isRevenue: false },
      { id: 'M665', label: 'Harçlar ve Vergiler', isRevenue: false },
      { id: 'M689', label: 'Toplam Genel Giderler', isTotal: true, formula: ['M604', 'M605', 'M610', 'M615', 'M620', 'M625', 'M630', 'M635', 'M640', 'M641', 'M645', 'M650', 'M655', 'M660', 'M665'], isRevenue: false },
    ],
  },

  // ── 8. DİĞER FAALİYET GELİRLERİ ────────────────────────────────────────────
  {
    section: 'DİĞER FAALİYET GELİRLERİ',
    items: [
      { id: 'M705', label: 'Hurda / Artık Satışları', isRevenue: true },
      { id: 'M710', label: 'Kira Gelirleri', isRevenue: true },
      { id: 'M711', label: 'Lisans ve Telif Gelirleri', isRevenue: true },
      { id: 'M715', label: 'Yatırım Teşvik / Hibe Gelirleri', isRevenue: true },
      { id: 'M720', label: 'Sigorta Tazminat Gelirleri', isRevenue: true },
      { id: 'M725', label: 'Karşılık İptalleri', isRevenue: true },
      { id: 'M726', label: 'Diğer Faaliyet Gelirleri', isRevenue: true },
      { id: 'M739', label: 'Toplam Diğer Faaliyet Gelirleri', isTotal: true, formula: ['M705', 'M710', 'M711', 'M715', 'M720', 'M725', 'M726'], isRevenue: true },
    ],
  },

  // ── EBITDA (milestone) ───────────────────────────────────────────────────────
  {
    section: 'EBITDA',
    items: [
      { id: 'M769', label: 'EBITDA', isTotal: true, formula: ['M399', '-M419', '-M489', '-M509', '-M529', '-M689', 'M739'], isRevenue: true },
    ],
  },

  // ── 9. AMORTİSMAN ────────────────────────────────────────────────────────────
  {
    section: 'AMORTİSMAN',
    items: [
      { id: 'M759', label: 'Finansal Kiralama Amortismanı', isRevenue: false },
      { id: 'M775', label: 'Bina ve Yapı Amortismanı', isRevenue: false },
      { id: 'M780', label: 'Makine ve Ekipman Amortismanı', isRevenue: false },
      { id: 'M785', label: 'Diğer Amortisman Giderleri', isRevenue: false },
      { id: 'M789', label: 'Toplam Amortisman', isTotal: true, formula: ['M759', 'M775', 'M780', 'M785'], isRevenue: false },
    ],
  },

  // ── EBIT (milestone) ─────────────────────────────────────────────────────────
  {
    section: 'EBIT',
    items: [
      { id: 'M799', label: 'EBIT', isTotal: true, formula: ['M769', '-M789'], isRevenue: true },
    ],
  },

  // ── 10. FİNANSMAN ─────────────────────────────────────────────────────────────
  {
    section: 'FİNANSMAN',
    items: [
      { id: 'M800', label: 'Mevduat Faiz Gelirleri', isRevenue: true },
      { id: 'M801', label: 'Repo / Para Piyasası Gelirleri', isRevenue: true },
      { id: 'M805', label: 'Kur Farkı Gelirleri', isRevenue: true },
      { id: 'M810', label: 'Türev Finansal Araç Gelirleri', isRevenue: true },
      { id: 'M815', label: 'Grup Şirketi Faiz Gelirleri', isRevenue: true },
      { id: 'M820', label: 'İştirak ve Temettü Gelirleri', isRevenue: true },
      { id: 'M825', label: 'Diğer Finansal Gelirler', isRevenue: true },
      { id: 'M827', label: 'Menkul Kıymet Satış Kârı', isRevenue: true },
      { id: 'M829', label: 'Finansal Gelirler Toplamı', isTotal: true, formula: ['M800', 'M801', 'M805', 'M810', 'M815', 'M820', 'M825', 'M827'], isRevenue: true },
      { id: 'M835', label: 'Kredi Faiz Giderleri', isRevenue: false },
      { id: 'M840', label: 'Finansal Kiralama Faiz Giderleri', isRevenue: false },
      { id: 'M845', label: 'Kur Farkı Giderleri', isRevenue: false },
      { id: 'M846', label: 'Türev Finansal Araç Giderleri', isRevenue: false },
      { id: 'M850', label: 'Grup Şirketi Finansman Giderleri', isRevenue: false },
      { id: 'M857', label: 'Diğer Finansman Giderleri', isRevenue: false },
      { id: 'M859', label: 'Finansman Giderleri Toplamı', isTotal: true, formula: ['M835', 'M840', 'M845', 'M846', 'M850', 'M857'], isRevenue: false },
      { id: 'M869', label: 'Net Finansman Sonucu', isTotal: true, formula: ['M829', '-M859'], isRevenue: true },
    ],
  },

  // ── OLAĞAN FAALİYET KARI (milestone) ────────────────────────────────────────
  {
    section: 'OLAĞAN FAALİYET KARI',
    items: [
      { id: 'M879', label: 'OLAĞAN FAALİYET KARI', isTotal: true, formula: ['M799', 'M869'], isRevenue: true },
    ],
  },

  // ── 11. OLAĞANDIŞI ────────────────────────────────────────────────────────────
  {
    section: 'OLAĞANDIŞI',
    items: [
      { id: 'M885', label: 'Olağandışı Gelirler', isRevenue: true },
      { id: 'M887', label: 'Olağandışı Giderler', isRevenue: false },
      { id: 'M889', label: 'Net Olağandışı Sonuç', isTotal: true, formula: ['M885', '-M887'], isRevenue: true },
    ],
  },

  // ── VERGİ ÖNCESİ KAR (milestone) ─────────────────────────────────────────────
  {
    section: 'VERGİ ÖNCESİ KAR',
    items: [
      { id: 'M899', label: 'VERGİ ÖNCESİ KAR (EBT)', isTotal: true, formula: ['M879', 'M889'], isRevenue: true },
    ],
  },

  // ── 12. VERGİ ─────────────────────────────────────────────────────────────────
  {
    section: 'VERGİ',
    items: [
      { id: 'M909', label: 'Kurumlar Vergisi (%22)', isRevenue: false },
      { id: 'M915', label: 'Ertelenmiş Vergi Etkisi', isRevenue: false },
    ],
  },

  // ── NET KAR (milestone) ──────────────────────────────────────────────────────
  {
    section: 'NET KAR',
    items: [
      { id: 'M919', label: 'NET KAR', isTotal: true, formula: ['M899', '-M909', '-M915'], isRevenue: true },
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
 * Bağımlı formüller doğru sırada işlenir çünkü PNL_CONFIG section sırasına
 * göre iterate edilir ve her toplam bir öncekinin üzerine yazar.
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
