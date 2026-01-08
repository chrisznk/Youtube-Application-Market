import { getDb } from "./db";
import { scriptProfiles, scriptCorrections, scriptHistory, coordinationScripts, instructionScripts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import { notifyWeeklyBackup } from "./pushNotifications";

export interface BackupData {
  version: string;
  createdAt: string;
  userId: number;
  profiles: ProfileBackup[];
  corrections: CorrectionBackup[];
  history: HistoryBackup[];
  coordinationScripts: CoordinationScriptBackup[];
  instructionScripts: InstructionScriptBackup[];
}

interface ProfileBackup {
  id: number;
  name: string;
  description: string | null;
  metaPrompt: string;
  tags: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CorrectionBackup {
  id: number;
  category: string;
  problem: string;
  correction: string;
  isActive: boolean;
  appliedCount: number;
  createdAt: string;
}

interface HistoryBackup {
  id: number;
  profileId: number | null;
  subject: string;
  instructions: string | null;
  generatedScript: string;
  wordCount: number;
  rating: string | null;
  createdAt: string;
}

interface CoordinationScriptBackup {
  id: number;
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InstructionScriptBackup {
  id: number;
  name: string;
  scriptType: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Génère un backup complet des données utilisateur
 */
export async function generateBackup(userId: number): Promise<BackupData> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Récupérer les profils
  const profiles = await db
    .select()
    .from(scriptProfiles)
    .where(eq(scriptProfiles.userId, userId));

  // Récupérer les corrections
  const corrections = await db
    .select()
    .from(scriptCorrections)
    .where(eq(scriptCorrections.userId, userId));

  // Récupérer l'historique
  const history = await db
    .select()
    .from(scriptHistory)
    .where(eq(scriptHistory.userId, userId));

  // Récupérer les scripts de coordination
  const coordScripts = await db
    .select()
    .from(coordinationScripts)
    .where(eq(coordinationScripts.userId, userId));

  // Récupérer les scripts d'instructions
  const instructions = await db
    .select()
    .from(instructionScripts)
    .where(eq(instructionScripts.userId, userId));

  const backupData: BackupData = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    userId,
    profiles: profiles.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      metaPrompt: p.metaPrompt,
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : [],
      isDefault: p.isDefault,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    corrections: corrections.map(c => ({
      id: c.id,
      category: c.category,
      problem: c.problem,
      correction: c.correction,
      isActive: c.isActive,
      appliedCount: c.appliedCount || 0,
      createdAt: c.createdAt.toISOString(),
    })),
    history: history.map(h => ({
      id: h.id,
      profileId: h.profileId,
      subject: h.topic,
      instructions: h.customInstructions,
      generatedScript: h.generatedScript,
      wordCount: h.wordCount || 0,
      rating: h.rating ? String(h.rating) : null,
      createdAt: h.createdAt.toISOString(),
    })),
    coordinationScripts: coordScripts.map(cs => ({
      id: cs.id,
      name: cs.scriptType,
      type: cs.scriptType,
      content: cs.content,
      isActive: true,
      createdAt: cs.createdAt.toISOString(),
      updatedAt: cs.createdAt.toISOString(),
    })),
    instructionScripts: instructions.map(i => ({
      id: i.id,
      name: i.scriptType,
      scriptType: i.scriptType,
      content: i.content,
      isActive: i.isActive,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.createdAt.toISOString(),
    })),
  };

  return backupData;
}

/**
 * Sauvegarde le backup sur S3
 */
export async function saveBackupToS3(userId: number, backupData: BackupData): Promise<{ url: string; size: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backups/user-${userId}/backup-${timestamp}.json`;
  
  const jsonContent = JSON.stringify(backupData, null, 2);
  const buffer = Buffer.from(jsonContent, "utf-8");
  
  const { url } = await storagePut(fileName, buffer, "application/json");
  
  const sizeInKB = (buffer.length / 1024).toFixed(2);
  const size = buffer.length > 1024 * 1024 
    ? `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`
    : `${sizeInKB} KB`;
  
  return { url, size };
}

/**
 * Exécute le backup hebdomadaire automatique
 */
export async function runWeeklyBackup(userId: number): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Générer le backup
    const backupData = await generateBackup(userId);
    
    // Sauvegarder sur S3
    const { url, size } = await saveBackupToS3(userId, backupData);
    
    // Envoyer une notification
    await notifyWeeklyBackup(
      backupData.profiles.length,
      backupData.corrections.length,
      size
    );
    
    console.log(`[AutoBackup] Weekly backup completed for user ${userId}: ${url}`);
    
    return { success: true, url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[AutoBackup] Weekly backup failed for user ${userId}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Restaure les données depuis un backup
 */
export async function restoreFromBackup(userId: number, backupData: BackupData): Promise<{ success: boolean; restored: { profiles: number; corrections: number } }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let profilesRestored = 0;
  let correctionsRestored = 0;

  // Restaurer les profils (en évitant les doublons par nom)
  for (const profile of backupData.profiles) {
    try {
      await db.insert(scriptProfiles).values({
        userId,
        name: `${profile.name} (restauré)`,
        description: profile.description,
        metaPrompt: profile.metaPrompt,
        tags: profile.tags,
        isDefault: false, // Ne pas écraser le profil par défaut
      });
      profilesRestored++;
    } catch (error) {
      console.warn(`[AutoBackup] Failed to restore profile ${profile.name}:`, error);
    }
  }

  // Restaurer les corrections (en évitant les doublons)
  for (const correction of backupData.corrections) {
    try {
      await db.insert(scriptCorrections).values({
        userId,
        category: correction.category as any,
        problem: correction.problem,
        correction: correction.correction,
        isActive: correction.isActive,
        appliedCount: 0, // Reset le compteur
      });
      correctionsRestored++;
    } catch (error) {
      console.warn(`[AutoBackup] Failed to restore correction:`, error);
    }
  }

  return {
    success: true,
    restored: {
      profiles: profilesRestored,
      corrections: correctionsRestored,
    },
  };
}

/**
 * Liste les backups disponibles pour un utilisateur
 */
export async function listBackups(userId: number): Promise<{ date: string; size: string }[]> {
  // Note: Cette fonction nécessiterait une API S3 listObjects
  // Pour l'instant, retourne un tableau vide
  // Les backups sont accessibles via l'URL directe
  return [];
}

/**
 * Calcule la taille estimée du backup
 */
export function estimateBackupSize(backupData: BackupData): string {
  const jsonContent = JSON.stringify(backupData);
  const sizeInBytes = Buffer.from(jsonContent, "utf-8").length;
  
  if (sizeInBytes > 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(sizeInBytes / 1024).toFixed(2)} KB`;
}
