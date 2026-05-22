import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Nav from "./Nav";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface DashboardData {
  creator: { name: string; wallet_address: string; total_sold: number; price_bronze: number; price_silver: number; price_gold: number; };
  active_subs: { tier: string; count: string }[];
  total_revenue_lamports: number;
  recent_subscribers: { fan_address: string; tier: string; expires_at: string; created_at: string }[];
}

const TIER_COLORS: Record<string, string> = { bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700" };

export default function DashboardPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetch(`${API_URL}/dashboard/${address}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  useEffect(() => {
    if (wallet.publicKey && address && wallet.publicKey.toBase58() !== address) {
      setUnauthorized(true);
    }
  }, [wallet.publicKey, address]);

  const totalActiveSubs = (data?.active_subs ?? []).reduce((acc, s) => acc + parseInt(s.count), 0) || 0;
  const revenueSOL = data ? (data?.total_revenue_lamports / LAMPORTS_PER_SOL).toFixed(4) : "0";

  const statCard = (value: string | number, label: string, color = "#FFD700") => (
    <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: "1.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, color, lineHeight: 1, marginBottom: "0.4rem" }}>{value}</div>
      <div style={{ color: "#555", fontSize: "0.8rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: "4rem" }}>Chargement...</div>
        ) : !data ? (
          <div style={{ textAlign: "center", color: "#555", padding: "4rem" }}>Créateur introuvable.</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "0.5rem" }}>Dashboard</span>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem" }}>{data?.creator?.name ?? "—"}</h1>
              </div>
              <button onClick={() => navigate(`/creator/${address}`)}
                style={{ background: "transparent", border: "1px solid #333", borderRadius: 4, padding: "0.625rem 1.25rem", color: "#888", cursor: "pointer", fontSize: "0.85rem" }}>
                Voir ma page →
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {statCard(totalActiveSubs, "Abonnés actifs")}
              {statCard(`${revenueSOL}`, "SOL gagnés", "#4a4")}
              {statCard(data?.creator.total_sold, "Total abonnements")}
            </div>

            {/* Répartition par tier */}
            <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: "1.5rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "1.25rem" }}>
                Répartition par niveau
              </h2>
              {data?.active_subs.length === 0 ? (
                <p style={{ color: "#333", fontSize: "0.9rem" }}>Pas encore d'abonnés.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {["bronze", "silver", "gold"].map(tier => {
                    const sub = data?.active_subs.find(s => s.tier === tier);
                    const count = sub ? parseInt(sub.count) : 0;
                    const pct = totalActiveSubs > 0 ? (count / totalActiveSubs) * 100 : 0;
                    const price = data?.creator?.[`price_${tier}` as keyof typeof data?.creator] as number;
                    return (
                      <div key={tier}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ color: TIER_COLORS[tier], fontSize: "0.9rem", fontWeight: 500, textTransform: "capitalize" }}>{tier}</span>
                          <span style={{ color: "#555", fontSize: "0.85rem" }}>{count} abonnés · {(price / LAMPORTS_PER_SOL).toFixed(3)} SOL/mois</span>
                        </div>
                        <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: TIER_COLORS[tier], borderRadius: 3, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Derniers abonnés */}
            <div style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "1.25rem" }}>
                Derniers abonnés
              </h2>
              {data?.recent_subscribers.length === 0 ? (
                <p style={{ color: "#333", fontSize: "0.9rem" }}>Pas encore d'abonnés.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {data?.recent_subscribers.map((sub, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.875rem 0", borderBottom: i < data?.recent_subscribers.length - 1 ? "1px solid #111" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%",
                          background: `${TIER_COLORS[sub.tier]}22`, border: `1px solid ${TIER_COLORS[sub.tier]}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.7rem", color: TIER_COLORS[sub.tier], fontWeight: 600, textTransform: "capitalize" }}>
                          {sub.tier.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#aaa" }}>
                            {sub.fan_address.slice(0, 8)}...{sub.fan_address.slice(-6)}
                          </div>
                          <div style={{ color: "#444", fontSize: "0.75rem" }}>
                            {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: TIER_COLORS[sub.tier], fontSize: "0.8rem", textTransform: "capitalize", fontWeight: 500 }}>{sub.tier}</div>
                        <div style={{ color: "#444", fontSize: "0.75rem" }}>
                          expire {new Date(sub.expires_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
