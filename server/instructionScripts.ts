import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { instructionScripts, InsertInstructionScript } from "../drizzle/schema";

export type ScriptType = 
  | "channel_analysis"
  | "title_guide"
  | "description_guide"
  | "script_analysis"
  | "thumbnail_mechanics"
  | "midjourney_prompts";

// Default user ID for fallback scripts (Omniscience)
const DEFAULT_SCRIPTS_USER_ID = 810200;

/**
 * Create a new version of an instruction script
 */
export async function createInstructionScript(
  userId: number,
  scriptType: ScriptType,
  content: string,
  trainedBy?: string
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get the latest version number for this script type
  const latestScript = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(instructionScripts.version))
    .limit(1);

  const newVersion = latestScript.length > 0 ? latestScript[0]!.version + 1 : 1;

  const result = await db.insert(instructionScripts).values({
    userId,
    scriptType,
    version: newVersion,
    content,
    trainedBy: trainedBy || null,
  });

  return result[0].insertId;
}

/**
 * Get all versions of a script type for a user
 */
export async function getInstructionScripts(
  userId: number,
  scriptType: ScriptType
) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(instructionScripts.version));
}

/**
 * Get the latest version of a script type
 * Falls back to default scripts from user 810200 if not found for current user
 */
export async function getLatestInstructionScript(
  userId: number,
  scriptType: ScriptType
) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  // First try to get user's own script
  const result = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(instructionScripts.version))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Fallback to default scripts from user 810200
  if (userId !== DEFAULT_SCRIPTS_USER_ID) {
    const defaultResult = await db
      .select()
      .from(instructionScripts)
      .where(
        and(
          eq(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID),
          eq(instructionScripts.scriptType, scriptType)
        )
      )
      .orderBy(desc(instructionScripts.version))
      .limit(1);

    if (defaultResult.length > 0) {
      return defaultResult[0];
    }
  }

  return null;
}

/**
 * Get a specific version of a script
 */
export async function getInstructionScriptByVersion(
  userId: number,
  scriptType: ScriptType,
  version: number
) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType),
        eq(instructionScripts.version, version)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all script types with their latest versions
 */
export async function getAllLatestScripts(userId: number) {
  const scriptTypes: ScriptType[] = [
    "channel_analysis",
    "title_guide",
    "description_guide",
    "script_analysis",
    "thumbnail_mechanics",
    "midjourney_prompts",
  ];

  const results = await Promise.all(
    scriptTypes.map(async (type) => ({
      scriptType: type,
      script: await getLatestInstructionScript(userId, type),
    }))
  );

  return results;
}


/**
 * Set a specific version as the active version for a script type
 * This will deactivate all other versions of the same script type
 */
export async function setActiveVersion(
  userId: number,
  scriptType: ScriptType,
  version: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // First, deactivate all versions of this script type for this user
  await db
    .update(instructionScripts)
    .set({ isActive: false })
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    );

  // Then, activate the specified version
  await db
    .update(instructionScripts)
    .set({ isActive: true })
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType),
        eq(instructionScripts.version, version)
      )
    );
}

/**
 * Get the active version of a script type
 * Falls back to the latest version if no active version is set
 * Falls back to default scripts from user 810200 if not found for current user
 */
export async function getActiveInstructionScript(
  userId: number,
  scriptType: ScriptType
) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  // First try to get user's active script
  const activeResult = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType),
        eq(instructionScripts.isActive, true)
      )
    )
    .limit(1);

  if (activeResult.length > 0) {
    return activeResult[0];
  }

  // Fallback to latest version if no active version is set
  const latestResult = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(instructionScripts.version))
    .limit(1);

  if (latestResult.length > 0) {
    // Set this as active for future queries
    await setActiveVersion(userId, scriptType, latestResult[0]!.version);
    return latestResult[0];
  }

  // Fallback to default scripts from user 810200
  if (userId !== DEFAULT_SCRIPTS_USER_ID) {
    const defaultActiveResult = await db
      .select()
      .from(instructionScripts)
      .where(
        and(
          eq(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID),
          eq(instructionScripts.scriptType, scriptType),
          eq(instructionScripts.isActive, true)
        )
      )
      .limit(1);

    if (defaultActiveResult.length > 0) {
      return defaultActiveResult[0];
    }

    // Fallback to latest default script
    const defaultLatestResult = await db
      .select()
      .from(instructionScripts)
      .where(
        and(
          eq(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID),
          eq(instructionScripts.scriptType, scriptType)
        )
      )
      .orderBy(desc(instructionScripts.version))
      .limit(1);

    if (defaultLatestResult.length > 0) {
      return defaultLatestResult[0];
    }
  }

  return null;
}
