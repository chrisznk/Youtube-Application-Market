import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // Pour l'authentification locale
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Instruction scripts for AI prompts (versioned)
 */
export const instructionScripts = mysqlTable("instructionScripts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scriptType: mysqlEnum("scriptType", [
    "channel_analysis",
    "title_guide",
    "description_guide",
    "script_analysis",
    "thumbnail_mechanics",
    "midjourney_prompts"
  ]).notNull(),
  version: int("version").notNull(),
  content: text("content").notNull(),
  trainedBy: varchar("trainedBy", { length: 64 }), // Model used for training (e.g., "gpt-4o", "o1")
  isActive: boolean("isActive").default(false).notNull(), // Whether this version is the active one
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstructionScript = typeof instructionScripts.$inferSelect;
export type InsertInstructionScript = typeof instructionScripts.$inferInsert;

/**
 * Coordination scripts for AI prompts (not versioned, one per type per user)
 */
export const coordinationScripts = mysqlTable("coordinationScripts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scriptType: mysqlEnum("scriptType", [
    "thumbnail_generation",
    "title_generation",
    "description_generation",
    "strategy_generation",
    "title_and_thumbnail_generation",
  ]).notNull(),
  version: int("version").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoordinationScript = typeof coordinationScripts.$inferSelect;
export type InsertCoordinationScript = typeof coordinationScripts.$inferInsert;

/**
 * Channel sync info - stores info about the last channel ID sync
 */
export const channelSyncInfo = mysqlTable("channelSyncInfo", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelTitle: text("channelTitle"),
  videoCount: int("videoCount").default(0),
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChannelSyncInfo = typeof channelSyncInfo.$inferSelect;
export type InsertChannelSyncInfo = typeof channelSyncInfo.$inferInsert;

/**
 * YouTube video information
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  channelId: varchar("channelId", { length: 64 }),
  channelTitle: text("channelTitle"),
  publishedAt: timestamp("publishedAt"),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  duration: varchar("duration", { length: 32 }),
  tags: text("tags"), // JSON string array
  transcript: text("transcript"), // Video transcript/subtitles
  watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0), // Average watch time
  averageViewDuration: int("averageViewDuration").default(0), // Average view duration in seconds
  retentionCurve: text("retentionCurve"), // JSON string: array of {time: number, retention: number}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * AB Tests table - stores A/B test configurations for videos
 */
export const abTests = mysqlTable("abTests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["theme", "angle", "optimization"]).default("theme").notNull(),
  variantType: mysqlEnum("variantType", ["text", "thumbnail", "both"]).default("both").notNull(),
  tags: text("tags"), // JSON string array
  parentTestId: int("parentTestId"), // For optimization tests
  winnerId: int("winnerId"), // ID of the winning variant
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ABTest = typeof abTests.$inferSelect;
export type InsertABTest = typeof abTests.$inferInsert;

/**
 * Test Variants table - stores different title/thumbnail variations for A/B tests
 */
export const testVariants = mysqlTable("testVariants", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  thumbnailTitle: text("thumbnailTitle"), // Text on thumbnail
  prompt: text("prompt"), // Midjourney/DALL-E prompt for thumbnail
  isControl: boolean("isControl").default(false).notNull(),
  // Metrics - Simplifié: uniquement la répartition du watch time
  watchTimePercentage: int("watchTimePercentage").default(0), // Pourcentage de répartition du watch time (0-100)
  views: bigint("views", { mode: "number" }).default(0),
  likes: bigint("likes", { mode: "number" }).default(0),
  comments: bigint("comments", { mode: "number" }).default(0),
  shares: bigint("shares", { mode: "number" }).default(0),
  watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0),
  averageViewDuration: int("averageViewDuration").default(0), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestVariant = typeof testVariants.$inferSelect;
export type InsertTestVariant = typeof testVariants.$inferInsert;

/**
 * Video Statistics table - stores historical performance data
 */
export const videoStats = mysqlTable("videoStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  date: timestamp("date").notNull(),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0),
  averageViewDuration: int("averageViewDuration").default(0), // in seconds
  subscribersGained: int("subscribersGained").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoStat = typeof videoStats.$inferSelect;
export type InsertVideoStat = typeof videoStats.$inferInsert;

/**
 * YouTube Configuration table - stores YouTube API credentials for each user
 */
export const youtubeConfig = mysqlTable("youtubeConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelTitle: text("channelTitle"),
  apiKey: text("apiKey").notNull(), // Encrypted YouTube API key
  accessToken: text("accessToken"), // OAuth access token
  refreshToken: text("refreshToken"), // OAuth refresh token
  tokenExpiry: timestamp("tokenExpiry"), // Token expiration date
  autoSyncEnabled: boolean("autoSyncEnabled").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type YouTubeConfig = typeof youtubeConfig.$inferSelect;
export type InsertYouTubeConfig = typeof youtubeConfig.$inferInsert;

/**
 * Sync Logs table - stores synchronization history and results
 */
export const syncLogs = mysqlTable("syncLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
  videosImported: int("videosImported").default(0).notNull(),
  videosUpdated: int("videosUpdated").default(0).notNull(),
  errors: text("errors"), // JSON string array of error messages
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;


/**
 * Video Analytics table - stores detailed watch time metrics
 */
export const videoAnalytics = mysqlTable("videoAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  watchTime: bigint("watchTime", { mode: "number" }).default(0), // in seconds
  averageViewDuration: int("averageViewDuration").default(0), // in seconds
  averageViewPercentage: int("averageViewPercentage").default(0), // percentage
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAnalytics = typeof videoAnalytics.$inferSelect;
export type InsertVideoAnalytics = typeof videoAnalytics.$inferInsert;

/**
 * Traffic Sources table - stores where viewers come from
 */
export const trafficSources = mysqlTable("trafficSources", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  views: bigint("views", { mode: "number" }).default(0),
  watchTime: bigint("watchTime", { mode: "number" }).default(0), // in seconds
  percentage: int("percentage").default(0), // percentage of total views
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrafficSource = typeof trafficSources.$inferSelect;
export type InsertTrafficSource = typeof trafficSources.$inferInsert;

/**
 * Demographics table - stores age and gender data
 */
export const demographics = mysqlTable("demographics", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  ageGroup: varchar("ageGroup", { length: 20 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  viewsPercentage: int("viewsPercentage").default(0), // percentage
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Demographic = typeof demographics.$inferSelect;
export type InsertDemographic = typeof demographics.$inferInsert;

/**
 * Geography table - stores country-level viewership data
 */
export const geography = mysqlTable("geography", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2 code
  views: bigint("views", { mode: "number" }).default(0),
  watchTime: bigint("watchTime", { mode: "number" }).default(0), // in seconds
  percentage: int("percentage").default(0), // percentage of total views
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Geography = typeof geography.$inferSelect;
export type InsertGeography = typeof geography.$inferInsert;

/**
 * Retention Data table - stores audience retention curve points
 */
export const retentionData = mysqlTable("retentionData", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  elapsedVideoTimeRatio: int("elapsedVideoTimeRatio").notNull(), // 0-100
  audienceWatchRatio: int("audienceWatchRatio").notNull(), // percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RetentionData = typeof retentionData.$inferSelect;
export type InsertRetentionData = typeof retentionData.$inferInsert;

/**
 * AI Generation History table - stores all AI generation requests with performance metrics
 */
export const aiGenerationHistory = mysqlTable("aiGenerationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  generationType: mysqlEnum("generationType", [
    "strategy",
    "title_suggestions",
    "thumbnail_suggestions",
    "title_and_thumbnail_suggestions",
    "description_suggestions"
  ]).notNull(),
  model: varchar("model", { length: 50 }).notNull(), // gpt-4o, gpt-4o-mini, o1, o1-mini, gpt-5, gpt-5-pro
  promptTokens: int("promptTokens").default(0),
  completionTokens: int("completionTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  durationMs: int("durationMs").notNull(), // duration in milliseconds
  success: int("success").default(1).notNull(), // 1 = success, 0 = error
  errorMessage: text("errorMessage"), // null if success
  userRating: int("userRating"), // 1-5 stars rating from user
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiGenerationHistory = typeof aiGenerationHistory.$inferSelect;
export type InsertAiGenerationHistory = typeof aiGenerationHistory.$inferInsert;

/**
 * Favorite Prompts table - stores user's favorite prompts for reuse
 */
export const favoritePrompts = mysqlTable("favoritePrompts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  promptType: mysqlEnum("promptType", ["strategy", "title", "thumbnail", "description"]).notNull(),
  promptContent: text("promptContent").notNull(),
  avgRating: int("avgRating"), // Average rating of generations using this prompt (1-5)
  rating: int("rating").default(0), // User's personal rating of this prompt (1-5 stars)
  categories: text("categories"), // JSON array of category tags
  usageCount: int("usageCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoritePrompt = typeof favoritePrompts.$inferSelect;
export type InsertFavoritePrompt = typeof favoritePrompts.$inferInsert;


/**
 * Saved Ideas table - stores brainstorm ideas that user wants to keep
 */
export const savedIdeas = mysqlTable("savedIdeas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ideaType: mysqlEnum("ideaType", ["video_idea", "title", "thumbnail", "tags", "description"]).notNull(),
  title: text("title").notNull(), // The main content (title for video_idea, actual title for title, etc.)
  summary: text("summary"), // Optional summary/description
  source: mysqlEnum("source", ["brainstorm_preprod", "brainstorm_postprod", "competition_analysis"]).notNull(),
  model: varchar("model", { length: 50 }), // AI model used to generate this idea
  status: mysqlEnum("status", ["saved", "in_progress", "completed", "archived"]).default("saved").notNull(),
  notes: text("notes"), // User's personal notes about this idea
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedIdea = typeof savedIdeas.$inferSelect;
export type InsertSavedIdea = typeof savedIdeas.$inferInsert;

/**
 * Competition Analysis table - stores competitor video research results
 */
export const competitionAnalysis = mysqlTable("competitionAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  videoId: varchar("videoId", { length: 20 }).notNull(), // YouTube video ID
  videoTitle: text("videoTitle").notNull(),
  channelTitle: varchar("channelTitle", { length: 255 }),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  publishedAt: timestamp("publishedAt"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: varchar("duration", { length: 20 }), // e.g., "10:30"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitionAnalysis = typeof competitionAnalysis.$inferSelect;
export type InsertCompetitionAnalysis = typeof competitionAnalysis.$inferInsert;


/**
 * Script Profiles table - stores user's personal meta-prompts for script writing
 * Each profile defines writing style, structure preferences, and tone
 */
export const scriptProfiles = mysqlTable("scriptProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Vidéo éducative", "Storytelling", "Polémique"
  description: text("description"), // Brief description of this profile
  metaPrompt: text("metaPrompt").notNull(), // The actual meta-prompt content
  tags: json("tags").$type<string[]>(), // Tags for organizing and filtering profiles
  isDefault: boolean("isDefault").default(false).notNull(), // Whether this is the default profile
  usageCount: int("usageCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScriptProfile = typeof scriptProfiles.$inferSelect;
export type InsertScriptProfile = typeof scriptProfiles.$inferInsert;

/**
 * Script Corrections table - stores durable corrections/rules for script generation
 * These corrections are automatically applied to all future generations
 */
export const scriptCorrections = mysqlTable("scriptCorrections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  problem: text("problem").notNull(), // What the user identified as wrong
  correction: text("correction").notNull(), // The rule/instruction to fix it
  category: mysqlEnum("category", [
    "structure", // Structure du script
    "tone", // Ton et style
    "length", // Longueur des sections
    "transitions", // Transitions entre sections
    "examples", // Exemples et illustrations
    "engagement", // Engagement et rétention
    "cta", // Call-to-action
    "other" // Autre
  ]).default("other").notNull(),
  isActive: boolean("isActive").default(true).notNull(), // Can be disabled without deleting
  appliedCount: int("appliedCount").default(0), // How many times this correction was applied
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScriptCorrection = typeof scriptCorrections.$inferSelect;
export type InsertScriptCorrection = typeof scriptCorrections.$inferInsert;

/**
 * Script History table - stores all generated scripts with ratings
 */
export const scriptHistory = mysqlTable("scriptHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId"), // Which profile was used (nullable for legacy)
  topic: text("topic").notNull(), // The subject of the script
  customInstructions: text("customInstructions"), // Additional instructions provided
  generatedScript: text("generatedScript").notNull(), // The full generated script
  wordCount: int("wordCount").default(0),
  model: varchar("model", { length: 50 }).notNull(),
  rating: int("rating"), // User rating: -1 (bad), 0 (neutral), 1 (good)
  feedback: text("feedback"), // Optional user feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScriptHistoryEntry = typeof scriptHistory.$inferSelect;
export type InsertScriptHistoryEntry = typeof scriptHistory.$inferInsert;

/**
 * Script Profile Versions table - stores version history for each profile
 * Allows users to restore previous versions of their profiles
 */
export const scriptProfileVersions = mysqlTable("scriptProfileVersions", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(), // Reference to the profile
  version: int("version").notNull().default(1), // Version number
  name: varchar("name", { length: 100 }).notNull(), // Profile name at this version
  description: text("description"), // Profile description at this version
  content: text("content").notNull(), // The meta-prompt content at this version
  changeDescription: varchar("changeDescription", { length: 500 }), // What changed in this version
  isFavorite: boolean("isFavorite").default(false).notNull(), // Protected from auto-deletion
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScriptProfileVersion = typeof scriptProfileVersions.$inferSelect;
export type InsertScriptProfileVersion = typeof scriptProfileVersions.$inferInsert;

/**
 * Script Profile Branches table - stores experimental branches of profiles
 * Allows users to create variations without affecting the original profile
 */
export const scriptProfileBranches = mysqlTable("scriptProfileBranches", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(), // Reference to the parent profile
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Branch name
  description: text("description"), // What this branch is for
  metaPrompt: text("metaPrompt").notNull(), // The experimental meta-prompt content
  parentVersionId: int("parentVersionId"), // Version from which this branch was created
  status: mysqlEnum("status", ["active", "merged", "abandoned"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  mergedAt: timestamp("mergedAt"),
});

export type ScriptProfileBranch = typeof scriptProfileBranches.$inferSelect;
export type InsertScriptProfileBranch = typeof scriptProfileBranches.$inferInsert;

/**
 * User settings for preferences
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: varchar("theme", { length: 20 }).default("system"),
  backupFrequency: varchar("backupFrequency", { length: 20 }).default("weekly"),
  abTestCtrThreshold: varchar("abTestCtrThreshold", { length: 10 }).default("5.00"),
  abTestViewsThreshold: int("abTestViewsThreshold").default(1000),
  notifyNewVideos: boolean("notifyNewVideos").default(true),
  notifyABTestThreshold: boolean("notifyABTestThreshold").default(true),
  notifyBackupComplete: boolean("notifyBackupComplete").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Video templates for reusable title/description/tags combinations
 */
export const videoTemplates = mysqlTable("videoTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  titleTemplate: text("titleTemplate"),
  descriptionTemplate: text("descriptionTemplate"),
  tagsTemplate: json("tagsTemplate"),
  category: varchar("category", { length: 100 }),
  isDefault: boolean("isDefault").default(false),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoTemplate = typeof videoTemplates.$inferSelect;
export type InsertVideoTemplate = typeof videoTemplates.$inferInsert;


/**
 * Daily View Stats table - stores daily snapshots of video views, likes, and comments
 * Used to track growth/decline over time
 */
export const dailyViewStats = mysqlTable("dailyViewStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull(), // For quick reference
  date: timestamp("date").notNull(), // The date of the snapshot (midnight UTC)
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  // Computed deltas (difference from previous day)
  viewDelta: bigint("viewDelta", { mode: "number" }).default(0),
  likeDelta: bigint("likeDelta", { mode: "number" }).default(0),
  commentDelta: bigint("commentDelta", { mode: "number" }).default(0),
  // Growth rate (percentage change from previous day)
  viewGrowthRate: int("viewGrowthRate").default(0), // Stored as percentage * 100 (e.g., 1250 = 12.50%)
  likeGrowthRate: int("likeGrowthRate").default(0),
  commentGrowthRate: int("commentGrowthRate").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyViewStat = typeof dailyViewStats.$inferSelect;
export type InsertDailyViewStat = typeof dailyViewStats.$inferInsert;


/**
 * View Alerts table - stores user-configured alerts for view thresholds
 */
export const viewAlerts = mysqlTable("viewAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: int("videoId"), // null = all videos
  name: varchar("name", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", ["growth", "decline", "views"]).notNull(),
  threshold: int("threshold").notNull(), // For growth/decline: percentage * 100, for views: absolute number
  period: mysqlEnum("period", ["1h", "2h", "24h", "48h", "1week"]).default("1h").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  triggerCount: int("triggerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ViewAlert = typeof viewAlerts.$inferSelect;
export type InsertViewAlert = typeof viewAlerts.$inferInsert;

/**
 * Alert History table - stores triggered alert events
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId").notNull(),
  userId: int("userId").notNull(),
  videoId: int("videoId").notNull(),
  videoTitle: text("videoTitle").notNull(),
  alertType: mysqlEnum("alertType", ["growth", "decline", "views"]).notNull(),
  threshold: int("threshold").notNull(),
  actualValue: int("actualValue").notNull(),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryEntry = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryEntry = typeof alertHistory.$inferInsert;
