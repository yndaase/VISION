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

    static async clearThread(threadId) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_MESSAGES, "readwrite");
            const store = tx.objectStore(STORE_MESSAGES);
            const index = store.index("thread");
            const request = index.openCursor(IDBKeyRange.only(threadId));

            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
            tx.oncomplete = () => {
                localStorage.setItem("waec_chat_signal", Date.now());
                resolve();
            };
            tx.onerror = () => reject("Clear Error");
        });
    }
}

// --- TRUE WEB-RTC P2P NETWORK RELAY ---
class VisionNetwork {
    static peer = null;
    static connections = {};

    static init(email) {
        if (!window.Peer) {
            console.error("VisionNetwork: PeerJS not loaded.");
            return;
        }

        // Generate a deterministic but hashed peer ID to protect email privacy on the public tracker
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = ((hash << 5) - hash) + email.charCodeAt(i);
            hash |= 0; 
        }
        const peerId = "vision_hq_v2_" + Math.abs(hash).toString(36);
        
        console.log("Initializing VisionNetwork P2P Node:", peerId);
        this.peer = new window.Peer(peerId);

        this.peer.on('open', (id) => {
            console.log("P2P Node Online:", id);
        });

        this.peer.on('connection', (conn) => {
            console.log("Incoming P2P Direct Tunnel from:", conn.peer);
            this.connections[conn.peer] = conn;

            conn.on('data', async (data) => {
                if (data && data.type === 'msg') {
                    console.log("Secure Payload received over WebRTC P2P");
                    await window.VisionStore.saveMessage(data);
                }
            });
            conn.on('close', () => delete this.connections[conn.peer]);
        });
        
        this.peer.on('error', (err) => {
            console.warn("P2P Network Warning:", err);
        });
    }

    static async broadcast(payload) {
        if (!this.peer || !this.peer.open) return false;
        
        const recipientEmail = payload.to;
        let hash = 0;
        for (let i = 0; i < recipientEmail.length; i++) {
            hash = ((hash << 5) - hash) + recipientEmail.charCodeAt(i);
            hash |= 0; 
        }
        const targetId = "vision_hq_v2_" + Math.abs(hash).toString(36);

        // Check if tunnel exists
        let conn = this.connections[targetId];
        
        if (!conn || !conn.open) {
            console.log("Opening new P2P Tunnel to:", targetId);
            conn = this.peer.connect(targetId, { reliable: true });
            
            // Await connection open
            await new Promise((resolve) => {
                let resolved = false;
                conn.on('open', () => {
                    if(!resolved) {
                        resolved = true;
                        this.connections[targetId] = conn;
                        console.log("P2P Tunnel Established!");
                        resolve();
                    }
                });
                conn.on('error', () => {
                    if(!resolved) { resolved = true; resolve(); }
                });
                setTimeout(() => {
                    if(!resolved) { resolved = true; resolve(); }
                }, 3000); // 3 sec timeout
            });
        }

        if (conn && conn.open) {
            console.log("Transmitting encrypted P2P Binary over Internet");
            conn.send(payload);
            return true;
        } else {
            console.warn("Remote peer offline or unreachable. Payload stored locally.");
            return false;
        }
    }
}

window.VisionCrypto = VisionCrypto;
window.VisionStore = VisionStore;
window.VisionNetwork = VisionNetwork;
