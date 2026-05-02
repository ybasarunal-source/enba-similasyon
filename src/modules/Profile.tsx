import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, X, Linkedin, Twitter, Instagram, Globe, Github, MapPin, Building2, Briefcase, Calendar } from 'lucide-react';
import { supabase } from '../api/supabase';

interface ProfileData {
  // Kişisel
  name: string;
  title: string;
  department: string;
  location: string;
  startDate: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  // Sosyal medya
  linkedin: string;
  twitter: string;
  instagram: string;
  github: string;
  website: string;
}

const defaultProfile = (): ProfileData => ({
  name: 'Administrator',
  title: '',
  department: '',
  location: '',
  startDate: '',
  email: '',
  phone: '',
  bio: '',
  avatar: '',
  linkedin: '',
  twitter: '',
  instagram: '',
  github: '',
  website: '',
});



const labelCls = 'block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5';
const inputCls =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[var(--enba-dark)] outline-none focus:border-[var(--enba-orange)] focus:bg-white transition-colors';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-[11px] font-black text-[var(--enba-dark)] uppercase tracking-[0.12em]">{children}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

const SocialInput: React.FC<{
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
}> = ({ icon, label, placeholder, value, onChange, color }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${color}`}>{icon}</div>
      <input
        className={inputCls + ' pl-10'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

export const Profile: React.FC = () => {
  const [form, setForm] = useState<ProfileData>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const cloud = user?.user_metadata?.profile_data as Partial<ProfileData> & { avatarUrl?: string } | undefined;
      if (cloud) {
        setForm({ ...defaultProfile(), ...cloud, avatar: cloud.avatarUrl || '' });
      }
    })();
  }, []);
  const set = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Cropper state
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.01);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const VIEWPORT = 300;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Cover: scale so the shorter edge fills the 300px viewport
        const coverZoom = VIEWPORT / Math.min(img.naturalWidth, img.naturalHeight);
        // Center the image inside the viewport
        const visW = img.naturalWidth * coverZoom;
        const visH = img.naturalHeight * coverZoom;
        setRawSrc(src);
        setZoom(coverZoom);
        setMinZoom(coverZoom * 0.25);
        setCropPos({ x: (VIEWPORT - visW) / 2, y: (VIEWPORT - visH) / 2 });
        setShowCropper(true);
      };
      img.src = src;
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

  const finalizeCrop = async () => {
    if (!imgRef.current) return;
    setIsUploading(true);
    const OUTPUT = 400;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const s = OUTPUT / VIEWPORT;
    ctx.translate(cropPos.x * s, cropPos.y * s);
    ctx.scale(zoom * s, zoom * s);
    const img = imgRef.current;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsUploading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Kullanıcı bulunamadı');
        
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
          
        if (uploadError) {
          console.error('Avatar yüklenemedi:', uploadError);
          alert("Fotoğraf yüklenemedi. Lütfen avatars bucket'ının kurulu ve public olduğundan emin olun.");
          setIsUploading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        setForm(f => ({ ...f, avatar: publicUrl }));
        setShowCropper(false);
      } catch (err) {
        console.error('Avatar yükleme hatası:', err);
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, title, department, location, startDate, email, phone, bio,
            linkedin, twitter, instagram, github, website, avatar } = form;
    try {
      await supabase.auth.updateUser({
        data: { profile_data: { name, title, department, location, startDate, email, phone, bio,
                                linkedin, twitter, instagram, github, website, avatarUrl: avatar } }
      });
    } catch (err) {
      console.warn('Supabase profil senkronizasyonu başarısız:', err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };


  const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--enba-dark)] tracking-tight">Profilim</h1>
          <p className="text-sm text-gray-400 mt-1">Kişisel bilgilerinizi ve sosyal medya hesaplarınızı yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-orange-50 text-[var(--enba-orange)] text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100">
            Kişisel Hesap
          </span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">

          {/* Sol: Avatar + özet kart */}
          <div className="flex flex-col items-center gap-5">
            {/* Avatar */}
            <div className="w-52 h-52 rounded-3xl overflow-hidden relative bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0">
              {form.avatar ? (
                <img src={form.avatar} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-gray-300">{initials}</span>
              )}
              <label className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2.5 text-[11px] font-semibold cursor-pointer backdrop-blur-sm flex items-center justify-center gap-1.5 hover:bg-black/70 transition-colors">
                <Upload size={12} /> Fotoğraf Yükle
                <input type="file" hidden accept="image/*" onChange={handleFile} />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">JPG veya PNG. Maks. 5 MB.</p>

            {/* Mini önizleme kartı */}
            {(form.name || form.title) && (
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-sm font-black text-[var(--enba-dark)] truncate">{form.name}</div>
                {form.title && <div className="text-[11px] text-[var(--enba-orange)] font-semibold mt-0.5 truncate">{form.title}</div>}
                {form.department && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{form.department}</div>}
                {form.location && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400">
                    <MapPin size={10} />{form.location}
                  </div>
                )}
                {/* Sosyal ikonlar önizleme */}
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  {form.linkedin  && <a href={form.linkedin}  target="_blank" rel="noreferrer" className="text-[#0A66C2] hover:opacity-80"><Linkedin  size={14}/></a>}
                  {form.twitter   && <a href={form.twitter}   target="_blank" rel="noreferrer" className="text-[#1DA1F2] hover:opacity-80"><Twitter   size={14}/></a>}
                  {form.instagram && <a href={form.instagram} target="_blank" rel="noreferrer" className="text-[#E1306C] hover:opacity-80"><Instagram size={14}/></a>}
                  {form.github    && <a href={form.github}    target="_blank" rel="noreferrer" className="text-gray-700 hover:opacity-80"><Github    size={14}/></a>}
                  {form.website   && <a href={form.website}   target="_blank" rel="noreferrer" className="text-gray-500 hover:opacity-80"><Globe     size={14}/></a>}
                </div>
              </div>
            )}
          </div>

          {/* Sağ: Formlar */}
          <div className="flex flex-col gap-6">

            {/* Kişisel Bilgiler */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
              <SectionTitle>Kişisel Bilgiler</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ad Soyad</label>
                  <input className={inputCls} value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className={labelCls}>Ünvan / Pozisyon</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={inputCls + ' pl-9'} value={form.title} onChange={set('title')} placeholder="Operasyon Müdürü" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Departman</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={inputCls + ' pl-9'} value={form.department} onChange={set('department')} placeholder="Operasyon" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Lokasyon</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={inputCls + ' pl-9'} value={form.location} onChange={set('location')} placeholder="İstanbul, Türkiye" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>İşe Başlama Tarihi</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={inputCls + ' pl-9'} type="date" value={form.startDate} onChange={set('startDate')} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Telefon No</label>
                  <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+90 5XX XXX XX XX" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>E-posta</label>
                  <input className={inputCls} type="email" value={form.email} onChange={set('email')} placeholder="ornek@enba.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Kısa Biyografi</label>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={3}
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Kendinizden, uzmanlık alanlarınızdan veya ilgi alanlarınızdan bahsedin..."
                  />
                </div>
              </div>
            </div>

            {/* Sosyal Medya */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
              <SectionTitle>Sosyal Medya & Bağlantılar</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SocialInput
                  icon={<Linkedin size={14} />}
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/kullaniciadi"
                  value={form.linkedin}
                  onChange={v => setForm(f => ({ ...f, linkedin: v }))}
                  color="text-[#0A66C2]"
                />
                <SocialInput
                  icon={<Twitter size={14} />}
                  label="X / Twitter"
                  placeholder="https://x.com/kullaniciadi"
                  value={form.twitter}
                  onChange={v => setForm(f => ({ ...f, twitter: v }))}
                  color="text-[#1DA1F2]"
                />
                <SocialInput
                  icon={<Instagram size={14} />}
                  label="Instagram"
                  placeholder="https://instagram.com/kullaniciadi"
                  value={form.instagram}
                  onChange={v => setForm(f => ({ ...f, instagram: v }))}
                  color="text-[#E1306C]"
                />
                <SocialInput
                  icon={<Github size={14} />}
                  label="GitHub"
                  placeholder="https://github.com/kullaniciadi"
                  value={form.github}
                  onChange={v => setForm(f => ({ ...f, github: v }))}
                  color="text-gray-700"
                />
                <div className="sm:col-span-2">
                  <SocialInput
                    icon={<Globe size={14} />}
                    label="Kişisel Web Sitesi"
                    placeholder="https://www.orneksite.com"
                    value={form.website}
                    onChange={v => setForm(f => ({ ...f, website: v }))}
                    color="text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Kaydet */}
            <div className="flex items-center justify-end gap-4">
              {saved && (
                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold animate-fade-in">
                  <Check size={14} /> Kaydedildi
                </span>
              )}
              <button type="submit" className="btn-premium btn-premium-orange px-8 py-3 text-[10px]">
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Cropper Modal */}
      {showCropper && rawSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 w-80">
            <div className="text-center text-white">
              <h3 className="font-black text-lg">Fotoğrafı Hizalayın</h3>
              <p className="text-sm text-white/60">Sürükleyerek veya yakınlaştırarak ayarlayın.</p>
            </div>
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
                className="absolute pointer-events-none max-w-none max-h-none"
                style={{ transformOrigin: '0 0', transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${zoom})` }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.3)' }} />
            </div>
            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-between text-white text-xs">
                <span>Yakınlaştır</span>
                <span>%{Math.round(zoom * 100)}</span>
              </div>
              <input
                type="range" min={minZoom} max={Math.max(5, zoom * 2)} step={0.001}
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
                disabled={isUploading}
                className="flex-[2] py-3 rounded-2xl bg-[var(--enba-orange)] text-white text-sm font-black hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Yükleniyor...' : 'Kırpmayı Tamamla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
