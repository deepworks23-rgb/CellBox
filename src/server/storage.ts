import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.VERCEL) {
  dotenv.config({ quiet: true });
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

let s3ClientInstance: S3Client | null = null;

export function getS3Bucket(): string {
  return (process.env.S3_BUCKET || 'assets').trim() || 'assets';
}

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()
  );
}

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint =
      process.env.AWS_ENDPOINT_URL_S3?.trim() || process.env.AWS_ENDPOINT_URL?.trim();
    const region = process.env.AWS_REGION?.trim() || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    s3ClientInstance = new S3Client({
      forcePathStyle: true,
      region,
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }
  return s3ClientInstance;
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() || 'file';
  const cleaned = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned.slice(0, 80) || 'asset';
}

export function sanitizeStorageKey(key: string): string | null {
  const normalized = key.trim().replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    return null;
  }
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export function buildUploadKey(folder: string, fileName: string): string {
  const safeFolder =
    folder
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '') || 'products';
  const safeName = sanitizeFileName(fileName);
  const stamp = Date.now();
  const suffix = crypto.randomBytes(4).toString('hex');
  return `uploads/${safeFolder}/${stamp}-${suffix}-${safeName}`;
}

export function validateImageUploadPayload(input: {
  fileName?: string;
  contentType?: string;
  base64Data?: string;
}):
  | { ok: true; fileName: string; contentType: string; buffer: Buffer }
  | { ok: false; error: string } {
  const fileName = (input.fileName ?? '').trim();
  const contentType = (input.contentType ?? '').trim().toLowerCase();
  const rawBase64 = (input.base64Data ?? '').trim();

  if (!fileName || !rawBase64) {
    return { ok: false, error: 'Selecione um arquivo de imagem válido para enviar.' };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
    return {
      ok: false,
      error: 'Formato não suportado. Envie imagens PNG, JPG, WEBP ou AVIF.',
    };
  }

  const stripped = rawBase64.includes(',') ? rawBase64.split(',').pop() || '' : rawBase64;
  const buffer = Buffer.from(stripped, 'base64');
  if (buffer.length === 0) {
    return { ok: false, error: 'Arquivo de imagem vazio ou corrompido.' };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'A imagem excede o limite máximo de 5 MB.' };
  }

  return { ok: true, fileName, contentType, buffer };
}

export async function uploadObjectToS3(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  bucket?: string;
}): Promise<{ bucket: string; key: string; signedUrl: string; proxyUrl: string }> {
  const bucket = params.bucket || getS3Bucket();
  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ...(params.contentType ? { ContentType: params.contentType } : {}),
    })
  );

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: params.key }),
    { expiresIn: 3600 }
  );

  return {
    bucket,
    key: params.key,
    signedUrl,
    proxyUrl: `/api/assets/${params.key}`,
  };
}

export async function getObjectPresignedUrl(
  key: string,
  expiresIn = 3600,
  bucket = getS3Bucket()
): Promise<string> {
  const s3 = getS3Client();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn,
  });
}
