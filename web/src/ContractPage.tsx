import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LangSwitcher from "./LangSwitcher";

const PROGRAM_ID = "3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU";

const INSTRUCTIONS = [
  { name: "initialize_membership", desc: "Déploie une membership avec 3 niveaux et leurs mints SPL", args: ["name: String", "price_bronze: u64", "price_silver: u64", "price_gold: u64"] },
  { name: "buy_subscription", desc: "Achète un abonnement d'un mois, reçoit un SPL token, split 98/2%", args: ["tier: Tier (Bronze | Silver | Gold)"] },
  { name: "update_prices", desc: "Met à jour les prix (créateur uniquement)", args: ["price_bronze: u64", "price_silver: u64", "price_gold: u64"] },
  { name: "check_subscription", desc: "Vérifie si un fan a un abonnement actif", args: [] },
];

export default function ContractPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: #0c0c0c; border: 1px solid rgba(255,215,0,0.08); border-radius: 12px; padding: 2rem; }
        a { color: #FFD700; text-decoration: none; } a:hover { text-decoration: underline; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 3rem", borderBottom: "1px solid rgba(255,215,0,0.08)" }}>
        <div onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#FFD700", cursor: "pointer" }}>⭐ Fave</div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => navigate("/create")} style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 4, padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 500 }}>
            Créer ma membership
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "4rem auto", padding: "0 2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>Contrat</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Fave Protocol</h1>
          <p style={{ color: "#666", lineHeight: 1.7 }}>Smart contract déployé sur Solana. Open source, auditable, immuable.</p>
        </div>

        {/* Adresses */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.8rem" }}>Adresses</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { label: "Program ID", value: PROGRAM_ID, cluster: "devnet" },
              { label: "Réseau", value: "Solana Devnet (→ Mainnet bientôt)" },
              { label: "Langage", value: "Rust / Anchor 0.31.0" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: "#666", fontSize: "0.875rem" }}>{item.label}</span>
                {item.cluster ? (
                  <a className="mono" href={`https://explorer.solana.com/address/${item.value}?cluster=${item.cluster}`} target="_blank"
                    style={{ fontSize: "0.85rem", color: "#FFD700" }}>
                    {item.value.slice(0, 20)}...{item.value.slice(-6)} ↗
                  </a>
                ) : (
                  <span className="mono" style={{ fontSize: "0.85rem", color: "#ccc" }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>Instructions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {INSTRUCTIONS.map((ix, i) => (
              <div key={i} style={{ paddingBottom: i < INSTRUCTIONS.length - 1 ? "1.5rem" : 0,
                borderBottom: i < INSTRUCTIONS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="mono" style={{ color: "#FFD700", fontSize: "0.9rem", marginBottom: "0.4rem" }}>{ix.name}</div>
                <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{ix.desc}</div>
                {ix.args.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {ix.args.map((arg, j) => (
                      <span key={j} className="mono" style={{ background: "#151515", border: "1px solid #222",
                        borderRadius: 4, padding: "0.2rem 0.6rem", fontSize: "0.75rem", color: "#aaa" }}>
                        {arg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sécurité */}
        <div className="card">
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>Sécurité</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { ok: true,  label: "Signatures ECDSA validées on-chain" },
              { ok: true,  label: "PDAs dérivées — pas d'adresses arbitraires" },
              { ok: true,  label: "Protection overflow sur tous les calculs" },
              { ok: true,  label: "Seul le créateur peut modifier ses prix" },
              { ok: false, label: "Audit de sécurité externe — prévu avant mainnet" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: item.ok ? "#4a4" : "#a84", fontSize: "0.85rem" }}>{item.ok ? "✓" : "○"}</span>
                <span style={{ color: item.ok ? "#ccc" : "#888", fontSize: "0.875rem" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liens */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a href="https://github.com/KilliannH/fave_protocol" target="_blank"
            style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.75rem 1.5rem", color: "#ccc", fontSize: "0.9rem" }}>
            GitHub →
          </a>
          <a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`} target="_blank"
            style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.75rem 1.5rem", color: "#ccc", fontSize: "0.9rem" }}>
            Solana Explorer →
          </a>
        </div>
      </div>
    </>
  );
}
