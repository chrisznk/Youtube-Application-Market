import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { coordinationScripts } from "../drizzle/schema";

export type CoordinationScriptType = 
  | "thumbnail_generation" 
  | "title_generation" 
  | "description_generation"
  | "strategy_generation"
  | "title_and_thumbnail_generation";

export interface CoordinationScript {
  id: number;
  userId: number;
  scriptType: CoordinationScriptType;
  version: number;
  content: string;
  createdAt: Date;
}

/**
 * Create or update a coordination script (no versioning)
 */
export async function upsertCoordinationScript(
  userId: number,
  scriptType: CoordinationScriptType,
  content: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if script already exists
  const existing = await db
    .select()
    .from(coordinationScripts)
    .where(
      and(
        eq(coordinationScripts.userId, userId),
        eq(coordinationScripts.scriptType, scriptType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing script
    await db
      .update(coordinationScripts)
      .set({ content, createdAt: new Date() })
      .where(
        and(
          eq(coordinationScripts.userId, userId),
          eq(coordinationScripts.scriptType, scriptType)
        )
      );
  } else {
    // Create new script
    await db.insert(coordinationScripts).values({
      userId,
      scriptType,
      version: 1, // Always version 1 (no versioning)
      content,
    });
  }
}

// Default user ID for fallback scripts (Omniscience)
const DEFAULT_SCRIPTS_USER_ID = 810200;

/**
 * Get a coordination script for a user (no versioning, only one per type)
 * Falls back to default scripts from user 810200 if not found for current user
 */
export async function getCoordinationScript(
  userId: number,
  scriptType: CoordinationScriptType
) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  // First try to get user's own script
  const result = await db
    .select()
    .from(coordinationScripts)
    .where(
      and(
        eq(coordinationScripts.userId, userId),
        eq(coordinationScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(coordinationScripts.version))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Fallback to default scripts from user 810200
  if (userId !== DEFAULT_SCRIPTS_USER_ID) {
    const defaultResult = await db
      .select()
      .from(coordinationScripts)
      .where(
        and(
          eq(coordinationScripts.userId, DEFAULT_SCRIPTS_USER_ID),
          eq(coordinationScripts.scriptType, scriptType)
        )
      )
      .orderBy(desc(coordinationScripts.version))
      .limit(1);

    if (defaultResult.length > 0) {
      return defaultResult[0];
    }
  }

  return null;
}

/**
 * Replace tags in coordination script with actual content
 * Supports both {{tag}} and <<<GUIDE_TAG>>> formats
 */
export async function replaceScriptTags(
  scriptContent: string,
  replacements: {
    video_transcript?: string;
    ab_test_report?: string;
    strategy_summary?: string;
    custom_instructions?: string;
    current_channel_titles?: string;
    guide_channel_analysis?: string;
    guide_title?: string;
    guide_description?: string;
    guide_script_analysis?: string;
    guide_thumbnail_mechanics?: string;
    guide_midjourney_prompts?: string;
  }
): Promise<string> {
  let result = scriptContent;

  // Mapping of guide tags to replacement keys
  const guideTagMapping: Record<string, keyof typeof replacements> = {
    'GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY': 'guide_channel_analysis',
    'GUIDE_TITRE': 'guide_title',
    'GUIDE_META_AB_TEST': 'guide_script_analysis',
    'GUIDE_MINIATURES': 'guide_thumbnail_mechanics',
    'GUIDE_PROMPTS_MIDJOURNEY': 'guide_midjourney_prompts',
    'GUIDE_DESCRIPTION': 'guide_description',
  };

  // Replace <<<GUIDE_XXX>>> tags
  for (const [guideTag, replacementKey] of Object.entries(guideTagMapping)) {
    const value = replacements[replacementKey];
    if (value !== undefined) {
      const tag = `<<<${guideTag}>>>`;
      result = result.replaceAll(tag, value);
    }
  }

  // Replace {{tag}} tags
  for (const [key, value] of Object.entries(replacements)) {
    if (value !== undefined) {
      const tag = `{{${key}}}`;
      result = result.replaceAll(tag, value);
    }
  }

  return result;
}
