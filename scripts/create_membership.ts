import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import idl from "../sdk/idl/fave_protocol.json";

const PROGRAM_ID = new PublicKey("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Charge le wallet local (celui déployé sur devnet)
  const wallet = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require("fs").readFileSync(
      process.env.HOME + "/.config/solana/id.json", "utf-8"
    )))
  );

  console.log("Créateur :", wallet.publicKey.toBase58());

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  const program = new anchor.Program(idl as anchor.Idl, provider);

  const [membershipPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("fave-membership"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [mintBronze] = PublicKey.findProgramAddressSync(
    [Buffer.from("fave-mint-bronze"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [mintSilver] = PublicKey.findProgramAddressSync(
    [Buffer.from("fave-mint-silver"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [mintGold] = PublicKey.findProgramAddressSync(
    [Buffer.from("fave-mint-gold"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Création de la membership...");

  const tx = await (program.methods as any)
    .initializeMembership(
      "TestCreator",
      new anchor.BN(0.01 * LAMPORTS_PER_SOL),  // Bronze : 0.01 SOL
      new anchor.BN(0.05 * LAMPORTS_PER_SOL),  // Silver : 0.05 SOL
      new anchor.BN(0.10 * LAMPORTS_PER_SOL),  // Gold   : 0.10 SOL
    )
    .accounts({
      membership: membershipPda,
      mintBronze,
      mintSilver,
      mintGold,
      creator: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("✅ Membership créée ! Tx :", tx);
  console.log("Adresse créateur :", wallet.publicKey.toBase58());
  console.log("Colle cette adresse dans web/src/CreatorPage.tsx");
}

main().catch(console.error);
