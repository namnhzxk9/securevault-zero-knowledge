import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { deriveKey } from "./crypto/keyDerivation";
import { encryptText } from "./crypto/encrypt";
import { decryptText } from "./crypto/decrypt";
import {
  deleteVaultItem,
  getVaultItems,
  saveVaultItem,
  type VaultItem,
} from "./storage/vaultRepository";
import { evaluatePasswordStrength } from "./security/passwordStrength";
import { useAutoLock } from "./security/useAutoLock";

const VAULT_SALT_KEY = "securevault-salt";

function App() {
  const [masterPassword, setMasterPassword] = useState("");
  const passwordStrength = evaluatePasswordStrength(masterPassword);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [key, setKey] = useState<CryptoKey | null>(null);

  const [secretTitle, setSecretTitle] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, string>>(
    {}
  );
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const savedItems = await getVaultItems();
    setItems(savedItems);
  }

  function getOrCreateVaultSalt(): Uint8Array {
    const existingSalt = localStorage.getItem(VAULT_SALT_KEY);

    if (existingSalt) {
      return base64ToUint8Array(existingSalt);
    }

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(VAULT_SALT_KEY, uint8ArrayToBase64(newSalt));

    return newSalt;
  }

  async function handleUnlock() {
    if (masterPassword.trim().length < 8) {
      alert("Master password must be at least 8 characters.");
      return;
    }

    const salt = getOrCreateVaultSalt();
    const derivedKey = await deriveKey(masterPassword, salt);

    setKey(derivedKey);
    setIsUnlocked(true);
  }

  async function handleAddSecret() {
    if (!key) {
      alert("Vault is locked.");
      return;
    }

    if (!secretTitle.trim() || !secretValue.trim()) {
      alert("Please enter both title and secret value.");
      return;
    }

    const encrypted = await encryptText(secretValue, key);

    const item: VaultItem = {
      id: uuidv4(),
      title: secretTitle,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      createdAt: new Date().toISOString(),
    };

    await saveVaultItem(item);
    await loadItems();

    setSecretTitle("");
    setSecretValue("");
  }

  async function handleRevealSecret(item: VaultItem) {
    if (!key) {
      alert("Vault is locked.");
      return;
    }

    try {
      const decrypted = await decryptText(item.ciphertext, item.iv, key);

      setVisibleSecrets((current) => ({
        ...current,
        [item.id]: decrypted,
      }));
    } catch {
      alert("Failed to decrypt. The master password may be incorrect.");
    }
  }

  async function handleCopySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopyMessage(
        "Secret copied to clipboard. Clipboard will be cleared in 30 seconds."
      );

      window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
          setCopyMessage("Clipboard cleared.");
        } catch {
          setCopyMessage("Clipboard clear failed. Please clear it manually.");
        }
      }, 30 * 1000);
    } catch {
      setCopyMessage("Copy failed. Clipboard permission may be blocked.");
    }
  }

  async function handleDeleteSecret(id: string) {
    await deleteVaultItem(id);
    await loadItems();

    setVisibleSecrets((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function handleLock() {
    setIsUnlocked(false);
    setMasterPassword("");
    setKey(null);
    setSecretTitle("");
    setSecretValue("");
    setVisibleSecrets({});
    setCopyMessage("");
  }

  useAutoLock({
    isEnabled: isUnlocked,
    timeoutMs: 5 * 60 * 1000,
    onLock: handleLock,
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px",
        fontFamily: "Arial",
        background: "#15161a",
        color: "#f5f5f5",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1180px",
          margin: "0 auto 36px auto",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "3px",
              fontWeight: 700,
              color: "#f5f5f5",
            }}
          >
            NGUYEN HOAI NAM
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              letterSpacing: "2px",
              color: "#888",
            }}
          >
            SECURITY LAB · ENCRYPTED SYSTEMS
          </div>
        </div>

        <div
          style={{
            padding: "10px 14px",
            border: "1px solid #333",
            borderRadius: "999px",
            background: "#0f0f0f",
            color: "#aaa",
            fontSize: "13px",
            letterSpacing: "1px",
          }}
        >
          LOCAL-ONLY · ZERO-KNOWLEDGE
        </div>
      </header>

      <h1
        style={{
          textAlign: "center",
          fontSize: "56px",
          marginBottom: "12px",
        }}
      >
        SecureVault Zero-Knowledge
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "18px",
        }}
      >
        A zero-knowledge encrypted vault for private data, credentials, and
        sensitive notes.
      </p>

      {!isUnlocked ? (
        <div
          style={{
            marginTop: "32px",
            display: "grid",
            gridTemplateColumns: "minmax(360px, 520px) 1fr",
            gap: "24px",
            alignItems: "stretch",
            maxWidth: "1180px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <section
            style={{
              padding: "28px",
              border: "1px solid #ddd",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Unlock Vault</h2>

            <input
              type="password"
              placeholder="Enter master password"
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                marginBottom: "14px",
                boxSizing: "border-box",
                borderRadius: "8px",
                border: "1px solid #555",
                background: "#2f2f2f",
                color: "#fff",
              }}
            />

            <div
              style={{
                marginBottom: "18px",
                padding: "16px",
                border: "1px solid #333",
                borderRadius: "12px",
                background: "#111",
              }}
            >
              <strong>Password Strength: {passwordStrength.label}</strong>

              <ul
                style={{
                  marginTop: "12px",
                  marginBottom: 0,
                  paddingLeft: "0",
                  listStyle: "none",
                  lineHeight: "1.8",
                }}
              >
                <li>
                  {passwordStrength.checks.minLength ? "✓" : "○"} At least 12
                  characters
                </li>
                <li>
                  {passwordStrength.checks.hasUppercase ? "✓" : "○"} Contains
                  uppercase letter
                </li>
                <li>
                  {passwordStrength.checks.hasLowercase ? "✓" : "○"} Contains
                  lowercase letter
                </li>
                <li>
                  {passwordStrength.checks.hasNumber ? "✓" : "○"} Contains
                  number
                </li>
                <li>
                  {passwordStrength.checks.hasSpecialChar ? "✓" : "○"} Contains
                  special character
                </li>
              </ul>
            </div>

            <button
              onClick={handleUnlock}
              style={{
                padding: "12px 18px",
                cursor: "pointer",
                borderRadius: "8px",
                border: "none",
                background: "#e5e5e5",
                color: "#111",
                fontWeight: 600,
              }}
            >
              Unlock
            </button>

            <p style={{ marginTop: "18px", color: "#999" }}>
              Saved encrypted items: {items.length}
            </p>
          </section>

          <section
            style={{
              padding: "28px",
              border: "1px solid #333",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  background: "#111",
                }}
              >
                <strong>AES-GCM</strong>
                <p style={{ color: "#999", marginBottom: 0 }}>
                  Authenticated encryption
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  background: "#111",
                }}
              >
                <strong>PBKDF2</strong>
                <p style={{ color: "#999", marginBottom: 0 }}>
                  Key derivation
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  background: "#111",
                }}
              >
                <strong>IndexedDB</strong>
                <p style={{ color: "#999", marginBottom: 0 }}>
                  Encrypted local storage
                </p>
              </div>
            </div>

            <h2 style={{ marginTop: 0 }}>Zero-Knowledge Security Model</h2>

            <div
              style={{
                marginBottom: "22px",
                padding: "14px 16px",
                border: "1px solid #4a1f1f",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, rgba(120, 20, 20, 0.28), rgba(15, 15, 15, 0.9))",
                color: "#ffb4b4",
                fontSize: "14px",
                letterSpacing: "1px",
              }}
            >
              SECURITY NOTICE · PLAINTEXT NEVER LEAVES THE ACTIVE SESSION
            </div>

            <p style={{ color: "#aaa", lineHeight: "1.7" }}>
              SecureVault encrypts sensitive data directly in the browser before
              it is stored. The master password and plaintext secrets are never
              persisted.
            </p>

            <div
              style={{
                marginTop: "22px",
                padding: "18px",
                border: "1px solid #333",
                borderRadius: "12px",
                background: "#0f0f0f",
              }}
            >
              <h3 style={{ marginTop: 0 }}>How it works</h3>

              <ol
                style={{ color: "#aaa", lineHeight: "1.9", paddingLeft: "20px" }}
              >
                <li>Master password derives a local encryption key.</li>
                <li>Secrets are encrypted with AES-GCM.</li>
                <li>Only ciphertext is saved to IndexedDB.</li>
                <li>Plaintext exists only during an unlocked session.</li>
              </ol>
            </div>

            <div
              style={{
                marginTop: "22px",
                padding: "18px",
                border: "1px solid #253b2f",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, rgba(20, 80, 45, 0.2), rgba(10, 10, 10, 0.9))",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Security Posture</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  color: "#aaa",
                  lineHeight: "1.7",
                }}
              >
                <div>✓ No plaintext persistence</div>
                <div>✓ Browser-side key derivation</div>
                <div>✓ Authenticated encryption</div>
                <div>✓ Manual and inactivity lock</div>
              </div>
            </div>

            <div
              style={{
                marginTop: "22px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
              >
                <strong>No plaintext storage</strong>
                <p style={{ color: "#999", marginBottom: 0 }}>
                  Secrets are encrypted before being persisted.
                </p>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
              >
                <strong>Auto-lock enabled</strong>
                <p style={{ color: "#999", marginBottom: 0 }}>
                  Vault locks after inactivity.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section
          style={{
            marginTop: "32px",
            padding: "28px",
            border: "1px solid #ddd",
            borderRadius: "16px",
            maxWidth: "920px",
            marginLeft: "auto",
            marginRight: "auto",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          <h2>Vault Dashboard</h2>

          <p>Status: Vault unlocked</p>

          <p style={{ color: "#999" }}>
            Auto-lock enabled after 5 minutes of inactivity.
          </p>

          {copyMessage && <p style={{ color: "#999" }}>{copyMessage}</p>}

          <div style={{ marginBottom: "24px" }}>
            <h3>Add Secret</h3>

            <input
              type="text"
              placeholder="Title, e.g. GitHub API Key"
              value={secretTitle}
              onChange={(event) => setSecretTitle(event.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                boxSizing: "border-box",
                marginBottom: "12px",
                borderRadius: "8px",
                border: "1px solid #555",
                background: "#2f2f2f",
                color: "#fff",
              }}
            />

            <textarea
              placeholder="Secret value"
              value={secretValue}
              onChange={(event) => setSecretValue(event.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                boxSizing: "border-box",
                marginBottom: "12px",
                borderRadius: "8px",
                border: "1px solid #555",
                background: "#2f2f2f",
                color: "#fff",
              }}
            />

            <button
              onClick={handleAddSecret}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                marginRight: "12px",
                borderRadius: "8px",
                border: "none",
                fontWeight: 600,
              }}
            >
              Save Encrypted Secret
            </button>

            <button
              onClick={handleLock}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderRadius: "8px",
                border: "1px solid #555",
                background: "#111",
                color: "#fff",
              }}
            >
              Lock Vault
            </button>
          </div>

          <hr />

          <div style={{ marginTop: "24px" }}>
            <h3>Encrypted Items</h3>

            {items.length === 0 ? (
              <p>No secrets saved yet.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    marginBottom: "12px",
                    background: "#111",
                  }}
                >
                  <strong>{item.title}</strong>

                  <p style={{ color: "#999" }}>
                    Created: {new Date(item.createdAt).toLocaleString()}
                  </p>

                  <p style={{ wordBreak: "break-all", color: "#999" }}>
                    Ciphertext: {item.ciphertext.slice(0, 80)}...
                  </p>

                  {visibleSecrets[item.id] && (
                    <pre
                      style={{
                        background: "#050505",
                        color: "#fff",
                        padding: "12px",
                        borderRadius: "8px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {visibleSecrets[item.id]}
                    </pre>
                  )}

                  <button
                    onClick={() => handleRevealSecret(item)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      marginRight: "8px",
                      borderRadius: "6px",
                      border: "none",
                    }}
                  >
                    Reveal
                  </button>

                  {visibleSecrets[item.id] && (
                    <button
                      onClick={() => handleCopySecret(visibleSecrets[item.id])}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        marginRight: "8px",
                        borderRadius: "6px",
                        border: "none",
                      }}
                    >
                      Copy
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteSecret(item.id)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderRadius: "6px",
                      border: "1px solid #555",
                      background: "#111",
                      color: "#fff",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export default App;