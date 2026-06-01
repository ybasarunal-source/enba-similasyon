import { parasutService, type ParasutAccount } from './parasut';
import { kurulumNakitAPI, type FoundingCashflow } from './kurulumNakit';

export interface ExportState {
  accountName: string;
  current: number;
  total: number;
  errors: string[];
  done: boolean;
}

let _state: ExportState | null = null;
const _listeners = new Set<(s: ExportState | null) => void>();

function notify() {
  const snap = _state ? { ..._state, errors: [..._state.errors] } : null;
  _listeners.forEach(fn => fn(snap));
}

export const parasutExporter = {
  subscribe(fn: (s: ExportState | null) => void): () => void {
    _listeners.add(fn);
    fn(_state ? { ..._state, errors: [..._state.errors] } : null);
    return () => _listeners.delete(fn);
  },

  getState(): ExportState | null {
    return _state;
  },

  clear() {
    _state = null;
    notify();
  },

  async start(
    rows: FoundingCashflow[],
    acc: ParasutAccount,
    companyId: string,
    parasutCompanyId: string,
  ): Promise<void> {
    if (_state && !_state.done) return; // zaten çalışıyor
    const pending = rows.filter(r => r.source_account === acc.name && !r.parasut_id);
    if (pending.length === 0) return;

    _state = { accountName: acc.name, current: 0, total: pending.length, errors: [], done: false };
    notify();

    for (let i = 0; i < pending.length; i++) {
      const r = pending[i];
      try {
        const parasutId = await parasutService.createAccountTransaction(
          parasutCompanyId,
          acc.id,
          r.tip,
          r.tarih,
          r.tutar_tl,
          r.aciklama,
        );
        if (parasutId) await kurulumNakitAPI.markExported(r.id, parasutId);
      } catch (e) {
        _state.errors.push(`${r.tarih} ${r.tutar_tl}₺: ${e instanceof Error ? e.message.slice(0, 60) : 'hata'}`);
      }
      _state = { ..._state, current: i + 1, errors: [..._state.errors] };
      notify();
      await new Promise(res => setTimeout(res, 350));
    }

    _state = { ..._state, done: true };
    notify();
  },
};
