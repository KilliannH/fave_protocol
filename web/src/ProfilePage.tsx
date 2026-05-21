import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import { getCreator, updateCreator, type Creator } from "./api";
import { useS3Upload } from "./useS3Upload";
import Nav from "./Nav";

export default function ProfilePage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useTranslation();
  const { upload, uploading } = useS3Upload();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!wallet.publicKey) return;
    getCreator(wallet.publicKey.toBase58()).then(c => {
      if (!c) return;
      setCreator(c);
      setBio(c.bio || "");
      setAvatarUrl(c.avatar_url || "");
      setBannerUrl((c as any).banner_url || "");
      setTwitter(c.twitter || "");
      setYoutube(c.youtube || "");
      setTwitch(c.twitch || "");
    });
  }, [wallet.publicKey]);

  const handleFileUpload = async (file: File, type: "avatars" | "banners") => {
    const url = await upload(file, type);
    if (type === "avatars") setAvatarUrl(url);
    else setBannerUrl(url);
  };

  const handleSave = async () => {
    if (!wallet.publicKey) return;
    setSaving(true);
    await updateCreator(wallet.publicKey.toBase58(), {
      bio, avatar_url: avatarUrl, banner_url: bannerUrl, twitter, youtube, twitch
    } as any);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle: React.CSSProperties = {
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
        .upload-zone { border: 2px dashed #222; border-radius: 8px; cursor: pointer; transition: border-color 0.2s; overflow: hidden; }
        .upload-zone:hover { border-color: rgba(255,215,0,0.3); }
      `}</style>

      <Nav />

      <div style={{ maxWidth: 620, margin: "4rem auto", padding: "0 2rem" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>
          {t("profile_page.label")}
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.5rem" }}>
          {t("profile_page.title")}
        </h1>
        <p style={{ color: "#555", marginBottom: "3rem", fontSize: "0.9rem" }}>{t("profile_page.description")}</p>

        {!wallet.publicKey ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid #1a1a1a", borderRadius: 12 }}>
            <p style={{ color: "#555", marginBottom: "1.5rem" }}>{t("profile_page.connect_prompt")}</p>
            <WalletMultiButton />
          </div>
        ) : !creator ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid #1a1a1a", borderRadius: 12 }}>
            <p style={{ color: "#555", marginBottom: "1.5rem" }}>{t("profile_page.no_membership")}</p>
            <button onClick={() => navigate("/create")}
              style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 4, padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 500 }}>
              {t("profile_page.create_cta")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Bannière */}
            <div>
              <label>Bannière</label>
              <div className="upload-zone" style={{ height: 140, position: "relative" }}
                onClick={() => bannerInputRef.current?.click()}>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="banner"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#444", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🖼</span>
                    <span style={{ fontSize: "0.8rem" }}>Clique pour uploader une bannière</span>
                    <span style={{ fontSize: "0.75rem", color: "#333" }}>JPG, PNG, WebP — max 5MB</span>
                  </div>
                )}
                {uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#FFD700" }}>Upload en cours...</span>
                  </div>
                )}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "banners"); }} />
            </div>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem" }}>
              <div>
                <label>{t("profile_page.avatar_url")}</label>
                <div className="upload-zone" style={{ width: 80, height: 80, borderRadius: "50%", position: "relative" }}
                  onClick={() => avatarInputRef.current?.click()}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar"
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%",
                      fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700,
                      background: "linear-gradient(135deg, #FFD700, #CD7F32)", color: "#080808", borderRadius: "50%" }}>
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "avatars"); }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>{creator.name}</div>
                <div style={{ color: "#555", fontSize: "0.8rem", fontFamily: "monospace" }}>
                  {wallet.publicKey.toBase58().slice(0, 12)}...
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label>{t("profile_page.bio")}</label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" } as React.CSSProperties}
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder={t("profile_page.bio_placeholder")} maxLength={300} />
              <div style={{ color: "#333", fontSize: "0.75rem", textAlign: "right", marginTop: "0.25rem" }}>{bio.length}/300</div>
            </div>

            {/* Réseaux sociaux */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Twitter / X", value: twitter, set: setTwitter, placeholder: "@username" },
                { label: "YouTube",     value: youtube, set: setYoutube, placeholder: "@channel" },
                { label: "Twitch",      value: twitch,  set: setTwitch,  placeholder: "username" },
              ].map((field, i) => (
                <div key={i}>
                  <label>{field.label}</label>
                  <input style={inputStyle} value={field.value}
                    onChange={e => field.set(e.target.value)} placeholder={field.placeholder} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <button onClick={handleSave} disabled={saving || uploading}
                style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 6,
                  padding: "0.875rem 2rem", fontSize: "0.95rem", fontWeight: 500,
                  cursor: saving || uploading ? "not-allowed" : "pointer",
                  opacity: saving || uploading ? 0.6 : 1 }}>
                {saving ? t("profile_page.saving") : t("profile_page.save")}
              </button>
              {saved && <span style={{ color: "#4a4", fontSize: "0.875rem" }}>{t("profile_page.saved")}</span>}
              <button onClick={() => navigate(`/creator/${wallet.publicKey!.toBase58()}`)}
                style={{ background: "transparent", border: "1px solid #333", borderRadius: 6,
                  padding: "0.875rem 1.25rem", color: "#888", cursor: "pointer", fontSize: "0.875rem" }}>
                {t("profile_page.view_page")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
