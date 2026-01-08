import { getAccessToken } from "./youtubeAuth";

export interface ChannelAnalytics {
  views: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedRevenue: number;
  averageViewDuration: number;
  likes: number;
  comments: number;
}

export interface ChannelDemographics {
  ageGroup: string;
  gender: string;
  viewsPercentage: number;
}

export interface ChannelGeography {
  country: string;
  views: number;
  watchTimeMinutes: number;
  percentage: number;
}

export interface ChannelTrafficSource {
  source: string;
  views: number;
  watchTimeMinutes: number;
  percentage: number;
}

/**
 * Récupère les statistiques globales de la chaîne pour une période donnée
 */
export async function fetchChannelAnalytics(
  userId: number,
  startDate: string,
  endDate: string
): Promise<ChannelAnalytics | null> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Channel Analytics] No access token available");
      return null;
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost,estimatedRevenue,averageViewDuration,likes,comments",
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
      console.error(`[Channel Analytics] Error fetching analytics: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return null;
    }

    const row = data.rows[0];
    return {
      views: row[0] || 0,
      watchTimeMinutes: row[1] || 0,
      subscribersGained: row[2] || 0,
      subscribersLost: row[3] || 0,
      estimatedRevenue: row[4] || 0,
      averageViewDuration: row[5] || 0,
      likes: row[6] || 0,
      comments: row[7] || 0,
    };
  } catch (error) {
    console.error("[Channel Analytics] Error fetching channel analytics:", error);
    return null;
  }
}

/**
 * Récupère les données démographiques de la chaîne
 */
export async function fetchChannelDemographics(
  userId: number,
  startDate: string,
  endDate: string
): Promise<ChannelDemographics[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Channel Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "viewerPercentage",
      dimensions: "ageGroup,gender",
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
      console.error(`[Channel Analytics] Error fetching demographics: ${response.statusText}`);
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
    console.error("[Channel Analytics] Error fetching demographics:", error);
    return [];
  }
}

/**
 * Récupère les données géographiques de la chaîne
 */
export async function fetchChannelGeography(
  userId: number,
  startDate: string,
  endDate: string
): Promise<ChannelGeography[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Channel Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "country",
      sort: "-views",
      maxResults: "10",
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
      console.error(`[Channel Analytics] Error fetching geography: ${response.statusText}`);
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
      watchTimeMinutes: row[2],
      percentage: totalViews > 0 ? (row[1] / totalViews) * 100 : 0,
    }));
  } catch (error) {
    console.error("[Channel Analytics] Error fetching geography:", error);
    return [];
  }
}

/**
 * Récupère les sources de trafic de la chaîne
 */
export async function fetchChannelTrafficSources(
  userId: number,
  startDate: string,
  endDate: string
): Promise<ChannelTrafficSource[]> {
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) {
      console.error("[Channel Analytics] No access token available");
      return [];
    }

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceType",
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
      console.error(`[Channel Analytics] Error fetching traffic sources: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    const totalViews = data.rows.reduce((sum: number, row: any[]) => sum + row[1], 0);

    return data.rows.map((row: any[]) => ({
      source: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
      percentage: totalViews > 0 ? (row[1] / totalViews) * 100 : 0,
    }));
  } catch (error) {
    console.error("[Channel Analytics] Error fetching traffic sources:", error);
    return [];
  }
}
