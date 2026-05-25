import React, { useState, useMemo } from 'react';
import {
  BookOpen, Recycle, Zap, Layers, ArrowRight, AlertTriangle,
  ChevronDown, ChevronRight, FlaskConical, Cpu, Package,
  Search, Tag as TagIcon, Hash, ChevronLeft,
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

type PageId = 'overview' | 'proses' | 'malzeme' | 'makine' | 'ekonomi' | 'sozluk';

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
  // ── Malzeme ──
  { term: 'Granül', category: 'Ürün', definition: 'Plastik atıkların yıkanıp kurutularak kırılması ve ekstrüzyona sokulmasıyla elde edilen küçük, düzgün plastik parçacıklar. Nihai ürün olarak ham madde yerine kullanılır.', tags: ['plastik', 'ürün'] },
  { term: 'PET', category: 'Malzeme', definition: 'Polietilen tereftalat. Su şişeleri, meşrubat ambalajlarında kullanılan şeffaf plastik türü. Geri dönüşümde ayrı hat gerektirir, PP/LDPE/HDPE ile uyumsuz.', tags: ['plastik', 'polimer'] },
  { term: 'PP', category: 'Malzeme', definition: 'Polipropilen. Kapaklar, kolalar, bazı ambalajlarda kullanılır. PP/LDPE/HDPE aynı hattı paylaşabilir ancak aynı anda işlenemez.', tags: ['plastik', 'polimer'] },
  { term: 'LDPE', category: 'Malzeme', definition: 'Düşük yoğunluklu polietilen (Low Density Polyethylene). Naylon poşetler, ambalaj filmleri. PP ile aynı hattı sıralı olarak kullanabilir.', tags: ['plastik', 'polimer'] },
  { term: 'HDPE', category: 'Malzeme', definition: 'Yüksek yoğunluklu polietilen (High Density Polyethylene). Bidon, kova, boru. PP/LDPE hattını paylaşır.', tags: ['plastik', 'polimer'] },
  { term: 'Fraksiyon', category: 'Proses', definition: 'Hammadde içinde ana plastikten ayrışan farklı cinsteki malzeme parçaları. Kağıt, cam, diğer plastik türleri, metal vb. Her fraksiyon için ayrı karar verilir: direkt sat / üretime sok / at.', tags: ['proses', 'fire'] },
  // ── Fire ──
  { term: 'Nem firesi', category: 'Fire', definition: 'Islak veya nemli hammaddedeki su oranından kaynaklanan ağırlık kaybı. Tamamen saf kayıptır — değer yaratmaz, gelire dönüştürülemez.', tags: ['fire', 'kayıp'] },
  { term: 'Giriş firesi', category: 'Fire', definition: 'Hammaddenin üretime girdiği andan itibaren oluşan toplam ağırlık kaybı. Nem, çöp ve fraksiyonları kapsar. Toplam fire = nem + çöp + fraksiyonlar.', tags: ['fire', 'proses'] },
  { term: 'Alt kalite fraksiyon', category: 'Fire', definition: 'Kağıt, LDPE, 2./3. kalite plastik gibi yan ürüne veya düşük değerli satışa dönüştürülebilen fraksiyon. Bazı işletmeler bunlara ödeme yapar; bazılarında saf kayıp sayılır.', tags: ['fire', 'fraksiyon'] },
  // ── Makine ──
  { term: 'Agromel', category: 'Makine', definition: 'İnce plastik filmleri ve düşük yoğunluklu malzemeleri ısı ve sürtünme yoluyla yoğunlaştıran makine. Granülatör öncesi ön işlem ünitesi.', tags: ['makine', 'granül'] },
  { term: 'Granülatör', category: 'Makine', definition: 'Plastik eriyiğini ince tel şeklinde ekstrüde edip soğutarak keserek granül üretilen ana makine. Genellikle hat darboğazıdır.', tags: ['makine', 'darboğaz'] },
  { term: 'Darboğaz', category: 'Proses', definition: 'Hattın kapasitesini en çok sınırlayan makine veya adım. Granülatör çoğu tesiste darboğazdır (0,3 ton/saat). Fazla mesai ile telafi edilebilir.', tags: ['kapasite', 'proses'] },
  { term: 'Talep faktörü (DF)', category: 'Enerji', definition: 'Makinenin nominal gücüne karşı gerçekte çektiği güç oranı. Varsayılan: 0,60. İlk elektrik faturasıyla kalibre edilir. Enerji maliyeti hesabında kullanılır.', tags: ['enerji', 'elektrik'] },
  // ── Ekonomi ──
  { term: 'Başabaş noktası', category: 'Ekonomi', definition: 'Sabit ve değişken maliyetlerin toplam gelire eşitlendiği üretim miktarı. Kömürcüler tesisi için ≈ 57 ton/ay.', tags: ['ekonomi', 'kârlılık'] },
  { term: 'Hat değişimi', category: 'Proses', definition: 'Farklı malzeme tipine geçiş için hattın temizlenmesi ve yeniden ayarlanması. Hem hammadde hem zaman kaybı yaratır. Bu yüzden tek malzeme planlaması tercih edilir.', tags: ['proses', 'verimlilik'] },
  { term: 'Atık su bedeli', category: 'Maliyet', definition: 'Yıkama prosesinde oluşan atık su deşarj ya da arıtma maliyeti. Kömürcüler tesisinde 800 ₺/giriş tonu olarak bütçelenir.', tags: ['maliyet', 'çevre'] },
  { term: 'Ön seçim', category: 'Proses', definition: 'Hammaddenin kırma hattına girmeden önce elle veya mekanik olarak fraksiyonlarından ayrıştırılması adımı. Malzeme bazında bypass edilebilir.', tags: ['proses'] },
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
        { label: 'Proses Adımı', count: '6', color: 'bg-orange-50 border-orange-200 text-orange-700' },
        { label: 'Malzeme Türü', count: '4+', color: 'bg-blue-50 border-blue-200 text-blue-700' },
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
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Temel Proses</span>
        </div>
        <Flow steps={[
          { label: 'Giriş' }, { label: 'Fire' }, { label: 'Ön Seçim' },
          { label: 'Üretim' }, { label: 'Granül', highlight: true },
        ]} />
      </div>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-orange-500" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white">Referans Senaryo</span>
        </div>
        <div className="space-y-1.5 text-[12.5px]">
          {[
            ['Giriş', '110 ton/ay'],
            ['1. kalite granül', '93,5 ton/ay'],
            ['Hammadde alış', '19 ₺/kg'],
            ['Granül satış (1. kal.)', '40 ₺/kg'],
            ['Başabaş noktası', '≈ 57 ton/ay'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold text-gray-800 dark:text-white">{v}</span>
            </div>
          ))}
        </div>
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

const PageMakine: React.FC = () => (
  <div className="space-y-8">
    <section>
      <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Cpu size={16} className="text-orange-500" /> Granül Tesisi — Hat Sırası
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
  { id: 'overview', label: 'Genel Bakış',   icon: <BookOpen size={15} /> },
  { id: 'proses',   label: 'Prosesler',     icon: <Recycle size={15} /> },
  { id: 'makine',   label: 'Makine & Hat',  icon: <Cpu size={15} /> },
  { id: 'ekonomi',  label: 'Ekonomi',       icon: <Zap size={15} /> },
  { id: 'sozluk',   label: 'Terimler',      icon: <Hash size={15} />, count: WIKI_TERMS.length },
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
