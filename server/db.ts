import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, searches, searchHistory, results, Search, SearchHistory, Result, InsertSearch, InsertSearchHistory, InsertResult } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new search record
 */
export async function createSearch(data: InsertSearch): Promise<Search | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create search: database not available");
    return null;
  }

  try {
    const result = await db.insert(searches).values(data);
    const insertedId = (result as any).insertId;
    if (insertedId) {
      const inserted = await db.select().from(searches).where(eq(searches.id, insertedId)).limit(1);
      return inserted.length > 0 ? inserted[0] : null;
    }
    return null;
  } catch (error) {
    console.error("[Database] Failed to create search:", error);
    throw error;
  }
}

/**
 * Get search by ID
 */
export async function getSearchById(searchId: number): Promise<Search | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get search: database not available");
    return null;
  }

  try {
    const result = await db.select().from(searches).where(eq(searches.id, searchId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get search:", error);
    throw error;
  }
}

/**
 * Get all searches for a user
 */
export async function getUserSearches(userId: number): Promise<Search[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user searches: database not available");
    return [];
  }

  try {
    const result = await db.select().from(searches).where(eq(searches.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user searches:", error);
    return [];
  }
}

/**
 * Update a search record
 */
export async function updateSearch(searchId: number, data: Partial<InsertSearch>): Promise<Search | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update search: database not available");
    return null;
  }

  try {
    await db.update(searches).set(data).where(eq(searches.id, searchId));
    return getSearchById(searchId);
  } catch (error) {
    console.error("[Database] Failed to update search:", error);
    throw error;
  }
}

/**
 * Create a search history record
 */
export async function createSearchHistory(data: InsertSearchHistory): Promise<SearchHistory | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create search history: database not available");
    return null;
  }

  try {
    const result = await db.insert(searchHistory).values(data);
    const insertedId = (result as any).insertId;
    if (insertedId) {
      const inserted = await db.select().from(searchHistory).where(eq(searchHistory.id, insertedId)).limit(1);
      return inserted.length > 0 ? inserted[0] : null;
    }
    return null;
  } catch (error) {
    console.error("[Database] Failed to create search history:", error);
    throw error;
  }
}

/**
 * Get search history for a search
 */
export async function getSearchHistory(searchId: number): Promise<SearchHistory[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get search history: database not available");
    return [];
  }

  try {
    const result = await db.select().from(searchHistory).where(eq(searchHistory.searchId, searchId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get search history:", error);
    return [];
  }
}

/**
 * Batch insert ranked results produced by the LangGraph pipeline for a search.
 */
export async function createResults(data: InsertResult[]): Promise<void> {
  const db = await getDb();
  if (!db || data.length === 0) {
    console.warn("[Database] Cannot create results: database unavailable or empty batch");
    return;
  }
  try {
    await db.insert(results).values(data);
  } catch (error) {
    console.error("[Database] Failed to create results:", error);
    throw error;
  }
}

/**
 * Retrieve all results for a search, sorted by similarity score descending.
 */
export async function getResultsForSearch(searchId: number): Promise<Result[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get results: database not available");
    return [];
  }
  try {
    const rows = await db.select().from(results).where(eq(results.searchId, searchId));
    return rows.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("[Database] Failed to get results for search:", error);
    return [];
  }
}
