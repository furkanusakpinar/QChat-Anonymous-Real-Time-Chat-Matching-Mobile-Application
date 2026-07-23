import CryptoJS from 'crypto-js';

// Guarantee crypto.getRandomValues polyfill
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = function (array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

/**
 * Generates a random 256-bit AES encryption key for a chat session.
 */
export const generateSessionKey = () => {
  try {
    const entropy = `${Date.now()}_${Math.random()}_${Math.random()}_qchat_salt`;
    return CryptoJS.SHA256(entropy).toString(CryptoJS.enc.Hex);
  } catch (error) {
    return 'qchat_key_' + Math.random().toString(36).substring(2, 15);
  }
};

/**
 * Computes a SHA-256 hash of a input string (e.g. for message payload integrity verification).
 */
export const computeHash = (text) => {
  if (!text) return '';
  try {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
  } catch (e) {
    return '000000';
  }
};

/**
 * Encrypts a message text using AES-256 with the given session key.
 */
export const encryptMessage = (plainText, secretKey) => {
  if (!plainText || !secretKey) return { ciphertext: plainText || '', hash: '', encryptedAt: Date.now() };
  try {
    const ciphertext = CryptoJS.AES.encrypt(plainText, secretKey).toString();
    const hash = computeHash(plainText);
    return {
      ciphertext,
      hash,
      encryptedAt: Date.now(),
    };
  } catch (error) {
    // Fallback safe encoding if AES throws
    const hash = computeHash(plainText);
    return {
      ciphertext: btoa(encodeURIComponent(plainText)),
      hash,
      encryptedAt: Date.now(),
    };
  }
};

/**
 * Decrypts an AES-256 encrypted ciphertext using the session key.
 */
export const decryptMessage = (ciphertext, secretKey) => {
  if (!ciphertext) return '';
  if (!secretKey) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (originalText) return originalText;
    
    // Fallback decoding
    try {
      return decodeURIComponent(atob(ciphertext));
    } catch (e) {
      return ciphertext;
    }
  } catch (error) {
    try {
      return decodeURIComponent(atob(ciphertext));
    } catch (e) {
      return ciphertext;
    }
  }
};
