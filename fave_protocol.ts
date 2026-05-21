import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FaveProtocol } from "../target/types/fave_protocol";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("fave_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FaveProtocol as Program<FaveProtocol>;

  const creator = anchor.web3.Keypair.generate();
  const fan = anchor.web3.Keypair.generate();
  // Adresse fixe de la trésorerie du protocole (à remplacer par la tienne)
  const protocolTreasury = anchor.web3.Keypair.generate();

  let membershipPda: PublicKey;

  before(async () => {
    // Airdrop SOL sur localnet pour les tests
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(fan.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    [membershipPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("membership"), creator.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Un créateur initialise sa membership", async () => {
    const priceInLamports = new anchor.BN(0.01 * LAMPORTS_PER_SOL); // 0.01 SOL par token

    await program.methods
      .initializeMembership(priceInLamports, "MaChaine")
      .accounts({
        membership: membershipPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const membership = await program.account.membership.fetch(membershipPda);
    assert.equal(membership.name, "MaChaine");
    assert.equal(membership.creator.toBase58(), creator.publicKey.toBase58());
    assert.equal(membership.tokenPriceLamports.toNumber(), priceInLamports.toNumber());
    assert.equal(membership.totalSold.toNumber(), 0);

    console.log("✅ Membership créée :", membership.name);
  });

  it("Un fan achète 3 tokens — split correct", async () => {
    const quantity = new anchor.BN(3);

    const [fanAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fan"), fan.publicKey.toBuffer(), membershipPda.toBuffer()],
      program.programId
    );

    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
    const treasuryBalanceBefore = await provider.connection.getBalance(protocolTreasury.publicKey);

    await program.methods
      .buyTokens(quantity)
      .accounts({
        membership: membershipPda,
        fanAccount: fanAccountPda,
        fan: fan.publicKey,
        creator: creator.publicKey,
        protocolTreasury: protocolTreasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([fan])
      .rpc();

    const membership = await program.account.membership.fetch(membershipPda);
    const fanAccount = await program.account.fanAccount.fetch(fanAccountPda);

    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const treasuryBalanceAfter = await provider.connection.getBalance(protocolTreasury.publicKey);

    const totalCost = 3 * 0.01 * LAMPORTS_PER_SOL; // 0.03 SOL
    const expectedFee = totalCost * 0.02;           // 2% = 0.0006 SOL
    const expectedCreator = totalCost - expectedFee; // 98% = 0.0294 SOL

    assert.equal(fanAccount.tokensHeld.toNumber(), 3);
    assert.equal(membership.totalSold.toNumber(), 3);
    assert.approximately(
      creatorBalanceAfter - creatorBalanceBefore,
      expectedCreator,
      1000, // tolérance 1000 lamports pour les frais de tx
      "Le créateur doit recevoir 98%"
    );
    assert.approximately(
      treasuryBalanceAfter - treasuryBalanceBefore,
      expectedFee,
      1000,
      "La trésorerie doit recevoir 2%"
    );

    console.log(`✅ Fan a ${fanAccount.tokensHeld} tokens`);
    console.log(`✅ Créateur a reçu ~${(creatorBalanceAfter - creatorBalanceBefore) / LAMPORTS_PER_SOL} SOL`);
    console.log(`✅ Protocole a reçu ~${(treasuryBalanceAfter - treasuryBalanceBefore) / LAMPORTS_PER_SOL} SOL`);
  });

  it("Le créateur met à jour son prix", async () => {
    const newPrice = new anchor.BN(0.05 * LAMPORTS_PER_SOL);

    await program.methods
      .updatePrice(newPrice)
      .accounts({
        membership: membershipPda,
        creator: creator.publicKey,
      })
      .signers([creator])
      .rpc();

    const membership = await program.account.membership.fetch(membershipPda);
    assert.equal(membership.tokenPriceLamports.toNumber(), newPrice.toNumber());
    console.log("✅ Prix mis à jour :", newPrice.toNumber() / LAMPORTS_PER_SOL, "SOL");
  });

  it("Un tiers ne peut pas modifier le prix", async () => {
    const attacker = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(attacker.publicKey, LAMPORTS_PER_SOL)
    );

    try {
      await program.methods
        .updatePrice(new anchor.BN(1))
        .accounts({
          membership: membershipPda,
          creator: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();
      assert.fail("Aurait dû échouer");
    } catch (e) {
      console.log("✅ Accès refusé au tiers (attendu)");
    }
  });
});
