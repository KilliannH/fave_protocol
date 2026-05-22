import { readFileSync } from "fs";
import { homedir } from "os";
import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} from "@solana/spl-token";
import { PublicKey as Web3PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  publicKey,
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createFungible,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

const METADATA_URI = "https://faveprotocol-assets.s3.eu-west-3.amazonaws.com/token/metadata.json";
const TOTAL_SUPPLY = 100_000_000;
const DECIMALS = 6;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const secret = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

console.log("Wallet :", payer.publicKey.toBase58());
console.log("Balance :", (await connection.getBalance(payer.publicKey)) / 1e9, "SOL\n");

const umi = createUmi("https://api.mainnet-beta.solana.com")
  .use(mplTokenMetadata());

const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
const signer = createSignerFromKeypair(umi, umiKeypair);
umi.use(keypairIdentity(signer));

// Le mint est généré par Umi — nécessaire pour que Metaplex l'accepte comme signer
const mintSigner = generateSigner(umi);
console.log("Nouveau mint :", mintSigner.publicKey);

// 1. Crée le mint + métadonnées en une seule tx Metaplex
console.log("\n1. Création du mint + métadonnées on-chain...");
await createFungible(umi, {
  mint: mintSigner,
  name: "Fave Protocol",
  symbol: "FAVE",
  uri: METADATA_URI,
  sellerFeeBasisPoints: percentAmount(0),
  decimals: DECIMALS,
}).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
console.log("✅ Mint + métadonnées créés !");

// Convertit l'adresse Umi en Web3.js PublicKey
const mintPubkey = new Web3PublicKey(mintSigner.publicKey.toString());

// 2. Crée le ATA et mint la supply avec @solana/spl-token classique
console.log("\n2. Création du token account + mint supply...");
const ata = await getOrCreateAssociatedTokenAccount(
  connection, payer, mintPubkey, payer.publicKey
);

await mintTo(
  connection,
  payer,
  mintPubkey,
  ata.address,
  payer,
  BigInt(TOTAL_SUPPLY) * BigInt(10 ** DECIMALS)
);
console.log(`✅ ${TOTAL_SUPPLY.toLocaleString()} $FAVE mintés`);

// 3. Révoque la mint authority
console.log("\n3. Révocation de la mint authority...");
await setAuthority(connection, payer, mintPubkey, payer, AuthorityType.MintTokens, null);
console.log("✅ Mint authority révoquée — supply fixée définitivement !");

console.log("\n=== NOUVEAU MINT $FAVE MAINNET ===");
console.log("Mint address :", mintSigner.publicKey.toString());
console.log("Explorer     :", `https://explorer.solana.com/address/${mintSigner.publicKey}`);
console.log("Solscan      :", `https://solscan.io/token/${mintSigner.publicKey}`);
console.log("\n⚠️  Mets à jour FAVE_TOKEN_MINT dans constants.ts !");
