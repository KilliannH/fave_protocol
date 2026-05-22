import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Nav from "./Nav";
import {
  FAVE_TOKEN_MINT,
  FAVE_PROGRAM_ID,
  FAVE_TOTAL_SUPPLY,
  FAVE_DECIMALS,
  SOLSCAN_TOKEN,
  EXPLORER_TOKEN,
} from "./constants";

const INSTRUCTIONS = [
  { name: "initialize_membership", desc: "Déploie une membership avec 3 niveaux et leurs mints SPL", args: ["name: String", "price_bronze: u64", "price_silver: u64", "price_gold: u64"] },
  { name: "buy_subscription", desc: "Achète un abonnement d'un mois, reçoit un SPL token, split 98/2%", args: ["tier: Tier (Bronze | Silver | Gold)"] },
  { name: "update_prices", desc: "Met à jour les prix (créateur uniquement)", args: ["price_bronze: u64", "price_silver: u64", "price_gold: u64"] },
  { name: "check_subscription", desc: "Vérifie si un fan a un abonnement actif", args: [] },
];

export default function ContractPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: #0c0c0c; border: 1px solid rgba(255,215,0,0.08); border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; }
        a { color: #FFD700; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 860, margin: "4rem auto", padding: "0 2rem" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>
          {t("contract_page.label")}
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          {t("contract_page.title")}
        </h1>
        <p style={{ color: "#666", lineHeight: 1.7, marginBottom: "2rem" }}>{t("contract_page.description")}</p>

        {/* Programme */}
        <div className="card">
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("contract_page.addresses")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: t("contract_page.program_id"), value: FAVE_PROGRAM_ID, link: `https://explorer.solana.com/address/${FAVE_PROGRAM_ID}?cluster=devnet` },
              { label: t("contract_page.network"), value: t("contract_page.network_value") },
              { label: t("contract_page.language"), value: "Rust / Anchor 0.31.0" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.875rem 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: "#666", fontSize: "0.875rem" }}>{item.label}</span>
                {item.link ? (
                  <a className="mono" href={item.link} target="_blank" style={{ fontSize: "0.82rem" }}>
                    {item.value.slice(0, 20)}...{item.value.slice(-6)} ↗
                  </a>
                ) : (
                  <span className="mono" style={{ fontSize: "0.82rem", color: "#ccc" }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Token $FAVE */}
        <div className="card">
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Token $FAVE — Mainnet
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Mint address", value: FAVE_TOKEN_MINT, link: EXPLORER_TOKEN },
              { label: "Réseau", value: "Solana Mainnet" },
              { label: "Supply totale", value: `${FAVE_TOTAL_SUPPLY.toLocaleString()} $FAVE` },
              { label: "Décimales", value: String(FAVE_DECIMALS) },
              { label: "Mint authority", value: "Révoquée ✓ — supply fixée" },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.875rem 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: "#666", fontSize: "0.875rem" }}>{item.label}</span>
                {item.link ? (
                  <a className="mono" href={item.link} target="_blank" style={{ fontSize: "0.82rem" }}>
                    {item.value.slice(0, 20)}...{item.value.slice(-6)} ↗
                  </a>
                ) : (
                  <span className="mono" style={{ fontSize: "0.82rem", color: item.value.includes("✓") ? "#4a4" : "#ccc" }}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
            <a href={EXPLORER_TOKEN} target="_blank"
              style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", color: "#ccc" }}>
              Solana Explorer ↗
            </a>
            <a href={SOLSCAN_TOKEN} target="_blank"
              style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.82rem", color: "#ccc" }}>
              Solscan ↗
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("contract_page.instructions")}
          </h2>
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
          <h2 style={{ fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.5rem", color: "#888", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("contract_page.security")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { ok: true,  label: t("contract_page.sec1") },
              { ok: true,  label: t("contract_page.sec2") },
              { ok: true,  label: t("contract_page.sec3") },
              { ok: true,  label: t("contract_page.sec4") },
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
          <a href={`https://explorer.solana.com/address/${FAVE_PROGRAM_ID}?cluster=devnet`} target="_blank"
            style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.75rem 1.5rem", color: "#ccc", fontSize: "0.9rem" }}>
            Programme (devnet) →
          </a>
        </div>
      </div>
    </>
  );
}
