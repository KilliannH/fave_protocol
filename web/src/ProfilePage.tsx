import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getCreator, updateCreator, type Creator } from "./api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!wallet.publicKey) return;
    getCreator(wallet.publicKey.toBase58()).then(c => {
      if (!c) return;
      setCreator(c);
      setBio(c.bio || "");
      setAvatarUrl(c.avatar_url || "");
      setTwitter(c.twitter || "");
      setYoutube(c.youtube || "");
      setTwitch(c.twitch || "");
    });
  }, [wallet.publicKey]);

  const handleSave = async () => {
    if (!wallet.publicKey) return;
    setSaving(true);
    await updateCreator(wallet.publicKey.toBase58(), { bio, avatar_url: avatarUrl, twitter, youtube, twitch });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = {
    background: "#111", border: "1px solid #222", borderRadius: 6,
    padding: "0.75rem 1rem", color: "#e8e8e0",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", width: "100%",
    outline: "none", transition: "border-color 0.2s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        input:focus, textarea:focus { border-color: rgba(255,215,0,0.4) !important; }
        label { display: block; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: #555; margin-bottom: 0.4rem; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,215,0,0.08)" }}>
        <div onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#FFD700", cursor: "pointer" }}>⭐ Fave</div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {wallet.publicKey && (
            <button onClick={() => navigate(`/dashboard/${wallet.publicKey!.toBase58()}`)}
              style={{ background: "transparent", border: "1px solid #333", borderRadius: 4, padding: "0.5rem 1rem", color: "#888", cursor: "pointer", fontSize: "0.85rem" }}>
              Dashboard
            </button>
          )}
          <WalletMultiButton />
        </div>
      </nav>

      <div style={{ maxWidth: 580, margin: "4rem auto", padding: "0 2rem" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>Profil</span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.5rem" }}>Mon profil créateur</h1>
        <p style={{ color: "#555", marginBottom: "3rem", fontSize: "0.9rem" }}>Ces informations apparaissent sur ta page publique.</p>

        {!wallet.publicKey ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid #1a1a1a", borderRadius: 12 }}>
            <p style={{ color: "#555", marginBottom: "1.5rem" }}>Connecte ton wallet pour accéder à ton profil</p>
            <WalletMultiButton />
          </div>
        ) : !creator ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid #1a1a1a", borderRadius: 12 }}>
            <p style={{ color: "#555", marginBottom: "1.5rem" }}>Tu n'as pas encore de membership.</p>
            <button onClick={() => navigate("/create")}
              style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 4, padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 500 }}>
              Créer ma membership →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Preview avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem",
              background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 10 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #CD7F32)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#080808" }}>
                  {creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 500 }}>{creator.name}</div>
                <div style={{ color: "#555", fontSize: "0.8rem", fontFamily: "monospace" }}>
                  {wallet.publicKey.toBase58().slice(0, 12)}...
                </div>
              </div>
            </div>

            <div>
              <label>URL de la photo de profil</label>
              <input style={inputStyle} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label>Bio</label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" } as React.CSSProperties}
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Décris ta chaîne en quelques mots..." maxLength={300} />
              <div style={{ color: "#333", fontSize: "0.75rem", textAlign: "right", marginTop: "0.25rem" }}>{bio.length}/300</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Twitter / X", value: twitter, set: setTwitter, placeholder: "@username" },
                { label: "YouTube",     value: youtube, set: setYoutube, placeholder: "@channel" },
                { label: "Twitch",      value: twitch,  set: setTwitch,  placeholder: "username" },
              ].map((field, i) => (
                <div key={i}>
                  <label>{field.label}</label>
                  <input style={inputStyle} value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 6,
                  padding: "0.875rem 2rem", fontSize: "0.95rem", fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              {saved && <span style={{ color: "#4a4", fontSize: "0.875rem" }}>✓ Profil mis à jour</span>}
              <button onClick={() => navigate(`/creator/${wallet.publicKey!.toBase58()}`)}
                style={{ background: "transparent", border: "1px solid #333", borderRadius: 6,
                  padding: "0.875rem 1.25rem", color: "#888", cursor: "pointer", fontSize: "0.875rem" }}>
                Voir ma page →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
