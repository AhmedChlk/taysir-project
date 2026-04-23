/* Pricing — Notion-style, 4 cards in 2 groups, Annual default with DZD prices */
const Pricing = () => {
  const [annual, setAnnual] = React.useState(true);

  // Prices in DZD / mois / élève, annual is discounted ~20%
  const plans = [
    {
      name:'Découverte', tagline:'Pour les petites structures qui démarrent.',
      priceA: 0, priceM: 0,
      cta:'Créer mon école', ghost:true,
      groupTitle:"Pour s'organiser au quotidien.",
      features:['Jusqu\u2019à 50 élèves','1 secrétaire, 3 intervenants','Emploi du temps simple','Présences & paiements basiques','Support par email'],
    },
    {
      name:'Essentiel', tagline:'Pour la plupart des écoles privées.',
      priceA: 120, priceM: 150,
      cta:'Commencer l\u2019essai', ghost:true,
      groupTitle:"Pour s'organiser au quotidien.",
      features:['Élèves illimités','Utilisateurs illimités','Détection de conflits de salle','Notifications SMS aux parents','Paiements par tranches','Export comptable'],
    },
    {
      name:'Pro', tagline:'Pour les établissements qui veulent piloter.',
      priceA: 220, priceM: 275,
      cta:'Essayer Pro', ghost:false, featured:true,
      groupTitle:'Pour piloter et croître.',
      features:['Tout Essentiel, plus :','Tableau de bord financier','Rapports personnalisés','Module de communication avancé','Support RTL (arabe)','Accompagnement dédié'],
    },
    {
      name:'Entreprise', tagline:'Pour les réseaux d\u2019écoles & universités.',
      priceA: null, priceM: null,
      cta:'Contacter l\u2019équipe', ghost:true,
      groupTitle:'Pour piloter et croître.',
      features:['Tout Pro, plus :','Multi-établissements','SSO & journaux d\u2019audit','API & intégrations','SLA 99,9 %','CSM dédié'],
    },
  ];

  const left  = plans.slice(0, 2);
  const right = plans.slice(2, 4);

  const section = { background:'#fff', padding:'120px 0', borderTop:'1px solid #F3F4F6' };
  const inner = { maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px' };
  const header = { textAlign:'center', marginBottom:44 };
  const cols = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 };
  const group = { padding:'32px 4px 0' };
  const groupGrid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 };
  const renderPrice = (p) => {
    if (p.priceA === null) return <div className="t-num" style={{fontSize:36,fontWeight:700,letterSpacing:'-0.02em'}}>Sur devis</div>;
    const price = annual ? p.priceA : p.priceM;
    if (price === 0) return <div className="t-num" style={{fontSize:40,fontWeight:700,letterSpacing:'-0.02em'}}>Gratuit</div>;
    return (
      <div style={{display:'flex',alignItems:'baseline',gap:6}}>
        <div className="t-num" style={{fontSize:40,fontWeight:700,letterSpacing:'-0.02em'}}>{price}</div>
        <div style={{fontSize:14,color:'var(--fg3)'}}>DA / élève / mois</div>
      </div>
    );
  };

  return (
    <section style={section}>
      <div style={inner}>
        <div style={header}>
          <div className="t-eyebrow">Tarification</div>
          <h2 style={{margin:'12px auto 20px',maxWidth:720,textWrap:'balance'}}>
            Une tarification simple. Pas de surprise.
          </h2>
          <div style={{display:'inline-flex',alignItems:'center',gap:12}}>
            <div className="toggle-pill">
              <button className={!annual ? 'on' : ''} onClick={() => setAnnual(false)}>Mensuel</button>
              <button className={annual ? 'on' : ''} onClick={() => setAnnual(true)}>Annuel</button>
            </div>
            <span style={{fontSize:12,fontWeight:700,padding:'5px 10px',borderRadius:999,background:'#DCFCE7',color:'#15803D'}}>− 20 % annuel</span>
          </div>
        </div>

        <div style={cols}>
          {[{items:left,title:left[0].groupTitle},{items:right,title:right[0].groupTitle}].map((g, gi) => (
            <div key={gi} style={group}>
              <div style={{fontSize:20,fontWeight:700,color:'var(--fg1)',letterSpacing:'-0.01em',marginBottom:20}}>
                {g.title}
              </div>
              <div style={groupGrid}>
                {g.items.map(p => (
                  <div key={p.name} className={'pricing-card' + (p.featured ? ' pricing-card--feature' : '')}>
                    {p.featured && <div className="pricing-badge">Recommandé</div>}
                    <div style={{fontSize:16,fontWeight:700,color:'var(--fg1)'}}>{p.name}</div>
                    <div style={{margin:'18px 0 4px'}}>{renderPrice(p)}</div>
                    <div style={{fontSize:12,color:'var(--fg3)',minHeight:34,marginBottom:14}}>
                      {p.tagline}
                    </div>
                    <button className={'btn ' + (p.ghost ? 'btn--ghost' : 'btn--primary')} style={{width:'100%',justifyContent:'center'}}>
                      {p.cta}
                    </button>
                    <div style={{height:1,background:'#EEF1F3',margin:'20px 0 16px'}}/>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--fg2)',marginBottom:10}}>
                      {p.features[0].startsWith('Tout ') ? p.features[0] : 'Inclus :'}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {(p.features[0].startsWith('Tout ') ? p.features.slice(1) : p.features).map(f => (
                        <div key={f} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:'var(--fg2)'}}>
                          <span style={{color:'var(--brand-500)',flexShrink:0,marginTop:2}}><Check width={14} height={14}/></span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
window.Pricing = Pricing;
