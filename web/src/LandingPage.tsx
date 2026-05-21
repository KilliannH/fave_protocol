import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LangSwitcher from "./LangSwitcher";
import { getStats, getCreators, type Creator, type Stats } from "./api";

const TOKENOMICS = [
  { label: "Communauté & créateurs", pct: 40, color: "#FFD700", desc: "Airdrop aux premiers créateurs qui adoptent le protocole" },
  { label: "Trésorerie protocole",    pct: 25, color: "#C0A020", desc: "Financement du développement futur" },
  { label: "Équipe",                  pct: 15, color: "#8B7010", desc: "Vesting 2 ans" },
  { label: "Réserve écosystème",      pct: 15, color: "#5A4A08", desc: "Grants et partenariats" },
  { label: "Liquidité initiale",      pct:  5, color: "#3A3005", desc: "Listing sur DEX" },
];

const STATS = [
  { value: "100M",  label: "Supply totale $FAVE" },
  { value: "98%",   label: "Reversé au créateur" },
  { value: "30j",   label: "Durée d'abonnement" },
  { value: "3",     label: "Niveaux de membership" },
];

const TIERS = [
  { name: "Bronze", color: "#CD7F32", price: "0.01 SOL", perks: ["Contenu exclusif", "Badge fan"] },
  { name: "Silver", color: "#C0C0C0", price: "0.05 SOL", perks: ["Tout Bronze", "Vote contenu", "Discord privé"] },
  { name: "Gold",   color: "#FFD700", price: "0.10 SOL", perks: ["Tout Silver", "Lives privés", "Mention vidéos"] },
];

function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function AnimSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>);
  return (
    <div ref={ref} className={`anim-section ${inView ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

function TokenomicsChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>);
  let cumulative = 0;

  return (
    <div ref={ref} style={{ display: "flex", gap: "3rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <svg width="260" height="260" viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="90" fill="none" stroke="#111" strokeWidth="40" />
        {TOKENOMICS.map((item, i) => {
          const circumference = 2 * Math.PI * 90;
          const offset = circumference * (1 - cumulative / 100);
          const dash = circumference * item.pct / 100;
          cumulative += item.pct;
          const delay = inView ? `${i * 0.15}s` : "0s";
          return (
            <circle key={i} cx="130" cy="130" r="90" fill="none" stroke={item.color} strokeWidth="40"
              strokeDasharray={`${inView ? dash : 0} ${circumference}`}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "130px 130px",
                transition: inView ? `stroke-dasharray 0.8s ease ${delay}` : "none" }} />
          );
        })}
        <text x="130" y="124" textAnchor="middle" fill="#FFD700" fontSize="22" fontWeight="700" fontFamily="serif">100M</text>
        <text x="130" y="144" textAnchor="middle" fill="#888" fontSize="11" fontFamily="sans-serif">$FAVE</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {TOKENOMICS.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem",
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(20px)",
            transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <div>
              <span style={{ color: item.color, fontWeight: 600, fontSize: "0.95rem" }}>{item.pct}%</span>
              <span style={{ color: "#ccc", fontSize: "0.9rem", marginLeft: "0.5rem" }}>{item.label}</span>
              <div style={{ color: "#666", fontSize: "0.75rem" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getCreators().then(setCreators).catch(() => {});
  }, []);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        .anim-section { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .anim-section.visible { opacity: 1; transform: translateY(0); }
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 3rem; background: rgba(8,8,8,0.85); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,215,0,0.08); }
        .nav-logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #FFD700; letter-spacing: -0.02em; cursor: pointer; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links a { color: #888; font-size: 0.875rem; text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase; transition: color 0.2s; cursor: pointer; }
        .nav-links a:hover { color: #FFD700; }
        .btn-primary { background: #FFD700; color: #080808; border: none; border-radius: 4px; padding: 0.625rem 1.5rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; letter-spacing: 0.03em; transition: opacity 0.2s, transform 0.2s; }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-outline { background: transparent; color: #FFD700; border: 1px solid rgba(255,215,0,0.4); border-radius: 4px; padding: 0.625rem 1.5rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 400; cursor: pointer; letter-spacing: 0.03em; transition: border-color 0.2s, background 0.2s; }
        .btn-outline:hover { border-color: #FFD700; background: rgba(255,215,0,0.05); }
        section { padding: 7rem 3rem; max-width: 1100px; margin: 0 auto; }
        h2 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; }
        .label { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #FFD700; font-weight: 500; margin-bottom: 1rem; display: block; }
        .divider { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="grain" />

      <nav>
        <div className="nav-logo" onClick={() => navigate("/")}>⭐ Fave</div>
        <div className="nav-links">
          <a onClick={() => navigate("/creators")} style={{color:"#888",fontSize:"0.875rem",textDecoration:"none",letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer"}}>Créateurs</a>
          <a onClick={() => document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" })}>{ t('nav.protocol') }</a>
          <a onClick={() => document.getElementById("tokenomics")?.scrollIntoView({ behavior: "smooth" })}>{ t('nav.tokenomics') }</a>
          <a onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}>{ t('nav.membership') }</a>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-outline" onClick={() => navigate("/contract")}>{ t('nav.contract') }</button>
          <button className="btn-primary" onClick={() => navigate("/app")}>{ t('nav.launch') }</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 3rem", maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", right: "-5%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.15}px)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
            borderRadius: "100px", padding: "0.35rem 1rem", fontSize: "0.75rem", color: "#FFD700",
            letterSpacing: "0.05em", marginBottom: "2rem", animation: "fadeIn 0.8s ease 0.2s both" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD700", display: "inline-block" }} />
            { t('hero.badge') }
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3rem, 7vw, 5.5rem)",
            fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "1.5rem",
            animation: "fadeIn 0.8s ease 0.3s both" }}>
            Monétise ton<br />audience.<br />
            <span style={{ color: "#FFD700" }}>{ t('hero.title3') }</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "#999", lineHeight: 1.7, maxWidth: 520, marginBottom: "2.5rem",
            fontWeight: 300, animation: "fadeIn 0.8s ease 0.4s both" }}>
            Fave est un protocole de membership sur Solana.
            Les créateurs gardent <strong style={{ color: "#e8e8e0" }}>98% des revenus</strong>.
            Les fans reçoivent de vrais tokens SPL en échange de leur soutien.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", animation: "fadeIn 0.8s ease 0.5s both" }}>
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }} onClick={() => navigate("/create")}>
              Créer ma membership
            </button>
            <button className="btn-outline" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }} onClick={() => navigate("/contract")}>
              Voir le contrat →
            </button>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Stats */}
      <section id="protocol" style={{ padding: "4rem 3rem" }}>
        <AnimSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0" }}>
            {STATS.map((stat, i) => (
              <div key={i} style={{ padding: "2rem", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 700, color: "#FFD700", lineHeight: 1, marginBottom: "0.5rem" }}>{stat.value}</div>
                <div style={{ color: "#666", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimSection>
      </section>

      <div className="divider" />

      {/* Comment ça marche */}
      <section>
        <AnimSection>
          <span className="label">{ t('nav.protocol') }</span>
          <h2 style={{ marginBottom: "3rem" }}>Simple pour le créateur.<br /><span style={{ color: "#555" }}>Puissant pour le fan.</span></h2>
        </AnimSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
          {[
            { step: "01", title: "Le créateur déploie", desc: "En une transaction, il crée sa membership avec 3 niveaux de prix. Le smart contract est immuable." },
            { step: "02", title: "Le fan s'abonne", desc: "Il paie en SOL directement sur la blockchain. 98% va instantanément au créateur, 2% au protocole." },
            { step: "03", title: "Les tokens arrivent", desc: "Le fan reçoit un SPL token dans son wallet. Ce token prouve son abonnement actif pendant 30 jours." },
          ].map((item, i) => (
            <AnimSection key={i}>
              <div style={{ padding: "2.5rem", background: "#0c0c0c", height: "100%" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 700, color: "rgba(255,215,0,0.15)", marginBottom: "1rem" }}>{item.step}</div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 500, marginBottom: "0.75rem" }}>{item.title}</h3>
                <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </AnimSection>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* Tiers */}
      <section id="tiers">
        <AnimSection>
          <span className="label">{ t('nav.membership') }</span>
          <h2 style={{ marginBottom: "3rem" }}>Trois niveaux.<br /><span style={{ color: "#555" }}>Un seul protocole.</span></h2>
        </AnimSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {TIERS.map((tier, i) => (
            <AnimSection key={i}>
              <div style={{ border: `1px solid ${tier.color}22`, borderRadius: 8, padding: "2rem", background: `${tier.color}08`, transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = `${tier.color}55`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = `${tier.color}22`; }}
                onClick={() => navigate("/app")}>
                <div style={{ color: tier.color, fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>{tier.name}</div>
                <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                  {tier.price}<span style={{ fontSize: "0.9rem", color: "#666", fontWeight: 400 }}>/mois</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {tier.perks.map((perk, j) => (
                    <li key={j} style={{ color: "#aaa", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: tier.color, fontSize: "0.7rem" }}>✦</span>{perk}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimSection>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* Tokenomics */}
      <section id="tokenomics">
        <AnimSection>
          <span className="label">Token $FAVE</span>
          <h2 style={{ marginBottom: "1rem" }}>100 millions de tokens.<br /><span style={{ color: "#555" }}>Supply fixe. Pour toujours.</span></h2>
          <p style={{ color: "#666", fontSize: "0.95rem", maxWidth: 500, marginBottom: "3rem", lineHeight: 1.7 }}>
            $FAVE est le token de gouvernance du protocole. Il permet de voter sur les évolutions, de staker pour gagner une part des frais, et d'accéder aux features premium.
          </p>
        </AnimSection>
        <AnimSection>
          <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,215,0,0.08)", borderRadius: 12, padding: "3rem" }}>
            <TokenomicsChart />
            <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                {[
                  { label: "Adresse du contrat", value: "CCsfkVF...vXt" },
                  { label: "Blockchain", value: "Solana" },
                  { label: "Décimales", value: "6" },
                  { label: "Mint authority", value: "Révoquée ✓" },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ color: "#555", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{item.label}</div>
                    <div style={{ color: "#FFD700", fontFamily: "monospace", fontSize: "0.9rem" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimSection>
      </section>

      <div className="divider" />

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "8rem 3rem" }}>
        <AnimSection>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            Prêt à rejoindre<br /><span style={{ color: "#FFD700" }}>la prochaine vague ?</span>
          </h2>
          <p style={{ color: "#666", fontSize: "1rem", maxWidth: 400, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Fave est en devnet. Les premiers créateurs qui adoptent le protocole recevront une allocation de $FAVE.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }} onClick={() => navigate("/create")}>
              Devenir créateur early adopter
            </button>
            <button className="btn-outline" style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }} onClick={() => navigate("/app")}>
              Explorer l'app →
            </button>
          </div>
        </AnimSection>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem 3rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1100, margin: "0 auto", color: "#444", fontSize: "0.8rem" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#FFD700", fontSize: "1.1rem" }}>⭐ Fave</div>
        <div>{ t('footer.open_source') }</div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="https://github.com/KilliannH/fave_protocol" target="_blank" style={{ color: "#444", textDecoration: "none" }}>GitHub</a>
          <a onClick={() => navigate("/contract")} style={{ color: "#444", textDecoration: "none", cursor: "pointer" }}>{ t('nav.contract') }</a>
        </div>
      </footer>
    </>
  );
}
