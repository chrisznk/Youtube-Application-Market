import { getDb } from "../db";
import { videos } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
    };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

interface YouTubeAnalytics {
  averageViewDuration: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
}

/**
 * Récupère les vidéos YouTube de la semaine précédente
 */
export async function fetchRecentVideos(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&channelId=${channelId}&` +
    `publishedAfter=${oneWeekAgo.toISOString()}&` +
    `order=date&type=video&maxResults=50&key=${apiKey}`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube API search error: ${searchResponse.statusText}`);
  }

  const searchData = await searchResponse.json();
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

  if (!videoIds) {
    return [];
  }

  // Récupérer les détails complets des vidéos
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` +
    `part=snippet,statistics&id=${videoIds}&key=${apiKey}`;

  const videosResponse = await fetch(videosUrl);
  if (!videosResponse.ok) {
    throw new Error(`YouTube API videos error: ${videosResponse.statusText}`);
  }

  const videosData = await videosResponse.json();
  return videosData.items || [];
}

/**
 * Récupère les analytics d'une vidéo (watch time, rétention, etc.)
 */
export async function fetchVideoAnalytics(
  videoId: string,
  apiKey: string
): Promise<YouTubeAnalytics | null> {
  try {
    // Note: YouTube Analytics API nécessite OAuth2 et des permissions spécifiques
    // Pour l'instant, on retourne des valeurs par défaut
    // TODO: Implémenter l'authentification OAuth2 pour accéder aux analytics
    return {
      averageViewDuration: 0,
      estimatedMinutesWatched: 0,
      subscribersGained: 0,
    };
  } catch (error) {
    console.error(`Error fetching analytics for video ${videoId}:`, error);
    return null;
  }
}

/**
 * Synchronise une vidéo YouTube avec la base de données
 */
export async function syncVideo(
  video: YouTubeVideo,
  userId: number,
  apiKey: string
): Promise<{ imported: boolean; updated: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const youtubeId = video.id;
  
  // Vérifier si la vidéo existe déjà
  const existingVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.youtubeId, youtubeId))
    .limit(1);

  const exists = existingVideos.length > 0;
  const analytics = await fetchVideoAnalytics(youtubeId, apiKey);

  const videoData = {
    youtubeId,
    title: video.snippet.title,
    description: video.snippet.description || null,
    thumbnailUrl: video.snippet.thumbnails.high.url,
    publishedAt: new Date(video.snippet.publishedAt),
    views: parseInt(video.statistics.viewCount || "0"),
    likes: parseInt(video.statistics.likeCount || "0"),
    comments: parseInt(video.statistics.commentCount || "0"),
    duration: null, // TODO: Extraire la durée de la vidéo
    userId,
    lastSyncedAt: new Date(),
  };

  if (exists) {
    // Mettre à jour la vidéo existante
    await db
      .update(videos)
      .set(videoData)
      .where(eq(videos.youtubeId, youtubeId));
    
    return { imported: false, updated: true };
  } else {
    // Insérer une nouvelle vidéo
    await db.insert(videos).values(videoData);
    return { imported: true, updated: false };
  }
}

/**
 * Synchronise toutes les vidéos récentes d'un utilisateur
 */
export async function syncUserVideos(
  userId: number,
  channelId: string,
  apiKey: string
): Promise<{
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let updated = 0;

  try {
    const recentVideos = await fetchRecentVideos(channelId, apiKey);
    
    for (const video of recentVideos) {
      try {
        const result = await syncVideo(video, userId, apiKey);
        if (result.imported) imported++;
        if (result.updated) updated++;
      } catch (error) {
        const errorMsg = `Error syncing video ${video.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      updated,
      errors,
    };
  } catch (error) {
    const errorMsg = `Error fetching recent videos: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Synchronise tous les utilisateurs ayant configuré leur chaîne YouTube
 */
export async function syncAllUsers(): Promise<{
  success: boolean;
  totalImported: number;
  totalUpdated: number;
  userResults: Array<{
    userId: number;
    imported: number;
    updated: number;
    errors: string[];
  }>;
}> {
  const { getAllYouTubeConfigs } = await import("../db");
  const configs = await getAllYouTubeConfigs();
  
  let totalImported = 0;
  let totalUpdated = 0;
  const userResults: Array<{
    userId: number;
    imported: number;
    updated: number;
    errors: string[];
  }> = [];

  for (const config of configs) {
    const result = await syncUserVideos(
      config.userId,
      config.channelId,
      config.apiKey
    );
    
    totalImported += result.imported;
    totalUpdated += result.updated;
    
    userResults.push({
      userId: config.userId,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
    });
  }

  return {
    success: userResults.every(r => r.errors.length === 0),
    totalImported,
    totalUpdated,
    userResults,
  };
}


/**
 * Synchronise les données analytics avancées pour une vidéo
 */
export async function syncVideoAnalytics(
  userId: number,
  videoId: number,
  youtubeId: string
): Promise<boolean> {
  try {
    const { fetchAllVideoAnalytics } = await import("../youtubeAnalytics");
    const { getDb } = await import("../db");
    const { 
      videoAnalytics, 
      trafficSources, 
      demographics, 
      geography, 
      retentionData 
    } = await import("../../drizzle/schema");
    
    // Calculer les dates (30 derniers jours)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Récupérer toutes les données analytics
    const analytics = await fetchAllVideoAnalytics(
      userId,
      youtubeId,
      startDateStr,
      endDateStr
    );
    
    const db = await getDb();
    if (!db) {
      console.error("[Sync] Database not available");
      return false;
    }
    
    // Sauvegarder les métriques de watch time
    if (analytics.watchTime) {
      await db.insert(videoAnalytics).values({
        videoId,
        watchTime: analytics.watchTime.watchTime,
        averageViewDuration: analytics.watchTime.averageViewDuration,
        averageViewPercentage: analytics.watchTime.averageViewPercentage,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
      });
    }
    
    // Sauvegarder les sources de trafic
    if (analytics.trafficSources && analytics.trafficSources.length > 0) {
      for (const source of analytics.trafficSources) {
        await db.insert(trafficSources).values({
          videoId,
          source: source.source,
          views: source.views,
          watchTime: source.watchTime,
          percentage: Math.round(source.percentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr),
        });
      }
    }
    
    // Sauvegarder les données démographiques
    if (analytics.demographics && analytics.demographics.length > 0) {
      for (const demo of analytics.demographics) {
        await db.insert(demographics).values({
          videoId,
          ageGroup: demo.ageGroup,
          gender: demo.gender,
          viewsPercentage: Math.round(demo.viewsPercentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr),
        });
      }
    }
    
    // Sauvegarder les données géographiques
    if (analytics.geography && analytics.geography.length > 0) {
      for (const geo of analytics.geography) {
        await db.insert(geography).values({
          videoId,
          country: geo.country,
          views: geo.views,
          watchTime: geo.watchTime,
          percentage: Math.round(geo.percentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr),
        });
      }
    }
    
    // Sauvegarder les données de rétention
    if (analytics.retention && analytics.retention.length > 0) {
      for (const point of analytics.retention) {
        await db.insert(retentionData).values({
          videoId,
          elapsedVideoTimeRatio: Math.round(point.elapsedVideoTimeRatio * 100),
          audienceWatchRatio: Math.round(point.audienceWatchRatio * 100),
        });
      }
    }
    
    console.log(`[Sync] Analytics synced for video ${youtubeId}`);
    return true;
  } catch (error) {
    console.error(`[Sync] Error syncing analytics for video ${youtubeId}:`, error);
    return false;
  }
}

/**
 * Synchronise les analytics pour toutes les vidéos d'un utilisateur
 */
export async function syncAllUserAnalytics(userId: number): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  try {
    const { getDb } = await import("../db");
    const { videos } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        synced: 0,
        errors: ["Database not available"],
      };
    }
    
    // Récupérer toutes les vidéos de l'utilisateur
    const userVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId));
    
    let synced = 0;
    const errors: string[] = [];
    
    for (const video of userVideos) {
      try {
        const success = await syncVideoAnalytics(userId, video.id, video.youtubeId);
        if (success) synced++;
      } catch (error) {
        const errorMsg = `Error syncing analytics for video ${video.youtubeId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  } catch (error) {
    const errorMsg = `Error syncing user analytics: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return {
      success: false,
      synced: 0,
      errors: [errorMsg],
    };
  }
}
