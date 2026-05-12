import { describe, it, expect } from 'vitest';
import { evalFormula, applyPnlFormulas, type PnlKategoriler } from '../pnlCalc';

describe('evalFormula', () => {
  it('tek pozitif terim toplar', () => {
    expect(evalFormula(['A'], { A: 1000 })).toBe(1000);
  });

  it('birden fazla pozitif terimi toplar', () => {
    expect(evalFormula(['A', 'B'], { A: 1000, B: 500 })).toBe(1500);
  });

  it('eksi prefix çıkarma yapar', () => {
    expect(evalFormula(['A', '-B'], { A: 1000, B: 300 })).toBe(700);
  });

  it('karışık toplama ve çıkarma', () => {
    // M299 = M179 - M249 - M209
    expect(evalFormula(['M179', '-M249', '-M209'], { M179: 1500, M249: 100, M209: 50 })).toBe(1350);
  });

  it('bilinmeyen kod 0 sayılır', () => {
    expect(evalFormula(['A', 'BILINMEYEN'], { A: 500 })).toBe(500);
  });

  it('boş formula 0 döner', () => {
    expect(evalFormula([], {})).toBe(0);
  });
});

describe('applyPnlFormulas — I. HASILAT', () => {
  const ay = '2024-01';
  const mod = 'Fabrika A';

  function kat(vals: Record<string, number>): PnlKategoriler {
    const k: PnlKategoriler = {};
    for (const [id, v] of Object.entries(vals)) {
      k[id] = { [ay]: { [mod]: v } };
    }
    return k;
  }

  it('M179 = M109 + M159 (Toplam Satış)', () => {
    const result = applyPnlFormulas(kat({ M109: 800_000, M159: 50_000 }), [ay], [mod]);
    expect(result['M179'][ay][mod]).toBe(850_000);
  });

  it('M299 = M179 - M249 - M209 (Hasılat)', () => {
    const result = applyPnlFormulas(
      kat({ M109: 800_000, M159: 50_000, M249: 20_000, M209: 30_000 }),
      [ay], [mod],
    );
    expect(result['M299'][ay][mod]).toBe(800_000);
  });

  it('M339 = M301 + M305 (Mal Maliyetleri)', () => {
    const result = applyPnlFormulas(kat({ M301: 100_000, M305: 400_000 }), [ay], [mod]);
    expect(result['M339'][ay][mod]).toBe(500_000);
  });

  it('M399 KATKI = M299 - M339 - M349', () => {
    const result = applyPnlFormulas(
      kat({ M109: 900_000, M159: 0, M249: 0, M209: 0, M301: 0, M305: 500_000, M349: 0 }),
      [ay], [mod],
    );
    expect(result['M399'][ay][mod]).toBe(400_000);
  });
});

describe('applyPnlFormulas — SONUÇ', () => {
  const ay = '2024-01';
  const mod = 'Fabrika';

  it('EBITDA hesabı tam pipeline üzerinden doğru çıkar', () => {
    // Basit senaryo: sadece M109 gelir, sadece M450 personel gideri
    const input: PnlKategoriler = {
      M109: { [ay]: { [mod]: 1_000_000 } },  // satış
      M450: { [ay]: { [mod]: 200_000 } },     // maaş
    };
    const result = applyPnlFormulas(input, [ay], [mod]);

    // M179 = M109 + M159(0) = 1_000_000
    expect(result['M179'][ay][mod]).toBe(1_000_000);
    // M299 = M179 - M249(0) - M209(0) = 1_000_000
    expect(result['M299'][ay][mod]).toBe(1_000_000);
    // M489 = M450 + M455(0) + M475(0) + M480(0) = 200_000
    expect(result['M489'][ay][mod]).toBe(200_000);
    // TOTAL_COST = M689(0) + M509(0) + M489 + M419(0) = 200_000
    expect(result['TOTAL_COST'][ay][mod]).toBe(200_000);
    // M769 EBITDA = M399(1_000_000) - TOTAL_COST(200_000) = 800_000
    expect(result['M769'][ay][mod]).toBe(800_000);
  });
});
