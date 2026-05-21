import { readFileSync } from "fs";
import { homedir } from "os";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const idl = require("../sdk/idl/fave_protocol.json");

const PROGRAM_ID = new PublicKey("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const secret = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(secret));

console.log("Créateur :", wallet.publicKey.toBase58());

const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: "confirmed" });
const program = new anchor.Program(idl, provider);

const [membershipPda] = PublicKey.findProgramAddressSync([Buffer.from("fave-membership"), wallet.publicKey.toBuffer()], PROGRAM_ID);
const [mintBronze] = PublicKey.findProgramAddressSync([Buffer.from("fave-mint-bronze"), wallet.publicKey.toBuffer()], PROGRAM_ID);
const [mintSilver] = PublicKey.findProgramAddressSync([Buffer.from("fave-mint-silver"), wallet.publicKey.toBuffer()], PROGRAM_ID);
const [mintGold] = PublicKey.findProgramAddressSync([Buffer.from("fave-mint-gold"), wallet.publicKey.toBuffer()], PROGRAM_ID);

console.log("Création de la membership sur devnet...");

const tx = await program.methods
  .initializeMembership(
    "TestCreator",
    new anchor.BN(0.01 * LAMPORTS_PER_SOL),
    new anchor.BN(0.05 * LAMPORTS_PER_SOL),
    new anchor.BN(0.10 * LAMPORTS_PER_SOL),
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
