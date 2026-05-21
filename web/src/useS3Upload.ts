import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function useS3Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, folder: "avatars" | "banners"): Promise<string> => {
    setUploading(true);
    setProgress(0);

    // 1. Récupère l'URL signée
    const res = await fetch(`${API_URL}/upload/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        folder,
      }),
    });

    if (!res.ok) throw new Error("Impossible d'obtenir l'URL d'upload");
    const { upload_url, public_url } = await res.json();

    // 2. Upload direct vers S3
    await fetch(upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    setProgress(100);
    setUploading(false);
    return public_url;
  };

  return { upload, uploading, progress };
}
