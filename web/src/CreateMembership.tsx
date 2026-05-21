import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";


const PROGRAM_ID = new PublicKey("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");

export default function CreateMembership() {
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [name, setName] = useState("");
  const [priceBronze, setPriceBronze] = useState("0.01");
  const [priceSilver, setPriceSilver] = useState("0.05");
  const [priceGold, setPriceGold] = useState("0.10");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getMintPda = (creator: PublicKey, tier: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from(`fave-mint-${tier}`), creator.toBuffer()], PROGRAM_ID
    )[0];

  const handleCreate = async () => {
    if (!wallet.publicKey || !name) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as unknown as anchor.Wallet, { commitment: "confirmed" });
      const program = new anchor.Program(idl as anchor.Idl, provider);
      const [membershipPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("fave-membership"), wallet.publicKey.toBuffer()], PROGRAM_ID
      );
      const tx = await (program.methods as any)
        .initializeMembership(
          name,
          new anchor.BN(parseFloat(priceBronze) * LAMPORTS_PER_SOL),
          new anchor.BN(parseFloat(priceSilver) * LAMPORTS_PER_SOL),
          new anchor.BN(parseFloat(priceGold) * LAMPORTS_PER_SOL),
        )
        .accounts({
          membership: membershipPda,
          mintBronze: getMintPda(wallet.publicKey, "bronze"),
          mintSilver: getMintPda(wallet.publicKey, "silver"),
          mintGold: getMintPda(wallet.publicKey, "gold"),
          creator: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setSuccess(tx);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        input { background: #111; border: 1px solid #222; border-radius: 6px; padding: 0.75rem 1rem;
          color: #e8e8e0; font-family: 'DM Sans', sans-serif; font-size: 1rem; width: 100%;
          transition: border-color 0.2s; outline: none; }
        input:focus { border-color: rgba(255,215,0,0.4); }
        label { display: block; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: #666; margin-bottom: 0.5rem; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 3rem", borderBottom: "1px solid rgba(255,215,0,0.08)", background: "rgba(8,8,8,0.95)" }}>
        <div onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#FFD700", cursor: "pointer" }}>⭐ Fave</div>
        <WalletMultiButton />
      </nav>

      <div style={{ maxWidth: 560, margin: "5rem auto", padding: "0 2rem" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFD700", display: "block", marginBottom: "1rem" }}>
          Créateur
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.75rem", lineHeight: 1.15 }}>
          Lance ta membership
        </h1>
        <p style={{ color: "#666", marginBottom: "3rem", lineHeight: 1.7 }}>
          Déploie ton contrat d'abonnement en une transaction. Tes fans pourront s'abonner directement depuis leur wallet Solana.
        </p>

        {!wallet.publicKey ? (
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid #222", borderRadius: 12 }}>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>Connecte ton wallet pour continuer</p>
            <WalletMultiButton />
          </div>
        ) : success ? (
          <div style={{ background: "#0a1a0a", border: "1px solid #1a4a1a", borderRadius: 12, padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: "0.75rem" }}>Membership créée !</h2>
            <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1.5rem", fontFamily: "monospace", wordBreak: "break-all" }}>
              Tx : {success}
            </p>
            <a href={`https://explorer.solana.com/tx/${success}?cluster=devnet`} target="_blank"
              style={{ color: "#FFD700", fontSize: "0.85rem", display: "block", marginBottom: "1.5rem" }}>
              Voir sur Solana Explorer →
            </a>
            <button onClick={() => navigate(`/creator/${wallet.publicKey?.toBase58()}`)} style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 4, padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 500 }}>
              Voir ma page →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label>Nom de ta chaîne</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: MaChaine" maxLength={32} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "🥉 Bronze (SOL)", value: priceBronze, set: setPriceBronze, color: "#CD7F32" },
                { label: "🥈 Silver (SOL)", value: priceSilver, set: setPriceSilver, color: "#C0C0C0" },
                { label: "🥇 Gold (SOL)",   value: priceGold,   set: setPriceGold,   color: "#FFD700" },
              ].map((tier, i) => (
                <div key={i}>
                  <label style={{ color: tier.color }}>{tier.label}</label>
                  <input type="number" step="0.01" min="0.001" value={tier.value}
                    onChange={e => tier.set(e.target.value)}
                    style={{ borderColor: `${tier.color}33` }} />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: "#1a0a0a", border: "1px solid #4a1a1a", borderRadius: 8, padding: "1rem", color: "#ff6666", fontSize: "0.85rem" }}>
                {error.includes("already in use") ? "Tu as déjà une membership active sur ce wallet." : error}
              </div>
            )}

            <button onClick={handleCreate} disabled={loading || !name}
              style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 6,
                padding: "1rem", fontSize: "1rem", fontWeight: 500, cursor: loading || !name ? "not-allowed" : "pointer",
                opacity: loading || !name ? 0.5 : 1, transition: "opacity 0.2s" }}>
              {loading ? "Transaction en cours..." : "Créer ma membership →"}
            </button>

            <p style={{ color: "#444", fontSize: "0.8rem", textAlign: "center" }}>
              Frais de déploiement : ~0.01 SOL (rent Solana)
            </p>
          </div>
        )}
      </div>
    </>
  );
}
