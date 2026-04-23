/* Footer — dark teal, mirrors hero */
const Footer = () => {
  const cols = [
    { title: 'Produit', items: ['Fonctionnalités', 'Intégrations', 'Nouveautés', 'Feuille de route'] },
    { title: 'Entreprise', items: ['À propos', 'Clients', 'Blog', 'Carrières'] },
    { title: 'Ressources', items: ['Centre d\u2019aide', 'Documentation', 'Statut', 'Contact'] },
    { title: 'Légal', items: ['Conditions', 'Confidentialité', 'RGPD', 'Mentions légales'] },
  ];
  const wrap = { background:'#0F515C', color:'#fff', padding:'80px 0 40px' };
  const inner = { maxWidth:'var(--container)', margin:'0 auto', padding:'0 32px' };
  const grid = { display:'grid', gridTemplateColumns:'1.4fr repeat(4,1fr)', gap:40, marginBottom:56 };
  const linkStyle = {
    color:'rgba(255,255,255,0.7)', fontSize:14, textDecoration:'none', cursor:'pointer',
    display:'block', padding:'4px 0',
  };
  const colTitle = { fontSize:12,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',
    color:'rgba(255,255,255,0.5)',marginBottom:14 };
  return (
    <footer style={wrap}>
      <div style={inner}>
        <div style={grid}>
          <div>
            <Logo color="#FFFFFF" textColor="#FFFFFF"/>
            <p style={{marginTop:16,fontSize:14,color:'rgba(255,255,255,0.62)',maxWidth:280,lineHeight:1.6}}>
              Taysir rassemble vos équipes dans une interface calme, claire et collaborative.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div style={colTitle}>{c.title}</div>
              {c.items.map(it => <a key={it} style={linkStyle}>{it}</a>)}
            </div>
          ))}
        </div>
        <div style={{height:1,background:'rgba(255,255,255,0.12)',marginBottom:28}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>© 2026 Taysir. Tous droits réservés.</div>
          <div style={{display:'flex',gap:20,fontSize:13,color:'rgba(255,255,255,0.6)'}}>
            <span>🌐 Français</span><span>Paris · Tunis</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
window.Footer = Footer;
