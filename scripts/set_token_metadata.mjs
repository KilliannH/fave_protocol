import { readFileSync } from "fs";
import { homedir } from "os";
import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey, createSignerFromKeypair } from "@metaplex-foundation/umi";
import {
  createFungible,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import dotenv from "dotenv";
dotenv.config({ path: "/workspaces/fave_protocol/.env" });

const MINT_ADDRESS = "CCsfkVFgr3EGyctYJ9mqoy1iFyVgXzoXB6U2THnAmvXt";
const METADATA_URI = "https://faveprotocol-assets.s3.eu-west-3.amazonaws.com/token/metadata.json";

const secret = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

const umi = createUmi("https://api.mainnet-beta.solana.com")
  .use(mplTokenMetadata());

const umiKeypair = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
const signer = createSignerFromKeypair(umi, umiKeypair);
umi.use(keypairIdentity(signer));

console.log("Wallet :", keypair.publicKey.toBase58());
console.log("Mint   :", MINT_ADDRESS);
console.log("URI    :", METADATA_URI);
console.log("\nAttachement des métadonnées...");

try {
  const tx = await createFungible(umi, {
    mint: publicKey(MINT_ADDRESS),
    name: "Fave Protocol",
    symbol: "FAVE",
    uri: METADATA_URI,
    sellerFeeBasisPoints: { basisPoints: 0n, identifier: "%", decimals: 2 },
    decimals: 6,
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  console.log("\n✅ Métadonnées attachées !");
  console.log("Tx :", Buffer.from(tx.signature).toString("base64"));
  console.log("\nTon token apparaîtra sous peu sur :");
  console.log("- Phantom wallet");
  console.log("- Solscan.io");
  console.log("- Jupiter");
} catch (e) {
  console.error("Erreur :", e.message);
  if (e.logs) console.error("Logs :", e.logs);
}
