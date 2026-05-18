import Dexie, { type EntityTable } from "dexie";

export interface GameSession {
  id?: number;
  deckNumber: number;
  playerName: string;
  role: string;
  createdAt: Date;
}

class MafiaOfflineDB extends Dexie {
  gameSession!: EntityTable<GameSession, "id">;

  constructor() {
    super("MafiaOfflineDB");
    this.version(1).stores({
      gameSession: "++id, deckNumber, playerName, role, createdAt",
    });
  }
}

let db: MafiaOfflineDB | null = null;

function getDb(): MafiaOfflineDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB فقط در مرورگر در دسترس است.");
  }
  if (!db) {
    db = new MafiaOfflineDB();
  }
  return db;
}

export function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

export async function addSession(
  data: Omit<GameSession, "id">
): Promise<number> {
  return getDb().gameSession.add(data);
}

export async function getAllSessions(): Promise<GameSession[]> {
  return getDb().gameSession.orderBy("createdAt").reverse().toArray();
}

export async function clearAllSessions(): Promise<void> {
  await getDb().gameSession.clear();
}

export async function countSessions(): Promise<number> {
  return getDb().gameSession.count();
}
