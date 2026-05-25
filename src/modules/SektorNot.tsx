import React, { useState, useMemo } from 'react';
import {
  BookOpen, Recycle, Zap, Layers, ArrowRight, AlertTriangle,
  ChevronDown, ChevronRight, FlaskConical, Cpu, Package,
  Search, Tag as TagIcon, Hash, ChevronLeft, Factory, ArrowDown,
} from 'lucide-react';

// ─── Primitives ──────────────────────────────────────────────────────────────

const cx = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(' ');

const Tag: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = 'gray', children }) => {
  const colors: Record<string, string> = {
    green:  'bg-green-100 text-green-700 border-green-200',
    red:    'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    amber:  'bg-amber-100 text-amber-700 border-amber-200',
    gray:   'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
};

const Note: React.FC<{ type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    tip:  'bg-green-50 border-green-200 text-green-800',
  };
  const icons = { info: '💡', warn: '⚠️', tip: '✅' };
  return (
    <div className={`flex gap-2 p-3 rounded-xl border text-[12.5px] leading-relaxed ${styles[type]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
};

const DataTable: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="w-full text-[12.5px]">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider text-[10.5px]">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, ri) => (
          <tr key={ri} className="hover:bg-gray-50/60 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-4 py-2.5 text-gray-700">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Akış Şeması ─────────────────────────────────────────────────────────────

type StepType = 'default' | 'thermal' | 'chemical' | 'quality' | 'separation';

interface FlowStepDef {
  label:     string;
  sub?:      string;
  machines?: string[];
  params?:   string[];
  type?:     StepType;
  highlight?: boolean;
}

const STEP_STYLES: Record<StepType, { card: string; num: string; label: string }> = {
  default:    { card: 'bg-gray-50 dark:bg-white/3 border-gray-200 dark:border-white/10',          num: 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400',                             label: 'text-gray-800 dark:text-white' },
  thermal:    { card: 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20', num: 'bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',                      label: 'text-amber-800 dark:text-amber-200' },
  chemical:   { card: 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20', num: 'bg-orange-200 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',             label: 'text-orange-800 dark:text-orange-200' },
  quality:    { card: 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20',    num: 'bg-blue-200 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',                          label: 'text-blue-800 dark:text-blue-200' },
  separation: { card: 'bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/20', num: 'bg-purple-200 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',             label: 'text-purple-800 dark:text-purple-200' },
};

const STEP_LABELS: Record<StepType, string> = {
  default:    'Fiziksel',
  thermal:    'Isıl',
  chemical:   'Kimyasal / Ekstrüzyon',
  quality:    'Kalite / Kontrol',
  separation: 'Ayırma',
};

const ProcessDiagram: React.FC<{ steps: FlowStepDef[] }> = ({ steps }) => {
  const types = Array.from(new Set(steps.map(s => s.type ?? 'default'))) as StepType[];
  return (
    <div className="space-y-3">
      {/* Renk açıklaması */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <span key={t} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-semibold border ${STEP_STYLES[t].card} ${STEP_STYLES[t].label}`}>
            <span className={`w-2 h-2 rounded-full ${STEP_STYLES[t].num}`} />
            {STEP_LABELS[t]}
          </span>
        ))}
      </div>
      {/* Adımlar */}
      <div className="space-y-1">
        {steps.map((s, i) => {
          const t: StepType = s.type ?? 'default';
          const st = STEP_STYLES[t];
          return (
            <React.Fragment key={i}>
              <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${st.card}`}>
                {/* Numara */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${st.num}`}>
                  {i + 1}
                </div>
                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-semibold ${st.label}`}>{s.label}</div>
                  {s.sub && (
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{s.sub}</p>
                  )}
                  {s.machines && s.machines.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {s.machines.map(m => (
                        <span key={m} className="text-[10.5px] px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.params && s.params.length > 0 && (
                    <div className="flex gap-3 flex-wrap mt-1.5">
                      {s.params.map(p => (
                        <span key={p} className="text-[10px] text-gray-400 dark:text-gray-500 italic">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown size={14} className="text-gray-300 dark:text-white/20" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const Flow: React.FC<{ steps: { label: string; sub?: string; highlight?: boolean }[] }> = ({ steps }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div className={cx(
          'flex flex-col items-center px-3 py-1.5 rounded-xl border text-[12px] font-medium',
          s.highlight
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-gray-50 border-gray-200 text-gray-700',
        )}>
          {s.label}
          {s.sub && <span className="text-[10px] font-normal text-gray-400">{s.sub}</span>}
        </div>
        {i < steps.length - 1 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
      </React.Fragment>
    ))}
  </div>
);

// ─── Sayfa tipleri ────────────────────────────────────────────────────────────

type PageId = 'overview' | 'proses' | 'hatlar' | 'malzeme' | 'makine' | 'ekonomi' | 'sozluk';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

// ─── Sözlük verileri ─────────────────────────────────────────────────────────

export interface WikiTerm {
  term: string;
  category: string;
  definition: string;
  tags?: string[];
}

const WIKI_TERMS: WikiTerm[] = [
  // ── Malzeme / Polimer ──
  { term: 'Granül', category: 'Ürün', definition: 'Plastik atıkların yıkanıp kurutularak kırılması ve ekstrüzyona sokulmasıyla elde edilen küçük, düzgün plastik parçacıklar. Nihai ürün olarak ham madde yerine kullanılır.', tags: ['plastik', 'ürün'] },
  { term: 'Flake / Pul', category: 'Ürün', definition: 'Kırılıp yıkanmış plastik parçacıkları. Ekstrüde edilmemiş ara ürün; boyut 8–12 mm. Hat 2\'nin çıktısıdır. Doğrudan kullanıcıya satılabilir veya ekstrüzyon hattına beslenir. Granülden farklıdır — işlem adımı daha azdır.', tags: ['ürün', 'PET', 'ara ürün'] },
  { term: 'PET', category: 'Malzeme', definition: 'Polietilen tereftalat. Su şişeleri ve meşrubat ambalajlarında kullanılan şeffaf plastik türü. Geri dönüşümde ayrı hat gerektirir, PP/LDPE/HDPE ile uyumsuz. Yoğunluğu ~1,38 g/cm³ — float-sink\'te batar.', tags: ['plastik', 'polimer'] },
  { term: 'PP', category: 'Malzeme', definition: 'Polipropilen. Kapaklar, kolalar, bazı ambalajlarda kullanılır. PP/LDPE/HDPE aynı hattı paylaşabilir ancak aynı anda işlenemez. Yoğunluğu ~0,90 g/cm³ — float-sink\'te yüzer.', tags: ['plastik', 'polimer'] },
  { term: 'LDPE', category: 'Malzeme', definition: 'Düşük yoğunluklu polietilen (Low Density Polyethylene). Naylon poşetler, ambalaj filmleri. PP ile aynı hattı sıralı olarak kullanabilir. Film formunda özel wet granülatör veya compactor gerektirir.', tags: ['plastik', 'polimer', 'folyo'] },
  { term: 'HDPE', category: 'Malzeme', definition: 'Yüksek yoğunluklu polietilen (High Density Polyethylene). Bidon, kova, boru. PP/LDPE hattını paylaşır. Kirlilik profili ağır (yağ, boya, çamur) olabilir; kaustik konsantrasyonu %2–4\'e çıkabilir.', tags: ['plastik', 'polimer'] },
  { term: 'rPET', category: 'Ürün', definition: 'Recycled PET — geri dönüştürülmüş polietilen tereftalat. Food-grade kalite için EFSA onaylı SuperClean prosesi veya SSP reaktörü gerektirir. AB PPWR kapsamında PCR içerik hedeflerinde sayılır. Şeffaf/mavi/miks renk sınıflaması değeri belirler.', tags: ['ürün', 'polimer', 'sertifikasyon'] },
  { term: 'PCR içerik', category: 'Malzeme', definition: 'Post-Consumer Recycled content. Tüketici sonrası atıktan üretilen geri dönüştürülmüş malzeme içeriği. AB PPWR ve GRS çerçevesinde ambalajlarda zorunlu PCR hedefleri belirlenir. rPET granül/flake bu içeriği sağlar.', tags: ['malzeme', 'standart', 'çevre'] },
  { term: 'Fraksiyon', category: 'Proses', definition: 'Hammadde içinde ana plastikten ayrışan farklı cinsteki malzeme parçaları. Kağıt, cam, diğer plastik türleri, metal vb. Her fraksiyon için ayrı karar verilir: direkt sat / üretime sok / at.', tags: ['proses', 'fire'] },

  // ── Fire ──
  { term: 'Nem firesi', category: 'Fire', definition: 'Islak veya nemli hammaddedeki su oranından kaynaklanan ağırlık kaybı. Tamamen saf kayıptır — değer yaratmaz, gelire dönüştürülemez.', tags: ['fire', 'kayıp'] },
  { term: 'Giriş firesi', category: 'Fire', definition: 'Hammaddenin üretime girdiği andan itibaren oluşan toplam ağırlık kaybı. Nem, çöp ve fraksiyonları kapsar. Toplam fire = nem + çöp + fraksiyonlar.', tags: ['fire', 'proses'] },
  { term: 'Alt kalite fraksiyon', category: 'Fire', definition: 'Kağıt, LDPE, 2./3. kalite plastik gibi yan ürüne veya düşük değerli satışa dönüştürülebilen fraksiyon. Bazı işletmeler bunlara ödeme yapar; bazılarında saf kayıp sayılır.', tags: ['fire', 'fraksiyon'] },

  // ── Makine ──
  { term: 'Agromel', category: 'Makine', definition: 'İnce plastik filmleri ve düşük yoğunluklu malzemeleri ısı ve sürtünme yoluyla yoğunlaştıran makine. Granülatör öncesi ön işlem ünitesi.', tags: ['makine', 'granül'] },
  { term: 'Granülatör', category: 'Makine', definition: 'Plastik eriyiğini ince tel şeklinde ekstrüde edip soğutarak keserek granül üretilen ana makine. Genellikle hat darboğazıdır.', tags: ['makine', 'darboğaz'] },
  { term: 'Ekstrüder', category: 'Makine', definition: 'Plastik eriyiğini filament şeklinde çıkarıp soğutarak keserek granül üreten makine. Tek vida (single screw) basit PP/PE için; çift vida (twin screw) katkılı/renklendirmeli formülasyonlar için kullanılır. Enerji tüketiminin büyük kısmını oluşturur.', tags: ['makine', 'granül', 'darboğaz'] },
  { term: 'Shredder', category: 'Makine', definition: 'Çift mil kırıcı. İri hacimli parçalar (büyük bidonlar, kasalar) için kullanılır. Çıktı boyutu 30–80 mm. Granülatör öncesi boyut küçültme adımında yer alır. Bıçak aşınması özgül enerji tüketimini artırır.', tags: ['makine', 'kırma'] },
  { term: 'Screen changer', category: 'Makine', definition: 'Filtre paketi. Ekstrüder eriyik içindeki yabancı madde ve karbonlaşmış partikülleri tutar. Filtre boyutu 100–500 µm. Tıkandığında eriyik basıncı artar, motor zorlanır, ürün kalitesi düşer. Otomatik değişimli model üretim duruşunu önler.', tags: ['makine', 'filtre', 'kalite'] },
  { term: 'Float-sink tankı', category: 'Makine', definition: 'Yoğunluk bazlı plastik ayırma tankı. PE ve PP yüzer (< 1 g/cm³), PET ve PVC batar (> 1 g/cm³). Özellikle PVC kontaminasyonunu önlemek için kritik. Su yoğunluğu tuz (NaCl) ekleyerek ayarlanabilir.', tags: ['makine', 'ayırma', 'PVC'] },
  { term: 'Santrifüj kurutucu', category: 'Makine', definition: 'Yıkama sonrası ıslak malzemeden mekanik su uzaklaştıran makine. Nemi yaklaşık %2–5\'e düşürür. Isıl kurutma için ön adım; sonrasında bant fırın veya silo kurutucu ≤ %0,1\'e indirir.', tags: ['makine', 'kurutma'] },
  { term: 'Trommel elek', category: 'Makine', definition: 'Döner tambur elek. Hat beslemesinde büyük yabancı madde (taş, cam, iri plastik) ile iri malzemeyi boyuta göre ayırır. Yıkama hattı öncesi ön sınıflandırma için kullanılır.', tags: ['makine', 'elek'] },
  { term: 'Balistik seperatör', category: 'Makine', definition: 'Film ve rijit plastik parçaları birbirinden balistik hareket farkıyla ayıran makine. Yıkama hattı öncesinde folyo ile katı parçaların ön sınıflandırmasını yapar.', tags: ['makine', 'ayırma', 'folyo'] },
  { term: 'Compactor', category: 'Makine', definition: 'Agglomerat makinası. İnce plastik filmleri ve LDPE/LLDPE folyo atıklarını ısı ve sürtünme yoluyla yoğunlaştırır. Film hattında kurutma yetersiz kaldığında granülasyon öncesi bu adım devreye girer.', tags: ['makine', 'folyo', 'film'] },
  { term: 'SSP reaktörü', category: 'Makine', definition: 'Solid State Polycondensation reaktörü. Food-grade rPET üretiminde PET flake\'in intrinsik viskozitesini (IV) artırmak için kullanılır. EFSA ve FDA bu çıktıyı sertifikalandırır; challenge test belgesi zorunludur.', tags: ['makine', 'food-grade', 'PET'] },
  { term: 'Eddy current seperatör', category: 'Makine', definition: 'Alüminyum ve demir dışı metal parçacıklarını atık akışından uzaklaştıran manyetik seperatör türü. Hat besleme adımında manyetik seperatörle birlikte kullanılır.', tags: ['makine', 'metal', 'ayırma'] },
  { term: 'NIR seperatör', category: 'Makine', definition: 'Near Infrared (yakın kızılötesi) teknolojisiyle plastik türlerini tanıyıp otomatik hava jetleriyle ayıran makine. PVC ve diğer kirletici polimerlerin tespitinde kullanılır; manuel kontrolü tamamlar.', tags: ['makine', 'ayırma', 'otomasyon'] },
  { term: 'Darboğaz', category: 'Proses', definition: 'Hattın kapasitesini en çok sınırlayan makine veya adım. Granülatör çoğu tesiste darboğazdır (0,3 ton/saat). Fazla mesai ile telafi edilebilir.', tags: ['kapasite', 'proses'] },

  // ── Proses ──
  { term: 'Kaustik yıkama', category: 'Proses', definition: 'Kırılmış plastik pulların %1–3 NaOH çözeltisiyle 80–90 °C\'de yıkanması. Etiket, yapıştırıcı, yağ ve organik kirliliği söker. Hat 2\'nin kalp adımıdır. 90 °C\'yi aşarsa PET flake yumuşar (sticking riski).', tags: ['proses', 'yıkama', 'kimyasal'] },
  { term: 'Nötralizasyon', category: 'Proses', definition: 'Kaustik yıkama sonrası flake üzerindeki NaOH kalıntısını gidermek için çok aşamalı durulama ve pH dengeleme adımı. Çıkış suyu pH 6,5–8,0 hedeflenir. Atlanırsa MFI kayması ve müşteri şikayeti oluşur.', tags: ['proses', 'yıkama', 'pH'] },
  { term: 'Lot yönetimi', category: 'Proses', definition: 'Üretim partilerinin takibi. Her lotun atık tipi, ağırlık, tedarikçi, MFI değeri ve numune sonuçlarıyla etiketlenmesi. Farklı MFI\'lı partiler karışınca müşteride tutarsızlık şikayeti oluşur.', tags: ['proses', 'kalite', 'takip'] },
  { term: 'Hat değişimi', category: 'Proses', definition: 'Farklı malzeme tipine geçiş için hattın temizlenmesi ve yeniden ayarlanması. Hem hammadde hem zaman kaybı yaratır. Bu yüzden tek malzeme planlaması tercih edilir.', tags: ['proses', 'verimlilik'] },
  { term: 'Ön seçim', category: 'Proses', definition: 'Hammaddenin kırma hattına girmeden önce elle veya mekanik olarak fraksiyonlarından ayrıştırılması adımı. Malzeme bazında bypass edilebilir.', tags: ['proses'] },

  // ── Kalite ──
  { term: 'MFI', category: 'Kalite', definition: 'Melt Flow Index — Eriyik Akış İndeksi. Plastiğin 190 °C / 2,16 kg koşulunda 10 dakikada ne kadar aktığını ölçer (g/10 dk). Lot homojenliği ve müşteri spesifikasyon uyumunun en temel kalite göstergesi. Nemli malzeme ve filtre tıkanması MFI\'yı bozar.', tags: ['kalite', 'proses', 'ölçüm'] },
  { term: 'Food-grade', category: 'Kalite', definition: 'Gıdayla temas edebilir kalite standardı. rPET için EFSA (Avrupa) ve FDA (ABD) belirler. SuperClean proses veya SSP reaktörü + challenge test belgesi zorunludur. Kontaminasyon ≤ 50 ppm, nem ≤ %0,02, PVC ≤ 10 ppm.', tags: ['kalite', 'sertifikasyon', 'PET'] },
  { term: 'PVC kontaminasyonu', category: 'Kalite', definition: 'PET akışına karışan PVC (polivinil klorür) kirliliği. Float-sink\'te ayrılmazsa granülde klorür korozyonuna ve MFI bozulmasına yol açar. Food-grade PET\'te ≤ 10 ppm sınırı. XRF veya NIR ile tespit edilir.', tags: ['kalite', 'kirlilik', 'PET'] },

  // ── Ekonomi ──
  { term: 'Başabaş noktası', category: 'Ekonomi', definition: 'Sabit ve değişken maliyetlerin toplam gelire eşitlendiği üretim miktarı. Kömürcüler tesisi için ≈ 57 ton/ay.', tags: ['ekonomi', 'kârlılık'] },
  { term: 'Özgül enerji', category: 'Ekonomi', definition: 'kWh/ton cinsinden enerji verimliliği göstergesi. Bıçak aşınması, filtre tıkanması ve hat ayarsızlığı özgül enerjiyi artırır. Üretim maliyetinin en değişken kalemidir.', tags: ['ekonomi', 'enerji', 'verimlilik'] },
  { term: 'Talep faktörü (DF)', category: 'Enerji', definition: 'Makinenin nominal gücüne karşı gerçekte çektiği güç oranı. Varsayılan: 0,60. İlk elektrik faturasıyla kalibre edilir. Enerji maliyeti hesabında kullanılır.', tags: ['enerji', 'elektrik'] },
  { term: 'Atık su bedeli', category: 'Maliyet', definition: 'Yıkama prosesinde oluşan atık su deşarj ya da arıtma maliyeti. Kömürcüler tesisinde 800 ₺/giriş tonu olarak bütçelenir.', tags: ['maliyet', 'çevre'] },

  // ── Çevre ──
  { term: 'KOİ', category: 'Çevre', definition: 'Kimyasal Oksijen İhtiyacı. Atık sudaki organik madde miktarını gösteren parametre (mg/L). Yıkama hattı proses suyu kapalı döngüde tutulmazsa KOİ yükü artar, çevre mevzuatına göre deşarj sınırı (Su Kirliliği Kontrol Yönetmeliği) aşılır.', tags: ['çevre', 'atık su', 'mevzuat'] },

  // ── Standart / Sertifikasyon ──
  { term: 'GRS', category: 'Standart', definition: 'Global Recycled Standard. Geri dönüştürülmüş hammadde kullanan ürünlerin bağımsız denetimle belgelendiği uluslararası sertifikasyon standardı. Denetimlerde proses su yönetimi ve kimyasal kullanım kayıtları incelenir.', tags: ['standart', 'sertifikasyon', 'çevre'] },
  { term: 'PPWR', category: 'Standart', definition: 'AB Packaging and Packaging Waste Regulation — Ambalaj ve Ambalaj Atıkları Yönetmeliği. Ambalajlarda zorunlu PCR içerik oranları ve geri dönüşüm hedefleri belirler. rPET granül/flake üreticilerinin ana pazar sürücüsü.', tags: ['standart', 'AB', 'mevzuat'] },
  { term: 'WEEE', category: 'Standart', definition: 'Waste Electrical and Electronic Equipment — Elektrikli ve Elektronik Ekipman Atıkları yönetmeliği. Bu kapsam dahindeki e-atık plastikler (ABS, PS, PC) bromlu alev geciktiriciler içerebilir. XRF ile Br kontrolü ve özel debromination prosesi zorunludur.', tags: ['standart', 'e-atık', 'mevzuat'] },

  // ── Hat 3 — Ayrıştırma ──
  { term: 'MRF', category: 'Tesis', definition: 'Materials Recovery Facility — Malzeme Geri Kazanım Tesisi. Karışık ambalaj atıklarını reçine tipine, renge ve malzeme grubuna göre ayrıştıran tesisin uluslararası adı. NIR sıralayıcı, balistik seperatör ve metal ayrım ekipmanlarının entegre çalıştığı büyük ölçekli hat.', tags: ['tesis', 'ayrıştırma'] },
  { term: 'Renk sıralayıcı', category: 'Makine', definition: 'CCD veya RGB kamera + arka aydınlatma ile plastikleri renge göre ayıran optik makine. NIR reçine tipini söyler ama rengi söylemez; ikisi birlikte kullanılır. PET şeffaf ile PET mavi/opak ayrımını yapar — satış fiyatını doğrudan etkiler. Siyah plastik göremez.', tags: ['makine', 'optik', 'kalite'] },
  { term: 'Ejektör sistemi', category: 'Makine', definition: 'NIR sinyali aldıktan sonra doğru parçaya hava üfleyen ve fraksiyonu kanalına yönlendiren otomasyon sistemi. Nozzle dizilimi 1.200–2.400 mm konveyör genişliğine yayılır. Tetikleme süresi ≤ 10 ms; yanlış ejeksiyon oranı hedefi < %2.', tags: ['makine', 'otomasyon', 'ayırma'] },
  { term: 'Siyah plastik sorunu', category: 'Kalite', definition: 'Karbon siyahı içeren plastikler NIR sensörde tanınamaz — NIR ışığını tamamen emer. Renk sıralayıcı kamera da göremez. Sonuç: reject kanalına veya yanlış fraksiyona gider. Çözüm MWIR (orta dalga kızılötesi) veya lazer sensör; Türkiye\'de henüz yaygın değil, büyük ölçüde kayıp sayılır.', tags: ['kalite', 'NIR', 'reject'] },
  { term: 'Picking station', category: 'Makine', definition: 'Manuel ayıklama bandı. Otomatik sistemin gözünden kaçan PVC, bromlu plastik ve kalite uygunsuzluklarının elle tespit edildiği konveyör üstü çalışma noktası. Birçok tesiste hâlâ birincil kalite güvencesidir.', tags: ['makine', 'kalite', 'manuel'] },

  // ── Hat 4 — Kimyasal Geri Dönüşüm ──
  { term: 'Kimyasal geri dönüşüm', category: 'Proses', definition: 'Advanced recycling / chemical recycling. Mekanik yolun ulaşamadığı atıklar için kullanılan prosesler bütünü: piroliz, depolimerizasyon, solvent saflaştırma. Türkiye\'de 2024 itibarıyla büyük ölçüde pilot / AR-GE aşamasında. AB PPWR baskısıyla 5 yılda hızlı gelişim bekleniyor.', tags: ['proses', 'ileri dönüşüm', 'AB'] },
  { term: 'Piroliz', category: 'Proses', definition: 'Oksijensiz ortamda (N₂ / vakum) 350–700 °C\'de plastik polimer zincirlerinin termokimyasal yolla kırılması. Yanma değil, bozunma. Çıktı: piroliz yağı %40–70, yanıcı gaz %10–20, char %5–30. PVC kesinlikle giriş öncesi ayrılmalıdır — HCl gazı üretir ve reaktörü aşındırır.', tags: ['proses', 'kimyasal', 'ısıl'] },
  { term: 'Piroliz yağı', category: 'Ürün', definition: 'Pyoil. Piroliz prosesinin sıvı çıktısı; hafif (nafta benzeri) + ağır (fuel oil benzeri) fraksiyon. Petrokimya tesisine besleme veya yakıt olarak kullanılabilir. Doğrudan plastik değildir. AB PPWR\'da "recycled content" sayılabilmesi tartışmalıdır.', tags: ['ürün', 'kimyasal', 'yakıt'] },
  { term: 'Char', category: 'Proses', definition: 'Piroliz prosesinin katı kalıntısı. Karbon içerikli; giriş kalitesine ve sıcaklığa göre %5–30 oranında oluşur. Karbon siyahı ikamesi olarak araştırılıyor; aksi hâlde bertaraf gerekir. Düzenli boşaltma planı olmadan tesis içinde birikim sorunu oluşur.', tags: ['proses', 'atık', 'piroliz'] },
  { term: 'Depolimerizasyon', category: 'Proses', definition: 'Polimer zincirinin kimyasal reaktiflerle (glikol, metanol, su) monomer veya oligomerlere kadar parçalanması. PET için en değerli kimyasal geri dönüşüm yoludur — çıktı yeni PET üretiminde kullanılır. Alt yollar: glikoliz, metanoliz, hidroliz. "Sonsuz geri dönüşüm" kavramının teknik karşılığı.', tags: ['proses', 'kimyasal', 'PET'] },
  { term: 'Glikoliz', category: 'Proses', definition: 'PET + etilen glikol (EG) → BHET (bis-hidroksietil tereftalat) reaksiyonu. 180–240 °C, katalizör çinko asetat. Kirli ve gıda temaslı PET için uygun — mekanik yolun işleyemediği malzemeyi değerlendirir. Depolimerizasyonun en yaygın ve görece basit alt yolu.', tags: ['proses', 'PET', 'kimyasal'] },

  // ── Hat 5 — Balyalama / Çuvallama / Sevkiyat ──
  { term: 'Balya', category: 'Paketleme', definition: 'Balyalama presiyle sıkıştırılarak tel veya plastik iple bağlanan katı malzeme bloğu. PET şişe, HDPE/PP rijit, kağıt-karton ve metal için standarttır. Granül ve pul balyalanamaz — bunlar big bag veya oktabine gider.', tags: ['paketleme', 'lojistik'] },
  { term: 'Yatay kanal presi', category: 'Makine', definition: 'Horizontal channel baler. En yaygın endüstriyel balyalama presi. Sürekli besleme alır, hidrolik sıkıştırma ile malzemeyi bloklar; tel bağlama ünitesi otomatik bağlar. Kapasite: 2–20 ton/saat. PET şişe, HDPE/PP rijit ve kağıt-karton için standart.', tags: ['makine', 'paketleme'] },
  { term: 'İki ram presi', category: 'Makine', definition: 'Two-ram baler. İki aşamalı sıkıştırma: birinci ram ön sıkıştırma, ikinci ram nihai baskı. Film, folyo ve springback\'li miks malzeme için kullanılır. Yatay prese göre balya yoğunluğu %20–40 daha yüksek — ton başı nakliye maliyetini düşürür.', tags: ['makine', 'paketleme', 'folyo'] },
  { term: 'Big bag', category: 'Paketleme', definition: 'FIBC (Flexible Intermediate Bulk Container). Granül ve pul için standart ambalaj; 500–1.000 kg kapasiteli. Tartımlı dolum başlığıyla ±5 kg toleransla doldurulur. Food-grade malzeme için PE iç kaplı (food-grade big bag) zorunludur. Tek veya çok kullanımlık tipleri var.', tags: ['paketleme', 'lojistik', 'granül'] },
  { term: 'Oktabin', category: 'Paketleme', definition: 'Sekizgen karton kutu + PE iç torba. Granül sevkiyatında big bag\'e alternatif; nemden koruma ve uzun depolama gerektiren durumlarda tercih edilir. Kapasite 500–1.000 kg. Karton yapı nem emebilir — dış ortamda uzun bekletilmemeli.', tags: ['paketleme', 'lojistik'] },
  { term: 'Springback', category: 'Proses', definition: 'Geri yaylanma. Film ve folyo gibi elastik malzemelerin balya presinden çıkınca hacmini bir miktar geri kazanması olgusu. Bağlama teli yetersizse balya açılır. İki ram presi springback\'i yatay prese göre daha iyi baskılar.', tags: ['proses', 'paketleme', 'folyo'] },
  { term: 'FIFO', category: 'Proses', definition: 'First In First Out — İlk Giren İlk Çıkar. Depo yönetiminde eski stoğun önce sevk edilmesini sağlayan ilke. Plastik ham maddede raf ömrü resmi yoktur; ancak uzun bekleyen malzeme nem, UV ve sıkışma bozunması yaşayabilir.', tags: ['proses', 'lojistik', 'depo'] },
  { term: 'Incoterms', category: 'Lojistik', definition: 'Uluslararası Ticaret Teslim Koşulları. Satıcı ve alıcı arasında nakliye sorumluluğunu ve sigorta yükümlülüğünü belirler. FCA: fabrika çıkışı teslim; DAP: belirlenen noktaya kadar satıcı taşır; CIF: deniz yolu ihracatta maliyet+sigorta+navlun satıcıda.', tags: ['lojistik', 'ihracat', 'standart'] },
  { term: 'Lot izlenebilirliği', category: 'Kalite', definition: 'Traceability. Ürünün hammaddeden nihai alıcıya kadar her adımda lot numarasıyla takip edilebilmesi. GRS sertifikasyon denetimlerinde zorunlu. Müşteri şikayetinde kaynağın bulunması, EFSA food-grade denetimleri ve iade yönetimi için kritik.', tags: ['kalite', 'standart', 'GRS'] },
];

// ─── Sayfa içerikleri ─────────────────────────────────────────────────────────

const PageOverview: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-[18px] font-bold text-gray-900 dark:text-white mb-1">Geri Dönüşüm Sektörü Wiki</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Plastik geri dönüşüm ve granül üretimi sektörüne özgü proses bilgisi, teknik terimler ve ekonomik parametreler.
        Enba platformunun hesaplama motorları bu bilgi tabanına dayanır.
      </p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Üretim Hattı', count: '2', color: 'bg-orange-50 border-orange-200 text-orange-700' },
        { label: 'Malzeme Türü', count: '5+', color: 'bg-blue-50 border-blue-200 text-blue-700' },
        { label: 'Terim', count: String(WIKI_TERMS.length), color: 'bg-purple-50 border-purple-200 text-purple-700' },
        { label: 'Senaryo', count: '5', color: 'bg-green-50 border-green-200 text-green-700' },
      ].map(c => (
        <div key={c.label} className={`rounded-xl border p-4 text-center ${c.color}`}>
          <div className="text-[28px] font-black">{c.count}</div>
          <div className="text-[11px] font-semibold">{c.label}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Recycle size={16} className="text-orange-500" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Hat 1 — Mekanik Geri Dönüşüm</span>
        </div>
        <Flow steps={[
          { label: 'Besleme' }, { label: 'Kırma' }, { label: 'Yıkama' },
          { label: 'Kurutma' }, { label: 'Ekstrüzyon', highlight: true }, { label: 'Granül', highlight: true },
        ]} />
      </div>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Factory size={16} className="text-orange-500" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Hat 2 — Yıkama Hattı</span>
        </div>
        <Flow steps={[
          { label: 'Besleme' }, { label: 'Ön Kırma' }, { label: 'Float-sink' },
          { label: 'Kaustik', highlight: true }, { label: 'Durulama' }, { label: 'Flake', highlight: true },
        ]} />
      </div>
    </div>

    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-orange-500" />
        <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Referans Senaryo (Kömürcüler)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Giriş', '110 ton/ay'],
          ['1. kalite granül', '93,5 ton/ay'],
          ['Hammadde alış', '19 ₺/kg'],
          ['Granül satış', '40 ₺/kg'],
          ['Başabaş', '≈ 57 ton/ay'],
        ].map(([k, v]) => (
          <div key={k} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
            <div className="text-[13px] font-bold text-gray-800 dark:text-white">{v}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{k}</div>
          </div>
        ))}
      </div>
    </div>

    <Note type="info">
      Bu wiki Enba platformunun hesaplama mantığını ve sektöre özgü parametrelerini belgeler.
      İş planı modülündeki varsayılan değerler buradan beslenir.
    </Note>
  </div>
);

const PageProses: React.FC = () => (
  <div className="space-y-8">
    {/* Malzeme Akışı */}
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Recycle size={16} className="text-orange-500" /> Malzeme Akışı — Genel Proses
      </h3>
      <div className="space-y-4">
        <Flow steps={[
          { label: 'Giriş', sub: 'kg / ton' },
          { label: 'Giriş Firesi', sub: 'nem · çöp · fraksiyon', highlight: true },
          { label: 'Ön Seçim?', sub: 'malzeme bazında' },
          { label: 'Üretim', sub: 'proses · yıkama · filtre' },
          { label: 'Çıktı', sub: '1–N ürün' },
          { label: 'Ambalaj', sub: 'çuval → satış' },
        ]} />
        <Note type="tip">
          Her plan <strong>tek malzeme tipi</strong> üzerine kurulur. Çok malzeme hat değişimi gerektirir → hammadde + zaman kaybı.
        </Note>
      </div>
    </section>

    {/* Fire */}
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <FlaskConical size={16} className="text-orange-500" /> Giriş Firesi — Tipler & Modlar
        <Tag color="purple">Kritik</Tag>
      </h3>
      <div className="space-y-4">
        <DataTable
          headers={['Fire Tipi', 'Açıklama', 'Alt Kaliteye Dönüşür mü?']}
          rows={[
            ['Nem firesi',              'Islak malzemedeki su oranı — saf kayıp',              <Tag color="red">❌ Saf kayıp</Tag>],
            ['Geri dönüşümsüz çöp',    'Hiçbir değeri olmayan atık — at',                     <Tag color="red">❌ Saf kayıp</Tag>],
            ['Alt kalite fraksiyonlar', 'Kağıt, LDPE, 2./3. kalite vb.',                       <Tag color="green">✅ Koşullu</Tag>],
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
            <div className="font-semibold text-[12.5px] text-gray-700 mb-1">Mod A — Basit Fire</div>
            <ul className="text-[12px] text-gray-600 space-y-1 list-disc list-inside">
              <li>Fraksiyonlar tek toplam % olarak girilir</li>
              <li>Tamamı kayıp, gelir yok</li>
              <li>Hesaplama basit ve hızlı</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl border border-orange-200 bg-orange-50">
            <div className="font-semibold text-[12.5px] text-orange-700 mb-1">Mod B — Alt Kalite Aktif</div>
            <ul className="text-[12px] text-orange-700 space-y-1 list-disc list-inside">
              <li>Her fraksiyon ayrı: ad + % + ₺/kg</li>
              <li>Örn: kağıt %5 → 0,05 ₺/kg</li>
              <li>Bazı işletmeler bunlara ödeme yapar</li>
              <li>Gelir hesabına girer</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Ön Seçim */}
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Layers size={16} className="text-orange-500" /> Ön Seçim
      </h3>
      <div className="space-y-4">
        <Note type="info">
          Her malzeme için ayrı karar. Bazı malzemeler ön seçimi <strong>bypass</strong> ederek direkt üretime girer — kırma hattına girmeden önce elle yapılır.
        </Note>
        <DataTable
          headers={['Fraksiyon Kararı', 'Ne Olur?']}
          rows={[
            [<Tag color="green">Direkt sat</Tag>,    'Gelir hesabına girer, üretime katılmaz'],
            [<Tag color="blue">Üretime sok</Tag>,    'Granül hattına giriyor, orada da fire verebilir'],
            [<Tag color="red">At (fire)</Tag>,       'Saf kayıp, gelir yok'],
          ]}
        />
      </div>
    </section>

    {/* Hat Uyumluluğu */}
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <AlertTriangle size={16} className="text-orange-500" /> Hat Uyumluluğu
        <Tag color="amber">Niş Bilgi</Tag>
      </h3>
      <div className="space-y-4">
        <DataTable
          headers={['Malzeme', 'Aynı Hat?', 'Aynı Anda?', 'Not']}
          rows={[
            ['PP',   <Tag color="green">✅</Tag>,  <Tag color="red">❌</Tag>,    'Sıralı çalışır — hat temizliği gerekir'],
            ['LDPE', <Tag color="green">✅</Tag>,  <Tag color="red">❌</Tag>,    'PP ile paylaşır ama aynı anda değil'],
            ['HDPE', <Tag color="green">✅</Tag>,  <Tag color="red">❌</Tag>,    'PP / LDPE hattını paylaşır'],
            ['PET',  <Tag color="red">❌</Tag>,    <Tag color="red">❌</Tag>,    'Ayrı hat zorunlu — diğerleriyle uyumsuz'],
          ]}
        />
        <Note type="warn">
          Hat değişimi (PP → LDPE gibi) <strong>hem hammadde hem zaman kaybı</strong> demek. Bu yüzden çok malzeme planlaması istenen bir durum değildir.
        </Note>
      </div>
    </section>
  </div>
);

// ─── Hat 3 — Atık Ayrıştırma ─────────────────────────────────────────────────

const Hat3Content: React.FC = () => (
  <div className="space-y-6">
    <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
          <span className="text-[11px] font-black text-purple-600">3</span>
        </div>
        <span className="text-[13px] font-bold text-gray-800 dark:text-white">Atık Ayrıştırma Hattı</span>
        <Tag color="purple">separasyon · NIR sorting</Tag>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 mb-1">Sektörel</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Karışık atığı reçine tipine, renge ve malzeme grubuna göre ayıran hat. Çıktı granül değil, birden fazla fraksiyon. Hat 1 ve Hat 2'nin giriş kalitesini bu hat belirler.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 mb-1">Teknik</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Trommel elek → balistik seperatör → manyetik + eddy current → NIR spektroskopi → ejektör sistemi → renk sıralayıcı → XRF spot kontrol. Büyük ölçekli tesis: MRF (Materials Recovery Facility).</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 mb-1">Uluslararası</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Sorting line geri dönüşüm zincirinin "değer kapısı"dır. AB PPWR ve RecyClass çerçevesinde ambalaj tasarımı "sortability" skoru bu hattın performansına dayanır.</p>
        </div>
      </div>
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Akış Şeması</h4>
      <ProcessDiagram steps={[
        {
          label: 'Besleme & Boyut Eleme', type: 'default',
          sub: 'Balya açılır veya dökme atık konveyöre verilir. Trommel elekle iri ve ince fraksiyonlar ayrılır. Elek altı (<80 mm) organik artık ve kum içerir — tartılıp kayıt alınmalı; yüksek oran giriş kalitesinin düşük olduğuna işaret eder.',
          machines: ['Balya açıcı', 'Trommel elek', 'Titreşimli elek'],
        },
        {
          label: 'Balistik Seperasyon', type: 'separation',
          sub: '"Film uçar, rijit yuvarlanır." Meyilli salınımlı plakalar üzerinde film fraksiyonu düşük açıyla sürüklenir, rijit parçalar yüksek açıyla zıplar. Mevsime ve malzemeye göre ayar güncellenmeli.',
          machines: ['Balistik seperatör'],
          params: ['Film → Hat 2\'ye', 'Rijit → NIR\'a'],
        },
        {
          label: 'Metal Ayrımı', type: 'default',
          sub: 'Önce overband mıknatıs ferromanyetik metalleri (demir, çelik) çeker. Ardından eddy current seperatör alüminyum ve demir dışı metalleri iter. Metal NIR\'dan ÖNCE gelmeli — sensöre zarar verebilir.',
          machines: ['Overband mıknatıs', 'Eddy current sep. (ECS)'],
          params: ['Sıra önemli: metal → NIR öncesi'],
        },
        {
          label: 'NIR Sensör Taraması', type: 'quality', highlight: true,
          sub: 'Her parça saniyeler içinde taranır, reçine tipi 700–2500 nm dalga boyunda belirlenir. PET/PP/PE/PS/PVC/ABS ayırt eder. Siyah plastik tanınamaz (karbon siyahı NIR\'ı emer) — büyük kör nokta.',
          machines: ['NIR sıralayıcı / optical sorter'],
          params: ['Tanıma doğruluğu ≥ %95', '⚠️ Siyah plastik kör nokta'],
        },
        {
          label: 'Hava Ejektörü', type: 'quality', highlight: true,
          sub: 'NIR sinyali ≤ 10 ms\'de ejektörü tetikler; nozzle hava üfleyerek parçayı fraksiyon kanalına yönlendirir. Basınç ayarı ağır ve hafif parçalar için farklı. Yanlış ejeksiyon hedefi: <%2.',
          machines: ['Ejektör sistemi (nozzle dizilimi 1.200–2.400 mm)'],
          params: ['Tetikleme: ≤ 10 ms', 'Hata hedefi: < %2'],
        },
        {
          label: 'Renk Sıralayıcı', type: 'quality',
          sub: 'CCD/RGB kamera + arka aydınlatma ile PET şeffaf–mavi–opak ayrımını yapar. Renk ayrımı satış fiyatını doğrudan etkiler. Kamera kirlenmesi tanımayı bozar; günlük kalibrasyon önerilir. Siyah burada da görünmez.',
          machines: ['Renk sıralayıcı (colour sorter / RGB)'],
        },
        {
          label: 'XRF Spot Kontrol & Picking Station', type: 'quality',
          sub: 'El tipi XRF analizörüyle Cl (→ PVC) ve Br (→ bromlu e-atık) aranır. Picking station\'da gözden kaçanlar elle ayıklanır. Food-grade PET fraksiyonu için zorunlu son kontrol noktası.',
          machines: ['El XRF analizörü', 'Picking station'],
          params: ['PVC ≤ 10 ppm (food-grade)', 'Br kontrolü (WEEE)'],
        },
      ]} />
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Fraksiyon Çıktıları — Sonraki Hat Yönlendirmesi</h4>
      <DataTable
        headers={['Fraksiyon', 'Sonraki Adım', 'Not']}
        rows={[
          [<span className="font-semibold text-green-700">PET şeffaf</span>, 'Hat 2 (PET yıkama) veya satış', 'En yüksek değerli fraksiyon'],
          ['PET mavi / renkli', 'Hat 2 veya satış (daha düşük fiyat)', 'Renk sıralayıcı ayrımına göre'],
          ['rHDPE / rPP rijit', 'Hat 1 veya Hat 2', 'Kaliteye göre'],
          ['PE / PP film', 'Hat 2 (folyo yıkama)', 'Balistik çıktısı'],
          ['PS / EPS', 'Hat 1 veya EPS kompaksiyon', 'EPS önce kompakt hâle getirilmeli'],
          ['Metal (demir)', 'Hurda metal — çelikhane', 'Manyetik fraksiyon'],
          ['Metal (alüminyum)', 'Hurda metal — eritme', 'Eddy current fraksiyon'],
          [<span className="text-red-600">Siyah plastik</span>, 'Reject → Hat 4 veya bertaraf', 'NIR tanıyamaz — kayıp'],
          [<span className="text-red-600">Reject / kirli miks</span>, 'Hat 4 (kimyasal) veya enerji geri kazanımı', 'Mekanik yolla işlenemez'],
        ]}
      />
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">İşlenen Atık Tipleri</h4>
      <DataTable
        headers={['Atık Tipi', 'Sektörel Adı', 'Dikkat']}
        rows={[
          ['Karışık ambalaj balya', 'Miks ambalaj / MRF balya', 'Organik kirlilik ve nem oranı yüksek olabilir'],
          ['PET şişe (ayrılmamış)', 'Karışık PET şişe', 'Siyah PET NIR\'da tanınamaz'],
          ['HDPE/PP karışık', 'Miks sert plastik', 'Metal yok, renk miks kabul'],
          ['LDPE/PP film balya', 'Film balya / folyo balya', 'Islak ve kirli film verim düşürür'],
          ['PS köpük + rijit', 'PS ambalaj', 'EPS kompaksiyon ister'],
          [<Tag color="red">PVC ambalaj</Tag>, 'PVC şişe / blister', 'Az miktarda bile PET\'i bozar — XRF zorunlu'],
          ['Karışık metal', 'Metal miks', 'Manyetik + EC ile ayrılır'],
          ['E-atık plastik', 'WEEE plastik', 'ABS, PS, PC — bromlu alev geciktiriciler kontrol'],
          ['Siyah plastik', 'Siyah fraksiyon', 'Karbon siyahı NIR\'ı emer — özel sensör gerekir'],
        ]}
      />
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kullanılan Başlıca Makinalar</h4>
      <DataTable
        headers={['Makina', 'Teknik Adı (İng.)', 'Görev']}
        rows={[
          ['Balya açıcı',         'Bale opener',             'Balyayı dağıtır'],
          ['Trommel elek',        'Trommel screen',          'Döner tambur boyut eleme'],
          ['Titreşimli elek',     'Vibrating screen',        'Düzlemsel boyut eleme'],
          ['Balistik seperatör',  'Ballistic separator',     'Film–rijit ayırma'],
          ['Overband mıknatıs',   'Overband magnet',         'Demir metal giderimi'],
          ['Eddy current sep.',   'Eddy current separator',  'Alüminyum ve demir dışı metal'],
          [<span className="font-semibold text-purple-600">NIR sıralayıcı</span>, 'NIR / optical sorter', 'Reçine tipi tanıma + ejeksiyon'],
          ['Renk sıralayıcı',     'Colour sorter / RGB',     'Renk bazlı fraksiyon ayrımı'],
          ['El XRF analizörü',    'Handheld XRF analyzer',   'PVC / Br spot dedeksiyon'],
          ['Picking station',     'Sorting cabin',           'Manuel ayıklama bandı'],
          ['Ön şredder',          'Pre-shredder',            'İri hacimli atık boyut küçültme'],
        ]}
      />
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kritik Parametreler</h4>
      <DataTable
        headers={['Parametre', 'Birim', 'Hedef']}
        rows={[
          ['Giriş kirlilik oranı', '%', '≤ %10 verimli çalışma için'],
          ['NIR tanıma doğruluğu', '%', '≥ %95'],
          ['Yanlış ejeksiyon oranı', '%', '≤ %2'],
          ['Konveyör hızı', 'm/s', '2,5–3,5 (NIR tipine göre)'],
          [<Tag color="red">PVC içeriği (PET çıktı)</Tag>, 'ppm', '≤ 10'],
          ['Nem oranı (giriş)', '%', 'Yüksek nem NIR doğruluğunu bozar'],
          ['Elek altı oranı', '%', 'Tedarikçi kalite göstergesi — kayıt alınmalı'],
        ]}
      />
    </section>

    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Sık Yapılan Hatalar</h4>
      <div className="space-y-2">
        <Note type="warn">
          <strong>Siyah plastik gözardı ediliyor:</strong> Karbon siyahı içeren plastikler NIR\'da tanınamaz. Çözüm MWIR veya lazer sensör; Türkiye\'de henüz yaygın değil.
        </Note>
        <Note type="warn">
          <strong>PVC kontaminasyonu gözden kaçıyor:</strong> Küçük parçaları NIR okuyamayabilir. XRF spot kontrol ve picking station şart.
        </Note>
        <Note type="warn">
          <strong>Balistik ayar yapılmıyor:</strong> Mevsime göre film farklı davranır. Malzeme tipine göre ayar güncellenmezse film fraksiyonu rijit kanala karışır.
        </Note>
        <Note type="info">
          <strong>Elek altı tartılmalı:</strong> Elek altı oranı (organik artık, kum, cam) giriş kalitesinin göstergesi. Kayıt altına alınmazsa tedarikçi kalite değerlendirmesi yapılamaz.
        </Note>
      </div>
    </section>
  </div>
);

// ─── Hat 4 — Kimyasal Geri Dönüşüm ──────────────────────────────────────────

const Hat4Content: React.FC = () => {
  const [altHat, setAltHat] = useState<'piroliz' | 'depolim' | 'solvent'>('piroliz');

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
            <span className="text-[11px] font-black text-red-600">4</span>
          </div>
          <span className="text-[13px] font-bold text-gray-800 dark:text-white">Kimyasal Geri Dönüşüm Hattı</span>
          <Tag color="red">piroliz · depolimerizasyon</Tag>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-1">Sektörel</div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Mekanik yolun ulaşamadığı atıklar için kullanılan hat: çok kirli, gıda temaslı, karmaşık katmanlı plastikler. Çıktı granül değil, kimyasal hammadde veya yakıt. Türkiye\'de büyük ölçüde pilot / AR-GE aşamasında.</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-1">Teknik</div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">3 ana kol: (A) Piroliz — termal/katalitik. (B) Depolimerizasyon — glikoliz, metanoliz, hidroliz. (C) Solvent bazlı saflaştırma. Her kolun giriş atığı, proses koşulları ve çıktısı farklıdır.</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-1">Uluslararası</div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">AB PPWR\'da "recycled content" sayılabilmesi metodoloji tartışması sürüyor. Depolimerizasyon çıktısı gerçek anlamda döngüsel ekonomiyi tamamlar: PET → monomer → yeni PET. Eastman, Indorama, Carbios öne çıkan yatırımcılar.</p>
          </div>
        </div>
      </section>

      {/* Alt hat seçici */}
      <div className="flex gap-2">
        {([
          { key: 'piroliz', label: 'A — Piroliz', sub: '350–700 °C · pyoil + char' },
          { key: 'depolim', label: 'B — Depolimerizasyon', sub: 'PET → monomer' },
          { key: 'solvent', label: 'C — Solvent Saflaştırma', sub: 'çözücüyle izolasyon' },
        ] as const).map(h => (
          <button key={h.key} onClick={() => setAltHat(h.key)}
            className={cx(
              'flex-1 p-2.5 rounded-xl border text-left transition-all',
              altHat === h.key
                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-red-200',
            )}>
            <div className="text-[12px] font-semibold">{h.label}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{h.sub}</div>
          </button>
        ))}
      </div>

      {altHat === 'piroliz' && (
        <div className="space-y-4">
          <Note type="info">
            <strong>Piroliz ≠ yakma.</strong> Oksijen yoktur; malzeme yanmaz, moleküller kırılır. 350–700 °C, inert atmosfer (N₂ / vakum).
          </Note>
          <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Proses Akışı</h4>
          <ProcessDiagram steps={[
            {
              label: 'Ön Hazırlık — Boyut & Nem', type: 'default',
              sub: 'Shredder\'da boyut küçültme. Kurutma silosunda nem <%5\'e indirilir. Yüksek nem enerji tüketimini dramatik artırır.',
              machines: ['Shredder', 'Kurutma silosu'],
              params: ['Nem: < %5'],
            },
            {
              label: 'PVC & Klorür Ayrımı', type: 'quality', highlight: true,
              sub: 'En kritik adım. PVC ve klorürlü plastik ayrılmadan reaktöre giremez — termik bozunmada HCl gazı üretir, ekipmanı aşındırır ve piroliz yağı kalitesini bozar.',
              machines: ['XRF analizör'],
              params: ['Klorür: < 200 ppm', '⚠️ PVC kesinlikle ayrılmalı'],
            },
            {
              label: 'Reaktöre Besleme', type: 'default',
              sub: 'Kesikli (batch) veya sürekli (continuous) besleme seçilir. Döner fırın sürekli ve iri parçalar için; sabit yatak küçük ölçek için; akışkan yatak katalitik piroliz için uygundur.',
              machines: ['Döner fırın (rotary kiln)', 'Sabit yataklı reaktör', 'Akışkan yataklı reaktör'],
            },
            {
              label: 'Piroliz Reaktörü', type: 'chemical', highlight: true,
              sub: 'Oksijensiz ortamda (N₂ / vakum) 350–700 °C\'de polimer zincirleri kırılır. Yanma değil, termokimyasal bozunma. Batch\'te tipik bekleme süresi 30–90 dakika.',
              machines: ['Piroliz reaktörü'],
              params: ['350–700 °C', 'Oksijensiz (N₂ / vakum)', '30–90 dk (batch)'],
            },
            {
              label: 'Kondansasyon', type: 'thermal',
              sub: 'Gaz fazındaki ürünler soğutularak sıvı piroliz yağına dönüştürülür. Hafif fraksiyon (nafta benzeri) + ağır fraksiyon (fuel oil). Verim: %40–70.',
              machines: ['Kondansasyon ünitesi'],
              params: ['Piroliz yağı verimi: %40–70'],
            },
            {
              label: 'Gaz Geri Kazanımı & Char Boşaltma', type: 'default',
              sub: 'Kondansasyon dışı yanıcı gaz (%10–20) proses ısısında kullanılır. Char (%5–30) reaktör tabanından periyodik boşaltılır. Bertaraf planı olmadan tesis içinde birikim oluşur.',
              machines: ['Char uzaklaştırma sistemi'],
              params: ['Gaz: %10–20', 'Char: %5–30'],
            },
          ]} />
          <DataTable
            headers={['Çıktı', 'Oran', 'Kullanım']}
            rows={[
              ['Piroliz yağı', '%40–70', 'Petrokimya beslemesi veya yakıt'],
              ['Yanıcı gaz',   '%10–20', 'Proses enerjisinde kullanılır'],
              ['Char / kurum', '%5–30',  'Karbon siyahı ikamesi araştırılıyor; aksi hâlde bertaraf'],
            ]}
          />
          <DataTable
            headers={['Reaktör Tipi', 'Açıklama']}
            rows={[
              ['Döner fırın (rotary kiln)', 'Sürekli besleme, iri parça kabul, ölçeklendirme kolay'],
              ['Sabit yataklı (fixed bed)', 'Basit, küçük ölçek, batch çalışma'],
              ['Akışkan yataklı (fluidized bed)', 'Katalitik piroliz için uygun, homojen sıcaklık'],
            ]}
          />
          <Note type="warn">
            <strong>PVC ayrıştırılmadan giremez:</strong> HCl gazı üretir, reaktörü ve kondansasyon ekipmanını aşındırır, piroliz yağı kalitesini bozar.
          </Note>
        </div>
      )}

      {altHat === 'depolim' && (
        <div className="space-y-4">
          <Note type="tip">
            Polimer zincirleri kimyasal reaktiflerle monomer seviyesine indirilir. PET için en değerli kimyasal geri dönüşüm yolu — çıktı yeni PET üretiminde kullanılır.
          </Note>
          <DataTable
            headers={['Alt Yol', 'Reaksiyon', 'Sıcaklık', 'Çıktı', 'Durum']}
            rows={[
              [
                <span className="font-semibold">B1 · Glikoliz</span>,
                'PET + EG → BHET + oligomer',
                '180–240 °C',
                'BHET (yeni PET hammaddesi)',
                <Tag color="green">En yaygın</Tag>,
              ],
              [
                <span className="font-semibold">B2 · Metanoliz</span>,
                'PET + metanol → DMT + EG',
                '180–280 °C',
                'DMT + EG (ayrı saflaştırma)',
                <Tag color="amber">Yüksek yatırım</Tag>,
              ],
              [
                <span className="font-semibold">B3 · Hidroliz</span>,
                'PET + su → TPA + EG',
                'Yüksek T + basınç',
                'TPA (en temiz döngü)',
                <Tag color="gray">Ölçeklendirme güç</Tag>,
              ],
            ]}
          />
          <Note type="info">
            Glikoliz: kirli ve gıda temaslı PET için uygun — mekanik yolun reddettiği malzemeyi değerlendirir. Katalizör: çinko asetat veya manganez asetat.
          </Note>
        </div>
      )}

      {altHat === 'solvent' && (
        <div className="space-y-4">
          <Note type="info">
            Plastik çözücüde eritilir, safsızlıklar süzülür, polimer yeniden çöktürülür. Kimyasal yapı bozulmaz — bu yönüyle depolimerizasyondan farklıdır.
          </Note>
          <DataTable
            headers={['Polimer', 'Çözücü', 'Durum']}
            rows={[
              ['PS / EPS köpük', 'Limonen (d-limonene) veya aseton', <Tag color="green">AB\'de ticari ölçek</Tag>],
              ['PP / PE', 'Xilen veya dekalin bazlı', <Tag color="amber">Pilot aşama</Tag>],
              ['PVC', 'THF veya MEK bazlı', <Tag color="gray">Ticari uygulama sınırlı</Tag>],
            ]}
          />
          <Note type="warn">
            Çözücü geri kazanım verimi ekonomiyi belirler. Damıtmayla döngüye alınan çözücü kayıp oranı {'<'} %5 hedeflenir; düştüğünde hem maliyet hem çevre riski artar.
          </Note>
        </div>
      )}

      {/* Ortak: atık tipleri */}
      <section>
        <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">İşlenen Atık Tipleri</h4>
        <DataTable
          headers={['Atık Tipi', 'Uygun Alt Hat', 'Dikkat']}
          rows={[
            ['Kirli / karışık PE-PP', 'Piroliz (A)', 'PVC yok, nem < %5'],
            ['Kirli PS / EPS', 'Piroliz (A) veya Solvent (C)', 'Brom içerip içermediği kontrol'],
            ['PET gıda temaslı', 'Glikoliz (B1)', 'Mekanik yolun reddettiği malzeme'],
            ['Çok katmanlı ambalaj', 'Piroliz (A)', 'Film + folyo laminat — ayrıştırma imkânsız'],
            ['Siyah plastik', 'Piroliz (A)', 'Hat 3 reject — char oranı yüksek'],
            [<Tag color="red">Bromlu plastik (e-atık)</Tag>, 'Özel piroliz (debromination)', 'Brom ayrıştırma ünitesi şart'],
          ]}
        />
      </section>

      {/* Kritik parametreler */}
      <section>
        <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kritik Parametreler</h4>
        <DataTable
          headers={['Parametre', 'Alt Hat', 'Hedef']}
          rows={[
            ['Piroliz sıcaklığı', 'A', '350–700 °C (malzemeye göre)'],
            ['Piroliz yağı verimi', 'A', '%40–70 (giriş kalitesine bağlı)'],
            [<Tag color="red">Klorür içeriği (giriş)</Tag>, 'A', '< 200 ppm (HCl riski)'],
            ['Nem (giriş)', 'A, B', '< %5'],
            ['Glikoliz sıcaklığı', 'B1', '180–240 °C'],
            ['BHET saflığı', 'B1', '≥ %95 hedef'],
            ['DMT saflığı', 'B2', '≥ %99 hedef'],
            ['Çözücü geri kazanım', 'C', '≥ %95 hedef'],
          ]}
        />
      </section>

      {/* Türkiye notu */}
      <section className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-4">
        <div className="text-[12px] font-semibold text-amber-700 dark:text-amber-400 mb-2">🇹🇷 Türkiye Durum Notu (2024)</div>
        <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
          Kimyasal geri dönüşüm tesisleri büyük ölçüde <strong>pilot ve AR-GE aşamasında</strong>. Piroliz kurulumları artmakla birlikte çıktı kalitesi ve düzenleyici çerçeve henüz olgunlaşmadı. ÇED sürecine ve sıfır atık lisansına ek kimyasal proses izinleri gerekiyor — yatırım planlamasında bu süre göz önüne alınmalı. AB PPWR baskısı ve ihracat hedefleri bu alanı önümüzdeki 5 yılda hızla geliştirecek.
        </p>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Sık Yapılan Hatalar</h4>
        <div className="space-y-2">
          <Note type="warn">
            <strong>PVC ayrıştırılmadan pirolize giriyor:</strong> HCl gazı reaktör ve kondansasyon ekipmanını aşındırır. Hat 3\'teki XRF kontrolü bu yüzden kritik.
          </Note>
          <Note type="warn">
            <strong>Nem yönetimi ihmal ediliyor:</strong> Yüksek nem pirolizde enerji tüketimini dramatik artırır; glikolizde reaksiyon dengesini bozar.
          </Note>
          <Note type="info">
            <strong>Piroliz yağı "geri dönüştürülmüş plastik" sayılmıyor:</strong> Yakıt veya petrokimya beslemesidir. AB PPWR\'da hesaplama metodolojisi hâlâ tartışmalı.
          </Note>
          <Note type="warn">
            <strong>Char bertarafı planlanmıyor:</strong> Düzenli boşaltma planı olmadan tesis içinde birikim sorunu çıkar.
          </Note>
        </div>
      </section>
    </div>
  );
};

// ─── Hat 5 — Balyalama, Çuvallama & Sevkiyat ────────────────────────────────

const Hat5Content: React.FC = () => (
  <div className="space-y-6">
    {/* Tanım */}
    <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
          <span className="text-[11px] font-black text-green-600">5</span>
        </div>
        <span className="text-[13px] font-bold text-gray-800 dark:text-white">Balyalama, Çuvallama & Sevkiyat Hattı</span>
        <Tag color="green">paketleme · lojistik</Tag>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-green-500 mb-1">Sektörel</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Çıktı malzemeyi satışa hazır hâle getiren hat. Sektörde "balya hattı" veya "pres" diye geçer. Granül ve pul için balyalama presi kullanılmaz — bunlar big bag veya oktabine gider. Bu ayrım sık karıştırılır.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-green-500 mb-1">Teknik</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">İki paralel sistem: (A) Balyalama presi — hidrolik sıkıştırmayla katı malzeme bloğu üretir, tel/ip bağlar. (B) Çuvallama istasyonu — tartımlı dolum başlığıyla big bag veya oktabini ±5 kg toleransla doldurur.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-green-500 mb-1">Uluslararası</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Baling ve filling işlemleri, tedarik zincirinde ağırlık ölçümü ve lot izlenebilirliğinin (traceability) başladığı noktadır. GRS sertifikalı ürünlerde lot numarasının hammaddeden nihai ürüne izlenebilir olması zorunludur.</p>
        </div>
      </div>
    </section>

    {/* Paralel sistemler */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">İki Paralel Sistem</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/5 dark:border-green-500/20 p-4">
          <div className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-2">A — Balyalama Presi</div>
          <div className="text-[12.5px] font-bold text-gray-800 dark:text-white mb-2">Katı, sıkıştırılabilir malzeme → tel balya</div>
          <ul className="space-y-1">
            {[
              'PET şişe, HDPE/PP rijit, kağıt-karton, metal',
              'Yatay kanal presi: sürekli besleme, 2–20 ton/sa',
              'İki ram presi: film/folyo — %20–40 daha yoğun balya',
              'Balya boyutu tipik: 1.100 × 700 × 700 mm',
              'Tel sayısı: 4–6 çelik tel',
            ].map(p => (
              <li key={p} className="text-[12px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                <span className="text-green-400 mt-1 flex-shrink-0">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/5 dark:border-blue-500/20 p-4">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2">B — Çuvallama İstasyonu</div>
          <div className="text-[12.5px] font-bold text-gray-800 dark:text-white mb-2">Dökülebilir malzeme → big bag / oktabin</div>
          <ul className="space-y-1">
            {[
              'Granül, pul (flake) — kesinlikle pres değil',
              'Big bag (FIBC): 500–1.000 kg, ±5 kg tolerans',
              'Oktabin: sekizgen karton + PE iç torba, 500–1.000 kg',
              'Food-grade granül için PE iç kaplı big bag zorunlu',
              'Vibrasyon ile malzeme oturması sağlanır',
            ].map(p => (
              <li key={p} className="text-[12px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                <span className="text-blue-400 mt-1 flex-shrink-0">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    {/* Proses akışı */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Akış Şeması</h4>
      <ProcessDiagram steps={[
        {
          label: 'Malzeme Girişi & Akış Ayrımı', type: 'default',
          sub: 'Hat 1–4 çıktıları bu hatta gelir. İlk karar: sıkıştırılabilir mi (→ Balyalama Presi) yoksa dökülebilir mi (→ Çuvallama İstasyonu)? Granül ve pul mutlaka çuvallama istasyonuna gider; preste sıkıştırılamaz, makinaya zarar verir.',
          machines: ['Bant konveyör'],
          params: ['Granül / pul → Çuvallama İstasyonu', 'Katı atık balya → Balyalama Presi'],
        },
        {
          label: 'A — Balyalama Presi (Katı Malzeme)', type: 'separation', highlight: true,
          sub: 'Yatay kanal presi PET şişe, HDPE/PP rijit ve kağıt-karton için standarttır. İki ram presi film ve folyo için — springback\'li malzemelerde yatay prese göre %20–40 daha yoğun balya üretir, ton başı nakliye maliyetini düşürür.',
          machines: ['Yatay kanal presi (horizontal channel baler)', 'İki ram presi (two-ram baler)'],
          params: ['PET balya: 200–350 kg', 'HDPE/PP: 300–500 kg', 'Film: 150–300 kg (yatay) · 250–450 kg (iki ram)'],
        },
        {
          label: 'B — Çuvallama İstasyonu (Granül & Pul)', type: 'quality', highlight: true,
          sub: 'Tartımlı dolum başlığı (filling head) big bag veya oktabini ±5 kg toleransla doldurur. Bag filler frame dolum sırasında çanta deformasyonunu önler. Vibrasyon malzeme oturmasını sağlar.',
          machines: ['Big bag dolum başlığı (FIBC filling head)', 'Oktabin dolum başlığı', 'Bag filler frame'],
          params: ['Dolum hedefi: 500–1.000 kg ±5 kg', 'Food-grade → PE iç kaplı big bag'],
        },
        {
          label: 'Tartım', type: 'quality',
          sub: 'Tartım hem üretim kaydı hem de alım-satım belgesidir. Yasal metroloji (TSE EN 45501) zorunlu — yıllık damga şart. Tartım tutanağı ihtilaf çözümünde birincil delildir.',
          machines: ['İnline tartım bandı (checkweigher)', 'Platform terazi / baskül'],
          params: ['İnline hassasiyet: ±1–2 kg', 'Yıllık damga: TSE EN 45501'],
        },
        {
          label: 'Etiketleme & Lot Kaydı', type: 'quality',
          sub: 'Her balya/big bag/oktabine etiket yapıştırılır. Etiketsiz ambalaj kimliksizdir — depo içi karışma, sevkiyatta hata ve müşteri iade anında geri izleme imkânsız hâle gelir. GRS denetimlerinde zorunlu.',
          machines: ['Etiket yazıcı (barkod / QR)'],
          params: ['Lot no · Reçine tipi · Ağırlık · Tarih · Hat no · QR kod'],
        },
        {
          label: 'Depolama', type: 'default',
          sub: 'Reçine bazlı alan ayrımı, FIFO uygulaması ve nem/UV koruması kritik. Açık depoda LDPE örtü zorunlu. Güneş altında uzun süre kalan PET balyası sararmaya başlar. Beton zemin şart — toprak zemin nem çeker.',
          machines: ['Forklift'],
          params: ['Balya: max 4–5 sıra', 'Big bag: max 2–3 sıra', 'Bağıl nem: ≤ %70'],
        },
        {
          label: 'Sevkiyat', type: 'default',
          sub: 'TIR yükleme düzeni, irsaliye ve numune alma alıcıyla ilişkiyi doğrudan etkiler. Incoterms seçimi (FCA/DAP/CIF) nakliye ve sigorta sorumluluğunu belirler. İhracat için: ATR/EUR.1, menşe şahadetnamesi, analiz sertifikası.',
          machines: ['TIR / araç'],
          params: ['FCA: fabrika çıkışı teslim', 'DAP: noktaya kadar satıcı', 'CIF: maliyet+sigorta+navlun satıcıda'],
        },
      ]} />
    </section>

    {/* Ambalaj seçim rehberi */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Malzeme Bazlı Ambalaj Seçim Rehberi</h4>
      <DataTable
        headers={['Malzeme', 'Uygun Ambalaj', 'Uygun Değil', 'Not']}
        rows={[
          ['PET şişe (balya)', 'Yatay kanal presi', 'Big bag / oktabin', 'Tel balya standart'],
          ['HDPE / PP rijit (balya)', 'Yatay kanal presi', '—', 'Ağır malzeme, yüksek balya ağırlığı'],
          ['LDPE / PP film (balya)', 'İki ram presi', 'Yatay pres (düşük yoğunluk)', 'Springback sorunu'],
          ['Kağıt / karton (balya)', 'Yatay kanal presi', 'Big bag / oktabin', 'Nem önlemi şart'],
          ['Metal fraksiyon (balya)', 'Yatay kanal presi', '—', 'Demir ve Al ayrı depolama'],
          ['PET granül / pul', 'Big bag · Oktabin', 'Balya presi', 'Food-grade için PE iç kaplı big bag'],
          ['PP / PE granül', 'Big bag · Oktabin', 'Balya presi', 'Standart big bag yeterli'],
          ['PS / ABS granül', 'Big bag · Oktabin', 'Balya presi', 'Nem hassasiyeti düşük'],
          ['Piroliz yağı', 'Varil / IBC tank', 'Balya / big bag', 'Sıvı — farklı depolama gerekir'],
        ]}
      />
    </section>

    {/* Ekipmanlar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kullanılan Başlıca Ekipmanlar</h4>
      <DataTable
        headers={['Ekipman', 'Teknik Adı (İng.)', 'Görev']}
        rows={[
          ['Yatay kanal presi',        'Horizontal channel baler',       'Katı plastik, kağıt-karton, metal balyalama'],
          ['İki ram presi',            'Two-ram baler',                  'Film, folyo, miks — yüksek yoğunluk balyalama'],
          ['Dikey pres',               'Vertical baler',                 'Küçük hacimli, düşük kapasite'],
          ['Big bag dolum başlığı',    'FIBC filling head / bag filler', 'Granül ve pul big bag dolumu'],
          ['Oktabin dolum başlığı',    'Octabin filling station',        'Granül ve pul oktabin dolumu'],
          ['Big bag çerçevesi',        'Bag filler frame',               'Dolum sırasında çanta formunu korur'],
          ['İnline tartım bandı',      'Inline checkweigher',            'Geçerken otomatik tartım'],
          ['Platform terazi / baskül', 'Platform scale',                 'Balya / big bag tartımı'],
          ['Etiket yazıcı',            'Label printer',                  'Barkod / QR etiket basımı'],
          ['Konveyör sistemi',         'Belt / roller conveyor',         'Hat boyunca taşıma'],
        ]}
      />
    </section>

    {/* Kritik parametreler */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kritik Parametreler</h4>
      <DataTable
        headers={['Parametre', 'Sektörel Adı', 'Birim', 'Hedef / Not']}
        rows={[
          ['Balya yoğunluğu (PET)',     'Yoğunluk / sıkılık',    'kg/m³', '250–400 kg/m³'],
          ['Balya yoğunluğu (film)',    'Film balya yoğunluğu',  'kg/m³', '150–250 kg/m³'],
          ['Tartım toleransı',          'Terazi hassasiyeti',     'kg',    '±1–2 kg (inline)'],
          ['Big bag dolum hedefi',      'Dolum ağırlığı',         'kg',    '500–1.000 ±5 kg'],
          ['Balya bağlama tel sayısı',  'Tel adedi',              'adet',  '4–6 tel'],
          ['Depo bağıl nem',            'Nem oranı',              '%',     '≤ %70 (granül depo)'],
          ['İstif yüksekliği (balya)',  'İstif yüksekliği',       'sıra',  'Max 4–5 sıra'],
        ]}
      />
    </section>

    {/* Sık hatalar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Sık Yapılan Hatalar</h4>
      <div className="space-y-2">
        <Note type="warn">
          <strong>Granülü balyalama presine vermeye çalışmak:</strong> Pres granülü sıkıştıramaz — dökülen malzeme makinaya zarar verir. Granül ve pul mutlaka çuvallama istasyonuna gitmeli.
        </Note>
        <Note type="warn">
          <strong>Balya yoğunluğu düşük tutulmak:</strong> TIR başına düşen ağırlık azalır, ton başı nakliye maliyeti artar. Alıcı düşük yoğunluğu iskonto gerekçesi olarak kullanabilir. İki ram presi bu sorunu çözer.
        </Note>
        <Note type="warn">
          <strong>Tartım kalibrasyonu yapılmamış:</strong> Yasal metroloji damgası olmayan terazi ile yapılan ağırlık kayıtları ihtilafta geçersiz sayılabilir. Yıllık damga zorunlu.
        </Note>
        <Note type="warn">
          <strong>Nem kontrolü yapılmadan depolama:</strong> Açık depoda bekleyen balya ve big bag nem çeker; tartım şişer (gerçek ağırlıktan fazla görünür), küf riski oluşur, alıcı reddi.
        </Note>
        <Note type="warn">
          <strong>Lot takibi yapılmıyor:</strong> Müşteri şikayetinde hangi tedarikçi balyasından üretildiği izlenemiyor. GRS denetiminde lot izlenebilirliği zorunlu — etiketsiz ambalaj reddedilir.
        </Note>
        <Note type="info">
          <strong>Yükleme sırası planlanmıyor:</strong> Ağır balyalar üste, hafif (film) balyalar alta konulursa ezilme ve balya açılması riski artar. TIR yükleme planı sevkiyattan önce yapılmalı.
        </Note>
      </div>
    </section>
  </div>
);

// ─── Hatlar Sayfası ───────────────────────────────────────────────────────────

const PageHatlar: React.FC = () => {
  const [activeHat, setActiveHat] = useState<'hat1' | 'hat2' | 'hat3' | 'hat4' | 'hat5'>('hat1');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <Factory size={16} className="text-orange-500" /> Üretim Hatları
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'hat1', label: 'Hat 1 — Mekanik Geri Dönüşüm', sub: 'Granül üretimi', color: 'orange' },
            { key: 'hat2', label: 'Hat 2 — Yıkama Hattı',          sub: 'Flake / pul üretimi', color: 'blue' },
            { key: 'hat3', label: 'Hat 3 — Atık Ayrıştırma',        sub: 'NIR separasyon', color: 'purple' },
            { key: 'hat4', label: 'Hat 4 — Kimyasal Geri Dönüşüm', sub: 'Piroliz · depolimerizasyon', color: 'red' },
          ] as const).map(h => {
            const active = activeHat === h.key;
            const cls: Record<string, string> = {
              orange: active ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400' : '',
              blue:   active ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' : '',
              purple: active ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400' : '',
              red:    active ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400' : '',
            };
            return (
              <button key={h.key} onClick={() => setActiveHat(h.key)}
                className={cx(
                  'p-3 rounded-xl border text-left transition-all',
                  active
                    ? cls[h.color]
                    : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20',
                )}>
                <div className="text-[12.5px] font-semibold">{h.label}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{h.sub}</div>
              </button>
            );
          })}
        </div>
        {/* Hat 5 — tam genişlik */}
        <button onClick={() => setActiveHat('hat5')}
          className={cx(
            'w-full mt-2 p-3 rounded-xl border text-left transition-all',
            activeHat === 'hat5'
              ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400'
              : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20',
          )}>
          <div className="text-[12.5px] font-semibold">Hat 5 — Balyalama & Sevkiyat</div>
          <div className="text-[11px] opacity-70 mt-0.5">Paketleme · lojistik · ihracat</div>
        </button>
      </div>

      {activeHat === 'hat1' && <Hat1Content />}
      {activeHat === 'hat2' && <Hat2Content />}
      {activeHat === 'hat3' && <Hat3Content />}
      {activeHat === 'hat4' && <Hat4Content />}
      {activeHat === 'hat5' && <Hat5Content />}
    </div>
  );
};

const Hat1Content: React.FC = () => (
  <div className="space-y-6">
    {/* Tanım */}
    <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
          <span className="text-[11px] font-black text-orange-600">1</span>
        </div>
        <span className="text-[13px] font-bold text-gray-800 dark:text-white">Mekanik Geri Dönüşüm Hattı</span>
        <Tag color="orange">kırma-granülasyon</Tag>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-1">Sektörel</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Atık plastiği kırıcıdan geçiren, yıkayan, kuruyan ve ekstrüderden granül olarak çıkaran hat. Girişte balya, çıkışta torbalanmış granül.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-1">Teknik</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Boyut küçültme → yıkama → susuzlaştırma → kurutma → ekstrüzyon-granülasyon. Her adımda fiziksel ve termal parametreler kontrol altında. Çıktı: MFI, nem, renk, kontaminasyon speke göre.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-1">Uluslararası</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Mechanical recycling — kimyasal yapıyı bozmadan fiziksel dönüşüm. AB PPWR ve GRS kapsamında PCR içerik üretiminin birincil yolu. Çıktı: rPET, rHDPE, rPP.</p>
        </div>
      </div>
    </section>

    {/* Proses akışı */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Akış Şeması</h4>
      <ProcessDiagram steps={[
        {
          label: 'Besleme & Ön Eleme', type: 'default',
          sub: 'Balya açılır veya dökme atık konveyöre verilir. Manyetik bant demir safsızlıkları çeker; eddy current alüminyumu ayırır. Elek ile iri yabancı maddeler (taş, cam) ayrılır.',
          machines: ['Balya açıcı', 'Bant konveyör', 'Overband mıknatıs', 'Eddy current sep.'],
        },
        {
          label: 'Kırma & Öğütme', type: 'default',
          sub: 'İri parçalar shredder\'da 30–80 mm\'ye indirilir. Granülatör 8–20 mm\'ye çeker. Ekstrüzyon için ideal boyut 8–15 mm; iri kırma erime sorununa, çok ince toz kaybına yol açar.',
          machines: ['Shredder (çift mil)', 'Granülatör / değirmen'],
          params: ['Çıktı: 8–15 mm', 'Bıçak aşınması → özgül enerji ↑'],
        },
        {
          label: 'Yıkama', type: 'separation',
          sub: 'Float-sink tankında yoğunluk farkıyla PE/PP yüzer, PET/PVC batar. Friksiyonlu yıkayıcı mekanik sürtünmeyle yüzey kirliliğini söker. Kaustik seçeneği: %1–3 NaOH, 80–90 °C.',
          machines: ['Float-sink tankı', 'Friksiyonlu yıkayıcı'],
          params: ['PVC → batar, ayrılır', 'Sıcak su 60–80 °C'],
        },
        {
          label: 'Kurutma', type: 'thermal',
          sub: 'Santrifüj kurutucu mekanik suyu uzaklaştırır (nem ~%2–5). Silo veya bant kurutucu ısıl kurutmayla ≤%0,1\'e indirir. PET\'te kristalizasyon silosu: 160–180 °C ön kristalizasyon zorunlu.',
          machines: ['Santrifüj kurutucu', 'Silo / bant kurutucu', 'Kristalizasyon silosu (PET)'],
          params: ['Nem: ≤ %0,1', 'PET: ≤ %0,02'],
        },
        {
          label: 'Ekstrüzyon', type: 'chemical', highlight: true,
          sub: 'Kuru malzeme ekstrüderde erir. Screen changer eriyik içi yabancı maddeleri ve karbonlaşmış partikülleri tutar. Filtre tıkandığında eriyik basıncı artar, motor zorlanır — izle!',
          machines: ['Tek vida ekstrüder (PE/PP/PS)', 'Çift vida ekstrüder (katkılı)', 'Screen changer (filtre paketi)'],
          params: ['Filtre: 100–500 µm', 'Basınç göstergesi izlenmeli'],
        },
        {
          label: 'Granülasyon', type: 'chemical', highlight: true,
          sub: 'Eriyik soğutularak kesilir ve pelet oluşturulur. Su altı granülatör yuvarlak, düzgün pelet üretir; strand granülatör daha basit ve düşük kapasite için uygundur.',
          machines: ['Su altı granülatör', 'Strand granülatör'],
          params: ['Pelet çap: 3–5 mm'],
        },
        {
          label: 'Kalite Kontrol & Lot Yönetimi', type: 'quality',
          sub: 'Her partiden MFI numunesi alınır. Nem, renk (CIE Lab) ve kirlilik kontrol edilir. Lot etiketlenir; farklı MFI\'lı partiler aynı siloya düşmemeli — müşteride tutarsızlık şikayeti.',
          machines: ['MFI test cihazı', 'Nem ölçer', 'Renk ölçer'],
          params: ['MFI ±%10 tolerans', 'Kirlilik ≤ 200 ppm', 'Lot ayrımı zorunlu'],
        },
      ]} />
    </section>

    {/* İşlenen atık tipleri */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">İşlenen Atık Tipleri</h4>
      <DataTable
        headers={['Atık Tipi', 'Sektörel Adı', 'Min. Kalite Kriteri', 'Uyarı']}
        rows={[
          ['PET şişe balya',  'PET şişe / pet balya',     'Renk ayrımı, etiket ≤ %5',     'Kapak ve halka MFI\'yı bozar'],
          ['HDPE bidon / kasa', 'HDPE katı',               'Metal konaminasyon yok',         'Boyalı HDPE ayrı tutulmalı'],
          ['PP kap / big bag',  'PP karışık',              'MFI homojenliği kritik',         'BOPP folyo karışmamalı'],
          ['PS ambalaj',        'PS köpük / PS rijit',     'Köpük ile rijit ayrı işlenir',  'EPS compacting gerektirir'],
          ['LDPE folyo',        'Folyo / film',            'Rijit makinada işlenmez',        'Bkz. Hat 2'],
        ]}
      />
    </section>

    {/* Makinalar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kullanılan Başlıca Makinalar</h4>
      <DataTable
        headers={['Makina', 'Teknik Adı (İng.)', 'Görev']}
        rows={[
          ['Balya açıcı',            'Bale opener',             'Sıkıştırılmış balyayı dağıtır'],
          ['Manyetik seperatör',     'Overband magnet',         'Demir parçacık uzaklaştırma'],
          ['Eddy current sep.',      'Eddy current separator',  'Alüminyum ve demir dışı metal'],
          ['Shredder',               'Twin-shaft shredder',     'İri kırma (30–80 mm çıktı)'],
          ['Granülatör',             'Granulator / grinder',    'Orta-ince kırma (8–20 mm)'],
          ['Float-sink tankı',       'Sink-float tank',         'Yoğunluk farkıyla ayırma'],
          ['Friksiyonlu yıkayıcı',   'Friction washer',         'Yüzey kirliliği temizleme'],
          ['Santrifüj kurutucu',     'Centrifugal dryer',       'Mekanik su uzaklaştırma'],
          ['Silo kurutucu',          'Hopper dryer',            'Isıl kurutma'],
          ['Kristalizasyon silosu',  'Crystallizer (PET)',      'PET ön kristalizasyon (160–180 °C)'],
          ['Tek vida ekstrüder',     'Single screw extruder',   'PE, PP, PS için basit granülasyon'],
          [<span className="text-orange-600 font-semibold">Çift vida ekstrüder</span>, 'Twin screw extruder', 'Katkı madde, renklendirme, dolgu'],
          ['Screen changer',         'Melt filter',             'Eriyik içi yabancı madde tutma'],
          ['Su altı granülatör',     'Underwater pelletizer',   'Yuvarlak pelet — yüksek kapasite'],
        ]}
      />
    </section>

    {/* Kritik parametreler */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kritik Parametreler</h4>
      <DataTable
        headers={['Parametre', 'Sektörel Adı', 'Birim', 'Hedef Aralık']}
        rows={[
          ['MFI',          'Akışkanlık / eriyik indeksi', 'g/10 dk',   'Reçineye özgü, ±%10 tolerans'],
          ['Nem',          'Rutubet',                     '%',          '≤ %0,1 (PET: ≤ %0,02)'],
          ['Kül içeriği',  'Yanmayan kalıntı',            '%',          '≤ %0,5'],
          ['Kontaminasyon','Kirlilik / yabancı madde',    'ppm',        '≤ 200 ppm (gıda: ≤ 50 ppm)'],
          ['Pelet boyutu', 'Granül çapı',                 'mm',         '3–5 mm standart'],
          ['Özgül enerji', 'kWh/ton',                     'kWh/t',      'İzlenir; bıçak aşınınca artar'],
        ]}
      />
    </section>

    {/* Sık hatalar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Sık Yapılan Hatalar</h4>
      <div className="space-y-2">
        <Note type="warn">
          <strong>Nem kontrolü atlanıyor:</strong> Ekstrüdere nemli giren malzeme ürün içinde gözenek ve köpük oluşturur. PET\'te hidroliz riski — MFI anormal yükselir.
        </Note>
        <Note type="warn">
          <strong>Screen changer zamanlaması ihmal ediliyor:</strong> Filtre tıkandığında eriyik basıncı artar, motor zorlanır, çıktı kalitesi düşer. Basınç göstergesi sürekli izlenmeli.
        </Note>
        <Note type="warn">
          <strong>Float-sink bakımı gözardı:</strong> PVC karışımı PET granülünü bozar (klorür korozyonu). Yoğunluk tankı düzgün çalışmıyorsa kirlilik oranı patlar.
        </Note>
        <Note type="info">
          <strong>Optimum kırma boyutu:</strong> 8–15 mm ekstrüzyon için ideal. İri kırma erime sorununa, çok ince kırma enerji israfına ve toz kaybına yol açar.
        </Note>
      </div>
    </section>
  </div>
);

const Hat2Content: React.FC = () => (
  <div className="space-y-6">
    {/* Tanım */}
    <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
          <span className="text-[11px] font-black text-blue-600">2</span>
        </div>
        <span className="text-[13px] font-bold text-gray-800 dark:text-white">Yıkama Hattı</span>
        <Tag color="blue">pul hattı · flake washing</Tag>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">Sektörel</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Balya halindeki PET şişe, HDPE bidon ve folyoyu kırıp yıkayarak pul (flake) hâline getiren hat. Çıktı granül değil, pultur. En kritik adım sıcak kaustik yıkamadır.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">Teknik</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Mekanik ön kırma → float-sink → sıcak alkali yıkama (80–90 °C, %1–3 NaOH) → nötralizasyon → mekanik+ısıl kurutma. Proses suyu kapalı devre; atık su pH nötr ve KOİ uyumlu.</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">Uluslararası</div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">rPET üretiminin kalp adımı. Food-grade için SuperClean veya SSP reaktörü + EFSA/FDA challenge test zorunlu. GRS denetimlerinde proses su ve kimyasal kayıtları incelenir.</p>
        </div>
      </div>
    </section>

    {/* Alt hat tipleri */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Alt Hat Tipleri</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: 'A — PET Şişe', color: 'border-orange-200 bg-orange-50 dark:bg-orange-500/5',
            title: 'PET şişe balya → rPET flake',
            points: [
              'Sıcak kaustik zorunlu',
              'Food-grade: SuperClean / SSP',
              'Kapasite: 500–5.000 kg/sa',
              'Renk ayrımı (şeffaf ≥ %90)',
            ],
          },
          {
            label: 'B — HDPE / PP Katı', color: 'border-blue-200 bg-blue-50 dark:bg-blue-500/5',
            title: 'Bidon, kasa, büyük hacimli',
            points: [
              'Güçlü shredder gerekir',
              'Kaustik %2–4\'e çıkabilir',
              'Renk miks kabul',
              'Yağ / çamur profili ağır',
            ],
          },
          {
            label: 'C — Folyo / Film', color: 'border-green-200 bg-green-50 dark:bg-green-500/5',
            title: 'LDPE, LLDPE, PP film / big bag',
            points: [
              'Wet granülatör / friksiyonlu ıslak',
              'Float-sink yeterli değil',
              'Kurutma zor; çıktı nem yüksek',
              'Compactor / agglomerat sık',
            ],
          },
        ].map(h => (
          <div key={h.label} className={`rounded-xl border p-4 ${h.color}`}>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{h.label}</div>
            <div className="text-[12.5px] font-bold text-gray-800 dark:text-white mb-2">{h.title}</div>
            <ul className="space-y-1">
              {h.points.map(p => (
                <li key={p} className="text-[12px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-1 flex-shrink-0">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    {/* Proses akışı */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Akış Şeması</h4>
      <ProcessDiagram steps={[
        {
          label: 'Besleme & Ön Eleme', type: 'default',
          sub: 'Balya forklift/konveyörle açılır. Trommel elek iri yabancı maddeleri ayırır. Balistik seperatör film–rijit ön ayrımı yapar. Manyetik ile demir uzaklaştırılır.',
          machines: ['Balya açıcı', 'Trommel elek', 'Balistik sep.', 'Manyetik sep.'],
        },
        {
          label: 'Ön Kırma', type: 'default',
          sub: 'Wet granülatör suyla birlikte kırma yapar — ısı sorunu azalır, toz oluşmaz. PET şişe için özel bıçak geometrisi kullanılır.',
          machines: ['Wet granülatör'],
          params: ['Flake boyutu: 10–25 mm'],
        },
        {
          label: 'Ön Yıkama (Soğuk Çalkantı)', type: 'default',
          sub: 'Çalkantı tankında kaba kir, kum ve taş tutulur. Tank altındaki kum-taş bölmesi düzenli temizlenmeli; tıkanırsa kaustik banyosu hızla kirlenir.',
          machines: ['Çalkantı tankı', 'Skrew yıkayıcı'],
        },
        {
          label: 'Float-sink (Yoğunluk Ayrımı)', type: 'separation',
          sub: 'PE/PP yüzer (<1 g/cm³), PET/PVC batar (>1 g/cm³). PVC kontaminasyonu bu adımda engellenmezse ürün bozulur. Gerekirse NaCl ile su yoğunluğu ayarlanır.',
          machines: ['Float-sink tankı'],
          params: ['PVC: batar → ayrılır', 'Tuz ile yoğunluk ayarı mümkün'],
        },
        {
          label: 'Sıcak Kaustik Yıkama', type: 'chemical', highlight: true,
          sub: 'Hattın kalbi. Etiket, yapıştırıcı, yağ ve organik kirlilik bu adımda sökülen. 90 °C\'yi aşarsa PET flake yumuşar (sticking riski). Friksiyonlu yıkayıcı mekanik sürtünme ekler.',
          machines: ['Kaustik yıkama tankı', 'Yüksek hızlı friksiyonlu yıkayıcı'],
          params: ['%1–3 NaOH', '80–90 °C', 'Temas: 10–20 dk'],
        },
        {
          label: 'Durulama & Nötralizasyon', type: 'quality',
          sub: 'Çok aşamalı durulama (2–3 halka). Kaustik kalıntısı kalırsa müşteri işleme sırasında MFI kayması. pH inline ölçüm ile otomasyona bağlanabilir.',
          machines: ['Durulama halkası (2–3 aşama)'],
          params: ['pH çıkış: 6,5–8,0'],
        },
        {
          label: 'Mekanik & Isıl Kurutma', type: 'thermal',
          sub: 'Santrifüj mekanik suyu uzaklaştırır. Hava bıçağı yüzey suyunu üfler. Bant fırın ısıl kurumayı tamamlar. Film hattında compactor devreye girer.',
          machines: ['Santrifüj kurutucu', 'Hava bıçağı', 'Bant fırın / ısıl silo', 'Compactor (film hattı)'],
          params: ['Nem: ≤ %1', 'PET food-grade: ≤ %0,02'],
        },
      ]} />
    </section>

    {/* İşlenen atık tipleri */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">İşlenen Atık Tipleri</h4>
      <DataTable
        headers={['Atık Tipi', 'Sektörel Adı', 'Min. Kalite Kriteri', 'Dikkat']}
        rows={[
          ['PET şişe balya',      'PET şişe / şeffaf balya',    'Şeffaf ≥ %90 tercih',          'Kapak + halka ≤ %5'],
          ['PET miks renkli',     'Renkli PET balya',           'Siyah PET sorunlu',            'NIR ile ayırt edilemez'],
          ['HDPE bidon / kasa',   'HDPE katı karışık',          'Metal yok, aşırı boya kabul',  'Yoğunluk heterojenliği'],
          ['LDPE folyo balya',    'LDPE film balya',            'Kuru ağırlık tartımı',         'Folyo hattı gerektirir'],
          ['PP big bag',          'PP çuval / big bag',         'Dikişleri PP, yabancı ip yok', 'PE-PP float-sink\'te ayrılır'],
        ]}
      />
    </section>

    {/* Makinalar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kullanılan Başlıca Makinalar</h4>
      <DataTable
        headers={['Makina', 'Teknik Adı (İng.)', 'Görev']}
        rows={[
          ['Balya açıcı',          'Bale opener',            'Sıkıştırılmış balyayı dağıtır'],
          ['Trommel elek',         'Trommel screen',         'Döner tambur boyut eleme'],
          ['Balistik seperatör',   'Ballistic separator',    'Film–rijit ön ayırma'],
          ['Manyetik seperatör',   'Overband magnet',        'Demir metal ayrımı'],
          ['Wet granülatör',       'Wet granulator',         'Suyla birlikte ön kırma'],
          ['Skrew yıkayıcı',       'Screw washer',           'Kaba kir ve kum sökme'],
          ['Float-sink tankı',     'Sink-float tank',        'Yoğunluk bazlı reçine ayrımı'],
          [<span className="text-orange-600 font-semibold">Kaustik yıkama tankı</span>, 'Hot caustic wash tank', 'Etiket, yapıştırıcı, yağ giderimi'],
          ['Yüksek hızlı yıkayıcı','High-speed washer',     'Mekanik sürtünme + kaustik'],
          ['Durulama halkası',     'Rinsing stage',          'Kaustik kalıntısı temizleme'],
          ['Santrifüj kurutucu',   'Centrifugal dryer',      'Mekanik nem uzaklaştırma'],
          ['Hava bıçağı',          'Air knife',              'Yüzey suyu üfleme'],
          ['Bant fırın',           'Belt dryer',             'Isıl son kurutma'],
          ['Compactor',            'Agglomerator',           'Film pul yoğunlaştırma'],
          ['SSP reaktörü',         'Solid State Polycondensation', 'Food-grade PET IV artırımı'],
        ]}
      />
    </section>

    {/* Kritik parametreler */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Kritik Parametreler</h4>
      <DataTable
        headers={['Parametre', 'Sektörel Adı', 'Birim', 'Hedef Aralık']}
        rows={[
          ['Kaustik konsantrasyonu', 'Kostik oran',      '% NaOH',   '%1–3'],
          ['Kaustik sıcaklığı',     'Yıkama sıcaklığı', '°C',        '80–90 (90+ → PET sticking riski)'],
          ['Bekleme süresi',         'Temas süresi',    'dk',         '10–20'],
          ['Durulama pH',            'pH çıkış',        '—',          '6,5–8,0'],
          ['Nem (pul çıkış)',        'Rutubet',         '%',          '≤ %1 (PET food: ≤ %0,02)'],
          ['Kontaminasyon',          'Kirlilik',        'ppm',        '≤ 200 (food-grade: ≤ 50)'],
          ['Flake boyutu',           'Pul granülometri','mm',          '8–12'],
          [<Tag color="red">PVC içeriği</Tag>, 'PVC kirliliği', 'ppm', '≤ 10 (food-grade PET)'],
          ['Proses suyu KOİ',       '—',               'mg/L',       'Mevzuata göre deşarj sınırı'],
        ]}
      />
    </section>

    {/* Sık hatalar */}
    <section>
      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Sık Yapılan Hatalar</h4>
      <div className="space-y-2">
        <Note type="warn">
          <strong>Kaustik sıcaklığı düşük tutulmuş:</strong> 70 °C\'de etiket ve yapıştırıcı tam sökülmez. Hot-melt yapıştırıcılar yüksek sıcaklık ister.
        </Note>
        <Note type="warn">
          <strong>Durulama yetersiz:</strong> Kaustik kalıntısı flake üzerinde kalınca müşteri işleme sırasında MFI kayması yaşar. pH ölçümü atlanmamalı.
        </Note>
        <Note type="warn">
          <strong>Float-sink tank bakımı ihmal edilmiş:</strong> Tank altında çökelti birikmesi yoğunluk ayrımını bozar. Haftalık dip temizliği şart.
        </Note>
        <Note type="warn">
          <strong>PVC kontaminasyonu fark edilmiyor:</strong> {'<'}%0,1 PVC bile food-grade PET flake\'i reddettirmeye yeter. XRF veya NIR spot kontrol önerilir.
        </Note>
        <Note type="info">
          <strong>Su döngüsü:</strong> Proses suyu yenilenmeden kullanılırsa KOİ yükü artar, yıkama verimliliği düşer, ürün kokusu şikayeti gelir. Kapalı döngü ve düzenli yenileme şart.
        </Note>
      </div>
    </section>
  </div>
);

const PageMakine: React.FC = () => (
  <div className="space-y-8">
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Cpu size={16} className="text-orange-500" /> Granül Tesisi — Hat Sırası (Kömürcüler)
      </h3>
      <Flow steps={[
        { label: 'Kırma' },
        { label: 'Dikey Çırpma' },
        { label: 'Turbo Kurutma' },
        { label: 'Yatay Sıkma' },
        { label: 'Agromel + Fan' },
        { label: 'Granülatör', highlight: true },
      ]} />
    </section>

    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">Makine Parametreleri</h3>
      <DataTable
        headers={['Makine', 'Güç (kW)', 'Kapasite (ton/sa)', 'Not']}
        rows={[
          ['Kırma',          '45',  '2,0', ''],
          ['Dikey çırpma',   '15',  '0,6', 'Başlangıçta 0,3 yazılmıştı → düzeltildi'],
          ['Turbo kurutma',  '55',  '2,0', ''],
          ['Yatay sıkma',    '45',  '2,0', '55 kVA = 45 kW aktif güç'],
          ['Agromel + Fan',  '60',  '2,0', '45 + 15 kW'],
          [<span className="font-semibold text-orange-600">Granülatör</span>, '150', '0,3', <Tag color="orange">DARBOĞAZ — +4 sa/gün fazla mesai</Tag>],
        ]}
      />
    </section>

    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">Enerji Hesabı</h3>
      <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Talep Faktörü (DF)</div>
          <div className="text-gray-600 dark:text-gray-400">Varsayılan: <strong>0,60</strong></div>
          <div className="text-gray-400 text-[11px] mt-1">İlk elektrik faturasıyla kalibre edilecek</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Enerji Fiyatı</div>
          <div className="text-gray-600 dark:text-gray-400"><strong>5 ₺/kWh</strong></div>
          <div className="text-gray-400 text-[11px] mt-1">Varsayılan — güncellenebilir</div>
        </div>
      </div>
      <Note type="info">
        Enerji formülü: <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-[11px]">Σ [ kW × (geçen_ton / kapasite) × DF × birim_fiyat ]</code>
        — Granülatör için net 1. kalite ton; diğerleri için giriş tonu kullanılır.
      </Note>
    </section>
  </div>
);

const PageEkonomi: React.FC = () => (
  <div className="space-y-8">
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Zap size={16} className="text-orange-500" /> 110 Ton Senaryosu — Referans Sayılar
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Giriş / Çıktı</div>
          <DataTable
            headers={['Kalem', 'Değer']}
            rows={[
              ['Giriş',              '110 ton/ay'],
              ['1. kalite granül',   '93,5 ton/ay'],
              ['2. kalite ürün',     '8,25 ton/ay'],
              ['Gerçek atık',        '8,25 ton/ay'],
              ['Çuval (1. kalite)',  '63 adet/ay (1,5 ton/adet)'],
            ]}
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Birim Fiyatlar</div>
          <DataTable
            headers={['Kalem', 'Fiyat']}
            rows={[
              ['Hammadde alış',          '19 ₺/kg'],
              ['1. kalite granül satış',  '40 ₺/kg'],
              ['2. kalite ürün satış',    '30 ₺/kg'],
              ['Çuval',                  '350 ₺/adet'],
              ['Atık su',                '800 ₺/giriş tonu'],
            ]}
          />
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">İşçilik</h3>
      <DataTable
        headers={['Pozisyon', 'Kişi', 'Maaş (brüt)', 'Not']}
        rows={[
          ['Ayrıştırma işçisi', 'ceil(giriş / 20,8)', '50.000 ₺', 'Değişken — giriş tonuna göre'],
          ['Granül ustası',     '1',                   '82.000 ₺', 'Sabit, tüm senaryolarda'],
        ]}
      />
      <div className="text-[11px] text-gray-400 mt-1">İşçi kapasitesi: 80 kg/sa × 10,5 sa/gün × 26 gün ≈ 21,8 ton/işçi/ay</div>
    </section>

    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Package size={16} className="text-orange-500" /> Sabit Giderler — Gider Merkezi (Kömürcüler)
      </h3>
      <DataTable
        headers={['Kalem', 'Aylık (₺)', 'M-Kodu']}
        rows={[
          ['Kira',                '65.000',  'M420'],
          ['Forklift kirası',     '30.000',  'M605'],
          ['Bakım-onarım',        '30.000',  'M509'],
          ['Muhasebe',            '20.000',  'M605'],
          ['Çevre mühendisliği',  '18.000',  'M529'],
          ['İnternet ve diğer',   '5.000',   'M999'],
          ['Elektrik mühendisi',  '1.500',   'M605'],
          [<span className="font-bold">TOPLAM</span>, <span className="font-bold">169.500 ₺</span>, ''],
        ]}
      />
    </section>

    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">Senaryo Kârlılık Özeti</h3>
      <DataTable
        headers={['Senaryo', 'Giriş', 'Kâr Durumu']}
        rows={[
          ['30 ton',  '30 t',  <Tag color="red">Zarar</Tag>],
          ['50 ton',  '50 t',  <Tag color="red">Zarar</Tag>],
          ['70 ton',  '70 t',  <Tag color="amber">~Başabaş</Tag>],
          ['90 ton',  '90 t',  <Tag color="green">Kârlı</Tag>],
          ['110 ton', '110 t', <Tag color="green">En yüksek kâr</Tag>],
        ]}
      />
      <div className="text-[11px] text-gray-400 mt-1">Başabaş noktası ≈ 57 ton/ay</div>
      <Note type="warn">
        Bu sayılar: amortisman dahil değil · vergi öncesi · finansman maliyeti yok · fazla mesai ücreti ek hesaplanmadı.
      </Note>
    </section>
  </div>
);

// ─── Sözlük sayfası ───────────────────────────────────────────────────────────

const PageSozluk: React.FC<{ initialQuery?: string }> = ({ initialQuery = '' }) => {
  const [q, setQ] = useState(initialQuery);
  const [catFilter, setCatFilter] = useState('Tümü');

  const categories = useMemo(() => {
    const cats = ['Tümü', ...Array.from(new Set(WIKI_TERMS.map(t => t.category))).sort()];
    return cats;
  }, []);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return WIKI_TERMS
      .filter(t =>
        (catFilter === 'Tümü' || t.category === catFilter) &&
        (!lq || t.term.toLowerCase().includes(lq) || t.definition.toLowerCase().includes(lq) || (t.tags ?? []).some(tag => tag.includes(lq)))
      )
      .sort((a, b) => a.term.localeCompare(b.term, 'tr'));
  }, [q, catFilter]);

  // A-Z grupla
  const grouped = useMemo(() => {
    const map = new Map<string, WikiTerm[]>();
    for (const t of filtered) {
      const letter = t.term[0].toLocaleUpperCase('tr');
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'tr'));
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <Hash size={16} className="text-orange-500" /> Terimler Sözlüğü
        </h3>
        <p className="text-[12px] text-gray-500">{WIKI_TERMS.length} terim · Alfabetik sıralı</p>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Terim veya açıklama ara..."
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-white outline-none focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={cx(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border',
                catFilter === cat
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-orange-300',
              )}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuç */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <Search size={24} className="mx-auto mb-2 opacity-30" />
          <div className="text-[13px]">Bu aramaya uygun terim bulunamadı.</div>
        </div>
      ) : (
        grouped.map(([letter, terms]) => (
          <div key={letter}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[22px] font-black text-orange-500 w-8">{letter}</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/8" />
            </div>
            <div className="space-y-2 pl-2">
              {terms.map(t => (
                <div key={t.term} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-white/8 px-4 py-3">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white flex-1">{t.term}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 flex-shrink-0">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{t.definition}</p>
                  {(t.tags ?? []).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {t.tags!.map(tag => (
                        <button key={tag} onClick={() => setQ(tag)}
                          className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-0.5">
                          <TagIcon size={9} />#{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Genel Bakış',      icon: <BookOpen size={15} /> },
  { id: 'proses',   label: 'Prosesler',        icon: <Recycle size={15} /> },
  { id: 'hatlar',   label: 'Üretim Hatları',   icon: <Factory size={15} /> },
  { id: 'makine',   label: 'Makine & Hat',     icon: <Cpu size={15} /> },
  { id: 'ekonomi',  label: 'Ekonomi',          icon: <Zap size={15} /> },
  { id: 'sozluk',   label: 'Terimler',         icon: <Hash size={15} />, count: WIKI_TERMS.length },
];

export function SektorNot() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Global arama → sözlük sayfasına yönlendir
  const handleGlobalSearch = (v: string) => {
    setGlobalSearch(v);
    if (v.length > 1) setActivePage('sozluk');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return <PageOverview />;
      case 'proses':   return <PageProses />;
      case 'hatlar':   return <PageHatlar />;
      case 'makine':   return <PageMakine />;
      case 'ekonomi':  return <PageEkonomi />;
      case 'sozluk':   return <PageSozluk initialQuery={globalSearch} />;
      default:         return <PageOverview />;
    }
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activePage);

  return (
    <div className="h-full flex overflow-hidden bg-[var(--enba-bg)]">

      {/* ── Sol navigasyon ── */}
      <aside className={cx(
        'flex-none flex flex-col border-r transition-all duration-200 bg-[var(--enba-panel)] border-[var(--enba-line)]',
        sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden',
      )}>
        {/* Logo */}
        <div className="flex-none h-[60px] flex items-center px-4 gap-2 border-b border-[var(--enba-line)]">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <BookOpen size={14} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold text-[var(--enba-text)] truncate">Geri Dönüşüm Wiki</div>
            <div className="text-[10px] text-[var(--enba-dim)]">Plastik · Granül</div>
          </div>
        </div>

        {/* Arama */}
        <div className="px-3 py-3 border-b border-[var(--enba-line)]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--enba-dim)]" />
            <input
              value={globalSearch}
              onChange={e => handleGlobalSearch(e.target.value)}
              placeholder="Ara..."
              className="w-full pl-7 pr-2 py-1.5 text-[12px] rounded-lg border border-[var(--enba-line)] bg-[var(--enba-panel-2)] text-[var(--enba-text)] outline-none focus:border-orange-400/50"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActivePage(item.id); setGlobalSearch(''); }}
              className={cx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all',
                activePage === item.id
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'text-[var(--enba-muted)] hover:bg-[var(--enba-panel-2)] hover:text-[var(--enba-text)]',
              )}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count != null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--enba-panel-2)] text-[var(--enba-dim)] font-semibold">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--enba-line)]">
          <div className="text-[10px] text-[var(--enba-dim)]">Son güncelleme: 2026-05-25</div>
        </div>
      </aside>

      {/* ── Ana içerik ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none h-[60px] flex items-center px-5 gap-3 border-b border-[var(--enba-line)] bg-[var(--enba-panel)]">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 rounded-lg text-[var(--enba-muted)] hover:text-[var(--enba-text)] hover:bg-[var(--enba-panel-2)] inline-flex items-center justify-center flex-shrink-0 transition-all">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
          <div className="flex items-center gap-2 text-[12px] text-[var(--enba-dim)] min-w-0">
            <span>Wiki</span>
            <ChevronRight size={12} />
            <span className="text-[var(--enba-text)] font-semibold truncate">{activeNav?.label}</span>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[860px] mx-auto p-6">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
