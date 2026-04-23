/* Navbar — fixed, white/solid over light hero (Dropbox style).
   Becomes slightly more opaque after scroll. */
const Navbar = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Produit', 'Solutions', 'Tarifs', 'Ressources'];
  const wrap = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    height: 'var(--nav-h)', display: 'flex', alignItems: 'center',
    background: scrolled ? 'rgba(255,255,255,0.92)' : '#fff',
    backdropFilter: scrolled ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
    borderBottom: scrolled ? '1px solid #EEF1F3' : '1px solid transparent',
    transition: 'all 220ms var(--ease)',
  };
  const inner = {
    maxWidth: 'var(--container)', margin: '0 auto', padding: '0 48px',
    width: '100%', display: 'flex', alignItems: 'center', gap: 32,
  };
  const linkStyle = {
    color: 'var(--fg2)', fontSize: 14, fontWeight: 500,
    textDecoration: 'none', padding: '8px 4px',
    transition: 'color 180ms var(--ease)', cursor: 'pointer',
  };
  return (
    <nav style={wrap}>
      <div style={inner}>
        <Logo color="var(--brand-500)" textColor="var(--fg1)"/>
        <div style={{display:'flex',gap:24,marginLeft:28,flex:1}}>
          {links.map(l => (
            <a key={l} style={linkStyle}
               onMouseOver={e => e.currentTarget.style.color = 'var(--fg1)'}
               onMouseOut={e => e.currentTarget.style.color = 'var(--fg2)'}>
              {l}
            </a>
          ))}
        </div>
        <a style={{...linkStyle, marginRight: 4}}>Se connecter</a>
        <button className="btn btn--primary">Commencer</button>
      </div>
    </nav>
  );
};
window.Navbar = Navbar;
