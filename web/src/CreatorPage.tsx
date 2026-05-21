import React, { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import idl from "../../sdk/idl/fave_protocol.json";

const PROGRAM_ID = new PublicKey("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");
const PROTOCOL_TREASURY = new PublicKey("D9P8Uqmxvtg9mr16GGFA2z7fFwWBYKuDMFpDYioiVFbt");

// Pour la démo on utilise une adresse de créateur hardcodée
// En prod ce serait dans l'URL : /creator/:address
const CREATOR_ADDRESS = new PublicKey("D9P8Uqmxvtg9mr16GGFA2z7fFwWBYKuDMFpDYioiVFbt");

type Tier = "bronze" | "silver" | "gold";

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

const TIER_CONFIG = {
  bronze: {
    label: "Bronze",
    color: "#CD7F32",
    bg: "#2a1f0f",
    perks: ["Accès au contenu exclusif", "Badge fan"],
  },
  silver: {
    label: "Silver",
    color: "#C0C0C0",
    bg: "#1a1a1f",
    perks: ["Tout Bronze", "Vote sur le prochain contenu", "Discord privé"],
  },
  gold: {
    label: "Gold",
    color: "#FFD700",
    bg: "#1f1a00",
    perks: ["Tout Silver", "Lives privés", "Mention dans les vidéos"],
  },
};

export default function CreatorPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [txMsg, setTxMsg] = useState<string | null>(null);

  const getProgram = () => {
    if (!wallet.publicKey) return null;
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as unknown as anchor.Wallet,
      { commitment: "confirmed" }
    );
    return new anchor.Program(idl as anchor.Idl, provider);
  };

  const getMembershipPda = (creator: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("fave-membership"), creator.toBuffer()],
      PROGRAM_ID
    )[0];

  const getMintPda = (creator: PublicKey, tier: Tier) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from(`fave-mint-${tier}`), creator.toBuffer()],
      PROGRAM_ID
    )[0];

  const getFanAccountPda = (fan: PublicKey, membershipPda: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("fave-fan"), fan.toBuffer(), membershipPda.toBuffer()],
      PROGRAM_ID
    )[0];

  useEffect(() => {
    loadMembership();
  }, []);

  useEffect(() => {
    if (wallet.publicKey) loadSubscription();
  }, [wallet.publicKey]);

  const loadMembership = async () => {
    try {
      const program = new anchor.Program(
        idl as anchor.Idl,
        new anchor.AnchorProvider(connection, {} as anchor.Wallet, {})
      );
      const pda = getMembershipPda(CREATOR_ADDRESS);
      const acc = await (program.account as any).membership.fetch(pda);
      setMembership({
        name: acc.name,
        priceBronze: acc.priceBronze.toNumber(),
        priceSilver: acc.priceSilver.toNumber(),
        priceGold: acc.priceGold.toNumber(),
        totalSold: acc.totalSold.toNumber(),
      });
    } catch {
      setMembership(null);
    }
  };

  const loadSubscription = async () => {
    if (!wallet.publicKey) return;
    try {
      const program = getProgram()!;
      const membershipPda = getMembershipPda(CREATOR_ADDRESS);
      const fanPda = getFanAccountPda(wallet.publicKey, membershipPda);
      const acc = await (program.account as any).fanAccount.fetch(fanPda);
      const expiresAt = new Date(acc.expiresAt.toNumber() * 1000);
      setSubscription({
        tier: Object.keys(acc.tier)[0] as Tier,
        expiresAt,
        isActive: expiresAt > new Date(),
      });
    } catch {
      setSubscription(null);
    }
  };

  const handleBuy = async (tier: Tier) => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setTxMsg(null);
    try {
      const program = getProgram()!;
      const membershipPda = getMembershipPda(CREATOR_ADDRESS);
      const fanAccountPda = getFanAccountPda(wallet.publicKey, membershipPda);
      const mintPda = getMintPda(CREATOR_ADDRESS, tier);
      const fanTokenAccount = await getAssociatedTokenAddress(mintPda, wallet.publicKey);

      const tx = await (program.methods as any)
        .buySubscription({ [tier]: {} })
        .accounts({
          membership: membershipPda,
          fanAccount: fanAccountPda,
          mint: mintPda,
          fanTokenAccount,
          fan: wallet.publicKey,
          creator: CREATOR_ADDRESS,
          protocolTreasury: PROTOCOL_TREASURY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      setTxMsg(`✅ Abonnement activé ! Tx : ${tx.slice(0, 16)}...`);
      await loadSubscription();
    } catch (e: any) {
      setTxMsg(`❌ Erreur : ${e.message}`);
    }
    setLoading(false);
  };

  const formatPrice = (lamports: number) =>
    `${(lamports / LAMPORTS_PER_SOL).toFixed(3)} SOL`;

  return (
    <div className="page">
      <header className="header">
        <div className="logo">⭐ Fave</div>
        <WalletMultiButton />
      </header>

      <main className="main">
        {membership ? (
          <>
            <div className="creator-hero">
              <div className="creator-avatar">
                {membership.name.charAt(0).toUpperCase()}
              </div>
              <h1>{membership.name}</h1>
              <p className="creator-stats">{membership.totalSold} abonnés actifs</p>
            </div>

            {subscription?.isActive && (
              <div className="active-badge">
                <span>⭐ Abonné {TIER_CONFIG[subscription.tier].label}</span>
                <span className="expires">
                  Expire le {subscription.expiresAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}

            <div className="tiers">
              {(["bronze", "silver", "gold"] as Tier[]).map((tier) => {
                const config = TIER_CONFIG[tier];
                const price = membership[`price${config.label}` as keyof MembershipInfo] as number;
                const isCurrent = subscription?.isActive && subscription.tier === tier;

                return (
                  <div
                    key={tier}
                    className={`tier-card ${isCurrent ? "current" : ""}`}
                    style={{ borderColor: config.color, background: config.bg }}
                  >
                    <div className="tier-header" style={{ color: config.color }}>
                      <span className="tier-label">{config.label}</span>
                      <span className="tier-price">{formatPrice(price)}<small>/mois</small></span>
                    </div>
                    <ul className="tier-perks">
                      {config.perks.map((perk) => (
                        <li key={perk}>✓ {perk}</li>
                      ))}
                    </ul>
                    <button
                      className="btn-subscribe"
                      style={{ background: config.color }}
                      disabled={loading || isCurrent || !wallet.publicKey}
                      onClick={() => handleBuy(tier)}
                    >
                      {isCurrent
                        ? "Abonnement actif"
                        : !wallet.publicKey
                        ? "Connecte ton wallet"
                        : loading
                        ? "Transaction..."
                        : `S'abonner ${config.label}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {txMsg && <div className="tx-msg">{txMsg}</div>}
          </>
        ) : (
          <div className="no-membership">
            <p>Aucune membership trouvée pour ce créateur.</p>
          </div>
        )}
      </main>
    </div>
  );
}
