import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUploadKey,
  getS3Bucket,
  sanitizeFileName,
  sanitizeStorageKey,
  validateImageUploadPayload,
} from './storage.ts';

test('sanitizeFileName strips accents, directories, and unsafe chars', () => {
  assert.equal(sanitizeFileName('../../Foto Produto Ção.PNG'), 'foto-produto-cao.png');
  assert.equal(sanitizeFileName('iphone 16 pro max.webp'), 'iphone-16-pro-max.webp');
});

test('sanitizeStorageKey rejects traversal and accepts safe S3 keys', () => {
  assert.equal(sanitizeStorageKey('../secret.txt'), null);
  assert.equal(sanitizeStorageKey('uploads/products/../evil.png'), null);
  assert.equal(sanitizeStorageKey('uploads/products/1700-abc-photo.png'), 'uploads/products/1700-abc-photo.png');
});

test('buildUploadKey generates structured uploads/<folder>/... key', () => {
  const key = buildUploadKey('products', 'MacBook Pro.jpg');
  assert.match(key, /^uploads\/products\/\d+-[a-f0-9]{8}-macbook-pro\.jpg$/);
});

test('validateImageUploadPayload accepts valid base64 PNG and rejects unsupported mime', () => {
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');
  const ok = validateImageUploadPayload({
    fileName: 'sample.png',
    contentType: 'image/png',
    base64Data: `data:image/png;base64,${pngBytes}`,
  });
  assert.equal(ok.ok, true);

  const bad = validateImageUploadPayload({
    fileName: 'script.svg',
    contentType: 'image/svg+xml',
    base64Data: pngBytes,
  });
  assert.equal(bad.ok, false);
});

test('getS3Bucket defaults to assets', () => {
  assert.equal(getS3Bucket(), process.env.S3_BUCKET || 'assets');
});
