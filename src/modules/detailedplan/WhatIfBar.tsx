/**
 * WhatIfBar — Anlık Simülasyon Alt Çubuğu
 *
 * Temel değişken: giriş tonajı (monthlyInputTons)
 *   → ürün çıktı hacimleri orantılı değişir
 *   → hammadde alış maliyeti orantılı değişir
 *   → sabit giderler (kira, personel vb.) değişmez
 *
 * Kullanıcı ayrıca:
 *   → Ürün birim fiyatını ve çıktı hacmini bireysel değiştirebilir
 *   → Değişken gider birim fiyatlarını (₺/ton, ₺/kWh) değiştirebilir
 *   → Sabit giderler bu panelde gösterilmez (zaten sabit)
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  SCENARIOS, buildSeries, fmtTL, calcProductionResults,
  FixedExpense, usePlanData, ProductionModel,
} from './dpData';
import { cx, I } from './DPPrimitives';

interface Props {
  scenarioId: string;
  /** plan.productionModel — giriş tonajı ve hammadde birim fiyatı için */
  productionModel?: ProductionModel;
}

export function WhatIfBar({ scenarioId, productionModel: pm }: Props) {
  const scen = SCENARIOS[scenarioId];
  const { products, fixedExpenses, periods, weeklyHorizon } = usePlanData();

  // ── Temel üretim bilgileri (productionModel'dan) ──────────────────────────
  const baseInputTons    = pm?.monthlyInputTons ?? 0;
  const baseInputUnitPrice = pm?.inputUnitPrice  ?? 0;

  // paidInputTons: hammadde fiyatı hesabında kullanılan fire-sonrası ton
  const basePaidTons = useMemo(() => {
    if (!pm || !pm.monthlyInputTons) return 0;
    try { return calcProductionResults(pm).paidInputTons; } catch { return 0; }
  }, [pm]);

  // ── İşçi verimi taban değeri (kg/saat/kişi — ayıklama aşaması) ────────────
  const baseSortingThroughput = useMemo(() => {
    if (!pm?.workers?.length || !pm.params) return 0;
    const { hoursPerDay, daysPerMonth } = pm.params;
    if (!hoursPerDay || !daysPerMonth) return 0;
    const primary = pm.workers.find(w => w.stage === 'sorting' && w.mode === 'capacity' && w.capacityTonPerMonth);
    if (!primary) return 0;
    // kg/saat = capacityTonPerMonth × 1000 / (hoursPerDay × daysPerMonth)
    return (primary.capacityTonPerMonth! * 1000) / (hoursPerDay * daysPerMonth);
  }, [pm]);

  // ── What-If State ─────────────────────────────────────────────────────────
  const [open,                  setOpen]                  = useState(false);
  const [wiInputTons,           setWiInputTons]           = useState<number | null>(null);
  const [wiHamUnitPrice,        setWiHamUnitPrice]        = useState<number | null>(null); // ₺/ton hammadde
  const [wiSortingThroughput,   setWiSortingThroughput]   = useState<number | null>(null); // kg/saat/kişi
  const [wiPrices,              setWiPrices]              = useState<Record<string, number>>({});
  const [wiVolumes,             setWiVolumes]             = useState<Record<string, number>>({});
  const [wiExpUnitPrices,       setWiExpUnitPrices]       = useState<Record<string, number>>({}); // expId → ₺/birim
  const [wiExpQtys,             setWiExpQtys]             = useState<Record<string, number>>({});  // expId → qty/ay

  // ── Türetilmiş değerler ───────────────────────────────────────────────────
  const tonScale = (wiInputTons !== null && baseInputTons > 0)
    ? wiInputTons / baseInputTons
    : 1;

  /**
   * Personel katsayısı — daha yüksek verim → daha az işçi → daha düşük maliyet
   * laborScale = baseThroughput / wiThroughput  (örn. 80/120 = 0.667)
   */
  const laborScale = (wiSortingThroughput !== null && baseSortingThroughput > 0)
    ? baseSortingThroughput / wiSortingThroughput
    : 1;

  /** Sabit gider mi? (kira, personel, sigorta vb. — panelde gösterilmez) */
  const isFixedExp = (e: FixedExpense) =>
    e.costCategory === 'facility' ||
    e.costCategory === 'personnel' ||
    e.costCategory === 'overhead';

  /** Hammadde alış gideri mi? */
  const isInputMaterial = (e: FixedExpense) =>
    e.id === 'input_material' || e.mcode === 'M100';

  /** Elektrik/enerji gideri mi? */
  const isElecExp = (e: FixedExpense) =>
    e.mcode === 'M405' || e.mcode.startsWith('M405.');

  /** Değişken gider: giriş tonajıyla orantılı değişir */
  const isVarExp = (e: FixedExpense) => !isFixedExp(e);

  // Değişken gider listesi (panelde gösterilecek)
  const varExpenses = fixedExpenses.filter(e => !isFixedExp(e));

  const hasChanges =
    wiInputTons !== null ||
    wiHamUnitPrice !== null ||
    wiSortingThroughput !== null ||
    Object.keys(wiPrices).length > 0 ||
    Object.keys(wiVolumes).length > 0 ||
    Object.keys(wiExpUnitPrices).length > 0 ||
    Object.keys(wiExpQtys).length > 0;

  // ── Simüle edilmiş ürünler ────────────────────────────────────────────────
  const modProducts = useMemo(() =>
    products.map(p => ({
      ...p,
      price:  wiPrices[p.id]  ?? p.price,
      volume: wiVolumes[p.id] ?? (p.volume * tonScale),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, wiPrices, wiVolumes, tonScale],
  );

  // ── Simüle edilmiş giderler ───────────────────────────────────────────────
  const modExpenses = useMemo(() => fixedExpenses.map(e => {
    // Hammadde: wiHamUnitPrice × paidTons × tonScale
    if (isInputMaterial(e) && basePaidTons > 0) {
      const up = wiHamUnitPrice ?? baseInputUnitPrice;
      if (up > 0) return { ...e, monthly: up * basePaidTons * tonScale };
    }
    // Personel: işçi verimi değişikliği → orantılı maliyet değişimi
    // Daha yüksek verim → daha az işçi → laborScale < 1 → düşen maliyet
    if (e.costCategory === 'personnel' && laborScale !== 1) {
      return { ...e, monthly: e.monthly * laborScale };
    }
    // Elektrik/üretim: birim fiyat veya miktar override
    if (!isFixedExp(e) && (wiExpUnitPrices[e.id] !== undefined || wiExpQtys[e.id] !== undefined)) {
      const up  = wiExpUnitPrices[e.id] ?? e.unitPrice ?? (e.monthlyQty ? e.monthly / e.monthlyQty : 0);
      const qty = wiExpQtys[e.id] ?? e.monthlyQty ?? 0;
      if (up > 0 && qty > 0) return { ...e, monthly: up * qty };
    }
    // Diğer değişken giderler: tonScale ile orantılı
    if (isVarExp(e)) return { ...e, monthly: e.monthly * tonScale };
    // Sabit giderler: değişmez
    return e;
  }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixedExpenses, wiHamUnitPrice, wiExpUnitPrices, wiExpQtys, basePaidTons, baseInputUnitPrice, tonScale, laborScale],
  );

  // ── Seri hesapları ────────────────────────────────────────────────────────
  const baseSeries = useMemo(
    () => buildSeries(products, fixedExpenses, periods, scen, weeklyHorizon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, fixedExpenses, periods, scenarioId, weeklyHorizon],
  );
  const wiSeries = useMemo(
    () => open ? buildSeries(modProducts, modExpenses, periods, scen, weeklyHorizon) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, modProducts, modExpenses, periods, scenarioId, weeklyHorizon],
  );

  const sumSeries = (s: typeof baseSeries) =>
    s.reduce((a, x) => ({ revenue: a.revenue + x.revenue, opex: a.opex + x.opex, ebitda: a.ebitda + x.ebitda, net: a.net + x.net }),
      { revenue: 0, opex: 0, ebitda: 0, net: 0 });

  const base = useMemo(() => sumSeries(baseSeries), [baseSeries]);
  const wi   = useMemo(() => wiSeries ? sumSeries(wiSeries) : null, [wiSeries]);
  const n    = baseSeries.length || 1;

  const delta = wi ? {
    revenue: (wi.revenue - base.revenue) / n,
    ebitda:  (wi.ebitda  - base.ebitda)  / n,
    net:     (wi.net     - base.net)     / n,
  } : null;

  const reset = useCallback(() => {
    setWiInputTons(null);
    setWiHamUnitPrice(null);
    setWiSortingThroughput(null);
    setWiPrices({});
    setWiVolumes({});
    setWiExpUnitPrices({});
    setWiExpQtys({});
  }, []);

  if (!products.length && !fixedExpenses.length) return null;

  return (
    <div className="flex-none border-t-2 border-enba-orange/30 bg-enba-panel shadow-[0_-4px_20px_rgba(0,0,0,0.18)]">

      {/* ── Daima görünür çubuk ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 h-12 cursor-pointer select-none hover:bg-enba-panel-2/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="w-6 h-6 rounded-lg bg-enba-orange/15 text-enba-orange inline-flex items-center justify-center flex-none">
          <I.Sparkles size={13} />
        </span>
        <span className="text-[12.5px] font-semibold text-enba-text flex-none">Anlık Simülasyon</span>
        {hasChanges && (
          <span className="px-2 py-0.5 rounded-full bg-enba-orange text-white text-[10px] font-bold flex-none">AKTİF</span>
        )}
        {wiInputTons !== null && baseInputTons > 0 && (
          <span className="text-[10.5px] text-enba-muted flex-none tabular">
            Alış: <span className="text-enba-text font-semibold">{wiInputTons} t</span>
            <span className="ml-1 text-enba-dim">(×{tonScale.toFixed(2)})</span>
          </span>
        )}
        {wiSortingThroughput !== null && baseSortingThroughput > 0 && (
          <span className="text-[10.5px] flex-none tabular">
            <span className="text-enba-muted">Verim: </span>
            <span className={cx('font-semibold', laborScale < 1 ? 'text-enba-green' : 'text-enba-red')}>
              {wiSortingThroughput} kg/sa
            </span>
          </span>
        )}
        {delta && hasChanges && (
          <>
            <DeltaChip label="Gelir/ay" value={delta.revenue} />
            <DeltaChip label="EBITDA/ay" value={delta.ebitda} />
            <DeltaChip label="Net/ay" value={delta.net} />
          </>
        )}
        <div className="flex-1" />
        {hasChanges && (
          <button
            className="text-[11px] text-enba-orange hover:underline flex-none"
            onClick={e => { e.stopPropagation(); reset(); }}
          >
            Sıfırla
          </button>
        )}
        <I.Chevron size={13} className={cx('flex-none transition-transform duration-200', open ? '' : 'rotate-180')} />
      </div>

      {/* ── Açılır panel ────────────────────────────────────────────────── */}
      <div className={cx(
        'overflow-hidden transition-[max-height] duration-300 border-t border-enba-line',
        open ? 'max-h-[460px]' : 'max-h-0',
      )}>

        {/* ── Giriş Tonajı — tam genişlik master satır ── */}
        {baseInputTons > 0 && (
          <div className="flex items-center gap-4 px-5 py-3 border-b border-enba-line bg-enba-panel-2/40">
            <div className="flex items-center gap-2 flex-none">
              <span className="w-6 h-6 rounded-lg bg-enba-orange/15 text-enba-orange inline-flex items-center justify-center">
                <I.Bolt size={12} />
              </span>
              <span className="text-[12px] font-semibold text-enba-text">Giriş Tonajı</span>
              <span className="text-[10.5px] text-enba-dim">(en temel değişken)</span>
            </div>
            <div className="text-[11px] text-enba-muted flex-none">
              Baz: <span className="text-enba-text font-semibold tabular">{baseInputTons} ton/ay</span>
            </div>
            <I.Chevron size={10} className="-rotate-90 text-enba-dim flex-none" />
            <div className="flex items-center gap-2">
              <WiField
                label=""
                value={wiInputTons ?? baseInputTons}
                base={baseInputTons}
                step={1}
                decimals={0}
                unit="ton/ay"
                inline
                onChange={v => setWiInputTons(v === baseInputTons ? null : v)}
                onReset={() => setWiInputTons(null)}
              />
            </div>
            {wiInputTons !== null && (
              <span className={cx(
                'text-[11px] font-bold px-2 py-1 rounded-lg tabular flex-none',
                tonScale > 1 ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red',
              )}>
                ×{tonScale.toFixed(2)} — hacim ve hammadde orantılı güncellendi
              </span>
            )}
            {wiInputTons === null && (
              <span className="text-[10.5px] text-enba-dim italic">Tonajı değiştirerek tüm çıktıları anlık görün</span>
            )}
          </div>
        )}

        {/* ── 3 sütun ── */}
        <div className="grid grid-cols-3 divide-x divide-enba-line" style={{ maxHeight: 380 }}>

          {/* ── Col 1: Ürün Çıktı Fiyatı & Hacim ── */}
          <div
            className="overflow-y-auto p-4"
            style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)' }}
          >
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
              Ürün Fiyatı &amp; Çıktı Hacmi
            </p>
            {products.length === 0
              ? <p className="text-[11.5px] text-enba-dim">Gelir kalemi yok.</p>
              : products.map(p => {
                // Tonaj değiştiyse etkili baz hacim değişir
                const effectiveBaseVol = p.volume * tonScale;
                const curVol = wiVolumes[p.id] ?? effectiveBaseVol;
                const volMod = wiVolumes[p.id] !== undefined;
                return (
                  <div key={p.id} className="mb-4 pb-4 border-b border-enba-line/60 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: p.color }} />
                      <span className={cx(
                        'text-[11.5px] font-medium truncate flex-1',
                        (wiPrices[p.id] !== undefined || volMod) ? 'text-enba-orange' : 'text-enba-text',
                      )}>
                        {p.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <WiField
                        label={`Fiyat ₺/${p.unit}`}
                        value={wiPrices[p.id] ?? p.price}
                        base={p.price}
                        step={500}
                        onChange={v => setWiPrices(pr => ({ ...pr, [p.id]: v }))}
                        onReset={() => setWiPrices(pr => { const n = { ...pr }; delete n[p.id]; return n; })}
                      />
                      <WiField
                        label={`Hacim ${p.unit}/ay`}
                        value={curVol}
                        base={effectiveBaseVol}
                        step={1}
                        decimals={1}
                        onChange={v => setWiVolumes(pr => ({ ...pr, [p.id]: v }))}
                        onReset={() => setWiVolumes(pr => { const n = { ...pr }; delete n[p.id]; return n; })}
                      />
                    </div>
                    {tonScale !== 1 && !volMod && (
                      <div className="mt-1.5 text-[9.5px] text-enba-dim italic">
                        Tonaj ×{tonScale.toFixed(2)} → {effectiveBaseVol.toFixed(1)} {p.unit}/ay
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>

          {/* ── Col 2: Değişken Gider Birim Fiyatları ── */}
          <div
            className="overflow-y-auto p-4"
            style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)' }}
          >
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
              Değişken Gider Birim Fiyatları
            </p>

            {/* Hammadde birim fiyatı — productionModel varsa özel alan */}
            {baseInputUnitPrice > 0 && basePaidTons > 0 && (
              <div className="mb-4 pb-4 border-b border-enba-line/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded border bg-enba-panel-2 border-enba-line text-enba-orange flex-none">M100</span>
                  <span className={cx('text-[11.5px] font-medium flex-1', wiHamUnitPrice !== null ? 'text-enba-orange' : 'text-enba-text')}>
                    Hammadde Alışı
                  </span>
                </div>
                <WiField
                  label="₺ / ton (giriş)"
                  value={wiHamUnitPrice ?? baseInputUnitPrice}
                  base={baseInputUnitPrice}
                  step={500}
                  decimals={0}
                  wide
                  onChange={v => setWiHamUnitPrice(v)}
                  onReset={() => setWiHamUnitPrice(null)}
                />
                <div className="mt-1.5 text-[9.5px] text-enba-dim">
                  Aylık ≈ {fmtTL((wiHamUnitPrice ?? baseInputUnitPrice) * basePaidTons * tonScale, { compact: true })}
                  {tonScale !== 1 && <span className="ml-1 text-enba-orange">(tonaj ×{tonScale.toFixed(2)} dahil)</span>}
                </div>
              </div>
            )}

            {/* İşçi Verimi (Ayıklama) — baseSortingThroughput varsa göster */}
            {baseSortingThroughput > 0 && (
              <div className="mb-4 pb-4 border-b border-enba-line/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded border bg-enba-panel-2 border-enba-line text-enba-orange flex-none">İK</span>
                  <span className={cx('text-[11.5px] font-medium flex-1', wiSortingThroughput !== null ? 'text-enba-orange' : 'text-enba-text')}>
                    İşçi Verimi (Ayıklama)
                  </span>
                </div>
                <WiField
                  label="kg / saat / kişi"
                  value={wiSortingThroughput ?? baseSortingThroughput}
                  base={baseSortingThroughput}
                  step={10}
                  decimals={0}
                  wide
                  onChange={v => setWiSortingThroughput(v)}
                  onReset={() => setWiSortingThroughput(null)}
                />
                {wiSortingThroughput !== null && (
                  <div className="mt-1.5 text-[9.5px] leading-snug">
                    <span className={cx(
                      'font-semibold',
                      laborScale < 1 ? 'text-enba-green' : 'text-enba-red',
                    )}>
                      Verim ×{(wiSortingThroughput / baseSortingThroughput).toFixed(2)}
                    </span>
                    <span className="text-enba-dim ml-1">
                      → personel maliyeti ×{laborScale.toFixed(2)}
                      {laborScale < 1 && <span className="text-enba-green ml-1">(tasarruf)</span>}
                      {laborScale > 1 && <span className="text-enba-red ml-1">(artış)</span>}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Diğer değişken giderler (satın alma + üretim — elektrik, nakliye vb.) */}
            {varExpenses
              .filter(e => !isInputMaterial(e)) // hammadde zaten yukarıda
              .map(e => {
                const isElec   = isElecExp(e);
                const hasHelper = (isElec) && !!e.monthlyQty;
                const baseUP   = e.unitPrice ?? (e.monthlyQty ? e.monthly / e.monthlyQty : 0);
                const baseQty  = e.monthlyQty ?? 0;
                const curUP    = wiExpUnitPrices[e.id] ?? baseUP;
                const curQty   = wiExpQtys[e.id]       ?? baseQty;
                const isMod    = wiExpUnitPrices[e.id] !== undefined || wiExpQtys[e.id] !== undefined;
                // Ton ölçeği zaten modExpenses'de uygulanıyor — burada sadece birim fiyat/miktar göster
                const effectiveMontly = hasHelper
                  ? curUP * curQty
                  : e.monthly * tonScale;

                return (
                  <div key={e.id} className="mb-4 pb-4 border-b border-enba-line/60 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={cx(
                        'text-[9px] font-mono px-1 py-0.5 rounded border flex-none',
                        isMod ? 'bg-enba-orange/10 border-enba-orange/40 text-enba-orange' : 'bg-enba-panel-2 border-enba-line text-enba-orange',
                      )}>{e.mcode}</span>
                      <span className={cx('text-[11.5px] font-medium truncate flex-1', isMod ? 'text-enba-orange' : 'text-enba-text')}>
                        {e.name}
                      </span>
                    </div>

                    {hasHelper ? (
                      <div className="grid grid-cols-2 gap-2">
                        <WiField
                          label="₺ / kWh"
                          value={curUP}
                          base={baseUP}
                          step={0.5}
                          decimals={2}
                          onChange={v => setWiExpUnitPrices(p => ({ ...p, [e.id]: v }))}
                          onReset={() => setWiExpUnitPrices(p => { const n = { ...p }; delete n[e.id]; return n; })}
                        />
                        <WiField
                          label="kWh / ay"
                          value={curQty}
                          base={baseQty}
                          step={1000}
                          decimals={0}
                          onChange={v => setWiExpQtys(p => ({ ...p, [e.id]: v }))}
                          onReset={() => setWiExpQtys(p => { const n = { ...p }; delete n[e.id]; return n; })}
                        />
                      </div>
                    ) : (
                      /* Birim fiyat/miktar yoksa — aylık TL göster, ton ölçeği not ile */
                      <div>
                        <div className="text-[9.5px] text-enba-dim mb-1 uppercase tracking-wide">₺ / ay</div>
                        <div className="px-2.5 py-1.5 rounded-lg bg-enba-panel-2 border border-enba-line text-[12px] text-right tabular text-enba-text">
                          {fmtTL(effectiveMontly)}
                        </div>
                        {tonScale !== 1 && (
                          <div className="mt-1 text-[9px] text-enba-dim italic">
                            Baz {fmtTL(e.monthly)} × {tonScale.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            }

            {varExpenses.filter(e => !isInputMaterial(e)).length === 0 && baseInputUnitPrice <= 0 && (
              <p className="text-[11.5px] text-enba-dim leading-snug">
                Değişken gider kalemi bulunamadı.<br />
                <span className="text-[10.5px]">Hammadde fiyatı planınıza eklenmiş mi?</span>
              </p>
            )}
          </div>

          {/* ── Col 3: Etki Özeti ── */}
          <div className="p-4 flex flex-col">
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-enba-muted font-semibold mb-3">
              Etki Özeti (ort. / ay)
            </p>
            {!hasChanges ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-2">
                <div className="w-10 h-10 rounded-xl bg-enba-panel-2 border border-enba-line flex items-center justify-center">
                  <I.Sparkles size={16} className="text-enba-dim" />
                </div>
                <p className="text-[11px] text-enba-dim leading-snug">
                  Tonajı veya birim fiyatları<br />değiştirerek etkiyi görün
                </p>
              </div>
            ) : wi ? (
              <div className="space-y-2">
                {([
                  { label: 'Gelir',   baseV: base.revenue / n, wiV: wi.revenue / n, better: true  },
                  { label: 'Gider',   baseV: base.opex    / n, wiV: wi.opex    / n, better: false },
                  { label: 'EBITDA',  baseV: base.ebitda  / n, wiV: wi.ebitda  / n, better: true  },
                  { label: 'Net Kâr', baseV: base.net     / n, wiV: wi.net     / n, better: true  },
                ] as const).map(row => {
                  const diff = row.wiV - row.baseV;
                  const pct  = row.baseV !== 0 ? diff / Math.abs(row.baseV) : 0;
                  const good = row.better ? diff >= 0 : diff <= 0;
                  return (
                    <div key={row.label} className="rounded-xl border border-enba-line bg-enba-panel-2/40 px-3 py-2">
                      <div className="text-[9.5px] text-enba-muted mb-1.5">{row.label} / ay</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] text-enba-dim tabular">{fmtTL(row.baseV, { compact: true })}</span>
                        <I.Chevron size={9} className="-rotate-90 text-enba-dim flex-none" />
                        <span className="text-[12px] font-semibold tabular flex-1">{fmtTL(row.wiV, { compact: true })}</span>
                        <span className={cx(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded tabular',
                          good ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red',
                        )}>
                          {diff > 0 ? '+' : ''}{(pct * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={reset}
                  className="w-full mt-1 py-1.5 rounded-lg text-[11px] text-enba-muted hover:text-enba-orange hover:bg-enba-orange/8 transition-colors flex items-center justify-center gap-1.5"
                >
                  <I.Refresh size={11} /> Tüm değişiklikleri sıfırla
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── DeltaChip ────────────────────────────────────────────────────────────────
const DeltaChip = ({ label, value }: { label: string; value: number }) => (
  <span className={cx(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular flex-none',
    value >= 0 ? 'bg-enba-green/15 text-enba-green' : 'bg-enba-red/15 text-enba-red',
  )}>
    {value > 0 ? '+' : ''}{fmtTL(value, { compact: true })}
    <span className="font-normal opacity-60">{label}</span>
  </span>
);

// ─── WiField ──────────────────────────────────────────────────────────────────
interface WiFieldProps {
  label: string;
  value: number;
  base: number;
  onChange: (v: number) => void;
  onReset: () => void;
  step?: number;
  decimals?: number;
  wide?: boolean;
  unit?: string;   // "ton/ay" gibi suffix (inline mod için)
  inline?: boolean; // label-less inline mod
}

const WiField = ({ label, value, base, onChange, onReset, step = 100, decimals = 0, wide, unit, inline }: WiFieldProps) => {
  const modified = Math.abs(value - base) > 0.001;
  const [focused, setFocused] = useState(false);
  const [draft,   setDraft]   = useState('');

  const commit = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v) && v >= 0) onChange(v);
  };

  return (
    <div className={cx(wide ? 'col-span-2' : '', inline ? 'flex items-center gap-2' : '')}>
      {!inline && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[9.5px] uppercase tracking-wide text-enba-dim leading-none">{label}</label>
          {modified && (
            <button onClick={onReset} className="text-[9px] text-enba-orange hover:underline leading-none">← baz</button>
          )}
        </div>
      )}
      <div className={cx('flex items-center gap-1.5', inline ? '' : 'w-full')}>
        <input
          type="number"
          step={step}
          min={0}
          value={focused ? draft : value.toFixed(decimals)}
          onFocus={() => { setFocused(true); setDraft(value.toFixed(decimals)); }}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { setFocused(false); commit(draft); }}
          onKeyDown={e => { if (e.key === 'Enter') commit(draft); }}
          className={cx(
            'rounded-lg px-2.5 py-1.5 text-[12px] text-right outline-none border transition-colors tabular',
            inline ? 'w-[100px]' : 'w-full',
            modified
              ? 'bg-enba-orange/6 border-enba-orange/50 text-enba-orange focus:border-enba-orange'
              : 'bg-enba-panel-2 border-enba-line text-enba-text focus:border-enba-orange/60',
          )}
        />
        {unit && <span className="text-[10.5px] text-enba-muted whitespace-nowrap">{unit}</span>}
        {inline && modified && (
          <button onClick={onReset} className="text-[9px] text-enba-orange hover:underline whitespace-nowrap">← baz</button>
        )}
      </div>
    </div>
  );
};
