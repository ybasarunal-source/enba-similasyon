import React, { useState, useMemo } from 'react';
import {
  BookOpen, Recycle, Zap, Layers, ArrowRight, AlertTriangle,
  ChevronDown, ChevronRight, FlaskConical, Cpu, Package,
  Search, Tag as TagIcon, Hash, ChevronLeft, Factory, ArrowDown,
  Truck, Droplet, Wrench, Eye, ShieldCheck, BarChart2
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

type PageId = 'overview' | 'proses' | 'hatlar' | 'standartlar' | 'malzemeler' | 'makine' | 'ekonomi' | 'sozluk';


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
        { label: 'Üretim Hattı', count: '5', color: 'bg-orange-50 border-orange-200 text-orange-700' },
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
      {/* Hat 1 */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-orange-600">1</span>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Mekanik Geri Dönüşüm</span>
          <span className="text-[10px] text-gray-400 ml-auto">kırma · granülasyon</span>
        </div>
        <Flow steps={[
          { label: 'Besleme' }, { label: 'Kırma' }, { label: 'Yıkama' },
          { label: 'Kurutma' }, { label: 'Ekstrüzyon', highlight: true }, { label: 'Granül', highlight: true },
        ]} />
      </div>
      {/* Hat 2 */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-blue-600">2</span>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Yıkama Hattı</span>
          <span className="text-[10px] text-gray-400 ml-auto">flake · pul</span>
        </div>
        <Flow steps={[
          { label: 'Besleme' }, { label: 'Ön Kırma' }, { label: 'Float-sink' },
          { label: 'Kaustik', highlight: true }, { label: 'Durulama' }, { label: 'Flake', highlight: true },
        ]} />
      </div>
      {/* Hat 3 */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-purple-600">3</span>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Atık Ayrıştırma</span>
          <span className="text-[10px] text-gray-400 ml-auto">NIR · separasyon</span>
        </div>
        <Flow steps={[
          { label: 'Besleme' }, { label: 'Balistik' }, { label: 'Metal Ayrımı' },
          { label: 'NIR', highlight: true }, { label: 'Renk Sıralayıcı' }, { label: 'Fraksiyon', highlight: true },
        ]} />
      </div>
      {/* Hat 4 */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-red-600">4</span>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Kimyasal Geri Dönüşüm</span>
          <span className="text-[10px] text-gray-400 ml-auto">piroliz · depolimerizasyon</span>
        </div>
        <Flow steps={[
          { label: 'Ön Hazırlık' }, { label: 'PVC Ayrımı' }, { label: 'Reaktör', highlight: true },
          { label: 'Kondansasyon' }, { label: 'Pyoil', highlight: true }, { label: 'Char' },
        ]} />
      </div>
      {/* Hat 5 — tam genişlik */}
      <div className="md:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-green-600">5</span>
          </div>
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Balyalama, Çuvallama & Sevkiyat</span>
          <span className="text-[10px] text-gray-400 ml-auto">paketleme · lojistik</span>
        </div>
        <Flow steps={[
          { label: 'Akış Ayrımı' },
          { label: 'Balyalama Presi', highlight: true }, { label: '/ Çuvallama', highlight: true },
          { label: 'Tartım' }, { label: 'Etiketleme' }, { label: 'Depolama' }, { label: 'Sevkiyat', highlight: true },
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

// ─── Standartlar ve Sektörel Sayfası ───────────────────────────────────────────

const PageStandartlar: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'en643' | 'grs' | 'kirleticiler' | 'enerji' | 'kimyasal' | 'lojistik' | 'epr' | 'bakim' | 'optik' | 'laboratuvar' | 'lisans' | 'ai_sorting' | 'scada' | 'cbam' | 'ayirma_teknolojileri' | 'basit_tanimlama'
  >('en643');

  const subTabs = [
    { id: 'en643', label: 'EN 643 Kağıt', icon: <Layers size={13} /> },
    { id: 'grs', label: 'GRS & Gıda Temas', icon: <FlaskConical size={13} /> },
    { id: 'kirleticiler', label: 'Kirleticiler & Kalite', icon: <AlertTriangle size={13} /> },
    { id: 'enerji', label: 'Enerji & Karbon', icon: <Zap size={13} /> },
    { id: 'kimyasal', label: 'Kimyasal Geri Dönüşüm', icon: <Recycle size={13} /> },
    { id: 'lojistik', label: 'Lojistik & Tedarik', icon: <Truck size={13} /> },
    { id: 'epr', label: 'Dairesel Ekonomi & EPR', icon: <BookOpen size={13} /> },
    { id: 'bakim', label: 'Tesis Bakım & Aşınma', icon: <Wrench size={13} /> },
    { id: 'optik', label: 'Optik Ayıklama', icon: <Eye size={13} /> },
    { id: 'laboratuvar', label: 'Laboratuvar & TDS', icon: <BarChart2 size={13} /> },
    { id: 'lisans', label: 'Yasal Mevzuat & Lisans', icon: <ShieldCheck size={13} /> },
    { id: 'ai_sorting', label: 'AI & Robotik Ayıklama', icon: <Cpu size={13} /> },
    { id: 'scada', label: 'Endüstri 4.0 & SCADA', icon: <BarChart2 size={13} /> },
    { id: 'cbam', label: 'Karbon Vergisi (SKDM)', icon: <ShieldCheck size={13} /> },
    { id: 'ayirma_teknolojileri', label: 'Ayırma Teknolojileri', icon: <Recycle size={13} /> },
    { id: 'basit_tanimlama', label: 'Basit Tanımlama Testleri', icon: <Search size={13} /> },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'en643':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">EN 643 Nedir?</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Avrupa standart geri kazanılmış kağıt ve karton kaliteleri listesidir. Tesis girişindeki kabul limitlerini ve ticari toleransları belirler.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">5 Standart Kağıt Grubu</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
                {[
                  { title: '1. Grup: Sıradan', desc: 'OCC (Koli), mixed kağıt ve dergi kaliteleri.', non: '%1,5', unw: '%2,5 - %3' },
                  { title: '2. Grup: Orta', desc: 'Ofis yazıcı kağıtları ve gazete atıkları.', non: '%0,5 - %1', unw: '%1 - %2' },
                  { title: '3. Grup: Yüksek', desc: 'Baskısız beyaz yazı kağıtları ve matbaa talaşı.', non: '%0,25', unw: '%0,5 - %1' },
                  { title: '4. Grup: Kraft', desc: 'Kraft çuvallar ve kullanılmamış kutular.', non: '%0,25 - %1', unw: '%0,5 - %2,5' },
                  { title: '5. Grup: Özel', desc: 'Tetrapak, ıslak etiket ve kağıt bardaklar.', non: '%0,5 - %3', unw: '%1 - %3' },
                ].map(g => (
                  <div key={g.title} className="p-3 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/3 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white">{g.title}</div>
                      <p className="text-gray-400 mt-1 leading-normal">{g.desc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-white/5 text-[9.5px] text-gray-400">
                      <div>Kağıt Dışı: <span className="font-semibold text-orange-500">{g.non}</span></div>
                      <div>İstenmeyen: <span className="font-semibold text-gray-500">{g.unw}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Kritik Kalite Kriterleri</h4>
              <DataTable
                headers={['Kod', 'Kalite Adı', 'Açıklama', 'Max Kağıt Dışı %', 'Max İstenmeyen %']}
                rows={[
                  ['1.01.00', 'Karışık Kağıt/Karton', 'Çeşitli kağıt ve karton kalitelerinin karışımı.', '%1,50', '%3,00'],
                  ['1.04.00', 'Oluplu Mukavva (OCC)', 'Kullanılmış kutu ambalajları, min %70 oluklu mukavva.', '%1,50', '%3,00'],
                  ['2.05.01', 'Ofis Kağıtları', 'Ofislerden toplanan beyaz yazıcı kağıtları.', '%1,00', '%2,00'],
                  ['3.05.01', 'Baskısız Beyaz', 'Baskısız ve tutkalsız birinci kalite beyaz kağıt kırpıntısı.', '%0,50', '%1,00'],
                  ['4.04.00', 'Kullanılmış Kraft Torba', 'Çimento veya un içermeyen temiz kraft çuvalları.', '%1,00', '%2,00'],
                  ['5.03.00', 'Tetrapak (Sıvı Ambalaj)', 'Plastik/alüminyum katmanlı içecek kutuları.', '%3,00', '%3,00'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>Nem Toleransı:</strong> EN 643 referans nem oranı <strong>%10</strong>'dur. %12 ve üzerindeki nem oranları tonaj iskontosu veya balya reddi gerekçesidir.
            </Note>
          </div>
        );
      case 'grs':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">GRS (Global Recycled Standard)</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Üründeki geri dönüştürülmüş malzemenin kaynağını kanıtlayan ve çevresel/sosyal uyumluluğu denetleyen uluslararası standarttır.
              </p>
              <DataTable
                headers={['Kriter', 'Gereklilik', 'Enba Similasyon Rolü']}
                rows={[
                  ['Geri Dönüştürülmüş Oranı', 'Etiketleme için min %20, logo hakkı için min %50 PCR.', 'Lot çıkışlarında PCR oranını hesaplayıp etikete yazar.'],
                  ['Kütle Dengesi (Mass Balance)', 'Giren balya tonajı ile çıkan ürün arasındaki fireler izlenmelidir.', 'DetailedPlan fire ve verim motoru ile kütlesel çevrimi belgeler.'],
                  ['İzlenebilirlik (Traceability)', 'Lot numarasının hammadde tedarikçisine kadar izlenmesi zorunludur.', 'Balyalama / Sevkiyat modülünde lot kartlarına GRS TC no bağlar.'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-4">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <FlaskConical size={16} className="text-blue-500" /> Gıda Temaslı Geri Dönüşüm (EFSA & FDA)
              </h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                PET şişelerin gıda ambalajında yeniden kullanılabilmesi için en katı gıda güvenliği sınırları uygulanır:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11.5px]">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
                  <div className="font-bold text-blue-700 dark:text-blue-400">Challenge Test</div>
                  <div className="mt-1 text-gray-600 dark:text-gray-400 leading-snug">Hattın kontaminasyon sökme gücünü kanıtlayan kirlilik temizleme testidir. Denetimde raporlanmalıdır.</div>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
                  <div className="font-bold text-blue-700 dark:text-blue-400">≤ 50 ppm Sınırı</div>
                  <div className="mt-1 text-gray-600 dark:text-gray-400 leading-snug">Gıda temaslı pet pullarda (flake) veya peletlerde izin verilen maksimum toplam kontaminasyon limitidir.</div>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
                  <div className="font-bold text-blue-700 dark:text-blue-400">SSP Reaktörü & IV</div>
                  <div className="mt-1 text-gray-600 dark:text-gray-400 leading-snug">PET viskozitesini (IV) gıda kalitesine yükseltmek için vakum altında ön kristalizasyon uygulanmasıdır.</div>
                </div>
              </div>
            </section>
            <Note type="tip">
              <strong>Tesis Denetim Listesi:</strong> GRS veya Food-grade denetiminden geçebilmek için: Tedarikçi GRS TC (Transaction Certificate) kayıtları, Kaustik pH logları, Kütle Çevrim Raporları ve kalite laboratuvar test lot kartları sistemde tam tutulmalıdır.
            </Note>
          </div>
        );
      case 'kirleticiler':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Kritik Kirletici Sınırları</h4>
              <DataTable
                headers={['Kirletici Adı', 'Etkilediği Malzeme', 'Neden Zararlı?', 'Maksimum Tolerans']}
                rows={[
                  ['PVC (Polivinil Klorür)', 'PET / Polyester', '200°C\'de HCl asit salgılar, makineleri çürütür, lifleri bozar.', '< 20 - 50 ppm (Gıda için < 10 ppm)'],
                  ['Stickies (Yapışkanlar)', 'Kağıt / Karton', 'Kurutma silindirlerine yapışır, kağıdın kopmasına yol açar.', '%1.0 - %1.5 (Ağırlıkça)'],
                  ['PP / PE Karışımı', 'PE / PP (Sert Plastik)', 'Birbirleriyle karışmazlar. Mekanik darbe dayanımını düşürür.', '< %3.0 - %5.0'],
                  ['Nem (Moisture)', 'Tüm Malzemeler', 'Plastikte gaz kabarcığı ve gözenek yapar. Kağıtta tonaj hilesi.', 'Plastikte < %1.0, Kağıtta %10.0'],
                  ['Metaller ve Cam', 'Tüm Prosesler', 'Kırıcı bıçaklarını köreltir, ekstrüder vidalarını çizer.', '%0.0 (Tolerans yok)'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Giriş Kalite Kontrol Testleri</h4>
              <ul className="list-disc pl-5 text-[12.5px] text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>FTIR Spektroskopisi (Kızılötesi Analiz):</strong> Polimer türünü ve saflık derecesini saniyeler içinde belirlemek için kullanılır.</li>
                <li><strong>Yoğunluk (Yüzdürme) Testi:</strong> Malzemenin su (yoğunluk 1.0) veya alkol/tuzlu su karışımları içindeki yüzme/batma davranışına göre sınıf ayrımı yapılması.</li>
                <li><strong>Nem Tayin Cihazı (Moisture Analyzer):</strong> Balyalardan alınan numunelerin yüksek ısı altında kurutularak nem kaybının hassas tartılması.</li>
                <li><strong>Kül Testi (Ash Test):</strong> Plastiğin fırında 600°C'de yakılarak içindeki kalsit dolgu maddelerinin oranının bulunması.</li>
              </ul>
            </section>
            <Note type="warn">
              <strong>Yazılım Entegrasyonu (DetailedPlan):</strong> Giriş hammaddesindeki nem veya kalsit oranı referans değerin üzerindeyse, satın alma faturasından ağırlık iskontosu düşülür ve fire katsayısı simülasyonda otomatik artırılır.
            </Note>
          </div>
        );
      case 'enerji':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Proses Bazında Spesifik Elektrik Tüketimi (SEC)</h4>
              <DataTable
                headers={['Proses İstasyonu', 'Ortalama Elektrik (kWh/ton)', 'Kritik Tüketim Elemanları']}
                rows={[
                  ['Kırma & Yıkama', '120 - 180 kWh', 'Kırma motorları, friksiyon yıkayıcılar, santrifüj kurutucular'],
                  ['Sıkma & Aglomer', '100 - 200 kWh', 'Sıkma presi hidrolikleri, aglomer bıçak motorları (sürtünme ısısı)'],
                  ['Ekstrüzyon (Granül)', '250 - 350 kWh', 'Vida tahrik motoru, kovan rezistans ısıtıcıları, vakum pompaları'],
                  ['Koku Giderme Siloları', '80 - 120 kWh', 'Sıcak hava üfleme fanları, rezistanslı hava ısıtıcıları'],
                  ['Atıksu Arıtma', '10 - 25 kWh', 'Çamur pompaları, havalandırma blowerları, kimyasal pompaları'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Karbon Ayak İzi ve CO₂ Tasarrufu (Sınırda Karbon - CBAM)</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Geri dönüştürülmüş polimer üretimi, orijinal polimer üretimine kıyasla ciddi bir emisyon avantajı sağlar:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-center">
                <div className="p-4 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-100 dark:border-white/8">
                  <div className="text-gray-500">PET Emisyon Tasarrufu</div>
                  <div className="text-xl font-bold text-green-600 mt-1">%79 Azalma</div>
                  <div className="text-[11px] text-gray-400 mt-1">Virgin: 2.15 kg CO2 ↔ rPET: 0.45 kg CO2</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-100 dark:border-white/8">
                  <div className="text-gray-500">HDPE Emisyon Tasarrufu</div>
                  <div className="text-xl font-bold text-green-600 mt-1">%80 Tasarruf</div>
                  <div className="text-[11px] text-gray-400 mt-1">Virgin: 1.80 kg CO2 ↔ rHDPE: 0.35 kg CO2</div>
                </div>
              </div>
            </section>
            <Note type="tip">
              <strong>DetailedPlan Raporu:</strong> Bütçelenen üretim planlarına paralel olarak otomatik bir <strong>Karbon Tasarrufu ve Enerji Raporu</strong> üretilir. Tesislerin engellediği CO2 salınımı ton cinsinden hesaplanarak yeşil mutabakat uyumu belgelenir.
            </Note>
          </div>
        );
      case 'kimyasal':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Kimyasal Geri Dönüşüm Teknolojileri</h4>
              <div className="space-y-3 text-[12.5px] text-gray-600 dark:text-gray-400">
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white mb-1">A. Piroliz (Pyrolysis - Isıl Bozundurma)</h5>
                  <p className="leading-relaxed">Poliolefinlerin (PE, PP) oksijensiz ortamda (400-550°C) parçalanarak <strong>Piroliz Yağı (Tacoil)</strong> elde edilmesidir. Sıvı ürün verimi %70-75 arasındadır. Yağdaki klor (PVC kaynaklı) miktarı krakerler için <strong>&lt; 5-10 ppm</strong> olmalıdır.</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white mb-1">B. Depolimerizasyon (Solvoliz)</h5>
                  <p className="leading-relaxed">Condensation polimerlerinin (PET, Naylon) solvent ve katalizör eşliğinde monomerlerine (BHET, DMT) çözülmesi. rPET bu sayede kalitesini yitirmeden sonsuz kez geri dönüştürülebilir.</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white mb-1">C. Solvent Çözündürme (Purification)</h5>
                  <p className="leading-relaxed">Polimer zincirini bozmadan sadece solvent içinde eritip filtreleme yöntemiyle boya ve kalsitten arındırma ve geri çöktürme işlemidir.</p>
                </div>
              </div>
            </section>
            <Note type="warn">
              <strong>Yatırım Dinamikleri (CAPEX/OPEX):</strong> Kimyasal geri dönüşüm reaktörlerinin kurulum maliyeti mekanik hatlara göre 10-30 kat daha yüksektir. DetailedPlan modellerinde faiz, amortisman ömrü ve katalizör maliyetleri hassas takip edilmelidir.
            </Note>
          </div>
        );
      case 'lojistik':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Hacimsel Lojistik Çıkmazı (Dökme Yoğunluğu)</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Geri dönüşüm hammaddelerinin dökme yoğunluklarının düşük olması, nakliyeyi yüksek hacimli ama düşük tonajlı hale getirerek kar marjını tehdit eder:
              </p>
              <DataTable
                headers={['Malzeme Durumu', 'Dökme Yoğunluğu (kg/m³)', 'Tır Başına Taşıma Tonajı', 'Lojistik Verimlilik']}
                rows={[
                  ['Gevşek PET Şişe / Poşet', '20 - 35 kg/m²', '1.6 - 2.8 Ton', 'Çok Yüksek Maliyetli (Hacim sınırlı)'],
                  ['Kırılmış Çapak (Flake)', '250 - 350 kg/m²', '20 - 24 Ton', 'Normal / Optimal'],
                  ['Balyalanmış Atık', '300 - 450 kg/m²', '24 Ton (Tam Kapasite)', 'Optimal (Tır sınırında)'],
                  ['Granül (Pelet)', '550 - 650 kg/m²', '24 Ton (Tam Kapasite)', 'En Düşük Birim Nakliye'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>Tersine Lojistik ve Mesafe Limiti:</strong> Balyalanmamış (gevşek) hurda poşet veya şişeyi 100 km'den uzak mesafeden taşımak navlunu hammadde değerinin üzerine çıkarır. Gevşek alım yarıçapı maks 50-70 km ile sınırlandırılmalıdır.
            </Note>
          </div>
        );
      case 'epr':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Extended Producer Responsibility (EPR) ve GEKAP</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Yasal düzenlemeler r-Polimerlerin piyasa talebini belirleyen bir numaralı motordur:
              </p>
              <div className="space-y-3 text-[12px] text-gray-600 dark:text-gray-400">
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white">AB Regülasyonları (PPWR):</h5>
                  <p>2030 yılına kadar tüm plastik ambalajların ağırlıkça en az <strong>%30 geri dönüştürülmüş plastik (PCR)</strong> içermesi zorunludur. Bu durum, kurumsal markaların (FMCG) r-plastik talebini garantiler.</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white">Türkiye GEKAP Uygulaması:</h5>
                  <p>Piyasaya sürülen ambalajlar için tahsil edilen çevre vergisidir. Ambalajlarında belgelenmiş geri dönüştürülmüş hammadde (GRS sertifikalı) kullanan üreticiler, GEKAP yükümlülüklerinde indirim veya muafiyet kazanır.</p>
                </div>
              </div>
            </section>
            <Note type="tip">
              <strong>Depozito İade Sistemi (DİS):</strong> İçecek şişelerinin RVM (Reverse Vending Machine) otomatlarıyla toplanmasıdır. Evsel çöp bulaşmadığı için DİS şişelerini işleyen tesislerde kırma/yıkama firesi %30'dan %5'in altına iner ve doğrudan gıda kalitesi (superclean) elde edilebilir.
            </Note>
          </div>
        );
      case 'bakim':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Kritik Aşınma Ömürleri</h4>
              <DataTable
                headers={['Ekipman / Eleman', 'Aşınma Nedeni', 'Bileme / Bakım Sıklığı', 'Değişim Ömrü']}
                rows={[
                  ['Kırıcı Bıçakları (Granulator)', 'Atık içindeki kum, çakıl, metaller bıçakları köreltir.', 'Her 40 - 80 saatte (Bileme)', '300 - 500 saat (Değişim)'],
                  ['Ekstrüder Vida & Kovan', 'Yüksek kalsit (CaCO3) dolgusu ve metal parçacıkları.', 'Yılda 1 kez aşınma ölçümü', '8.000 - 15.000 saat (Bimetalik)'],
                  ['Eriyik Filtresi Elekleri', 'Erimeyen kağıt lifleri, folyo ve kirleticiler.', 'Manuel filtrede her 4-8 saatte bir.', '8 - 24 saat (Manuel elek)'],
                  ['Friksiyon Yıkayıcı Kanatları', 'Yüksek devirli sürtünme ve kum erozyonu.', 'Her 3 ayda kaynak dolgu kontrolü', '3.000 - 5.000 saat'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Bakımın Gecikme Maliyetleri</h4>
              <ul className="list-disc pl-5 text-[12.5px] text-gray-600 dark:text-gray-400 space-y-1.5">
                <li><strong>Artan Elektrik Tüketimi:</strong> Kör bıçaklar kesmek yerine ezdiği için motor amperini dolayısıyla elektrik tüketimini <strong>%15 - %30</strong> artırır.</li>
                <li><strong>Toz Çapak Firesi (Fines):</strong> Ezerek kırma sonucu toz oranı artar. Sulu yıkama esnasında bu tozlar suyla sürüklenerek <strong>%3 - %5 ek malzeme firesine</strong> yol açar.</li>
              </ul>
            </section>
            <Note type="warn">
              <strong>OEE Simülasyonu:</strong> DetailedPlan modelinde, planlı önleyici bakımlar için haftalık 4 saatlik duruş kapasiteden düşülür. Bakımın kapatılması durumunda elektrik faturası katsayısı %15 artırılır.
            </Note>
          </div>
        );
      case 'optik':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Optik Sensör Çeşitleri</h4>
              <div className="space-y-3 text-[12.5px] text-gray-600 dark:text-gray-400">
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white">NIR (Near-Infrared - Yakın Kızılötesi)</h5>
                  <p>Her polimerin kızılötesi ışığı yansıtma spektrumu farklıdır. NIR sensörler, banttan geçen atıkların kimyasal moleküler kodunu (PET, PP, HDPE, PVC vb.) milisaniyede algılar. Karbon siyahı (siyah plastikler) NIR tarafından algılanamaz.</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white">VIS (Görünür Kamera)</h5>
                  <p>RGB kameralar ile çapakların rengini tarar. Naturel (şeffaf) PET pulların arasına karışan mavi/yeşil pulları ayırmak için kullanılır.</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 dark:text-white">AI / Şekil Algılama Kameraları</h5>
                  <p>Malzemenin sadece kimyasını değil, geometrik şeklini de analiz ederek gıda tepsilerini, içecek şişelerinden ayırır.</p>
                </div>
              </div>
            </section>
            <Note type="tip">
              <strong>Basınçlı Hava OPEX Yükü:</strong> Ayıklanan malzemeler yüksek hızlı solenoid valflerle (ejektör hava jetleri) üflenir. Bu ejektörlerin hava tüketimi nedeniyle tesise 37-75 kW gücünde ek hava kompresörü gerekir, bu da ton başına <strong>+15-25 kWh</strong> elektrik gideri ekler. Saflık verimi tek geçişte %95-97 iken çift geçişte (double pass) %99.5+ seviyesine çıkar.
            </Note>
          </div>
        );
      case 'laboratuvar':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Standart Test Metotları ve ISO Standartları</h4>
              <DataTable
                headers={['Test Adı', 'ISO Standardı', 'Ölçülen Değer', 'TDS Önemi']}
                rows={[
                  ['Eriyik Akış Hızı (MFI)', 'ISO 1133', 'Gram / 10 dk (Akışkanlık)', 'Şişirme (<1.0) veya Enjeksiyon (>4) ayrımı.'],
                  ['Izod / Charpy Darbe Dayanımı', 'ISO 179 / 180', 'kJ / m² (Darbe emilimi)', 'Kırılganlığı ve darbe artırıcı elastomer oranını belirler.'],
                  ['Çekme / Eğilme Mukavemeti', 'ISO 527', 'MPa (Kopma mukavemeti)', 'Malzemenin fiziksel gerilme gücünü belgeler.'],
                  ['Yoğunluk Analizi', 'ISO 1183', 'g / cm³', 'Kalsit (CaCO3) dolgu veya polimer saflık oranını doğrular.'],
                  ['Nem Tayini', 'Kurutma / Tartım', 'Nem yüzdesi (%)', 'Ekstrüzyon öncesi nemin < %0.1 olduğunu garanti eder.'],
                ]}
              />
            </section>
            <Note type="tip">
              <strong>ISO/IEC 17025 Laboratuvar Akreditasyonu:</strong> Büyük sanayi alıcıları (Unilever, Vestel vb.) sadece akredite laboratuvarlardan çıkan TDS (Technical Data Sheet) raporlarını kabul eder. Supabase veritabanında saklanan bu lot kalite parametreleri sevkiyat belgelerine otomatik yazdırılmalıdır.
            </Note>
          </div>
        );
      case 'lisans':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">TAT, GDT Lisansları ve Kütle Denge Raporlaması</h4>
              <div className="space-y-2 text-[12.5px] text-gray-600 dark:text-gray-400">
                <p><strong>TAT (Toplama Ayrırma Tesisi) Lisansı:</strong> Atıkları kabul etme, ayıklama ve balyalama yetkisi verir. Eritme veya kimyasal işleme yapamaz.</p>
                <p><strong>GDT (Geri Kazanım Tesisi) Lisansı:</strong> Balyalanmış veya ayıklanmış plastik/kağıt atıkları mekanik veya kimyasal yöntemlerle eritmeye/işlemeye ve ham maddeye dönüştürmeye izin verir.</p>
                <p><strong>MoTAT (Mobil Atık Takip):</strong> Tehlikeli veya ambalaj atıklarının tırlarla nakliyesi sırasında GPS üzerinden yasal takibini sağlayan Çevre Bakanlığı sistemidir.</p>
                <p><strong>KDS (Kütle Denge Sistemi):</strong> Tesislerin en kritik yasal raporudur. Giren atık kodu tonajı ile çıkan ürün+bakiye+fire tonajı eşit olmalıdır.</p>
              </div>
            </section>
            <Note type="warn">
              <strong>Yazılım Uyum Otomasyonu:</strong> Enba platformu, üretim ve stok verilerini otomatik olarak Çevre Bakanlığı KDS rapor formatına (XML/Excel) dönüştürür. TAT/GDT lisans ve GFB geçici faaliyet süreleri `Licensing.tsx` modülünde 3 ay önceden uyarı verecek şekilde takip edilir.
            </Note>
          </div>
        );
      case 'ai_sorting':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">Yapay Zeka ve Robotik Ayıklama</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Yapay zeka (AI) destekli robotik kollar (Delta Picker), bilgisayarlı görü ve spektral kameralar sayesinde hammadde kırma ve yıkama hatlarının giriş kalitesini optimize eder.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Performans ve Operasyonel Karşılaştırma</h4>
              <DataTable
                headers={['Metrik', 'Manuel Ayıklama (1 İşçi)', 'AI Robotik Kol (Delta Picker)', 'Açıklama / Fark']}
                rows={[
                  ['Ayıklama Hızı', '30 - 45 adet/dk', '70 - 90 adet/dk', 'Robotik kol insan hızının en az 2 katı kapasitededir.'],
                  ['Doğruluk Oranı', '%70 - %85', '%95 - %98', 'AI sistem yorulmadan ve konsantrasyon kaybı olmadan 7/24 çalışır.'],
                  ['Çalışma Süresi', '8 saat (Mola gerekir)', '24 saat (Sadece bakım duruşu)', 'OEE kullanılabilirlik katsayısını artırır.'],
                  ['Maks. Ağırlık Limiti', 'Sınırsız (Hafif/Ağır)', '< 1.5 kg (Vantuz sınırı)', 'Büyük/Ağır bidon veya kasalar için insan gücü gerekir.'],
                ]}
              />
            </section>
            <Note type="tip">
              <strong>Yatırımın Geri Dönüşü (ROI):</strong> Tek bir AI Robotik kol yatırımı (CAPEX: ~90.000 € - 140.000 €), 3 vardiya çalışan bir tesiste ortalama <strong>3.2 FTE (Tam Zaman Eşdeğer) işçilik tasarrufu</strong> sağlar. Türkiye asgari ücret şartlarında amortisman süresi <strong>2.5 - 3.5 yıl</strong> arasındadır.
            </Note>
          </div>
        );
      case 'scada':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Endüstri 4.0 ve SCADA Entegrasyonu</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Tesis genelindeki enerji analizörleri, akış sensörleri ve titreşim ölçerler, PLC/Modbus haberleşme altyapısıyla SCADA ekranlarına bağlanır. Bu sayede OEE (Toplam Ekipman Etkinliği) anlık hesaplanır.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">SCADA Odaklı Proses Metrikleri</h4>
              <DataTable
                headers={['Metrik', 'Entegrasyon Öncesi', 'Entegrasyon Sonrası', 'Kazanım / Etki']}
                rows={[
                  ['Ortalama OEE Oranı', '%65 - %72', '%82 - %88', 'Anlık arıza müdahalesi ile performansta ~%20 artış.'],
                  ['Plansız Duruş Süresi', 'Vardiya başı 45 dk', 'Vardiya başı 12 dk', 'Kestirimci bakım rulman/bıçak aşınma uyarıları.'],
                  ['Hatalı Granül Oranı', '%2.5 - %4.0', '< %0.8', 'Ekstrüder eriyik nem ve basınç parametrelerinin stabilizasyonu.'],
                  ['Spesifik Enerji (SEC)', '420 kWh/ton', '365 kWh/ton', 'Pik güç kontrolü, motor yük optimizasyonu ve reaktif güç yönetimi.'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>Simülasyon Katsayıları:</strong> SCADA/IoT entegrasyonu aktif olan planlarda, OEE değeri otomatik olarak <strong>1.1 kat</strong> iyileştirilir ve yıllık plansız makine bakım bütçesi (yedek parça/aşınma) <strong>%15 oranında azaltılır</strong>.
            </Note>
          </div>
        );
      case 'cbam':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">AB Sınırda Karbon Düzenleme Mekanizması (SKDM - CBAM)</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Avrupa Birliği ihracatında, birincil plastik yerine geri dönüştürülmüş plastik (r-Polimer) kullanan firmalar karbon ayak izlerini %70-%90 oranında düşürür. Bu durum, AB ETS karbon vergisi kapsamında ciddi bir mali muafiyet sağlar.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Polimer Sınıflarına Göre Net CO₂e Tasarrufları</h4>
              <DataTable
                headers={['Polimer Türü', 'Orijinal Emisyon (t CO₂e/t)', 'r-Polimer Emisyonu (t CO₂e/t)', 'Net CO₂e Tasarrufu (t CO₂e/t)', 'Karbon Tasarruf Oranı']}
                rows={[
                  ['PET (Şişelik)', '2.15', '0.42', '1.73', '%80.4'],
                  ['HDPE (Sert Plastik)', '1.90', '0.35', '1.55', '%81.5'],
                  ['LDPE (Film/Poşet)', '2.05', '0.38', '1.67', '%81.4'],
                  ['PP (Polipropilen)', '2.20', '0.45', '1.75', '%79.5'],
                  ['Kağıt / OCC', '0.95', '0.28', '0.67', '%70.5'],
                ]}
              />
            </section>
            <Note type="tip">
              <strong>İhracatta Karbon Primi (Green Premium):</strong> ISCC Plus ve GRS onaylı karbon ayak izi sertifikasına sahip geri dönüşüm tesisleri, r-Polimer granüllerini standart piyasaya göre ton başına <strong>50 € - 120 € arası primle</strong> satabilirler.
            </Note>
          </div>
        );
      case 'ayirma_teknolojileri':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Plastik Ayırma Teknolojileri</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Karışık ambalaj atıklarının polimer türlerine göre ayrıştırılması, geri kazanılan hammaddelerin kalitesini doğrudan belirler. Tesislerde fiziksel, optik ve elektrostatik ayrıştırma teknolojileri entegre olarak çalışır.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Ayırma Yöntemlerinin Karşılaştırılması</h4>
              <DataTable
                headers={['Yöntem', 'Doğruluk (%)', 'Kapasite', 'Tipik Kullanım Alanı']}
                rows={[
                  ['Yüzdürme-Batırma (Float-Sink)', '%92 - %96', '1.0 - 3.0 ton/saat', 'PE/PP yüzenlerin, PET/PVC batanlardan su yoğunluğu ile ayrımı.'],
                  ['Kızılötesi (NIR) Optik Seperatör', '%96 - %99', '2.0 - 5.0 ton/saat', 'Polimerlerin spektral parmak izi ile bant üzerinden hava jetiyle ayrımı.'],
                  ['Triboelektrik (Elektrostatik)', '%90 - %95', '0.5 - 1.5 ton/saat', 'Yoğunlukları çakışan kuru PP ve PE çapaklarının statik yükle ayrımı.'],
                  ['Lazer Çapak Seperatörü (Flake)', '%98 - %99.9', '0.8 - 2.0 ton/saat', 'Kırılmış rPET içindeki milimetrik PVC ve metal partikül ayıklama.'],
                ]}
              />
            </section>
            <Note type="tip">
              <strong>Simülasyon Katsayıları (DetailedPlan):</strong> Optik ve AI ayıklama ünitelerinin kullandığı yüksek basınçlı hava kompresörleri, ton başına ek <strong>15 - 25 kWh</strong> elektrik tüketimi oluşturur. Hatalı üfleme firesi (false reject) ise varsayılan olarak <strong>%1.5 - %3.0</strong> arasında bütçelenir.
            </Note>
          </div>
        );
      case 'basit_tanimlama':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Basit Plastik Tanımlama Testleri</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Pahalı optik spektroskopi cihazlarının bulunmadığı durumlarda veya saha doğrulaması için operatörler tarafından uygulanan pratik fiziksel ve kimyasal teşhis yöntemleridir.
              </p>
            </section>
            <section className="space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Polimer Karakteristik Teşhis Matrisi</h4>
              <DataTable
                headers={['Polimer', 'Su Yüzme Testi', 'Alev Rengi & Davranışı', 'Söndükten Sonra Duman Kokusu']}
                rows={[
                  ['PET', '❌ Batar', 'Yavaş yanar, sarı/mavi alev, siyah kurum', 'Tatlı, meyvemsi koku'],
                  ['HDPE / LDPE', '✅ Yüzer', 'Eriyerek damlar, mavi alev ve sarı uç', 'Parafin / mum kokusu'],
                  ['PVC', '❌ Batar', 'Zor yanar, alevden çekince söner, sarı/yeşil alev', 'Keskin, asidik, klor kokusu'],
                  ['PP', '✅ Yüzer', 'Eriyerek damlar, parlak alev', 'Acımtırak, dizel/asfalt kokusu'],
                  ['PS', '❌ Batar', 'Hızla yanar, siyah kurum parçaları uçuşur', 'Tatlı kömür gazı / çiçek kokusu'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>İSG ve Güvenlik Uyarısı:</strong> Özellikle PVC yandığında son derece toksik olan klor gazı (HCl) ve dioksin üretir. Yakma testleri kesinlikle çeker ocak altında veya açık havada yapılmalıdır. Numuneler elle doğrudan koklanmamalı, duman el yardımıyla buruna doğru yönlendirilmelidir.
            </Note>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <FlaskConical size={16} className="text-orange-500" /> Sektörel Standartlar, Mevzuat & Alan Bilgisi
        </h3>
        <p className="text-[12px] text-gray-500">Tesis planlama ve mevzuat uyumluluğu için altın standartlar ve hesaplar.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Sol Menü (Desktop) / Dropdown (Mobil) */}
        <div className="w-full md:w-[200px] flex-shrink-0">
          <div className="md:hidden">
            <select
              value={activeSubTab}
              onChange={(e: any) => setActiveSubTab(e.target.value)}
              className="w-full p-2 text-[12.5px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-white outline-none"
            >
              {subTabs.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex flex-col gap-1 p-1 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-200/60 dark:border-white/5 max-h-[70vh] overflow-y-auto">
            {subTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id as any)}
                className={cx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] font-semibold text-left transition-all',
                  activeSubTab === t.id
                    ? 'bg-white dark:bg-[#2A2A2A] text-orange-600 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-white/5'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/2 hover:text-gray-700'
                )}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ İçerik Alanı */}
        <div className="flex-1 min-w-0 w-full">
          {renderSubContent()}
        </div>
      </div>
    </div>
  );
};

// ─── Malzemeler Sayfası ────────────────────────────────────────────────────────

const PageMalzemeler: React.FC = () => {
  const [activeMaterial, setActiveMaterial] = useState<'pet' | 'ldpe' | 'pp' | 'hdpe' | 'occ' | 'pvc' | 'ps'>('pet');

  const materials = [
    { id: 'pet', label: 'PET Çapak', icon: <Package size={13} /> },
    { id: 'ldpe', label: 'LDPE Film', icon: <Layers size={13} /> },
    { id: 'pp', label: 'PP Polipropilen', icon: <Recycle size={13} /> },
    { id: 'hdpe', label: 'HDPE & Sert Plastik', icon: <Cpu size={13} /> },
    { id: 'occ', label: 'OCC Kağıt/Karton', icon: <Factory size={13} /> },
    { id: 'pvc', label: 'PVC Kontaminasyonu', icon: <ShieldCheck size={13} /> },
    { id: 'ps', label: 'PS & EPS (Polistiren)', icon: <Layers size={13} /> },
  ];

  const renderMaterialContent = () => {
    switch (activeMaterial) {
      case 'pet':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">PET Çapak Kalite Sınıfları</h4>
              <DataTable
                headers={['Kalite Sınıfı', 'PVC Oranı (ppm)', 'Nem Oranı (%)', 'Tipik Kullanım Alanı']}
                rows={[
                  ['A Sınıfı (Premium)', '< 10 ppm', '< %0.5', 'Şişeden Şişeye (Food-Grade)'],
                  ['B Sınıfı', '< 50 ppm', '< %1.0', 'Levha (Sheet) & Ambalaj'],
                  ['C Sınıfı', '< 150 ppm', '< %2.0', 'Sentetik Elyaf / Tekstil'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Proses ve Simülasyon Katsayıları (PET)</h4>
              <ul className="list-disc pl-5 text-[12.5px] text-gray-600 dark:text-gray-400 space-y-1.5">
                <li><strong>Giriş / Ayıklama Firesi:</strong> Balyadan gelen şişe dışı atıklar (kapak, etiket, metal tel) ortalama <strong>%8 - %15</strong> fire oluşturur.</li>
                <li><strong>Yıkama Firesi:</strong> Yüzdürme tanklarında etiket ve PP kapak ayrımı sırasında <strong>%5 - %8</strong> ek fire oluşur.</li>
                <li><strong>Enerji Yoğunluğu:</strong> Kırma ve sıcak yıkama için ton başına ortalama <strong>250 - 350 kWh</strong> elektrik tüketilir.</li>
              </ul>
            </section>
            <Note type="tip">
              <strong>SSP Reaktörü ve IV Yükseltme:</strong> Gıda temas (bottle-to-bottle) kalitesine ulaşmak için viskozite (IV) 0.70'ten 0.80-0.84 dL/g seviyesine SSP reaktöründe yükseltilir. Bu ünite ton başına ek <strong>+150 kWh</strong> enerji ve azot (N2) gazı maliyeti getirir.
            </Note>
          </div>
        );
      case 'ldpe':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">LDPE Film Proses Değerleri</h4>
              <DataTable
                headers={['Parametre', 'Değer / Oran', 'Detay / Açıklama']}
                rows={[
                  ['Tüketici Sonrası (Post-Consumer) Fire', '%30 - %45', 'Belediye poşet atıklarında organik çamur, ıslaklık ve etiket yüksektir.'],
                  ['Sanayi Kaynaklı (Post-Industrial) Fire', '%3 - %8', 'Temiz fabrika şirink atıkları, minimum temizlik firesi.'],
                  ['Su Tüketimi (Yıkama)', '4.0 - 6.0 m³/ton', 'Geniş yüzey alanı nedeniyle PET\'e göre %50 daha fazla su gerektirir.'],
                  ['Spesifik Elektrik Tüketimi', '450 - 600 kWh/ton', 'Aglomer sıkıştırma ve çift aşamalı vakumlu ekstrüzyon güç tüketimi.'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Nem ve Sıkıştırma Yönetimi</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Hafif plastik filmler yıkama sonrasında suyu sünger gibi tutar (nem %15-25 kalır). Ekstrüder girişinde nemin <strong>&lt; %2</strong> seviyesine indirilmesi için <strong>Sıkma Presleri (Squeezer)</strong> veya <strong>Aglomer</strong> makineleri kullanımı zorunludur. Aksi halde granülde hava gözenekleri oluşur.
              </p>
            </section>
            <Note type="warn">
              <strong>Lazer Filtre Kullanımı:</strong> LDPE filmlerdeki erimeyen yabancı maddeleri (kağıt lifi, alüminyum) sürekli temizleyen otomatik lazer filtreler, sarf malzeme maliyetlerine (filtre disk aşınması) ton başına ek işletme gideri yansıtmalıdır.
            </Note>
          </div>
        );
      case 'pp':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Polipropilen (PP) ve Koku Sorunu</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                PP gözenekli yapısı nedeniyle organik molekülleri (gıda, deterjan, şampuan kokuları) emen bir moleküler sünger gibi davranır. Klasik yıkama bu kokuyu gideremez. Kokusuz rPP elde etmek için:
              </p>
              <ul className="list-disc pl-5 text-[12.5px] text-gray-600 dark:text-gray-400 space-y-1.5">
                <li><strong>Çift Vakumlu Degazör:</strong> Ekstrüder üzerinde yüksek vakum altında uçucu organik bileşikleri (VOC) emme.</li>
                <li><strong>Sıcak Hava ile Karıştırma (Stripping Silosu):</strong> Granüllerin 80-100°C\'de silo içinde 4-8 saat boyunca kuru sıcak havaya maruz bırakılması.</li>
                <li><strong>Kimyasal Koku Absorberler:</strong> Ekstrüzyon esnasında formüle zeolit veya koku maskeleyici katkıların enjeksiyonu.</li>
              </ul>
            </section>
            <Note type="warn">
              <strong>Koku Giderme OPEX Maliyeti:</strong> Stripping fırın ve fan motorları nedeniyle PP geri dönüşüm planlarında elektrik bütçesine ton başına ek <strong>+80 - 120 kWh</strong> maliyet yansıtılmalıdır. Ortalama proses verimi %75-80 civarıdır.
            </Note>
          </div>
        );
      case 'hdpe':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">HDPE Renk Sınıfları ve Pazar Fiyatı Etkisi</h4>
              <DataTable
                headers={['Renk Sınıfı', 'Kaynak', 'Ekonomik Değeri', 'Kullanım Alanı']}
                rows={[
                  ['Naturel (Şeffaf/Doğal)', 'Kozmetik şişeleri, damacanalar', 'En Yüksek (Renkli HDPE\'ye göre +%50 pahalı)', 'İstenen renge boyanıp şişirme üretimi.'],
                  ['Beyaz / Opak', 'Süt şişeleri, yoğurt kapları', 'Orta Derece', 'Beyaz plastik ambalajlar.'],
                  ['Renkli (Mix)', 'Deterjan bidonları, plastik kasalar', 'Düşük Derece (Siyah/Koyu Gri)', 'Altyapı boruları, çöp kovaları.'],
                ]}
              />
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">Şişirme (Blow) vs. Enjeksiyon Ayrımları</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Şişirme kalite HDPE (deterjan bidonları) eriyik mukavemeti için düşük akışkanlığa (MFI &lt; 1.0) sahiptir. Enjeksiyon kalite kasa plastikleri ise yüksek akışkanlığa (MFI &gt; 4.0) sahiptir. Bu iki sınıf birbirine karışırsa, elde edilen granülden yeni şişe şişirilemez (eriyik kopar).
              </p>
            </section>
            <Note type="warn">
              <strong>Verim ve Enerji Değerleri:</strong> HDPE geri dönüşümünde kırma/yıkama firesi ortalama %10-15 olup, spesifik elektrik tüketimi 350-450 kWh/ton\'dur. Deterjan kalıntıları nedeniyle su arıtmada antifoam (köpük önleyici) dozajı zorunludur.
            </Note>
          </div>
        );
      case 'occ':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">OCC Kağıt & Karton Hamur Hazırlama (Pulper)</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Plastiğin erime prensibinden farklı olarak kağıt, <strong>Pulper</strong> kazanlarında suyla karıştırılarak liflerine ayrıştırılır. Liflerin şişmesi ve mürekkep sökümü için soda (NaOH) dozajlanarak pH 8.5 - 9.5 aralığına getirilir. Yapışkan etiket ve koli bantlarının oluşturduğu <strong>stickies</strong> kalıntıları, kağıt makinelerinde duruşlara yol açan en büyük işletme riskidir.
              </p>
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">DetailedPlan Kağıt Üretim Değerleri</h4>
              <DataTable
                headers={['Parametre', 'Değer', 'Açıklama / Sektörel Karşılık']}
                rows={[
                  ['Toplam Malzeme Verimi', '%82 - %88', 'Plastik bantlar, zımbalar ve pulper altı lif kayıpları.'],
                  ['Taze Su Tüketimi', '3.0 - 5.0 m³/ton', 'Kapalı devre sirküle edilse de elyaf durulama suyu.'],
                  ['Spesifik Elektrik Tüketimi', '180 - 250 kWh/ton', 'Pulper rotorları ve hamur pompaları güç tüketimi.'],
                  ['Doğalgaz / Buhar Tüketimi', '1.2 - 1.8 Gcal/ton', 'Kağıt hamurunu silindirlerde kurutmak için harcanan buhar.'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>Selüloz Lif Kısalması (Degradation):</strong> Geri kazanılan selüloz lifleri maksimum <strong>5 - 7 kez</strong> geri dönüştürülebilir; her çevrimde lif boyu kısalır ve mukavemet düşer. Yüksek mukavemetli karton üretmek için DetailedPlan reçetesine belirli oranda orijinal (virgin) kraft lifi eklenmesi gerekir, bu da hammadde maliyetini artırır.
            </Note>
          </div>
        );
      case 'pvc':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">PVC (Polivinil Klorür) ve Kontaminasyon Yönetimi</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                PET geri dönüşümünde PVC, en yıkıcı kontaminasyon kaynağıdır. Yoğunluklarının benzerliği (PET: ~1.38 g/cm³, PVC: ~1.38 g/cm³) float-sink ayrımını imkansızlaştırır. Ekstrüzyonda PVC 180-200°C'de bozunarak <strong>Hidroklorik Asit (HCl)</strong> gazı salar.
              </p>
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">PVC Kalite Limitleri ve Operasyonel Etki</h4>
              <DataTable
                headers={['Parametre', 'Değer', 'Açıklama / Sektörel Standart']}
                rows={[
                  ['Maksimum PVC Limit (Bottle-to-Bottle)', '< 10 ppm', 'Premium gıda temas rPET için zorunlu üst sınır.'],
                  ['Standart rPET Flake Limiti (B Sınıfı)', '< 50 ppm', 'Standart elyaf ve levha üretimi kabul edilebilir kirlilik.'],
                  ['Kırma / Yıkama İskontosu', '-%15 ila -%30', '500 ppm üzeri PVC tespiti durumunda hammadde fiyat kırılması.'],
                  ['Filtre Elek Ömrü Azalımı', '-%25', 'Her 100 ppm ek PVC için lazer filtre elek temizleme sıklığı artışı.'],
                ]}
              />
            </section>
            <Note type="warn">
              <strong>Asit Korozyon Maliyeti:</strong> Ekstrüzyon esnasında PVC bozunmasından kaynaklanan asit, vida ve kovanı aşındırır. PVC seviyesi yüksek girdilerde ekstrüder kovan/vida değişim ömrü <strong>0.6 katına</strong> düşer.
            </Note>
          </div>
        );
      case 'ps':
        return (
          <div className="space-y-5">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white">PS & EPS (Polistiren ve Strafor) Prosesi</h4>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Expanded Polystyrene (EPS/Strafor) atıkları çok yüksek hacme ama çok düşük ağırlığa sahiptir (15-30 kg/m³). Bu durum lojistiği verimsiz kılar. Çözüm olarak atıklar tesise girmeden önce <strong>Termal Yoğunlaştırıcılar (Densifier)</strong> ile briketlenerek yoğunluk 300-450 kg/m³ seviyesine çıkarılır.
              </p>
            </section>
            <section className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
              <h4 className="text-[13.5px] font-bold text-gray-800 dark:text-white mb-2">PS/EPS Geri Dönüşüm Parametreleri</h4>
              <DataTable
                headers={['Parametre', 'Değer', 'Açıklama / Sektörel Karşılık']}
                rows={[
                  ['Yoğunluk (Katı PS)', '1.04 - 1.06 g/cm³', 'Yüzdürme tanklarında dibe batar, PE/PP\'den kolayca ayrışır.'],
                  ['MFI (Melt Flow Index)', '3.0 - 15.0 g/10 dk', 'Akışkanlık derecesine göre enjeksiyon veya levhalık sınıf ayrımı.'],
                  ['Briketleme Enerji Tüketimi', '120 - 180 kWh/ton', 'Densifier motorlarının spesifik elektrik yükü.'],
                  ['Toz ve Uçucu Firesi', '%3 - %5', 'Köpük kırma esnasında uçuşan tozlar ve kalan pentan gazı kaybı.'],
                ]}
              />
            </section>
            <Note type="tip">
              <strong>SBS/SEBS Reçete Katkısı:</strong> PS kırılgan bir polimerdir. Geri kazanılmış granüllerin darbe mukavemetini yükseltmek için ekstrüzyon esnasında reçeteye <strong>%5 - %8 oranında elastomerik SBS/SEBS kopolimeri</strong> eklenmelidir.
            </Note>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <Layers size={16} className="text-orange-500" /> Malzemeler & Fraksiyon Dinamikleri
        </h3>
        <p className="text-[12px] text-gray-500">Geri dönüşüm tesislerinde işlenen hammaddelerin kimyasal, fiziksel ve maliyet katsayıları.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Sol Menü (Desktop) / Dropdown (Mobil) */}
        <div className="w-full md:w-[200px] flex-shrink-0">
          <div className="md:hidden">
            <select
              value={activeMaterial}
              onChange={(e: any) => setActiveMaterial(e.target.value)}
              className="w-full p-2 text-[12.5px] border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-white outline-none"
            >
              {materials.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex flex-col gap-1 p-1 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-200/60 dark:border-white/5">
            {materials.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveMaterial(t.id as any)}
                className={cx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] font-semibold text-left transition-all',
                  activeMaterial === t.id
                    ? 'bg-white dark:bg-[#2A2A2A] text-orange-600 dark:text-orange-400 shadow-sm border border-gray-200/50 dark:border-white/5'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/2 hover:text-gray-700'
                )}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ İçerik Alanı */}
        <div className="flex-1 min-w-0 w-full">
          {renderMaterialContent()}
        </div>
      </div>
    </div>
  );
};


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
  { id: 'standartlar', label: 'Standartlar & Sektörel', icon: <FlaskConical size={15} /> },
  { id: 'malzemeler', label: 'Malzemeler & Fraksiyonlar', icon: <Layers size={15} /> },
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
      case 'standartlar': return <PageStandartlar />;
      case 'malzemeler': return <PageMalzemeler />;
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
