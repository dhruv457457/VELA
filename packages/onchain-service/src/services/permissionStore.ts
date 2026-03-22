import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "../../permissions.json");

export interface StoredPermission {
  id: string;
  walletAddress: string;
  repoName: string;
  budget: string;
  periodDays: string;
  expiryDays: string;
  agentAddress: string;
  permissionsContext: string;
  delegationManager: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
}

interface PermissionStore {
  permissions: StoredPermission[];
}

// ── File-based fallback ──

function readStore(): PermissionStore {
  if (!existsSync(STORE_PATH)) {
    return { permissions: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { permissions: [] };
  }
}

function writeStore(store: PermissionStore): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ── MongoDB + file hybrid functions ──

/**
 * Save a new permission (or update existing one for same wallet+repo).
 */
export async function savePermission(
  permission: Omit<StoredPermission, "id" | "createdAt" | "status">
): Promise<StoredPermission> {
  const db = await getDb();

  const id = `perm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: StoredPermission = {
    ...permission,
    id,
    createdAt: new Date().toISOString(),
    status: "active",
  };

  if (db) {
    try {
      // Deactivate existing active permission for same wallet+repo
      await db.collection("permissions").updateMany(
        {
          walletAddress: { $regex: new RegExp(`^${permission.walletAddress}$`, "i") },
          repoName: permission.repoName,
          status: "active",
        },
        { $set: { status: "revoked" } }
      );

      await db.collection("permissions").insertOne({ ...entry });
      console.log(`[PermissionStore] Saved permission ${entry.id} to MongoDB`);
      return entry;
    } catch (err) {
      console.warn("[PermissionStore] MongoDB save failed, using file:", err);
    }
  }

  // File fallback
  const store = readStore();
  const existingIdx = store.permissions.findIndex(
    (p) =>
      p.walletAddress.toLowerCase() === permission.walletAddress.toLowerCase() &&
      p.repoName === permission.repoName &&
      p.status === "active"
  );

  if (existingIdx >= 0) {
    entry.id = store.permissions[existingIdx].id;
    entry.createdAt = store.permissions[existingIdx].createdAt;
    store.permissions[existingIdx] = entry;
    console.log(`[PermissionStore] Updated permission ${entry.id} in file`);
  } else {
    store.permissions.push(entry);
    console.log(`[PermissionStore] Saved new permission ${entry.id} to file`);
  }

  writeStore(store);
  return entry;
}

/**
 * Get all permissions for a wallet address.
 */
export async function getPermissions(walletAddress: string): Promise<StoredPermission[]> {
  const db = await getDb();

  if (db) {
    try {
      const perms = await db
        .collection("permissions")
        .find(
          { walletAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") } },
          { projection: { _id: 0 } }
        )
        .toArray();

      // Auto-expire
      const now = new Date();
      for (const p of perms) {
        if (p.status === "active" && new Date(p.expiresAt) < now) {
          await db.collection("permissions").updateOne(
            { id: p.id },
            { $set: { status: "expired" } }
          );
          p.status = "expired";
        }
      }

      return perms as unknown as StoredPermission[];
    } catch (err) {
      console.warn("[PermissionStore] MongoDB read failed, using file:", err);
    }
  }

  // File fallback
  const store = readStore();
  const now = new Date();
  let changed = false;
  store.permissions.forEach((p) => {
    if (p.status === "active" && new Date(p.expiresAt) < now) {
      p.status = "expired";
      changed = true;
    }
  });
  if (changed) writeStore(store);

  return store.permissions.filter(
    (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}

/**
 * Get the active permission for a wallet (most recent active one).
 */
export async function getActivePermission(walletAddress: string): Promise<StoredPermission | null> {
  const perms = await getPermissions(walletAddress);
  return perms.find((p) => p.status === "active") || null;
}

/**
 * Revoke a permission by ID.
 */
export async function revokeStoredPermission(permissionId: string): Promise<boolean> {
  const db = await getDb();

  if (db) {
    try {
      const result = await db.collection("permissions").updateOne(
        { id: permissionId },
        { $set: { status: "revoked" } }
      );
      if (result.matchedCount > 0) {
        console.log(`[PermissionStore] Revoked permission ${permissionId} in MongoDB`);
        return true;
      }
    } catch (err) {
      console.warn("[PermissionStore] MongoDB revoke failed, using file:", err);
    }
  }

  // File fallback
  const store = readStore();
  const perm = store.permissions.find((p) => p.id === permissionId);
  if (!perm) return false;

  perm.status = "revoked";
  writeStore(store);
  console.log(`[PermissionStore] Revoked permission ${permissionId} in file`);
  return true;
}
