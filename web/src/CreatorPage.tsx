import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import idl from "./idl";
import { getCreator, registerSubscription } from "./api";

const PROGRAM_ID = new PublicKey("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");
const PROTOCOL_TREASURY = new PublicKey("D9P8Uqmxvtg9mr16GGFA2z7fFwWBYKuDMFpDYioiVFbt");

type Tier = "bronze" | "silver" | "gold";

const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "#CD7F32", bg: "#2a1f0f", perks: ["Accès au contenu exclusif", "Badge fan"] },
  silver: { label: "Silver", color: "#C0C0C0", bg: "#1a1a1f", perks: ["Tout Bronze", "Vote sur le prochain contenu", "Discord privé"] },
  gold:   { label: "Gold",   color: "#FFD700", bg: "#1f1a00", perks: ["Tout Silver", "Lives privés", "Mention dans les vidéos"] },
};

interface MembershipInfo {
  name: string;
  priceBronze: number;
  priceSilver: number;
  priceGold: number;
  totalSold: number;
}

interface SubInfo {
  tier: Tier;
  expiresAt: Date;
  isActive: boolean;
}

export default function CreatorPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [txMsg, setTxMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const creatorKey = (() => {
    try { return new PublicKey(address!); }
    catch { return null; }
  })();

  const getMembershipPda = (creator: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("fave-membership"), creator.toBuffer()], PROGRAM_ID)[0];

  const getMintPda = (creator: PublicKey, tier: Tier) =>
    PublicKey.findProgramAddressSync([Buffer.from(`fave-mint-${tier}`), creator.toBuffer()], PROGRAM_ID)[0];

  const getFanAccountPda = (fan: PublicKey, membershipPda: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("fave-fan"), fan.toBuffer(), membershipPda.toBuffer()], PROGRAM_ID)[0];

  const getProgram = (w = wallet) => {
    const provider = new anchor.AnchorProvider(connection, w as unknown as anchor.Wallet, { commitment: "confirmed" });
    return new anchor.Program(idl as anchor.Idl, provider);
  };

  useEffect(() => {
    if (!creatorKey) { setNotFound(true); setFetching(false); return; }
    loadMembership();
  }, [address]);

  useEffect(() => {
    if (wallet.publicKey && creatorKey) loadSubscription();
  }, [wallet.publicKey, address]);

  const loadMembership = async () => {
    if (!creatorKey) return;
    setFetching(true);
    try {
      const provider = new anchor.AnchorProvider(connection, {} as anchor.Wallet, {});
      const program = new anchor.Program(idl as anchor.Idl, provider);
      const pda = getMembershipPda(creatorKey);
      const acc = await (program.account as any).membership.fetch(pda);
      setMembership({
        name: acc.name,
        priceBronze: acc.priceBronze.toNumber(),
        priceSilver: acc.priceSilver.toNumber(),
        priceGold: acc.priceGold.toNumber(),
        totalSold: acc.totalSold.toNumber(),
      });
    } catch {
      setNotFound(true);
    }
    setFetching(false);
  };

  const loadSubscription = async () => {
    if (!wallet.publicKey || !creatorKey) return;
    try {
      const program = getProgram();
      const membershipPda = getMembershipPda(creatorKey);
      const fanPda = getFanAccountPda(wallet.publicKey, membershipPda);
      const acc = await (program.account as any).fanAccount.fetch(fanPda);
      const expiresAt = new Date(acc.expiresAt.toNumber() * 1000);
      setSubscription({ tier: Object.keys(acc.tier)[0] as Tier, expiresAt, isActive: expiresAt > new Date() });
    } catch {
      setSubscription(null);
    }
  };

  const handleBuy = async (tier: Tier) => {
    if (!wallet.publicKey || !creatorKey) return;
    setLoading(true); setTxMsg(null);
    try {
      const program = getProgram();
      const membershipPda = getMembershipPda(creatorKey);
      const fanAccountPda = getFanAccountPda(wallet.publicKey, membershipPda);
      const mintPda = getMintPda(creatorKey, tier);
      const fanTokenAccount = await getAssociatedTokenAddress(mintPda, wallet.publicKey);
      const tx = await (program.methods as any)
        .buySubscription({ [tier]: {} })
        .accounts({
          membership: membershipPda, fanAccount: fanAccountPda,
          mint: mintPda, fanTokenAccount, fan: wallet.publicKey,
          creator: creatorKey, protocolTreasury: PROTOCOL_TREASURY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setTxMsg(tx);
      await registerSubscription({
        fan_address: wallet.publicKey!.toBase58(),
        creator_address: creatorKey.toBase58(),
        tier,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tx_signature: tx,
      });
      await loadSubscription();
    } catch (e: any) {
      setTxMsg(`error:${e.message}`);
    }
    setLoading(false);
  };

  const formatPrice = (l: number) => `${(l / LAMPORTS_PER_SOL).toFixed(3)} SOL`;

  if (fetching) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080808", color: "#666", fontFamily: "DM Sans, sans-serif" }}>
      Chargement...
    </div>
  );

  if (notFound || !creatorKey) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400&display=swap'); body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; margin: 0; }`}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "4rem", color: "#FFD700" }}>404</div>
        <p style={{ color: "#666" }}>Ce créateur n'a pas encore de membership sur Fave.</p>
        <button onClick={() => navigate("/")} style={{ background: "#FFD700", color: "#080808", border: "none", borderRadius: 4, padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 500, marginTop: "1rem" }}>
          Retour à l'accueil
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e8e0; font-family: 'DM Sans', sans-serif; }
        .btn-primary { background: #FFD700; color: #080808; border: none; border-radius: 4px; padding: 0.625rem 1.5rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,215,0,0.08)",
        background: "rgba(8,8,8,0.95)", position: "sticky", top: 0, zIndex: 50 }}>
        <div onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "#FFD700", cursor: "pointer" }}>⭐ Fave</div>
        <WalletMultiButton />
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Header créateur */}
        <div style={{ marginBottom: "3rem" }}>
        {membership && (membership as any).banner_url && (
          <div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem" }}>
            <img src={(membership as any).banner_url} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #FFD700, #CD7F32)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, margin: "0 auto 1rem", color: "#080808",
            fontFamily: "'Playfair Display', serif" }}>
            {membership!.name.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", marginBottom: "0.5rem" }}>
            {membership!.name}
          </h1>
          <p style={{ color: "#555", fontSize: "0.85rem", fontFamily: "monospace" }}>
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
          <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {membership!.totalSold} abonné{membership!.totalSold > 1 ? "s" : ""}
          </p>
        </div>

        {/* Badge abonnement actif */}
        {subscription?.isActive && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#0a180a", border: "1px solid #1a3a1a", borderRadius: 8,
            padding: "0.875rem 1.25rem", marginBottom: "2rem", fontSize: "0.9rem" }}>
            <span>⭐ Abonné <strong style={{ color: TIER_CONFIG[subscription.tier].color }}>{TIER_CONFIG[subscription.tier].label}</strong></span>
            <span style={{ color: "#555", fontSize: "0.8rem" }}>
              Expire le {subscription.expiresAt.toLocaleDateString("fr-FR")}
            </span>
          </div>
        )}

        {/* Cards tiers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {(["bronze", "silver", "gold"] as Tier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const price = membership![`price${config.label}` as keyof MembershipInfo] as number;
            const isCurrent = subscription?.isActive && subscription.tier === tier;

            return (
              <div key={tier} style={{ border: `1px solid ${isCurrent ? config.color : config.color + "33"}`,
                borderRadius: 10, padding: "1.5rem", background: config.bg,
                boxShadow: isCurrent ? `0 0 20px ${config.color}22` : "none",
                transition: "transform 0.2s" }}>
                <div style={{ color: config.color, fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  {config.label}
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.25rem" }}>
                  {formatPrice(price)}
                  <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: 400 }}>/mois</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {config.perks.map((perk, j) => (
                    <li key={j} style={{ color: "#aaa", fontSize: "0.85rem", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: config.color, fontSize: "0.65rem", marginTop: "0.2rem" }}>✦</span>{perk}
                    </li>
                  ))}
                </ul>
                <button className="btn-primary" style={{ width: "100%", background: isCurrent ? "#1a1a1a" : config.color,
                  color: isCurrent ? config.color : "#080808",
                  border: isCurrent ? `1px solid ${config.color}44` : "none" }}
                  disabled={loading || isCurrent || !wallet.publicKey}
                  onClick={() => handleBuy(tier)}>
                  {isCurrent ? "Actif ✓" : !wallet.publicKey ? "Connecte ton wallet" : loading ? "Transaction..." : `S'abonner`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Message tx */}
        {txMsg && (
          <div style={{ padding: "1rem", background: txMsg.startsWith("error:") ? "#1a0808" : "#081a08",
            border: `1px solid ${txMsg.startsWith("error:") ? "#4a1a1a" : "#1a4a1a"}`,
            borderRadius: 8, fontSize: "0.82rem", fontFamily: "monospace",
            color: txMsg.startsWith("error:") ? "#ff8888" : "#88ff88", wordBreak: "break-all" }}>
            {txMsg.startsWith("error:") ? txMsg.replace("error:", "❌ ") : (
              <>✅ Transaction confirmée — <a href={`https://explorer.solana.com/tx/${txMsg}?cluster=devnet`}
                target="_blank" style={{ color: "#FFD700" }}>voir sur Explorer →</a></>
            )}
          </div>
        )}

        {/* Partage */}
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Lien de ta page</p>
            <code style={{ color: "#888", fontSize: "0.8rem" }}>
              faveprotocol.xyz/creator/{address?.slice(0, 12)}...
            </code>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`https://faveprotocol.xyz/creator/${address}`); }}
            style={{ background: "transparent", border: "1px solid #333", borderRadius: 4,
              padding: "0.5rem 1rem", color: "#888", cursor: "pointer", fontSize: "0.85rem" }}>
            Copier le lien
          </button>
        </div>
      </main>
    </>
  );
}
