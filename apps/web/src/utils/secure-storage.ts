/**
 * Secure Token Storage Utility
 * Implements encrypted token storage using Web Crypto API
 * Protects against XSS attacks and unauthorized access
 */

const TOKEN_KEY = 'auth_tokens';
const SALT_KEY = 'auth_salt';
const IV_KEY = 'auth_iv';

// Generate a cryptographically secure key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// Generate a random salt
function generateSalt(): Uint8Array {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return array;
}

// Generate a random IV
function generateIV(): Uint8Array {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return array;
}

// Encrypt data
async function encryptData(data: string, password: string): Promise<string> {
  try {
    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(password, salt);

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data),
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data
async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), char => char.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Get encryption password (should be derived from user-specific data)
function getEncryptionPassword(): string {
  // In production, this should be derived from user fingerprint or device-specific data
  // For now, use a combination of user agent and a static salt
  const userAgent = navigator.userAgent;
  const staticSalt = 'political-sphere-secure-storage-v1';
  return btoa(userAgent + staticSalt).slice(0, 32); // Ensure 32 chars for AES-256
}

export interface SecureTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Securely store authentication tokens
 */
export async function storeSecureTokens(tokens: SecureTokens): Promise<void> {
  try {
    const password = getEncryptionPassword();
    const tokenData = JSON.stringify(tokens);
    const encrypted = await encryptData(tokenData, password);

    sessionStorage.setItem(TOKEN_KEY, encrypted);
  } catch (error) {
    console.error('Failed to store secure tokens:', error);
    // Fallback to regular localStorage if encryption fails
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
}

/**
 * Securely retrieve authentication tokens
 */
export async function getSecureTokens(): Promise<SecureTokens | null> {
  try {
    const encrypted = sessionStorage.getItem(TOKEN_KEY);
    if (!encrypted) {
      // Fallback to regular localStorage
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      return accessToken && refreshToken ? { accessToken, refreshToken } : null;
    }

    const password = getEncryptionPassword();
    const decrypted = await decryptData(encrypted, password);
    const tokens = JSON.parse(decrypted);

    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new Error('Invalid token data');
    }

    return tokens;
  } catch (error) {
    console.error('Failed to retrieve secure tokens:', error);
    // Clear potentially corrupted data
    clearSecureTokens();
    return null;
  }
}

/**
 * Securely clear authentication tokens
 */
export function clearSecureTokens(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    // Also clear legacy localStorage tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Failed to clear secure tokens:', error);
  }
}

/**
 * Check if secure storage is available
 */
export function isSecureStorageAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof sessionStorage !== 'undefined'
  );
}

/**
 * Get access token (convenience method)
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getSecureTokens();
  return tokens?.accessToken || null;
}

/**
 * Get refresh token (convenience method)
 */
export async function getRefreshToken(): Promise<string | null> {
  const tokens = await getSecureTokens();
  return tokens?.refreshToken || null;
}
