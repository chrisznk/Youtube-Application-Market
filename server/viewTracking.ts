/**
 * View Tracking Module
 * Handles hourly collection of video views
 * Compares current period vs previous period (e.g., last 2h vs 2h before that)
 */

import { eq, and, desc, gte, lte, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyViewStats, videos, DailyViewStat, InsertDailyViewStat } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

/**
 * Record a snapshot of current stats for all videos of a user
 * Called every hour by the cron job
 */
export async function recordStatsSnapshot(userId: number): Promise<{ recorded: number; errors: number }> {
  const db = await getDb();
  if (!db) return { recorded: 0, errors: 0 };

  const now = new Date();

  // Get all videos for this user
  const userVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId));

  let recorded = 0;
  let errors = 0;

  for (const video of userVideos) {
    try {
      // Insert current stats snapshot
      await db.insert(dailyViewStats).values({
        userId,
        videoId: video.id,
        youtubeId: video.youtubeId,
        date: now,
        viewCount: video.viewCount || 0,
        likeCount: video.likeCount || 0,
        commentCount: video.commentCount || 0,
        viewDelta: 0,
        likeDelta: 0,
        commentDelta: 0,
        viewGrowthRate: 0,
        likeGrowthRate: 0,
        commentGrowthRate: 0,
      });

      recorded++;
    } catch (error) {
      console.error(`[ViewTracking] Error recording stats for video ${video.id}:`, error);
      errors++;
    }
  }

  console.log(`[ViewTracking] Recorded ${recorded} stats snapshots, ${errors} errors for user ${userId}`);
  return { recorded, errors };
}

/**
 * Time periods for comparison
 */
export type TimePeriod = 'latest' | '1h' | '2h' | '24h' | '48h' | '1week' | '2weeks' | '1month';

export function getPeriodHours(period: TimePeriod): number {
  switch (period) {
    case 'latest': return 0;
    case '1h': return 1;
    case '2h': return 2;
    case '24h': return 24;
    case '48h': return 48;
    case '1week': return 24 * 7;
    case '2weeks': return 24 * 14;
    case '1month': return 24 * 30;
    default: return 24;
  }
}

/**
 * Video stats with comparison between current period and previous period
 */
export interface VideoTrendStats {
  videoId: number;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  currentViews: number;
  currentLikes: number;
  currentComments: number;
  // Views gained during the current period
  currentPeriodViews: number;
  currentPeriodLikes: number;
  currentPeriodComments: number;
  // Views gained during the previous period
  previousPeriodViews: number;
  previousPeriodLikes: number;
  previousPeriodComments: number;
  // Delta = current period - previous period (can be negative)
  viewDelta: number;
  likeDelta: number;
  commentDelta: number;
  // Growth rate = (current - previous) / previous * 100 (can be negative)
  viewGrowthRate: number;
  likeGrowthRate: number;
  commentGrowthRate: number;
  // Timestamps for reference
  currentPeriodStart: Date | null;
  previousPeriodStart: Date | null;
}

/**
 * Get the closest snapshot to a target date
 */
async function getClosestSnapshot(
  db: ReturnType<typeof drizzle>,
  videoId: number,
  userId: number,
  targetDate: Date,
  direction: 'before' | 'after' = 'before'
): Promise<DailyViewStat | undefined> {
  if (direction === 'before') {
    const stats = await db
      .select()
      .from(dailyViewStats)
      .where(
        and(
          eq(dailyViewStats.videoId, videoId),
          eq(dailyViewStats.userId, userId),
          lte(dailyViewStats.date, targetDate)
        )
      )
      .orderBy(desc(dailyViewStats.date))
      .limit(1);
    return stats[0];
  } else {
    const stats = await db
      .select()
      .from(dailyViewStats)
      .where(
        and(
          eq(dailyViewStats.videoId, videoId),
          eq(dailyViewStats.userId, userId),
          gte(dailyViewStats.date, targetDate)
        )
      )
      .orderBy(asc(dailyViewStats.date))
      .limit(1);
    return stats[0];
  }
}

/**
 * Get video stats comparing current period vs previous period
 * 
 * Example: If period = '2h' and current time is 12:00
 * - Current period: 10:00 - 12:00 (views gained in last 2h)
 * - Previous period: 08:00 - 10:00 (views gained in 2h before that)
 * - Delta: current period views - previous period views
 */
export async function getVideoTrendStats(
  userId: number,
  period: TimePeriod = '24h'
): Promise<VideoTrendStats[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const hours = getPeriodHours(period);

  // Get all videos for this user
  const userVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId));

  const results: VideoTrendStats[] = [];

  for (const video of userVideos) {
    const currentViews = video.viewCount || 0;
    const currentLikes = video.likeCount || 0;
    const currentComments = video.commentCount || 0;

    if (period === 'latest' || hours === 0) {
      // For "latest", just show current stats with the most recent snapshot
      const latestSnapshot = await getClosestSnapshot(db, video.id, userId, now, 'before');
      
      results.push({
        videoId: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        currentViews,
        currentLikes,
        currentComments,
        currentPeriodViews: latestSnapshot ? currentViews - (latestSnapshot.viewCount || 0) : 0,
        currentPeriodLikes: latestSnapshot ? currentLikes - (latestSnapshot.likeCount || 0) : 0,
        currentPeriodComments: latestSnapshot ? currentComments - (latestSnapshot.commentCount || 0) : 0,
        previousPeriodViews: 0,
        previousPeriodLikes: 0,
        previousPeriodComments: 0,
        viewDelta: latestSnapshot ? currentViews - (latestSnapshot.viewCount || 0) : 0,
        likeDelta: latestSnapshot ? currentLikes - (latestSnapshot.likeCount || 0) : 0,
        commentDelta: latestSnapshot ? currentComments - (latestSnapshot.commentCount || 0) : 0,
        viewGrowthRate: 0,
        likeGrowthRate: 0,
        commentGrowthRate: 0,
        currentPeriodStart: latestSnapshot?.date || null,
        previousPeriodStart: null,
      });
      continue;
    }

    // Calculate time boundaries
    // Current period: (now - hours) to now
    // Previous period: (now - 2*hours) to (now - hours)
    const currentPeriodStart = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (2 * hours * 60 * 60 * 1000));

    // Get snapshots at each boundary
    // Snapshot at start of current period (end of previous period)
    const snapshotAtCurrentStart = await getClosestSnapshot(db, video.id, userId, currentPeriodStart, 'before');
    // Snapshot at start of previous period
    const snapshotAtPreviousStart = await getClosestSnapshot(db, video.id, userId, previousPeriodStart, 'before');

    // Calculate views gained in current period
    // Current period views = current views - views at start of current period
    const viewsAtCurrentStart = snapshotAtCurrentStart?.viewCount || 0;
    const likesAtCurrentStart = snapshotAtCurrentStart?.likeCount || 0;
    const commentsAtCurrentStart = snapshotAtCurrentStart?.commentCount || 0;

    const currentPeriodViews = currentViews - viewsAtCurrentStart;
    const currentPeriodLikes = currentLikes - likesAtCurrentStart;
    const currentPeriodComments = currentComments - commentsAtCurrentStart;

    // Calculate views gained in previous period
    // Previous period views = views at end of previous period - views at start of previous period
    const viewsAtPreviousStart = snapshotAtPreviousStart?.viewCount || 0;
    const likesAtPreviousStart = snapshotAtPreviousStart?.likeCount || 0;
    const commentsAtPreviousStart = snapshotAtPreviousStart?.commentCount || 0;

    const previousPeriodViews = viewsAtCurrentStart - viewsAtPreviousStart;
    const previousPeriodLikes = likesAtCurrentStart - likesAtPreviousStart;
    const previousPeriodComments = commentsAtCurrentStart - commentsAtPreviousStart;

    // Calculate delta: current period - previous period (can be negative!)
    const viewDelta = currentPeriodViews - previousPeriodViews;
    const likeDelta = currentPeriodLikes - previousPeriodLikes;
    const commentDelta = currentPeriodComments - previousPeriodComments;

    // Calculate growth rate: (current - previous) / previous * 100
    const viewGrowthRate = previousPeriodViews > 0 
      ? Math.round((viewDelta / previousPeriodViews) * 10000) 
      : (currentPeriodViews > 0 ? 10000 : 0); // 100% if previous was 0 but current > 0
    const likeGrowthRate = previousPeriodLikes > 0 
      ? Math.round((likeDelta / previousPeriodLikes) * 10000) 
      : (currentPeriodLikes > 0 ? 10000 : 0);
    const commentGrowthRate = previousPeriodComments > 0 
      ? Math.round((commentDelta / previousPeriodComments) * 10000) 
      : (currentPeriodComments > 0 ? 10000 : 0);

    results.push({
      videoId: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      currentViews,
      currentLikes,
      currentComments,
      currentPeriodViews,
      currentPeriodLikes,
      currentPeriodComments,
      previousPeriodViews,
      previousPeriodLikes,
      previousPeriodComments,
      viewDelta,
      likeDelta,
      commentDelta,
      viewGrowthRate,
      likeGrowthRate,
      commentGrowthRate,
      currentPeriodStart,
      previousPeriodStart,
    });
  }

  return results;
}

/**
 * Get top 5 videos by different metrics
 */
export interface TopVideosResult {
  topViewers: VideoTrendStats[]; // Highest views gained in current period
  topGrowing: VideoTrendStats[]; // Highest positive growth rate (current > previous)
  topDeclining: VideoTrendStats[]; // Highest negative growth rate (current < previous)
  lowestViewers: VideoTrendStats[]; // Lowest views gained in current period
}

export async function getTopVideos(
  userId: number,
  period: TimePeriod = '24h',
  limit: number = 5
): Promise<TopVideosResult> {
  const allStats = await getVideoTrendStats(userId, period);

  // Sort by views gained in current period (highest first)
  const topViewers = [...allStats]
    .sort((a, b) => b.currentPeriodViews - a.currentPeriodViews)
    .slice(0, limit);

  // Sort by growth rate (highest positive first)
  // Only include videos with positive delta (doing better than previous period)
  const topGrowing = [...allStats]
    .filter(v => v.viewDelta > 0)
    .sort((a, b) => b.viewGrowthRate - a.viewGrowthRate)
    .slice(0, limit);

  // Sort by growth rate (lowest/most negative first)
  // Only include videos with negative delta (doing worse than previous period)
  const topDeclining = [...allStats]
    .filter(v => v.viewDelta < 0)
    .sort((a, b) => a.viewGrowthRate - b.viewGrowthRate)
    .slice(0, limit);

  // Sort by views gained in current period (lowest first)
  const lowestViewers = [...allStats]
    .sort((a, b) => a.currentPeriodViews - b.currentPeriodViews)
    .slice(0, limit);

  return {
    topViewers,
    topGrowing,
    topDeclining,
    lowestViewers,
  };
}

/**
 * Get the timestamp of the last recorded snapshot for a user
 */
export async function getLastSnapshotTime(userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  const lastStats = await db
    .select({ date: dailyViewStats.date })
    .from(dailyViewStats)
    .where(eq(dailyViewStats.userId, userId))
    .orderBy(desc(dailyViewStats.date))
    .limit(1);

  return lastStats[0]?.date || null;
}

/**
 * Check if stats have been recorded today for a user
 */
export async function hasRecordedToday(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyViewStats)
    .where(
      and(
        eq(dailyViewStats.userId, userId),
        gte(dailyViewStats.date, today),
        lte(dailyViewStats.date, tomorrow)
      )
    );

  return (stats[0]?.count || 0) > 0;
}

/**
 * Get all daily stats for a user (for detailed view)
 */
export async function getAllDailyStats(
  userId: number,
  period: TimePeriod = '24h'
): Promise<DailyViewStat[]> {
  const db = await getDb();
  if (!db) return [];

  const hours = getPeriodHours(period);
  const startDate = new Date();
  if (hours > 0) {
    startDate.setTime(startDate.getTime() - (hours * 60 * 60 * 1000));
  }

  return await db
    .select()
    .from(dailyViewStats)
    .where(
      and(
        eq(dailyViewStats.userId, userId),
        gte(dailyViewStats.date, startDate)
      )
    )
    .orderBy(desc(dailyViewStats.date));
}

// Keep the old function name for backward compatibility
export const recordDailyStats = recordStatsSnapshot;


/**
 * Get view history for a specific video over time
 * Returns data points for charting
 */
export interface ViewHistoryPoint {
  timestamp: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export async function getVideoViewHistory(
  videoId: number,
  userId: number,
  hours: number = 168 // Default 1 week
): Promise<ViewHistoryPoint[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setTime(startDate.getTime() - (hours * 60 * 60 * 1000));

  const stats = await db
    .select({
      timestamp: dailyViewStats.date,
      viewCount: dailyViewStats.viewCount,
      likeCount: dailyViewStats.likeCount,
      commentCount: dailyViewStats.commentCount,
    })
    .from(dailyViewStats)
    .where(
      and(
        eq(dailyViewStats.videoId, videoId),
        eq(dailyViewStats.userId, userId),
        gte(dailyViewStats.date, startDate)
      )
    )
    .orderBy(asc(dailyViewStats.date));

  return stats.map(s => ({
    timestamp: s.timestamp,
    viewCount: s.viewCount || 0,
    likeCount: s.likeCount || 0,
    commentCount: s.commentCount || 0,
  }));
}

/**
 * Get aggregated view history for all videos of a user
 * Returns total views over time for charting
 */
export interface AggregatedViewHistoryPoint {
  timestamp: Date;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  videoCount: number;
}

export async function getAggregatedViewHistory(
  userId: number,
  hours: number = 168 // Default 1 week
): Promise<AggregatedViewHistoryPoint[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setTime(startDate.getTime() - (hours * 60 * 60 * 1000));

  // Get all stats grouped by timestamp (approximately)
  const stats = await db
    .select({
      timestamp: dailyViewStats.date,
      viewCount: dailyViewStats.viewCount,
      likeCount: dailyViewStats.likeCount,
      commentCount: dailyViewStats.commentCount,
    })
    .from(dailyViewStats)
    .where(
      and(
        eq(dailyViewStats.userId, userId),
        gte(dailyViewStats.date, startDate)
      )
    )
    .orderBy(asc(dailyViewStats.date));

  // Group by hour
  const hourlyData = new Map<string, AggregatedViewHistoryPoint>();
  
  for (const stat of stats) {
    const hourKey = new Date(stat.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    if (!hourlyData.has(hourKey)) {
      hourlyData.set(hourKey, {
        timestamp: new Date(hourKey + ':00:00.000Z'),
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        videoCount: 0,
      });
    }
    
    const point = hourlyData.get(hourKey)!;
    point.totalViews += stat.viewCount || 0;
    point.totalLikes += stat.likeCount || 0;
    point.totalComments += stat.commentCount || 0;
    point.videoCount += 1;
  }

  return Array.from(hourlyData.values()).sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
}

/**
 * Compare two custom periods
 */
export interface PeriodComparisonResult {
  videoId: number;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  period1Views: number;
  period1Likes: number;
  period1Comments: number;
  period2Views: number;
  period2Likes: number;
  period2Comments: number;
  viewDelta: number;
  likeDelta: number;
  commentDelta: number;
  viewGrowthRate: number;
  likeGrowthRate: number;
  commentGrowthRate: number;
}

export async function compareCustomPeriods(
  userId: number,
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date
): Promise<PeriodComparisonResult[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all videos for this user
  const userVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId));

  const results: PeriodComparisonResult[] = [];

  for (const video of userVideos) {
    // Get stats at period 1 boundaries
    const period1StartStats = await getClosestSnapshot(db, video.id, userId, period1Start, 'after');
    const period1EndStats = await getClosestSnapshot(db, video.id, userId, period1End, 'before');
    
    // Get stats at period 2 boundaries
    const period2StartStats = await getClosestSnapshot(db, video.id, userId, period2Start, 'after');
    const period2EndStats = await getClosestSnapshot(db, video.id, userId, period2End, 'before');

    // Calculate views gained in each period
    const period1Views = (period1EndStats?.viewCount || 0) - (period1StartStats?.viewCount || 0);
    const period1Likes = (period1EndStats?.likeCount || 0) - (period1StartStats?.likeCount || 0);
    const period1Comments = (period1EndStats?.commentCount || 0) - (period1StartStats?.commentCount || 0);

    const period2Views = (period2EndStats?.viewCount || 0) - (period2StartStats?.viewCount || 0);
    const period2Likes = (period2EndStats?.likeCount || 0) - (period2StartStats?.likeCount || 0);
    const period2Comments = (period2EndStats?.commentCount || 0) - (period2StartStats?.commentCount || 0);

    // Calculate deltas (period2 - period1, so positive means period2 is better)
    const viewDelta = period2Views - period1Views;
    const likeDelta = period2Likes - period1Likes;
    const commentDelta = period2Comments - period1Comments;

    // Calculate growth rates
    const viewGrowthRate = period1Views > 0 
      ? Math.round((viewDelta / period1Views) * 10000) 
      : (period2Views > 0 ? 10000 : 0);
    const likeGrowthRate = period1Likes > 0 
      ? Math.round((likeDelta / period1Likes) * 10000) 
      : (period2Likes > 0 ? 10000 : 0);
    const commentGrowthRate = period1Comments > 0 
      ? Math.round((commentDelta / period1Comments) * 10000) 
      : (period2Comments > 0 ? 10000 : 0);

    results.push({
      videoId: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      period1Views,
      period1Likes,
      period1Comments,
      period2Views,
      period2Likes,
      period2Comments,
      viewDelta,
      likeDelta,
      commentDelta,
      viewGrowthRate,
      likeGrowthRate,
      commentGrowthRate,
    });
  }

  return results;
}

/**
 * Check alerts for threshold violations
 */
export interface AlertConfig {
  id: number;
  userId: number;
  videoId: number | null; // null = all videos
  alertType: 'growth' | 'decline' | 'views';
  threshold: number; // For growth/decline: percentage * 100, for views: absolute number
  enabled: boolean;
}

export interface AlertResult {
  videoId: number;
  videoTitle: string;
  alertType: 'growth' | 'decline' | 'views';
  threshold: number;
  actualValue: number;
  triggered: boolean;
}

export async function checkAlerts(
  userId: number,
  alerts: AlertConfig[],
  period: TimePeriod = '1h'
): Promise<AlertResult[]> {
  const stats = await getVideoTrendStats(userId, period);
  const results: AlertResult[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;

    const videosToCheck = alert.videoId 
      ? stats.filter(s => s.videoId === alert.videoId)
      : stats;

    for (const video of videosToCheck) {
      let actualValue: number;
      let triggered: boolean;

      switch (alert.alertType) {
        case 'growth':
          actualValue = video.viewGrowthRate;
          triggered = actualValue >= alert.threshold;
          break;
        case 'decline':
          actualValue = video.viewGrowthRate;
          triggered = actualValue <= -alert.threshold;
          break;
        case 'views':
          actualValue = video.currentPeriodViews;
          triggered = actualValue >= alert.threshold;
          break;
        default:
          continue;
      }

      if (triggered) {
        results.push({
          videoId: video.videoId,
          videoTitle: video.title,
          alertType: alert.alertType,
          threshold: alert.threshold,
          actualValue,
          triggered: true,
        });
      }
    }
  }

  return results;
}
