import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { userSettings, videoTemplates, UserSettings, VideoTemplate } from "../drizzle/schema";

// ============ USER SETTINGS ============

export interface UserSettingsData {
  theme: string;
  backupFrequency: string;
  abTestCtrThreshold: number;
  abTestViewsThreshold: number;
  notifyNewVideos: boolean;
  notifyABTestThreshold: boolean;
  notifyBackupComplete: boolean;
}

export async function getUserSettings(userId: number): Promise<UserSettingsData | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // Create default settings
    await db.insert(userSettings).values({ userId });
    return {
      theme: "system",
      backupFrequency: "weekly",
      abTestCtrThreshold: 5.0,
      abTestViewsThreshold: 1000,
      notifyNewVideos: true,
      notifyABTestThreshold: true,
      notifyBackupComplete: true,
    };
  }

  const settings = result[0];
  return {
    theme: settings.theme || "system",
    backupFrequency: settings.backupFrequency || "weekly",
    abTestCtrThreshold: parseFloat(settings.abTestCtrThreshold || "5.00"),
    abTestViewsThreshold: settings.abTestViewsThreshold || 1000,
    notifyNewVideos: settings.notifyNewVideos ?? true,
    notifyABTestThreshold: settings.notifyABTestThreshold ?? true,
    notifyBackupComplete: settings.notifyBackupComplete ?? true,
  };
}

export async function updateUserSettings(
  userId: number,
  data: Partial<UserSettingsData>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if settings exist
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const updateData: Record<string, unknown> = {};
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.backupFrequency !== undefined) updateData.backupFrequency = data.backupFrequency;
  if (data.abTestCtrThreshold !== undefined) updateData.abTestCtrThreshold = data.abTestCtrThreshold.toString();
  if (data.abTestViewsThreshold !== undefined) updateData.abTestViewsThreshold = data.abTestViewsThreshold;
  if (data.notifyNewVideos !== undefined) updateData.notifyNewVideos = data.notifyNewVideos;
  if (data.notifyABTestThreshold !== undefined) updateData.notifyABTestThreshold = data.notifyABTestThreshold;
  if (data.notifyBackupComplete !== undefined) updateData.notifyBackupComplete = data.notifyBackupComplete;

  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId, ...updateData });
  } else {
    await db.update(userSettings).set(updateData).where(eq(userSettings.userId, userId));
  }

  return true;
}

// ============ VIDEO TEMPLATES ============

export interface VideoTemplateData {
  id: number;
  name: string;
  titleTemplate: string | null;
  descriptionTemplate: string | null;
  tagsTemplate: string[];
  category: string | null;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getVideoTemplates(userId: number): Promise<VideoTemplateData[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(videoTemplates)
    .where(eq(videoTemplates.userId, userId));

  return result.map((t) => ({
    id: t.id,
    name: t.name,
    titleTemplate: t.titleTemplate,
    descriptionTemplate: t.descriptionTemplate,
    tagsTemplate: (t.tagsTemplate as string[]) || [],
    category: t.category,
    isDefault: t.isDefault ?? false,
    usageCount: t.usageCount ?? 0,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function createVideoTemplate(
  userId: number,
  data: {
    name: string;
    titleTemplate?: string;
    descriptionTemplate?: string;
    tagsTemplate?: string[];
    category?: string;
    isDefault?: boolean;
  }
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(videoTemplates)
      .set({ isDefault: false })
      .where(eq(videoTemplates.userId, userId));
  }

  const result = await db.insert(videoTemplates).values({
    userId,
    name: data.name,
    titleTemplate: data.titleTemplate || null,
    descriptionTemplate: data.descriptionTemplate || null,
    tagsTemplate: data.tagsTemplate || [],
    category: data.category || null,
    isDefault: data.isDefault || false,
  });

  return result[0].insertId;
}

export async function updateVideoTemplate(
  templateId: number,
  userId: number,
  data: {
    name?: string;
    titleTemplate?: string;
    descriptionTemplate?: string;
    tagsTemplate?: string[];
    category?: string;
    isDefault?: boolean;
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(videoTemplates)
      .set({ isDefault: false })
      .where(eq(videoTemplates.userId, userId));
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.titleTemplate !== undefined) updateData.titleTemplate = data.titleTemplate;
  if (data.descriptionTemplate !== undefined) updateData.descriptionTemplate = data.descriptionTemplate;
  if (data.tagsTemplate !== undefined) updateData.tagsTemplate = data.tagsTemplate;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

  await db
    .update(videoTemplates)
    .set(updateData)
    .where(eq(videoTemplates.id, templateId));

  return true;
}

export async function deleteVideoTemplate(templateId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(videoTemplates).where(eq(videoTemplates.id, templateId));
  return true;
}

export async function incrementTemplateUsage(templateId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const template = await db
    .select()
    .from(videoTemplates)
    .where(eq(videoTemplates.id, templateId))
    .limit(1);

  if (template.length > 0) {
    await db
      .update(videoTemplates)
      .set({ usageCount: (template[0].usageCount || 0) + 1 })
      .where(eq(videoTemplates.id, templateId));
  }
}

export async function getTemplateCategories(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ category: videoTemplates.category })
    .from(videoTemplates)
    .where(eq(videoTemplates.userId, userId));

  const categories = new Set<string>();
  result.forEach((r) => {
    if (r.category) categories.add(r.category);
  });

  return Array.from(categories).sort();
}

export async function duplicateVideoTemplate(
  templateId: number,
  userId: number,
  newName: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const original = await db
    .select()
    .from(videoTemplates)
    .where(eq(videoTemplates.id, templateId))
    .limit(1);

  if (original.length === 0) {
    throw new Error("Template not found");
  }

  const template = original[0];
  const result = await db.insert(videoTemplates).values({
    userId,
    name: newName,
    titleTemplate: template.titleTemplate,
    descriptionTemplate: template.descriptionTemplate,
    tagsTemplate: template.tagsTemplate,
    category: template.category,
    isDefault: false,
  });

  return result[0].insertId;
}
