/**
 * VISION PRIVATE COMM — ENCRYPTION & STORAGE ENGINE v2.0
 * Security: RSA-OAEP (Identity) + AES-GCM 256-bit (Payload)
 * Storage: IndexedDB (Media & Large Payloads)
 */

const DB_NAME = "waec_private_db";
const DB_VERSION = 1;
const STORE_MESSAGES = "waec_messages";

// --- ROBUST BINARY CONVERSION HELPERS ---
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

class VisionCrypto {
    static async generateIdentity() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        return { publicKey, privateKey };
    }

    static async importPublicKey(jwk) {
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
    }

    static async importPrivateKey(jwk) {
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
    }

    /**
     * Encrypts a message or file buffer using E2EE
     */
    static async encryptForRecipient(data, recipientJwk) {
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = typeof data === "string" ? new TextEncoder().encode(data) : data;
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encodedData
        );

        const recipientPubKey = await this.importPublicKey(recipientJwk);
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            recipientPubKey,
            exportedAesKey
        );

        return {
            ciphertext: arrayBufferToBase64(ciphertext),
            encryptedAesKey: arrayBufferToBase64(encryptedAesKey),
            iv: arrayBufferToBase64(iv)
        };
    }

    static async decrypt(encryptedWrapper, myPrivateJwk) {
        const privateKey = await this.importPrivateKey(myPrivateJwk);

        const encryptedAesKey = base64ToArrayBuffer(encryptedWrapper.encryptedAesKey);
        const aesKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAesKey
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyBuffer,
            "AES-GCM",
            true,
            ["decrypt"]
        );

        const ciphertext = base64ToArrayBuffer(encryptedWrapper.ciphertext);
        const iv = new Uint8Array(base64ToArrayBuffer(encryptedWrapper.iv));
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            aesKey,
            ciphertext
        );

        return decryptedBuffer;
    }
}

class VisionStore {
    static async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject("DB Error");
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
                    const store = db.createObjectStore(STORE_MESSAGES, { keyPath: "id", autoIncrement: true });
                    store.createIndex("thread", "threadId", { unique: false });
                }
            };
        });
    }

    static async saveMessage(msg) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_MESSAGES, "readwrite");
            const store = tx.objectStore(STORE_MESSAGES);
            const request = store.add(msg);
            
            request.onsuccess = () => {
                // Trigger localized DB sync signal
                localStorage.setItem("waec_chat_signal", Date.now());
                resolve();
            };
            request.onerror = () => reject("Save Error");
        });
    }

    static async getThread(threadId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_MESSAGES, "readonly");
            const index = tx.objectStore(STORE_MESSAGES).index("thread");
            const request = index.getAll(IDBKeyRange.only(threadId));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Read Error");
        });
    }
}

window.VisionCrypto = VisionCrypto;
window.VisionStore = VisionStore;
