/* Hero — Dropbox-style: left text, right product mockup.
   Light background. Realistic Taysir (school management) mockups. */

/* ---------- Desktop product mockup: Secrétaire's student management view ---------- */
const TaysirDesktopMockup = () => {
  const shell = {
    background:'#fff', borderRadius:14, boxShadow:'var(--shadow-3)',
    width:560, height:420, overflow:'hidden', border:'1px solid #EAECEF',
    position:'relative',
  };
  const topbar = {
    height:40, background:'#fff', borderBottom:'1px solid #EFF1F3',
    display:'flex', alignItems:'center', padding:'0 12px', gap:10, fontSize:12, color:'var(--fg3)',
  };
  const body = { display:'grid', gridTemplateColumns:'54px 168px 1fr', height:380 };
  const railIcon = (active) => ({
    width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
    color: active ? 'var(--brand-500)' : 'var(--fg3)',
    background: active ? 'var(--brand-50)' : 'transparent',
  });

  const groupItem = (name, count, active) => (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 10px', fontSize:12, borderRadius:6, marginBottom:2,
      background: active ? '#EEF4F5' : 'transparent',
      color: active ? 'var(--brand-900)' : 'var(--fg2)', fontWeight: active ? 600 : 500,
    }}>
      <span style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{width:6,height:6,borderRadius:2,background: active ? 'var(--brand-500)' : '#CBD5E1'}}/>
        {name}
      </span>
      <span style={{fontSize:11,color:'var(--fg3)',fontVariantNumeric:'tabular-nums'}}>{count}</span>
    </div>
  );

  const studentRow = (idx, name, group, status) => {
    const colors = ['#DBEAFE','#FEF3C7','#FCE7F3','#D1FAE5','#E0E7FF'];
    const tone = status === 'Présent' ? {bg:'#DCFCE7',fg:'#15803D'} :
                 status === 'Retard'  ? {bg:'#FEF3C7',fg:'#92400E'} :
                 status === 'Absent'  ? {bg:'#FEE2E2',fg:'#B91C1C'} :
                                         {bg:'#E0E7FF',fg:'#3730A3'};
    return (
      <div key={idx} style={{
        display:'grid', gridTemplateColumns:'24px 1fr 90px 74px',
        alignItems:'center', gap:10, padding:'9px 12px',
        borderBottom:'1px solid #F3F4F6', fontSize:12,
      }}>
        <div style={{width:22,height:22,borderRadius:999,background:colors[idx%5],
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:10,fontWeight:600,color:'#475569'}}>{name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div style={{color:'var(--fg1)',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
        <div style={{color:'var(--fg3)',fontSize:11}}>{group}</div>
        <span style={{
          fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:999,
          background:tone.bg, color:tone.fg, justifySelf:'start',
        }}>{status}</span>
      </div>
    );
  };

  return (
    <div style={shell}>
      <div style={topbar}>
        <div style={{display:'flex',gap:6}}>
          <span style={{width:10,height:10,borderRadius:999,background:'#F87171'}}/>
          <span style={{width:10,height:10,borderRadius:999,background:'#FBBF24'}}/>
          <span style={{width:10,height:10,borderRadius:999,background:'#4ADE80'}}/>
        </div>
        <div style={{
          marginLeft:16, background:'#F3F4F6', borderRadius:6, padding:'4px 10px',
          fontSize:11, color:'var(--fg3)', minWidth:260, display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{color:'#4ADE80'}}>●</span> app.taysir.dz/eleves
        </div>
      </div>

      <div style={body}>
        <div style={{borderRight:'1px solid #EFF1F3',padding:'12px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'#FAFBFC'}}>
          <div style={{...railIcon(false),marginBottom:8}}>
            <LogoMark size={20}/>
          </div>
          <div style={railIcon(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>
          </div>
          <div style={railIcon(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M17 11a4 4 0 0 0 0-8"/></svg>
          </div>
          <div style={railIcon(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>
          </div>
          <div style={railIcon(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
          </div>
        </div>

        <div style={{borderRight:'1px solid #EFF1F3',padding:'14px 10px',background:'#fff'}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--fg3)',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0 10px 8px'}}>Groupes</div>
          {groupItem('Toutes les classes', 248, false)}
          {groupItem('Mathématiques 3AS', 32, true)}
          {groupItem('Physique 2AS',       28, false)}
          {groupItem('Français 1AS',       24, false)}
          {groupItem('Anglais B1',         18, false)}
          {groupItem('Préparation BAC',    40, false)}
          <div style={{height:1,background:'#F3F4F6',margin:'10px 6px'}}/>
          <div style={{fontSize:11,color:'var(--brand-500)',fontWeight:600,padding:'4px 10px',cursor:'pointer'}}>+ Nouveau groupe</div>
        </div>

        <div style={{background:'#fff',overflow:'hidden'}}>
          <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--fg1)'}}>Mathématiques 3AS</div>
              <div style={{fontSize:11,color:'var(--fg3)',marginTop:2}}>32 élèves · Pr. Benali · Salle 4</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--fg2)',background:'#F3F4F6',padding:'5px 10px',borderRadius:6}}>Présences</div>
              <div style={{fontSize:11,fontWeight:600,color:'#fff',background:'var(--brand-500)',padding:'5px 10px',borderRadius:6}}>+ Ajouter</div>
            </div>
          </div>
          <div style={{
            display:'grid', gridTemplateColumns:'24px 1fr 90px 74px', gap:10,
            padding:'8px 12px', fontSize:10, fontWeight:600, color:'var(--fg3)',
            textTransform:'uppercase', letterSpacing:'0.06em',
            borderBottom:'1px solid #EFF1F3', background:'#FAFBFC',
          }}>
            <div></div><div>Élève</div><div>Groupe</div><div>Séance</div>
          </div>
          {studentRow(0,'Amina Belkacem','3AS · A','Présent')}
          {studentRow(1,'Youcef Hamidi','3AS · A','Retard')}
          {studentRow(2,'Salma Ouadah','3AS · A','Présent')}
          {studentRow(3,'Karim Mezrag','3AS · A','Absent')}
          {studentRow(4,'Lina Bouras','3AS · B','Présent')}
          {studentRow(5,'Rayan Cherif','3AS · B','Justifié')}
          {studentRow(6,'Nour Saadi','3AS · B','Présent')}
        </div>
      </div>
    </div>
  );
};

/* ---------- Realistic phone mockup: iPhone-style bezel, glossy frame,
   "Faire l'appel" flow with live session ---------- */
const TaysirPhoneMockup = () => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1600);
    return () => clearInterval(id);
  }, []);
  // Students whose presence is "filled in" grows over time
  const filled = Math.min(9, tick);

  // Outer device: realistic iPhone 14 Pro bezel
  const device = {
    position:'absolute', right:-56, bottom:-60, width:240, height:490,
    background:'linear-gradient(160deg, #1C1F24 0%, #0B0D10 100%)',
    borderRadius:44, padding:5,
    boxShadow:
      '0 40px 80px -20px rgba(15,81,92,0.35),' +
      '0 10px 30px -6px rgba(0,0,0,0.22),' +
      'inset 0 0 0 1.5px rgba(255,255,255,0.08),' +
      'inset 0 2px 3px rgba(255,255,255,0.12)',
  };
  // Inner bezel (deep black)
  const inner = {
    width:'100%', height:'100%', background:'#000',
    borderRadius:40, padding:3, boxSizing:'border-box',
  };
  const screen = {
    width:'100%', height:'100%', background:'#F7F8FA',
    borderRadius:37, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column',
  };
  const dynamicIsland = {
    position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
    width:86, height:24, background:'#000', borderRadius:999, zIndex:3,
  };
  const statusBar = {
    height:34, display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'10px 22px 0', fontSize:11.5, fontWeight:600, color:'var(--fg1)',
  };
  const header = {
    padding:'14px 16px 12px',
    background:'#fff', borderBottom:'1px solid #F0F2F5',
  };

  const initials = ['AB','YH','SO','KM','LB','RC','NS','MK','HD'];
  const names    = ['Amina','Youcef','Salma','Karim','Lina','Rayan','Nour','Mounir','Hadil'];
  const tones = ['#DBEAFE','#FEF3C7','#FCE7F3','#D1FAE5','#E0E7FF','#FEE2E2','#DBEAFE','#F3E8FF','#FFEDD5'];

  return (
    <div style={device}>
      {/* Side buttons */}
      <div style={{position:'absolute',left:-2,top:96,width:3,height:22,borderRadius:2,background:'#0B0D10'}}/>
      <div style={{position:'absolute',left:-2,top:140,width:3,height:44,borderRadius:2,background:'#0B0D10'}}/>
      <div style={{position:'absolute',left:-2,top:196,width:3,height:44,borderRadius:2,background:'#0B0D10'}}/>
      <div style={{position:'absolute',right:-2,top:150,width:3,height:66,borderRadius:2,background:'#0B0D10'}}/>

      <div style={inner}>
        <div style={screen}>
          <div style={dynamicIsland}/>

          <div style={statusBar}>
            <span style={{fontVariantNumeric:'tabular-nums'}}>9:41</span>
            <span style={{display:'flex',gap:5,alignItems:'center'}}>
              <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor">
                <rect x="0"  y="6" width="2" height="4" rx="0.5"/>
                <rect x="4"  y="4" width="2" height="6" rx="0.5"/>
                <rect x="8"  y="2" width="2" height="8" rx="0.5"/>
                <rect x="12" y="0" width="2" height="10" rx="0.5"/>
              </svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M1 4 A8 8 0 0 1 13 4"/>
                <path d="M3 6 A5 5 0 0 1 11 6"/>
                <path d="M5 8 A2 2 0 0 1 9 8"/>
              </svg>
              <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
                <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.35"/>
                <rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor"/>
                <rect x="21" y="4" width="1.5" height="3" rx="0.75" fill="currentColor" fillOpacity="0.4"/>
              </svg>
            </span>
          </div>

          <div style={header}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <LogoMark size={18} color="var(--brand-500)"/>
              <div style={{fontSize:13,fontWeight:700,color:'var(--fg1)',letterSpacing:'-0.01em'}}>Appel en cours</div>
              <span style={{marginLeft:'auto',fontSize:9,fontWeight:700,color:'#15803D',
                background:'#DCFCE7',padding:'3px 7px',borderRadius:999,display:'inline-flex',alignItems:'center',gap:4}}>
                <span style={{width:5,height:5,borderRadius:999,background:'#22C55E',
                  boxShadow:'0 0 0 0 rgba(34,197,94,0.6)',animation:'tsDotPulse 1.4s infinite'}}/>
                Live
              </span>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--fg1)',letterSpacing:'-0.01em'}}>
              Maths · 3AS‑A
            </div>
            <div style={{fontSize:11,color:'var(--fg3)',marginTop:2}}>
              Salle 4 · 09:45 – 11:15 · 32 élèves
            </div>

            {/* Progress bar */}
            <div style={{marginTop:12,height:5,borderRadius:999,background:'#EEF1F3',overflow:'hidden'}}>
              <div style={{
                height:'100%',width:`${(filled/9)*100}%`,
                background:'linear-gradient(90deg,var(--brand-500),#2B9FB0)',
                borderRadius:999,transition:'width 600ms var(--ease)',
              }}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'var(--fg3)'}}>
              <span>{filled} / 9 élèves marqués</span>
              <span style={{fontWeight:600,color:'var(--brand-500)'}}>
                {Math.round((filled/9)*100)} %
              </span>
            </div>
          </div>

          {/* Student grid — taps light up over time */}
          <div style={{flex:1,background:'#F7F8FA',padding:'12px 12px 0',overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {initials.map((ini, i) => {
                const isFilled = i < filled;
                const present = isFilled && i % 5 !== 3;
                return (
                  <div key={i} style={{
                    background:'#fff',borderRadius:12,padding:'10px 6px',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:5,
                    border: isFilled
                      ? (present ? '1.5px solid rgba(26,122,137,0.35)' : '1.5px solid rgba(220,38,38,0.3)')
                      : '1px solid #EEF1F3',
                    boxShadow: isFilled ? '0 2px 6px -1px rgba(15,81,92,0.08)' : 'none',
                    transition:'all 340ms var(--ease)',
                    animation: isFilled ? 'tsPop 300ms var(--ease) both' : 'none',
                  }}>
                    <div style={{width:28,height:28,borderRadius:999,background:tones[i],
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,color:'#475569'}}>{ini}</div>
                    <div style={{fontSize:9,fontWeight:600,color:'var(--fg1)'}}>{names[i]}</div>
                    {isFilled ? (
                      <div style={{
                        fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:999,
                        background: present ? 'rgba(26,122,137,0.12)' : 'rgba(220,38,38,0.1)',
                        color: present ? 'var(--brand-700)' : '#B91C1C',
                      }}>{present ? 'Présent' : 'Absent'}</div>
                    ) : (
                      <div style={{fontSize:8,color:'var(--fg3)'}}>—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky action */}
          <div style={{padding:'10px 12px 12px',background:'#F7F8FA',borderTop:'1px solid #EEF1F3'}}>
            <button style={{
              width:'100%',padding:'11px 0',borderRadius:12,border:'none',
              background:'var(--brand-500)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',
              boxShadow:'0 6px 14px -4px rgba(26,122,137,0.4)',
            }}>
              {filled < 9 ? 'Marquer tout · Présent' : '✓ Enregistrer l\u2019appel'}
            </button>
          </div>

          {/* Home indicator */}
          <div style={{position:'absolute',bottom:5,left:'50%',transform:'translateX(-50%)',
            width:92,height:4,borderRadius:999,background:'#0B0D10'}}/>
        </div>
      </div>
      <style>{`
        @keyframes tsPop { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes tsDotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5) }
          50%     { box-shadow: 0 0 0 4px rgba(34,197,94,0) }
        }
      `}</style>
    </div>
  );
};

const Hero = () => {
  const section = {
    background:'#fff', paddingTop:'calc(var(--nav-h) + 56px)', paddingBottom:100,
    borderBottom:'1px solid #F3F4F6', position:'relative', overflow:'hidden',
  };
  const inner = {
    maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px',
    display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center',
  };
  const badge = {
    display:'inline-flex', alignItems:'center', gap:8,
    background:'var(--brand-50)', color:'var(--brand-900)',
    border:'1px solid #CFE3E7', borderRadius:999,
    padding:'5px 12px', fontSize:12, fontWeight:600, marginBottom:22,
  };
  return (
    <section style={section}>
      <div style={inner}>
        <div style={{animation:'tsHeroIn 700ms var(--ease) both'}}>
          <div style={badge}>
            <span style={{width:6,height:6,borderRadius:999,background:'var(--brand-500)'}}/>
            Plateforme n° 1 pour les écoles en Algérie
          </div>
          <h1 style={{fontSize:60,lineHeight:1.05,fontWeight:700,letterSpacing:'-0.025em',color:'var(--fg1)',margin:0,textWrap:'balance'}}>
            Pilotez votre école,<br/>sans le chaos.
          </h1>
          <p style={{fontSize:19,lineHeight:1.55,color:'var(--fg2)',margin:'22px 0 32px',maxWidth:480}}>
            Taysir réunit inscriptions, présences, emplois du temps et paiements
            dans une seule plateforme pensée pour les établissements éducatifs algériens.
          </p>
          <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn btn--primary btn--lg">
              Essayer Taysir gratuitement <ArrowR width={18} height={18}/>
            </button>
            <button className="btn btn--ghost btn--lg">Voir une démo</button>
          </div>
          <div style={{display:'flex',gap:22,marginTop:36,fontSize:13,color:'var(--fg3)',flexWrap:'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:6}}>
              <Check width={15} height={15} stroke="var(--brand-500)"/> 14 jours d'essai
            </span>
            <span style={{display:'flex',alignItems:'center',gap:6}}>
              <Check width={15} height={15} stroke="var(--brand-500)"/> Sans carte bancaire
            </span>
            <span style={{display:'flex',alignItems:'center',gap:6}}>
              <Check width={15} height={15} stroke="var(--brand-500)"/> Support RTL
            </span>
          </div>
        </div>

        <div style={{position:'relative',display:'flex',justifyContent:'center',alignItems:'center',minHeight:500,animation:'tsHeroIn 800ms 120ms var(--ease) both'}}>
          <TaysirDesktopMockup/>
          <TaysirPhoneMockup/>
        </div>
      </div>
      <style>{`
        @keyframes tsHeroIn {
          from { opacity: 0; transform: translateY(14px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </section>
  );
};
window.Hero = Hero;
