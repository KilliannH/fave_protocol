import { readFileSync } from "fs";
import { homedir } from "os";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const secret = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

const TOTAL_SUPPLY = 100_000_000;
const DECIMALS = 6;
const TO_RAW = 10 ** DECIMALS;

console.log("Wallet :", payer.publicKey.toBase58());
console.log("Balance SOL :", (await connection.getBalance(payer.publicKey)) / 1e9);
console.log("\nCréation du mint $FAVE sur MAINNET...\n");

const mint = await createMint(
  connection,
  payer,
  payer.publicKey,
  payer.publicKey,
  DECIMALS
);
console.log("✅ Mint $FAVE :", mint.toBase58());

const treasuryAta = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, payer.publicKey
);

await mintTo(
  connection,
  payer,
  mint,
  treasuryAta.address,
  payer,
  BigInt(TOTAL_SUPPLY) * BigInt(TO_RAW)
);
console.log(`✅ ${TOTAL_SUPPLY.toLocaleString()} $FAVE mintés`);

await setAuthority(
  connection,
  payer,
  mint,
  payer,
  AuthorityType.MintTokens,
  null
);
console.log("✅ Mint authority révoquée — supply fixée définitivement\n");

console.log("=== MAINNET — INFOS À SAUVEGARDER ===");
console.log("Mint address :", mint.toBase58());
console.log("Decimals     :", DECIMALS);
console.log("Total supply :", TOTAL_SUPPLY.toLocaleString(), "$FAVE");
console.log("\nExplorateur :");
console.log(`https://explorer.solana.com/address/${mint.toBase58()}`);
console.log(`https://solscan.io/token/${mint.toBase58()}`);
