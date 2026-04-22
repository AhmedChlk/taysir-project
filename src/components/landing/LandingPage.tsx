"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   Taysir Landing Page — Implementation based on Taysir Design System
   ========================================================================== */

// --- Primitives & Icons (Lucide-inspired, 1.75 stroke) ---

const IconWrapper = ({ children, size = 20, ...props }: { children: React.ReactNode; size?: number; [key: string]: any }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

const Check = (props: any) => (
  <IconWrapper {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconWrapper>
);

const ArrowR = (props: any) => (
  <IconWrapper {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </IconWrapper>
);

const LogoMark = ({ size = 28, color = "var(--brand-500)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <g fill={color}>
      <rect x="26" y="6" width="12" height="52" rx="3" />
      <rect x="6" y="26" width="52" height="12" rx="3" />
      <rect x="26" y="26" width="12" height="12" fill="#fff" />
      <rect x="28" y="28" width="8" height="8" fill={color} />
    </g>
  </svg>
);

const Logo = ({ color = "var(--brand-500)", textColor }: { color?: string; textColor?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <LogoMark size={26} color={color} />
    <span
      style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: textColor || "var(--fg1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      taysir
    </span>
  </div>
);

// --- Sub-components ---

const Navbar = ({ locale }: { locale: string }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loginUrl = `/${locale}/login`;
  const links = [
    { label: "Produit", href: "#produit" },
    { label: "Solutions", href: "#solutions" },
    { label: "Tarifs", href: "#tarifs" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "var(--nav-h)",
        display: "flex",
        alignItems: "center",
        background: scrolled ? "rgba(255,255,255,0.92)" : "#fff",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid #EEF1F3" : "1px solid transparent",
        transition: "all 220ms var(--ease)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "0 48px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <Link href={`/${locale}`}>
          <Logo />
        </Link>
        <div style={{ display: "flex", gap: 24, marginLeft: 28, flex: 1 }}>
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href as any}
              className="t-small"
              style={{
                color: "var(--fg2)",
                fontWeight: 500,
                textDecoration: "none",
                padding: "8px 4px",
                transition: "color 180ms var(--ease)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link href={loginUrl as any} style={{ color: "var(--fg2)", fontSize: 14, fontWeight: 500, textDecoration: "none", marginRight: 4 }}>
          Se connecter
        </Link>
        <Link href={loginUrl as any} className="btn btn--primary btn--md">
          Commencer
        </Link>
      </div>
    </nav>
  );
};

const TaysirDesktopMockup = () => {
  const studentRow = (idx: number, name: string, group: string, status: string) => {
    const colors = ["#DBEAFE", "#FEF3C7", "#FCE7F3", "#D1FAE5", "#E0E7FF"];
    const tone =
      status === "Présent"
        ? { bg: "#DCFCE7", fg: "#15803D" }
        : status === "Retard"
        ? { bg: "#FEF3C7", fg: "#92400E" }
        : status === "Absent"
        ? { bg: "#FEE2E2", fg: "#B91C1C" }
        : { bg: "#E0E7FF", fg: "#3730A3" };
    return (
      <div
        key={idx}
        style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 90px 74px",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderBottom: "1px solid #F3F4F6",
          fontSize: 12,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: colors[idx % 5],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 600,
            color: "#475569",
          }}
        >
          {name
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div style={{ color: "var(--fg1)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ color: "var(--fg3)", fontSize: 11 }}>{group}</div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            justifySelf: "start",
          }}
        >
          {status}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "var(--shadow-3)",
        width: 560,
        height: 420,
        overflow: "hidden",
        border: "1px solid #EAECEF",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 40,
          background: "#fff",
          borderBottom: "1px solid #EFF1F3",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 10,
          fontSize: 12,
          color: "var(--fg3)",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#F87171" }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FBBF24" }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#4ADE80" }} />
        </div>
        <div
          style={{
            marginLeft: 16,
            background: "#F3F4F6",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            color: "var(--fg3)",
            minWidth: 260,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#4ADE80" }}>●</span> app.taysir.dz/eleves
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "54px 168px 1fr", height: 380 }}>
        {/* Sidebar Rail */}
        <div style={{ borderRight: "1px solid #EFF1F3", padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "#FAFBFC" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-500)", background: "var(--brand-50)", marginBottom: 8 }}>
            <LogoMark size={20} />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "var(--brand-500)" : "var(--fg3)", background: i === 1 ? "var(--brand-50)" : "transparent" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
          ))}
        </div>

        {/* Groups List */}
        <div style={{ borderRight: "1px solid #EFF1F3", padding: "14px 10px", background: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px 8px" }}>Groupes</div>
          {[
            { name: "Toutes les classes", count: 248, active: false },
            { name: "Mathématiques 3AS", count: 32, active: true },
            { name: "Physique 2AS", count: 28, active: false },
            { name: "Français 1AS", count: 24, active: false },
          ].map((g) => (
            <div
              key={g.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                fontSize: 12,
                borderRadius: 6,
                marginBottom: 2,
                background: g.active ? "#EEF4F5" : "transparent",
                color: g.active ? "var(--brand-900)" : "var(--fg2)",
                fontWeight: g.active ? 600 : 500,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: g.active ? "var(--brand-500)" : "#CBD5E1" }} />
                {g.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--fg3)" }}>{g.count}</span>
            </div>
          ))}
        </div>

        {/* Students Table */}
        <div style={{ background: "#fff", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>Mathématiques 3AS</div>
              <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 2 }}>32 élèves · Pr. Benali</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg2)", background: "#F3F4F6", padding: "5px 10px", borderRadius: 6 }}>Présences</div>
            </div>
          </div>
          {studentRow(0, "Amina Belkacem", "3AS · A", "Présent")}
          {studentRow(1, "Youcef Hamidi", "3AS · A", "Retard")}
          {studentRow(2, "Salma Ouadah", "3AS · A", "Présent")}
          {studentRow(3, "Karim Mezrag", "3AS · A", "Absent")}
          {studentRow(4, "Lina Bouras", "3AS · B", "Présent")}
        </div>
      </div>
    </div>
  );
};

const TaysirPhoneMockup = () => {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFilled((f) => (f + 1) % 10), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        right: -56,
        bottom: -60,
        width: 240,
        height: 490,
        background: "linear-gradient(160deg, #1C1F24 0%, #0B0D10 100%)",
        borderRadius: 44,
        padding: 5,
        boxShadow: "0 40px 80px -20px rgba(15,81,92,0.35), 0 10px 30px -6px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ width: "100%", height: "100%", background: "#000", borderRadius: 40, padding: 3, boxSizing: "border-box" }}>
        <div style={{ width: "100%", height: "100%", background: "#F7F8FA", borderRadius: 37, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 86, height: 24, background: "#000", borderRadius: 999, zIndex: 3 }} />
          <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 22px 0", fontSize: 11.5, fontWeight: 600, color: "var(--fg1)" }}>
            <span>9:41</span>
          </div>

          <div style={{ padding: "14px 16px 12px", background: "#fff", borderBottom: "1px solid #F0F2F5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <LogoMark size={18} color="var(--brand-500)" />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg1)" }}>Appel en cours</div>
              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "3px 7px", borderRadius: 999 }}>Live</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)" }}>Maths · 3AS‑A</div>
            <div style={{ marginTop: 12, height: 5, borderRadius: 999, background: "#EEF1F3", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(filled / 9) * 100}%`, background: "var(--brand-500)", borderRadius: 999, transition: "width 600ms var(--ease)" }} />
            </div>
          </div>

          <div style={{ flex: 1, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {["AB", "YH", "SO", "KM", "LB", "RC", "NS", "MK", "HD"].map((ini, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "10px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  border: i < filled ? "1.5px solid rgba(26,122,137,0.35)" : "1px solid #EEF1F3",
                  transition: "all 340ms var(--ease)",
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{ini}</div>
                <div style={{ fontSize: 9, fontWeight: 600 }}>{i < filled ? (i % 5 !== 3 ? "Présent" : "Absent") : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ locale }: { locale: string }) => {
  const loginUrl = `/${locale}/login`;
  return (
    <section style={{ background: "#fff", paddingTop: "calc(var(--nav-h) + 56px)", paddingBottom: 100, borderBottom: "1px solid #F3F4F6", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--brand-50)", color: "var(--brand-900)", border: "1px solid #CFE3E7", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--brand-500)" }} />
            Plateforme n° 1 pour les écoles en Algérie
          </div>
          <h1 style={{ fontSize: 60, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--fg1)", margin: 0 }}>
            Pilotez votre école,<br />sans le chaos.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg2)", margin: "22px 0 32px", maxWidth: 480 }}>
            Taysir réunit inscriptions, présences, emplois du temps et paiements
            dans une seule plateforme pensée pour les établissements éducatifs algériens.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link href={loginUrl as any} className="btn btn--primary btn--lg">
              Essayer Taysir gratuitement <ArrowR size={18} />
            </Link>
            <Link href={loginUrl as any} className="btn btn--ghost btn--lg">Voir une démo</Link>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 36, fontSize: 13, color: "var(--fg3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={15} color="var(--brand-500)" /> 14 jours d'essai</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={15} color="var(--brand-500)" /> Sans carte bancaire</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={15} color="var(--brand-500)" /> Support RTL</span>
          </div>
        </motion.div>

        <motion.div
          style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 500 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <TaysirDesktopMockup />
          <TaysirPhoneMockup />
        </motion.div>
      </div>
    </section>
  );
};

const CountUp = ({ to, duration = 900 }: { to: number; duration?: number }) => {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
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

const KPIBand = () => {
  const kpi = (num: number, suffix: string, label: string, color = "#4ADE80") => (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <div className="t-num" style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>
          <CountUp to={num} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{suffix}</div>
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.5, maxWidth: 220 }}>{label}</div>
    </div>
  );
  return (
    <section style={{ background: "#0F515C", color: "#fff", padding: "64px 0", borderTop: "1px solid #0A434C" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
        {kpi(92, "%", "des élèves avec un parent notifié sous 5 min")}
        {kpi(7, " h/sem", "économisées par secrétaire, en moyenne", "#FBBF24")}
        {kpi(0, " conflit", "de salle ou d’intervenant sur 4 semaines", "#E6F2F4")}
        {kpi(3, "x", "plus de paiements encaissés à l’échéance")}
      </div>
    </section>
  );
};

const PlatformTabs = () => {
  const tabs = [
    { id: "ger", label: "Pour les Gérants", title: "Piloter, pas subir.", body: "Tableau de bord financier consolidé, alertes en temps réel sur les impayés, et vue d’ensemble de chaque salle, chaque séance, chaque équipe.", bullets: ["Tableau de bord consolidé — revenus, présences, capacité", "Alertes sur les impayés et les retards d’inscription", "Permissions fines sur chaque rôle et chaque module", "Export comptable aux formats algériens"] },
    { id: "sec", label: "Pour les Secrétaires", title: "Le quotidien, simplifié.", body: "Inscriptions, affectations, planning des salles, encaissements : tout se fait depuis une seule interface, sans double saisie.", bullets: ["Dossier d’inscription en 3 minutes", "Détection automatique des conflits de planning", "Encaissements par tranches avec reçu automatique", "Relances de paiement et d’absence en un clic"] },
    { id: "prof", label: "Pour les Intervenants", title: "Enseigner, pas administrer.", body: "L’appel en 30 secondes depuis le téléphone, les remarques pédagogiques sauvegardées, l’emploi du temps toujours à jour.", bullets: ["Emploi du temps personnel sur mobile", "Appel des présences tactile, hors-ligne", "Remarques pédagogiques liées au dossier élève", "Notifications instantanées en cas d’annulation"] },
  ];
  const [active, setActive] = useState("ger");
  const tab = tabs.find((t) => t.id === active)!;

  return (
    <section style={{ background: "#fff", padding: "120px 0", borderTop: "1px solid #F3F4F6" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 44, letterSpacing: "-0.025em", margin: "0 auto", maxWidth: 800 }}>
            Une plateforme. <span style={{ color: "var(--fg3)" }}>Trois rôles. Zéro friction.</span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid transparent",
                background: t.id === active ? "var(--brand-50)" : "transparent",
                color: t.id === active ? "var(--brand-900)" : "var(--fg2)",
                fontWeight: t.id === active ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 220ms var(--ease)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}
          >
            <div>
              <h3 style={{ fontSize: 32, letterSpacing: "-0.02em", margin: "0 0 16px" }}>{tab.title}</h3>
              <p style={{ fontSize: 17, color: "var(--fg2)", lineHeight: 1.6, margin: "0 0 24px" }}>{tab.body}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tab.bullets.map((b) => (
                  <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, color: "var(--fg1)" }}>
                    <span style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 3 }}><Check size={16} /></span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#E6F2F4 0%,#F9FAFB 100%)", borderRadius: 20, padding: 32, minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E5E7EB" }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "var(--shadow-2)", border: "1px solid rgba(15,81,92,0.06)", width: "100%", maxWidth: 380 }}>
                {active === "ger" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Avril · Total</div>
                    <div className="t-num" style={{ fontSize: 34, fontWeight: 700, color: "var(--brand-900)", letterSpacing: "-0.02em", marginTop: 6 }}>2 480 000 DA</div>
                    <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600, marginTop: 4 }}>+18 % vs mars</div>
                    <div style={{ height: 1, background: "#EEF1F3", margin: "18px 0" }} />
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                      {[40, 55, 42, 68, 72, 55, 82, 65, 90, 76, 85, 94].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "var(--brand-500)" : "#CFE3E7", borderRadius: "4px 4px 0 0" }} />
                      ))}
                    </div>
                  </>
                )}
                {active === "sec" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg1)" }}>Inscription — Belkacem A.</div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 999, background: "#DCFCE7", color: "#15803D" }}>Complet</span>
                    </div>
                    {["Infos personnelles", "Groupe & intervenant", "Paiements", "Documents"].map((s, i) => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? "1px solid #EEF1F3" : "none" }}>
                        <span style={{ width: 20, height: 20, borderRadius: 999, background: i < 3 ? "var(--brand-500)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {i < 3 ? <Check size={11} color="#fff" strokeWidth={3} /> : <span style={{ fontSize: 10, color: "var(--fg3)", fontWeight: 700 }}>{i + 1}</span>}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--fg1)", fontWeight: i === 3 ? 600 : 500 }}>{s}</span>
                      </div>
                    ))}
                  </>
                )}
                {active === "prof" && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Appel · Maths 3AS-A</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 14 }}>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} style={{ padding: "8px", borderRadius: 8, background: i % 4 !== 0 ? "rgba(26,122,137,0.1)" : "rgba(220,38,38,0.08)", color: i % 4 !== 0 ? "var(--brand-700)" : "#B91C1C", textAlign: "center", fontSize: 10, fontWeight: 600, border: "1px solid rgba(0,0,0,0.05)" }}>
                          {i % 4 !== 0 ? "Présent" : "Absent"}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

const MicroDemo = () => {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 6), 2400);
    return () => clearInterval(id);
  }, []);

  const sessions = [
    { time: "08:00", subj: "Mathématiques", group: "3AS · A", teacher: "Pr. Benali", room: "Salle 4", tone: "done" },
    { time: "09:45", subj: "Physique", group: "2AS · B", teacher: "Pr. Kadri", room: "Salle 2", tone: "live" },
    { time: "10:30", subj: "Anglais", group: "1AS", teacher: "Pr. Yahia", room: "Salle 6", tone: "normal" },
    { time: "13:30", subj: "Français", group: "1AS · A", teacher: "Pr. Mansouri", room: "Salle 3", tone: "normal" },
    { time: "14:00", subj: "Sciences", group: "2AS · A", teacher: "Pr. Hamza", room: "Labo 1", tone: "conflict" },
    { time: "15:15", subj: "Préparation BAC", group: "Terminale", teacher: "Pr. Benali", room: "Salle 4", tone: "normal" },
  ];

  return (
    <section id="produit" style={{ background: "#F9FAFB", padding: "120px 0" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 80, alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "var(--shadow-3)", overflow: "hidden", border: "1px solid rgba(15,81,92,0.08)", transform: "perspective(1600px) rotateY(1.5deg)" }}>
          <div style={{ height: 38, background: "#F6F7F8", borderBottom: "1px solid #EEF1F3", display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#F87171" }} />
            <div style={{ marginLeft: 16, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "var(--fg3)", minWidth: 320 }}>
              app.taysir.dz / emploi-du-temps
            </div>
          </div>
          <div style={{ padding: "22px 26px" }}>
            <div style={{ borderBottom: "1px solid #EFF1F3", paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg1)" }}>Mardi 23 avril</div>
              <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>6 séances · 4 salles · 184 élèves</div>
            </div>
            {sessions.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 90px", alignItems: "center", gap: 14, padding: "12px 10px", borderRadius: 10, background: i === active ? "rgba(26,122,137,0.06)" : "transparent", transition: "all 280ms var(--ease)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: i === active ? "var(--brand-900)" : "var(--fg1)" }}>{s.time}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>{s.subj}</div>
                  <div style={{ fontSize: 11, color: "var(--fg3)" }}>{s.group}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg2)" }}>{s.room}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: i === active ? "var(--brand-50)" : "#F3F4F6", color: i === active ? "var(--brand-900)" : "var(--fg3)", justifySelf: "start" }}>{s.tone === "live" ? "Live" : s.tone === "done" ? "Terminé" : "À venir"}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="t-eyebrow">Taysir pour les Secrétaires</div>
          <h2 style={{ margin: "12px 0 20px" }}>Plus jamais de conflits de salle, de doublons ou d'appels oubliés.</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 16, color: "var(--fg2)", marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 3 }}><Check size={18} /></span>
              <span><b style={{ color: "var(--fg1)" }}>Planning en temps réel</b> — Détectez automatiquement les conflits de salle avant qu'ils n'arrivent.</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 3 }}><Check size={18} /></span>
              <span><b style={{ color: "var(--fg1)" }}>Appel en 30 secondes</b> — Présences marquées depuis le téléphone ; parents notifiés instantanément.</span>
            </div>
          </div>
          <div style={{ borderLeft: "3px solid var(--brand-500)", paddingLeft: 18, marginTop: 28 }}>
            <p style={{ margin: 0, fontSize: 15, fontStyle: "italic", color: "var(--fg1)" }}>« Avant Taysir, je passais mes lundis matin à recoller les emplois du temps sur papier. Aujourd'hui, c'est fait avant le café. »</p>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--fg3)" }}><b style={{ color: "var(--fg1)" }}>Nadia B.</b> — Secrétaire, Alger</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ROISimulator = () => {
  const pains = [
    { id: "paper", name: "Registres papier & impressions", price: 4500, unit: "/mois", dflt: true },
    { id: "excel", name: "Fichiers Excel dispersés", price: 2200, unit: "/mois", dflt: true },
    { id: "sms", name: "SMS manuels aux parents", price: 3800, unit: "/mois", dflt: true },
    { id: "planning", name: "Outil de planning externe", price: 6500, unit: "/mois", dflt: false },
    { id: "pay", name: "Suivi des paiements manuel", price: 1500, unit: "/élève/an", dflt: true, perStudent: true },
    { id: "absent", name: "Relances d'absence (appels)", price: 2800, unit: "/mois", dflt: false },
    { id: "docs", name: "Classement documents physiques", price: 1800, unit: "/mois", dflt: false },
    { id: "reports", name: "Rapports trimestriels manuels", price: 3500, unit: "/mois", dflt: false },
  ];
  const [selected, setSelected] = useState(() => new Set(pains.filter((p) => p.dflt).map((p) => p.id)));
  const [students, setStudents] = useState(180);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const monthly = useMemo(() => {
    let total = 0;
    for (const p of pains) {
      if (selected.has(p.id)) total += p.perStudent ? (p.price * students) / 12 : p.price;
    }
    return Math.round(total);
  }, [selected, students]);

  const annual = monthly * 12;

  // Tween displayed numbers
  const useTween = (target: number) => {
    const [v, setV] = useState(target);
    const ref = useRef<number | null>(null);
    useEffect(() => {
      if (ref.current !== null) cancelAnimationFrame(ref.current);
      const start = v, delta = target - start, t0 = performance.now(), dur = 420;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        setV(Math.round(start + delta * e));
        if (k < 1) ref.current = requestAnimationFrame(step);
      };
      ref.current = requestAnimationFrame(step);
      return () => { if (ref.current !== null) cancelAnimationFrame(ref.current); };
    }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
    return v;
  };
  const dMonthly = useTween(monthly);
  const dAnnual = useTween(annual);

  return (
    <section id="simulateur" style={{ background: "#fff", padding: "120px 0" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", marginBottom: 48 }}>
        <div>
          <div className="t-eyebrow">Simulateur de rentabilité</div>
          <h2 style={{ margin: "12px 0 16px", textWrap: "balance" }}>Plus d'administration. Moins d'outils.</h2>
          <p style={{ fontSize: 17, color: "var(--fg2)", margin: 0, maxWidth: 480, lineHeight: 1.55 }}>
            Cochez tout ce que votre école gère aujourd'hui à la main ou avec des outils dispersés.
            Taysir le remplace — et vous montre combien vous économisez, dès le premier mois.
          </p>
        </div>

        {/* Stack of "crossed-out tools" illustration, Notion-style */}
        <div style={{ position: "relative", display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap", padding: "20px 0" }}>
          {["Excel", "WhatsApp", "Cahier", "Word", "Post-it", "PDF", "SMS", "Agenda", "Fax"].map((t) => (
            <div key={t} style={{
              background: "#F3F4F6", borderRadius: 12, padding: "10px 14px",
              fontSize: 13, fontWeight: 600, color: "var(--fg3)",
              position: "relative", overflow: "hidden",
            }}>
              {t}
            </div>
          ))}
          {/* The crossing-out line */}
          <svg style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 60, transform: "translateY(-50%)", pointerEvents: "none" }}
               viewBox="0 0 400 60" preserveAspectRatio="none">
            <motion.path d="M 10 42 Q 200 10, 390 36" stroke="#0B1220" strokeWidth="2.5" fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
        </div>
      </div>

      <div style={{ maxWidth: "calc(var(--container) - 96px)", margin: "0 auto", background: "#fff", borderRadius: 18, boxShadow: "var(--shadow-2)", border: "1px solid #EDEFF2", padding: "36px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24 }}>
          {pains.map((p) => {
            const on = selected.has(p.id);
            return (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", cursor: "pointer", userSelect: "none" }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: on ? "1.5px solid var(--brand-500)" : "1.5px solid #CBD5E1",
                  background: on ? "var(--brand-500)" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 180ms var(--ease)",
                }}>
                  {on && <Check size={12} color="#fff" strokeWidth={3} />}
                </span>
                <input type="checkbox" checked={on} onChange={() => toggle(p.id)} style={{ display: "none" }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg1)", flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: "var(--fg3)", fontVariantNumeric: "tabular-nums" }}>
                  {p.perStudent ? `${p.price} DA ${p.unit}` : `${p.price.toLocaleString("fr-FR")} DA ${p.unit}`}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ height: 1, background: "#EEF1F3", margin: "20px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre d'élèves</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--brand-900)", fontVariantNumeric: "tabular-nums" }}>{students}</span>
            </div>
            
            <input 
              type="range" 
              min={50} max={1500} step={10} 
              value={students} 
              onChange={(e) => setStudents(Number(e.target.value))} 
              className="roi-slider" 
              style={{
                width: "100%", height: 6, borderRadius: 999, WebkitAppearance: "none", outline: "none",
                background: `linear-gradient(to right, var(--brand-500) 0%, var(--brand-300) ${((students - 50) / 1450) * 100}%, #EEF1F3 ${((students - 50) / 1450) * 100}%, #EEF1F3 100%)`
              }} 
            />
            
            <style>{`
              .roi-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: white;
                border: 2px solid var(--brand-500);
                cursor: pointer;
                box-shadow: var(--shadow-1);
                transition: transform 120ms ease;
              }
              .roi-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
              }
              .roi-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: white;
                border: 2px solid var(--brand-500);
                cursor: pointer;
                box-shadow: var(--shadow-1);
                transition: transform 120ms ease;
              }
              .roi-slider::-moz-range-thumb:hover {
                transform: scale(1.1);
              }
            `}</style>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: "20px 24px", background: "var(--surface-0)", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mensuel</div>
              <div className="t-num" style={{ fontSize: 28, fontWeight: 700, color: "var(--fg1)", letterSpacing: "-0.02em" }}>
                {dMonthly.toLocaleString("fr-FR")} <span style={{ fontSize: 14, color: "var(--fg3)", fontWeight: 600 }}>DA</span>
              </div>
            </div>
            <div style={{ padding: "20px 24px", background: "var(--brand-50)", borderRadius: 16, border: "1px solid #CFE3E7", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--brand-500)" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Annuel</div>
              <div className="t-num" style={{ fontSize: 28, fontWeight: 700, color: "var(--brand-900)", letterSpacing: "-0.02em" }}>
                {dAnnual.toLocaleString("fr-FR")} <span style={{ fontSize: 14, color: "var(--brand-700)", fontWeight: 600 }}>DA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = ({ locale }: { locale: string }) => {
  const [annual, setAnnual] = useState(true);
  const loginUrl = `/${locale}/login`;

  const plans = [
    { name: "Découverte", tagline: "Pour démarrer.", priceA: 0, priceM: 0, features: ["Jusqu'à 50 élèves", "3 intervenants", "Emploi du temps simple", "Support email"], cta: "Gratuit" },
    { name: "Essentiel", tagline: "Pour la plupart des écoles.", priceA: 120, priceM: 150, features: ["Élèves illimités", "Détection de conflits", "SMS parents", "Export comptable"], cta: "Essayer" },
    { name: "Pro", tagline: "Pour piloter et croître.", priceA: 220, priceM: 275, features: ["Tout Essentiel", "Tableaux de bord financiers", "Rapports IA", "Accompagnement dédié"], cta: "Essayer Pro", featured: true },
  ];

  return (
    <section id="tarifs" style={{ background: "#fff", padding: "120px 0", borderTop: "1px solid #F3F4F6" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="t-eyebrow">Tarification</div>
          <h2 style={{ margin: "12px 0 20px" }}>Une tarification simple. Pas de surprise.</h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#F3F4F6", padding: 4, borderRadius: 999 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: !annual ? "#fff" : "transparent", boxShadow: !annual ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Mensuel</button>
            <button onClick={() => setAnnual(true)} style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: annual ? "#fff" : "transparent", boxShadow: annual ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Annuel</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {plans.map((p) => (
            <div key={p.name} style={{ padding: 32, borderRadius: 18, border: p.featured ? "2px solid var(--brand-500)" : "1px solid #EEF1F3", background: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
              {p.featured && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--brand-500)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>RECOMMANDÉ</div>}
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg1)" }}>{p.name}</div>
              <div style={{ margin: "16px 0 8px" }}>
                <span className="t-num" style={{ fontSize: 32, fontWeight: 700 }}>{annual ? p.priceA : p.priceM}</span>
                <span style={{ fontSize: 14, color: "var(--fg3)", marginLeft: 4 }}>DA/élève/mois</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg3)", marginBottom: 24 }}>{p.tagline}</div>
              <Link href={loginUrl as any} className={`btn ${p.featured ? "btn--primary" : "btn--ghost"} btn--md`} style={{ width: "100%" }}>{p.cta}</Link>
              <div style={{ height: 1, background: "#EEF1F3", margin: "24px 0 16px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--fg2)" }}>
                    <Check size={14} color="var(--brand-500)" /> {f}
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

const Footer = () => (
  <footer style={{ background: "#0F515C", color: "#fff", padding: "80px 0 40px" }}>
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3, 1fr)", gap: 40, marginBottom: 56 }}>
        <div>
          <Logo textColor="#fff" color="#fff" />
          <p style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)", maxWidth: 280 }}>La plateforme de gestion scolaire qui simplifie le quotidien de vos équipes.</p>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 16 }}>Produit</div>
          {["Fonctionnalités", "Tarifs", "Solutions"].map((l) => <div key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, cursor: "pointer" }}>{l}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 16 }}>Ressources</div>
          {["Centre d'aide", "Documentation", "Contact"].map((l) => <div key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, cursor: "pointer" }}>{l}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 16 }}>Légal</div>
          {["Confidentialité", "Conditions", "Mentions"].map((l) => <div key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, cursor: "pointer" }}>{l}</div>)}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>© 2026 Taysir. Tous droits réservés.</div>
    </div>
  </footer>
);

// --- Main Page ---

export default function LandingPage({ locale }: { locale: string }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar locale={locale} />
      <Hero locale={locale} />
      <KPIBand />
      <PlatformTabs />
      <MicroDemo />
      <ROISimulator />
      <Pricing locale={locale} />
      <Footer />
    </div>
  );
}
