import { eq, desc, and, isNotNull, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  videos,
  youtubeConfig, 
  InsertYouTubeConfig,
  syncLogs,
  InsertSyncLog,
  abTests,
  testVariants,
  videoStats,
  InsertVideo,
  InsertABTest,
  InsertTestVariant,
  InsertVideoStat,
  aiGenerationHistory,
  favoritePrompts,
  channelSyncInfo,
  InsertChannelSyncInfo
} from "../drizzle/schema";
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

// ============ Video Functions ============

export async function getVideosByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Trier par date de publication (plus récent en premier)
  // Les vidéos sans date de publication seront à la fin
  return await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.publishedAt));
}

export async function getVideosWithTranscript(userId: number): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();
  
  const videosWithTranscript = await db
    .select({ youtubeId: videos.youtubeId })
    .from(videos)
    .where(and(
      eq(videos.userId, userId),
      isNotNull(videos.transcript)
    ));
  
  return new Set(videosWithTranscript.map(v => v.youtubeId));
}

export async function getVideoById(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function getVideoByYouTubeId(youtubeId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(videos)
    .where(and(eq(videos.youtubeId, youtubeId), eq(videos.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videos).values(video);
  return Number(result[0].insertId);
}

export async function updateVideo(videoId: number, data: Partial<InsertVideo>, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (userId !== undefined) {
    await db
      .update(videos)
      .set(data)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
  } else {
    await db
      .update(videos)
      .set(data)
      .where(eq(videos.id, videoId));
  }
}

export async function deleteVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related test variants first
  const tests = await db
    .select()
    .from(abTests)
    .where(and(eq(abTests.videoId, videoId), eq(abTests.userId, userId)));
  
  for (const test of tests) {
    await db.delete(testVariants).where(eq(testVariants.testId, test.id));
  }
  
  // Delete related tests
  await db.delete(abTests).where(and(eq(abTests.videoId, videoId), eq(abTests.userId, userId)));
  
  // Delete related stats
  await db.delete(videoStats).where(and(eq(videoStats.videoId, videoId), eq(videoStats.userId, userId)));
  
  // Delete video
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}

export async function deleteAllVideos(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all user videos
  const userVideos = await db.select().from(videos).where(eq(videos.userId, userId));
  
  // Delete all related data for each video
  for (const video of userVideos) {
    const tests = await db.select().from(abTests).where(eq(abTests.videoId, video.id));
    for (const test of tests) {
      await db.delete(testVariants).where(eq(testVariants.testId, test.id));
    }
    await db.delete(abTests).where(eq(abTests.videoId, video.id));
    await db.delete(videoStats).where(eq(videoStats.videoId, video.id));
  }
  
  // Delete all videos
  await db.delete(videos).where(eq(videos.userId, userId));
}

// ============ A/B Test Functions ============

export async function getAllTestsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Ne pas filtrer par userId pour afficher tous les tests A/B
  // Inclure le nom de la vidéo avec un JOIN
  const results = await db
    .select({
      id: abTests.id,
      name: abTests.name,
      videoId: abTests.videoId,
      type: abTests.type,
      status: abTests.status,
      winnerId: abTests.winnerId,
      startDate: abTests.startDate,
      endDate: abTests.endDate,
      createdAt: abTests.createdAt,
      updatedAt: abTests.updatedAt,
      videoTitle: videos.title,
    })
    .from(abTests)
    .leftJoin(videos, eq(abTests.videoId, videos.id))
    .orderBy(desc(abTests.createdAt));
  
  return results;
}

export async function getTestsByVideoId(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Ne filtrer que par videoId, pas par userId
  return await db
    .select()
    .from(abTests)
    .where(eq(abTests.videoId, videoId))
    .orderBy(desc(abTests.createdAt));
}

export async function getTestById(testId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Ne filtrer que par testId, pas par userId
  const result = await db
    .select()
    .from(abTests)
    .where(eq(abTests.id, testId))
    .limit(1);
  
  return result[0];
}

export async function createABTest(test: InsertABTest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(abTests).values(test);
  return Number(result[0].insertId);
}

export async function updateABTest(testId: number, userId: number, data: Partial<InsertABTest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(abTests)
    .set(data)
    .where(and(eq(abTests.id, testId), eq(abTests.userId, userId)));
}

export async function deleteABTest(testId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related variants
  await db.delete(testVariants).where(and(eq(testVariants.testId, testId), eq(testVariants.userId, userId)));
  
  // Delete test
  await db.delete(abTests).where(and(eq(abTests.id, testId), eq(abTests.userId, userId)));
}

// ============ Test Variant Functions ============

export async function getVariantsByTestId(testId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Ne filtrer que par testId, pas par userId
  return await db
    .select()
    .from(testVariants)
    .where(eq(testVariants.testId, testId))
    .orderBy(desc(testVariants.createdAt));
}

export async function createTestVariant(variant: InsertTestVariant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(testVariants).values(variant);
  return Number(result[0].insertId);
}

// Alias pour compatibilité
export const createVariant = createTestVariant;

export async function updateTestVariant(variantId: number, userId: number, data: Partial<InsertTestVariant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(testVariants)
    .set(data)
    .where(and(eq(testVariants.id, variantId), eq(testVariants.userId, userId)));
}

export const updateVariant = updateTestVariant;

export async function deleteTestVariant(variantId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(testVariants).where(and(eq(testVariants.id, variantId), eq(testVariants.userId, userId)));
}

// ============ Video Stats Functions ============

export async function getStatsByVideoId(videoId: number, userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(videoStats)
    .where(and(eq(videoStats.videoId, videoId), eq(videoStats.userId, userId)))
    .orderBy(desc(videoStats.date))
    .limit(limit);
}

export async function createVideoStat(stat: InsertVideoStat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoStats).values(stat);
  return Number(result[0].insertId);
}

// ============ YouTube Configuration Functions ============

export async function getYouTubeConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(youtubeConfig)
    .where(eq(youtubeConfig.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertYouTubeConfig(config: InsertYouTubeConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getYouTubeConfig(config.userId);
  
  if (existing) {
    await db
      .update(youtubeConfig)
      .set(config)
      .where(eq(youtubeConfig.userId, config.userId));
  } else {
    await db.insert(youtubeConfig).values(config);
  }
}

export async function getAllYouTubeConfigs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(youtubeConfig)
    .where(eq(youtubeConfig.autoSyncEnabled, true));
}

export async function updateYouTubeTokens(
  userId: number,
  tokens: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(youtubeConfig)
    .set(tokens)
    .where(eq(youtubeConfig.userId, userId));
}

export async function deleteYouTubeConfig(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(youtubeConfig)
    .where(eq(youtubeConfig.userId, userId));
}

// ============ Sync Logs Functions ============

export async function createSyncLog(log: InsertSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(syncLogs).values(log);
  return Number(result[0].insertId);
}

export async function updateSyncLog(logId: number, data: Partial<InsertSyncLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(syncLogs)
    .set(data)
    .where(eq(syncLogs.id, logId));
}

export async function getSyncLogsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.userId, userId))
    .orderBy(desc(syncLogs.createdAt))
    .limit(limit);
}

// ============ AI Generation History Functions ============

export async function createAiGenerationHistory(data: {
  userId: number;
  generationType: 'strategy' | 'title_suggestions' | 'thumbnail_suggestions' | 'title_and_thumbnail_suggestions' | 'description_suggestions';
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiGenerationHistory).values({
    userId: data.userId,
    generationType: data.generationType,
    model: data.model,
    promptTokens: data.promptTokens || 0,
    completionTokens: data.completionTokens || 0,
    totalTokens: data.totalTokens || 0,
    durationMs: data.durationMs,
    success: data.success ? 1 : 0,
    errorMessage: data.errorMessage || null,
  });
  
  return Number(result[0].insertId);
}

export async function getAiGenerationStats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get aggregated stats per model
  const stats = await db
    .select({
      model: aiGenerationHistory.model,
      generationType: aiGenerationHistory.generationType,
      totalGenerations: sql<number>`COUNT(*)`,
      successfulGenerations: sql<number>`SUM(CASE WHEN ${aiGenerationHistory.success} = 1 THEN 1 ELSE 0 END)`,
      failedGenerations: sql<number>`SUM(CASE WHEN ${aiGenerationHistory.success} = 0 THEN 1 ELSE 0 END)`,
      avgDurationMs: sql<number>`AVG(${aiGenerationHistory.durationMs})`,
      avgPromptTokens: sql<number>`AVG(${aiGenerationHistory.promptTokens})`,
      avgCompletionTokens: sql<number>`AVG(${aiGenerationHistory.completionTokens})`,
      avgTotalTokens: sql<number>`AVG(${aiGenerationHistory.totalTokens})`,
      avgUserRating: sql<number>`AVG(${aiGenerationHistory.userRating})`,
      ratedCount: sql<number>`SUM(CASE WHEN ${aiGenerationHistory.userRating} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(aiGenerationHistory)
    .where(eq(aiGenerationHistory.userId, userId))
    .groupBy(aiGenerationHistory.model, aiGenerationHistory.generationType);
  
  return stats;
}

/**
 * Update user rating for an AI generation
 */
export async function updateAiGenerationRating(generationId: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(aiGenerationHistory)
    .set({ userRating: rating })
    .where(eq(aiGenerationHistory.id, generationId));
}


/**
 * Save a prompt as favorite
 */
export async function saveFavoritePrompt(data: {
  userId: number;
  promptType: "strategy" | "title" | "thumbnail" | "description";
  promptContent: string;
  rating?: number;
  categories?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(favoritePrompts).values({
    userId: data.userId,
    promptType: data.promptType,
    promptContent: data.promptContent,
    rating: data.rating || 0,
    categories: data.categories || null,
    usageCount: 0,
  });
  
  return Number(result[0].insertId);
}

/**
 * Get all favorite prompts for a user
 */
export async function getFavoritePrompts(userId: number, promptType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Build conditions array
  const conditions = [eq(favoritePrompts.userId, userId)];
  if (promptType) {
    conditions.push(eq(favoritePrompts.promptType, promptType as any));
  }
  
  // Execute query with all conditions
  const results = await db
    .select()
    .from(favoritePrompts)
    .where(and(...conditions))
    .orderBy(desc(favoritePrompts.lastUsedAt));
  
  // Manual sort by rating in JavaScript
  return results.sort((a, b) => {
    const ratingA = (a as any).rating || 0;
    const ratingB = (b as any).rating || 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA; // Sort by rating desc
    }
    // If ratings are equal, sort by lastUsedAt
    const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Delete a favorite prompt
 */
export async function deleteFavoritePrompt(promptId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(favoritePrompts)
    .where(
      and(
        eq(favoritePrompts.id, promptId),
        eq(favoritePrompts.userId, userId)
      )
    );
}

/**
 * Update usage count and last used timestamp when a favorite prompt is used
 */
export async function useFavoritePrompt(promptId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(favoritePrompts)
    .set({
      usageCount: sql`${favoritePrompts.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(favoritePrompts.id, promptId));
}

/**
 * Rate a favorite prompt (1-5 stars)
 */
export async function rateFavoritePrompt(promptId: number, rating: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Use raw SQL to avoid TypeScript cache issues
  await db.execute(
    sql`UPDATE favoritePrompts SET rating = ${rating} WHERE id = ${promptId} AND userId = ${userId}`
  );
}

/**
 * Update categories for a favorite prompt
 */
export async function updatePromptCategories(promptId: number, categories: string[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const categoriesJson = JSON.stringify(categories);
  // Use raw SQL to avoid TypeScript cache issues
  await db.execute(
    sql`UPDATE favoritePrompts SET categories = ${categoriesJson} WHERE id = ${promptId} AND userId = ${userId}`
  );
}


/**
 * Get the best model for each generation category based on user ratings
 */
export async function getBestModelByCategory(userId: number): Promise<{
  bestOverall: string | null;
  bestTitle: string | null;
  bestThumbnail: string | null;
  bestDescription: string | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      bestOverall: 'gpt-4o',
      bestTitle: 'gpt-4o',
      bestThumbnail: 'gpt-4o',
      bestDescription: 'gpt-4o',
    };
  }
  
  // Get aggregated stats per model and generation type
  const stats = await db
    .select({
      model: aiGenerationHistory.model,
      generationType: aiGenerationHistory.generationType,
      avgRating: sql<number>`AVG(${aiGenerationHistory.userRating})`,
      ratedCount: sql<number>`SUM(CASE WHEN ${aiGenerationHistory.userRating} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(aiGenerationHistory)
    .where(eq(aiGenerationHistory.userId, userId))
    .groupBy(aiGenerationHistory.model, aiGenerationHistory.generationType);
  
  // Calculate best model for each category
  const modelRatings: Record<string, {
    overall: { sum: number; count: number };
    title: { sum: number; count: number };
    thumbnail: { sum: number; count: number };
    description: { sum: number; count: number };
  }> = {};
  
  for (const stat of stats) {
    const model = stat.model;
    if (!modelRatings[model]) {
      modelRatings[model] = {
        overall: { sum: 0, count: 0 },
        title: { sum: 0, count: 0 },
        thumbnail: { sum: 0, count: 0 },
        description: { sum: 0, count: 0 },
      };
    }
    
    const rating = Number(stat.avgRating || 0);
    const count = Number(stat.ratedCount || 0);
    
    if (count > 0) {
      modelRatings[model].overall.sum += rating * count;
      modelRatings[model].overall.count += count;
      
      const genType = (stat.generationType || '').toLowerCase();
      
      if (genType.includes('title') || genType.includes('titre')) {
        modelRatings[model].title.sum += rating * count;
        modelRatings[model].title.count += count;
      }
      
      if (genType.includes('thumbnail') || genType.includes('miniature')) {
        modelRatings[model].thumbnail.sum += rating * count;
        modelRatings[model].thumbnail.count += count;
      }
      
      if (genType.includes('description') || genType.includes('tag')) {
        modelRatings[model].description.sum += rating * count;
        modelRatings[model].description.count += count;
      }
    }
  }
  
  // Find best model for each category
  let bestOverall: string | null = null;
  let bestOverallRating = 0;
  let bestTitle: string | null = null;
  let bestTitleRating = 0;
  let bestThumbnail: string | null = null;
  let bestThumbnailRating = 0;
  let bestDescription: string | null = null;
  let bestDescriptionRating = 0;
  
  for (const [model, ratings] of Object.entries(modelRatings)) {
    // Overall
    if (ratings.overall.count > 0) {
      const avg = ratings.overall.sum / ratings.overall.count;
      if (avg > bestOverallRating) {
        bestOverallRating = avg;
        bestOverall = model;
      }
    }
    
    // Title
    if (ratings.title.count > 0) {
      const avg = ratings.title.sum / ratings.title.count;
      if (avg > bestTitleRating) {
        bestTitleRating = avg;
        bestTitle = model;
      }
    }
    
    // Thumbnail
    if (ratings.thumbnail.count > 0) {
      const avg = ratings.thumbnail.sum / ratings.thumbnail.count;
      if (avg > bestThumbnailRating) {
        bestThumbnailRating = avg;
        bestThumbnail = model;
      }
    }
    
    // Description
    if (ratings.description.count > 0) {
      const avg = ratings.description.sum / ratings.description.count;
      if (avg > bestDescriptionRating) {
        bestDescriptionRating = avg;
        bestDescription = model;
      }
    }
  }
  
  // Default to gpt-4o if no ratings
  return {
    bestOverall: bestOverall || 'gpt-4o',
    bestTitle: bestTitle || 'gpt-4o',
    bestThumbnail: bestThumbnail || 'gpt-4o',
    bestDescription: bestDescription || 'gpt-4o',
  };
}


/**
 * Reset ratings for favorite prompts by type
 */
export async function resetFavoritePromptRatings(
  userId: number,
  promptType: 'strategy' | 'title' | 'thumbnail' | 'description' | 'all'
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let result;
  if (promptType === 'all') {
    result = await db
      .update(favoritePrompts)
      .set({ rating: null })
      .where(eq(favoritePrompts.userId, userId));
  } else {
    result = await db
      .update(favoritePrompts)
      .set({ rating: null })
      .where(
        and(
          eq(favoritePrompts.userId, userId),
          eq(favoritePrompts.promptType, promptType)
        )
      );
  }
  
  return result[0]?.affectedRows || 0;
}


/**
 * Reset ratings for AI generations by type
 */
export async function resetGenerationRatings(
  userId: number,
  generationType: 'title' | 'thumbnail' | 'description' | 'strategy' | 'all'
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let result;
  if (generationType === 'all') {
    result = await db
      .update(aiGenerationHistory)
      .set({ userRating: null })
      .where(eq(aiGenerationHistory.userId, userId));
  } else {
    // Map category to generation type patterns
    const typePatterns: Record<string, string[]> = {
      title: ['title_and_thumbnail', 'title'],
      thumbnail: ['title_and_thumbnail', 'thumbnail'],
      description: ['description_suggestions', 'description'],
      strategy: ['strategy'],
    };
    
    const patterns = typePatterns[generationType] || [];
    
    // Reset ratings for matching generation types
    result = await db
      .update(aiGenerationHistory)
      .set({ userRating: null })
      .where(
        and(
          eq(aiGenerationHistory.userId, userId),
          or(
            ...patterns.map(p => like(aiGenerationHistory.generationType, `%${p}%`))
          )
        )
      );
  }
  
  return result[0]?.affectedRows || 0;
}


/**
 * Upsert channel sync info
 */
export async function upsertChannelSyncInfo(data: {
  userId: number;
  channelId: string;
  channelTitle: string;
  videoCount: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .insert(channelSyncInfo)
    .values({
      userId: data.userId,
      channelId: data.channelId,
      channelTitle: data.channelTitle,
      videoCount: data.videoCount,
      lastSyncAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        channelId: data.channelId,
        channelTitle: data.channelTitle,
        videoCount: data.videoCount,
        lastSyncAt: new Date(),
      },
    });
}

/**
 * Get channel sync info for a user
 */
export async function getChannelSyncInfo(userId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db
    .select()
    .from(channelSyncInfo)
    .where(eq(channelSyncInfo.userId, userId))
    .limit(1);

  return result[0] || null;
}


// ==================== Saved Ideas ====================

export async function getSavedIdeas(
  userId: number,
  status?: 'saved' | 'in_progress' | 'completed' | 'archived',
  ideaType?: 'video_idea' | 'title' | 'thumbnail' | 'tags' | 'description'
) {
  const db = await getDb();
  if (!db) return [];

  let query = `SELECT * FROM savedIdeas WHERE userId = ?`;
  const params: (number | string)[] = [userId];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  if (ideaType) {
    query += ` AND ideaType = ?`;
    params.push(ideaType);
  }

  query += ` ORDER BY createdAt DESC`;

  const rows = await db.execute(sql.raw(query));
  return rows as any[];
}

export async function saveIdea(
  userId: number,
  idea: {
    ideaType: 'video_idea' | 'title' | 'thumbnail' | 'tags' | 'description';
    title: string;
    summary?: string;
    source: 'brainstorm_preprod' | 'brainstorm_postprod' | 'competition_analysis';
    model?: string;
  }
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(
    sql`INSERT INTO savedIdeas (userId, ideaType, title, summary, source, model) VALUES (${userId}, ${idea.ideaType}, ${idea.title}, ${idea.summary || null}, ${idea.source}, ${idea.model || null})`
  );

  return { id: (result[0] as any).insertId };
}

export async function updateIdeaStatus(
  id: number,
  userId: number,
  status: 'saved' | 'in_progress' | 'completed' | 'archived'
) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.execute(
    sql`UPDATE savedIdeas SET status = ${status} WHERE id = ${id} AND userId = ${userId}`
  );

  return { success: true };
}

export async function updateIdeaNotes(id: number, userId: number, notes: string) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.execute(
    sql`UPDATE savedIdeas SET notes = ${notes} WHERE id = ${id} AND userId = ${userId}`
  );

  return { success: true };
}

export async function deleteIdea(id: number, userId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.execute(
    sql`DELETE FROM savedIdeas WHERE id = ${id} AND userId = ${userId}`
  );

  return { success: true };
}

// ==================== Competition Analysis ====================

export async function saveCompetitorVideo(
  userId: number,
  video: {
    keyword: string;
    videoId: string;
    videoTitle: string;
    channelTitle?: string;
    viewCount?: number;
    publishedAt?: string;
    thumbnailUrl?: string;
    duration?: string;
    description?: string;
  }
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(
    sql`INSERT INTO competitionAnalysis (userId, keyword, videoId, videoTitle, channelTitle, viewCount, publishedAt, thumbnailUrl, duration, description) 
     VALUES (${userId}, ${video.keyword}, ${video.videoId}, ${video.videoTitle}, ${video.channelTitle || null}, ${video.viewCount || 0}, ${video.publishedAt || null}, ${video.thumbnailUrl || null}, ${video.duration || null}, ${video.description || null})`
  );

  return { id: (result[0] as any).insertId };
}

export async function getSavedCompetitorVideos(userId: number, keyword?: string) {
  const db = await getDb();
  if (!db) return [];

  let query = `SELECT * FROM competitionAnalysis WHERE userId = ?`;
  const params: (number | string)[] = [userId];

  if (keyword) {
    query += ` AND keyword = ?`;
    params.push(keyword);
  }

  query += ` ORDER BY viewCount DESC`;

  const rows = await db.execute(sql.raw(query));
  return rows as any[];
}
