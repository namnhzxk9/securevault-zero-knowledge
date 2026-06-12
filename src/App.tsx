import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { evaluatePasswordStrength } from "./security/passwordStrength";
import { useAutoLock } from "./security/useAutoLock";

import { deriveKey } from "./crypto/keyDerivation";
import { encryptText } from "./crypto/encrypt";
import { decryptText } from "./crypto/decrypt";
import {
  deleteVaultItem,
  getVaultItems,
  saveVaultItem,
  type VaultItem,
} from "./storage/vaultRepository";

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
    if (passwordStrength.label === "Weak") {
    alert("Master password is too weak. Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.");
    return;
  }

  useAutoLock({
  isEnabled: isUnlocked,
  timeoutMs: 10 * 1000,
  onLock: handleLock,
});

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
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>SecureVault Zero-Knowledge</h1>

      <p>
        Encrypted vault for secrets, API keys, passwords, and private notes.
      </p>

      {!isUnlocked ? (
        <section
          style={{
            marginTop: "24px",
            padding: "24px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            maxWidth: "480px",
          }}
        >
          <h2>Unlock Vault</h2>

          <input
            type="password"
            placeholder="Enter master password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />
            <div
    style={{
      marginBottom: "16px",
      padding: "12px",
      border: "1px solid #333",
      borderRadius: "8px",
      background: "#111",
    }}
  >
    <strong>Password Strength: {passwordStrength.label}</strong>

    <ul style={{ marginTop: "8px", marginBottom: 0, paddingLeft: "20px" }}>
      <li>{passwordStrength.checks.minLength ? "✓" : "○"} At least 12 characters</li>
      <li>{passwordStrength.checks.hasUppercase ? "✓" : "○"} Contains uppercase letter</li>
      <li>{passwordStrength.checks.hasLowercase ? "✓" : "○"} Contains lowercase letter</li>
      <li>{passwordStrength.checks.hasNumber ? "✓" : "○"} Contains number</li>
      <li>{passwordStrength.checks.hasSpecialChar ? "✓" : "○"} Contains special character</li>
    </ul>
  </div>

          <button
            onClick={handleUnlock}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Unlock
          </button>

          <p style={{ marginTop: "16px", color: "#999" }}>
            Saved encrypted items: {items.length}
          </p>
        </section>
      ) : (
        <section
          style={{
            marginTop: "24px",
            padding: "24px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            maxWidth: "820px",
          }}
        >
          <h2>Vault Dashboard</h2>
          <p>Status: Vault unlocked</p>
          <p style={{ color: "#999" }}>
            Auto-lock enabled after 5 minutes of inactivity.
          </p>

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
              }}
            />

            <button
              onClick={handleAddSecret}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                marginRight: "12px",
              }}
            >
              Save Encrypted Secret
            </button>

            <button
              onClick={handleLock}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
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
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    marginBottom: "12px",
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
                        background: "#111",
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
                    }}
                  >
                    Reveal
                  </button>

                  <button
                    onClick={() => handleDeleteSecret(item.id)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
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