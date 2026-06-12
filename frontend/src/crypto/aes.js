// Base64 utilities
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Key derivation using PBKDF2
async function getEncryptionKey(passphrase, saltBuffer) {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Global passphrase configuration
const ENCRYPTION_PASSPHRASE = import.meta.env?.VITE_ENCRYPTION_KEY || "SenVerbalisSecuredPrototypeKey2026";
// Fixed salt for prototype key derivation consistency across clients
const FIXED_SALT = "SenVerbalisSalt4DrivingLicenses"; 

/**
 * Encrypts a driving license number using AES-256-GCM.
 * @param {string} plaintext - The license number
 * @returns {Promise<{ciphertext_b64: string, iv_b64: string}>}
 */
export async function encryptLicense(plaintext) {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const saltBuffer = new TextEncoder().encode(FIXED_SALT);
    const key = await getEncryptionKey(ENCRYPTION_PASSPHRASE, saltBuffer);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      new TextEncoder().encode(plaintext)
    );

    return {
      ciphertext_b64: arrayBufferToBase64(ciphertextBuffer),
      iv_b64: arrayBufferToBase64(iv)
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Erreur lors du chiffrement des données.");
  }
}

/**
 * Decrypts a driving license number from its base64 representations.
 * @param {string} ciphertext_b64 - Base64 cipher text
 * @param {string} iv_b64 - Base64 initialization vector
 * @returns {Promise<string>} - Decrypted driving license number
 */
export async function decryptLicense(ciphertext_b64, iv_b64) {
  try {
    const saltBuffer = new TextEncoder().encode(FIXED_SALT);
    const key = await getEncryptionKey(ENCRYPTION_PASSPHRASE, saltBuffer);
    const iv = new Uint8Array(base64ToArrayBuffer(iv_b64));
    const ciphertext = base64ToArrayBuffer(ciphertext_b64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    return "Non déchiffrable (clé ou IV invalide)";
  }
}

/**
 * Generates SHA-256 hash of driving license number (for indexing / database search index).
 * @param {string} numPermis - Clear driving license number
 * @returns {Promise<string>} - 64-character hex string
 */
export async function hashLicense(numPermis) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(numPermis.trim());
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Hashing error:", error);
    throw new Error("Erreur de calcul du hash.");
  }
}
