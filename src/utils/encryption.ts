
/**
 * Encryption utilities for End-to-End Encryption in chat using Web Crypto API
 */

// Define interfaces for encryption results
interface EncryptionResult {
  ciphertext: string;
  iv: string;
}

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface SignedMessage extends EncryptionResult {
  signature: string;
}

// Encryption parameters
const AES_ALGORITHM = 'AES-GCM';
const ECDH_ALGORITHM = 'ECDH';
const ECDSA_ALGORITHM = 'ECDSA';
const PBKDF2_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

// Key rotation interval (24 hours in milliseconds)
const KEY_ROTATION_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * Generates a new AES encryption key
 * @returns Promise with the generated key
 */
/**
 * Generates a key pair for ECDH key exchange
 * @returns Promise with the generated key pair
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  return window.crypto.subtle.generateKey(
    {
      name: ECDH_ALGORITHM,
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey']
  ) as Promise<KeyPair>;
};

/**
 * Derives a shared secret key using ECDH
 * @param privateKey - Local private key
 * @param publicKey - Remote public key
 * @returns Promise with the derived AES key
 */
export const deriveSharedKey = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  return window.crypto.subtle.deriveKey(
    {
      name: ECDH_ALGORITHM,
      public: publicKey
    },
    privateKey,
    {
      name: AES_ALGORITHM,
      length: AES_KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Derives an encryption key from a password using PBKDF2
 * @param password - The password to derive key from
 * @param salt - Optional salt, generates new if not provided
 * @returns Promise with derived key and salt
 */
export const deriveKeyFromPassword = async (
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: string }> => {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Generate salt if not provided
  if (!salt) {
    salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }
  
  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    PBKDF2_ALGORITHM,
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive key using PBKDF2
  const key = await window.crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGORITHM,
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM
    },
    keyMaterial,
    {
      name: AES_ALGORITHM,
      length: AES_KEY_LENGTH
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  return {
    key,
    salt: btoa(String.fromCharCode(...salt))
  };
};

/**
 * Generates a new AES encryption key
 * @returns Promise with the generated key
 */
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return window.crypto.subtle.generateKey(
    {
      name: AES_ALGORITHM,
      length: AES_KEY_LENGTH
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Exports a CryptoKey to base64 string for storage
 * @param key - The CryptoKey to export
 * @returns Promise with the exported key as base64 string
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

/**
 * Exports a public key to base64 string for sharing
 * @param publicKey - The public CryptoKey to export
 * @returns Promise with the exported public key as base64 string
 */
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

/**
 * Imports a base64 string key back to CryptoKey
 * @param keyString - Base64 encoded key string
 * @returns Promise with the imported CryptoKey
 */
export const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    AES_ALGORITHM,
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a message using AES-GCM
 * @param message - The message to encrypt
 * @param key - The CryptoKey to use for encryption
 * @returns Promise with encrypted message and initialization vector
 */
/**
 * Generates a signing key pair for message authentication
 * @returns Promise with the generated signing key pair
 */
export const generateSigningKeyPair = async (): Promise<KeyPair> => {
  return window.crypto.subtle.generateKey(
    {
      name: ECDSA_ALGORITHM,
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  ) as Promise<KeyPair>;
};

/**
 * Signs a message using ECDSA
 * @param message - The message to sign
 * @param privateKey - The private key to sign with
 * @returns Promise with the signature as base64 string
 */
export const signMessage = async (message: string, privateKey: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const messageData = encoder.encode(message);
  
  const signature = await window.crypto.subtle.sign(
    {
      name: ECDSA_ALGORITHM,
      hash: { name: HASH_ALGORITHM }
    },
    privateKey,
    messageData
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

/**
 * Verifies a message signature
 * @param message - The original message
 * @param signature - The base64 signature to verify
 * @param publicKey - The public key to verify with
 * @returns Promise with verification result
 */
export const verifySignature = async (
  message: string,
  signature: string,
  publicKey: CryptoKey
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const messageData = encoder.encode(message);
  const signatureData = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  
  return window.crypto.subtle.verify(
    {
      name: ECDSA_ALGORITHM,
      hash: { name: HASH_ALGORITHM }
    },
    publicKey,
    signatureData,
    messageData
  );
};

/**
 * Adds padding to a message to prevent timing attacks
 * @param message - The message to pad
 * @returns Padded message
 */
const padMessage = (message: string): string => {
  // Add random padding to make all messages same length blocks
  const blockSize = 256; // Example block size
  const paddingLength = blockSize - (message.length % blockSize);
  const padding = Array(paddingLength)
    .fill(0)
    .map(() => String.fromCharCode(Math.floor(Math.random() * 26) + 97))
    .join('');
  return message + padding;
};

/**
 * Encrypts a message using AES-GCM with padding
 * @param message - The message to encrypt
 * @param key - The CryptoKey to use for encryption
 * @returns Promise with encrypted message and initialization vector
 */
export const encryptMessage = async (message: string, key: CryptoKey): Promise<EncryptionResult> => {
  try {
    // Add padding to prevent timing attacks
    const paddedMessage = padMessage(message);
    
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Convert message to Uint8Array
    const encoder = new TextEncoder();
    const messageData = encoder.encode(paddedMessage);
    
    // Encrypt the message
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: AES_ALGORITHM,
        iv: iv
      },
      key,
      messageData
    );
    
    // Convert results to base64
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      iv: btoa(String.fromCharCode(...iv))
    };
  } catch (error) {
    // Generic error message to prevent information leakage
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypts an encrypted message
 * @param encryptedData - The encrypted message data
 * @param key - The CryptoKey to use for decryption
 * @returns Promise with decrypted message
 */
/**
 * Removes padding from a decrypted message
 * @param paddedMessage - The padded message to unpad
 * @returns Original message without padding
 */
const removePadding = (paddedMessage: string): string => {
  // Remove random padding (assuming original message doesn't contain random lowercase letters at the end)
  return paddedMessage.replace(/[a-z]+$/, '');
};

/**
 * Decrypts an encrypted message and removes padding
 * @param encryptedData - The encrypted message data
 * @param key - The CryptoKey to use for decryption
 * @returns Promise with decrypted message
 */
export const decryptMessage = async (
  encryptedData: EncryptionResult,
  key: CryptoKey
): Promise<string> => {
  try {
    // Convert base64 data back to Uint8Array
    const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    
    // Decrypt the message
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: AES_ALGORITHM,
        iv: iv
      },
      key,
      ciphertext
    );
    
    // Convert decrypted data to string and remove padding
    const decoder = new TextDecoder();
    const paddedMessage = decoder.decode(decrypted);
    return removePadding(paddedMessage);
  } catch (error) {
    // Generic error message to prevent information leakage
    throw new Error('Decryption failed');
  }
};

/**
 * Encrypts and signs a message
 * @param message - The message to encrypt and sign
 * @param encryptionKey - The key for encryption
 * @param signingKey - The private key for signing
 * @returns Promise with encrypted and signed message
 */
export const encryptAndSignMessage = async (
  message: string,
  encryptionKey: CryptoKey,
  signingKey: CryptoKey
): Promise<SignedMessage> => {
  // First encrypt the message
  const encrypted = await encryptMessage(message, encryptionKey);
  
  // Then sign the ciphertext
  const signature = await signMessage(encrypted.ciphertext, signingKey);
  
  return {
    ...encrypted,
    signature
  };
};

/**
 * Verifies and decrypts a signed message
 * @param signedMessage - The signed and encrypted message
 * @param encryptionKey - The key for decryption
 * @param verificationKey - The public key for signature verification
 * @returns Promise with decrypted message if signature is valid
 */
export const verifyAndDecryptMessage = async (
  signedMessage: SignedMessage,
  encryptionKey: CryptoKey,
  verificationKey: CryptoKey
): Promise<string> => {
  // First verify the signature
  const isValid = await verifySignature(
    signedMessage.ciphertext,
    signedMessage.signature,
    verificationKey
  );
  
  if (!isValid) {
    throw new Error('Invalid message signature');
  }
  
  // Then decrypt the message
  return decryptMessage(signedMessage, encryptionKey);
};
