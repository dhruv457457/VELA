import { MongoClient, Db } from "mongodb";
import { CONFIG } from "./config.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db | null> {
  if (db) return db;
  if (!CONFIG.mongodbUri) return null;

  try {
    client = new MongoClient(CONFIG.mongodbUri);
    await client.connect();
    db = client.db("pact");
    console.log("[MongoDB] Connected to pact database");
    return db;
  } catch (err) {
    console.warn("[MongoDB] Connection failed, using file fallback:", err);
    return null;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
