import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, Check, X,
  ToggleLeft, ToggleRight, Search, RefreshCw, AlertCircle,
} from 'lucide-react';
import { financialCategoriesAPI, type FinancialCategory } from '../api/financialCategories';
import { MCODE_NOTES } from '../api/mcodeNotes';
import type { UserProfile } from '../api/supabase';

interface AyarlarProps {
  profile: UserProfile | null;
}

export const Ayarlar: React.FC<AyarlarProps> = ({ profile }) => {
  const companyId = profile?.company_id ?? '';

  const [cats, setCats] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const [addingChildFor, setAddingChildFor] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState('');
  const [addingParent, setAddingParent] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newParentCode, setNewParentCode] = useState('');

  const load = useCallback(async (force = false) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      await financialCategoriesAPI.seedIfEmpty(companyId);
      const data = await financialCategoriesAPI.getAll(companyId, force);
      setCats(data);
    } catch (e: any) {
      setError(e.message || 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const parents = cats.filter(c => c.parent_code === null).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (code: string) => cats.filter(c => c.parent_code === code).sort((a, b) => a.sort_order - b.sort_order);
  const hasChildren = (code: string) => cats.some(c => c.parent_code === code);

  const matchesSearch = useCallback((cat: FinancialCategory) => {
    const q = search.toLowerCase();
    return cat.code.toLowerCase().includes(q) || cat.name_tr.toLowerCase().includes(q);
  }, [search]);

  const visibleParents = search
    ? parents.filter(p => matchesSearch(p) || childrenOf(p.code).some(matchesSearch))
    : parents;

  const toggleExpand = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const startEdit = (cat: FinancialCategory) => {
    setEditingId(cat.id);
    setEditValue(cat.name_tr);
    setAddingChildFor(null);
    setAddingParent(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditValue(''); };

  const saveEdit = async (cat: FinancialCategory) => {
    if (!editValue.trim() || editValue === cat.name_tr) { cancelEdit(); return; }
    setSaving(cat.id);
    try {
      await financialCategoriesAPI.update(cat.id, { name_tr: editValue.trim() });
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, name_tr: editValue.trim() } : c));
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (cat: FinancialCategory) => {
    setSaving(cat.id);
    const newVal = !cat.is_active;
    setCats(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newVal } : c));
    try {
      await financialCategoriesAPI.update(cat.id, { is_active: newVal });
    } catch (e: any) {
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: cat.is_active } : c));
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (cat: FinancialCategory) => {
    if (!cat.is_custom) return;
    if (!window.confirm(`"${cat.code}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    setSaving(cat.id);
    try {
      await financialCategoriesAPI.remove(cat.id);
      setCats(prev => prev.filter(c => c.id !== cat.id && c.parent_code !== cat.code));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAddChild = async (parentCode: string) => {
    if (!newChildName.trim()) return;
    const code = financialCategoriesAPI.nextChildCode(parentCode, cats);
    setSaving('new');
    try {
      const cat = await financialCategoriesAPI.add(companyId, {
        code,
        parent_code: parentCode,
        name_tr: newChildName.trim(),
        is_custom: true,
        sort_order: 9999,
      });
      setCats(prev => [...prev, cat]);
      setExpanded(prev => new Set([...prev, parentCode]));
      setAddingChildFor(null);
      setNewChildName('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAddParent = async () => {
    if (!newParentName.trim() || !newParentCode.trim()) return;
    const code = newParentCode.trim().toUpperCase();
    if (cats.some(c => c.code === code)) { setError(`"${code}" kodu zaten mevcut.`); return; }
    setSaving('new');
    try {
      const cat = await financialCategoriesAPI.add(companyId, {
        code,
        parent_code: null,
        name_tr: newParentName.trim(),
        is_custom: true,
        sort_order: 9999,
      });
      setCats(prev => [...prev, cat]);
      setAddingParent(false);
      setNewParentName('');
      setNewParentCode('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  if (!companyId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Şirket bilgisi yüklenemedi. Lütfen profil sayfanızı kontrol edin.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finansal Kategoriler</h1>
          <p className="text-sm text-gray-500 mt-0.5">M-kodu hiyerarşisi — tüm modüllerde kullanılan finansal sınıflandırma</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            title="Yenile"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { setAddingParent(true); setAddingChildFor(null); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--enba-orange)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={14} />
            Yeni Kategori
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative" style={{ maxWidth: '360px' }}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
        <input
          type="text"
          placeholder="Kod veya ad ile ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20 focus:border-[var(--enba-orange)]/30"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[var(--enba-orange)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Add parent form */}
          {addingParent && (
            <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
              <input
                autoFocus
                type="text"
                placeholder="Kod (ör. M369)"
                value={newParentCode}
                onChange={e => setNewParentCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddParent();
                  if (e.key === 'Escape') { setAddingParent(false); setNewParentName(''); setNewParentCode(''); }
                }}
                className="w-24 font-mono text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20 flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Kategori adı..."
                value={newParentName}
                onChange={e => setNewParentName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddParent();
                  if (e.key === 'Escape') { setAddingParent(false); setNewParentName(''); setNewParentCode(''); }
                }}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20"
              />
              <button
                onClick={handleAddParent}
                disabled={saving === 'new' || !newParentName.trim() || !newParentCode.trim()}
                className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => { setAddingParent(false); setNewParentName(''); setNewParentCode(''); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Table header */}
          <div className="grid grid-cols-[160px_1fr_72px_112px] border-b border-gray-100 bg-gray-50">
            <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Kod</div>
            <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Kategori Adı</div>
            <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Aktif</div>
            <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">İşlemler</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {visibleParents.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-12">
                {search ? 'Arama sonucu bulunamadı.' : 'Henüz kategori yok.'}
              </div>
            )}

            {visibleParents.map(parent => {
              const children = childrenOf(parent.code).filter(c => !search || matchesSearch(c) || matchesSearch(parent));
              const hasKids = hasChildren(parent.code);
              const isExpanded = expanded.has(parent.code) || !!(search && childrenOf(parent.code).some(matchesSearch));
              const isEditing = editingId === parent.id;
              const isSaving = saving === parent.id;

              return (
                <React.Fragment key={parent.id}>
                  {/* Parent row */}
                  <div className={`grid grid-cols-[160px_1fr_72px_112px] items-center hover:bg-gray-50/50 transition-colors ${!parent.is_active ? 'opacity-40' : ''}`}>
                    <div className="px-3 py-2.5 flex items-center gap-1.5">
                      <button
                        onClick={() => hasKids && toggleExpand(parent.code)}
                        className={`w-5 h-5 flex items-center justify-center rounded flex-shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ${!hasKids ? 'invisible' : ''}`}
                      >
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                      <span className="font-mono text-[11px] font-semibold text-gray-600 truncate">{parent.code}</span>
                      {parent.is_custom && (
                        <span className="text-[8px] font-bold bg-orange-100 text-orange-500 px-1 rounded flex-shrink-0">Özel</span>
                      )}
                    </div>
                    <div className="px-3 py-2.5 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(parent); if (e.key === 'Escape') cancelEdit(); }}
                            className="flex-1 text-sm border border-[var(--enba-orange)]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20"
                          />
                          <button onClick={() => saveEdit(parent)} disabled={isSaving} className="p-1 text-green-500 hover:text-green-600 disabled:opacity-50"><Check size={14} /></button>
                          <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-gray-800 line-clamp-1">{parent.name_tr}</span>
                          {MCODE_NOTES[parent.code] && (
                            <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{MCODE_NOTES[parent.code]}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="px-3 py-2.5 flex justify-center">
                      <button onClick={() => handleToggleActive(parent)} disabled={isSaving} className="disabled:opacity-50 transition-all">
                        {parent.is_active
                          ? <ToggleRight size={22} className="text-green-500" />
                          : <ToggleLeft size={22} className="text-gray-300" />}
                      </button>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-end gap-0.5">
                      {!isEditing && (
                        <button onClick={() => startEdit(parent)} title="Adı düzenle" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => { setAddingChildFor(parent.code); setNewChildName(''); setExpanded(prev => new Set([...prev, parent.code])); setEditingId(null); }}
                        title="Alt kategori ekle"
                        className="p-1.5 text-gray-400 hover:text-[var(--enba-orange)] hover:bg-orange-50 rounded-lg transition-all"
                      >
                        <Plus size={13} />
                      </button>
                      {parent.is_custom && (
                        <button onClick={() => handleDelete(parent)} title="Sil" className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Child rows */}
                  {isExpanded && children.map(child => {
                    const isEditingChild = editingId === child.id;
                    const isSavingChild = saving === child.id;
                    return (
                      <div key={child.id} className={`grid grid-cols-[160px_1fr_72px_112px] items-center bg-gray-50/40 hover:bg-gray-50 border-t border-gray-50 transition-colors ${!child.is_active ? 'opacity-40' : ''}`}>
                        <div className="px-3 py-2 pl-10 flex items-center gap-1.5">
                          <div className="w-3 h-px bg-gray-200 flex-shrink-0" />
                          <span className="font-mono text-[11px] text-gray-500">{child.code}</span>
                          {child.is_custom && <span className="text-[8px] font-bold bg-orange-100 text-orange-500 px-1 rounded flex-shrink-0">Özel</span>}
                        </div>
                        <div className="px-3 py-2 min-w-0">
                          {isEditingChild ? (
                            <div className="flex items-center gap-2">
                              <input
                                ref={editInputRef}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(child); if (e.key === 'Escape') cancelEdit(); }}
                                className="flex-1 text-sm border border-[var(--enba-orange)]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20"
                              />
                              <button onClick={() => saveEdit(child)} disabled={isSavingChild} className="p-1 text-green-500 hover:text-green-600 disabled:opacity-50"><Check size={14} /></button>
                              <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-gray-700 line-clamp-1">{child.name_tr}</span>
                              {MCODE_NOTES[child.code] && (
                                <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{MCODE_NOTES[child.code]}</p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="px-3 py-2 flex justify-center">
                          <button onClick={() => handleToggleActive(child)} disabled={isSavingChild} className="disabled:opacity-50">
                            {child.is_active
                              ? <ToggleRight size={22} className="text-green-500" />
                              : <ToggleLeft size={22} className="text-gray-300" />}
                          </button>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-end gap-0.5">
                          {!isEditingChild && (
                            <button onClick={() => startEdit(child)} title="Adı düzenle" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                              <Pencil size={13} />
                            </button>
                          )}
                          {child.is_custom && (
                            <button onClick={() => handleDelete(child)} title="Sil" className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add child form */}
                  {addingChildFor === parent.code && (
                    <div className="grid grid-cols-[160px_1fr_72px_112px] items-center bg-orange-50/60 border-t border-orange-100">
                      <div className="px-3 py-2.5 pl-10 flex items-center gap-1.5">
                        <div className="w-3 h-px bg-orange-200 flex-shrink-0" />
                        <span className="font-mono text-[11px] text-gray-400">
                          {financialCategoriesAPI.nextChildCode(parent.code, cats)}
                        </span>
                      </div>
                      <div className="px-3 py-2.5">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Alt kategori adı..."
                          value={newChildName}
                          onChange={e => setNewChildName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddChild(parent.code);
                            if (e.key === 'Escape') { setAddingChildFor(null); setNewChildName(''); }
                          }}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--enba-orange)]/20"
                        />
                      </div>
                      <div />
                      <div className="px-3 py-2.5 flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAddChild(parent.code)}
                          disabled={saving === 'new' || !newChildName.trim()}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => { setAddingChildFor(null); setNewChildName(''); }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">{cats.length} kategori toplam</span>
            <span className="text-xs text-gray-400">{cats.filter(c => c.is_custom).length} özel</span>
          </div>
        </div>
      )}
    </div>
  );
};
