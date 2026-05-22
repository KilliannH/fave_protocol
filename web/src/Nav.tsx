import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCreator } from "./api";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useTranslation } from "react-i18next";
import LangSwitcher from "./LangSwitcher";

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (!wallet.publicKey) { setIsCreator(false); return; }
    getCreator(wallet.publicKey.toBase58()).then(c => setIsCreator(!!c)).catch(() => setIsCreator(false));
  }, [wallet.publicKey]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,215,0,0.08)",
      background: "rgba(8,8,8,0.95)", position: "sticky", top: 0, zIndex: 50,
      backdropFilter: "blur(12px)",
    }}>
      <div onClick={() => navigate("/")}
        style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#FFD700", cursor: "pointer" }}>
        <img src="/fave-token-logo-256.png" alt="Fave" style={{width:32,height:32,borderRadius:"50%",marginRight:"0.5rem",verticalAlign:"middle"}} />Fave
      </div>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {[
          { path: "/creators", label: t("nav.creators") },
          { path: "/contract", label: t("nav.contract") },
        ].map(({ path, label }) => (
          <span key={path} onClick={() => navigate(path)}
            style={{
              color: isActive(path) ? "#FFD700" : "#666",
              fontSize: "0.8rem", letterSpacing: "0.08em",
              textTransform: "uppercase", cursor: "pointer",
              transition: "color 0.2s",
              borderBottom: isActive(path) ? "1px solid #FFD700" : "1px solid transparent",
              paddingBottom: "2px",
            }}>
            {label}
          </span>
        ))}
        {wallet.publicKey && (
          <>
            <span onClick={() => navigate(`/dashboard/${wallet.publicKey!.toBase58()}`)}
              style={{
                color: isActive(`/dashboard/${wallet.publicKey.toBase58()}`) ? "#FFD700" : "#666",
                fontSize: "0.8rem", letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s",
              }}>
              Dashboard
            </span>
            <span onClick={() => navigate("/profile")}
              style={{
                color: isActive("/profile") ? "#FFD700" : "#666",
                fontSize: "0.8rem", letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s",
              }}>
              {t("profile_page.label")}
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
        <LangSwitcher />
        <button onClick={() => navigate("/create")}
          style={{
            background: "transparent", color: "#FFD700",
            border: "1px solid rgba(255,215,0,0.3)", borderRadius: 4,
            padding: "0.5rem 1rem", fontSize: "0.8rem", cursor: "pointer",
            letterSpacing: "0.05em", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#FFD700")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)")}>
          {t("create_page.label")}
        </button>
        <WalletMultiButton />
      </div>
    </nav>
  );
}
