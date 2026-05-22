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

const logo = readFileSync("/workspaces/fave_protocol/fave-token-logo-200.png");

await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: "token/logo.png",
  Body: logo,
  ContentType: "image/png",
}));

const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/token/logo.png`;
console.log("✅ Logo uploadé :", url);
