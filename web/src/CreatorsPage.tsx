import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Nav from "./Nav";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getCreators, type Creator } from "./api";

export default function CreatorsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filtered, setFiltered] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreators().then(c => { setCreators(c); setFiltered(c); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(creators); return; }
    setFiltered(creators.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.wallet_address.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, creators]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        input { background: #111; border: 1px solid #222; border-radius: 8px; padding: 0.875rem 1.25rem;
          color: #e8e8e0; font-family: 'DM Sans', sans-serif; font-size: 1rem; width: 100%;
          outline: none; transition: border-color 0.2s; }
        input:focus { border-color: rgba(255,215,0,0.4); }
        .card { background: #0c0c0c; border: 1px solid #1a1a1a; border-radius: 12px; padding: 1.5rem;
          cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
        .card:hover { border-color: rgba(255,215,0,0.2); transform: translateY(-2px); }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>{t("creators_page.label")}</span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", marginBottom: "2rem" }}>
          {t("creators_page.title")}
        </h1>

        <input
          placeholder={t("creators_page.search_placeholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "2rem" }}
        />

        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: "4rem" }}>{ t('creators_page.loading') }</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: "4rem" }}>
            {search ? t("creators_page.no_results", { query: search }) : t("creators_page.empty")}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {filtered.map(creator => (
              <div key={creator.id} className="card" onClick={() => navigate(`/creator/${creator.wallet_address}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.name}
                      style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "50%",
                      background: "linear-gradient(135deg, #FFD700, #CD7F32)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#080808" }}>
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {creator.name}
                      {creator.verified && <span style={{ color: "#FFD700", fontSize: "0.75rem" }}>✓</span>}
                    </div>
                    <div style={{ color: "#555", fontSize: "0.75rem" }}>{creator.total_sold} {t("creators_page.subscribers")}</div>
                  </div>
                </div>
                {creator.bio && (
                  <p style={{ color: "#666", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1rem",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {creator.bio}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {[
                    { tier: "Bronze", price: creator.price_bronze, color: "#CD7F32" },
                    { tier: "Silver", price: creator.price_silver, color: "#C0C0C0" },
                    { tier: "Gold",   price: creator.price_gold,   color: "#FFD700" },
                  ].map(tier => (
                    <span key={tier.tier} style={{ background: `${tier.color}11`, border: `1px solid ${tier.color}33`,
                      borderRadius: 4, padding: "0.2rem 0.6rem", fontSize: "0.75rem", color: tier.color }}>
                      {(tier.price / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
