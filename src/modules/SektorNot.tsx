import React, { useState } from 'react';
import {
  BookOpen, Recycle, Zap, Layers, ArrowRight, AlertTriangle,
  ChevronDown, ChevronRight, FlaskConical, Cpu, Package,
} from 'lucide-react';

// ─── Tip ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

// ─── Yardımcı bileşenler ────────────────────────────────────────────────────

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

const Table: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
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
        <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border text-[12px] font-medium
          ${s.highlight
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          {s.label}
          {s.sub && <span className="text-[10px] font-normal text-gray-400">{s.sub}</span>}
        </div>
        {i < steps.length - 1 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
      </React.Fragment>
    ))}
  </div>
);

// ─── İçerik ─────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'proses',
    icon: <Recycle size={16} />,
    title: 'Malzeme Akışı — Genel Proses',
    content: (
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
    ),
  },
  {
    id: 'fire',
    icon: <FlaskConical size={16} />,
    title: 'Giriş Firesi — Tipler & Modlar',
    badge: 'Kritik',
    content: (
      <div className="space-y-4">
        <Table
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
              <li>Her fraksiyon ayrı: ad + % + TL/kg</li>
              <li>Örn: kağıt %5 → 0.05 ₺/kg</li>
              <li>Bazı işletmeler bunlara ödeme yapar</li>
              <li>Gelir hesabına girer</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'onsecim',
    icon: <Layers size={16} />,
    title: 'Ön Seçim',
    content: (
      <div className="space-y-4">
        <Note type="info">
          Her malzeme için ayrı karar. Bazı malzemeler ön seçimi <strong>bypass</strong> ederek direkt üretime girer — kırma hattına girmeden önce elle yapılır.
        </Note>
        <Table
          headers={['Fraksiyon Kararı', 'Ne Olur?']}
          rows={[
            [<Tag color="green">Direkt sat</Tag>,    'Gelir hesabına girer, üretime katılmaz'],
            [<Tag color="blue">Üretime sok</Tag>,    'Granül hattına giriyor, orada da fire verebilir'],
            [<Tag color="red">At (fire)</Tag>,       'Saf kayıp, gelir yok'],
          ]}
        />
        <div className="text-[12.5px] text-gray-600">
          <span className="font-semibold text-gray-700">Yan ürün satışı:</span> Kağıt → biriktirip sat. Balya → balya presinde sıkıştır, sat. Granül üretimine girmek zorunda değiller.
        </div>
      </div>
    ),
  },
  {
    id: 'hat',
    icon: <AlertTriangle size={16} />,
    title: 'Hat Uyumluluğu — Kritik Sektör Bilgisi',
    badge: 'Niş Bilgi',
    content: (
      <div className="space-y-4">
        <Table
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
        <Note type="tip">
          Kapasite boşluğu varsa sistem öneri verir: <em>"Hattınızın %40 kapasitesi boşta. Başka ürün planlayabilir veya daha fazla hammadde alabilirsiniz."</em>
        </Note>
      </div>
    ),
  },
  {
    id: 'makineler',
    icon: <Cpu size={16} />,
    title: 'Granül Tesisi — Makine Parametreleri',
    content: (
      <div className="space-y-4">
        <Flow steps={[
          { label: 'Kırma' },
          { label: 'Dikey Çırpma' },
          { label: 'Turbo Kurutma' },
          { label: 'Yatay Sıkma' },
          { label: 'Agromel + Fan' },
          { label: 'Granülatör', highlight: true },
        ]} />
        <Table
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
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="font-semibold text-gray-700 mb-1">Talep Faktörü (DF)</div>
            <div className="text-gray-600">Varsayılan: <strong>0,60</strong></div>
            <div className="text-gray-400 text-[11px] mt-1">İlk elektrik faturasıyla kalibre edilecek</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="font-semibold text-gray-700 mb-1">Enerji Fiyatı</div>
            <div className="text-gray-600"><strong>5 ₺/kWh</strong></div>
            <div className="text-gray-400 text-[11px] mt-1">Varsayılan — güncellenebilir</div>
          </div>
        </div>
        <Note type="info">
          Enerji formülü: <code className="bg-gray-100 px-1 rounded text-[11px]">Σ [ kW × (geçen_ton / kapasite) × DF × birim_fiyat ]</code>
          — Granülatör için net 1.kalite ton; diğerleri için giriş tonu kullanılır.
        </Note>
      </div>
    ),
  },
  {
    id: 'ekonomi',
    icon: <Zap size={16} />,
    title: '110 Ton Senaryosu — Referans Sayılar',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Giriş / Çıktı</div>
            <Table
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
            <Table
              headers={['Kalem', 'Fiyat']}
              rows={[
                ['Hammadde alış',         '19 ₺/kg'],
                ['1. kalite granül satış', '40 ₺/kg'],
                ['2. kalite ürün satış',   '30 ₺/kg'],
                ['Çuval',                 '350 ₺/adet'],
                ['Atık su',               '800 ₺/giriş tonu'],
              ]}
            />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">İşçilik</div>
          <Table
            headers={['Pozisyon', 'Kişi', 'Maaş (brüt)', 'Not']}
            rows={[
              ['Ayrıştırma işçisi', 'ceil(giriş/20,8)', '50.000 ₺', 'Değişken — giriş tonuna göre'],
              ['Granül ustası',     '1',                '82.000 ₺', 'Sabit, tüm senaryolarda'],
            ]}
          />
          <div className="text-[11px] text-gray-400 mt-1">İşçi kapasitesi: 80 kg/sa × 10,5 sa/gün × 26 gün ≈ 21,8 ton/işçi/ay</div>
        </div>
      </div>
    ),
  },
  {
    id: 'sabitgider',
    icon: <Package size={16} />,
    title: 'Sabit Giderler — Gider Merkezi (Kömürcüler)',
    content: (
      <div className="space-y-4">
        <Table
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
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Senaryo Özeti</div>
          <Table
            headers={['Senaryo', 'Giriş', 'Kâr Durumu']}
            rows={[
              ['30 ton', '30 t',  <Tag color="red">Zarar</Tag>],
              ['50 ton', '50 t',  <Tag color="red">Zarar</Tag>],
              ['70 ton', '70 t',  <Tag color="amber">~Başabaş</Tag>],
              ['90 ton', '90 t',  <Tag color="green">Kârlı</Tag>],
              ['110 ton', '110 t', <Tag color="green">En yüksek kâr</Tag>],
            ]}
          />
          <div className="text-[11px] text-gray-400 mt-1">Başabaş noktası ≈ 57 ton/ay</div>
        </div>
        <Note type="warn">
          Bu sayılar: amortisman dahil değil · vergi öncesi · finansman maliyeti yok · fazla mesai ücreti ek hesaplanmadı.
        </Note>
      </div>
    ),
  },
];

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function SektorNot() {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map(s => [s.id, true]))
  );

  const toggle = (id: string) =>
    setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="h-full overflow-y-auto bg-[var(--enba-bg)]">
      <div className="max-w-[860px] mx-auto p-6 space-y-4">

        {/* Başlık */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <BookOpen size={20} className="text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-gray-900 dark:text-white">Sektör Bilgi Bankası</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">SUPER ADMIN</span>
            </div>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Granül üretimi & geri dönüşüm sektörü — yazılımın niş yapısının arkasındaki domain bilgisi.
            </p>
          </div>
        </div>

        {/* Bölümler */}
        {SECTIONS.map(sec => (
          <div key={sec.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(sec.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/4 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                {sec.icon}
              </div>
              <span className="flex-1 text-[14px] font-semibold text-gray-800 dark:text-white">{sec.title}</span>
              {sec.badge && <Tag color="purple">{sec.badge}</Tag>}
              {open[sec.id]
                ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
            </button>
            {open[sec.id] && (
              <div className="px-5 pb-5 pt-1 border-t border-gray-50 dark:border-white/5">
                {sec.content}
              </div>
            )}
          </div>
        ))}

        <div className="text-[11px] text-gray-300 text-center pb-4">
          Son güncelleme: 2026-05-24 · Kaynak: Başar ile konuşmalar
        </div>
      </div>
    </div>
  );
}
