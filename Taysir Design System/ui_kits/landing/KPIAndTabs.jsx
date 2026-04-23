/* KPIBand + Tabs — persuasive content block for Gérants (directors).
   Exposes <KPIBand/> and <PlatformTabs/> on window. */

const KPIBand = () => {
  const wrap = {
    background:'#0F515C', color:'#fff',
    padding:'64px 0', borderTop:'1px solid #0A434C',
  };
  const inner = {
    maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px',
    display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:40,
  };
  const kpi = (num, suffix, label, color='#4ADE80') => (
    <div>
      <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:8}}>
        <div className="t-num" style={{fontSize:48,fontWeight:700,letterSpacing:'-0.025em',color:'#fff'}}>
          <CountUp to={num}/>
        </div>
        <div style={{fontSize:24,fontWeight:700,color}}>{suffix}</div>
      </div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.72)',lineHeight:1.5,maxWidth:220}}>{label}</div>
    </div>
  );
  return (
    <section style={wrap}>
      <div style={inner}>
        {kpi(92, '%',    'des élèves avec un parent notifié sous 5 min',    '#4ADE80')}
        {kpi(7,  ' h/sem', 'économisées par secrétaire, en moyenne',        '#FBBF24')}
        {kpi(0,  ' conflit','de salle ou d\u2019intervenant sur 4 semaines', '#E6F2F4')}
        {kpi(3,  'x',    'plus de paiements encaissés à l\u2019échéance',   '#4ADE80')}
      </div>
    </section>
  );
};

/* Count-up component — triggers when scrolled into view */
const CountUp = ({ to, duration = 900 }) => {
  const [v, setV] = React.useState(0);
  const ref = React.useRef(null);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / duration);
          const e = 1 - Math.pow(1 - k, 3);
          setV(Math.round(to * e));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{v}</span>;
};

/* Zoom-style "One platform. Endless ways." tabs */
const PlatformTabs = () => {
  const tabs = [
    { id:'ger', label:'Pour les Gérants',      title:'Piloter, pas subir.', body:'Tableau de bord financier consolidé, alertes en temps réel sur les impayés, et vue d\u2019ensemble de chaque salle, chaque séance, chaque équipe.',
      bullets:['Tableau de bord consolidé — revenus, présences, capacité','Alertes sur les impayés et les retards d\u2019inscription','Permissions fines sur chaque rôle et chaque module','Export comptable aux formats algériens'] },
    { id:'sec', label:'Pour les Secrétaires',   title:'Le quotidien, simplifié.', body:'Inscriptions, affectations, planning des salles, encaissements : tout se fait depuis une seule interface, sans double saisie.',
      bullets:['Dossier d\u2019inscription en 3 minutes','Détection automatique des conflits de planning','Encaissements par tranches avec reçu automatique','Relances de paiement et d\u2019absence en un clic'] },
    { id:'prof', label:'Pour les Intervenants', title:'Enseigner, pas administrer.', body:'L\u2019appel en 30 secondes depuis le téléphone, les remarques pédagogiques sauvegardées, l\u2019emploi du temps toujours à jour.',
      bullets:['Emploi du temps personnel sur mobile','Appel des présences tactile, hors-ligne','Remarques pédagogiques liées au dossier élève','Notifications instantanées en cas d\u2019annulation'] },
  ];
  const [active, setActive] = React.useState('ger');
  const tab = tabs.find(t => t.id === active);

  const section = { background:'#fff', padding:'120px 0', borderTop:'1px solid #F3F4F6' };
  const inner = { maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px' };
  const tabBar = { display:'flex', gap:4, justifyContent:'center', marginTop:40, flexWrap:'wrap' };
  const tabBtn = (a) => ({
    padding:'10px 20px', borderRadius:999, border:'1px solid transparent',
    background: a ? 'var(--brand-50)' : 'transparent',
    color: a ? 'var(--brand-900)' : 'var(--fg2)',
    fontWeight: a ? 700 : 500, fontSize:14, cursor:'pointer',
    transition:'all 220ms var(--ease)',
  });
  const body = {
    marginTop:40, display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center',
  };

  return (
    <section style={section}>
      <div style={inner}>
        <div style={{textAlign:'center'}}>
          <h2 style={{fontSize:44,letterSpacing:'-0.025em',margin:'0 auto',maxWidth:800,textWrap:'balance'}}>
            Une plateforme. <span style={{color:'var(--fg3)'}}>Trois rôles. Zéro friction.</span>
          </h2>
        </div>
        <div style={tabBar}>
          {tabs.map(t => (
            <button key={t.id} style={tabBtn(t.id === active)} onClick={() => setActive(t.id)}
              onMouseOver={e => t.id !== active && (e.currentTarget.style.background = '#F3F4F6')}
              onMouseOut={e => t.id !== active && (e.currentTarget.style.background = 'transparent')}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={body} key={active}>
          <div style={{animation:'tsFadeUp 420ms var(--ease) both'}}>
            <h3 style={{fontSize:32,letterSpacing:'-0.02em',margin:'0 0 16px'}}>{tab.title}</h3>
            <p style={{fontSize:17,color:'var(--fg2)',lineHeight:1.6,margin:'0 0 24px'}}>{tab.body}</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {tab.bullets.map(b => (
                <div key={b} style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:15,color:'var(--fg1)'}}>
                  <span style={{color:'var(--brand-500)',flexShrink:0,marginTop:3}}><Check width={16} height={16}/></span>
                  {b}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background:'linear-gradient(135deg,#E6F2F4 0%,#F9FAFB 100%)',
            borderRadius:20, padding:32, minHeight:360,
            display:'flex',alignItems:'center',justifyContent:'center',
            border:'1px solid #E5E7EB',
            animation:'tsFadeUp 420ms var(--ease) both',
          }}>
            <RoleIllustration role={active}/>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tsFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

/* Simple role illustration — a stylised stat card per role */
const RoleIllustration = ({ role }) => {
  const common = { background:'#fff', borderRadius:14, padding:'20px 22px', boxShadow:'var(--shadow-2)', border:'1px solid rgba(15,81,92,0.06)', width:'100%', maxWidth:380 };
  if (role === 'ger') {
    return (
      <div style={common}>
        <div style={{fontSize:11,fontWeight:600,color:'var(--fg3)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Avril · Total</div>
        <div className="t-num" style={{fontSize:34,fontWeight:700,color:'var(--brand-900)',letterSpacing:'-0.02em',marginTop:6}}>2 480 000 DA</div>
        <div style={{fontSize:12,color:'#15803D',fontWeight:600,marginTop:4}}>+18 % vs mars</div>
        <div style={{height:1,background:'#EEF1F3',margin:'18px 0'}}/>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
          {[40,55,42,68,72,55,82,65,90,76,85,94].map((h,i) => (
            <div key={i} style={{flex:1,height:`${h}%`,background: i===11 ? 'var(--brand-500)' : '#CFE3E7',borderRadius:'4px 4px 0 0'}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--fg3)',marginTop:6}}>
          <span>Mai</span><span>Avr</span>
        </div>
      </div>
    );
  }
  if (role === 'sec') {
    return (
      <div style={common}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--fg1)'}}>Inscription — Belkacem A.</div>
          <span style={{fontSize:10,fontWeight:600,padding:'4px 8px',borderRadius:999,background:'#DCFCE7',color:'#15803D'}}>Complet</span>
        </div>
        {['Informations personnelles','Groupe & intervenant','Tranches de paiement','Documents'].map((s,i) => (
          <div key={s} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<3?'1px solid #EEF1F3':'none'}}>
            <span style={{width:20,height:20,borderRadius:999,background:i<3?'var(--brand-500)':'#E5E7EB',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {i<3 ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <span style={{fontSize:10,color:'var(--fg3)',fontWeight:700}}>{i+1}</span>}
            </span>
            <span style={{fontSize:13,color:i<3?'var(--fg2)':'var(--fg1)',fontWeight:i===3?600:500}}>{s}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={common}>
      <div style={{fontSize:11,fontWeight:600,color:'var(--fg3)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Appel — Maths 3AS‑A</div>
      <div style={{fontSize:14,fontWeight:700,color:'var(--fg1)',marginTop:4}}>32 élèves · 08:00</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginTop:14}}>
        {Array.from({length:12}).map((_,i) => {
          const on = i % 5 !== 3;
          return (
            <div key={i} style={{
              padding:'10px 0',borderRadius:8,
              background: on ? 'rgba(26,122,137,0.1)' : 'rgba(220,38,38,0.08)',
              color: on ? 'var(--brand-700)' : '#B91C1C',
              textAlign:'center',fontSize:11,fontWeight:600,
              border: on ? '1px solid rgba(26,122,137,0.25)' : '1px solid rgba(220,38,38,0.2)',
            }}>
              {on ? 'Présent' : 'Absent'}
            </div>
          );
        })}
      </div>
      <button style={{marginTop:14,width:'100%',padding:'10px',borderRadius:8,border:'none',background:'var(--brand-500)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer l'appel</button>
    </div>
  );
};

window.KPIBand = KPIBand;
window.PlatformTabs = PlatformTabs;
window.CountUp = CountUp;
