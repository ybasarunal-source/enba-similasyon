// Inline SVG icons. Stroke-based, 1.5 weight, 20x20 default.
const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none', children, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
  Revenue:   (p) => <Icon {...p}><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></Icon>,
  Expense:   (p) => <Icon {...p}><path d="M3 7l5 5 4-4 9 9"/><path d="M14 17h6v-6"/></Icon>,
  Cash:      (p) => <Icon {...p}><rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.6"/><path d="M6 6V4.5A1.5 1.5 0 017.5 3h9A1.5 1.5 0 0118 4.5V6"/></Icon>,
  Scenario:  (p) => <Icon {...p}><path d="M4 7h6"/><path d="M4 12h10"/><path d="M4 17h16"/><circle cx="13" cy="7" r="1.7"/><circle cx="17" cy="12" r="1.7"/></Icon>,
  Budget:    (p) => <Icon {...p}><path d="M12 3a9 9 0 109 9"/><path d="M12 3v9l6.4 6.4"/><path d="M21 12a9 9 0 00-9-9"/></Icon>,
  Save:      (p) => <Icon {...p}><path d="M5 4h11l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M8 4v5h7V4"/><path d="M8 14h8v6H8z"/></Icon>,
  Pdf:       (p) => <Icon {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></Icon>,
  Chevron:   (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  Search:    (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Plus:      (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Trash:     (p) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></Icon>,
  Edit:      (p) => <Icon {...p}><path d="M4 20h4l11-11-4-4L4 16v4z"/></Icon>,
  Filter:    (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Icon>,
  Up:        (p) => <Icon {...p}><path d="M7 14l5-5 5 5"/></Icon>,
  Down:      (p) => <Icon {...p}><path d="M7 10l5 5 5-5"/></Icon>,
  Calendar:  (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></Icon>,
  Logo:      (p) => <Icon {...p}><path d="M3 12l4-7h10l4 7-4 7H7z" fill="#E35205" stroke="#E35205"/><path d="M9 12h6" stroke="#fff"/></Icon>,
  Info:      (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8v.01"/></Icon>,
  Refresh:   (p) => <Icon {...p}><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></Icon>,
  Bell:      (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></Icon>,
  Sparkles:  (p) => <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z"/></Icon>,
  Bolt:      (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></Icon>,
  Check:     (p) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7"/></Icon>,
  Sun:       (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>,
  Moon:      (p) => <Icon {...p}><path d="M21 13.5A8.5 8.5 0 1110.5 3a7 7 0 0010.5 10.5z"/></Icon>,
};

window.I = I;
window.Icon = Icon;
