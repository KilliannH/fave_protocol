import { readFileSync } from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: "/workspaces/fave_protocol/.env" });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const metadata = readFileSync("/workspaces/fave_protocol/scripts/token-metadata.json");

await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: "token/metadata.json",
  Body: metadata,
  ContentType: "application/json",
}));

const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/token/metadata.json`;
console.log("✅ Metadata JSON uploadé :", url);
