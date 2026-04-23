/* Taysir Landing Page — shared primitives.
   Exposes icon components + a few reusable button/badge styles on window
   so sibling Babel scripts can use them. */

const C = ({ children, ...p }) => React.createElement('svg', {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', ...p
}, children);

const Check    = (p) => <C {...p}><polyline points="20 6 9 17 4 12"/></C>;
const Chevron  = (p) => <C {...p}><polyline points="9 18 15 12 9 6"/></C>;
const ChevronD = (p) => <C {...p}><polyline points="6 9 12 15 18 9"/></C>;
const ArrowR   = (p) => <C {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></C>;
const Sparkle  = (p) => <C {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></C>;
const Clock    = (p) => <C {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></C>;
const Users    = (p) => <C {...p}><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M17 11a4 4 0 0 0 0-8"/><path d="M22 21v-1a6 6 0 0 0-4-5.7"/></C>;
const Bolt     = (p) => <C {...p}><polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/></C>;
const Shield   = (p) => <C {...p}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/></C>;
const MenuIcon = (p) => <C {...p}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></C>;
const X        = (p) => <C {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></C>;

// Small logo mark component drawn inline so the nav is always sharp.
const LogoMark = ({ size = 28, color = '#1A7A89' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <g fill={color}>
      {/* Simplified cross/plus mark echoing the taysir glyph */}
      <rect x="26" y="6" width="12" height="52" rx="3"/>
      <rect x="6" y="26" width="52" height="12" rx="3"/>
      <rect x="26" y="26" width="12" height="12" fill="#fff"/>
      <rect x="28" y="28" width="8" height="8" fill={color}/>
    </g>
  </svg>
);

const Logo = ({ color = '#1A7A89', textColor }) => (
  <div style={{display:'flex',alignItems:'center',gap:10}}>
    <LogoMark size={26} color={color}/>
    <span style={{
      fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
      color: textColor || color, fontFamily: 'Inter, sans-serif'
    }}>taysir</span>
  </div>
);

Object.assign(window, { Check, Chevron, ChevronD, ArrowR, Sparkle, Clock, Users, Bolt, Shield, MenuIcon, X, LogoMark, Logo });
