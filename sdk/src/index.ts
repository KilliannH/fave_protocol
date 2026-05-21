import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Signer,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";

export const FAVE_PROGRAM_ID = new PublicKey(
  "3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU"
);

export enum Tier {
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
}

export interface MembershipInfo {
  creator: PublicKey;
  name: string;
  priceBronze: number;
  priceSilver: number;
  priceGold: number;
  totalSold: number;
}

export interface SubscriptionInfo {
  tier: Tier;
  expiresAt: Date;
  isActive: boolean;
}

export class FaveClient {
  private program: anchor.Program;
  private connection: Connection;

  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.connection = connection;
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    // Charge l'IDL depuis le programme déployé
    this.program = new anchor.Program(
      require("../idl/fave_protocol.json"),
      provider
    );
  }

  // --- PDAs ---

  getMembershipPda(creator: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-membership"), creator.toBuffer()],
      FAVE_PROGRAM_ID
    );
    return pda;
  }

  getMintPda(creator: PublicKey, tier: Tier): PublicKey {
    const seed = `fave-mint-${tier}`;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(seed), creator.toBuffer()],
      FAVE_PROGRAM_ID
    );
    return pda;
  }

  getFanAccountPda(fan: PublicKey, membershipPda: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-fan"), fan.toBuffer(), membershipPda.toBuffer()],
      FAVE_PROGRAM_ID
    );
    return pda;
  }

  // --- Lecture ---

  /**
   * Récupère les infos d'une membership
   * @param creator Adresse du créateur
   */
  async getMembership(creator: PublicKey): Promise<MembershipInfo | null> {
    const pda = this.getMembershipPda(creator);
    try {
      const account = await (this.program.account as any).membership.fetch(pda);
      return {
        creator: account.creator,
        name: account.name,
        priceBronze: account.priceBronze.toNumber(),
        priceSilver: account.priceSilver.toNumber(),
        priceGold: account.priceGold.toNumber(),
        totalSold: account.totalSold.toNumber(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si un fan a un abonnement actif chez un créateur
   * @param fan Adresse du fan
   * @param creator Adresse du créateur
   */
  async getSubscription(
    fan: PublicKey,
    creator: PublicKey
  ): Promise<SubscriptionInfo | null> {
    const membershipPda = this.getMembershipPda(creator);
    const fanAccountPda = this.getFanAccountPda(fan, membershipPda);
    try {
      const account = await (this.program.account as any).fanAccount.fetch(fanAccountPda);
      const expiresAt = new Date(account.expiresAt.toNumber() * 1000);
      return {
        tier: Object.keys(account.tier)[0] as Tier,
        expiresAt,
        isActive: expiresAt > new Date(),
      };
    } catch {
      return null;
    }
  }

  // --- Écriture ---

  /**
   * Initialise la membership d'un créateur
   * @param name Nom de la chaîne
   * @param priceBronze Prix Bronze en lamports
   * @param priceSilver Prix Silver en lamports
   * @param priceGold Prix Gold en lamports
   */
  async initializeMembership(
    name: string,
    priceBronze: number,
    priceSilver: number,
    priceGold: number
  ): Promise<string> {
    const creator = this.program.provider.publicKey!;
    const membershipPda = this.getMembershipPda(creator);

    const tx = await (this.program.methods as any)
      .initializeMembership(
        name,
        new anchor.BN(priceBronze),
        new anchor.BN(priceSilver),
        new anchor.BN(priceGold)
      )
      .accounts({
        membership: membershipPda,
        mintBronze: this.getMintPda(creator, Tier.Bronze),
        mintSilver: this.getMintPda(creator, Tier.Silver),
        mintGold: this.getMintPda(creator, Tier.Gold),
        creator,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Achète un abonnement d'un mois chez un créateur
   * @param creator Adresse du créateur
   * @param tier Niveau souhaité (Bronze, Silver, Gold)
   * @param protocolTreasury Adresse de la trésorerie du protocole
   */
  async buySubscription(
    creator: PublicKey,
    tier: Tier,
    protocolTreasury: PublicKey
  ): Promise<string> {
    const fan = this.program.provider.publicKey!;
    const membershipPda = this.getMembershipPda(creator);
    const fanAccountPda = this.getFanAccountPda(fan, membershipPda);
    const mintPda = this.getMintPda(creator, tier);
    const fanTokenAccount = await getAssociatedTokenAddress(mintPda, fan);

    const tx = await (this.program.methods as any)
      .buySubscription({ [tier]: {} })
      .accounts({
        membership: membershipPda,
        fanAccount: fanAccountPda,
        mint: mintPda,
        fanTokenAccount,
        fan,
        creator,
        protocolTreasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Met à jour les prix d'une membership
   */
  async updatePrices(
    priceBronze: number,
    priceSilver: number,
    priceGold: number
  ): Promise<string> {
    const creator = this.program.provider.publicKey!;
    const membershipPda = this.getMembershipPda(creator);

    return await (this.program.methods as any)
      .updatePrices(
        new anchor.BN(priceBronze),
        new anchor.BN(priceSilver),
        new anchor.BN(priceGold)
      )
      .accounts({ membership: membershipPda, creator })
      .rpc();
  }
}

// Helper : convertit SOL en lamports
export const solToLamports = (sol: number): number =>
  Math.floor(sol * 1_000_000_000);

// Helper : convertit lamports en SOL
export const lamportsToSol = (lamports: number): number =>
  lamports / 1_000_000_000;
