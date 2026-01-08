/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * Custom types for TubeTest Tracker
 */

export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  tags: string[];
  transcript?: string;
  watchTimeMinutes?: number;
  averageViewDuration?: number;
  retentionCurve?: string; // JSON string: array of {time: number, retention: number}
}

export interface VideoWithStats {
  id: number;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  channelId: string | null;
  channelTitle: string | null;
  publishedAt: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeTestsCount?: number;
  latestStats?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    watchTimeMinutes: number;
  };
}

export interface ABTestWithVariants {
  id: number;
  videoId: number;
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed";
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  variants: TestVariantWithMetrics[];
}

export interface TestVariantWithMetrics {
  id: number;
  testId: number;
  variantType: "title" | "thumbnail" | "both";
  title: string | null;
  thumbnailUrl: string | null;
  isControl: boolean;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoStatsHistory {
  date: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  watchTimeMinutes: number;
  averageViewDuration: number;
  subscribersGained: number;
}

export interface SyncResult {
  success: boolean;
  videosAdded: number;
  videosUpdated: number;
  errors: string[];
  channelTitle?: string;
}
