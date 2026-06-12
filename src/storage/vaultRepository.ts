import { openDB } from "idb";

export type VaultItem = {
  id: string;
  title: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
};

const DB_NAME = "securevault-db";
const STORE_NAME = "vault-items";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    },
  });
}

export async function saveVaultItem(item: VaultItem): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, item);
}

export async function getVaultItems(): Promise<VaultItem[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function deleteVaultItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}