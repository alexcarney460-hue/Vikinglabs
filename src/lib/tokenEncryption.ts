import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENC_KEY = process.env.SOCIAL_TOKEN_ENC_KEY;

if (!ENC_KEY || ENC_KEY.length < 64) {
  throw new Error(
    'SOCIAL_TOKEN_ENC_KEY must be set and at least 64 hex characters (32 bytes)'
  );
}

const KEY_BUFFER = Buffer.from(ENC_KEY, 'hex');

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  return combined;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
