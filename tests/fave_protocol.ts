import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FaveProtocol } from "../target/types/fave_protocol";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("fave_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FaveProtocol as Program<FaveProtocol>;

  const creator = anchor.web3.Keypair.generate();
  const fan = anchor.web3.Keypair.generate();
  const protocolTreasury = anchor.web3.Keypair.generate();

  let membershipPda: PublicKey;
  let mintBronzePda: PublicKey;
  let mintSilverPda: PublicKey;
  let mintGoldPda: PublicKey;

  const PRICE_BRONZE = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
  const PRICE_SILVER = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
  const PRICE_GOLD   = new anchor.BN(0.10 * LAMPORTS_PER_SOL);

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 5 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(fan.publicKey, 5 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(protocolTreasury.publicKey, LAMPORTS_PER_SOL)
    );

    [membershipPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-membership"), creator.publicKey.toBuffer()],
      program.programId
    );
    [mintBronzePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-mint-bronze"), creator.publicKey.toBuffer()],
      program.programId
    );
    [mintSilverPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-mint-silver"), creator.publicKey.toBuffer()],
      program.programId
    );
    [mintGoldPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-mint-gold"), creator.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Un créateur initialise sa membership avec 3 niveaux", async () => {
    await program.methods
      .initializeMembership("MaChaine", PRICE_BRONZE, PRICE_SILVER, PRICE_GOLD)
      .accounts({
        membership: membershipPda,
        mintBronze: mintBronzePda,
        mintSilver: mintSilverPda,
        mintGold: mintGoldPda,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const membership = await program.account.membership.fetch(membershipPda);
    assert.equal(membership.name, "MaChaine");
    assert.equal(membership.priceBronze.toNumber(), PRICE_BRONZE.toNumber());
    assert.equal(membership.priceSilver.toNumber(), PRICE_SILVER.toNumber());
    assert.equal(membership.priceGold.toNumber(),   PRICE_GOLD.toNumber());
    console.log("✅ Membership créée avec Bronze/Silver/Gold");
  });

  it("Un fan achète un abonnement Bronze — reçoit un SPL token", async () => {
    const [fanAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-fan"), fan.publicKey.toBuffer(), membershipPda.toBuffer()],
      program.programId
    );
    const fanTokenAccount = await getAssociatedTokenAddress(
      mintBronzePda, fan.publicKey
    );
    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);

    await program.methods
      .buySubscription({ bronze: {} })
      .accounts({
        membership: membershipPda,
        fanAccount: fanAccountPda,
        mint: mintBronzePda,
        fanTokenAccount,
        fan: fan.publicKey,
        creator: creator.publicKey,
        protocolTreasury: protocolTreasury.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([fan])
      .rpc();

    const fanAccount = await program.account.fanAccount.fetch(fanAccountPda);
    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const now = Math.floor(Date.now() / 1000);

    assert.isTrue(fanAccount.expiresAt.toNumber() > now, "Abonnement doit être actif");
    assert.approximately(
      creatorBalanceAfter - creatorBalanceBefore,
      0.0098 * LAMPORTS_PER_SOL,
      10000,
      "Créateur doit recevoir ~98%"
    );
    console.log("✅ Abonnement Bronze actif jusqu'au :", new Date(fanAccount.expiresAt.toNumber() * 1000).toLocaleDateString());
    console.log("✅ Créateur a reçu :", (creatorBalanceAfter - creatorBalanceBefore) / LAMPORTS_PER_SOL, "SOL");
  });

  it("Renouveler prolonge la date d'expiration de 30 jours", async () => {
    const [fanAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fave-fan"), fan.publicKey.toBuffer(), membershipPda.toBuffer()],
      program.programId
    );
    const fanTokenAccount = await getAssociatedTokenAddress(mintBronzePda, fan.publicKey);
    const fanAccountBefore = await program.account.fanAccount.fetch(fanAccountPda);

    await program.methods
      .buySubscription({ bronze: {} })
      .accounts({
        membership: membershipPda,
        fanAccount: fanAccountPda,
        mint: mintBronzePda,
        fanTokenAccount,
        fan: fan.publicKey,
        creator: creator.publicKey,
        protocolTreasury: protocolTreasury.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([fan])
      .rpc();

    const fanAccountAfter = await program.account.fanAccount.fetch(fanAccountPda);
    const diff = fanAccountAfter.expiresAt.toNumber() - fanAccountBefore.expiresAt.toNumber();
    assert.approximately(diff, 30 * 24 * 60 * 60, 5, "Doit prolonger d'exactement 30 jours");
    console.log("✅ Abonnement prolongé, nouvelle expiration :", new Date(fanAccountAfter.expiresAt.toNumber() * 1000).toLocaleDateString());
  });

  it("Un tiers ne peut pas modifier les prix", async () => {
    const attacker = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(attacker.publicKey, LAMPORTS_PER_SOL)
    );
    try {
      await program.methods
        .updatePrices(new anchor.BN(1), new anchor.BN(2), new anchor.BN(3))
        .accounts({ membership: membershipPda, creator: attacker.publicKey })
        .signers([attacker])
        .rpc();
      assert.fail("Aurait dû échouer");
    } catch {
      console.log("✅ Accès refusé au tiers");
    }
  });
});
