import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";
/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
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
// TODO: Add your tables here
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
/**
 * Favorite Prompts table - stores user's favorite prompts for reuse
 */
export const favoritePrompts = mysqlTable("favoritePrompts", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    promptType: mysqlEnum("promptType", ["strategy", "title", "thumbnail", "description"]).notNull(),
    promptContent: text("promptContent").notNull(),
    avgRating: int("avgRating"), // Average rating of generations using this prompt (1-5)
    usageCount: int("usageCount").default(0),
    lastUsedAt: timestamp("lastUsedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
