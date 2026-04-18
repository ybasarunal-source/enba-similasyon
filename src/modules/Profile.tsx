import React, { useState, useRef } from 'react';
import { Upload, Check, X } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
}

const STORAGE_KEY = 'enba_profile_data';

const defaultProfile = (): ProfileData => ({
  name: 'Administrator',
  email: '',
  phone: '',
  bio: '',
  avatar: '',
});

const loadProfile = (): ProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile(), ...JSON.parse(raw) } : defaultProfile();
  } catch {
    return defaultProfile();
  }
};

const labelCls = 'block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5';
const inputCls =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[var(--enba-dark)] outline-none focus:border-[var(--enba-orange)] focus:bg-white transition-colors';

export const Profile: React.FC = () => {
  const [form, setForm] = useState<ProfileData>(loadProfile);
  const [saved, setSaved] = useState(false);

  // Cropper state
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawSrc(ev.target?.result as string);
      setCropPos({ x: 0, y: 0 });
      setZoom(1);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setCropPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const finalizeCrop = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 400);
    const img = imgRef.current;
    const drawScale = zoom * (400 / 300);
    ctx.drawImage(
      img, 0, 0, img.naturalWidth, img.naturalHeight,
      cropPos.x * (400 / 300), cropPos.y * (400 / 300),
      img.naturalWidth * drawScale, img.naturalHeight * drawScale
    );
    setForm(f => ({ ...f, avatar: canvas.toDataURL('image/jpeg', 0.85) }));
    setShowCropper(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--enba-dark)] tracking-tight">Profilim</h1>
          <p className="text-sm text-gray-400 mt-1">Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin.</p>
        </div>
        <span className="px-3 py-1 bg-orange-50 text-[var(--enba-orange)] text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100">
          Kişisel Hesap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 rounded-3xl overflow-hidden relative bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0">
            {form.avatar ? (
              <img src={form.avatar} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-gray-300">{initials}</span>
            )}
            <label className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2.5 text-[11px] font-semibold cursor-pointer backdrop-blur-sm flex items-center justify-center gap-1.5 hover:bg-black/70 transition-colors">
              <Upload size={12} /> Fotoğraf Yükle
              <input type="file" hidden accept="image/*" onChange={handleFile} />
            </label>
          </div>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            JPG veya PNG.<br />Maks. 5 MB.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Ad Soyad</label>
                <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls}>E-posta</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@enba.com" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Telefon No</label>
              <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5XX XXX XX XX" />
            </div>
            <div>
              <label className={labelCls}>Kısa Biyografi</label>
              <textarea
                className={inputCls + ' resize-none'}
                rows={3}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Kendinizden bahsedin..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold animate-fade-in">
                  <Check size={14} /> Kaydedildi
                </span>
              )}
              <button
                type="submit"
                className="btn-premium btn-premium-orange px-8 py-3 text-[10px]"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cropper Modal */}
      {showCropper && rawSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 w-80">
            <div className="text-center text-white">
              <h3 className="font-black text-lg">Fotoğrafı Hizalayın</h3>
              <p className="text-sm text-white/60">Sürükleyerek veya yakınlaştırarak ayarlayın.</p>
            </div>

            {/* Crop area */}
            <div
              className="w-[300px] h-[300px] rounded-3xl border-4 border-white overflow-hidden relative bg-gray-800 cursor-move select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imgRef}
                src={rawSrc}
                className="absolute pointer-events-none"
                style={{ transformOrigin: '0 0', transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${zoom})` }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.3)' }} />
            </div>

            {/* Zoom slider */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-between text-white text-xs">
                <span>Yakınlaştır</span>
                <span>%{Math.round(zoom * 100)}</span>
              </div>
              <input
                type="range" min="0.1" max="5" step="0.01"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-[var(--enba-orange)]"
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowCropper(false)}
                className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <X size={14} /> Vazgeç
              </button>
              <button
                onClick={finalizeCrop}
                className="flex-[2] py-3 rounded-2xl bg-[var(--enba-orange)] text-white text-sm font-black hover:brightness-110 transition-all"
              >
                Kırpmayı Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
