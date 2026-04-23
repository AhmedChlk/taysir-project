/* Micro-demo — Zoom-style: large product mockup on the left,
   bullet copy on the right, animated highlight of a feature. */

const MicroDemo = () => {
  const [active, setActive] = React.useState(1); // index of highlighted row

  // Auto-cycle through the highlighted row every 2.4s
  React.useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % 6), 2400);
    return () => clearInterval(id);
  }, []);

  const sessions = [
    { time: '08:00', subj: 'Mathématiques',  group: '3AS · A',  teacher: 'Pr. Benali',   room: 'Salle 4',  tone: 'done' },
    { time: '09:45', subj: 'Physique',        group: '2AS · B',  teacher: 'Pr. Kadri',    room: 'Salle 2',  tone: 'live' },
    { time: '10:30', subj: 'Anglais',         group: '1AS',      teacher: 'Pr. Yahia',    room: 'Salle 6',  tone: 'normal' },
    { time: '13:30', subj: 'Français',        group: '1AS · A',  teacher: 'Pr. Mansouri', room: 'Salle 3',  tone: 'normal' },
    { time: '14:00', subj: 'Sciences',        group: '2AS · A',  teacher: 'Pr. Hamza',    room: 'Labo 1',   tone: 'conflict' },
    { time: '15:15', subj: 'Préparation BAC', group: 'Terminale',teacher: 'Pr. Benali',   room: 'Salle 4',  tone: 'normal' },
  ];

  const section = { background:'#F9FAFB', padding:'120px 0' };
  const inner = {
    maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px',
    display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:80, alignItems:'center',
  };

  const mockupFrame = {
    background:'#fff', borderRadius:16,
    boxShadow:'0 30px 60px -20px rgba(15,81,92,0.18), 0 0 0 1px rgba(15,81,92,0.04)',
    overflow:'hidden', border:'1px solid rgba(15,81,92,0.08)',
    transform: 'perspective(1600px) rotateY(1.5deg) rotateX(0.5deg)',
  };
  const windowBar = {
    height:38, background:'#F6F7F8', borderBottom:'1px solid #EEF1F3',
    display:'flex', alignItems:'center', padding:'0 12px', gap:8,
  };
  const dot = (c) => ({ width:10, height:10, borderRadius:999, background:c });
  const body = { padding:'22px 26px', minHeight: 420 };

  const head = {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    borderBottom:'1px solid #EFF1F3', paddingBottom:14, marginBottom:16,
  };
  const toneColor = (t) => {
    if (t === 'done')     return { bg:'#F0FDF4', fg:'#15803D', label:'Terminée', dotBg:'#22C55E' };
    if (t === 'live')     return { bg:'#E6F2F4', fg:'#0F515C', label:'En cours', dotBg:'#1A7A89' };
    if (t === 'conflict') return { bg:'#FEF3C7', fg:'#92400E', label:'Conflit',  dotBg:'#F59E0B' };
    return { bg:'#F3F4F6', fg:'#4B5563', label:'À venir', dotBg:'#9CA3AF' };
  };

  return (
    <section style={section}>
      <div style={inner}>
        {/* Left — product mockup */}
        <div style={mockupFrame}>
          <div style={windowBar}>
            <div style={dot('#F87171')}/><div style={dot('#FBBF24')}/><div style={dot('#4ADE80')}/>
            <div style={{marginLeft:16,background:'#fff',border:'1px solid #E5E7EB',
              borderRadius:6,padding:'4px 12px',fontSize:11,color:'var(--fg3)',minWidth:320,
              display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#22C55E'}}>●</span> app.taysir.dz / emploi-du-temps / mardi 23 avril
            </div>
          </div>
          <div style={body}>
            <div style={head}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:'var(--fg1)',letterSpacing:'-0.01em'}}>Mardi 23 avril</div>
                <div style={{fontSize:12,color:'var(--fg3)',marginTop:4}}>
                  6 séances · 4 salles · 184 élèves programmés
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--fg2)',background:'#F3F4F6',padding:'6px 12px',borderRadius:6}}>Jour</div>
                <div style={{fontSize:11,fontWeight:600,color:'#fff',background:'var(--brand-500)',padding:'6px 12px',borderRadius:6}}>Semaine</div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--fg2)',background:'#F3F4F6',padding:'6px 12px',borderRadius:6}}>Mois</div>
              </div>
            </div>
            {sessions.map((s, i) => {
              const t = toneColor(s.tone);
              const isActive = i === active;
              return (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'60px 1fr 130px 110px 90px',
                  alignItems:'center', gap:14,
                  padding:'12px 10px', borderRadius:10,
                  background: isActive ? 'rgba(26,122,137,0.06)' : 'transparent',
                  border: isActive ? '1px solid rgba(26,122,137,0.25)' : '1px solid transparent',
                  marginBottom:2,
                  transition: 'all 280ms var(--ease)',
                }}>
                  <div style={{
                    fontSize:13, fontWeight:700, color: isActive ? 'var(--brand-900)' : 'var(--fg1)',
                    fontVariantNumeric:'tabular-nums',
                  }}>{s.time}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:'var(--fg1)'}}>
                      {s.subj} · <span style={{color:'var(--fg3)',fontWeight:500}}>{s.group}</span>
                    </div>
                    <div style={{fontSize:11,color:'var(--fg3)',marginTop:2}}>{s.teacher}</div>
                  </div>
                  <div style={{fontSize:12,color:'var(--fg2)',display:'flex',alignItems:'center',gap:6}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>
                    {s.room}
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:600, padding:'4px 9px', borderRadius:999,
                    background:t.bg, color:t.fg, justifySelf:'start',
                    display:'inline-flex',alignItems:'center',gap:5,
                  }}>
                    <span style={{width:5,height:5,borderRadius:999,background:t.dotBg,
                      animation: s.tone==='live' ? 'tspulse-dot 1.4s ease-in-out infinite' : 'none'}}/>
                    {t.label}
                  </span>
                  <div style={{
                    fontSize:10, fontWeight:600, textAlign:'right', color:'var(--brand-500)',
                    opacity: isActive ? 1 : 0, transition:'opacity 220ms var(--ease)',
                  }}>Ouvrir →</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — copy */}
        <div>
          <div className="t-eyebrow" style={{color:'var(--brand-500)'}}>Taysir pour les Secrétaires</div>
          <h2 style={{margin:'12px 0 20px',textWrap:'balance'}}>
            Plus jamais de conflits de salle, de doublons ou d'appels oubliés.
          </h2>
          <div style={{display:'flex',flexDirection:'column',gap:18,fontSize:16,lineHeight:1.6,color:'var(--fg2)',marginBottom:32}}>
            <div style={{display:'flex',gap:12}}>
              <span style={{color:'var(--brand-500)',flexShrink:0,marginTop:3}}><Check width={18} height={18}/></span>
              <span><b style={{color:'var(--fg1)'}}>Planning en temps réel</b> — Taysir détecte automatiquement les conflits de salle, d'intervenant et de créneau avant qu'ils n'arrivent.</span>
            </div>
            <div style={{display:'flex',gap:12}}>
              <span style={{color:'var(--brand-500)',flexShrink:0,marginTop:3}}><Check width={18} height={18}/></span>
              <span><b style={{color:'var(--fg1)'}}>Appel en 30 secondes</b> — les intervenants marquent les présences depuis leur téléphone ; les parents sont notifiés instantanément.</span>
            </div>
            <div style={{display:'flex',gap:12}}>
              <span style={{color:'var(--brand-500)',flexShrink:0,marginTop:3}}><Check width={18} height={18}/></span>
              <span><b style={{color:'var(--fg1)'}}>Vue 360° de l'élève</b> — présences, paiements, documents et remarques pédagogiques dans un seul dossier.</span>
            </div>
          </div>

          <div style={{borderLeft:'3px solid var(--brand-500)',paddingLeft:18,margin:'28px 0 0'}}>
            <p style={{margin:0,fontSize:15,fontStyle:'italic',color:'var(--fg1)',lineHeight:1.55}}>
              « Avant Taysir, je passais mes lundis matin à recoller les emplois du temps sur papier.
              Aujourd'hui, c'est fait avant le café. »
            </p>
            <div style={{marginTop:12,fontSize:13,color:'var(--fg3)'}}>
              <b style={{color:'var(--fg1)'}}>Nadia B.</b> — Secrétaire, École Al-Andalus (Alger)
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tspulse-dot {
          0%,100% { box-shadow: 0 0 0 0 rgba(26,122,137,0.5); }
          50%     { box-shadow: 0 0 0 4px rgba(26,122,137,0); }
        }
      `}</style>
    </section>
  );
};
window.MicroDemo = MicroDemo;
