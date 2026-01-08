import { getAccessToken } from "./youtubeAuth";

interface AnalyticsMetrics {
  watchTime: number; // en secondes
  averageViewDuration: number; // en secondes
  averageViewPercentage: number; // pourcentage
}

interface TrafficSource {
  source: string;
  views: number;
  watchTime: number;
  percentage: number;
}

interface DemographicData {
  ageGroup: string;
  gender: string;
  viewsPercentage: number;
}

interface GeographicData {
  country: string;
  views: number;
  watchTime: number;
  percentage: number;
}

/**
 * Récupère les métriques de watch time pour une vidéo
 */
export async function fetchVideoWatchTimeMetrics(
  userId: number,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsMetrics | null> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Analytics] No access token available");
      return null;
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      filters: `video==${videoId}`,
    });

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Analytics] Error fetching watch time: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return null;
    }

    const row = data.rows[0];
    return {
      watchTime: row[1] * 60, // Convertir minutes en secondes
      averageViewDuration: row[2],
      averageViewPercentage: row[3],
    };
  } catch (error) {
    console.error("[Analytics] Error fetching watch time metrics:", error);
    return null;
  }
}

/**
 * Récupère les sources de trafic pour une vidéo
 */
export async function fetchVideoTrafficSources(
  userId: number,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<TrafficSource[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceType",
      filters: `video==${videoId}`,
      sort: "-views",
    });

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Analytics] Error fetching traffic sources: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    const totalViews = data.rows.reduce((sum: number, row: any[]) => sum + row[1], 0);

    return data.rows.map((row: any[]) => ({
      source: mapTrafficSourceName(row[0]),
      views: row[1],
      watchTime: row[2] * 60, // Convertir minutes en secondes
      percentage: (row[1] / totalViews) * 100,
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching traffic sources:", error);
    return [];
  }
}

/**
 * Récupère les données démographiques pour une vidéo
 */
export async function fetchVideoDemographics(
  userId: number,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<DemographicData[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "viewsPercentage",
      dimensions: "ageGroup,gender",
      filters: `video==${videoId}`,
      sort: "-viewsPercentage",
    });

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Analytics] Error fetching demographics: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    return data.rows.map((row: any[]) => ({
      ageGroup: row[0],
      gender: row[1],
      viewsPercentage: row[2],
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching demographics:", error);
    return [];
  }
}

/**
 * Récupère les données géographiques pour une vidéo
 */
export async function fetchVideoGeography(
  userId: number,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<GeographicData[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "country",
      filters: `video==${videoId}`,
      sort: "-views",
      maxResults: "20",
    });

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Analytics] Error fetching geography: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    const totalViews = data.rows.reduce((sum: number, row: any[]) => sum + row[1], 0);

    return data.rows.map((row: any[]) => ({
      country: row[0],
      views: row[1],
      watchTime: row[2] * 60, // Convertir minutes en secondes
      percentage: (row[1] / totalViews) * 100,
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching geography:", error);
    return [];
  }
}

/**
 * Récupère les données de rétention détaillées pour une vidéo
 */
export async function fetchVideoRetentionData(
  userId: number,
  videoId: string
): Promise<{ elapsedVideoTimeRatio: number; audienceWatchRatio: number }[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      metrics: "audienceWatchRatio,relativeRetentionPerformance",
      dimensions: "elapsedVideoTimeRatio",
      filters: `video==${videoId}`,
    });

    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Analytics] Error fetching retention data: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    return data.rows.map((row: any[]) => ({
      elapsedVideoTimeRatio: row[0],
      audienceWatchRatio: row[1],
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching retention data:", error);
    return [];
  }
}

/**
 * Mappe les noms techniques des sources de trafic vers des noms lisibles
 */
function mapTrafficSourceName(technicalName: string): string {
  const mapping: Record<string, string> = {
    "ADVERTISING": "Publicités",
    "ANNOTATION": "Annotations",
    "CAMPAIGN_CARD": "Cartes de campagne",
    "END_SCREEN": "Écrans de fin",
    "EXT_URL": "Sites externes",
    "HASHTAGS": "Hashtags",
    "NOTIFICATION": "Notifications",
    "PLAYLIST": "Playlists",
    "PRODUCT_PAGE": "Pages de produits",
    "PROMOTED": "Contenu promu",
    "RELATED_VIDEO": "Vidéos suggérées",
    "SHORTS": "YouTube Shorts",
    "SUBSCRIBER": "Abonnés",
    "YT_CHANNEL": "Pages de chaînes",
    "YT_OTHER_PAGE": "Autres pages YouTube",
    "YT_SEARCH": "Recherche YouTube",
    "NO_LINK_EMBEDDED": "Lecteur intégré",
    "NO_LINK_OTHER": "Trafic direct ou inconnu",
  };

  return mapping[technicalName] || technicalName;
}

/**
 * Récupère toutes les données analytics pour une vidéo
 */
export async function fetchAllVideoAnalytics(
  userId: number,
  videoId: string,
  startDate: string,
  endDate: string
) {
  const [watchTime, trafficSources, demographics, geography, retention] = await Promise.all([
    fetchVideoWatchTimeMetrics(userId, videoId, startDate, endDate),
    fetchVideoTrafficSources(userId, videoId, startDate, endDate),
    fetchVideoDemographics(userId, videoId, startDate, endDate),
    fetchVideoGeography(userId, videoId, startDate, endDate),
    fetchVideoRetentionData(userId, videoId),
  ]);

  return {
    watchTime,
    trafficSources,
    demographics,
    geography,
    retention,
  };
}
