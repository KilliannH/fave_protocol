import { readFileSync } from "fs";
import { homedir } from "os";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const secret = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

const TOTAL_SUPPLY    = 100_000_000;
const DECIMALS        = 6;
const TO_RAW          = 10 ** DECIMALS;

const ALLOCATIONS = [
  { name: "Communauté / créateurs early", pct: 40 },
  { name: "Trésorerie protocole",          pct: 25 },
  { name: "Équipe (toi)",                  pct: 15 },
  { name: "Réserve écosystème",            pct: 15 },
  { name: "Liquidité initiale",            pct:  5 },
];

console.log("Wallet :", payer.publicKey.toBase58());
console.log("Création du mint $FAVE...\n");

// 1. Crée le mint
const mint = await createMint(
  connection,
  payer,
  payer.publicKey,  // mint authority
  payer.publicKey,  // freeze authority
  DECIMALS
);
console.log("✅ Mint $FAVE :", mint.toBase58());

// 2. Crée le token account de la trésorerie (ton wallet pour l'instant)
const treasuryAta = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, payer.publicKey
);
console.log("✅ Token account trésorerie :", treasuryAta.address.toBase58());

// 3. Mint la supply totale vers la trésorerie
await mintTo(
  connection,
  payer,
  mint,
  treasuryAta.address,
  payer,
  BigInt(TOTAL_SUPPLY) * BigInt(TO_RAW)
);
console.log(`✅ ${TOTAL_SUPPLY.toLocaleString()} $FAVE mintés\n`);

// 4. Révoque la mint authority (supply fixe pour toujours)
await setAuthority(
  connection,
  payer,
  mint,
  payer,
  AuthorityType.MintTokens,
  null  // null = révocation définitive
);
console.log("✅ Mint authority révoquée — supply fixée définitivement\n");

// 5. Affiche le récapitulatif
console.log("=== TOKENOMICS $FAVE ===");
for (const alloc of ALLOCATIONS) {
  const amount = (TOTAL_SUPPLY * alloc.pct / 100).toLocaleString();
  console.log(`${alloc.pct}% — ${amount} $FAVE — ${alloc.name}`);
}

console.log("\n=== INFOS À SAUVEGARDER ===");
console.log("Mint address    :", mint.toBase58());
console.log("Decimals        :", DECIMALS);
console.log("Total supply    :", TOTAL_SUPPLY.toLocaleString(), "$FAVE");
console.log("\nVoir sur explorer :");
console.log(`https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
