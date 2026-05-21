import React from "react";
import { useTranslation } from "react-i18next";

export default function LangSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("fr") ? "fr" : "en";

  return (
    <div style={{ display: "flex", gap: "0.25rem", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "0.2rem" }}>
      {["en", "fr"].map(lang => (
        <button key={lang} onClick={() => i18n.changeLanguage(lang)}
          style={{
            background: current === lang ? "#FFD700" : "transparent",
            color: current === lang ? "#080808" : "#666",
            border: "none", borderRadius: 4, padding: "0.25rem 0.6rem",
            fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
            letterSpacing: "0.05em", textTransform: "uppercase",
            transition: "all 0.15s",
          }}>
          {lang}
        </button>
      ))}
    </div>
  );
}
