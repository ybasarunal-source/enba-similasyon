import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MINI_HEARTS = [
  { left: '4%',  size: 26, delay: 0.0, dur: 3.0 },
  { left: '14%', size: 20, delay: 0.5, dur: 2.6 },
  { left: '24%', size: 34, delay: 0.9, dur: 3.2 },
  { left: '36%', size: 22, delay: 0.3, dur: 2.8 },
  { left: '50%', size: 18, delay: 0.7, dur: 2.5 },
  { left: '62%', size: 30, delay: 0.2, dur: 3.1 },
  { left: '75%', size: 24, delay: 0.6, dur: 2.7 },
  { left: '87%', size: 28, delay: 1.1, dur: 2.9 },
];

const CSS = `
@keyframes deren-beat {
  0%,100% { transform: scale(1); }
  14%      { transform: scale(1.18); }
  28%      { transform: scale(1); }
  42%      { transform: scale(1.10); }
  70%      { transform: scale(1); }
}
@keyframes deren-float {
  0%   { opacity: 0; transform: translateY(0)   scale(0.6); }
  15%  { opacity: 1; }
  85%  { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-220px) scale(1.1); }
}
@keyframes deren-name {
  0%   { opacity: 0; transform: translateY(18px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes deren-glow {
  0%,100% { text-shadow: 0 0 24px rgba(255,140,160,0.7), 0 0 60px rgba(255,100,130,0.4); }
  50%      { text-shadow: 0 0 40px rgba(255,170,190,1),   0 0 90px rgba(255,120,150,0.7); }
}
`;

export function DerenEasterEgg() {
  const [visible, setVisible] = useState(false);
  const seqRef  = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      seqRef.current = (seqRef.current + e.key.toLowerCase()).slice(-5);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { seqRef.current = ''; }, 2500);

      if (seqRef.current === 'deren') {
        setVisible(v => !v);
        seqRef.current = '';
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!visible) return null;

  return createPortal(
    <div
      onClick={() => setVisible(false)}
      onKeyDown={e => e.key === 'Escape' && setVisible(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'radial-gradient(ellipse at center, rgba(80,0,20,0.97) 0%, rgba(10,0,5,0.98) 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <style>{CSS}</style>

      {/* Floating mini hearts */}
      {MINI_HEARTS.map((h, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '8%', left: h.left,
          fontSize: h.size, lineHeight: 1, userSelect: 'none',
          animation: `deren-float ${h.dur}s ease-in-out ${h.delay}s infinite`,
          opacity: 0,
        }}>❤️</div>
      ))}

      {/* Ana kalp */}
      <div style={{
        fontSize: 210, lineHeight: 1,
        animation: 'deren-beat 1.3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 50px rgba(255,100,130,0.85)) drop-shadow(0 0 100px rgba(255,60,100,0.4))',
        userSelect: 'none',
      }}>
        ❤️
      </div>

      {/* İsim */}
      <div style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: 80, fontWeight: 800,
        color: '#fff',
        marginTop: 8,
        letterSpacing: '0.18em',
        animation: 'deren-name 0.7s cubic-bezier(0.22,1,0.36,1) forwards, deren-glow 2.4s ease-in-out 0.7s infinite',
        opacity: 0,
        userSelect: 'none',
      }}>
        Deren
      </div>

      {/* Kapat ipucu */}
      <div style={{
        position: 'absolute', bottom: 28,
        fontFamily: 'Poppins, sans-serif',
        fontSize: 12, color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.1em',
      }}>
        dokunarak kapat
      </div>
    </div>,
    document.body
  );
}
