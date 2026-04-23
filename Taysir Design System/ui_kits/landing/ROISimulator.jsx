/* ROI simulator — Notion-style: tools-checkbox + team size input → monthly & annual savings */
const ROISimulator = () => {
  // Each "pain point" = a recurring cost Taysir replaces.
  // Price is per-month, per-school (or per-user where marked).
  const pains = [
    { id:'paper',    name:'Registres papier & impressions',    price: 4500,  unit:'/mois',   dflt:true },
    { id:'excel',    name:'Fichiers Excel dispersés',           price: 2200,  unit:'/mois',   dflt:true },
    { id:'sms',      name:'SMS manuels aux parents',            price: 3800,  unit:'/mois',   dflt:true },
    { id:'planning', name:'Outil de planning externe',          price: 6500,  unit:'/mois',   dflt:false },
    { id:'pay',      name:'Suivi des paiements manuel',         price: 1500, unit:'/élève/an', dflt:true,  perStudent:true },
    { id:'absent',   name:'Relances d\u2019absence (appels)',   price: 2800,  unit:'/mois',   dflt:false },
    { id:'docs',     name:'Classement documents physiques',     price: 1800,  unit:'/mois',   dflt:false },
    { id:'reports',  name:'Rapports trimestriels manuels',      price: 3500,  unit:'/mois',   dflt:false },
  ];

  const [selected, setSelected] = React.useState(() => new Set(pains.filter(p=>p.dflt).map(p=>p.id)));
  const [students, setStudents] = React.useState(180);

  const toggle = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Monthly cost replaced = sum of selected items (per-student items prorated)
  const monthly = React.useMemo(() => {
    let total = 0;
    for (const p of pains) {
      if (!selected.has(p.id)) continue;
      total += p.perStudent ? (p.price * students) / 12 : p.price;
    }
    return Math.round(total);
  }, [selected, students]);
  const annual = monthly * 12;

  // Tween displayed numbers
  const useTween = (target) => {
    const [v, setV] = React.useState(target);
    const ref = React.useRef();
    React.useEffect(() => {
      cancelAnimationFrame(ref.current);
      const start = v, delta = target - start, t0 = performance.now(), dur = 420;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        setV(Math.round(start + delta * e));
        if (k < 1) ref.current = requestAnimationFrame(step);
      };
      ref.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(ref.current);
      // eslint-disable-next-line
    }, [target]);
    return v;
  };
  const dMonthly = useTween(monthly);
  const dAnnual = useTween(annual);

  const section = { background:'#fff', padding:'120px 0' };
  const inner = {
    maxWidth:'var(--container)', margin:'0 auto', padding:'0 48px',
    display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center',
    marginBottom:48,
  };

  const card = {
    maxWidth:'calc(var(--container) - 96px)', margin:'0 auto',
    background:'#fff', borderRadius:18, boxShadow:'var(--shadow-2)',
    border:'1px solid #EDEFF2', padding:'36px 40px',
  };

  const rowCheck = (p) => {
    const on = selected.has(p.id);
    return (
      <label key={p.id} style={{
        display:'flex', alignItems:'center', gap:12, cursor:'pointer',
        padding:'10px 4px', userSelect:'none',
      }}>
        <span style={{
          width:20, height:20, borderRadius:6, flexShrink:0,
          border: on ? '1.5px solid var(--brand-500)' : '1.5px solid #CBD5E1',
          background: on ? 'var(--brand-500)' : '#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 180ms var(--ease)',
        }}>
          {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </span>
        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} style={{display:'none'}}/>
        <span style={{fontSize:14,fontWeight:500,color:'var(--fg1)',flex:1}}>{p.name}</span>
        <span style={{fontSize:12,color:'var(--fg3)',fontVariantNumeric:'tabular-nums'}}>
          {p.perStudent
            ? `${p.price} DA ${p.unit}`
            : `${p.price.toLocaleString('fr-FR')} DA ${p.unit}`}
        </span>
      </label>
    );
  };

  return (
    <section style={section}>
      <div style={inner}>
        <div>
          <div className="t-eyebrow">Simulateur de rentabilité</div>
          <h2 style={{margin:'12px 0 16px',textWrap:'balance'}}>
            Plus d'administration. Moins d'outils.
          </h2>
          <p style={{fontSize:17,color:'var(--fg2)',margin:0,maxWidth:480,lineHeight:1.55}}>
            Cochez tout ce que votre école gère aujourd'hui à la main ou avec des outils dispersés.
            Taysir le remplace — et vous montre combien vous économisez, dès le premier mois.
          </p>
        </div>

        {/* Stack of "crossed-out tools" illustration, Notion-style */}
        <div style={{position:'relative',display:'flex',gap:12,justifyContent:'center',alignItems:'center',flexWrap:'wrap',padding:'20px 0'}}>
          {['Excel','WhatsApp','Cahier','Word','Post-it','PDF','SMS','Agenda','Fax'].map((t,i) => (
            <div key={t} style={{
              background:'#F3F4F6', borderRadius:12, padding:'10px 14px',
              fontSize:13, fontWeight:600, color:'var(--fg3)',
              position:'relative', overflow:'hidden',
            }}>
              {t}
            </div>
          ))}
          {/* The crossing-out line */}
          <svg style={{position:'absolute',top:'50%',left:0,width:'100%',height:60,transform:'translateY(-50%)',pointerEvents:'none'}}
               viewBox="0 0 400 60" preserveAspectRatio="none">
            <path d="M 10 42 Q 200 10, 390 36" stroke="#0B1220" strokeWidth="2.5" fill="none" strokeLinecap="round"
                  style={{strokeDasharray: 900, strokeDashoffset:0, animation:'tsStrike 1.2s var(--ease) both'}}/>
          </svg>
        </div>
      </div>

      <div style={card}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:24}}>
          {pains.map(rowCheck)}
        </div>

        <div style={{height:1,background:'#EEF1F3',margin:'20px 0'}}/>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',alignItems:'center',gap:24}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--fg3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Nombre d'élèves</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={() => setStudents(s => Math.max(20, s - 20))}
                style={{width:32,height:32,borderRadius:8,border:'1px solid #E5E7EB',background:'#fff',cursor:'pointer',fontSize:16,color:'var(--fg2)'}}>−</button>
              <input type="number" value={students}
                onChange={e => setStudents(Math.max(1, Math.min(5000, Number(e.target.value) || 0)))}
                style={{width:90,padding:'7px 10px',textAlign:'center',border:'1px solid #E5E7EB',borderRadius:8,fontSize:15,fontWeight:600,fontVariantNumeric:'tabular-nums'}}/>
              <button onClick={() => setStudents(s => Math.min(5000, s + 20))}
                style={{width:32,height:32,borderRadius:8,border:'1px solid #E5E7EB',background:'#fff',cursor:'pointer',fontSize:16,color:'var(--fg2)'}}>+</button>
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--fg3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Économies mensuelles</div>
            <div className="t-num" style={{fontSize:36,fontWeight:700,color:'var(--brand-900)',letterSpacing:'-0.02em'}}>
              {dMonthly.toLocaleString('fr-FR')} <span style={{fontSize:18,color:'var(--fg3)',fontWeight:500}}>DA</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--fg3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Économies annuelles</div>
            <div className="t-num" style={{fontSize:36,fontWeight:700,color:'var(--brand-500)',letterSpacing:'-0.02em'}}>
              {dAnnual.toLocaleString('fr-FR')} <span style={{fontSize:18,color:'var(--fg3)',fontWeight:500}}>DA</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes tsStrike { from { stroke-dashoffset: 900 } to { stroke-dashoffset: 0 } }`}</style>
    </section>
  );
};
window.ROISimulator = ROISimulator;
