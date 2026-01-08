/**
 * Module de stockage S3 pour TubeTest Tracker (version standalone)
 * Compatible avec AWS S3, MinIO, et autres services S3-compatibles
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let s3Client: S3Client | null = null;

/**
 * Initialise le client S3
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    const config: any = {
      region: ENV.s3Region,
      credentials: {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      },
    };

    // Support pour MinIO ou autres services S3-compatibles
    if (ENV.s3Endpoint) {
      config.endpoint = ENV.s3Endpoint;
      config.forcePathStyle = true; // Nécessaire pour MinIO
    }

    s3Client = new S3Client(config);
  }
  return s3Client;
}

/**
 * Vérifie si le stockage S3 est configuré
 */
export function isStorageConfigured(): boolean {
  return !!(ENV.s3Bucket && ENV.awsAccessKeyId && ENV.awsSecretAccessKey);
}

/**
 * Upload un fichier vers S3
 * @param key - Chemin du fichier dans le bucket (ex: "uploads/image.png")
 * @param data - Contenu du fichier (Buffer, Uint8Array, ou string)
 * @param contentType - Type MIME du fichier (ex: "image/png")
 * @returns URL publique du fichier
 */
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  if (!isStorageConfigured()) {
    throw new Error("Stockage S3 non configuré. Vérifiez les variables S3_BUCKET, AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY.");
  }

  const client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
    ACL: "public-read", // Fichier accessible publiquement
  });

  await client.send(command);

  // Construire l'URL publique
  let url: string;
  if (ENV.s3Endpoint) {
    // Pour MinIO ou services personnalisés
    url = `${ENV.s3Endpoint}/${ENV.s3Bucket}/${key}`;
  } else {
    // Pour AWS S3 standard
    url = `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com/${key}`;
  }

  return { key, url };
}

/**
 * Récupère une URL signée pour accéder à un fichier privé
 * @param key - Chemin du fichier dans le bucket
 * @param expiresIn - Durée de validité en secondes (défaut: 3600 = 1 heure)
 * @returns URL signée temporaire
 */
export async function storageGet(
  key: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  if (!isStorageConfigured()) {
    throw new Error("Stockage S3 non configuré.");
  }

  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });

  return { key, url };
}

/**
 * Supprime un fichier de S3
 * @param key - Chemin du fichier dans le bucket
 */
export async function storageDelete(key: string): Promise<void> {
  if (!isStorageConfigured()) {
    throw new Error("Stockage S3 non configuré.");
  }

  const client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Génère un chemin unique pour un fichier
 * @param prefix - Préfixe du chemin (ex: "uploads", "thumbnails")
 * @param filename - Nom du fichier original
 * @returns Chemin unique avec timestamp et hash
 */
export function generateUniqueKey(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = filename.split(".").pop() || "";
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  
  return `${prefix}/${timestamp}-${random}-${safeName}${ext ? `.${ext}` : ""}`;
}
