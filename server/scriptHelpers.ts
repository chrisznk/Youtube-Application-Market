/**
 * Helper functions for managing instruction and coordination scripts
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Get the latest version of an instruction script
 */
export async function getLatestInstructionScript(userId: number, scriptType: string): Promise<{ content: string } | null> {
  if (!DATABASE_URL) {
    console.warn('[scriptHelpers] DATABASE_URL not configured');
    return null;
  }

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    const [rows] = await connection.execute(
      `SELECT content FROM instructionScripts 
       WHERE userId = ? AND scriptType = ? 
       ORDER BY version DESC 
       LIMIT 1`,
      [userId, scriptType]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return { content: (rows[0] as any).content };
    }
    return null;
  } catch (error) {
    console.error(`[scriptHelpers] Error fetching instruction script ${scriptType}:`, error);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Get the latest version of a coordination script
 */
export async function getLatestCoordinationScript(userId: number, scriptType: string): Promise<{ content: string } | null> {
  if (!DATABASE_URL) {
    console.warn('[scriptHelpers] DATABASE_URL not configured');
    return null;
  }

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    const [rows] = await connection.execute(
      `SELECT content FROM coordinationScripts 
       WHERE userId = ? AND scriptType = ? 
       ORDER BY version DESC 
       LIMIT 1`,
      [userId, scriptType]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return { content: (rows[0] as any).content };
    }
    return null;
  } catch (error) {
    console.error(`[scriptHelpers] Error fetching coordination script ${scriptType}:`, error);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Replace tags in a script with actual values
 */
export function replaceScriptTags(script: string, variables: Record<string, string>): string {
  let result = script;
  
  for (const [key, value] of Object.entries(variables)) {
    const tag = `{{${key}}}`;
    result = result.replace(new RegExp(tag, 'g'), value || '');
  }
  
  return result;
}
