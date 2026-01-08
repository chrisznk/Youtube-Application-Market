var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  abTests: () => abTests,
  aiGenerationHistory: () => aiGenerationHistory,
  alertHistory: () => alertHistory,
  channelSyncInfo: () => channelSyncInfo,
  competitionAnalysis: () => competitionAnalysis,
  coordinationScripts: () => coordinationScripts,
  dailyViewStats: () => dailyViewStats,
  demographics: () => demographics,
  favoritePrompts: () => favoritePrompts,
  geography: () => geography,
  instructionScripts: () => instructionScripts,
  retentionData: () => retentionData,
  savedIdeas: () => savedIdeas,
  scriptCorrections: () => scriptCorrections,
  scriptHistory: () => scriptHistory,
  scriptProfileBranches: () => scriptProfileBranches,
  scriptProfileVersions: () => scriptProfileVersions,
  scriptProfiles: () => scriptProfiles,
  syncLogs: () => syncLogs,
  testVariants: () => testVariants,
  trafficSources: () => trafficSources,
  userSettings: () => userSettings,
  users: () => users,
  videoAnalytics: () => videoAnalytics,
  videoStats: () => videoStats,
  videoTemplates: () => videoTemplates,
  videos: () => videos,
  viewAlerts: () => viewAlerts,
  youtubeConfig: () => youtubeConfig
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, boolean } from "drizzle-orm/mysql-core";
var users, instructionScripts, coordinationScripts, channelSyncInfo, videos, abTests, testVariants, videoStats, youtubeConfig, syncLogs, videoAnalytics, trafficSources, demographics, geography, retentionData, aiGenerationHistory, favoritePrompts, savedIdeas, competitionAnalysis, scriptProfiles, scriptCorrections, scriptHistory, scriptProfileVersions, scriptProfileBranches, userSettings, videoTemplates, dailyViewStats, viewAlerts, alertHistory;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    instructionScripts = mysqlTable("instructionScripts", {
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
      trainedBy: varchar("trainedBy", { length: 64 }),
      // Model used for training (e.g., "gpt-4o", "o1")
      isActive: boolean("isActive").default(false).notNull(),
      // Whether this version is the active one
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    coordinationScripts = mysqlTable("coordinationScripts", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      scriptType: mysqlEnum("scriptType", [
        "thumbnail_generation",
        "title_generation",
        "description_generation",
        "strategy_generation",
        "title_and_thumbnail_generation"
      ]).notNull(),
      version: int("version").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    channelSyncInfo = mysqlTable("channelSyncInfo", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      channelId: varchar("channelId", { length: 64 }).notNull(),
      channelTitle: text("channelTitle"),
      videoCount: int("videoCount").default(0),
      lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    videos = mysqlTable("videos", {
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
      tags: text("tags"),
      // JSON string array
      transcript: text("transcript"),
      // Video transcript/subtitles
      watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0),
      // Average watch time
      averageViewDuration: int("averageViewDuration").default(0),
      // Average view duration in seconds
      retentionCurve: text("retentionCurve"),
      // JSON string: array of {time: number, retention: number}
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    abTests = mysqlTable("abTests", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      videoId: int("videoId").notNull(),
      name: text("name").notNull(),
      description: text("description"),
      type: mysqlEnum("type", ["theme", "angle", "optimization"]).default("theme").notNull(),
      variantType: mysqlEnum("variantType", ["text", "thumbnail", "both"]).default("both").notNull(),
      tags: text("tags"),
      // JSON string array
      parentTestId: int("parentTestId"),
      // For optimization tests
      winnerId: int("winnerId"),
      // ID of the winning variant
      status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    testVariants = mysqlTable("testVariants", {
      id: int("id").autoincrement().primaryKey(),
      testId: int("testId").notNull(),
      userId: int("userId").notNull(),
      title: text("title").notNull(),
      thumbnailUrl: text("thumbnailUrl").notNull(),
      thumbnailTitle: text("thumbnailTitle"),
      // Text on thumbnail
      prompt: text("prompt"),
      // Midjourney/DALL-E prompt for thumbnail
      isControl: boolean("isControl").default(false).notNull(),
      // Metrics - Simplifié: uniquement la répartition du watch time
      watchTimePercentage: int("watchTimePercentage").default(0),
      // Pourcentage de répartition du watch time (0-100)
      views: bigint("views", { mode: "number" }).default(0),
      likes: bigint("likes", { mode: "number" }).default(0),
      comments: bigint("comments", { mode: "number" }).default(0),
      shares: bigint("shares", { mode: "number" }).default(0),
      watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0),
      averageViewDuration: int("averageViewDuration").default(0),
      // in seconds
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    videoStats = mysqlTable("videoStats", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      videoId: int("videoId").notNull(),
      date: timestamp("date").notNull(),
      viewCount: bigint("viewCount", { mode: "number" }).default(0),
      likeCount: bigint("likeCount", { mode: "number" }).default(0),
      commentCount: bigint("commentCount", { mode: "number" }).default(0),
      watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0),
      averageViewDuration: int("averageViewDuration").default(0),
      // in seconds
      subscribersGained: int("subscribersGained").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    youtubeConfig = mysqlTable("youtubeConfig", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      channelId: varchar("channelId", { length: 64 }).notNull(),
      channelTitle: text("channelTitle"),
      apiKey: text("apiKey").notNull(),
      // Encrypted YouTube API key
      accessToken: text("accessToken"),
      // OAuth access token
      refreshToken: text("refreshToken"),
      // OAuth refresh token
      tokenExpiry: timestamp("tokenExpiry"),
      // Token expiration date
      autoSyncEnabled: boolean("autoSyncEnabled").default(true).notNull(),
      lastSyncAt: timestamp("lastSyncAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    syncLogs = mysqlTable("syncLogs", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
      videosImported: int("videosImported").default(0).notNull(),
      videosUpdated: int("videosUpdated").default(0).notNull(),
      errors: text("errors"),
      // JSON string array of error messages
      startedAt: timestamp("startedAt").notNull(),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    videoAnalytics = mysqlTable("videoAnalytics", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      watchTime: bigint("watchTime", { mode: "number" }).default(0),
      // in seconds
      averageViewDuration: int("averageViewDuration").default(0),
      // in seconds
      averageViewPercentage: int("averageViewPercentage").default(0),
      // percentage
      startDate: timestamp("startDate").notNull(),
      endDate: timestamp("endDate").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    trafficSources = mysqlTable("trafficSources", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      source: varchar("source", { length: 100 }).notNull(),
      views: bigint("views", { mode: "number" }).default(0),
      watchTime: bigint("watchTime", { mode: "number" }).default(0),
      // in seconds
      percentage: int("percentage").default(0),
      // percentage of total views
      startDate: timestamp("startDate").notNull(),
      endDate: timestamp("endDate").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    demographics = mysqlTable("demographics", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      ageGroup: varchar("ageGroup", { length: 20 }).notNull(),
      gender: varchar("gender", { length: 20 }).notNull(),
      viewsPercentage: int("viewsPercentage").default(0),
      // percentage
      startDate: timestamp("startDate").notNull(),
      endDate: timestamp("endDate").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    geography = mysqlTable("geography", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      country: varchar("country", { length: 2 }).notNull(),
      // ISO 3166-1 alpha-2 code
      views: bigint("views", { mode: "number" }).default(0),
      watchTime: bigint("watchTime", { mode: "number" }).default(0),
      // in seconds
      percentage: int("percentage").default(0),
      // percentage of total views
      startDate: timestamp("startDate").notNull(),
      endDate: timestamp("endDate").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    retentionData = mysqlTable("retentionData", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      elapsedVideoTimeRatio: int("elapsedVideoTimeRatio").notNull(),
      // 0-100
      audienceWatchRatio: int("audienceWatchRatio").notNull(),
      // percentage
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    aiGenerationHistory = mysqlTable("aiGenerationHistory", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      generationType: mysqlEnum("generationType", [
        "strategy",
        "title_suggestions",
        "thumbnail_suggestions",
        "title_and_thumbnail_suggestions",
        "description_suggestions"
      ]).notNull(),
      model: varchar("model", { length: 50 }).notNull(),
      // gpt-4o, gpt-4o-mini, o1, o1-mini, gpt-5, gpt-5-pro
      promptTokens: int("promptTokens").default(0),
      completionTokens: int("completionTokens").default(0),
      totalTokens: int("totalTokens").default(0),
      durationMs: int("durationMs").notNull(),
      // duration in milliseconds
      success: int("success").default(1).notNull(),
      // 1 = success, 0 = error
      errorMessage: text("errorMessage"),
      // null if success
      userRating: int("userRating"),
      // 1-5 stars rating from user
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    favoritePrompts = mysqlTable("favoritePrompts", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      promptType: mysqlEnum("promptType", ["strategy", "title", "thumbnail", "description"]).notNull(),
      promptContent: text("promptContent").notNull(),
      avgRating: int("avgRating"),
      // Average rating of generations using this prompt (1-5)
      rating: int("rating").default(0),
      // User's personal rating of this prompt (1-5 stars)
      categories: text("categories"),
      // JSON array of category tags
      usageCount: int("usageCount").default(0),
      lastUsedAt: timestamp("lastUsedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    savedIdeas = mysqlTable("savedIdeas", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      ideaType: mysqlEnum("ideaType", ["video_idea", "title", "thumbnail", "tags", "description"]).notNull(),
      title: text("title").notNull(),
      // The main content (title for video_idea, actual title for title, etc.)
      summary: text("summary"),
      // Optional summary/description
      source: mysqlEnum("source", ["brainstorm_preprod", "brainstorm_postprod", "competition_analysis"]).notNull(),
      model: varchar("model", { length: 50 }),
      // AI model used to generate this idea
      status: mysqlEnum("status", ["saved", "in_progress", "completed", "archived"]).default("saved").notNull(),
      notes: text("notes"),
      // User's personal notes about this idea
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    competitionAnalysis = mysqlTable("competitionAnalysis", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      keyword: varchar("keyword", { length: 255 }).notNull(),
      videoId: varchar("videoId", { length: 20 }).notNull(),
      // YouTube video ID
      videoTitle: text("videoTitle").notNull(),
      channelTitle: varchar("channelTitle", { length: 255 }),
      viewCount: bigint("viewCount", { mode: "number" }).default(0),
      publishedAt: timestamp("publishedAt"),
      thumbnailUrl: text("thumbnailUrl"),
      duration: varchar("duration", { length: 20 }),
      // e.g., "10:30"
      description: text("description"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scriptProfiles = mysqlTable("scriptProfiles", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      // e.g., "Vidéo éducative", "Storytelling", "Polémique"
      description: text("description"),
      // Brief description of this profile
      metaPrompt: text("metaPrompt").notNull(),
      // The actual meta-prompt content
      tags: json("tags").$type(),
      // Tags for organizing and filtering profiles
      isDefault: boolean("isDefault").default(false).notNull(),
      // Whether this is the default profile
      usageCount: int("usageCount").default(0),
      lastUsedAt: timestamp("lastUsedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    scriptCorrections = mysqlTable("scriptCorrections", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      problem: text("problem").notNull(),
      // What the user identified as wrong
      correction: text("correction").notNull(),
      // The rule/instruction to fix it
      category: mysqlEnum("category", [
        "structure",
        // Structure du script
        "tone",
        // Ton et style
        "length",
        // Longueur des sections
        "transitions",
        // Transitions entre sections
        "examples",
        // Exemples et illustrations
        "engagement",
        // Engagement et rétention
        "cta",
        // Call-to-action
        "other"
        // Autre
      ]).default("other").notNull(),
      isActive: boolean("isActive").default(true).notNull(),
      // Can be disabled without deleting
      appliedCount: int("appliedCount").default(0),
      // How many times this correction was applied
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scriptHistory = mysqlTable("scriptHistory", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      profileId: int("profileId"),
      // Which profile was used (nullable for legacy)
      topic: text("topic").notNull(),
      // The subject of the script
      customInstructions: text("customInstructions"),
      // Additional instructions provided
      generatedScript: text("generatedScript").notNull(),
      // The full generated script
      wordCount: int("wordCount").default(0),
      model: varchar("model", { length: 50 }).notNull(),
      rating: int("rating"),
      // User rating: -1 (bad), 0 (neutral), 1 (good)
      feedback: text("feedback"),
      // Optional user feedback
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scriptProfileVersions = mysqlTable("scriptProfileVersions", {
      id: int("id").autoincrement().primaryKey(),
      profileId: int("profileId").notNull(),
      // Reference to the profile
      version: int("version").notNull().default(1),
      // Version number
      name: varchar("name", { length: 100 }).notNull(),
      // Profile name at this version
      description: text("description"),
      // Profile description at this version
      content: text("content").notNull(),
      // The meta-prompt content at this version
      changeDescription: varchar("changeDescription", { length: 500 }),
      // What changed in this version
      isFavorite: boolean("isFavorite").default(false).notNull(),
      // Protected from auto-deletion
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    scriptProfileBranches = mysqlTable("scriptProfileBranches", {
      id: int("id").autoincrement().primaryKey(),
      profileId: int("profileId").notNull(),
      // Reference to the parent profile
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      // Branch name
      description: text("description"),
      // What this branch is for
      metaPrompt: text("metaPrompt").notNull(),
      // The experimental meta-prompt content
      parentVersionId: int("parentVersionId"),
      // Version from which this branch was created
      status: mysqlEnum("status", ["active", "merged", "abandoned"]).default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      mergedAt: timestamp("mergedAt")
    });
    userSettings = mysqlTable("userSettings", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      theme: varchar("theme", { length: 20 }).default("system"),
      backupFrequency: varchar("backupFrequency", { length: 20 }).default("weekly"),
      abTestCtrThreshold: varchar("abTestCtrThreshold", { length: 10 }).default("5.00"),
      abTestViewsThreshold: int("abTestViewsThreshold").default(1e3),
      notifyNewVideos: boolean("notifyNewVideos").default(true),
      notifyABTestThreshold: boolean("notifyABTestThreshold").default(true),
      notifyBackupComplete: boolean("notifyBackupComplete").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    videoTemplates = mysqlTable("videoTemplates", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    dailyViewStats = mysqlTable("dailyViewStats", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      videoId: int("videoId").notNull(),
      youtubeId: varchar("youtubeId", { length: 64 }).notNull(),
      // For quick reference
      date: timestamp("date").notNull(),
      // The date of the snapshot (midnight UTC)
      viewCount: bigint("viewCount", { mode: "number" }).default(0),
      likeCount: bigint("likeCount", { mode: "number" }).default(0),
      commentCount: bigint("commentCount", { mode: "number" }).default(0),
      // Computed deltas (difference from previous day)
      viewDelta: bigint("viewDelta", { mode: "number" }).default(0),
      likeDelta: bigint("likeDelta", { mode: "number" }).default(0),
      commentDelta: bigint("commentDelta", { mode: "number" }).default(0),
      // Growth rate (percentage change from previous day)
      viewGrowthRate: int("viewGrowthRate").default(0),
      // Stored as percentage * 100 (e.g., 1250 = 12.50%)
      likeGrowthRate: int("likeGrowthRate").default(0),
      commentGrowthRate: int("commentGrowthRate").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    viewAlerts = mysqlTable("viewAlerts", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      videoId: int("videoId"),
      // null = all videos
      name: varchar("name", { length: 255 }).notNull(),
      alertType: mysqlEnum("alertType", ["growth", "decline", "views"]).notNull(),
      threshold: int("threshold").notNull(),
      // For growth/decline: percentage * 100, for views: absolute number
      period: mysqlEnum("period", ["1h", "2h", "24h", "48h", "1week"]).default("1h").notNull(),
      enabled: boolean("enabled").default(true).notNull(),
      lastTriggeredAt: timestamp("lastTriggeredAt"),
      triggerCount: int("triggerCount").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    alertHistory = mysqlTable("alertHistory", {
      id: int("id").autoincrement().primaryKey(),
      alertId: int("alertId").notNull(),
      userId: int("userId").notNull(),
      videoId: int("videoId").notNull(),
      videoTitle: text("videoTitle").notNull(),
      alertType: mysqlEnum("alertType", ["growth", "decline", "views"]).notNull(),
      threshold: int("threshold").notNull(),
      actualValue: int("actualValue").notNull(),
      notificationSent: boolean("notificationSent").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createABTest: () => createABTest,
  createAiGenerationHistory: () => createAiGenerationHistory,
  createSyncLog: () => createSyncLog,
  createTestVariant: () => createTestVariant,
  createVariant: () => createVariant,
  createVideo: () => createVideo,
  createVideoStat: () => createVideoStat,
  deleteABTest: () => deleteABTest,
  deleteAllVideos: () => deleteAllVideos,
  deleteFavoritePrompt: () => deleteFavoritePrompt,
  deleteIdea: () => deleteIdea,
  deleteTestVariant: () => deleteTestVariant,
  deleteVideo: () => deleteVideo,
  deleteYouTubeConfig: () => deleteYouTubeConfig,
  getAiGenerationStats: () => getAiGenerationStats,
  getAllTestsByUser: () => getAllTestsByUser,
  getAllYouTubeConfigs: () => getAllYouTubeConfigs,
  getBestModelByCategory: () => getBestModelByCategory,
  getChannelSyncInfo: () => getChannelSyncInfo,
  getDb: () => getDb,
  getFavoritePrompts: () => getFavoritePrompts,
  getSavedCompetitorVideos: () => getSavedCompetitorVideos,
  getSavedIdeas: () => getSavedIdeas,
  getStatsByVideoId: () => getStatsByVideoId,
  getSyncLogsByUser: () => getSyncLogsByUser,
  getTestById: () => getTestById,
  getTestsByVideoId: () => getTestsByVideoId,
  getUserByOpenId: () => getUserByOpenId,
  getVariantsByTestId: () => getVariantsByTestId,
  getVideoById: () => getVideoById,
  getVideoByYouTubeId: () => getVideoByYouTubeId,
  getVideosByUserId: () => getVideosByUserId,
  getVideosWithTranscript: () => getVideosWithTranscript,
  getYouTubeConfig: () => getYouTubeConfig,
  rateFavoritePrompt: () => rateFavoritePrompt,
  resetFavoritePromptRatings: () => resetFavoritePromptRatings,
  resetGenerationRatings: () => resetGenerationRatings,
  saveCompetitorVideo: () => saveCompetitorVideo,
  saveFavoritePrompt: () => saveFavoritePrompt,
  saveIdea: () => saveIdea,
  updateABTest: () => updateABTest,
  updateAiGenerationRating: () => updateAiGenerationRating,
  updateIdeaNotes: () => updateIdeaNotes,
  updateIdeaStatus: () => updateIdeaStatus,
  updatePromptCategories: () => updatePromptCategories,
  updateSyncLog: () => updateSyncLog,
  updateTestVariant: () => updateTestVariant,
  updateVariant: () => updateVariant,
  updateVideo: () => updateVideo,
  updateYouTubeTokens: () => updateYouTubeTokens,
  upsertChannelSyncInfo: () => upsertChannelSyncInfo,
  upsertUser: () => upsertUser,
  upsertYouTubeConfig: () => upsertYouTubeConfig,
  useFavoritePrompt: () => useFavoritePrompt
});
import { eq, desc, and, isNotNull, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getVideosByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.publishedAt));
}
async function getVideosWithTranscript(userId) {
  const db = await getDb();
  if (!db) return /* @__PURE__ */ new Set();
  const videosWithTranscript = await db.select({ youtubeId: videos.youtubeId }).from(videos).where(and(
    eq(videos.userId, userId),
    isNotNull(videos.transcript)
  ));
  return new Set(videosWithTranscript.map((v) => v.youtubeId));
}
async function getVideoById(videoId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId))).limit(1);
  return result[0];
}
async function getVideoByYouTubeId(youtubeId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(videos).where(and(eq(videos.youtubeId, youtubeId), eq(videos.userId, userId))).limit(1);
  return result[0];
}
async function createVideo(video) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(video);
  return Number(result[0].insertId);
}
async function updateVideo(videoId, data, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userId !== void 0) {
    await db.update(videos).set(data).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
  } else {
    await db.update(videos).set(data).where(eq(videos.id, videoId));
  }
}
async function deleteVideo(videoId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const tests = await db.select().from(abTests).where(and(eq(abTests.videoId, videoId), eq(abTests.userId, userId)));
  for (const test of tests) {
    await db.delete(testVariants).where(eq(testVariants.testId, test.id));
  }
  await db.delete(abTests).where(and(eq(abTests.videoId, videoId), eq(abTests.userId, userId)));
  await db.delete(videoStats).where(and(eq(videoStats.videoId, videoId), eq(videoStats.userId, userId)));
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}
async function deleteAllVideos(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const userVideos = await db.select().from(videos).where(eq(videos.userId, userId));
  for (const video of userVideos) {
    const tests = await db.select().from(abTests).where(eq(abTests.videoId, video.id));
    for (const test of tests) {
      await db.delete(testVariants).where(eq(testVariants.testId, test.id));
    }
    await db.delete(abTests).where(eq(abTests.videoId, video.id));
    await db.delete(videoStats).where(eq(videoStats.videoId, video.id));
  }
  await db.delete(videos).where(eq(videos.userId, userId));
}
async function getAllTestsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
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
    videoTitle: videos.title
  }).from(abTests).leftJoin(videos, eq(abTests.videoId, videos.id)).orderBy(desc(abTests.createdAt));
  return results;
}
async function getTestsByVideoId(videoId, userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(abTests).where(eq(abTests.videoId, videoId)).orderBy(desc(abTests.createdAt));
}
async function getTestById(testId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(abTests).where(eq(abTests.id, testId)).limit(1);
  return result[0];
}
async function createABTest(test) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(abTests).values(test);
  return Number(result[0].insertId);
}
async function updateABTest(testId, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(abTests).set(data).where(and(eq(abTests.id, testId), eq(abTests.userId, userId)));
}
async function deleteABTest(testId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(testVariants).where(and(eq(testVariants.testId, testId), eq(testVariants.userId, userId)));
  await db.delete(abTests).where(and(eq(abTests.id, testId), eq(abTests.userId, userId)));
}
async function getVariantsByTestId(testId, userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(testVariants).where(eq(testVariants.testId, testId)).orderBy(desc(testVariants.createdAt));
}
async function createTestVariant(variant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(testVariants).values(variant);
  return Number(result[0].insertId);
}
async function updateTestVariant(variantId, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(testVariants).set(data).where(and(eq(testVariants.id, variantId), eq(testVariants.userId, userId)));
}
async function deleteTestVariant(variantId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(testVariants).where(and(eq(testVariants.id, variantId), eq(testVariants.userId, userId)));
}
async function getStatsByVideoId(videoId, userId, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(videoStats).where(and(eq(videoStats.videoId, videoId), eq(videoStats.userId, userId))).orderBy(desc(videoStats.date)).limit(limit);
}
async function createVideoStat(stat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videoStats).values(stat);
  return Number(result[0].insertId);
}
async function getYouTubeConfig(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(youtubeConfig).where(eq(youtubeConfig.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertYouTubeConfig(config) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getYouTubeConfig(config.userId);
  if (existing) {
    await db.update(youtubeConfig).set(config).where(eq(youtubeConfig.userId, config.userId));
  } else {
    await db.insert(youtubeConfig).values(config);
  }
}
async function getAllYouTubeConfigs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(youtubeConfig).where(eq(youtubeConfig.autoSyncEnabled, true));
}
async function updateYouTubeTokens(userId, tokens) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(youtubeConfig).set(tokens).where(eq(youtubeConfig.userId, userId));
}
async function deleteYouTubeConfig(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(youtubeConfig).where(eq(youtubeConfig.userId, userId));
}
async function createSyncLog(log) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(syncLogs).values(log);
  return Number(result[0].insertId);
}
async function updateSyncLog(logId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(syncLogs).set(data).where(eq(syncLogs.id, logId));
}
async function getSyncLogsByUser(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(syncLogs).where(eq(syncLogs.userId, userId)).orderBy(desc(syncLogs.createdAt)).limit(limit);
}
async function createAiGenerationHistory(data) {
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
    errorMessage: data.errorMessage || null
  });
  return Number(result[0].insertId);
}
async function getAiGenerationStats(userId) {
  const db = await getDb();
  if (!db) return [];
  const stats = await db.select({
    model: aiGenerationHistory.model,
    generationType: aiGenerationHistory.generationType,
    totalGenerations: sql`COUNT(*)`,
    successfulGenerations: sql`SUM(CASE WHEN ${aiGenerationHistory.success} = 1 THEN 1 ELSE 0 END)`,
    failedGenerations: sql`SUM(CASE WHEN ${aiGenerationHistory.success} = 0 THEN 1 ELSE 0 END)`,
    avgDurationMs: sql`AVG(${aiGenerationHistory.durationMs})`,
    avgPromptTokens: sql`AVG(${aiGenerationHistory.promptTokens})`,
    avgCompletionTokens: sql`AVG(${aiGenerationHistory.completionTokens})`,
    avgTotalTokens: sql`AVG(${aiGenerationHistory.totalTokens})`,
    avgUserRating: sql`AVG(${aiGenerationHistory.userRating})`,
    ratedCount: sql`SUM(CASE WHEN ${aiGenerationHistory.userRating} IS NOT NULL THEN 1 ELSE 0 END)`
  }).from(aiGenerationHistory).where(eq(aiGenerationHistory.userId, userId)).groupBy(aiGenerationHistory.model, aiGenerationHistory.generationType);
  return stats;
}
async function updateAiGenerationRating(generationId, rating) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiGenerationHistory).set({ userRating: rating }).where(eq(aiGenerationHistory.id, generationId));
}
async function saveFavoritePrompt(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(favoritePrompts).values({
    userId: data.userId,
    promptType: data.promptType,
    promptContent: data.promptContent,
    rating: data.rating || 0,
    categories: data.categories || null,
    usageCount: 0
  });
  return Number(result[0].insertId);
}
async function getFavoritePrompts(userId, promptType) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(favoritePrompts.userId, userId)];
  if (promptType) {
    conditions.push(eq(favoritePrompts.promptType, promptType));
  }
  const results = await db.select().from(favoritePrompts).where(and(...conditions)).orderBy(desc(favoritePrompts.lastUsedAt));
  return results.sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return dateB - dateA;
  });
}
async function deleteFavoritePrompt(promptId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(favoritePrompts).where(
    and(
      eq(favoritePrompts.id, promptId),
      eq(favoritePrompts.userId, userId)
    )
  );
}
async function useFavoritePrompt(promptId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(favoritePrompts).set({
    usageCount: sql`${favoritePrompts.usageCount} + 1`,
    lastUsedAt: /* @__PURE__ */ new Date()
  }).where(eq(favoritePrompts.id, promptId));
}
async function rateFavoritePrompt(promptId, rating, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(
    sql`UPDATE favoritePrompts SET rating = ${rating} WHERE id = ${promptId} AND userId = ${userId}`
  );
}
async function updatePromptCategories(promptId, categories, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const categoriesJson = JSON.stringify(categories);
  await db.execute(
    sql`UPDATE favoritePrompts SET categories = ${categoriesJson} WHERE id = ${promptId} AND userId = ${userId}`
  );
}
async function getBestModelByCategory(userId) {
  const db = await getDb();
  if (!db) {
    return {
      bestOverall: "gpt-4o",
      bestTitle: "gpt-4o",
      bestThumbnail: "gpt-4o",
      bestDescription: "gpt-4o"
    };
  }
  const stats = await db.select({
    model: aiGenerationHistory.model,
    generationType: aiGenerationHistory.generationType,
    avgRating: sql`AVG(${aiGenerationHistory.userRating})`,
    ratedCount: sql`SUM(CASE WHEN ${aiGenerationHistory.userRating} IS NOT NULL THEN 1 ELSE 0 END)`
  }).from(aiGenerationHistory).where(eq(aiGenerationHistory.userId, userId)).groupBy(aiGenerationHistory.model, aiGenerationHistory.generationType);
  const modelRatings = {};
  for (const stat of stats) {
    const model = stat.model;
    if (!modelRatings[model]) {
      modelRatings[model] = {
        overall: { sum: 0, count: 0 },
        title: { sum: 0, count: 0 },
        thumbnail: { sum: 0, count: 0 },
        description: { sum: 0, count: 0 }
      };
    }
    const rating = Number(stat.avgRating || 0);
    const count = Number(stat.ratedCount || 0);
    if (count > 0) {
      modelRatings[model].overall.sum += rating * count;
      modelRatings[model].overall.count += count;
      const genType = (stat.generationType || "").toLowerCase();
      if (genType.includes("title") || genType.includes("titre")) {
        modelRatings[model].title.sum += rating * count;
        modelRatings[model].title.count += count;
      }
      if (genType.includes("thumbnail") || genType.includes("miniature")) {
        modelRatings[model].thumbnail.sum += rating * count;
        modelRatings[model].thumbnail.count += count;
      }
      if (genType.includes("description") || genType.includes("tag")) {
        modelRatings[model].description.sum += rating * count;
        modelRatings[model].description.count += count;
      }
    }
  }
  let bestOverall = null;
  let bestOverallRating = 0;
  let bestTitle = null;
  let bestTitleRating = 0;
  let bestThumbnail = null;
  let bestThumbnailRating = 0;
  let bestDescription = null;
  let bestDescriptionRating = 0;
  for (const [model, ratings] of Object.entries(modelRatings)) {
    if (ratings.overall.count > 0) {
      const avg = ratings.overall.sum / ratings.overall.count;
      if (avg > bestOverallRating) {
        bestOverallRating = avg;
        bestOverall = model;
      }
    }
    if (ratings.title.count > 0) {
      const avg = ratings.title.sum / ratings.title.count;
      if (avg > bestTitleRating) {
        bestTitleRating = avg;
        bestTitle = model;
      }
    }
    if (ratings.thumbnail.count > 0) {
      const avg = ratings.thumbnail.sum / ratings.thumbnail.count;
      if (avg > bestThumbnailRating) {
        bestThumbnailRating = avg;
        bestThumbnail = model;
      }
    }
    if (ratings.description.count > 0) {
      const avg = ratings.description.sum / ratings.description.count;
      if (avg > bestDescriptionRating) {
        bestDescriptionRating = avg;
        bestDescription = model;
      }
    }
  }
  return {
    bestOverall: bestOverall || "gpt-4o",
    bestTitle: bestTitle || "gpt-4o",
    bestThumbnail: bestThumbnail || "gpt-4o",
    bestDescription: bestDescription || "gpt-4o"
  };
}
async function resetFavoritePromptRatings(userId, promptType) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  let result;
  if (promptType === "all") {
    result = await db.update(favoritePrompts).set({ rating: null }).where(eq(favoritePrompts.userId, userId));
  } else {
    result = await db.update(favoritePrompts).set({ rating: null }).where(
      and(
        eq(favoritePrompts.userId, userId),
        eq(favoritePrompts.promptType, promptType)
      )
    );
  }
  return result[0]?.affectedRows || 0;
}
async function resetGenerationRatings(userId, generationType) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  let result;
  if (generationType === "all") {
    result = await db.update(aiGenerationHistory).set({ userRating: null }).where(eq(aiGenerationHistory.userId, userId));
  } else {
    const typePatterns = {
      title: ["title_and_thumbnail", "title"],
      thumbnail: ["title_and_thumbnail", "thumbnail"],
      description: ["description_suggestions", "description"],
      strategy: ["strategy"]
    };
    const patterns = typePatterns[generationType] || [];
    result = await db.update(aiGenerationHistory).set({ userRating: null }).where(
      and(
        eq(aiGenerationHistory.userId, userId),
        or(
          ...patterns.map((p) => like(aiGenerationHistory.generationType, `%${p}%`))
        )
      )
    );
  }
  return result[0]?.affectedRows || 0;
}
async function upsertChannelSyncInfo(data) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(channelSyncInfo).values({
    userId: data.userId,
    channelId: data.channelId,
    channelTitle: data.channelTitle,
    videoCount: data.videoCount,
    lastSyncAt: /* @__PURE__ */ new Date()
  }).onDuplicateKeyUpdate({
    set: {
      channelId: data.channelId,
      channelTitle: data.channelTitle,
      videoCount: data.videoCount,
      lastSyncAt: /* @__PURE__ */ new Date()
    }
  });
}
async function getChannelSyncInfo(userId) {
  const db = await getDb();
  if (!db) {
    return null;
  }
  const result = await db.select().from(channelSyncInfo).where(eq(channelSyncInfo.userId, userId)).limit(1);
  return result[0] || null;
}
async function getSavedIdeas(userId, status, ideaType) {
  const db = await getDb();
  if (!db) return [];
  let query = `SELECT * FROM savedIdeas WHERE userId = ?`;
  const params = [userId];
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
  return rows;
}
async function saveIdea(userId, idea) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.execute(
    sql`INSERT INTO savedIdeas (userId, ideaType, title, summary, source, model) VALUES (${userId}, ${idea.ideaType}, ${idea.title}, ${idea.summary || null}, ${idea.source}, ${idea.model || null})`
  );
  return { id: result[0].insertId };
}
async function updateIdeaStatus(id, userId, status) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.execute(
    sql`UPDATE savedIdeas SET status = ${status} WHERE id = ${id} AND userId = ${userId}`
  );
  return { success: true };
}
async function updateIdeaNotes(id, userId, notes) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.execute(
    sql`UPDATE savedIdeas SET notes = ${notes} WHERE id = ${id} AND userId = ${userId}`
  );
  return { success: true };
}
async function deleteIdea(id, userId) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.execute(
    sql`DELETE FROM savedIdeas WHERE id = ${id} AND userId = ${userId}`
  );
  return { success: true };
}
async function saveCompetitorVideo(userId, video) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.execute(
    sql`INSERT INTO competitionAnalysis (userId, keyword, videoId, videoTitle, channelTitle, viewCount, publishedAt, thumbnailUrl, duration, description) 
     VALUES (${userId}, ${video.keyword}, ${video.videoId}, ${video.videoTitle}, ${video.channelTitle || null}, ${video.viewCount || 0}, ${video.publishedAt || null}, ${video.thumbnailUrl || null}, ${video.duration || null}, ${video.description || null})`
  );
  return { id: result[0].insertId };
}
async function getSavedCompetitorVideos(userId, keyword) {
  const db = await getDb();
  if (!db) return [];
  let query = `SELECT * FROM competitionAnalysis WHERE userId = ?`;
  const params = [userId];
  if (keyword) {
    query += ` AND keyword = ?`;
    params.push(keyword);
  }
  query += ` ORDER BY viewCount DESC`;
  const rows = await db.execute(sql.raw(query));
  return rows;
}
var _db, createVariant, updateVariant;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    createVariant = createTestVariant;
    updateVariant = updateTestVariant;
  }
});

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString2, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString2(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString2(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/_core/dataApi.ts
async function callDataApi(apiId, options = {}) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      apiId,
      query: options.query,
      body: options.body,
      path_params: options.pathParams,
      multipart_form_data: options.formData
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload === "object" && "jsonData" in payload) {
    try {
      return JSON.parse(payload.jsonData ?? "{}");
    } catch {
      return payload.jsonData;
    }
  }
  return payload;
}
var init_dataApi = __esm({
  "server/_core/dataApi.ts"() {
    "use strict";
    init_env();
  }
});

// server/youtubeAuth.ts
import { google } from "googleapis";
function getOAuth2Client() {
  return new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    REDIRECT_URI
  );
}
function getAuthUrl(userId) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: String(userId)
    // Pour identifier l'utilisateur après le callback
  });
}
async function handleCallback(code, userId) {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
      console.error("[YouTube OAuth] No access token received");
      return false;
    }
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    let channelId = "";
    let channelTitle = "";
    try {
      const channelsResponse = await youtube.channels.list({
        part: ["snippet"],
        mine: true
      });
      if (channelsResponse.data.items && channelsResponse.data.items.length > 0) {
        const channel = channelsResponse.data.items[0];
        channelId = channel.id || "";
        channelTitle = channel.snippet?.title || "";
      }
    } catch (error) {
      console.error("[YouTube OAuth] Error fetching channel info:", error);
    }
    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1e3);
    await upsertYouTubeConfig({
      userId,
      channelId: channelId || "unknown",
      channelTitle,
      apiKey: "",
      // Pas utilisé pour OAuth, mais requis par le schéma
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry,
      autoSyncEnabled: true
    });
    console.log(`[YouTube OAuth] Tokens saved for user ${userId}, channel: ${channelTitle}`);
    return true;
  } catch (error) {
    console.error("[YouTube OAuth] Error handling callback:", error);
    return false;
  }
}
async function getStoredTokens(userId) {
  const config = await getYouTubeConfig(userId);
  if (!config || !config.accessToken) {
    return null;
  }
  return {
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expiry_date: config.tokenExpiry ? new Date(config.tokenExpiry).getTime() : null
  };
}
async function hasYouTubeAuth(userId) {
  const config = await getYouTubeConfig(userId);
  return !!(config && config.accessToken);
}
async function getAccessToken(userId) {
  const tokens = await getStoredTokens(userId);
  if (!tokens) return null;
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  try {
    const { token } = await oauth2Client.getAccessToken();
    if (token && token !== tokens.access_token) {
      const newTokens = oauth2Client.credentials;
      const tokenExpiry = newTokens.expiry_date ? new Date(newTokens.expiry_date) : new Date(Date.now() + 3600 * 1e3);
      await updateYouTubeTokens(userId, {
        accessToken: newTokens.access_token || tokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refresh_token,
        tokenExpiry
      });
    }
    return token || null;
  } catch (error) {
    console.error("[Auth] Error getting access token:", error);
    return null;
  }
}
async function getAuthenticatedYouTubeService(userId) {
  const tokens = await getStoredTokens(userId);
  if (!tokens) {
    throw new Error("No YouTube authentication found for this user");
  }
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.youtube({
    version: "v3",
    auth: oauth2Client
  });
}
async function revokeYouTubeAuth(userId) {
  try {
    await deleteYouTubeConfig(userId);
    return true;
  } catch (error) {
    console.error("[YouTube OAuth] Error revoking auth:", error);
    return false;
  }
}
var YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, REDIRECT_URI, SCOPES;
var init_youtubeAuth = __esm({
  "server/youtubeAuth.ts"() {
    "use strict";
    init_db();
    YOUTUBE_CLIENT_ID = "1001135783524-uc08clq6b79t30u9bh3e075aob0p7n6r.apps.googleusercontent.com";
    YOUTUBE_CLIENT_SECRET = "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";
    REDIRECT_URI = "https://3000-iubvmisf0l2opkazd8b7w-85ffd521.manusvm.computer/youtube/callback";
    SCOPES = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl"
      // Nécessaire pour télécharger les transcriptions
    ];
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    model,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: model || "gpt-4o",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/scriptWriting.ts
var scriptWriting_exports = {};
__export(scriptWriting_exports, {
  DEFAULT_SCRIPT_COORDINATION_PROMPT: () => DEFAULT_SCRIPT_COORDINATION_PROMPT,
  formatVideosAsCSV: () => formatVideosAsCSV,
  formatVideosForPrompt: () => formatVideosForPrompt,
  generateFullScript: () => generateFullScript,
  getAllInstructionScripts: () => getAllInstructionScripts,
  getChannelVideosForExport: () => getChannelVideosForExport,
  getScriptWritingCoordinationPrompt: () => getScriptWritingCoordinationPrompt,
  saveScriptWritingCoordinationPrompt: () => saveScriptWritingCoordinationPrompt
});
import { eq as eq2, desc as desc2, and as and2 } from "drizzle-orm";
async function getChannelVideosForExport(userId) {
  const db = await getDb();
  if (!db) {
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      averageViews: 0,
      videos: []
    };
  }
  const allVideos = await db.select({
    youtubeId: videos.youtubeId,
    title: videos.title,
    description: videos.description,
    publishedAt: videos.publishedAt,
    duration: videos.duration,
    thumbnail: videos.thumbnailUrl,
    views: videos.viewCount,
    likes: videos.likeCount,
    comments: videos.commentCount
  }).from(videos).where(eq2(videos.userId, userId)).orderBy(desc2(videos.publishedAt));
  const videoExports = allVideos.map((v) => ({
    youtubeId: v.youtubeId,
    title: v.title,
    description: v.description,
    views: v.views || 0,
    likes: v.likes || 0,
    comments: v.comments || 0,
    publishedAt: v.publishedAt,
    duration: v.duration,
    thumbnail: v.thumbnail
  }));
  const totalViews = videoExports.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videoExports.reduce((sum, v) => sum + v.likes, 0);
  const totalComments = videoExports.reduce((sum, v) => sum + v.comments, 0);
  return {
    totalVideos: videoExports.length,
    totalViews,
    totalLikes,
    totalComments,
    averageViews: videoExports.length > 0 ? Math.round(totalViews / videoExports.length) : 0,
    videos: videoExports
  };
}
function formatVideosAsCSV(data) {
  const headers = ["YouTube ID", "Titre", "Description", "Vues", "Likes", "Commentaires", "Date de publication", "Dur\xE9e"];
  const rows = data.videos.map((v) => [
    v.youtubeId,
    `"${(v.title || "").replace(/"/g, '""')}"`,
    `"${(v.description || "").replace(/"/g, '""').substring(0, 500)}"`,
    v.views.toString(),
    v.likes.toString(),
    v.comments.toString(),
    v.publishedAt ? new Date(v.publishedAt).toISOString().split("T")[0] : "",
    v.duration || ""
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
function formatVideosForPrompt(data) {
  const lines = data.videos.slice(0, 50).map((v, i) => {
    return `${i + 1}. "${v.title}" - ${v.views.toLocaleString("fr-FR")} vues, ${v.likes.toLocaleString("fr-FR")} likes`;
  });
  return `## STATISTIQUES DE LA CHA\xCENE
- Total vid\xE9os: ${data.totalVideos}
- Total vues: ${data.totalViews.toLocaleString("fr-FR")}
- Moyenne vues/vid\xE9o: ${data.averageViews.toLocaleString("fr-FR")}

## TOP 50 VID\xC9OS (par date)
${lines.join("\n")}`;
}
async function getAllInstructionScripts(userId) {
  const db = await getDb();
  if (!db) return {};
  const scriptTypes = [
    "channel_analysis",
    "title_guide",
    "description_guide",
    "script_analysis",
    "thumbnail_mechanics",
    "midjourney_prompts"
  ];
  const scripts = {};
  for (const scriptType of scriptTypes) {
    const result = await db.select().from(instructionScripts).where(
      and2(
        eq2(instructionScripts.userId, userId),
        eq2(instructionScripts.scriptType, scriptType),
        eq2(instructionScripts.isActive, true)
      )
    ).orderBy(desc2(instructionScripts.version)).limit(1);
    if (result.length > 0) {
      scripts[scriptType] = result[0].content;
    }
  }
  return scripts;
}
async function generateFullScript(userId, input) {
  const instructionScriptsData = await getAllInstructionScripts(userId);
  const channelData = await getChannelVideosForExport(userId);
  const channelVideosFormatted = formatVideosForPrompt(channelData);
  let prompt = input.coordinationPrompt || DEFAULT_SCRIPT_COORDINATION_PROMPT;
  prompt = prompt.replaceAll("<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>", instructionScriptsData.channel_analysis || "Guide non disponible");
  prompt = prompt.replaceAll("<<<GUIDE_TITRE>>>", instructionScriptsData.title_guide || "Guide non disponible");
  prompt = prompt.replaceAll("<<<GUIDE_META_AB_TEST>>>", instructionScriptsData.script_analysis || "Guide non disponible");
  prompt = prompt.replaceAll("<<<GUIDE_MINIATURES>>>", instructionScriptsData.thumbnail_mechanics || "Guide non disponible");
  prompt = prompt.replaceAll("<<<GUIDE_PROMPTS_MIDJOURNEY>>>", instructionScriptsData.midjourney_prompts || "Guide non disponible");
  prompt = prompt.replaceAll("<<<GUIDE_DESCRIPTION>>>", instructionScriptsData.description_guide || "Guide non disponible");
  prompt = prompt.replaceAll("{{channel_videos_data}}", channelVideosFormatted);
  prompt = prompt.replaceAll("{{script_topic}}", input.topic);
  prompt = prompt.replaceAll("{{custom_instructions}}", input.customInstructions || "Aucune instruction suppl\xE9mentaire");
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en \xE9criture de scripts YouTube. Tu g\xE9n\xE8res des scripts complets, engageants et optimis\xE9s pour la r\xE9tention d'audience. \xC9cris toujours en fran\xE7ais."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });
  const messageContent = response.choices[0]?.message?.content;
  const script = typeof messageContent === "string" ? messageContent : "";
  const wordCount = script.split(/\s+/).filter((word) => word.length > 0).length;
  const sectionRegex = /\[(ACCROCHE|CONTEXTE|SECTION \d+|CLIMAX|CONCLUSION|CTA)\]/g;
  const sections = [];
  let match;
  while ((match = sectionRegex.exec(script)) !== null) {
    sections.push(match[1]);
  }
  return {
    script,
    wordCount,
    sections: sections.length > 0 ? sections : ["Script g\xE9n\xE9r\xE9 sans sections marqu\xE9es"]
  };
}
async function getScriptWritingCoordinationPrompt(userId) {
  const db = await getDb();
  if (!db) return DEFAULT_SCRIPT_COORDINATION_PROMPT;
  const result = await db.select().from(coordinationScripts).where(
    and2(
      eq2(coordinationScripts.userId, userId),
      eq2(coordinationScripts.scriptType, "strategy_generation")
    )
  ).limit(1);
  if (result.length > 0) {
    return result[0].content;
  }
  return DEFAULT_SCRIPT_COORDINATION_PROMPT;
}
async function saveScriptWritingCoordinationPrompt(userId, content) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(coordinationScripts).where(
    and2(
      eq2(coordinationScripts.userId, userId),
      eq2(coordinationScripts.scriptType, "strategy_generation")
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(coordinationScripts).set({ content, createdAt: /* @__PURE__ */ new Date() }).where(
      and2(
        eq2(coordinationScripts.userId, userId),
        eq2(coordinationScripts.scriptType, "strategy_generation")
      )
    );
  } else {
    await db.insert(coordinationScripts).values({
      userId,
      scriptType: "script_writing",
      version: 1,
      content
    });
  }
}
var DEFAULT_SCRIPT_COORDINATION_PROMPT;
var init_scriptWriting = __esm({
  "server/scriptWriting.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_llm();
    DEFAULT_SCRIPT_COORDINATION_PROMPT = `# SCRIPT DE COORDINATION - \xC9CRITURE DE SCRIPT YOUTUBE (5000-6000 MOTS)

Tu es un expert en \xE9criture de scripts YouTube. Tu vas cr\xE9er un script complet et engageant de 5000 \xE0 6000 mots.

## CONTEXTE DE LA CHA\xCENE
<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>

## GUIDE DES TITRES
<<<GUIDE_TITRE>>>

## GUIDE D'\xC9CRITURE DE SCRIPTS
<<<GUIDE_META_AB_TEST>>>

## DONN\xC9ES DE LA CHA\xCENE
{{channel_videos_data}}

## SUJET DU SCRIPT
{{script_topic}}

## INSTRUCTIONS PERSONNALIS\xC9ES
{{custom_instructions}}

---

# STRUCTURE DU SCRIPT (5000-6000 mots)

## PHASE 1: ACCROCHE (300-500 mots)
L'accroche doit captiver imm\xE9diatement. Utilise une des techniques suivantes:
- Question provocante qui remet en question une croyance
- Statistique choquante ou contre-intuitive
- Histoire personnelle ou anecdote captivante
- Promesse de valeur claire et sp\xE9cifique
- Teaser du contenu le plus impactant

## PHASE 2: CONTEXTE ET ENJEUX (500-800 mots)
- Explique pourquoi ce sujet est important maintenant
- Pr\xE9sente les enjeux pour le spectateur
- \xC9tablis ta cr\xE9dibilit\xE9 sur le sujet
- Cr\xE9e un sentiment d'urgence ou de curiosit\xE9

## PHASE 3: D\xC9VELOPPEMENT PRINCIPAL (3000-3500 mots)
Divise en 3-5 sections principales avec:
- Des sous-titres clairs et engageants
- Des exemples concrets et des \xE9tudes de cas
- Des transitions fluides entre les sections
- Des moments de r\xE9capitulation
- Des "pattern interrupts" pour maintenir l'attention

## PHASE 4: CLIMAX ET R\xC9V\xC9LATION (500-700 mots)
- Le moment le plus impactant du script
- La r\xE9v\xE9lation principale ou l'insight cl\xE9
- L'application pratique imm\xE9diate

## PHASE 5: CONCLUSION ET CALL-TO-ACTION (300-500 mots)
- R\xE9capitulation des points cl\xE9s
- Call-to-action clair (like, subscribe, commentaire)
- Teaser pour la prochaine vid\xE9o
- Fin m\xE9morable

---

# R\xC8GLES D'\xC9CRITURE

1. **Langage conversationnel**: \xC9cris comme tu parles, utilise "tu" et "je"
2. **Phrases courtes**: Maximum 20 mots par phrase en moyenne
3. **Paragraphes courts**: 2-3 phrases maximum
4. **Mots de transition**: "Mais", "Et", "Donc", "Parce que", "En fait"
5. **Questions rh\xE9toriques**: Engage le spectateur r\xE9guli\xE8rement
6. **R\xE9p\xE9tition strat\xE9gique**: R\xE9p\xE8te les concepts cl\xE9s 3 fois
7. **Storytelling**: Int\xE8gre des histoires et anecdotes
8. **Donn\xE9es et preuves**: Appuie tes arguments avec des faits
9. **Humour dos\xE9**: Ajoute de l'humour quand appropri\xE9
10. **\xC9motion**: Fais ressentir quelque chose au spectateur

---

# FORMAT DE SORTIE

G\xE9n\xE8re le script complet avec:
- [ACCROCHE] pour marquer le d\xE9but de l'accroche
- [CONTEXTE] pour le contexte
- [SECTION 1], [SECTION 2], etc. pour les sections principales
- [CLIMAX] pour le climax
- [CONCLUSION] pour la conclusion
- [CTA] pour le call-to-action

Inclus \xE9galement:
- Des indications de ton entre parenth\xE8ses (enthousiaste), (s\xE9rieux), (humoristique)
- Des pauses sugg\xE9r\xE9es avec [PAUSE]
- Des moments de B-roll sugg\xE9r\xE9s avec [B-ROLL: description]

---

G\xC9N\xC8RE MAINTENANT LE SCRIPT COMPLET:`;
  }
});

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/exportPDF.ts
var exportPDF_exports = {};
__export(exportPDF_exports, {
  generateTestReportPDF: () => generateTestReportPDF
});
import PDFDocument from "pdfkit";
async function generateTestReportPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.fontSize(24).font("Helvetica-Bold").text("Rapport de Test A/B", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).font("Helvetica-Bold").text("Informations du Test");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");
      doc.text(`Nom: ${data.test.name}`);
      doc.text(`Type: ${data.test.type}`);
      doc.text(`Statut: ${data.test.status}`);
      if (data.test.description) {
        doc.text(`Description: ${data.test.description}`);
      }
      doc.text(`Cr\xE9\xE9 le: ${new Date(data.test.createdAt).toLocaleDateString("fr-FR")}`);
      if (data.test.startDate) {
        doc.text(`Date de d\xE9but: ${new Date(data.test.startDate).toLocaleDateString("fr-FR")}`);
      }
      if (data.test.endDate) {
        doc.text(`Date de fin: ${new Date(data.test.endDate).toLocaleDateString("fr-FR")}`);
      }
      doc.moveDown(2);
      doc.fontSize(16).font("Helvetica-Bold").text("Performance des Variantes");
      doc.moveDown(0.5);
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [180, 70, 70, 70, 70];
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Variante", tableLeft, tableTop);
      doc.text("Vues", tableLeft + colWidths[0], tableTop);
      doc.text("Watch %", tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text("Likes", tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.text("Comments", tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
      doc.moveTo(tableLeft, tableTop + 15).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15).stroke();
      let currentY = tableTop + 25;
      doc.font("Helvetica");
      data.variants.forEach((variant) => {
        const watchTimePercent = variant.watchTimePercentage ? `${variant.watchTimePercentage}%` : "0%";
        const variantName = variant.isControl ? `${variant.title} (Contr\xF4le)` : variant.title;
        doc.text(variantName.substring(0, 35), tableLeft, currentY, { width: colWidths[0] - 10 });
        doc.text((variant.views || 0).toLocaleString(), tableLeft + colWidths[0], currentY);
        doc.text(watchTimePercent, tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text((variant.likes || 0).toLocaleString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        doc.text((variant.comments || 0).toLocaleString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY);
        currentY += 30;
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      });
      doc.moveDown(3);
      if (data.test.winnerId) {
        const winner = data.variants.find((v) => v.id === data.test.winnerId);
        if (winner) {
          doc.fontSize(14).font("Helvetica-Bold").fillColor("#10b981").text("\u{1F3C6} Variante Gagnante");
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica").fillColor("#000000");
          doc.text(`Titre: ${winner.title}`);
          doc.text(`Watch Time: ${winner.watchTimePercentage ? `${winner.watchTimePercentage}%` : "0%"}`);
          doc.text(`Vues: ${(winner.views || 0).toLocaleString()}`);
          doc.text(`Likes: ${(winner.likes || 0).toLocaleString()}`);
        }
      }
      doc.moveDown(3);
      doc.fontSize(14).font("Helvetica-Bold").text("Statistiques Globales");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");
      const totalViews = data.variants.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = data.variants.reduce((sum, v) => sum + (v.likes || 0), 0);
      const totalComments = data.variants.reduce((sum, v) => sum + (v.comments || 0), 0);
      const totalWatchTime = data.variants.reduce((sum, v) => sum + (v.watchTimeMinutes || 0), 0);
      doc.text(`Total Vues: ${totalViews.toLocaleString()}`);
      doc.text(`Total Likes: ${totalLikes.toLocaleString()}`);
      doc.text(`Total Commentaires: ${totalComments.toLocaleString()}`);
      doc.text(`Watch Time Total: ${totalWatchTime.toLocaleString()} minutes`);
      doc.text(`Nombre de Variantes: ${data.variants.length}`);
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(
        `Rapport g\xE9n\xE9r\xE9 le ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR")} \xE0 ${(/* @__PURE__ */ new Date()).toLocaleTimeString("fr-FR")}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
var init_exportPDF = __esm({
  "server/exportPDF.ts"() {
    "use strict";
  }
});

// server/scriptHelpers.ts
var scriptHelpers_exports = {};
__export(scriptHelpers_exports, {
  getLatestCoordinationScript: () => getLatestCoordinationScript,
  getLatestInstructionScript: () => getLatestInstructionScript,
  replaceScriptTags: () => replaceScriptTags
});
import mysql from "mysql2/promise";
async function getLatestInstructionScript(userId, scriptType) {
  if (!DATABASE_URL) {
    console.warn("[scriptHelpers] DATABASE_URL not configured");
    return null;
  }
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const [rows] = await connection.execute(
      `SELECT content FROM instructionScripts 
       WHERE userId = ? AND scriptType = ? 
       ORDER BY version DESC 
       LIMIT 1`,
      [userId, scriptType]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return { content: rows[0].content };
    }
    return null;
  } catch (error) {
    console.error(`[scriptHelpers] Error fetching instruction script ${scriptType}:`, error);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
async function getLatestCoordinationScript(userId, scriptType) {
  if (!DATABASE_URL) {
    console.warn("[scriptHelpers] DATABASE_URL not configured");
    return null;
  }
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const [rows] = await connection.execute(
      `SELECT content FROM coordinationScripts 
       WHERE userId = ? AND scriptType = ? 
       ORDER BY version DESC 
       LIMIT 1`,
      [userId, scriptType]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return { content: rows[0].content };
    }
    return null;
  } catch (error) {
    console.error(`[scriptHelpers] Error fetching coordination script ${scriptType}:`, error);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
function replaceScriptTags(script, variables) {
  let result = script;
  for (const [key, value] of Object.entries(variables)) {
    const tag = `{{${key}}}`;
    result = result.replace(new RegExp(tag, "g"), value || "");
  }
  return result;
}
var DATABASE_URL;
var init_scriptHelpers = __esm({
  "server/scriptHelpers.ts"() {
    "use strict";
    DATABASE_URL = process.env.DATABASE_URL;
  }
});

// server/openai.ts
var openai_exports = {};
__export(openai_exports, {
  generateStrategy: () => generateStrategy,
  generateSuggestions: () => generateSuggestions
});
function truncateText(text2, maxTokens = 15e3) {
  const maxChars = maxTokens * 4;
  if (text2.length <= maxChars) {
    return text2;
  }
  return text2.substring(0, maxChars) + "\n\n[... transcription tronqu\xE9e pour respecter les limites de l'API ...]";
}
function mapModelName(model) {
  const modelMap = {
    // GPT-5 series - map to exact names from OpenAI API
    "gpt-5": "gpt-5",
    "gpt-5-pro": "gpt-5.2-pro",
    // User selects "gpt-5-pro" but API uses "gpt-5.2-pro"
    // O1 series - use exact names from OpenAI API
    "o1": "o1",
    "o1-mini": "o1-mini",
    // GPT-4o series
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini"
  };
  return modelMap[model] || model;
}
function isO1Model(model) {
  return model.startsWith("o1");
}
function isGPT5Model(model) {
  return model.startsWith("gpt-5") || model === "gpt-5.2-pro";
}
async function callOpenAIResponses(messages, model = "gpt-5-pro", temperature = 0.7, maxTokens = 2e3) {
  if (!OPENAI_API_KEY) {
    throw new Error("La cl\xE9 API OpenAI n'est pas configur\xE9e.");
  }
  try {
    const systemMessage = messages.find((msg) => msg.role === "system");
    const userMessages = messages.filter((msg) => msg.role !== "system");
    const input = userMessages.map((msg) => msg.content).join("\n\n");
    const requestBody = {
      model,
      input,
      max_output_tokens: maxTokens
    };
    if (model !== "gpt-5.2-pro") {
      requestBody.temperature = temperature;
    }
    if (systemMessage) {
      requestBody.instructions = systemMessage.content;
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      let errorMsg = `Erreur API OpenAI Responses (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg += ": " + errorData.error.message;
        }
      } catch (e) {
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    console.log("[OpenAI Responses API] Full response:", JSON.stringify(data, null, 2));
    if (!data.output_items || !Array.isArray(data.output_items) || data.output_items.length === 0) {
      console.error("[OpenAI Responses API] Invalid output_items:", data.output_items);
      throw new Error("Aucune r\xE9ponse re\xE7ue de l'API OpenAI Responses");
    }
    const outputItem = data.output_items[0];
    console.log("[OpenAI Responses API] First output item:", JSON.stringify(outputItem, null, 2));
    if (!outputItem) {
      throw new Error("Premier \xE9l\xE9ment de output_items est undefined");
    }
    if (outputItem.type === "message" && outputItem.content) {
      if (!Array.isArray(outputItem.content)) {
        console.error("[OpenAI Responses API] content is not an array:", outputItem.content);
        throw new Error("Format de contenu inattendu (content n'est pas un tableau)");
      }
      const textContent = outputItem.content.find((c) => c && c.type === "text");
      if (textContent && textContent.text) {
        return textContent.text.trim();
      }
      console.error("[OpenAI Responses API] No text content found in:", outputItem.content);
      throw new Error("Aucun contenu texte trouv\xE9 dans la r\xE9ponse");
    }
    console.error("[OpenAI Responses API] Unexpected output item structure:", outputItem);
    throw new Error(`Format de r\xE9ponse inattendu de l'API OpenAI Responses (type: ${outputItem?.type})`);
  } catch (error) {
    console.error("Error calling OpenAI Responses API:", error);
    throw error;
  }
}
async function callOpenAIChat(messages, model = "gpt-4o", temperature = 0.7, maxTokens = 2e3) {
  if (!OPENAI_API_KEY) {
    throw new Error("La cl\xE9 API OpenAI n'est pas configur\xE9e.");
  }
  try {
    const apiModel = mapModelName(model);
    if (apiModel === "gpt-5.2-pro") {
      return callOpenAIResponses(messages, apiModel, temperature, maxTokens);
    }
    const isO1 = isO1Model(apiModel);
    const requestBody = {
      model: apiModel,
      messages: isO1 ? messages.map((msg) => ({
        role: msg.role === "system" ? "user" : msg.role,
        content: msg.content
      })) : messages
    };
    const isGPT5 = isGPT5Model(apiModel);
    if (!isO1) {
      if (!isGPT5) {
        requestBody.temperature = temperature;
      }
      if (isGPT5) {
        requestBody.max_completion_tokens = maxTokens;
      } else {
        requestBody.max_tokens = maxTokens;
      }
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      let errorMsg = `Erreur API OpenAI (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg += ": " + errorData.error.message;
        }
      } catch (e) {
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    console.log("[OpenAI Chat API] Model:", apiModel);
    console.log("[OpenAI Chat API] Response:", JSON.stringify(data, null, 2));
    if (!data.choices || data.choices.length === 0) {
      console.error("[OpenAI Chat API] No choices in response");
      throw new Error("Aucune r\xE9ponse re\xE7ue de l'API OpenAI");
    }
    const content = data.choices[0].message.content;
    console.log("[OpenAI Chat API] Content:", content);
    return content ? content.trim() : "";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
async function generateStrategy(variables) {
  try {
    const { getLatestCoordinationScript: getLatestCoordinationScript2, replaceScriptTags: replaceScriptTags3 } = await Promise.resolve().then(() => (init_scriptHelpers(), scriptHelpers_exports));
    const truncatedTranscript = truncateText(variables.video_transcript, 15e3);
    let userMessage = "";
    if (variables.userId) {
      const script = await getLatestCoordinationScript2(variables.userId, "strategy_generation");
      if (script) {
        userMessage = replaceScriptTags3(script.content, {
          video_transcript: truncatedTranscript,
          ab_test_report: variables.ab_test_report,
          current_channel_titles: variables.current_channel_titles || ""
        });
      }
    }
    if (!userMessage) {
      userMessage = `Vous \xEAtes un expert en optimisation YouTube. Analysez la transcription vid\xE9o et le rapport de tests A/B suivants pour g\xE9n\xE9rer une strat\xE9gie d'optimisation d\xE9taill\xE9e.

TRANSCRIPTION DE LA VID\xC9O:
${truncatedTranscript}

RAPPORT DES TESTS A/B:
${variables.ab_test_report}

G\xE9n\xE9rez une strat\xE9gie d'optimisation compl\xE8te qui:
1. Identifie les th\xE8mes et angles qui fonctionnent le mieux
2. Analyse les patterns de performance dans les tests A/B
3. Recommande des directions sp\xE9cifiques pour les prochains tests
4. Sugg\xE8re des am\xE9liorations bas\xE9es sur les donn\xE9es

Soyez pr\xE9cis et actionnable dans vos recommandations.`;
    }
    const model = variables.model || "gpt-4o";
    const maxTokens = model.startsWith("gpt-5") || model.startsWith("o1") ? 16e3 : 2e3;
    const response = await callOpenAIChat(
      [{ role: "user", content: userMessage }],
      model,
      0.7,
      maxTokens
    );
    return { success: true, data: response };
  } catch (error) {
    console.error("Error generating strategy:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la g\xE9n\xE9ration de la strat\xE9gie."
    };
  }
}
async function generateSuggestions(variables) {
  try {
    const truncatedTranscript = truncateText(variables.video_transcript, 15e3);
    const userMessage = `Vous \xEAtes un expert en optimisation YouTube. Bas\xE9 sur la transcription, le rapport A/B et la strat\xE9gie suivante, g\xE9n\xE9rez des suggestions d'optimisation.

TRANSCRIPTION:
${truncatedTranscript}

RAPPORT A/B:
${variables.ab_test_report}

STRAT\xC9GIE:
${variables.strategy_summary}

G\xE9n\xE9rez un JSON avec le format EXACT suivant (ne rien ajouter avant ou apr\xE8s le JSON):
{
  "video_title_suggestions": [
    {
      "rank": 1,
      "title": "Titre optimis\xE9 qui capte l'attention"
    },
    {
      "rank": 2,
      "title": "Deuxi\xE8me titre alternatif"
    },
    {
      "rank": 3,
      "title": "Troisi\xE8me titre alternatif"
    }
  ],
  "thumbnail_suggestions": [
    {
      "rank": 1,
      "thumbnail_title_variants": ["Texte court 1", "Texte court 2", "Texte court 3"],
      "midjourney_prompt_variants": [
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 1",
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 2",
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 3"
      ]
    },
    {
      "rank": 2,
      "thumbnail_title_variants": ["Texte court 1", "Texte court 2", "Texte court 3"],
      "midjourney_prompt_variants": [
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 1",
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 2",
        "Prompt Midjourney d\xE9taill\xE9 pour miniature 3"
      ]
    }
  ]
}

IMPORTANT: Retournez UNIQUEMENT le JSON, sans texte avant ou apr\xE8s.`;
    const model = variables.model || "gpt-4o";
    const maxTokens = model.startsWith("gpt-5") || model.startsWith("o1") ? 16e3 : 4e3;
    const response = await callOpenAIChat(
      [{ role: "user", content: userMessage }],
      model,
      0.7,
      maxTokens
    );
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: "La r\xE9ponse de l'IA n'\xE9tait pas un JSON valide."
      };
    }
    const suggestions = JSON.parse(jsonMatch[0]);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la g\xE9n\xE9ration des suggestions."
    };
  }
}
var OPENAI_API_KEY;
var init_openai = __esm({
  "server/openai.ts"() {
    "use strict";
    OPENAI_API_KEY = "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";
  }
});

// server/abTestReport.ts
var abTestReport_exports = {};
__export(abTestReport_exports, {
  formatReportForDownload: () => formatReportForDownload,
  generateABTestReport: () => generateABTestReport
});
async function generateABTestReport(videoId, userId) {
  const tests = await getTestsByVideoId(videoId, userId);
  if (tests.length === 0) {
    return "Aucun test A/B n'a encore \xE9t\xE9 r\xE9alis\xE9 pour cette vid\xE9o.";
  }
  const testsWithVariants = [];
  for (const test of tests) {
    const variants = await getVariantsByTestId(test.id, userId);
    testsWithVariants.push({ test, variants });
  }
  let report = `RAPPORT D'A/B TESTING - ${tests.length} test(s) r\xE9alis\xE9(s)

`;
  report += `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

`;
  for (let i = 0; i < testsWithVariants.length; i++) {
    const { test, variants } = testsWithVariants[i];
    report += `TEST #${i + 1}: ${test.name}
`;
    report += `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`;
    report += `Type: ${test.type} | Variante: ${test.variantType}
`;
    if (test.description) {
      report += `Description: ${test.description}
`;
    }
    report += `Statut: ${test.status}
`;
    if (test.startDate) {
      report += `P\xE9riode: ${new Date(test.startDate).toLocaleDateString("fr-FR")}`;
      if (test.endDate) {
        report += ` \u2192 ${new Date(test.endDate).toLocaleDateString("fr-FR")}`;
      }
      report += `
`;
    }
    report += `
`;
    report += `VARIANTES TEST\xC9ES (${variants.length}):

`;
    const sortedVariants = [...variants].sort((a, b) => {
      if (b.watchTimePercentage !== a.watchTimePercentage) {
        return (b.watchTimePercentage || 0) - (a.watchTimePercentage || 0);
      }
      return Number(b.views || 0) - Number(a.views || 0);
    });
    for (let j = 0; j < sortedVariants.length; j++) {
      const variant = sortedVariants[j];
      const isWinner = test.winnerId === variant.id;
      const isControl = variant.isControl;
      report += `  ${j + 1}. ${variant.title}`;
      if (isWinner) report += ` [GAGNANT]`;
      if (isControl) report += ` [CONTR\xD4LE]`;
      report += `
`;
      const watchTimePercent = variant.watchTimePercentage ? `${variant.watchTimePercentage}%` : "N/A";
      const avgDuration = variant.averageViewDuration ? `${Math.floor(variant.averageViewDuration / 60)}:${String(variant.averageViewDuration % 60).padStart(2, "0")}` : "N/A";
      const watchTime = variant.watchTimeMinutes ? `${variant.watchTimeMinutes} min` : "N/A";
      report += `     \u2022 Vues: ${variant.views || 0} | Likes: ${variant.likes || 0} | Commentaires: ${variant.comments || 0}
`;
      report += `     \u2022 R\xE9partition Watch Time: ${watchTimePercent} | Watch Time Total: ${watchTime}
`;
      report += `     \u2022 Dur\xE9e moyenne: ${avgDuration}
`;
      if (variant.thumbnailTitle) {
        report += `     \u2022 Texte miniature: "${variant.thumbnailTitle}"
`;
      }
      report += `
`;
    }
    if (test.winnerId) {
      const winner = variants.find((v) => v.id === test.winnerId);
      if (winner) {
        report += `R\xC9SULTAT: Le titre gagnant est "${winner.title}"
`;
        const control = variants.find((v) => v.isControl);
        if (control && winner.id !== control.id) {
          const watchTimeImprovement = winner.watchTimePercentage && control.watchTimePercentage ? ((winner.watchTimePercentage - control.watchTimePercentage) / control.watchTimePercentage * 100).toFixed(1) : null;
          if (watchTimeImprovement) {
            report += `Am\xE9lioration du Watch Time: ${watchTimeImprovement}% vs contr\xF4le
`;
          }
        }
      }
    }
    report += `
`;
    if (i < testsWithVariants.length - 1) {
      report += `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

`;
    }
  }
  report += `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
  report += `ANALYSE GLOBALE:

`;
  const allVariants = testsWithVariants.flatMap((t2) => t2.variants);
  const winners = testsWithVariants.filter((t2) => t2.test.winnerId).map((t2) => t2.variants.find((v) => v.id === t2.test.winnerId)).filter(Boolean);
  if (winners.length > 0) {
    report += `Nombre de tests compl\xE9t\xE9s: ${winners.length}
`;
    report += `
TITRES GAGNANTS (par ordre chronologique):
`;
    winners.forEach((winner, idx) => {
      report += `${idx + 1}. "${winner.title}"
`;
    });
  }
  report += `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
  return report;
}
function formatReportForDownload(report, videoTitle) {
  const header = `RAPPORT D'A/B TESTING
Vid\xE9o: ${videoTitle}
Date d'export: ${(/* @__PURE__ */ new Date()).toLocaleString("fr-FR")}

`;
  return header + report;
}
var init_abTestReport = __esm({
  "server/abTestReport.ts"() {
    "use strict";
    init_db();
  }
});

// server/channelTitles.ts
var channelTitles_exports = {};
__export(channelTitles_exports, {
  fetchChannelTitles: () => fetchChannelTitles,
  formatChannelTitlesForPrompt: () => formatChannelTitlesForPrompt
});
async function fetchChannelTitles(channelId) {
  const titles = [];
  try {
    let cursor;
    let fetchedCount = 0;
    const maxVideos = 200;
    const oneYearAgo = /* @__PURE__ */ new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    console.log(`[ChannelTitles] Fetching titles for channel: ${channelId} (last 1 year)`);
    do {
      const queryParams = {
        id: channelId,
        filter: "videos_latest",
        hl: "en",
        gl: "US"
      };
      if (cursor) {
        queryParams.cursor = cursor;
      }
      const result = await callDataApi("Youtube/get_channel_videos", {
        query: queryParams
      });
      if (!result || !result.contents) {
        console.log("[ChannelTitles] No more videos found");
        break;
      }
      const contents = result.contents;
      for (const item of contents) {
        if (item.type === "video" && item.video) {
          const video = item.video;
          const videoId = video.videoId;
          const lengthSeconds = video.lengthSeconds || 0;
          if (lengthSeconds < 60) continue;
          const titleData = {
            videoId,
            title: video.title || "",
            publishedAt: video.publishedTimeText || "",
            viewCount: parseInt(String(video.stats?.views || "0"))
          };
          titles.push(titleData);
          fetchedCount++;
          if (fetchedCount >= maxVideos) break;
        }
      }
      cursor = result.cursorNext;
    } while (cursor && fetchedCount < maxVideos);
    console.log(`[ChannelTitles] Successfully fetched ${titles.length} titles`);
    return titles;
  } catch (error) {
    console.error("[ChannelTitles] Error fetching titles:", error);
    throw error;
  }
}
function formatChannelTitlesForPrompt(titles) {
  if (titles.length === 0) {
    return "Aucun titre de cha\xEEne disponible.";
  }
  const sortedTitles = [...titles].sort((a, b) => b.viewCount - a.viewCount);
  let report = `=== RAPPORT DES TITRES ACTUELS DE LA CHA\xCENE ===

`;
  report += `Ce rapport pr\xE9sente les ${sortedTitles.length} titres actuels de la cha\xEEne YouTube.
`;
  report += `Ces titres repr\xE9sentent les tendances actuelles et les formulations qui fonctionnent en ce moment.
`;
  report += `Ils sont tri\xE9s par nombre de vues (les plus performants en premier).

`;
  report += `IMPORTANT: Ces titres sont le r\xE9sultat d'A/B testing continu. Ils refl\xE8tent les tendances actuelles
`;
  report += `et les formulations qui g\xE9n\xE8rent le plus de clics. Utilisez-les comme r\xE9f\xE9rence pour comprendre
`;
  report += `ce qui fonctionne actuellement sur la cha\xEEne.

`;
  report += `--- LISTE DES TITRES (tri\xE9s par performance) ---

`;
  sortedTitles.forEach((title, index) => {
    const viewsFormatted = title.viewCount.toLocaleString("fr-FR");
    report += `${index + 1}. "${title.title}"
`;
    report += `   Vues: ${viewsFormatted} | Publi\xE9: ${title.publishedAt}

`;
  });
  report += `
--- ANALYSE DES PATTERNS ---

`;
  const wordFrequency = {};
  sortedTitles.forEach((t2) => {
    const words = t2.title.toLowerCase().replace(/[^\w\sàâäéèêëïîôùûüç]/g, "").split(/\s+/).filter((w) => w.length > 3);
    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordFrequency).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([word, count]) => `"${word}" (${count}x)`);
  report += `Mots-cl\xE9s les plus fr\xE9quents: ${topWords.join(", ")}

`;
  const hasQuestion = sortedTitles.filter((t2) => t2.title.includes("?")).length;
  const hasExclamation = sortedTitles.filter((t2) => t2.title.includes("!")).length;
  const hasPoints = sortedTitles.filter((t2) => t2.title.includes("...")).length;
  const hasMajuscules = sortedTitles.filter((t2) => /[A-Z]{2,}/.test(t2.title)).length;
  report += `Structures utilis\xE9es:
`;
  report += `- Questions (?) : ${hasQuestion} titres (${Math.round(hasQuestion / sortedTitles.length * 100)}%)
`;
  report += `- Exclamations (!) : ${hasExclamation} titres (${Math.round(hasExclamation / sortedTitles.length * 100)}%)
`;
  report += `- Suspense (...) : ${hasPoints} titres (${Math.round(hasPoints / sortedTitles.length * 100)}%)
`;
  report += `- Majuscules d'emphase : ${hasMajuscules} titres (${Math.round(hasMajuscules / sortedTitles.length * 100)}%)
`;
  return report;
}
var init_channelTitles = __esm({
  "server/channelTitles.ts"() {
    "use strict";
    init_dataApi();
  }
});

// server/coordinationScripts.ts
var coordinationScripts_exports = {};
__export(coordinationScripts_exports, {
  getCoordinationScript: () => getCoordinationScript,
  replaceScriptTags: () => replaceScriptTags2,
  upsertCoordinationScript: () => upsertCoordinationScript
});
import { eq as eq7, and as and5, desc as desc4 } from "drizzle-orm";
async function upsertCoordinationScript(userId, scriptType, content) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const existing = await db.select().from(coordinationScripts).where(
    and5(
      eq7(coordinationScripts.userId, userId),
      eq7(coordinationScripts.scriptType, scriptType)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(coordinationScripts).set({ content, createdAt: /* @__PURE__ */ new Date() }).where(
      and5(
        eq7(coordinationScripts.userId, userId),
        eq7(coordinationScripts.scriptType, scriptType)
      )
    );
  } else {
    await db.insert(coordinationScripts).values({
      userId,
      scriptType,
      version: 1,
      // Always version 1 (no versioning)
      content
    });
  }
}
async function getCoordinationScript(userId, scriptType) {
  const db = await getDb();
  if (!db) {
    return null;
  }
  const result = await db.select().from(coordinationScripts).where(
    and5(
      eq7(coordinationScripts.userId, userId),
      eq7(coordinationScripts.scriptType, scriptType)
    )
  ).orderBy(desc4(coordinationScripts.version)).limit(1);
  if (result.length > 0) {
    return result[0];
  }
  if (userId !== DEFAULT_SCRIPTS_USER_ID) {
    const defaultResult = await db.select().from(coordinationScripts).where(
      and5(
        eq7(coordinationScripts.userId, DEFAULT_SCRIPTS_USER_ID),
        eq7(coordinationScripts.scriptType, scriptType)
      )
    ).orderBy(desc4(coordinationScripts.version)).limit(1);
    if (defaultResult.length > 0) {
      return defaultResult[0];
    }
  }
  return null;
}
async function replaceScriptTags2(scriptContent, replacements) {
  let result = scriptContent;
  const guideTagMapping = {
    "GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY": "guide_channel_analysis",
    "GUIDE_TITRE": "guide_title",
    "GUIDE_META_AB_TEST": "guide_script_analysis",
    "GUIDE_MINIATURES": "guide_thumbnail_mechanics",
    "GUIDE_PROMPTS_MIDJOURNEY": "guide_midjourney_prompts",
    "GUIDE_DESCRIPTION": "guide_description"
  };
  for (const [guideTag, replacementKey] of Object.entries(guideTagMapping)) {
    const value = replacements[replacementKey];
    if (value !== void 0) {
      const tag = `<<<${guideTag}>>>`;
      result = result.replaceAll(tag, value);
    }
  }
  for (const [key, value] of Object.entries(replacements)) {
    if (value !== void 0) {
      const tag = `{{${key}}}`;
      result = result.replaceAll(tag, value);
    }
  }
  return result;
}
var DEFAULT_SCRIPTS_USER_ID;
var init_coordinationScripts = __esm({
  "server/coordinationScripts.ts"() {
    "use strict";
    init_db();
    init_schema();
    DEFAULT_SCRIPTS_USER_ID = 810200;
  }
});

// server/instructionScripts.ts
var instructionScripts_exports = {};
__export(instructionScripts_exports, {
  createInstructionScript: () => createInstructionScript,
  getActiveInstructionScript: () => getActiveInstructionScript,
  getAllLatestScripts: () => getAllLatestScripts,
  getInstructionScriptByVersion: () => getInstructionScriptByVersion,
  getInstructionScripts: () => getInstructionScripts,
  getLatestInstructionScript: () => getLatestInstructionScript2,
  setActiveVersion: () => setActiveVersion
});
import { eq as eq8, and as and6, desc as desc5 } from "drizzle-orm";
async function createInstructionScript(userId, scriptType, content, trainedBy) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const latestScript = await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType)
    )
  ).orderBy(desc5(instructionScripts.version)).limit(1);
  const newVersion = latestScript.length > 0 ? latestScript[0].version + 1 : 1;
  const result = await db.insert(instructionScripts).values({
    userId,
    scriptType,
    version: newVersion,
    content,
    trainedBy: trainedBy || null
  });
  return result[0].insertId;
}
async function getInstructionScripts(userId, scriptType) {
  const db = await getDb();
  if (!db) {
    return [];
  }
  return await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType)
    )
  ).orderBy(desc5(instructionScripts.version));
}
async function getLatestInstructionScript2(userId, scriptType) {
  const db = await getDb();
  if (!db) {
    return null;
  }
  const result = await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType)
    )
  ).orderBy(desc5(instructionScripts.version)).limit(1);
  if (result.length > 0) {
    return result[0];
  }
  if (userId !== DEFAULT_SCRIPTS_USER_ID2) {
    const defaultResult = await db.select().from(instructionScripts).where(
      and6(
        eq8(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID2),
        eq8(instructionScripts.scriptType, scriptType)
      )
    ).orderBy(desc5(instructionScripts.version)).limit(1);
    if (defaultResult.length > 0) {
      return defaultResult[0];
    }
  }
  return null;
}
async function getInstructionScriptByVersion(userId, scriptType, version) {
  const db = await getDb();
  if (!db) {
    return null;
  }
  const result = await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType),
      eq8(instructionScripts.version, version)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getAllLatestScripts(userId) {
  const scriptTypes = [
    "channel_analysis",
    "title_guide",
    "description_guide",
    "script_analysis",
    "thumbnail_mechanics",
    "midjourney_prompts"
  ];
  const results = await Promise.all(
    scriptTypes.map(async (type) => ({
      scriptType: type,
      script: await getLatestInstructionScript2(userId, type)
    }))
  );
  return results;
}
async function setActiveVersion(userId, scriptType, version) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(instructionScripts).set({ isActive: false }).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType)
    )
  );
  await db.update(instructionScripts).set({ isActive: true }).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType),
      eq8(instructionScripts.version, version)
    )
  );
}
async function getActiveInstructionScript(userId, scriptType) {
  const db = await getDb();
  if (!db) {
    return null;
  }
  const activeResult = await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType),
      eq8(instructionScripts.isActive, true)
    )
  ).limit(1);
  if (activeResult.length > 0) {
    return activeResult[0];
  }
  const latestResult = await db.select().from(instructionScripts).where(
    and6(
      eq8(instructionScripts.userId, userId),
      eq8(instructionScripts.scriptType, scriptType)
    )
  ).orderBy(desc5(instructionScripts.version)).limit(1);
  if (latestResult.length > 0) {
    await setActiveVersion(userId, scriptType, latestResult[0].version);
    return latestResult[0];
  }
  if (userId !== DEFAULT_SCRIPTS_USER_ID2) {
    const defaultActiveResult = await db.select().from(instructionScripts).where(
      and6(
        eq8(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID2),
        eq8(instructionScripts.scriptType, scriptType),
        eq8(instructionScripts.isActive, true)
      )
    ).limit(1);
    if (defaultActiveResult.length > 0) {
      return defaultActiveResult[0];
    }
    const defaultLatestResult = await db.select().from(instructionScripts).where(
      and6(
        eq8(instructionScripts.userId, DEFAULT_SCRIPTS_USER_ID2),
        eq8(instructionScripts.scriptType, scriptType)
      )
    ).orderBy(desc5(instructionScripts.version)).limit(1);
    if (defaultLatestResult.length > 0) {
      return defaultLatestResult[0];
    }
  }
  return null;
}
var DEFAULT_SCRIPTS_USER_ID2;
var init_instructionScripts = __esm({
  "server/instructionScripts.ts"() {
    "use strict";
    init_db();
    init_schema();
    DEFAULT_SCRIPTS_USER_ID2 = 810200;
  }
});

// server/youtubeAnalytics.ts
var youtubeAnalytics_exports = {};
__export(youtubeAnalytics_exports, {
  fetchAllVideoAnalytics: () => fetchAllVideoAnalytics,
  fetchVideoDemographics: () => fetchVideoDemographics,
  fetchVideoGeography: () => fetchVideoGeography,
  fetchVideoRetentionData: () => fetchVideoRetentionData,
  fetchVideoTrafficSources: () => fetchVideoTrafficSources,
  fetchVideoWatchTimeMetrics: () => fetchVideoWatchTimeMetrics
});
async function fetchVideoWatchTimeMetrics(userId, videoId, startDate, endDate) {
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
      filters: `video==${videoId}`
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
      watchTime: row[1] * 60,
      // Convertir minutes en secondes
      averageViewDuration: row[2],
      averageViewPercentage: row[3]
    };
  } catch (error) {
    console.error("[Analytics] Error fetching watch time metrics:", error);
    return null;
  }
}
async function fetchVideoTrafficSources(userId, videoId, startDate, endDate) {
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
      sort: "-views"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    const totalViews = data.rows.reduce((sum, row) => sum + row[1], 0);
    return data.rows.map((row) => ({
      source: mapTrafficSourceName(row[0]),
      views: row[1],
      watchTime: row[2] * 60,
      // Convertir minutes en secondes
      percentage: row[1] / totalViews * 100
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching traffic sources:", error);
    return [];
  }
}
async function fetchVideoDemographics(userId, videoId, startDate, endDate) {
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
      sort: "-viewsPercentage"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    return data.rows.map((row) => ({
      ageGroup: row[0],
      gender: row[1],
      viewsPercentage: row[2]
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching demographics:", error);
    return [];
  }
}
async function fetchVideoGeography(userId, videoId, startDate, endDate) {
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
      maxResults: "20"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    const totalViews = data.rows.reduce((sum, row) => sum + row[1], 0);
    return data.rows.map((row) => ({
      country: row[0],
      views: row[1],
      watchTime: row[2] * 60,
      // Convertir minutes en secondes
      percentage: row[1] / totalViews * 100
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching geography:", error);
    return [];
  }
}
async function fetchVideoRetentionData(userId, videoId) {
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
      filters: `video==${videoId}`
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    return data.rows.map((row) => ({
      elapsedVideoTimeRatio: row[0],
      audienceWatchRatio: row[1]
    }));
  } catch (error) {
    console.error("[Analytics] Error fetching retention data:", error);
    return [];
  }
}
function mapTrafficSourceName(technicalName) {
  const mapping = {
    "ADVERTISING": "Publicit\xE9s",
    "ANNOTATION": "Annotations",
    "CAMPAIGN_CARD": "Cartes de campagne",
    "END_SCREEN": "\xC9crans de fin",
    "EXT_URL": "Sites externes",
    "HASHTAGS": "Hashtags",
    "NOTIFICATION": "Notifications",
    "PLAYLIST": "Playlists",
    "PRODUCT_PAGE": "Pages de produits",
    "PROMOTED": "Contenu promu",
    "RELATED_VIDEO": "Vid\xE9os sugg\xE9r\xE9es",
    "SHORTS": "YouTube Shorts",
    "SUBSCRIBER": "Abonn\xE9s",
    "YT_CHANNEL": "Pages de cha\xEEnes",
    "YT_OTHER_PAGE": "Autres pages YouTube",
    "YT_SEARCH": "Recherche YouTube",
    "NO_LINK_EMBEDDED": "Lecteur int\xE9gr\xE9",
    "NO_LINK_OTHER": "Trafic direct ou inconnu"
  };
  return mapping[technicalName] || technicalName;
}
async function fetchAllVideoAnalytics(userId, videoId, startDate, endDate) {
  const [watchTime, trafficSources2, demographics2, geography2, retention] = await Promise.all([
    fetchVideoWatchTimeMetrics(userId, videoId, startDate, endDate),
    fetchVideoTrafficSources(userId, videoId, startDate, endDate),
    fetchVideoDemographics(userId, videoId, startDate, endDate),
    fetchVideoGeography(userId, videoId, startDate, endDate),
    fetchVideoRetentionData(userId, videoId)
  ]);
  return {
    watchTime,
    trafficSources: trafficSources2,
    demographics: demographics2,
    geography: geography2,
    retention
  };
}
var init_youtubeAnalytics = __esm({
  "server/youtubeAnalytics.ts"() {
    "use strict";
    init_youtubeAuth();
  }
});

// server/sync/youtubeSync.ts
var youtubeSync_exports = {};
__export(youtubeSync_exports, {
  fetchRecentVideos: () => fetchRecentVideos,
  fetchVideoAnalytics: () => fetchVideoAnalytics,
  syncAllUserAnalytics: () => syncAllUserAnalytics,
  syncAllUsers: () => syncAllUsers,
  syncUserVideos: () => syncUserVideos,
  syncVideo: () => syncVideo,
  syncVideoAnalytics: () => syncVideoAnalytics
});
import { eq as eq9 } from "drizzle-orm";
async function fetchRecentVideos(channelId, apiKey) {
  const oneWeekAgo = /* @__PURE__ */ new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&publishedAfter=${oneWeekAgo.toISOString()}&order=date&type=video&maxResults=50&key=${apiKey}`;
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube API search error: ${searchResponse.statusText}`);
  }
  const searchData = await searchResponse.json();
  const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
  if (!videoIds) {
    return [];
  }
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
  const videosResponse = await fetch(videosUrl);
  if (!videosResponse.ok) {
    throw new Error(`YouTube API videos error: ${videosResponse.statusText}`);
  }
  const videosData = await videosResponse.json();
  return videosData.items || [];
}
async function fetchVideoAnalytics(videoId, apiKey) {
  try {
    return {
      averageViewDuration: 0,
      estimatedMinutesWatched: 0,
      subscribersGained: 0
    };
  } catch (error) {
    console.error(`Error fetching analytics for video ${videoId}:`, error);
    return null;
  }
}
async function syncVideo(video, userId, apiKey) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const youtubeId = video.id;
  const existingVideos = await db.select().from(videos).where(eq9(videos.youtubeId, youtubeId)).limit(1);
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
    duration: null,
    // TODO: Extraire la durée de la vidéo
    userId,
    lastSyncedAt: /* @__PURE__ */ new Date()
  };
  if (exists) {
    await db.update(videos).set(videoData).where(eq9(videos.youtubeId, youtubeId));
    return { imported: false, updated: true };
  } else {
    await db.insert(videos).values(videoData);
    return { imported: true, updated: false };
  }
}
async function syncUserVideos(userId, channelId, apiKey) {
  const errors = [];
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
      errors
    };
  } catch (error) {
    const errorMsg = `Error fetching recent videos: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: [errorMsg]
    };
  }
}
async function syncAllUsers() {
  const { getAllYouTubeConfigs: getAllYouTubeConfigs2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const configs = await getAllYouTubeConfigs2();
  let totalImported = 0;
  let totalUpdated = 0;
  const userResults = [];
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
      errors: result.errors
    });
  }
  return {
    success: userResults.every((r) => r.errors.length === 0),
    totalImported,
    totalUpdated,
    userResults
  };
}
async function syncVideoAnalytics(userId, videoId, youtubeId) {
  try {
    const { fetchAllVideoAnalytics: fetchAllVideoAnalytics2 } = await Promise.resolve().then(() => (init_youtubeAnalytics(), youtubeAnalytics_exports));
    const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const {
      videoAnalytics: videoAnalytics2,
      trafficSources: trafficSources2,
      demographics: demographics2,
      geography: geography2,
      retentionData: retentionData2
    } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    const analytics = await fetchAllVideoAnalytics2(
      userId,
      youtubeId,
      startDateStr,
      endDateStr
    );
    const db = await getDb3();
    if (!db) {
      console.error("[Sync] Database not available");
      return false;
    }
    if (analytics.watchTime) {
      await db.insert(videoAnalytics2).values({
        videoId,
        watchTime: analytics.watchTime.watchTime,
        averageViewDuration: analytics.watchTime.averageViewDuration,
        averageViewPercentage: analytics.watchTime.averageViewPercentage,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr)
      });
    }
    if (analytics.trafficSources && analytics.trafficSources.length > 0) {
      for (const source of analytics.trafficSources) {
        await db.insert(trafficSources2).values({
          videoId,
          source: source.source,
          views: source.views,
          watchTime: source.watchTime,
          percentage: Math.round(source.percentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr)
        });
      }
    }
    if (analytics.demographics && analytics.demographics.length > 0) {
      for (const demo of analytics.demographics) {
        await db.insert(demographics2).values({
          videoId,
          ageGroup: demo.ageGroup,
          gender: demo.gender,
          viewsPercentage: Math.round(demo.viewsPercentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr)
        });
      }
    }
    if (analytics.geography && analytics.geography.length > 0) {
      for (const geo of analytics.geography) {
        await db.insert(geography2).values({
          videoId,
          country: geo.country,
          views: geo.views,
          watchTime: geo.watchTime,
          percentage: Math.round(geo.percentage),
          startDate: new Date(startDateStr),
          endDate: new Date(endDateStr)
        });
      }
    }
    if (analytics.retention && analytics.retention.length > 0) {
      for (const point of analytics.retention) {
        await db.insert(retentionData2).values({
          videoId,
          elapsedVideoTimeRatio: Math.round(point.elapsedVideoTimeRatio * 100),
          audienceWatchRatio: Math.round(point.audienceWatchRatio * 100)
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
async function syncAllUserAnalytics(userId) {
  try {
    const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { videos: videos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq13 } = await import("drizzle-orm");
    const db = await getDb3();
    if (!db) {
      return {
        success: false,
        synced: 0,
        errors: ["Database not available"]
      };
    }
    const userVideos = await db.select().from(videos3).where(eq13(videos3.userId, userId));
    let synced = 0;
    const errors = [];
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
      errors
    };
  } catch (error) {
    const errorMsg = `Error syncing user analytics: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return {
      success: false,
      synced: 0,
      errors: [errorMsg]
    };
  }
}
var init_youtubeSync = __esm({
  "server/sync/youtubeSync.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/webhooks/youtubeWebhook.ts
var youtubeWebhook_exports = {};
__export(youtubeWebhook_exports, {
  handleYouTubeNotification: () => handleYouTubeNotification,
  parseYouTubeNotification: () => parseYouTubeNotification,
  subscribeToYouTubeChannel: () => subscribeToYouTubeChannel,
  unsubscribeFromYouTubeChannel: () => unsubscribeFromYouTubeChannel,
  verifyWebhookChallenge: () => verifyWebhookChallenge
});
import { parseStringPromise } from "xml2js";
function verifyWebhookChallenge(challenge) {
  return challenge;
}
async function parseYouTubeNotification(xmlBody) {
  try {
    const parsed = await parseStringPromise(xmlBody);
    const entry = parsed?.feed?.entry?.[0];
    if (!entry) return null;
    const videoId = entry["yt:videoId"]?.[0];
    const channelId = entry["yt:channelId"]?.[0];
    const title = entry.title?.[0];
    const publishedAt = entry.published?.[0];
    if (!videoId || !channelId) return null;
    return {
      videoId,
      channelId,
      title: title || "Sans titre",
      publishedAt: publishedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error("[Webhook] Error parsing YouTube notification:", error);
    return null;
  }
}
async function handleYouTubeNotification(notification) {
  console.log(`[Webhook] New video detected: ${notification.title} (${notification.videoId})`);
  try {
    const { getAllYouTubeConfigs: getAllYouTubeConfigs2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const configs = await getAllYouTubeConfigs2();
    const userConfig = configs.find((c) => c.channelId === notification.channelId);
    if (!userConfig) {
      console.log(`[Webhook] No user config found for channel ${notification.channelId}`);
      return;
    }
    const result = await syncUserVideos(
      userConfig.userId,
      userConfig.channelId,
      userConfig.apiKey
    );
    await notifyOwner({
      title: "\u{1F3AC} Nouvelle vid\xE9o d\xE9tect\xE9e !",
      content: `Titre: ${notification.title}

\u{1F4E5} ${result.imported} nouvelles vid\xE9os import\xE9es
\u{1F504} ${result.updated} vid\xE9os mises \xE0 jour

La synchronisation instantan\xE9e a \xE9t\xE9 effectu\xE9e avec succ\xE8s.`
    });
    console.log(`[Webhook] Sync completed: ${result.imported} imported, ${result.updated} updated`);
  } catch (error) {
    console.error("[Webhook] Error handling notification:", error);
    await notifyOwner({
      title: "\u274C Erreur webhook YouTube",
      content: `Une erreur s'est produite lors du traitement d'une notification de nouvelle vid\xE9o:

${error instanceof Error ? error.message : String(error)}`
    });
  }
}
async function subscribeToYouTubeChannel(channelId, callbackUrl) {
  try {
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe";
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "hub.callback": callbackUrl,
        "hub.topic": topicUrl,
        "hub.mode": "subscribe",
        "hub.verify": "async",
        "hub.lease_seconds": "864000"
        // 10 jours
      }).toString()
    });
    if (!response.ok) {
      console.error(`[Webhook] Subscription failed: ${response.statusText}`);
      return false;
    }
    console.log(`[Webhook] Successfully subscribed to channel ${channelId}`);
    return true;
  } catch (error) {
    console.error("[Webhook] Error subscribing to channel:", error);
    return false;
  }
}
async function unsubscribeFromYouTubeChannel(channelId, callbackUrl) {
  try {
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe";
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "hub.callback": callbackUrl,
        "hub.topic": topicUrl,
        "hub.mode": "unsubscribe",
        "hub.verify": "async"
      }).toString()
    });
    if (!response.ok) {
      console.error(`[Webhook] Unsubscription failed: ${response.statusText}`);
      return false;
    }
    console.log(`[Webhook] Successfully unsubscribed from channel ${channelId}`);
    return true;
  } catch (error) {
    console.error("[Webhook] Error unsubscribing from channel:", error);
    return false;
  }
}
var init_youtubeWebhook = __esm({
  "server/webhooks/youtubeWebhook.ts"() {
    "use strict";
    init_youtubeSync();
    init_notification();
  }
});

// server/channelAnalytics.ts
var channelAnalytics_exports = {};
__export(channelAnalytics_exports, {
  fetchChannelAnalytics: () => fetchChannelAnalytics,
  fetchChannelDemographics: () => fetchChannelDemographics,
  fetchChannelGeography: () => fetchChannelGeography,
  fetchChannelTrafficSources: () => fetchChannelTrafficSources
});
async function fetchChannelAnalytics(userId, startDate, endDate) {
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
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost,estimatedRevenue,averageViewDuration,likes,comments"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
      comments: row[7] || 0
    };
  } catch (error) {
    console.error("[Channel Analytics] Error fetching channel analytics:", error);
    return null;
  }
}
async function fetchChannelDemographics(userId, startDate, endDate) {
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
      dimensions: "ageGroup,gender"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    return data.rows.map((row) => ({
      ageGroup: row[0],
      gender: row[1],
      viewsPercentage: row[2]
    }));
  } catch (error) {
    console.error("[Channel Analytics] Error fetching demographics:", error);
    return [];
  }
}
async function fetchChannelGeography(userId, startDate, endDate) {
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
      maxResults: "10"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    const totalViews = data.rows.reduce((sum, row) => sum + row[1], 0);
    return data.rows.map((row) => ({
      country: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
      percentage: totalViews > 0 ? row[1] / totalViews * 100 : 0
    }));
  } catch (error) {
    console.error("[Channel Analytics] Error fetching geography:", error);
    return [];
  }
}
async function fetchChannelTrafficSources(userId, startDate, endDate) {
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
      sort: "-views"
    });
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
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
    const totalViews = data.rows.reduce((sum, row) => sum + row[1], 0);
    return data.rows.map((row) => ({
      source: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
      percentage: totalViews > 0 ? row[1] / totalViews * 100 : 0
    }));
  } catch (error) {
    console.error("[Channel Analytics] Error fetching traffic sources:", error);
    return [];
  }
}
var init_channelAnalytics = __esm({
  "server/channelAnalytics.ts"() {
    "use strict";
    init_youtubeAuth();
  }
});

// server/scriptTraining.ts
var scriptTraining_exports = {};
__export(scriptTraining_exports, {
  trainScript: () => trainScript
});
import { eq as eq10, and as and7, desc as desc6, gte as gte3 } from "drizzle-orm";
async function getAllUserABTests(userId) {
  const db = await getDb();
  if (!db) return "Aucun A/B test disponible";
  const oneYearAgo = /* @__PURE__ */ new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const variants = await db.select().from(testVariants).where(
    and7(
      eq10(testVariants.userId, userId),
      gte3(testVariants.createdAt, oneYearAgo)
    )
  ).orderBy(desc6(testVariants.createdAt));
  if (variants.length === 0) {
    return "Aucun A/B test disponible";
  }
  const formattedTests = variants.map((v, idx) => {
    const metrics = [];
    if (v.views) metrics.push(`Vues: ${v.views}`);
    if (v.watchTimePercentage) metrics.push(`R\xE9partition Watch Time: ${v.watchTimePercentage}%`);
    if (v.likes) metrics.push(`Likes: ${v.likes}`);
    if (v.comments) metrics.push(`Commentaires: ${v.comments}`);
    if (v.watchTimeMinutes) metrics.push(`Watch Time: ${v.watchTimeMinutes} min`);
    return `Test #${idx + 1}:
- Titre: ${v.title || "N/A"}
- Contr\xF4le: ${v.isControl ? "Oui" : "Non"}
- M\xE9triques: ${metrics.length > 0 ? metrics.join(", ") : "N/A"}
- Date: ${v.createdAt ? new Date(v.createdAt).toLocaleDateString("fr-FR") : "N/A"}`;
  });
  return formattedTests.join("\n\n");
}
async function getCurrentScript(userId, scriptType) {
  const db = await getDb();
  if (!db) return null;
  const scripts = await db.select().from(instructionScripts).where(
    and7(
      eq10(instructionScripts.userId, userId),
      eq10(instructionScripts.scriptType, scriptType)
    )
  ).orderBy(desc6(instructionScripts.version)).limit(1);
  return scripts[0]?.content || null;
}
function generateTrainingPrompt(scriptType, currentScript, abTestsReport, channelTitles) {
  const scriptTypeLabels = {
    title_guide: "guide de cr\xE9ation de titres YouTube",
    thumbnail_mechanics: "guide des m\xE9caniques de miniatures",
    midjourney_prompts: "guide de cr\xE9ation de prompts Midjourney pour les miniatures"
  };
  return `Tu es un expert en optimisation de contenu YouTube. Tu dois mettre \xE0 jour un ${scriptTypeLabels[scriptType]} en te basant sur les donn\xE9es r\xE9elles d'A/B testing et les titres actuels de la cha\xEEne.

## SCRIPT ACTUEL \xC0 AM\xC9LIORER
${currentScript}

## DONN\xC9ES D'A/B TESTING (derni\xE8re ann\xE9e)
${abTestsReport}

## TITRES ACTUELS DE LA CHA\xCENE (derni\xE8re ann\xE9e)
Ces titres repr\xE9sentent ce qui fonctionne actuellement sur la cha\xEEne. Ils refl\xE8tent les tendances actuelles et les patterns qui g\xE9n\xE8rent de l'engagement.
${channelTitles}

## INSTRUCTIONS IMPORTANTES

1. **OBJECTIF** : Mettre \xE0 jour le script en y incorporant :
   - Les nouveaux patterns gagnants d\xE9couverts dans les A/B tests
   - Les sch\xE9mas qui fonctionnent dans les titres actuels de la cha\xEEne
   - Les tendances actuelles observ\xE9es

2. **R\xC8GLES STRICTES** :
   - Le script mis \xE0 jour doit faire APPROXIMATIVEMENT LA M\xCAME LONGUEUR que l'original (\xB120%)
   - Ne pas perdre d'informations utiles qui restent valides
   - Supprimer uniquement les r\xE8gles qui sont clairement obsol\xE8tes ou contredites par les donn\xE9es
   - Ajouter les nouveaux patterns d\xE9couverts de mani\xE8re concise
   - Garder le m\xEAme format et la m\xEAme structure que l'original

3. **ANALYSE \xC0 EFFECTUER** :
   - Identifier les patterns r\xE9currents dans les titres/miniatures qui performent bien
   - Rep\xE9rer les formulations, mots-cl\xE9s ou structures qui g\xE9n\xE8rent un bon CTR
   - Noter les tendances actuelles (mots \xE0 la mode, formats populaires)
   - D\xE9tecter les r\xE8gles du script actuel qui ne sont plus valid\xE9es par les donn\xE9es

4. **FORMAT DE SORTIE** :
   Retourne UNIQUEMENT le script mis \xE0 jour, sans commentaires ni explications.
   Le script doit \xEAtre pr\xEAt \xE0 \xEAtre utilis\xE9 tel quel.

G\xE9n\xE8re maintenant le script mis \xE0 jour :`;
}
async function trainScript(params) {
  const { userId, scriptType, model, channelId } = params;
  const currentScript = await getCurrentScript(userId, scriptType);
  if (!currentScript) {
    throw new Error("Aucun script existant \xE0 entra\xEEner. Veuillez d'abord publier une version.");
  }
  const abTestsReport = await getAllUserABTests(userId);
  let channelTitles = "Aucun ID de cha\xEEne fourni - les titres actuels ne seront pas analys\xE9s.";
  if (channelId) {
    try {
      const titles = await fetchChannelTitles(channelId);
      if (titles.length > 0) {
        channelTitles = titles.map((t2, idx) => `${idx + 1}. ${t2.title} (${t2.publishedAt})`).join("\n");
      } else {
        channelTitles = "Aucun titre trouv\xE9 pour cette cha\xEEne.";
      }
    } catch (error) {
      console.error("[ScriptTraining] Error fetching channel titles:", error);
      channelTitles = "Erreur lors de la r\xE9cup\xE9ration des titres de la cha\xEEne.";
    }
  }
  const prompt = generateTrainingPrompt(scriptType, currentScript, abTestsReport, channelTitles);
  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
    // Note: Le modèle est géré par le système, on ne peut pas le changer dynamiquement
  });
  const trainedContent = response.choices[0]?.message?.content;
  if (!trainedContent) {
    throw new Error("Le mod\xE8le n'a pas g\xE9n\xE9r\xE9 de contenu.");
  }
  if (typeof trainedContent !== "string") {
    throw new Error("Le mod\xE8le a retourn\xE9 un format de contenu inattendu.");
  }
  return trainedContent;
}
var init_scriptTraining = __esm({
  "server/scriptTraining.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_llm();
    init_channelTitles();
  }
});

// server/brainstorm.ts
var brainstorm_exports = {};
__export(brainstorm_exports, {
  generatePostProduction: () => generatePostProduction,
  generateVideoIdeas: () => generateVideoIdeas,
  rateGeneration: () => rateGeneration
});
async function generateVideoIdeas(userId, model) {
  const channelAnalysis = await getActiveInstructionScript(userId, "channel_analysis");
  const scriptPillars = await getActiveInstructionScript(userId, "script_analysis");
  const titleGuide = await getActiveInstructionScript(userId, "title_guide");
  const videos3 = await getVideosByUserId(userId);
  const videosData = videos3.map((v) => ({
    title: v.title,
    description: v.description || "",
    views: v.viewCount || 0,
    likes: v.likeCount || 0,
    comments: v.commentCount || 0,
    publishedAt: v.publishedAt
  }));
  const sortedByViews = [...videosData].sort((a, b) => b.views - a.views);
  const topPerformers = sortedByViews.slice(0, 10);
  const prompt = `Tu es un expert en strat\xE9gie de contenu YouTube. Ton objectif est de g\xE9n\xE9rer 10 id\xE9es de vid\xE9os innovantes et engageantes pour cette cha\xEEne.

## ANALYSE DE LA CHA\xCENE
${channelAnalysis?.content || "Non disponible"}

## PILIERS D'UN BON SCRIPT
${scriptPillars?.content || "Non disponible"}

## GUIDE DE TITRE
${titleGuide?.content || "Non disponible"}

## VID\xC9OS DE LA CHA\xCENE (${videos3.length} vid\xE9os)
${videosData.map((v) => `- "${v.title}" | ${v.views} vues | ${v.likes} likes | ${v.comments} commentaires`).join("\n")}

## TOP 10 DES VID\xC9OS LES PLUS VUES
${topPerformers.map((v, i) => `${i + 1}. "${v.title}" - ${v.views} vues`).join("\n")}

## MISSION
G\xE9n\xE8re exactement 10 id\xE9es de vid\xE9os qui :
1. S'inscrivent dans la ligne \xE9ditoriale de la cha\xEEne
2. Exploitent les sujets qui ont le mieux fonctionn\xE9
3. Apportent de la nouveaut\xE9 et de l'originalit\xE9
4. Ont un fort potentiel viral
5. Respectent les principes du guide de titre

Pour chaque id\xE9e, fournis :
- Un titre accrocheur et optimis\xE9
- Un court r\xE9sum\xE9 (2-3 phrases) expliquant le concept et l'angle

R\xE9ponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "ideas": [
    {
      "title": "Titre de la vid\xE9o",
      "summary": "Court r\xE9sum\xE9 du concept et de l'angle de la vid\xE9o."
    }
  ]
}`;
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es un expert en strat\xE9gie YouTube. Tu r\xE9ponds uniquement en JSON valide." },
      { role: "user", content: prompt }
    ],
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_ideas",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" }
                },
                required: ["title", "summary"],
                additionalProperties: false
              }
            }
          },
          required: ["ideas"],
          additionalProperties: false
        }
      }
    }
  });
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Pas de r\xE9ponse de l'IA");
  }
  const result = JSON.parse(content);
  return { ideas: result.ideas.slice(0, 10) };
}
async function generatePostProduction(userId, model, transcript) {
  const channelAnalysis = await getActiveInstructionScript(userId, "channel_analysis");
  const titleGuide = await getActiveInstructionScript(userId, "title_guide");
  const descriptionGuide = await getActiveInstructionScript(userId, "description_guide");
  const thumbnailMechanics = await getActiveInstructionScript(userId, "thumbnail_mechanics");
  const prompt = `Tu es un expert en optimisation YouTube. \xC0 partir de cette transcription, g\xE9n\xE8re du contenu optimis\xE9 pour maximiser les performances de la vid\xE9o.

## ANALYSE DE LA CHA\xCENE
${channelAnalysis?.content || "Non disponible"}

## GUIDE DE TITRE
${titleGuide?.content || "Non disponible"}

## GUIDE DE DESCRIPTION
${descriptionGuide?.content || "Non disponible"}

## M\xC9CANIQUES DE MINIATURE
${thumbnailMechanics?.content || "Non disponible"}

## TRANSCRIPTION DE LA VID\xC9O
${transcript}

## MISSION
G\xE9n\xE8re :
1. **10 titres** accrocheurs et optimis\xE9s pour le CTR
2. **10 id\xE9es de miniatures** avec description visuelle d\xE9taill\xE9e
3. **2 sets de tags** (IMPORTANT : chaque set doit faire maximum 500 caract\xE8res, tags s\xE9par\xE9s par des virgules)
4. **2 descriptions** compl\xE8tes et optimis\xE9es pour le SEO

R\xE9ponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "titles": ["titre1", "titre2", ...],
  "thumbnailIdeas": ["description miniature 1", "description miniature 2", ...],
  "tagsSets": ["tag1, tag2, tag3...", "tag1, tag2, tag3..."],
  "descriptions": ["description compl\xE8te 1", "description compl\xE8te 2"]
}`;
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es un expert en optimisation YouTube. Tu r\xE9ponds uniquement en JSON valide." },
      { role: "user", content: prompt }
    ],
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "post_production",
        strict: true,
        schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" }
            },
            thumbnailIdeas: {
              type: "array",
              items: { type: "string" }
            },
            tagsSets: {
              type: "array",
              items: { type: "string" }
            },
            descriptions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["titles", "thumbnailIdeas", "tagsSets", "descriptions"],
          additionalProperties: false
        }
      }
    }
  });
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Pas de r\xE9ponse de l'IA");
  }
  const result = JSON.parse(content);
  const tagsSets = result.tagsSets.map((tags) => {
    if (tags.length > 500) {
      const truncated = tags.substring(0, 500);
      const lastComma = truncated.lastIndexOf(",");
      return lastComma > 0 ? truncated.substring(0, lastComma) : truncated;
    }
    return tags;
  });
  return {
    titles: result.titles.slice(0, 10),
    thumbnailIdeas: result.thumbnailIdeas.slice(0, 10),
    tagsSets: tagsSets.slice(0, 2),
    descriptions: result.descriptions.slice(0, 2)
  };
}
async function rateGeneration(userId, type, model, rating) {
  console.log(`[Brainstorm] User ${userId} rated ${type} with model ${model}: ${rating}`);
}
var init_brainstorm = __esm({
  "server/brainstorm.ts"() {
    "use strict";
    init_llm();
    init_instructionScripts();
    init_db();
  }
});

// server/competitionAnalysis.ts
var competitionAnalysis_exports = {};
__export(competitionAnalysis_exports, {
  analyzeCompetition: () => analyzeCompetition,
  generateKeywordVariations: () => generateKeywordVariations,
  searchCompetitorVideos: () => searchCompetitorVideos
});
async function generateKeywordVariations(keyword) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en SEO YouTube. G\xE9n\xE8re des variations de mots-cl\xE9s pour la recherche de vid\xE9os concurrentes.
        
Pour le mot-cl\xE9 donn\xE9, g\xE9n\xE8re 5 variations pertinentes que les utilisateurs pourraient rechercher sur YouTube.
Inclus :
- Le mot-cl\xE9 original
- Des synonymes
- Des formulations alternatives
- Des questions li\xE9es
- Des variations avec "comment", "pourquoi", "meilleur", etc.

R\xE9ponds UNIQUEMENT avec un tableau JSON de strings, sans explication.
Exemple: ["mot cl\xE9", "variation 1", "variation 2", "comment faire X", "meilleur Y"]`
      },
      {
        role: "user",
        content: keyword
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "keyword_variations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: { type: "string" },
              description: "Liste des variations de mots-cl\xE9s"
            }
          },
          required: ["variations"],
          additionalProperties: false
        }
      }
    }
  });
  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [keyword];
  }
  try {
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    return parsed.variations || [keyword];
  } catch {
    return [keyword];
  }
}
function parseViewCount(viewCountText) {
  if (!viewCountText) return 0;
  const cleaned = viewCountText.toLowerCase().replace(/vues?|views?/gi, "").replace(/\s/g, "").trim();
  const multipliers = {
    "k": 1e3,
    "m": 1e6,
    "md": 1e9,
    "b": 1e9
  };
  for (const [suffix, multiplier] of Object.entries(multipliers)) {
    if (cleaned.endsWith(suffix)) {
      const num2 = parseFloat(cleaned.replace(suffix, "").replace(",", "."));
      return Math.round(num2 * multiplier);
    }
  }
  const num = parseFloat(cleaned.replace(/,/g, ".").replace(/\s/g, ""));
  return isNaN(num) ? 0 : Math.round(num);
}
async function searchCompetitorVideos(keyword, generateVariations = true) {
  let variations = [keyword];
  if (generateVariations) {
    variations = await generateKeywordVariations(keyword);
  }
  const allVideos = [];
  const seenVideoIds = /* @__PURE__ */ new Set();
  for (const variation of variations) {
    try {
      const response = await callDataApi("Youtube/search", {
        query: {
          q: variation,
          hl: "fr",
          gl: "FR"
        }
      });
      if (response?.contents) {
        for (const item of response.contents) {
          if (item.type === "video" && item.video) {
            const video = item.video;
            if (seenVideoIds.has(video.videoId)) continue;
            seenVideoIds.add(video.videoId);
            allVideos.push({
              videoId: video.videoId,
              title: video.title,
              channelTitle: video.channelTitle || "Inconnu",
              viewCount: parseViewCount(video.viewCountText || "0"),
              viewCountText: video.viewCountText || "0 vues",
              publishedTimeText: video.publishedTimeText || "Date inconnue",
              duration: video.lengthText || "N/A",
              thumbnailUrl: video.thumbnails?.[0]?.url || "",
              description: video.descriptionSnippet || ""
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Competition] Error searching for "${variation}":`, error);
    }
  }
  allVideos.sort((a, b) => b.viewCount - a.viewCount);
  return {
    keyword,
    variations,
    videos: allVideos.slice(0, 30),
    // Limit to top 30 videos
    totalResults: allVideos.length
  };
}
async function analyzeCompetition(result) {
  const topVideos = result.videos.slice(0, 10);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en strat\xE9gie YouTube. Analyse les vid\xE9os concurrentes et fournis des insights actionnables.

Analyse les patterns suivants :
1. **Formats de titres** : Quels mots-cl\xE9s, structures et accroches fonctionnent ?
2. **Dur\xE9es populaires** : Quelle dur\xE9e semble performer le mieux ?
3. **Cha\xEEnes dominantes** : Qui sont les principaux acteurs ?
4. **Opportunit\xE9s** : Quels angles ne sont pas encore exploit\xE9s ?
5. **Recommandations** : Comment se diff\xE9rencier et performer ?

Sois concis et actionnable. Utilise des bullet points.`
      },
      {
        role: "user",
        content: `Mot-cl\xE9 recherch\xE9 : "${result.keyword}"
Variations utilis\xE9es : ${result.variations.join(", ")}

Top 10 vid\xE9os par nombre de vues :
${topVideos.map((v, i) => `${i + 1}. "${v.title}" - ${v.channelTitle} - ${v.viewCountText} - ${v.duration}`).join("\n")}`
      }
    ]
  });
  const analysisContent = response.choices[0]?.message?.content;
  return typeof analysisContent === "string" ? analysisContent : "Analyse non disponible";
}
var init_competitionAnalysis = __esm({
  "server/competitionAnalysis.ts"() {
    "use strict";
    init_dataApi();
    init_llm();
  }
});

// server/trends.ts
var trends_exports = {};
__export(trends_exports, {
  generateGoogleTrends: () => generateGoogleTrends,
  generateNewsTrends: () => generateNewsTrends,
  searchAllTrends: () => searchAllTrends,
  searchRedditTrends: () => searchRedditTrends,
  searchTikTokTrends: () => searchTikTokTrends,
  searchTwitterTrends: () => searchTwitterTrends,
  suggestSubreddits: () => suggestSubreddits
});
async function searchTwitterTrends(keyword) {
  try {
    const profileResult = await callDataApi("Twitter/get_user_profile_by_username", {
      query: { username: keyword.replace(/\s+/g, "") }
    });
    const trends = [];
    if (profileResult?.result) {
      const userData = profileResult.result?.data;
      const user = userData?.user?.result;
      if (user?.rest_id) {
        const tweetsResult = await callDataApi("Twitter/get_user_tweets", {
          query: { user: String(user.rest_id), count: "10" }
        });
        const timeline = tweetsResult?.result?.timeline;
        const instructions = timeline?.instructions || [];
        for (const instruction of instructions) {
          if (instruction?.type === "TimelineAddEntries") {
            const entries = instruction.entries || [];
            for (const entry of entries) {
              const entryId = entry?.entryId;
              if (entryId?.startsWith("tweet-")) {
                const content = entry?.content;
                const itemContent = content?.itemContent;
                const tweetResults = itemContent?.tweet_results;
                const result = tweetResults?.result;
                const legacy = result?.legacy;
                if (legacy?.full_text) {
                  trends.push({
                    source: "twitter",
                    title: legacy.full_text.substring(0, 100),
                    description: legacy.full_text,
                    engagement: {
                      likes: legacy.favorite_count || 0,
                      shares: legacy.retweet_count || 0,
                      comments: legacy.reply_count || 0
                    },
                    publishedAt: legacy.created_at
                  });
                }
              }
            }
          }
        }
      }
    }
    return { source: "twitter", trends };
  } catch (error) {
    console.error("[Trends] Twitter search error:", error);
    return { source: "twitter", trends: [], error: String(error) };
  }
}
async function searchRedditTrends(subreddit) {
  try {
    const result = await callDataApi("Reddit/AccessAPI", {
      query: { subreddit, limit: "25" }
    });
    const posts = result?.posts || [];
    const trends = [];
    for (const postWrapper of posts) {
      const post = postWrapper?.data;
      if (post) {
        trends.push({
          source: "reddit",
          title: post.title || "",
          description: post.selftext?.substring(0, 300) || "",
          url: `https://reddit.com${post.permalink || ""}`,
          engagement: {
            score: post.score || 0,
            comments: post.num_comments || 0
          },
          author: post.author,
          publishedAt: new Date((post.created_utc || 0) * 1e3).toISOString(),
          thumbnail: post.thumbnail
        });
      }
    }
    return { source: "reddit", trends };
  } catch (error) {
    console.error("[Trends] Reddit search error:", error);
    return { source: "reddit", trends: [], error: String(error) };
  }
}
async function searchTikTokTrends(keyword) {
  try {
    const result = await callDataApi("Tiktok/search_tiktok_video_general", {
      query: { keyword }
    });
    const videos3 = result?.data || [];
    const trends = [];
    for (const video of videos3.slice(0, 20)) {
      const stats = video?.statistics;
      const author = video?.author;
      trends.push({
        source: "tiktok",
        title: video.desc?.substring(0, 100) || "",
        description: video.desc || "",
        engagement: {
          views: stats?.play_count || 0,
          likes: stats?.digg_count || 0,
          comments: stats?.comment_count || 0,
          shares: stats?.share_count || 0
        },
        author: author?.nickname || author?.unique_id,
        publishedAt: video.create_time ? new Date(video.create_time * 1e3).toISOString() : void 0,
        thumbnail: video.video?.cover
      });
    }
    return { source: "tiktok", trends };
  } catch (error) {
    console.error("[Trends] TikTok search error:", error);
    return { source: "tiktok", trends: [], error: String(error) };
  }
}
async function generateGoogleTrends(keyword, model = "gpt-4o") {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en tendances de recherche Google. Ton r\xF4le est de g\xE9n\xE9rer des tendances de recherche r\xE9alistes et actuelles bas\xE9es sur un mot-cl\xE9 donn\xE9.
          
Tu dois retourner un JSON avec exactement 10 tendances de recherche li\xE9es au mot-cl\xE9, avec pour chaque tendance:
- query: la requ\xEAte de recherche exacte
- volume: un score de volume estim\xE9 (1-100)
- trend: "rising" ou "stable" ou "declining"
- relatedTopics: 3 sujets connexes

R\xE9ponds UNIQUEMENT avec le JSON, sans texte avant ou apr\xE8s.`
        },
        {
          role: "user",
          content: `G\xE9n\xE8re 10 tendances de recherche Google actuelles pour le mot-cl\xE9: "${keyword}"
          
Pense aux:
- Questions fr\xE9quentes des internautes
- Sujets d'actualit\xE9 li\xE9s
- Recherches comparatives
- Tutoriels et guides recherch\xE9s
- Controverses ou d\xE9bats actuels`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "google_trends",
          strict: true,
          schema: {
            type: "object",
            properties: {
              trends: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "La requ\xEAte de recherche" },
                    volume: { type: "number", description: "Score de volume 1-100" },
                    trend: { type: "string", description: "rising, stable ou declining" },
                    relatedTopics: {
                      type: "array",
                      items: { type: "string" },
                      description: "3 sujets connexes"
                    }
                  },
                  required: ["query", "volume", "trend", "relatedTopics"],
                  additionalProperties: false
                }
              }
            },
            required: ["trends"],
            additionalProperties: false
          }
        }
      }
    });
    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      return { source: "google_trends", trends: [], error: "Pas de r\xE9ponse de l'IA" };
    }
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);
    const trends = parsed.trends.map((t2) => ({
      source: "google_trends",
      title: t2.query,
      description: `Tendance: ${t2.trend} | Sujets connexes: ${t2.relatedTopics.join(", ")}`,
      engagement: {
        score: t2.volume
      },
      hashtags: t2.relatedTopics
    }));
    return { source: "google_trends", trends };
  } catch (error) {
    console.error("[Trends] Google Trends generation error:", error);
    return { source: "google_trends", trends: [], error: String(error) };
  }
}
async function generateNewsTrends(keyword, model = "gpt-4o") {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un journaliste expert qui suit l'actualit\xE9 en temps r\xE9el. Ton r\xF4le est de g\xE9n\xE9rer des sujets d'actualit\xE9 r\xE9cents et pertinents bas\xE9s sur un mot-cl\xE9 donn\xE9.
          
Tu dois retourner un JSON avec exactement 10 sujets d'actualit\xE9 li\xE9s au mot-cl\xE9, avec pour chaque sujet:
- headline: le titre de l'actualit\xE9
- summary: un r\xE9sum\xE9 de 2-3 phrases
- angle: l'angle vid\xE9o YouTube potentiel
- urgency: "breaking" ou "trending" ou "evergreen"

R\xE9ponds UNIQUEMENT avec le JSON, sans texte avant ou apr\xE8s.`
        },
        {
          role: "user",
          content: `G\xE9n\xE8re 10 sujets d'actualit\xE9 r\xE9cents pour le mot-cl\xE9: "${keyword}"
          
Pense aux:
- Actualit\xE9s des derni\xE8res semaines
- Annonces et lancements r\xE9cents
- Controverses et d\xE9bats actuels
- \xC9volutions technologiques ou scientifiques
- \xC9v\xE9nements \xE0 venir`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "news_trends",
          strict: true,
          schema: {
            type: "object",
            properties: {
              news: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string", description: "Titre de l'actualit\xE9" },
                    summary: { type: "string", description: "R\xE9sum\xE9 de l'actualit\xE9" },
                    angle: { type: "string", description: "Angle vid\xE9o YouTube potentiel" },
                    urgency: { type: "string", description: "breaking, trending ou evergreen" }
                  },
                  required: ["headline", "summary", "angle", "urgency"],
                  additionalProperties: false
                }
              }
            },
            required: ["news"],
            additionalProperties: false
          }
        }
      }
    });
    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      return { source: "news", trends: [], error: "Pas de r\xE9ponse de l'IA" };
    }
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);
    const trends = parsed.news.map((n) => ({
      source: "news",
      title: n.headline,
      description: `${n.summary}

\u{1F4F9} Angle vid\xE9o: ${n.angle}`,
      hashtags: [n.urgency]
    }));
    return { source: "news", trends };
  } catch (error) {
    console.error("[Trends] News generation error:", error);
    return { source: "news", trends: [], error: String(error) };
  }
}
async function searchAllTrends(keyword, sources, model = "gpt-4o", redditSubreddits) {
  const results = [];
  const promises = [];
  for (const source of sources) {
    switch (source) {
      case "twitter":
        promises.push(searchTwitterTrends(keyword));
        break;
      case "reddit":
        const subreddits = redditSubreddits || ["all", "popular"];
        for (const sub of subreddits.slice(0, 3)) {
          promises.push(searchRedditTrends(sub));
        }
        break;
      case "tiktok":
        promises.push(searchTikTokTrends(keyword));
        break;
      case "google_trends":
        promises.push(generateGoogleTrends(keyword, model));
        break;
      case "news":
        promises.push(generateNewsTrends(keyword, model));
        break;
    }
  }
  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        source: "unknown",
        trends: [],
        error: result.reason?.message || "Erreur inconnue"
      });
    }
  }
  return results;
}
async function suggestSubreddits(keyword, model = "gpt-4o") {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un expert Reddit. Retourne une liste de 5 subreddits pertinents pour un mot-cl\xE9 donn\xE9.
R\xE9ponds UNIQUEMENT avec un JSON contenant un tableau "subreddits" de noms de subreddits (sans le r/).`
        },
        {
          role: "user",
          content: `Quels sont les 5 subreddits les plus pertinents pour le mot-cl\xE9: "${keyword}"?`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "subreddits",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subreddits: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["subreddits"],
            additionalProperties: false
          }
        }
      }
    });
    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) return ["all", "popular"];
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);
    return parsed.subreddits || ["all", "popular"];
  } catch {
    return ["all", "popular"];
  }
}
var init_trends = __esm({
  "server/trends.ts"() {
    "use strict";
    init_dataApi();
    init_llm();
  }
});

// server/nanoBanana.ts
var nanoBanana_exports = {};
__export(nanoBanana_exports, {
  generateImage: () => generateImage
});
import { GoogleGenAI } from "@google/genai";
async function generateImage(options) {
  const { prompt, mode, aspectRatio = "16:9", apiKey } = options;
  const ai = new GoogleGenAI({ apiKey });
  const modelName = mode === "pro" ? "imagen-4.0-ultra-generate-001" : "imagen-4.0-generate-001";
  try {
    const response = await ai.models.generateImages({
      model: modelName,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio
      }
    });
    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No image generated by Nano Banana");
    }
    const generatedImage = response.generatedImages[0];
    if (!generatedImage?.image?.imageBytes) {
      throw new Error("No image data in Nano Banana response");
    }
    const imageBuffer = Buffer.from(generatedImage.image.imageBytes, "base64");
    const timestamp2 = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `generated-thumbnails/${timestamp2}-${randomSuffix}.png`;
    const { url } = await storagePut(
      fileKey,
      imageBuffer,
      "image/png"
    );
    return { imageUrl: url };
  } catch (error) {
    console.error("[Nano Banana] Generation error:", error);
    throw new Error(`Nano Banana generation failed: ${error.message}`);
  }
}
var init_nanoBanana = __esm({
  "server/nanoBanana.ts"() {
    "use strict";
    init_storage();
  }
});

// server/viewTracking.ts
var viewTracking_exports = {};
__export(viewTracking_exports, {
  checkAlerts: () => checkAlerts,
  compareCustomPeriods: () => compareCustomPeriods,
  getAggregatedViewHistory: () => getAggregatedViewHistory,
  getAllDailyStats: () => getAllDailyStats,
  getLastSnapshotTime: () => getLastSnapshotTime,
  getPeriodHours: () => getPeriodHours,
  getTopVideos: () => getTopVideos,
  getVideoTrendStats: () => getVideoTrendStats,
  getVideoViewHistory: () => getVideoViewHistory,
  hasRecordedToday: () => hasRecordedToday,
  recordDailyStats: () => recordDailyStats,
  recordStatsSnapshot: () => recordStatsSnapshot
});
import { eq as eq11, and as and8, desc as desc7, gte as gte4, lte as lte2, sql as sql4, asc } from "drizzle-orm";
import { drizzle as drizzle2 } from "drizzle-orm/mysql2";
async function getDb2() {
  if (!_db2 && process.env.DATABASE_URL) {
    _db2 = drizzle2(process.env.DATABASE_URL);
  }
  return _db2;
}
async function recordStatsSnapshot(userId) {
  const db = await getDb2();
  if (!db) return { recorded: 0, errors: 0 };
  const now = /* @__PURE__ */ new Date();
  const userVideos = await db.select().from(videos).where(eq11(videos.userId, userId));
  let recorded = 0;
  let errors = 0;
  for (const video of userVideos) {
    try {
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
        commentGrowthRate: 0
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
function getPeriodHours(period) {
  switch (period) {
    case "latest":
      return 0;
    case "1h":
      return 1;
    case "2h":
      return 2;
    case "24h":
      return 24;
    case "48h":
      return 48;
    case "1week":
      return 24 * 7;
    case "2weeks":
      return 24 * 14;
    case "1month":
      return 24 * 30;
    default:
      return 24;
  }
}
async function getClosestSnapshot(db, videoId, userId, targetDate, direction = "before") {
  if (direction === "before") {
    const stats = await db.select().from(dailyViewStats).where(
      and8(
        eq11(dailyViewStats.videoId, videoId),
        eq11(dailyViewStats.userId, userId),
        lte2(dailyViewStats.date, targetDate)
      )
    ).orderBy(desc7(dailyViewStats.date)).limit(1);
    return stats[0];
  } else {
    const stats = await db.select().from(dailyViewStats).where(
      and8(
        eq11(dailyViewStats.videoId, videoId),
        eq11(dailyViewStats.userId, userId),
        gte4(dailyViewStats.date, targetDate)
      )
    ).orderBy(asc(dailyViewStats.date)).limit(1);
    return stats[0];
  }
}
async function getVideoTrendStats(userId, period = "24h") {
  const db = await getDb2();
  if (!db) return [];
  const now = /* @__PURE__ */ new Date();
  const hours = getPeriodHours(period);
  const userVideos = await db.select().from(videos).where(eq11(videos.userId, userId));
  const results = [];
  for (const video of userVideos) {
    const currentViews = video.viewCount || 0;
    const currentLikes = video.likeCount || 0;
    const currentComments = video.commentCount || 0;
    if (period === "latest" || hours === 0) {
      const latestSnapshot = await getClosestSnapshot(db, video.id, userId, now, "before");
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
        previousPeriodStart: null
      });
      continue;
    }
    const currentPeriodStart = new Date(now.getTime() - hours * 60 * 60 * 1e3);
    const previousPeriodStart = new Date(now.getTime() - 2 * hours * 60 * 60 * 1e3);
    const snapshotAtCurrentStart = await getClosestSnapshot(db, video.id, userId, currentPeriodStart, "before");
    const snapshotAtPreviousStart = await getClosestSnapshot(db, video.id, userId, previousPeriodStart, "before");
    const viewsAtCurrentStart = snapshotAtCurrentStart?.viewCount || 0;
    const likesAtCurrentStart = snapshotAtCurrentStart?.likeCount || 0;
    const commentsAtCurrentStart = snapshotAtCurrentStart?.commentCount || 0;
    const currentPeriodViews = currentViews - viewsAtCurrentStart;
    const currentPeriodLikes = currentLikes - likesAtCurrentStart;
    const currentPeriodComments = currentComments - commentsAtCurrentStart;
    const viewsAtPreviousStart = snapshotAtPreviousStart?.viewCount || 0;
    const likesAtPreviousStart = snapshotAtPreviousStart?.likeCount || 0;
    const commentsAtPreviousStart = snapshotAtPreviousStart?.commentCount || 0;
    const previousPeriodViews = viewsAtCurrentStart - viewsAtPreviousStart;
    const previousPeriodLikes = likesAtCurrentStart - likesAtPreviousStart;
    const previousPeriodComments = commentsAtCurrentStart - commentsAtPreviousStart;
    const viewDelta = currentPeriodViews - previousPeriodViews;
    const likeDelta = currentPeriodLikes - previousPeriodLikes;
    const commentDelta = currentPeriodComments - previousPeriodComments;
    const viewGrowthRate = previousPeriodViews > 0 ? Math.round(viewDelta / previousPeriodViews * 1e4) : currentPeriodViews > 0 ? 1e4 : 0;
    const likeGrowthRate = previousPeriodLikes > 0 ? Math.round(likeDelta / previousPeriodLikes * 1e4) : currentPeriodLikes > 0 ? 1e4 : 0;
    const commentGrowthRate = previousPeriodComments > 0 ? Math.round(commentDelta / previousPeriodComments * 1e4) : currentPeriodComments > 0 ? 1e4 : 0;
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
      previousPeriodStart
    });
  }
  return results;
}
async function getTopVideos(userId, period = "24h", limit = 5) {
  const allStats = await getVideoTrendStats(userId, period);
  const topViewers = [...allStats].sort((a, b) => b.currentPeriodViews - a.currentPeriodViews).slice(0, limit);
  const topGrowing = [...allStats].filter((v) => v.viewDelta > 0).sort((a, b) => b.viewGrowthRate - a.viewGrowthRate).slice(0, limit);
  const topDeclining = [...allStats].filter((v) => v.viewDelta < 0).sort((a, b) => a.viewGrowthRate - b.viewGrowthRate).slice(0, limit);
  const lowestViewers = [...allStats].sort((a, b) => a.currentPeriodViews - b.currentPeriodViews).slice(0, limit);
  return {
    topViewers,
    topGrowing,
    topDeclining,
    lowestViewers
  };
}
async function getLastSnapshotTime(userId) {
  const db = await getDb2();
  if (!db) return null;
  const lastStats = await db.select({ date: dailyViewStats.date }).from(dailyViewStats).where(eq11(dailyViewStats.userId, userId)).orderBy(desc7(dailyViewStats.date)).limit(1);
  return lastStats[0]?.date || null;
}
async function hasRecordedToday(userId) {
  const db = await getDb2();
  if (!db) return false;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const stats = await db.select({ count: sql4`count(*)` }).from(dailyViewStats).where(
    and8(
      eq11(dailyViewStats.userId, userId),
      gte4(dailyViewStats.date, today),
      lte2(dailyViewStats.date, tomorrow)
    )
  );
  return (stats[0]?.count || 0) > 0;
}
async function getAllDailyStats(userId, period = "24h") {
  const db = await getDb2();
  if (!db) return [];
  const hours = getPeriodHours(period);
  const startDate = /* @__PURE__ */ new Date();
  if (hours > 0) {
    startDate.setTime(startDate.getTime() - hours * 60 * 60 * 1e3);
  }
  return await db.select().from(dailyViewStats).where(
    and8(
      eq11(dailyViewStats.userId, userId),
      gte4(dailyViewStats.date, startDate)
    )
  ).orderBy(desc7(dailyViewStats.date));
}
async function getVideoViewHistory(videoId, userId, hours = 168) {
  const db = await getDb2();
  if (!db) return [];
  const startDate = /* @__PURE__ */ new Date();
  startDate.setTime(startDate.getTime() - hours * 60 * 60 * 1e3);
  const stats = await db.select({
    timestamp: dailyViewStats.date,
    viewCount: dailyViewStats.viewCount,
    likeCount: dailyViewStats.likeCount,
    commentCount: dailyViewStats.commentCount
  }).from(dailyViewStats).where(
    and8(
      eq11(dailyViewStats.videoId, videoId),
      eq11(dailyViewStats.userId, userId),
      gte4(dailyViewStats.date, startDate)
    )
  ).orderBy(asc(dailyViewStats.date));
  return stats.map((s) => ({
    timestamp: s.timestamp,
    viewCount: s.viewCount || 0,
    likeCount: s.likeCount || 0,
    commentCount: s.commentCount || 0
  }));
}
async function getAggregatedViewHistory(userId, hours = 168) {
  const db = await getDb2();
  if (!db) return [];
  const startDate = /* @__PURE__ */ new Date();
  startDate.setTime(startDate.getTime() - hours * 60 * 60 * 1e3);
  const stats = await db.select({
    timestamp: dailyViewStats.date,
    viewCount: dailyViewStats.viewCount,
    likeCount: dailyViewStats.likeCount,
    commentCount: dailyViewStats.commentCount
  }).from(dailyViewStats).where(
    and8(
      eq11(dailyViewStats.userId, userId),
      gte4(dailyViewStats.date, startDate)
    )
  ).orderBy(asc(dailyViewStats.date));
  const hourlyData = /* @__PURE__ */ new Map();
  for (const stat of stats) {
    const hourKey = new Date(stat.timestamp).toISOString().slice(0, 13);
    if (!hourlyData.has(hourKey)) {
      hourlyData.set(hourKey, {
        timestamp: /* @__PURE__ */ new Date(hourKey + ":00:00.000Z"),
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        videoCount: 0
      });
    }
    const point = hourlyData.get(hourKey);
    point.totalViews += stat.viewCount || 0;
    point.totalLikes += stat.likeCount || 0;
    point.totalComments += stat.commentCount || 0;
    point.videoCount += 1;
  }
  return Array.from(hourlyData.values()).sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
}
async function compareCustomPeriods(userId, period1Start, period1End, period2Start, period2End) {
  const db = await getDb2();
  if (!db) return [];
  const userVideos = await db.select().from(videos).where(eq11(videos.userId, userId));
  const results = [];
  for (const video of userVideos) {
    const period1StartStats = await getClosestSnapshot(db, video.id, userId, period1Start, "after");
    const period1EndStats = await getClosestSnapshot(db, video.id, userId, period1End, "before");
    const period2StartStats = await getClosestSnapshot(db, video.id, userId, period2Start, "after");
    const period2EndStats = await getClosestSnapshot(db, video.id, userId, period2End, "before");
    const period1Views = (period1EndStats?.viewCount || 0) - (period1StartStats?.viewCount || 0);
    const period1Likes = (period1EndStats?.likeCount || 0) - (period1StartStats?.likeCount || 0);
    const period1Comments = (period1EndStats?.commentCount || 0) - (period1StartStats?.commentCount || 0);
    const period2Views = (period2EndStats?.viewCount || 0) - (period2StartStats?.viewCount || 0);
    const period2Likes = (period2EndStats?.likeCount || 0) - (period2StartStats?.likeCount || 0);
    const period2Comments = (period2EndStats?.commentCount || 0) - (period2StartStats?.commentCount || 0);
    const viewDelta = period2Views - period1Views;
    const likeDelta = period2Likes - period1Likes;
    const commentDelta = period2Comments - period1Comments;
    const viewGrowthRate = period1Views > 0 ? Math.round(viewDelta / period1Views * 1e4) : period2Views > 0 ? 1e4 : 0;
    const likeGrowthRate = period1Likes > 0 ? Math.round(likeDelta / period1Likes * 1e4) : period2Likes > 0 ? 1e4 : 0;
    const commentGrowthRate = period1Comments > 0 ? Math.round(commentDelta / period1Comments * 1e4) : period2Comments > 0 ? 1e4 : 0;
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
      commentGrowthRate
    });
  }
  return results;
}
async function checkAlerts(userId, alerts, period = "1h") {
  const stats = await getVideoTrendStats(userId, period);
  const results = [];
  for (const alert of alerts) {
    if (!alert.enabled) continue;
    const videosToCheck = alert.videoId ? stats.filter((s) => s.videoId === alert.videoId) : stats;
    for (const video of videosToCheck) {
      let actualValue;
      let triggered;
      switch (alert.alertType) {
        case "growth":
          actualValue = video.viewGrowthRate;
          triggered = actualValue >= alert.threshold;
          break;
        case "decline":
          actualValue = video.viewGrowthRate;
          triggered = actualValue <= -alert.threshold;
          break;
        case "views":
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
          triggered: true
        });
      }
    }
  }
  return results;
}
var _db2, recordDailyStats;
var init_viewTracking = __esm({
  "server/viewTracking.ts"() {
    "use strict";
    init_schema();
    _db2 = null;
    recordDailyStats = recordStatsSnapshot;
  }
});

// server/sync/cronJobs.ts
var cronJobs_exports = {};
__export(cronJobs_exports, {
  initializeCronJobs: () => initializeCronJobs,
  runDailySync: () => runDailySync,
  runDailyViewTracking: () => runDailyViewTracking,
  runHourlyViewTracking: () => runHourlyViewTracking
});
import cron from "node-cron";
async function runDailySync() {
  console.log("[Cron] Starting daily YouTube synchronization...");
  const startTime = /* @__PURE__ */ new Date();
  let logId = null;
  try {
    logId = await createSyncLog({
      userId: 0,
      // 0 = synchronisation globale
      status: "success",
      videosImported: 0,
      videosUpdated: 0,
      errors: null,
      startedAt: startTime,
      completedAt: null
    });
    const result = await syncAllUsers();
    const configs = await getAllYouTubeConfigs();
    let totalAnalyticsSynced = 0;
    for (const config of configs) {
      try {
        const analyticsResult = await syncAllUserAnalytics(config.userId);
        totalAnalyticsSynced += analyticsResult.synced;
        console.log(`[Cron] Synced ${analyticsResult.synced} analytics for user ${config.userId}`);
      } catch (error) {
        console.error(`[Cron] Error syncing analytics for user ${config.userId}:`, error);
      }
    }
    const endTime = /* @__PURE__ */ new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1e3);
    if (logId) {
      await updateSyncLog(logId, {
        status: result.success ? "success" : "partial",
        videosImported: result.totalImported,
        videosUpdated: result.totalUpdated,
        errors: result.userResults.flatMap((r) => r.errors).filter((e) => e.length > 0).join("; ") || null,
        completedAt: endTime
      });
    }
    const message = result.success ? `\u2705 Synchronisation YouTube r\xE9ussie !

\u{1F4E5} ${result.totalImported} nouvelles vid\xE9os import\xE9es
\u{1F504} ${result.totalUpdated} vid\xE9os mises \xE0 jour
\u{1F4CA} ${totalAnalyticsSynced} analytics synchronis\xE9es
\u23F1\uFE0F Dur\xE9e : ${duration}s` : `\u26A0\uFE0F Synchronisation YouTube partielle

\u{1F4E5} ${result.totalImported} nouvelles vid\xE9os import\xE9es
\u{1F504} ${result.totalUpdated} vid\xE9os mises \xE0 jour
\u{1F4CA} ${totalAnalyticsSynced} analytics synchronis\xE9es
\u274C Erreurs d\xE9tect\xE9es
\u23F1\uFE0F Dur\xE9e : ${duration}s`;
    await notifyOwner({
      title: "Synchronisation YouTube",
      content: message
    });
    console.log(`[Cron] Daily sync completed: ${result.totalImported} imported, ${result.totalUpdated} updated`);
  } catch (error) {
    const endTime = /* @__PURE__ */ new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Cron] Daily sync failed:", errorMessage);
    if (logId) {
      await updateSyncLog(logId, {
        status: "failed",
        errors: errorMessage,
        completedAt: endTime
      });
    }
    await notifyOwner({
      title: "\u274C \xC9chec de la synchronisation YouTube",
      content: `Une erreur s'est produite lors de la synchronisation automatique :

${errorMessage}`
    });
  }
}
function initializeCronJobs() {
  cron.schedule("0 3 * * *", async () => {
    await runDailySync();
  }, {
    timezone: "Europe/Paris"
  });
  console.log("[Cron] Daily YouTube sync scheduled at 3:00 AM (Europe/Paris)");
  cron.schedule("0 0 * * *", async () => {
    await runDailyViewTracking();
  }, {
    timezone: "Europe/Paris"
  });
  console.log("[Cron] Daily view tracking scheduled at midnight (Europe/Paris)");
  cron.schedule("0 * * * *", async () => {
    await runHourlyViewTracking();
  }, {
    timezone: "Europe/Paris"
  });
  console.log("[Cron] Hourly view tracking scheduled (every hour)");
}
async function runHourlyViewTracking() {
  console.log("[Cron] Starting hourly view tracking...");
  try {
    const configs = await getAllYouTubeConfigs();
    let totalRecorded = 0;
    let totalErrors = 0;
    for (const config of configs) {
      try {
        const result = await recordDailyStats(config.userId);
        totalRecorded += result.recorded;
        totalErrors += result.errors;
      } catch (error) {
        console.error(`[Cron] Error recording hourly stats for user ${config.userId}:`, error);
        totalErrors++;
      }
    }
    console.log(`[Cron] Hourly view tracking completed: ${totalRecorded} recorded, ${totalErrors} errors`);
  } catch (error) {
    console.error("[Cron] Hourly view tracking failed:", error);
  }
}
async function runDailyViewTracking() {
  console.log("[Cron] Starting daily view tracking...");
  try {
    const configs = await getAllYouTubeConfigs();
    let totalRecorded = 0;
    let totalErrors = 0;
    for (const config of configs) {
      try {
        const result = await recordDailyStats(config.userId);
        totalRecorded += result.recorded;
        totalErrors += result.errors;
        console.log(`[Cron] Recorded ${result.recorded} stats for user ${config.userId}`);
      } catch (error) {
        console.error(`[Cron] Error recording stats for user ${config.userId}:`, error);
        totalErrors++;
      }
    }
    await sendDailyViewReport();
    console.log(`[Cron] Daily view tracking completed: ${totalRecorded} recorded, ${totalErrors} errors`);
  } catch (error) {
    console.error("[Cron] Daily view tracking failed:", error);
  }
}
async function sendDailyViewReport() {
  try {
    const configs = await getAllYouTubeConfigs();
    if (configs.length === 0) return;
    const userId = configs[0].userId;
    const topVideos = await getTopVideos(userId, "24h", 5);
    const formatVideoList = (videos3, metric) => {
      if (videos3.length === 0) return "Aucune donn\xE9e disponible";
      return videos3.map((v, i) => {
        if (metric === "views") {
          return `${i + 1}. ${v.title.substring(0, 40)}... (+${v.viewDelta.toLocaleString()} vues)`;
        } else {
          const rate = (v.viewGrowthRate / 100).toFixed(2);
          return `${i + 1}. ${v.title.substring(0, 40)}... (${rate}%)`;
        }
      }).join("\n");
    };
    const report = `\u{1F4CA} Rapport Quotidien des Vues - ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR")}

\u{1F680} TOP 5 - PLUS DE VUES (24h)
${formatVideoList(topVideos.topViewers, "views")}

\u{1F4C8} TOP 5 - CROISSANCE
${formatVideoList(topVideos.topGrowing, "growth")}

\u{1F4C9} TOP 5 - D\xC9CROISSANCE
${formatVideoList(topVideos.topDeclining, "growth")}

\u{1F4AD} TOP 5 - MOINS DE VUES (24h)
${formatVideoList(topVideos.lowestViewers, "views")}`;
    await notifyOwner({
      title: "Rapport Quotidien des Vues",
      content: report
    });
    console.log("[Cron] Daily view report sent successfully");
  } catch (error) {
    console.error("[Cron] Error sending daily view report:", error);
  }
}
var init_cronJobs = __esm({
  "server/sync/cronJobs.ts"() {
    "use strict";
    init_youtubeSync();
    init_db();
    init_notification();
    init_viewTracking();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
init_notification();
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";
import { eq as eq12, and as and9, desc as desc8 } from "drizzle-orm";

// server/youtube.ts
init_dataApi();
import { YoutubeTranscript } from "youtube-transcript";
var YOUTUBE_API_KEYS = [
  "AIzaSyAsfUCg0MfNQ2a-C7WUy5j2zFFR6HzF3H4",
  "AIzaSyBqL8vZ9X2kN5mP3wQ7tR8sU4vW6xY0zA2",
  "AIzaSyC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0vW1x"
];
var currentKeyIndex = 0;
function getYouTubeApiKey() {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  return key;
}
async function fetchVideoDetails(videoId) {
  try {
    const apiKey = getYouTubeApiKey();
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.log(`[YouTube] No details found for video: ${videoId}`);
      return null;
    }
    const item = data.items[0];
    const statistics = item.statistics || {};
    const snippet = item.snippet || {};
    const contentDetails = item.contentDetails || {};
    const duration = contentDetails.duration || "";
    const durationMatch = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    let totalSeconds = 0;
    if (durationMatch) {
      const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
      const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
      const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
      totalSeconds = hours * 3600 + minutes * 60 + seconds;
    }
    const averageViewDuration = Math.floor(totalSeconds * 0.5);
    const watchTimeMinutes = Math.floor(averageViewDuration / 60);
    return {
      likeCount: parseInt(statistics.likeCount || "0"),
      commentCount: parseInt(statistics.commentCount || "0"),
      description: snippet.description || "",
      watchTimeMinutes,
      averageViewDuration
    };
  } catch (error) {
    console.error(`[YouTube] Error fetching details for video ${videoId}:`, error);
    return null;
  }
}
async function fetchVideoTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return null;
    }
    const fullTranscript = transcript.map((item) => item.text).join(" ");
    return fullTranscript;
  } catch (error) {
    console.log(`[YouTube] No transcript available for video ${videoId}`);
    return null;
  }
}
async function fetchYouTubeVideos(channelId, periodDays) {
  const videos3 = [];
  try {
    let cursor;
    let fetchedCount = 0;
    const maxVideos = 50;
    let cutoffDate = null;
    if (periodDays && periodDays > 0) {
      cutoffDate = /* @__PURE__ */ new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    }
    console.log(`[YouTube] Fetching videos for channel: ${channelId}${periodDays ? ` (last ${periodDays} days)` : ""}`);
    do {
      const queryParams = {
        id: channelId,
        filter: "videos_latest",
        // Ce filtre exclut automatiquement les Shorts
        hl: "fr",
        // Forcer les titres en français
        gl: "FR"
        // Région France
      };
      if (cursor) {
        queryParams.cursor = cursor;
      }
      const result = await callDataApi("Youtube/get_channel_videos", {
        query: queryParams
      });
      if (!result || !result.contents) {
        console.log("[YouTube] No more videos found");
        break;
      }
      const contents = result.contents;
      for (const item of contents) {
        if (item.type === "video" && item.video) {
          const video = item.video;
          const videoId = video.videoId;
          const lengthSeconds = video.lengthSeconds || 0;
          console.log(`[YouTube] Processing video: ${video.title} (${lengthSeconds}s)`);
          const details = await fetchVideoDetails(videoId);
          const transcript = await fetchVideoTranscript(videoId);
          const videoData = {
            id: videoId,
            title: video.title || "",
            description: details?.description || video.descriptionSnippet || "",
            thumbnailUrl: video.thumbnails?.[0]?.url || "",
            channelId,
            channelTitle: "YouTube Channel",
            publishedAt: video.publishedTimeText || "",
            viewCount: parseInt(String(video.stats?.views || "0")),
            likeCount: details?.likeCount || 0,
            commentCount: details?.commentCount || 0,
            duration: `PT${lengthSeconds}S`,
            tags: [],
            transcript: transcript || void 0,
            watchTimeMinutes: details?.watchTimeMinutes || 0,
            averageViewDuration: details?.averageViewDuration || 0
          };
          videos3.push(videoData);
          fetchedCount++;
          if (fetchedCount >= maxVideos) break;
        }
      }
      cursor = result.cursorNext;
      if (cutoffDate && fetchedCount >= maxVideos) {
        break;
      }
    } while (cursor && fetchedCount < maxVideos);
    console.log(`[YouTube] Successfully fetched ${videos3.length} videos (Shorts excluded)`);
    return videos3;
  } catch (error) {
    console.error("[YouTube] Error fetching videos:", error);
    throw error;
  }
}
async function fetchYouTubeVideoStats(videoId) {
  try {
    const details = await fetchVideoDetails(videoId);
    if (!details) {
      return {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      };
    }
    return {
      viewCount: 0,
      // Les vues sont déjà dans les données de base
      likeCount: details.likeCount,
      commentCount: details.commentCount
    };
  } catch (error) {
    console.error("[YouTube] Error fetching video stats:", error);
    throw error;
  }
}

// server/routers.ts
init_youtubeAuth();

// server/youtubeOAuth.ts
init_youtubeAuth();
async function fetchUserYouTubeVideos(userId, periodDays = 7) {
  const videos3 = [];
  try {
    const youtube = await getAuthenticatedYouTubeService(userId);
    const channelResponse = await youtube.channels.list({
      part: ["id", "contentDetails"],
      mine: true
    });
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      console.log("[YouTube OAuth] No channel found for user");
      return [];
    }
    const channel = channelResponse.data.items[0];
    const channelId = channel.id;
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      console.log("[YouTube OAuth] No uploads playlist found");
      return [];
    }
    console.log(`[YouTube OAuth] Fetching videos from uploads playlist: ${uploadsPlaylistId}`);
    let cutoffDate = null;
    if (periodDays && periodDays > 0) {
      cutoffDate = /* @__PURE__ */ new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    }
    let nextPageToken;
    let fetchedCount = 0;
    const maxVideos = 50;
    do {
      const playlistResponse = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: nextPageToken
      });
      if (!playlistResponse.data.items) {
        break;
      }
      for (const item of playlistResponse.data.items) {
        if (fetchedCount >= maxVideos) {
          break;
        }
        const videoId = item.contentDetails?.videoId;
        if (!videoId) continue;
        const videoResponse = await youtube.videos.list({
          part: ["snippet", "contentDetails", "statistics"],
          id: [videoId]
        });
        if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
          continue;
        }
        const video = videoResponse.data.items[0];
        const snippet = video.snippet;
        const contentDetails = video.contentDetails;
        const statistics = video.statistics;
        const duration = contentDetails.duration || "";
        const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        let totalSeconds = 0;
        if (durationMatch) {
          const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
          const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
          const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
          totalSeconds = hours * 3600 + minutes * 60 + seconds;
        }
        if (totalSeconds < 60) {
          console.log(`[YouTube OAuth] Skipping Short: ${snippet.title} (${totalSeconds}s)`);
          continue;
        }
        console.log(`[YouTube OAuth] Processing video: ${snippet.title} (${totalSeconds}s)`);
        let transcript;
        let retentionCurve;
        console.log(`[YouTube OAuth] Attempting to fetch retention curve for ${videoId}...`);
        try {
          const retentionData2 = await fetchVideoRetentionCurve(userId, videoId);
          if (retentionData2 && retentionData2.length > 0) {
            retentionCurve = JSON.stringify(retentionData2);
            console.log(`[YouTube OAuth] Retrieved retention curve for ${videoId} (${retentionData2.length} points)`);
          }
        } catch (error) {
          console.error(`[YouTube OAuth] Error fetching retention curve for ${videoId}:`, error);
        }
        const averageViewDuration = Math.floor(totalSeconds * 0.5);
        const watchTimeMinutes = Math.floor(averageViewDuration / 60);
        const videoData = {
          id: videoId,
          title: snippet.title || "",
          description: snippet.description || "",
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
          channelId,
          channelTitle: snippet.channelTitle || "YouTube Channel",
          publishedAt: snippet.publishedAt || "",
          viewCount: parseInt(String(statistics.viewCount || "0")),
          likeCount: parseInt(String(statistics.likeCount || "0")),
          commentCount: parseInt(String(statistics.commentCount || "0")),
          duration,
          tags: snippet.tags || [],
          transcript,
          watchTimeMinutes,
          averageViewDuration,
          retentionCurve
        };
        videos3.push(videoData);
        fetchedCount++;
      }
      nextPageToken = playlistResponse.data.nextPageToken || void 0;
      if (fetchedCount >= maxVideos) {
        break;
      }
    } while (nextPageToken);
    console.log(`[YouTube OAuth] Successfully fetched ${videos3.length} videos (Shorts excluded)`);
    return videos3;
  } catch (error) {
    console.error("[YouTube OAuth] Error fetching videos:", error);
    throw error;
  }
}
async function fetchVideoRetentionCurve(userId, videoId) {
  try {
    const youtube = await getAuthenticatedYouTubeService(userId);
    const { google: google2 } = await import("googleapis");
    const auth = youtube.context._options.auth;
    const youtubeAnalytics = google2.youtubeAnalytics({ version: "v2", auth });
    const response = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: "2000-01-01",
      // Date très ancienne pour avoir toutes les données
      endDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      metrics: "audienceWatchRatio,elapsedVideoTimeRatio",
      dimensions: "elapsedVideoTimeRatio",
      filters: `video==${videoId}`,
      sort: "elapsedVideoTimeRatio"
    });
    if (!response.data.rows || response.data.rows.length === 0) {
      console.log(`[YouTube Analytics] No retention data found for video ${videoId}`);
      return null;
    }
    const retentionCurve = response.data.rows.map((row) => ({
      time: parseFloat(row[0]),
      // Pourcentage du temps de la vidéo
      retention: parseFloat(row[1])
      // Pourcentage de rétention
    }));
    console.log(`[YouTube Analytics] Retrieved ${retentionCurve.length} retention points for video ${videoId}`);
    return retentionCurve;
  } catch (error) {
    console.error(`[YouTube Analytics] Error fetching retention curve for video ${videoId}:`, error.message);
    if (error.code === 403 || error.code === 404) {
      console.log("[YouTube Analytics] Analytics API not available or not enabled for this channel");
    }
    return null;
  }
}

// server/scriptStudio.ts
init_db();
init_schema();
init_llm();
init_scriptWriting();
init_schema();
import { eq as eq3, and as and3, desc as desc3, sql as sql3, inArray } from "drizzle-orm";
import * as Diff from "diff";
var DEFAULT_META_PROMPT = `# MON STYLE D'\xC9CRITURE

## TON ET VOIX
- Ton conversationnel et accessible
- Utiliser "tu" pour cr\xE9er de la proximit\xE9
- \xC9viter le jargon technique sans explication
- Injecter de l'humour quand appropri\xE9

## STRUCTURE PR\xC9F\xC9R\xC9E
- Accroche percutante dans les 30 premi\xE8res secondes
- Transitions fluides entre les sections
- R\xE9capitulations r\xE9guli\xE8res pour ancrer les concepts
- Conclusion avec call-to-action clair

## LONGUEUR ET RYTHME
- Phrases courtes (max 20 mots en moyenne)
- Paragraphes de 2-3 phrases maximum
- Alterner entre information et storytelling
- Pauses strat\xE9giques pour l'impact

## CE QUE J'\xC9VITE
- Les introductions trop longues
- Les listes \xE0 rallonge sans contexte
- Le ton professoral ou condescendant
- Les promesses non tenues dans le script

## CE QUE JE PRIVIL\xC9GIE
- Les exemples concrets et relatable
- Les anecdotes personnelles
- Les donn\xE9es chiffr\xE9es pour cr\xE9dibiliser
- Les questions rh\xE9toriques pour engager`;
async function getScriptProfiles(userId) {
  const db = await getDb();
  if (!db) return [];
  const profiles = await db.select().from(scriptProfiles).where(eq3(scriptProfiles.userId, userId)).orderBy(desc3(scriptProfiles.isDefault), desc3(scriptProfiles.lastUsedAt));
  return profiles;
}
async function getDefaultProfile(userId) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.userId, userId), eq3(scriptProfiles.isDefault, true))).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  await db.insert(scriptProfiles).values({
    userId,
    name: "Mon Style par D\xE9faut",
    description: "Profil de base pour l'\xE9criture de scripts",
    metaPrompt: DEFAULT_META_PROMPT,
    isDefault: true
  });
  const newProfile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.userId, userId), eq3(scriptProfiles.isDefault, true))).limit(1);
  return newProfile[0] || null;
}
async function createScriptProfile(userId, name, metaPrompt, description) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scriptProfiles).values({
    userId,
    name,
    description: description || null,
    metaPrompt,
    isDefault: false
  });
  return { id: Number(result[0].insertId) };
}
async function updateScriptProfile(profileId, userId, updates, autoSaveVersion = true) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (autoSaveVersion && updates.metaPrompt) {
    const currentProfile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
    if (currentProfile.length > 0) {
      const profile = currentProfile[0];
      if (profile.metaPrompt !== updates.metaPrompt) {
        await saveProfileVersion(
          userId,
          profileId,
          "Sauvegarde automatique avant modification"
        );
      }
    }
  }
  await db.update(scriptProfiles).set({
    ...updates,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId)));
}
async function setDefaultProfile(profileId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scriptProfiles).set({ isDefault: false }).where(eq3(scriptProfiles.userId, userId));
  await db.update(scriptProfiles).set({ isDefault: true }).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId)));
}
async function deleteScriptProfile(profileId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length > 0 && profile[0].isDefault) {
    throw new Error("Impossible de supprimer le profil par d\xE9faut");
  }
  await db.delete(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId)));
}
async function getScriptCorrections(userId, activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(scriptCorrections).where(eq3(scriptCorrections.userId, userId));
  if (activeOnly) {
    query = db.select().from(scriptCorrections).where(and3(eq3(scriptCorrections.userId, userId), eq3(scriptCorrections.isActive, true)));
  }
  const corrections = await query.orderBy(desc3(scriptCorrections.createdAt));
  return corrections;
}
async function addScriptCorrection(userId, problem, correction, category = "other") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scriptCorrections).values({
    userId,
    problem,
    correction,
    category,
    isActive: true
  });
  return { id: Number(result[0].insertId) };
}
async function generateCorrectionFromFeedback(problem, model = "gpt-4o") {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en \xE9criture de scripts YouTube. L'utilisateur te signale un probl\xE8me dans un script g\xE9n\xE9r\xE9. 
Tu dois transformer ce feedback en une R\xC8GLE CORRECTIVE claire et actionnable qui sera appliqu\xE9e aux futures g\xE9n\xE9rations.

R\xE9ponds UNIQUEMENT en JSON avec ce format:
{
  "correction": "La r\xE8gle corrective \xE0 appliquer (instruction claire et pr\xE9cise)",
  "category": "une des cat\xE9gories: structure, tone, length, transitions, examples, engagement, cta, other"
}`
      },
      {
        role: "user",
        content: `Probl\xE8me signal\xE9 par l'utilisateur: "${problem}"

G\xE9n\xE8re une r\xE8gle corrective durable pour \xE9viter ce probl\xE8me \xE0 l'avenir.`
      }
    ]
  });
  const content = response.choices[0]?.message?.content;
  const text2 = typeof content === "string" ? content : "";
  try {
    const jsonMatch = text2.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        correction: parsed.correction || problem,
        category: parsed.category || "other"
      };
    }
  } catch {
  }
  return {
    correction: `\xC9viter: ${problem}`,
    category: "other"
  };
}
async function toggleCorrectionActive(correctionId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(scriptCorrections).where(and3(eq3(scriptCorrections.id, correctionId), eq3(scriptCorrections.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.update(scriptCorrections).set({ isActive: !existing[0].isActive }).where(eq3(scriptCorrections.id, correctionId));
  }
}
async function deleteScriptCorrection(correctionId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scriptCorrections).where(and3(eq3(scriptCorrections.id, correctionId), eq3(scriptCorrections.userId, userId)));
}
async function getScriptHistory(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const history = await db.select().from(scriptHistory).where(eq3(scriptHistory.userId, userId)).orderBy(desc3(scriptHistory.createdAt)).limit(limit);
  return history;
}
async function saveScriptToHistory(userId, topic, generatedScript, wordCount, model, profileId, customInstructions) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scriptHistory).values({
    userId,
    profileId: profileId || null,
    topic,
    customInstructions: customInstructions || null,
    generatedScript,
    wordCount,
    model
  });
  return { id: Number(result[0].insertId) };
}
async function rateScript(historyId, userId, rating, feedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scriptHistory).set({ rating, feedback: feedback || null }).where(and3(eq3(scriptHistory.id, historyId), eq3(scriptHistory.userId, userId)));
}
async function buildEnhancedScriptPrompt(userId, topic, customInstructions, profileId) {
  let profile = null;
  if (profileId) {
    const db = await getDb();
    if (db) {
      const profiles = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
      profile = profiles[0] || null;
    }
  }
  if (!profile) {
    profile = await getDefaultProfile(userId);
  }
  const corrections = await getScriptCorrections(userId, true);
  const instructionScriptsData = await getAllInstructionScripts(userId);
  const channelData = await getChannelVideosForExport(userId);
  const channelVideosFormatted = formatVideosForPrompt(channelData);
  const correctionsSection = corrections.length > 0 ? `## R\xC8GLES CORRECTIVES DURABLES (\xC0 RESPECTER IMP\xC9RATIVEMENT)
${corrections.map((c, i) => `${i + 1}. [${c.category.toUpperCase()}] ${c.correction}`).join("\n")}` : "";
  const prompt = `# G\xC9N\xC9RATION DE SCRIPT YOUTUBE (5000-6000 MOTS)

## MON M\xC9TA-PROMPT PERSONNEL
${profile?.metaPrompt || DEFAULT_META_PROMPT}

${correctionsSection}

## CONTEXTE DE LA CHA\xCENE
${instructionScriptsData.channel_analysis || "Non disponible"}

## GUIDE DES TITRES
${instructionScriptsData.title_guide || "Non disponible"}

## GUIDE D'\xC9CRITURE DE SCRIPTS
${instructionScriptsData.script_analysis || "Non disponible"}

## DONN\xC9ES DE LA CHA\xCENE
${channelVideosFormatted}

## SUJET DU SCRIPT
${topic}

## INSTRUCTIONS PERSONNALIS\xC9ES
${customInstructions || "Aucune instruction suppl\xE9mentaire"}

---

# STRUCTURE DU SCRIPT (5000-6000 mots)

## PHASE 1: ACCROCHE (300-500 mots)
L'accroche doit captiver imm\xE9diatement selon mon style personnel.

## PHASE 2: CONTEXTE ET ENJEUX (500-800 mots)
\xC9tablir le contexte et cr\xE9er l'urgence.

## PHASE 3: D\xC9VELOPPEMENT PRINCIPAL (3000-3500 mots)
Le c\u0153ur du contenu, structur\xE9 en sections claires.

## PHASE 4: CLIMAX ET R\xC9V\xC9LATION (500-700 mots)
Le moment le plus impactant du script.

## PHASE 5: CONCLUSION ET CALL-TO-ACTION (300-500 mots)
R\xE9capitulation et appel \xE0 l'action.

---

G\xC9N\xC8RE MAINTENANT LE SCRIPT COMPLET EN RESPECTANT MON STYLE ET LES R\xC8GLES CORRECTIVES:`;
  return {
    prompt,
    profileUsed: profile,
    correctionsApplied: corrections
  };
}
async function generateEnhancedScript(userId, topic, model = "gpt-4o", customInstructions, profileId) {
  const { prompt, profileUsed, correctionsApplied } = await buildEnhancedScriptPrompt(
    userId,
    topic,
    customInstructions,
    profileId
  );
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en \xE9criture de scripts YouTube. Tu g\xE9n\xE8res des scripts complets, engageants et optimis\xE9s pour la r\xE9tention d'audience. \xC9cris toujours en fran\xE7ais. Respecte scrupuleusement le m\xE9ta-prompt personnel et les r\xE8gles correctives de l'utilisateur."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });
  const messageContent = response.choices[0]?.message?.content;
  const script = typeof messageContent === "string" ? messageContent : "";
  const wordCount = script.split(/\s+/).filter((word) => word.length > 0).length;
  const sectionRegex = /\[(ACCROCHE|CONTEXTE|SECTION \d+|CLIMAX|CONCLUSION|CTA)\]/g;
  const sections = [];
  let match;
  while ((match = sectionRegex.exec(script)) !== null) {
    sections.push(match[1]);
  }
  if (profileUsed) {
    const db = await getDb();
    if (db) {
      await db.update(scriptProfiles).set({
        usageCount: (profileUsed.usageCount || 0) + 1,
        lastUsedAt: /* @__PURE__ */ new Date()
      }).where(eq3(scriptProfiles.id, profileUsed.id));
    }
  }
  const { id: historyId } = await saveScriptToHistory(
    userId,
    topic,
    script,
    wordCount,
    model,
    profileUsed?.id,
    customInstructions
  );
  return {
    script,
    wordCount,
    sections: sections.length > 0 ? sections : ["Script g\xE9n\xE9r\xE9"],
    historyId,
    profileUsed,
    correctionsApplied: correctionsApplied.length
  };
}
var PROFILE_TEMPLATES = {
  educatif: {
    name: "\xC9ducatif",
    description: "Pour les tutoriels, formations et vid\xE9os explicatives",
    metaPrompt: `# STYLE \xC9DUCATIF

## TON ET VOIX
- Ton p\xE9dagogue et bienveillant
- Utiliser "tu" pour cr\xE9er de la proximit\xE9 avec l'apprenant
- Expliquer chaque concept technique avec des analogies simples
- Encourager et valoriser la progression

## STRUCTURE PR\xC9F\xC9R\xC9E
- Introduction qui pose le probl\xE8me \xE0 r\xE9soudre
- Annonce claire du plan (3-5 points maximum)
- Progression logique du simple au complexe
- R\xE9capitulations apr\xE8s chaque section importante
- Exercice pratique ou mise en application \xE0 la fin

## LONGUEUR ET RYTHME
- Phrases courtes et claires (max 15 mots en moyenne)
- Un concept par paragraphe
- Pauses r\xE9guli\xE8res pour laisser assimiler
- R\xE9p\xE9tition des points cl\xE9s sous diff\xE9rentes formes

## CE QUE J'\xC9VITE
- Le jargon non expliqu\xE9
- Les digressions hors sujet
- Aller trop vite sur les fondamentaux
- Supposer que l'audience conna\xEEt les pr\xE9requis

## CE QUE JE PRIVIL\xC9GIE
- Les exemples concrets et reproductibles
- Les sch\xE9mas mentaux et frameworks
- Les erreurs courantes \xE0 \xE9viter
- Les astuces de pro et raccourcis`
  },
  storytelling: {
    name: "Storytelling",
    description: "Pour les vid\xE9os narratives, histoires et documentaires",
    metaPrompt: `# STYLE STORYTELLING

## TON ET VOIX
- Ton narratif et immersif
- Cr\xE9er une connexion \xE9motionnelle avec l'audience
- Utiliser le pr\xE9sent de narration pour l'immersion
- Varier le rythme selon l'intensit\xE9 dramatique

## STRUCTURE PR\xC9F\xC9R\xC9E
- Accroche myst\xE9rieuse ou choquante (in medias res)
- Pr\xE9sentation du protagoniste et de ses enjeux
- Mont\xE9e en tension progressive
- Retournements de situation et r\xE9v\xE9lations
- Climax \xE9motionnel
- R\xE9solution et le\xE7on \xE0 retenir

## LONGUEUR ET RYTHME
- Phrases vari\xE9es selon l'\xE9motion (courtes pour tension, longues pour contemplation)
- Cliffhangers avant les transitions
- Moments de respiration entre les pics d'intensit\xE9
- Descriptions sensorielles pour l'immersion

## CE QUE J'\xC9VITE
- Les explications qui cassent le rythme narratif
- Les spoilers trop pr\xE9coces
- Les personnages sans profondeur
- Les transitions abruptes

## CE QUE JE PRIVIL\xC9GIE
- Les d\xE9tails qui rendent l'histoire vivante
- Les dialogues reconstitu\xE9s
- Les parall\xE8les avec l'exp\xE9rience du spectateur
- Les twists bien amen\xE9s`
  },
  polemique: {
    name: "Pol\xE9mique",
    description: "Pour les vid\xE9os d'opinion, d\xE9bats et analyses critiques",
    metaPrompt: `# STYLE POL\xC9MIQUE

## TON ET VOIX
- Ton affirm\xE9 et provocateur (sans \xEAtre agressif)
- Assumer ses opinions avec conviction
- Interpeller directement l'audience
- Utiliser l'ironie et le sarcasme avec parcimonie

## STRUCTURE PR\xC9F\xC9R\xC9E
- Accroche provocante qui pose la th\xE8se
- Pr\xE9sentation du consensus \xE0 d\xE9construire
- Arguments principaux avec preuves
- Anticipation et r\xE9futation des contre-arguments
- Appel \xE0 l'action ou \xE0 la r\xE9flexion

## LONGUEUR ET RYTHME
- Phrases percutantes et m\xE9morables
- Alternance entre argumentation et punchlines
- Mont\xE9e en puissance vers la conclusion
- Pauses rh\xE9toriques pour l'impact

## CE QUE J'\xC9VITE
- Les attaques ad hominem
- Les g\xE9n\xE9ralisations abusives
- Ignorer les arguments adverses valides
- Le ton moralisateur ou condescendant

## CE QUE JE PRIVIL\xC9GIE
- Les donn\xE9es et sources v\xE9rifiables
- Les exemples concrets qui illustrent la th\xE8se
- Les questions rh\xE9toriques qui font r\xE9fl\xE9chir
- Les formules choc qui restent en m\xE9moire`
  },
  investigation: {
    name: "Investigation",
    description: "Pour les enqu\xEAtes, r\xE9v\xE9lations et analyses approfondies",
    metaPrompt: `# STYLE INVESTIGATION

## TON ET VOIX
- Ton journalistique et factuel
- Objectivit\xE9 apparente avec angle \xE9ditorial subtil
- Cr\xE9er le suspense autour des d\xE9couvertes
- Cr\xE9dibilit\xE9 et s\xE9rieux dans le traitement

## STRUCTURE PR\xC9F\xC9R\xC9E
- Accroche qui pose l'\xE9nigme ou le scandale
- Contexte et enjeux de l'enqu\xEAte
- Pr\xE9sentation m\xE9thodique des indices
- T\xE9moignages et sources multiples
- R\xE9v\xE9lation progressive de la v\xE9rit\xE9
- Implications et suites possibles

## LONGUEUR ET RYTHME
- Pr\xE9cision dans les faits et les dates
- Alternance entre narration et analyse
- Moments de tension avant les r\xE9v\xE9lations
- R\xE9capitulations pour ne pas perdre l'audience

## CE QUE J'\xC9VITE
- Les accusations sans preuves
- Les raccourcis dans le raisonnement
- N\xE9gliger le contexte
- Les conclusions h\xE2tives

## CE QUE JE PRIVIL\xC9GIE
- Les sources primaires et documents
- La chronologie pr\xE9cise des \xE9v\xE9nements
- Les connexions entre les acteurs
- Les implications syst\xE9miques`
  },
  divertissement: {
    name: "Divertissement",
    description: "Pour les vid\xE9os l\xE9g\xE8res, humour et contenu viral",
    metaPrompt: `# STYLE DIVERTISSEMENT

## TON ET VOIX
- Ton l\xE9ger et \xE9nergique
- Humour omnipr\xE9sent (autod\xE9rision, absurde, r\xE9f\xE9rences pop)
- Complicit\xE9 avec l'audience
- Spontan\xE9it\xE9 et authenticit\xE9

## STRUCTURE PR\xC9F\xC9R\xC9E
- Accroche fun qui donne le ton
- Encha\xEEnement rapide de segments
- Running gags et callbacks
- Moments de surprise et d'inattendu
- Conclusion m\xE9morable ou twist final

## LONGUEUR ET RYTHME
- Phrases courtes et punchy
- Rythme soutenu sans temps mort
- Variations de ton pour surprendre
- Pauses comiques bien plac\xE9es

## CE QUE J'\xC9VITE
- Les longueurs et les explications
- L'humour qui tombe \xE0 plat
- Prendre le sujet trop au s\xE9rieux
- Les transitions molles

## CE QUE JE PRIVIL\xC9GIE
- Les punchlines et one-liners
- Les r\xE9f\xE9rences \xE0 la culture internet
- L'interaction avec les commentaires/communaut\xE9
- Les moments "quotables" et partageables`
  }
};
function getProfileTemplates() {
  return Object.entries(PROFILE_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
    description: template.description,
    preview: template.metaPrompt.slice(0, 200) + "..."
  }));
}
async function createProfileFromTemplate(userId, templateKey, customName) {
  const template = PROFILE_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template "${templateKey}" not found`);
  }
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scriptProfiles).values({
    userId,
    name: customName || template.name,
    description: template.description,
    metaPrompt: template.metaPrompt,
    isDefault: false
  });
  return { id: Number(result[0].insertId) };
}
async function exportProfilesAndCorrections(userId) {
  const profiles = await getScriptProfiles(userId);
  const corrections = await getScriptCorrections(userId, false);
  return {
    version: "1.0",
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profiles: profiles.map((p) => ({
      name: p.name,
      description: p.description,
      metaPrompt: p.metaPrompt,
      isDefault: p.isDefault
    })),
    corrections: corrections.map((c) => ({
      problem: c.problem,
      correction: c.correction,
      category: c.category,
      isActive: c.isActive
    }))
  };
}
async function importProfilesAndCorrections(userId, data, options = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let profilesImported = 0;
  let correctionsImported = 0;
  for (const profile of data.profiles) {
    const existing = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.userId, userId), eq3(scriptProfiles.name, profile.name))).limit(1);
    if (existing.length > 0) {
      if (options.replaceExisting) {
        await db.update(scriptProfiles).set({
          description: profile.description,
          metaPrompt: profile.metaPrompt,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(scriptProfiles.id, existing[0].id));
        profilesImported++;
      }
    } else {
      await db.insert(scriptProfiles).values({
        userId,
        name: profile.name,
        description: profile.description,
        metaPrompt: profile.metaPrompt,
        isDefault: false
        // Never import as default
      });
      profilesImported++;
    }
  }
  for (const correction of data.corrections) {
    const existing = await db.select().from(scriptCorrections).where(and3(
      eq3(scriptCorrections.userId, userId),
      eq3(scriptCorrections.problem, correction.problem)
    )).limit(1);
    if (existing.length > 0) {
      if (options.replaceExisting) {
        await db.update(scriptCorrections).set({
          correction: correction.correction,
          category: correction.category,
          isActive: correction.isActive
        }).where(eq3(scriptCorrections.id, existing[0].id));
        correctionsImported++;
      }
    } else {
      await db.insert(scriptCorrections).values({
        userId,
        problem: correction.problem,
        correction: correction.correction,
        category: correction.category,
        isActive: correction.isActive
      });
      correctionsImported++;
    }
  }
  return { profilesImported, correctionsImported };
}
async function getLearningStats(userId) {
  const db = await getDb();
  if (!db) {
    return {
      totalScriptsGenerated: 0,
      averageWordCount: 0,
      averageRating: 0,
      ratingDistribution: { positive: 0, neutral: 0, negative: 0 },
      topCorrections: [],
      profileUsage: [],
      ratingEvolution: [],
      categoryBreakdown: []
    };
  }
  const history = await db.select().from(scriptHistory).where(eq3(scriptHistory.userId, userId)).orderBy(desc3(scriptHistory.createdAt));
  const corrections = await db.select().from(scriptCorrections).where(eq3(scriptCorrections.userId, userId)).orderBy(desc3(scriptCorrections.appliedCount));
  const profiles = await db.select().from(scriptProfiles).where(eq3(scriptProfiles.userId, userId)).orderBy(desc3(scriptProfiles.usageCount));
  const totalScriptsGenerated = history.length;
  const wordCounts = history.map((h) => h.wordCount || 0).filter((w) => w > 0);
  const averageWordCount = wordCounts.length > 0 ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length) : 0;
  const ratings = history.map((h) => h.rating).filter((r) => r !== null);
  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const ratingDistribution = {
    positive: ratings.filter((r) => r === 1).length,
    neutral: ratings.filter((r) => r === 0).length,
    negative: ratings.filter((r) => r === -1).length
  };
  const topCorrections = corrections.slice(0, 10).map((c) => ({
    id: c.id,
    problem: c.problem,
    correction: c.correction,
    category: c.category,
    appliedCount: c.appliedCount || 0
  }));
  const profileUsage = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    usageCount: p.usageCount || 0,
    lastUsedAt: p.lastUsedAt
  }));
  const ratingByMonth = /* @__PURE__ */ new Map();
  for (const entry of history) {
    if (entry.rating !== null) {
      const month = entry.createdAt.toISOString().slice(0, 7);
      const existing = ratingByMonth.get(month) || { sum: 0, count: 0 };
      existing.sum += entry.rating;
      existing.count++;
      ratingByMonth.set(month, existing);
    }
  }
  const ratingEvolution = Array.from(ratingByMonth.entries()).map(([month, data]) => ({
    month,
    averageRating: data.sum / data.count,
    count: data.count
  })).sort((a, b) => a.month.localeCompare(b.month));
  const categoryCount = /* @__PURE__ */ new Map();
  for (const correction of corrections) {
    const count = categoryCount.get(correction.category) || 0;
    categoryCount.set(correction.category, count + 1);
  }
  const totalCorrections = corrections.length;
  const categoryBreakdown = Array.from(categoryCount.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: totalCorrections > 0 ? Math.round(count / totalCorrections * 100) : 0
  })).sort((a, b) => b.count - a.count);
  return {
    totalScriptsGenerated,
    averageWordCount,
    averageRating,
    ratingDistribution,
    topCorrections,
    profileUsage,
    ratingEvolution,
    categoryBreakdown
  };
}
async function getAllTags(userId) {
  const profiles = await getScriptProfiles(userId);
  const allTags = /* @__PURE__ */ new Set();
  for (const profile of profiles) {
    if (profile.tags && Array.isArray(profile.tags)) {
      profile.tags.forEach((tag) => allTags.add(tag));
    }
  }
  return Array.from(allTags).sort();
}
async function updateProfileTags(userId, profileId, tags) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    throw new Error("Profile not found");
  }
  await db.update(scriptProfiles).set({ tags: tags.length > 0 ? tags : null }).where(eq3(scriptProfiles.id, profileId));
}
async function getProfilesByTag(userId, tag) {
  const profiles = await getScriptProfiles(userId);
  return profiles.filter((p) => p.tags && p.tags.includes(tag));
}
async function generateComparisonScripts(userId, topic, profileIds, model = "gpt-4o", customInstructions) {
  const results = [];
  for (const profileId of profileIds) {
    const startTime = Date.now();
    try {
      const result = await generateEnhancedScript(
        userId,
        topic,
        model,
        customInstructions,
        profileId
      );
      const profile = result.profileUsed;
      results.push({
        profileId,
        profileName: profile?.name || "Profil inconnu",
        script: result.script,
        wordCount: result.wordCount,
        generationTime: Date.now() - startTime
      });
    } catch (error) {
      console.error(`Error generating script for profile ${profileId}:`, error);
      results.push({
        profileId,
        profileName: "Erreur",
        script: `Erreur lors de la g\xE9n\xE9ration: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        wordCount: 0,
        generationTime: Date.now() - startTime
      });
    }
  }
  return results;
}
async function analyzeNegativeScripts(userId) {
  const db = await getDb();
  if (!db) {
    return {
      problems: [],
      suggestedCorrections: [],
      overallFeedback: "Base de donn\xE9es non disponible"
    };
  }
  const negativeScripts = await db.select().from(scriptHistory).where(and3(
    eq3(scriptHistory.userId, userId),
    eq3(scriptHistory.rating, -1)
  )).orderBy(desc3(scriptHistory.createdAt)).limit(10);
  if (negativeScripts.length === 0) {
    return {
      problems: [],
      suggestedCorrections: [],
      overallFeedback: "Aucun script not\xE9 n\xE9gativement trouv\xE9. Continuez \xE0 g\xE9n\xE9rer et \xE9valuer vos scripts !"
    };
  }
  const existingCorrections = await db.select().from(scriptCorrections).where(eq3(scriptCorrections.userId, userId));
  const existingProblems = existingCorrections.map((c) => c.problem.toLowerCase());
  const scriptsForAnalysis = negativeScripts.map(
    (s, i) => `### Script ${i + 1} (${s.topic}):
${s.generatedScript.slice(0, 2e3)}...

Feedback utilisateur: ${s.feedback || "Aucun feedback"}`
  ).join("\n\n---\n\n");
  const existingCorrectionsText = existingCorrections.length > 0 ? `

CORRECTIONS D\xC9J\xC0 EN PLACE (ne pas r\xE9p\xE9ter):
${existingCorrections.map((c) => `- ${c.problem}`).join("\n")}` : "";
  const analysisPrompt = `Tu es un expert en analyse de scripts YouTube. Analyse les scripts suivants qui ont \xE9t\xE9 not\xE9s n\xE9gativement par l'utilisateur et identifie les probl\xE8mes r\xE9currents.

SCRIPTS \xC0 ANALYSER:
${scriptsForAnalysis}
${existingCorrectionsText}

CAT\xC9GORIES DE CORRECTIONS DISPONIBLES:
- structure: Structure du script
- tone: Ton et style
- length: Longueur des sections
- transitions: Transitions entre sections
- examples: Exemples et illustrations
- engagement: Engagement de l'audience
- cta: Call-to-action
- other: Autres

R\xE9ponds en JSON avec ce format exact:
{
  "problems": ["probl\xE8me 1", "probl\xE8me 2", ...],
  "suggestedCorrections": [
    {
      "problem": "description du probl\xE8me identifi\xE9",
      "correction": "r\xE8gle corrective \xE0 appliquer",
      "category": "une des cat\xE9gories ci-dessus"
    }
  ],
  "overallFeedback": "R\xE9sum\xE9 g\xE9n\xE9ral des am\xE9liorations \xE0 apporter"
}

Propose 3 \xE0 5 corrections concr\xE8tes et actionnables.`;
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Tu es un expert en analyse de scripts YouTube. Tu r\xE9ponds uniquement en JSON valide."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "script_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              problems: {
                type: "array",
                items: { type: "string" },
                description: "Liste des probl\xE8mes identifi\xE9s"
              },
              suggestedCorrections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    problem: { type: "string", description: "Description du probl\xE8me" },
                    correction: { type: "string", description: "R\xE8gle corrective" },
                    category: {
                      type: "string",
                      enum: ["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"],
                      description: "Cat\xE9gorie de la correction"
                    }
                  },
                  required: ["problem", "correction", "category"],
                  additionalProperties: false
                },
                description: "Corrections sugg\xE9r\xE9es"
              },
              overallFeedback: {
                type: "string",
                description: "Feedback g\xE9n\xE9ral"
              }
            },
            required: ["problems", "suggestedCorrections", "overallFeedback"],
            additionalProperties: false
          }
        }
      }
    });
    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No response from LLM");
    }
    const content = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);
    const analysis = JSON.parse(content);
    analysis.suggestedCorrections = analysis.suggestedCorrections.filter(
      (c) => !existingProblems.includes(c.problem.toLowerCase())
    );
    return analysis;
  } catch (error) {
    console.error("Error analyzing negative scripts:", error);
    return {
      problems: ["Erreur lors de l'analyse"],
      suggestedCorrections: [],
      overallFeedback: `Erreur lors de l'analyse: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    };
  }
}
async function applySuggestedCorrections(userId, corrections) {
  let applied = 0;
  for (const correction of corrections) {
    try {
      await addScriptCorrection(
        userId,
        correction.problem,
        correction.correction,
        correction.category
      );
      applied++;
    } catch (error) {
      console.error("Error applying correction:", error);
    }
  }
  return { applied };
}
async function saveProfileVersion(userId, profileId, changeDescription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    throw new Error("Profile not found");
  }
  const latestVersion = await db.select({ maxVersion: sql3`MAX(version)` }).from(scriptProfileVersions).where(eq3(scriptProfileVersions.profileId, profileId));
  const newVersion = (latestVersion[0]?.maxVersion || 0) + 1;
  await db.insert(scriptProfileVersions).values({
    profileId,
    version: newVersion,
    name: profile[0].name,
    description: profile[0].description,
    content: profile[0].metaPrompt,
    changeDescription: changeDescription || null
  });
  return { version: newVersion };
}
async function getProfileVersions(userId, profileId) {
  const db = await getDb();
  if (!db) return [];
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    return [];
  }
  const versions = await db.select().from(scriptProfileVersions).where(eq3(scriptProfileVersions.profileId, profileId)).orderBy(desc3(scriptProfileVersions.version));
  return versions.map((v) => ({
    ...v,
    isFavorite: v.isFavorite ?? false
  }));
}
async function restoreProfileVersion(userId, profileId, versionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    throw new Error("Profile not found");
  }
  const version = await db.select().from(scriptProfileVersions).where(and3(
    eq3(scriptProfileVersions.id, versionId),
    eq3(scriptProfileVersions.profileId, profileId)
  )).limit(1);
  if (version.length === 0) {
    throw new Error("Version not found");
  }
  await saveProfileVersion(userId, profileId, `Avant restauration vers v${version[0].version}`);
  await db.update(scriptProfiles).set({
    name: version[0].name,
    description: version[0].description,
    metaPrompt: version[0].content,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(scriptProfiles.id, profileId));
  await saveProfileVersion(userId, profileId, `Restaur\xE9 depuis v${version[0].version}`);
  return { success: true };
}
async function compareProfileVersions(userId, profileId, versionId1, versionId2) {
  const db = await getDb();
  if (!db) return { version1: null, version2: null };
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    return { version1: null, version2: null };
  }
  const [v1, v2] = await Promise.all([
    db.select().from(scriptProfileVersions).where(and3(eq3(scriptProfileVersions.id, versionId1), eq3(scriptProfileVersions.profileId, profileId))).limit(1),
    db.select().from(scriptProfileVersions).where(and3(eq3(scriptProfileVersions.id, versionId2), eq3(scriptProfileVersions.profileId, profileId))).limit(1)
  ]);
  return {
    version1: v1[0] || null,
    version2: v2[0] || null
  };
}
async function getProfileBranches(userId, profileId) {
  const db = await getDb();
  if (!db) return [];
  const branches = await db.select().from(scriptProfileBranches).where(and3(
    eq3(scriptProfileBranches.profileId, profileId),
    eq3(scriptProfileBranches.userId, userId)
  )).orderBy(desc3(scriptProfileBranches.createdAt));
  return branches;
}
async function createProfileBranch(userId, profileId, name, description) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = await db.select().from(scriptProfiles).where(and3(eq3(scriptProfiles.id, profileId), eq3(scriptProfiles.userId, userId))).limit(1);
  if (profile.length === 0) {
    throw new Error("Profile not found");
  }
  const latestVersion = await db.select({ id: scriptProfileVersions.id }).from(scriptProfileVersions).where(eq3(scriptProfileVersions.profileId, profileId)).orderBy(desc3(scriptProfileVersions.version)).limit(1);
  const result = await db.insert(scriptProfileBranches).values({
    profileId,
    userId,
    name,
    description: description || null,
    metaPrompt: profile[0].metaPrompt,
    parentVersionId: latestVersion[0]?.id || null,
    status: "active"
  });
  return { id: Number(result[0].insertId) };
}
async function updateProfileBranch(userId, branchId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scriptProfileBranches).set({
    ...updates,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and3(
    eq3(scriptProfileBranches.id, branchId),
    eq3(scriptProfileBranches.userId, userId)
  ));
}
async function mergeBranch(userId, branchId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const branch = await db.select().from(scriptProfileBranches).where(and3(
    eq3(scriptProfileBranches.id, branchId),
    eq3(scriptProfileBranches.userId, userId),
    eq3(scriptProfileBranches.status, "active")
  )).limit(1);
  if (branch.length === 0) {
    throw new Error("Branch not found or not active");
  }
  const profileId = branch[0].profileId;
  await saveProfileVersion(userId, profileId, `Avant fusion de la branche "${branch[0].name}"`);
  await db.update(scriptProfiles).set({
    metaPrompt: branch[0].metaPrompt,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(scriptProfiles.id, profileId));
  await db.update(scriptProfileBranches).set({
    status: "merged",
    mergedAt: /* @__PURE__ */ new Date()
  }).where(eq3(scriptProfileBranches.id, branchId));
  await saveProfileVersion(userId, profileId, `Apr\xE8s fusion de la branche "${branch[0].name}"`);
  return { success: true };
}
async function abandonBranch(userId, branchId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scriptProfileBranches).set({
    status: "abandoned",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and3(
    eq3(scriptProfileBranches.id, branchId),
    eq3(scriptProfileBranches.userId, userId)
  ));
}
async function deleteBranch(userId, branchId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scriptProfileBranches).where(and3(
    eq3(scriptProfileBranches.id, branchId),
    eq3(scriptProfileBranches.userId, userId)
  ));
}
async function reactivateBranch(userId, branchId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scriptProfileBranches).set({
    status: "active",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and3(
    eq3(scriptProfileBranches.id, branchId),
    eq3(scriptProfileBranches.userId, userId),
    eq3(scriptProfileBranches.status, "abandoned")
  ));
}
function generateVersionDiff(oldContent, newContent) {
  const diff = Diff.diffLines(oldContent, newContent);
  const lines = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;
  diff.forEach((part) => {
    const partLines = part.value.split("\n").filter(
      (line, idx, arr) => (
        // Remove empty last line from split
        !(idx === arr.length - 1 && line === "")
      )
    );
    partLines.forEach((line) => {
      if (part.added) {
        lines.push({ type: "added", content: line });
        addedCount++;
      } else if (part.removed) {
        lines.push({ type: "removed", content: line });
        removedCount++;
      } else {
        lines.push({ type: "unchanged", content: line });
        unchangedCount++;
      }
    });
  });
  return {
    lines,
    stats: {
      added: addedCount,
      removed: removedCount,
      unchanged: unchangedCount
    }
  };
}
async function getVersionDiff(userId, profileId, versionId1, versionId2) {
  const comparison = await compareProfileVersions(userId, profileId, versionId1, versionId2);
  if (!comparison.version1 || !comparison.version2) {
    return null;
  }
  return generateVersionDiff(comparison.version1.content, comparison.version2.content);
}
async function toggleVersionFavorite(userId, versionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const version = await db.select({
    id: scriptProfileVersions.id,
    profileId: scriptProfileVersions.profileId,
    isFavorite: scriptProfileVersions.isFavorite
  }).from(scriptProfileVersions).where(eq3(scriptProfileVersions.id, versionId)).limit(1);
  if (version.length === 0) {
    throw new Error("Version not found");
  }
  const profile = await db.select().from(scriptProfiles).where(and3(
    eq3(scriptProfiles.id, version[0].profileId),
    eq3(scriptProfiles.userId, userId)
  )).limit(1);
  if (profile.length === 0) {
    throw new Error("Access denied");
  }
  const newFavoriteStatus = !version[0].isFavorite;
  await db.update(scriptProfileVersions).set({ isFavorite: newFavoriteStatus }).where(eq3(scriptProfileVersions.id, versionId));
  return { isFavorite: newFavoriteStatus };
}
async function getFavoriteVersions(userId) {
  const db = await getDb();
  if (!db) return [];
  const userProfiles = await db.select({ id: scriptProfiles.id }).from(scriptProfiles).where(eq3(scriptProfiles.userId, userId));
  if (userProfiles.length === 0) {
    return [];
  }
  const profileIds = userProfiles.map((p) => p.id);
  const favorites = await db.select().from(scriptProfileVersions).where(and3(
    inArray(scriptProfileVersions.profileId, profileIds),
    eq3(scriptProfileVersions.isFavorite, true)
  )).orderBy(desc3(scriptProfileVersions.createdAt));
  return favorites;
}

// server/autoBackup.ts
init_db();
init_schema();
init_storage();
import { eq as eq5 } from "drizzle-orm";

// server/pushNotifications.ts
init_notification();
init_db();
init_schema();
import { eq as eq4, and as and4 } from "drizzle-orm";

// server/autoBackup.ts
async function generateBackup(userId) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const profiles = await db.select().from(scriptProfiles).where(eq5(scriptProfiles.userId, userId));
  const corrections = await db.select().from(scriptCorrections).where(eq5(scriptCorrections.userId, userId));
  const history = await db.select().from(scriptHistory).where(eq5(scriptHistory.userId, userId));
  const coordScripts = await db.select().from(coordinationScripts).where(eq5(coordinationScripts.userId, userId));
  const instructions = await db.select().from(instructionScripts).where(eq5(instructionScripts.userId, userId));
  const backupData = {
    version: "1.0",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    userId,
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      metaPrompt: p.metaPrompt,
      tags: p.tags ? typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags : [],
      isDefault: p.isDefault,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    })),
    corrections: corrections.map((c) => ({
      id: c.id,
      category: c.category,
      problem: c.problem,
      correction: c.correction,
      isActive: c.isActive,
      appliedCount: c.appliedCount || 0,
      createdAt: c.createdAt.toISOString()
    })),
    history: history.map((h) => ({
      id: h.id,
      profileId: h.profileId,
      subject: h.topic,
      instructions: h.customInstructions,
      generatedScript: h.generatedScript,
      wordCount: h.wordCount || 0,
      rating: h.rating ? String(h.rating) : null,
      createdAt: h.createdAt.toISOString()
    })),
    coordinationScripts: coordScripts.map((cs) => ({
      id: cs.id,
      name: cs.scriptType,
      type: cs.scriptType,
      content: cs.content,
      isActive: true,
      createdAt: cs.createdAt.toISOString(),
      updatedAt: cs.createdAt.toISOString()
    })),
    instructionScripts: instructions.map((i) => ({
      id: i.id,
      name: i.scriptType,
      scriptType: i.scriptType,
      content: i.content,
      isActive: i.isActive,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.createdAt.toISOString()
    }))
  };
  return backupData;
}
async function saveBackupToS3(userId, backupData) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const fileName = `backups/user-${userId}/backup-${timestamp2}.json`;
  const jsonContent = JSON.stringify(backupData, null, 2);
  const buffer = Buffer.from(jsonContent, "utf-8");
  const { url } = await storagePut(fileName, buffer, "application/json");
  const sizeInKB = (buffer.length / 1024).toFixed(2);
  const size = buffer.length > 1024 * 1024 ? `${(buffer.length / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKB} KB`;
  return { url, size };
}
async function restoreFromBackup(userId, backupData) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  let profilesRestored = 0;
  let correctionsRestored = 0;
  for (const profile of backupData.profiles) {
    try {
      await db.insert(scriptProfiles).values({
        userId,
        name: `${profile.name} (restaur\xE9)`,
        description: profile.description,
        metaPrompt: profile.metaPrompt,
        tags: profile.tags,
        isDefault: false
        // Ne pas écraser le profil par défaut
      });
      profilesRestored++;
    } catch (error) {
      console.warn(`[AutoBackup] Failed to restore profile ${profile.name}:`, error);
    }
  }
  for (const correction of backupData.corrections) {
    try {
      await db.insert(scriptCorrections).values({
        userId,
        category: correction.category,
        problem: correction.problem,
        correction: correction.correction,
        isActive: correction.isActive,
        appliedCount: 0
        // Reset le compteur
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
      corrections: correctionsRestored
    }
  };
}
function estimateBackupSize(backupData) {
  const jsonContent = JSON.stringify(backupData);
  const sizeInBytes = Buffer.from(jsonContent, "utf-8").length;
  if (sizeInBytes > 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(sizeInBytes / 1024).toFixed(2)} KB`;
}

// server/settings.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
async function getUserSettings(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq6(userSettings.userId, userId)).limit(1);
  if (result.length === 0) {
    await db.insert(userSettings).values({ userId });
    return {
      theme: "system",
      backupFrequency: "weekly",
      abTestCtrThreshold: 5,
      abTestViewsThreshold: 1e3,
      notifyNewVideos: true,
      notifyABTestThreshold: true,
      notifyBackupComplete: true
    };
  }
  const settings = result[0];
  return {
    theme: settings.theme || "system",
    backupFrequency: settings.backupFrequency || "weekly",
    abTestCtrThreshold: parseFloat(settings.abTestCtrThreshold || "5.00"),
    abTestViewsThreshold: settings.abTestViewsThreshold || 1e3,
    notifyNewVideos: settings.notifyNewVideos ?? true,
    notifyABTestThreshold: settings.notifyABTestThreshold ?? true,
    notifyBackupComplete: settings.notifyBackupComplete ?? true
  };
}
async function updateUserSettings(userId, data) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(userSettings).where(eq6(userSettings.userId, userId)).limit(1);
  const updateData = {};
  if (data.theme !== void 0) updateData.theme = data.theme;
  if (data.backupFrequency !== void 0) updateData.backupFrequency = data.backupFrequency;
  if (data.abTestCtrThreshold !== void 0) updateData.abTestCtrThreshold = data.abTestCtrThreshold.toString();
  if (data.abTestViewsThreshold !== void 0) updateData.abTestViewsThreshold = data.abTestViewsThreshold;
  if (data.notifyNewVideos !== void 0) updateData.notifyNewVideos = data.notifyNewVideos;
  if (data.notifyABTestThreshold !== void 0) updateData.notifyABTestThreshold = data.notifyABTestThreshold;
  if (data.notifyBackupComplete !== void 0) updateData.notifyBackupComplete = data.notifyBackupComplete;
  if (existing.length === 0) {
    await db.insert(userSettings).values({ userId, ...updateData });
  } else {
    await db.update(userSettings).set(updateData).where(eq6(userSettings.userId, userId));
  }
  return true;
}
async function getVideoTemplates(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(videoTemplates).where(eq6(videoTemplates.userId, userId));
  return result.map((t2) => ({
    id: t2.id,
    name: t2.name,
    titleTemplate: t2.titleTemplate,
    descriptionTemplate: t2.descriptionTemplate,
    tagsTemplate: t2.tagsTemplate || [],
    category: t2.category,
    isDefault: t2.isDefault ?? false,
    usageCount: t2.usageCount ?? 0,
    createdAt: t2.createdAt.toISOString(),
    updatedAt: t2.updatedAt.toISOString()
  }));
}
async function createVideoTemplate(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.isDefault) {
    await db.update(videoTemplates).set({ isDefault: false }).where(eq6(videoTemplates.userId, userId));
  }
  const result = await db.insert(videoTemplates).values({
    userId,
    name: data.name,
    titleTemplate: data.titleTemplate || null,
    descriptionTemplate: data.descriptionTemplate || null,
    tagsTemplate: data.tagsTemplate || [],
    category: data.category || null,
    isDefault: data.isDefault || false
  });
  return result[0].insertId;
}
async function updateVideoTemplate(templateId, userId, data) {
  const db = await getDb();
  if (!db) return false;
  if (data.isDefault) {
    await db.update(videoTemplates).set({ isDefault: false }).where(eq6(videoTemplates.userId, userId));
  }
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.titleTemplate !== void 0) updateData.titleTemplate = data.titleTemplate;
  if (data.descriptionTemplate !== void 0) updateData.descriptionTemplate = data.descriptionTemplate;
  if (data.tagsTemplate !== void 0) updateData.tagsTemplate = data.tagsTemplate;
  if (data.category !== void 0) updateData.category = data.category;
  if (data.isDefault !== void 0) updateData.isDefault = data.isDefault;
  await db.update(videoTemplates).set(updateData).where(eq6(videoTemplates.id, templateId));
  return true;
}
async function deleteVideoTemplate(templateId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(videoTemplates).where(eq6(videoTemplates.id, templateId));
  return true;
}
async function incrementTemplateUsage(templateId) {
  const db = await getDb();
  if (!db) return;
  const template = await db.select().from(videoTemplates).where(eq6(videoTemplates.id, templateId)).limit(1);
  if (template.length > 0) {
    await db.update(videoTemplates).set({ usageCount: (template[0].usageCount || 0) + 1 }).where(eq6(videoTemplates.id, templateId));
  }
}
async function getTemplateCategories(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ category: videoTemplates.category }).from(videoTemplates).where(eq6(videoTemplates.userId, userId));
  const categories = /* @__PURE__ */ new Set();
  result.forEach((r) => {
    if (r.category) categories.add(r.category);
  });
  return Array.from(categories).sort();
}
async function duplicateVideoTemplate(templateId, userId, newName) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const original = await db.select().from(videoTemplates).where(eq6(videoTemplates.id, templateId)).limit(1);
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
    isDefault: false
  });
  return result[0].insertId;
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  youtube: router({
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      return { url: getAuthUrl(ctx.user.id) };
    }),
    handleCallback: publicProcedure.input(z2.object({
      code: z2.string(),
      state: z2.string().optional()
      // userId passé dans le state
    })).mutation(async ({ input }) => {
      const userId = input.state ? parseInt(input.state, 10) : null;
      if (!userId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "User ID manquant dans le state"
        });
      }
      const success = await handleCallback(input.code, userId);
      if (success) {
        try {
          const videos3 = await fetchUserYouTubeVideos(userId, 30);
          let videosAdded = 0;
          let videosUpdated = 0;
          for (const video of videos3) {
            const existingVideo = await getVideoByYouTubeId(video.id, userId);
            if (existingVideo) {
              await updateVideo(existingVideo.id, {
                title: video.title,
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                viewCount: video.viewCount,
                likeCount: video.likeCount,
                commentCount: video.commentCount
              });
              videosUpdated++;
            } else {
              await createVideo({
                userId,
                youtubeId: video.id,
                title: video.title,
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                channelId: video.channelId,
                channelTitle: video.channelTitle,
                publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
                viewCount: video.viewCount,
                likeCount: video.likeCount,
                commentCount: video.commentCount,
                duration: video.duration,
                tags: video.tags ? JSON.stringify(video.tags) : null
              });
              videosAdded++;
            }
          }
          console.log(`[YouTube Sync] Initial sync completed: ${videosAdded} added, ${videosUpdated} updated`);
        } catch (error) {
          console.error("[YouTube Sync] Error during initial sync:", error);
        }
      }
      return { success };
    }),
    checkAuth: protectedProcedure.query(async ({ ctx }) => {
      const authenticated = await hasYouTubeAuth(ctx.user.id);
      return { authenticated };
    }),
    revokeAuth: protectedProcedure.mutation(({ ctx }) => {
      const success = revokeYouTubeAuth(ctx.user.id);
      return { success };
    }),
    syncMyVideos: protectedProcedure.input(z2.object({
      periodDays: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      try {
        if (!hasYouTubeAuth(ctx.user.id)) {
          throw new Error("YouTube authentication required");
        }
        const videos3 = await fetchUserYouTubeVideos(ctx.user.id, input.periodDays);
        let videosAdded = 0;
        let videosUpdated = 0;
        for (const video of videos3) {
          const existingVideo = await getVideoByYouTubeId(video.id, ctx.user.id);
          if (existingVideo) {
            await updateVideo(existingVideo.id, {
              title: video.title,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
              transcript: video.transcript,
              watchTimeMinutes: video.watchTimeMinutes,
              averageViewDuration: video.averageViewDuration,
              retentionCurve: video.retentionCurve
            });
            videosUpdated++;
          } else {
            await createVideo({
              userId: ctx.user.id,
              youtubeId: video.id,
              title: video.title,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              channelId: video.channelId,
              channelTitle: video.channelTitle,
              publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
              duration: video.duration,
              tags: JSON.stringify(video.tags),
              transcript: video.transcript,
              watchTimeMinutes: video.watchTimeMinutes,
              averageViewDuration: video.averageViewDuration,
              retentionCurve: video.retentionCurve
            });
            videosAdded++;
          }
        }
        const result = {
          success: true,
          videosAdded,
          videosUpdated,
          errors: []
        };
        return result;
      } catch (error) {
        console.error("[Sync Error]", error);
        return {
          success: false,
          videosAdded: 0,
          videosUpdated: 0,
          errors: [error.message]
        };
      }
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  videos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getVideosByUserId(ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      return await getVideoById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      youtubeId: z2.string(),
      title: z2.string(),
      description: z2.string().optional(),
      thumbnailUrl: z2.string().optional(),
      channelId: z2.string().optional(),
      channelTitle: z2.string().optional(),
      publishedAt: z2.string().optional(),
      viewCount: z2.number().optional(),
      likeCount: z2.number().optional(),
      commentCount: z2.number().optional(),
      duration: z2.string().optional(),
      tags: z2.array(z2.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      const videoId = await createVideo({
        userId: ctx.user.id,
        youtubeId: input.youtubeId,
        title: input.title,
        description: input.description || null,
        thumbnailUrl: input.thumbnailUrl || null,
        channelId: input.channelId || null,
        channelTitle: input.channelTitle || null,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        viewCount: input.viewCount || 0,
        likeCount: input.likeCount || 0,
        commentCount: input.commentCount || 0,
        duration: input.duration || null,
        tags: input.tags ? JSON.stringify(input.tags) : null
      });
      return { id: videoId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string().optional(),
      description: z2.string().optional(),
      thumbnailUrl: z2.string().optional(),
      tags: z2.string().optional(),
      transcript: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateVideo(id, data, ctx.user.id);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteVideo(input.id, ctx.user.id);
      return { success: true };
    }),
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAllVideos(ctx.user.id);
      return { success: true };
    }),
    syncFromYouTube: protectedProcedure.input(z2.object({
      channelId: z2.string(),
      periodDays: z2.number().optional()
      // Nombre de jours à synchroniser (undefined = tout)
    })).mutation(async ({ ctx, input }) => {
      try {
        const youtubeVideos = await fetchYouTubeVideos(input.channelId, input.periodDays);
        let videosAdded = 0;
        let videosUpdated = 0;
        const errors = [];
        for (const ytVideo of youtubeVideos) {
          try {
            const existingVideos = await getVideosByUserId(ctx.user.id);
            const existing = existingVideos.find((v) => v.youtubeId === ytVideo.id);
            if (existing) {
              await updateVideo(existing.id, {
                title: ytVideo.title,
                description: ytVideo.description,
                thumbnailUrl: ytVideo.thumbnailUrl,
                viewCount: ytVideo.viewCount,
                likeCount: ytVideo.likeCount,
                commentCount: ytVideo.commentCount
              });
              videosUpdated++;
            } else {
              await createVideo({
                userId: ctx.user.id,
                youtubeId: ytVideo.id,
                title: ytVideo.title,
                description: ytVideo.description,
                thumbnailUrl: ytVideo.thumbnailUrl,
                channelId: ytVideo.channelId,
                channelTitle: ytVideo.channelTitle,
                publishedAt: null,
                // L'API Manus retourne du texte, pas une date ISO
                viewCount: ytVideo.viewCount,
                likeCount: ytVideo.likeCount,
                commentCount: ytVideo.commentCount,
                duration: ytVideo.duration,
                tags: JSON.stringify(ytVideo.tags),
                transcript: ytVideo.transcript || null,
                watchTimeMinutes: ytVideo.watchTimeMinutes || 0,
                averageViewDuration: ytVideo.averageViewDuration || 0
              });
              videosAdded++;
            }
          } catch (error) {
            errors.push(`Failed to sync video ${ytVideo.id}: ${error}`);
          }
        }
        const channelTitle = youtubeVideos.length > 0 ? youtubeVideos[0].channelTitle : null;
        await upsertChannelSyncInfo({
          userId: ctx.user.id,
          channelId: input.channelId,
          channelTitle: channelTitle || "Cha\xEEne YouTube",
          videoCount: videosAdded + videosUpdated
        });
        return {
          success: true,
          videosAdded,
          videosUpdated,
          errors,
          channelTitle: channelTitle || void 0
        };
      } catch (error) {
        return {
          success: false,
          videosAdded: 0,
          videosUpdated: 0,
          errors: [String(error)]
        };
      }
    }),
    refreshStats: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const video = await getVideoById(input.id, ctx.user.id);
      if (!video) {
        throw new Error("Video not found");
      }
      const stats = await fetchYouTubeVideoStats(video.youtubeId);
      await updateVideo(input.id, {
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount
      });
      await createVideoStat({
        userId: ctx.user.id,
        videoId: input.id,
        date: /* @__PURE__ */ new Date(),
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
        watchTimeMinutes: 0,
        averageViewDuration: 0,
        subscribersGained: 0
      });
      return { success: true, stats };
    })
  }),
  abTests: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return await getAllTestsByUser(ctx.user.id);
    }),
    listByVideo: protectedProcedure.input(z2.object({ videoId: z2.number() })).query(async ({ ctx, input }) => {
      return await getTestsByVideoId(input.videoId, ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      return await getTestById(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      name: z2.string(),
      variantType: z2.enum(["text", "thumbnail", "both"]).optional(),
      type: z2.enum(["theme", "angle", "optimization"]).optional(),
      hypothesis: z2.string().optional().nullable(),
      description: z2.string().optional(),
      startDate: z2.string().optional(),
      endDate: z2.string().optional(),
      variants: z2.array(z2.object({
        title: z2.string(),
        thumbnailTitle: z2.string().optional(),
        thumbnailPrompt: z2.string().optional(),
        isControl: z2.boolean().optional()
      })).optional()
    })).mutation(async ({ ctx, input }) => {
      const testId = await createABTest({
        userId: ctx.user.id,
        videoId: input.videoId,
        name: input.name,
        description: input.description || null,
        variantType: input.variantType || "both",
        status: "active",
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null
      });
      if (input.variants && input.variants.length > 0) {
        for (const variant of input.variants) {
          await createVariant({
            testId,
            userId: ctx.user.id,
            title: variant.title,
            thumbnailUrl: "",
            thumbnailTitle: variant.thumbnailTitle || null,
            prompt: variant.thumbnailPrompt || null,
            isControl: variant.isControl || false
          });
        }
      }
      return { id: testId };
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["active", "paused", "completed"])
    })).mutation(async ({ ctx, input }) => {
      await updateABTest(input.id, ctx.user.id, { status: input.status });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteABTest(input.id, ctx.user.id);
      return { success: true };
    }),
    declareWinner: protectedProcedure.input(z2.object({
      testId: z2.number(),
      winnerId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      await updateABTest(input.testId, ctx.user.id, {
        winnerId: input.winnerId,
        status: "completed"
      });
      return { success: true };
    }),
    completeTest: protectedProcedure.input(z2.object({
      testId: z2.number(),
      distributions: z2.array(z2.object({
        variantId: z2.number(),
        watchTimePercentage: z2.number()
      })),
      winnerId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      for (const dist of input.distributions) {
        await updateVariant(dist.variantId, ctx.user.id, {
          watchTimePercentage: dist.watchTimePercentage
        });
      }
      await updateABTest(input.testId, ctx.user.id, {
        winnerId: input.winnerId,
        status: "completed",
        endDate: /* @__PURE__ */ new Date()
      });
      return { success: true };
    }),
    exportPDF: protectedProcedure.input(z2.object({ testId: z2.number() })).mutation(async ({ ctx, input }) => {
      const { generateTestReportPDF: generateTestReportPDF2 } = await Promise.resolve().then(() => (init_exportPDF(), exportPDF_exports));
      const test = await getTestById(input.testId, ctx.user.id);
      if (!test) throw new Error("Test not found");
      const variants = await getVariantsByTestId(input.testId, ctx.user.id);
      const pdfBuffer = await generateTestReportPDF2({ test, variants });
      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `test-${test.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`
      };
    }),
    exportCSV: protectedProcedure.input(z2.object({ testId: z2.number() })).mutation(async ({ ctx, input }) => {
      const test = await getTestById(input.testId, ctx.user.id);
      if (!test) throw new Error("Test not found");
      const variants = await getVariantsByTestId(input.testId, ctx.user.id);
      const headers = [
        "Variante",
        "Type",
        "Contr\xF4le",
        "Impressions",
        "Clics",
        "CTR (%)",
        "Vues",
        "Likes",
        "Commentaires",
        "Engagement (%)"
      ];
      const rows = variants.map((v) => [
        v.title,
        v.variantType || "title",
        v.isControl ? "Oui" : "Non",
        v.impressions || 0,
        v.clicks || 0,
        v.clickThroughRate ? (v.clickThroughRate / 100).toFixed(2) : "0.00",
        v.views || 0,
        v.likes || 0,
        v.comments || 0,
        v.engagementRate ? (v.engagementRate / 100).toFixed(2) : "0.00"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");
      return {
        csv: Buffer.from(csvContent, "utf-8").toString("base64"),
        filename: `test-${test.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.csv`
      };
    })
  }),
  testVariants: router({
    listByTest: protectedProcedure.input(z2.object({ testId: z2.number() })).query(async ({ ctx, input }) => {
      return await getVariantsByTestId(input.testId, ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      testId: z2.number(),
      name: z2.string(),
      title: z2.string(),
      thumbnailTitle: z2.string().optional(),
      description: z2.string().optional(),
      isControl: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const variantId = await createTestVariant({
        testId: input.testId,
        userId: ctx.user.id,
        title: input.title,
        thumbnailUrl: "",
        thumbnailTitle: input.thumbnailTitle || null,
        isControl: input.isControl || false
      });
      return { id: variantId };
    }),
    updateMetrics: protectedProcedure.input(z2.object({
      variantId: z2.number(),
      impressions: z2.number().optional(),
      clicks: z2.number().optional(),
      ctr: z2.number().optional(),
      trafficShare: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const { variantId, impressions, clicks, ctr, trafficShare } = input;
      const updates = {};
      if (impressions !== void 0) updates.impressions = impressions;
      if (clicks !== void 0) updates.clicks = clicks;
      if (ctr !== void 0) updates.ctr = ctr;
      if (trafficShare !== void 0) updates.trafficShare = trafficShare;
      if (ctr === void 0 && impressions !== void 0 && clicks !== void 0 && impressions > 0) {
        updates.ctr = clicks / impressions * 100;
      }
      await updateTestVariant(variantId, ctx.user.id, updates);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteTestVariant(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  videoStats: router({
    listByVideo: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      limit: z2.number().optional()
    })).query(async ({ ctx, input }) => {
      return await getStatsByVideoId(input.videoId, ctx.user.id, input.limit);
    })
  }),
  openai: router({
    generateStrategy: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      transcript: z2.string(),
      currentTitle: z2.string(),
      channelId: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { generateStrategy: generateStrategy2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const { generateABTestReport: generateABTestReport2 } = await Promise.resolve().then(() => (init_abTestReport(), abTestReport_exports));
      const { createAiGenerationHistory: createAiGenerationHistory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { fetchChannelTitles: fetchChannelTitles2, formatChannelTitlesForPrompt: formatChannelTitlesForPrompt2 } = await Promise.resolve().then(() => (init_channelTitles(), channelTitles_exports));
      const startTime = Date.now();
      let success = false;
      let errorMessage;
      try {
        const abTestReport = await generateABTestReport2(input.videoId, ctx.user.id);
        let currentChannelTitles = "";
        if (input.channelId) {
          try {
            const titles = await fetchChannelTitles2(input.channelId);
            currentChannelTitles = formatChannelTitlesForPrompt2(titles);
          } catch (error) {
            console.error("[generateStrategy] Error fetching channel titles:", error);
          }
        }
        const result = await generateStrategy2({
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          current_channel_titles: currentChannelTitles,
          model: input.model,
          userId: ctx.user.id
        });
        success = result.success;
        if (!success) {
          errorMessage = result.error;
        }
        const durationMs = Date.now() - startTime;
        const generationId = await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "strategy",
          model: input.model || "gpt-4o",
          durationMs,
          success,
          errorMessage
        });
        return {
          strategy: result.data || "",
          generationId
        };
      } catch (error) {
        errorMessage = error.message;
        const durationMs = Date.now() - startTime;
        await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "strategy",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage
        });
        throw error;
      }
    }),
    exportABTestReport: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      videoTitle: z2.string()
    })).query(async ({ input, ctx }) => {
      const { generateABTestReport: generateABTestReport2, formatReportForDownload: formatReportForDownload2 } = await Promise.resolve().then(() => (init_abTestReport(), abTestReport_exports));
      const report = await generateABTestReport2(input.videoId, ctx.user.id);
      const formattedReport = formatReportForDownload2(report, input.videoTitle);
      return { report: formattedReport };
    }),
    generateSuggestions: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      transcript: z2.string(),
      currentTitle: z2.string(),
      strategy: z2.string().optional(),
      customPrompt: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { generateSuggestions: generateSuggestions2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const { generateABTestReport: generateABTestReport2 } = await Promise.resolve().then(() => (init_abTestReport(), abTestReport_exports));
      const { createAiGenerationHistory: createAiGenerationHistory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const startTime = Date.now();
      let success = false;
      let errorMessage;
      try {
        const abTestReport = await generateABTestReport2(input.videoId, ctx.user.id);
        const result = await generateSuggestions2({
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          strategy_summary: input.strategy || input.customPrompt || "G\xE9n\xE9rer des titres optimis\xE9s",
          model: input.model
        });
        success = result.success;
        if (!success) {
          errorMessage = result.error;
        }
        const durationMs = Date.now() - startTime;
        if (result.success && result.data && result.data.video_title_suggestions && Array.isArray(result.data.video_title_suggestions)) {
          const suggestions = result.data.video_title_suggestions.map((item, index) => ({
            title: item.title,
            reason: `Suggestion #${item.rank || index + 1} - Optimis\xE9 pour maximiser le CTR`
          }));
          const generationId2 = await createAiGenerationHistory2({
            userId: ctx.user.id,
            generationType: "title_suggestions",
            model: input.model || "gpt-4o",
            durationMs,
            success,
            errorMessage
          });
          return { suggestions, generationId: generationId2 };
        }
        if (result.success && result.data) {
          console.error("[generateSuggestions] Invalid response structure:", JSON.stringify(result.data, null, 2));
          await createAiGenerationHistory2({
            userId: ctx.user.id,
            generationType: "title_suggestions",
            model: input.model || "gpt-4o",
            durationMs,
            success: false,
            errorMessage: "Invalid response structure"
          });
          throw new Error("La r\xE9ponse de l'IA n'a pas le format attendu. V\xE9rifiez les logs du serveur.");
        }
        const generationId = await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "title_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage: "No suggestions returned"
        });
        return { suggestions: [], generationId };
      } catch (error) {
        errorMessage = error.message;
        const durationMs = Date.now() - startTime;
        await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "title_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage
        });
        throw error;
      }
    }),
    generateThumbnailSuggestions: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      transcript: z2.string(),
      strategy: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { getCoordinationScript: getCoordinationScript2, replaceScriptTags: replaceScriptTags3 } = await Promise.resolve().then(() => (init_coordinationScripts(), coordinationScripts_exports));
      const { getLatestInstructionScript: getLatestInstructionScript3 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      const { generateABTestReport: generateABTestReport2 } = await Promise.resolve().then(() => (init_abTestReport(), abTestReport_exports));
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const { createAiGenerationHistory: createAiGenerationHistory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const startTime = Date.now();
      let success = false;
      let errorMessage;
      try {
        const coordinationScript = await getCoordinationScript2(ctx.user.id, "thumbnail_generation");
        if (!coordinationScript) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Aucun script de coordination pour la g\xE9n\xE9ration de miniatures trouv\xE9. Veuillez cr\xE9er un script dans la page Scripts d'Instructions."
          });
        }
        const guideThumbnailMechanics = await getLatestInstructionScript3(ctx.user.id, "thumbnail_mechanics");
        const guideMidjourneyPrompts = await getLatestInstructionScript3(ctx.user.id, "midjourney_prompts");
        const abTestReport = await generateABTestReport2(input.videoId, ctx.user.id);
        const finalPrompt = await replaceScriptTags3(coordinationScript.content, {
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          strategy_summary: input.strategy || "G\xE9n\xE9rer des suggestions de miniatures optimis\xE9es",
          guide_thumbnail_mechanics: guideThumbnailMechanics?.content || "Guide non disponible",
          guide_midjourney_prompts: guideMidjourneyPrompts?.content || "Guide non disponible"
        });
        const response = await invokeLLM2({
          model: input.model,
          messages: [
            { role: "system", content: "Tu es un expert en optimisation de miniatures YouTube." },
            { role: "user", content: finalPrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "thumbnail_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Titre court et accrocheur de la miniature" },
                        description: { type: "string", description: "Description d\xE9taill\xE9e des \xE9l\xE9ments visuels" },
                        midjourneyPrompt: { type: "string", description: "Prompt Midjourney complet et pr\xEAt \xE0 l'emploi" },
                        rationale: { type: "string", description: "Explication de pourquoi cette miniature devrait performer" }
                      },
                      required: ["title", "description", "midjourneyPrompt", "rationale"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        });
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        if (!content || typeof content !== "string") {
          const generationId2 = await createAiGenerationHistory2({
            userId: ctx.user.id,
            generationType: "thumbnail_suggestions",
            model: input.model || "gpt-4o",
            durationMs,
            success: false,
            errorMessage: "No content returned"
          });
          return { suggestions: [], generationId: generationId2 };
        }
        const parsed = JSON.parse(content);
        success = true;
        const generationId = await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "thumbnail_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success,
          errorMessage
        });
        return { suggestions: parsed.suggestions || [], generationId };
      } catch (error) {
        errorMessage = error.message;
        const durationMs = Date.now() - startTime;
        await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "thumbnail_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage
        });
        throw error;
      }
    }),
    generateTitleAndThumbnailSuggestions: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      transcript: z2.string(),
      currentTitle: z2.string().optional(),
      channelId: z2.string().optional(),
      strategy: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { getCoordinationScript: getCoordinationScript2, replaceScriptTags: replaceScriptTags3 } = await Promise.resolve().then(() => (init_coordinationScripts(), coordinationScripts_exports));
      const { getLatestInstructionScript: getLatestInstructionScript3 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      const { generateABTestReport: generateABTestReport2 } = await Promise.resolve().then(() => (init_abTestReport(), abTestReport_exports));
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const { createAiGenerationHistory: createAiGenerationHistory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { fetchChannelTitles: fetchChannelTitles2, formatChannelTitlesForPrompt: formatChannelTitlesForPrompt2 } = await Promise.resolve().then(() => (init_channelTitles(), channelTitles_exports));
      const startTime = Date.now();
      let success = false;
      let errorMessage;
      try {
        const coordinationScript = await getCoordinationScript2(ctx.user.id, "title_and_thumbnail_generation");
        if (!coordinationScript) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Script de coordination title_and_thumbnail_generation introuvable"
          });
        }
        const guideChannelAnalysis = await getLatestInstructionScript3(ctx.user.id, "channel_analysis");
        const guideTitle = await getLatestInstructionScript3(ctx.user.id, "title_guide");
        const guideScriptAnalysis = await getLatestInstructionScript3(ctx.user.id, "script_analysis");
        const guideThumbnailMechanics = await getLatestInstructionScript3(ctx.user.id, "thumbnail_mechanics");
        const guideMidjourneyPrompts = await getLatestInstructionScript3(ctx.user.id, "midjourney_prompts");
        const abTestReport = await generateABTestReport2(input.videoId, ctx.user.id);
        let currentChannelTitles = "";
        if (input.channelId) {
          try {
            const titles = await fetchChannelTitles2(input.channelId);
            currentChannelTitles = formatChannelTitlesForPrompt2(titles);
          } catch (error) {
            console.error("[generateTitleAndThumbnailSuggestions] Error fetching channel titles:", error);
          }
        }
        const finalPrompt = await replaceScriptTags3(coordinationScript.content, {
          guide_channel_analysis: guideChannelAnalysis?.content || "",
          guide_title: guideTitle?.content || "",
          guide_script_analysis: guideScriptAnalysis?.content || "",
          guide_thumbnail_mechanics: guideThumbnailMechanics?.content || "",
          guide_midjourney_prompts: guideMidjourneyPrompts?.content || "",
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          current_channel_titles: currentChannelTitles,
          strategy_summary: input.strategy || "G\xE9n\xE9rer des titres et miniatures optimis\xE9s"
        });
        const response = await invokeLLM2({
          model: input.model,
          messages: [
            { role: "system", content: finalPrompt },
            { role: "user", content: "G\xE9n\xE8re 10 titres et 10 miniatures pour cette vid\xE9o." }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "title_and_thumbnail_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  video_title_suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "integer" },
                        title: { type: "string" }
                      },
                      required: ["rank", "title"],
                      additionalProperties: false
                    }
                  },
                  thumbnail_suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "integer" },
                        thumbnail_title_variants: {
                          type: "array",
                          items: { type: "string" }
                        },
                        midjourney_prompt_variants: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["rank", "thumbnail_title_variants", "midjourney_prompt_variants"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["video_title_suggestions", "thumbnail_suggestions"],
                additionalProperties: false
              }
            }
          }
        });
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        if (!content || typeof content !== "string") {
          const generationId2 = await createAiGenerationHistory2({
            userId: ctx.user.id,
            generationType: "title_and_thumbnail_suggestions",
            model: input.model || "gpt-4o",
            durationMs,
            success: false,
            errorMessage: "No content returned"
          });
          return { titleSuggestions: [], thumbnailSuggestions: [], generationId: generationId2 };
        }
        const parsed = JSON.parse(content);
        success = true;
        const generationId = await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "title_and_thumbnail_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success,
          errorMessage
        });
        return {
          titleSuggestions: parsed.video_title_suggestions || [],
          thumbnailSuggestions: parsed.thumbnail_suggestions || [],
          generationId
        };
      } catch (error) {
        errorMessage = error.message;
        const durationMs = Date.now() - startTime;
        await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "title_and_thumbnail_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage
        });
        throw error;
      }
    }),
    generateDescriptionSuggestions: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      videoTitle: z2.string(),
      transcript: z2.string(),
      tags: z2.string().optional(),
      strategy: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { getCoordinationScript: getCoordinationScript2, replaceScriptTags: replaceScriptTags3 } = await Promise.resolve().then(() => (init_coordinationScripts(), coordinationScripts_exports));
      const { getLatestInstructionScript: getLatestInstructionScript3 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const { createAiGenerationHistory: createAiGenerationHistory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const startTime = Date.now();
      let success = false;
      let errorMessage;
      try {
        const coordinationScript = await getCoordinationScript2(ctx.user.id, "description_generation");
        if (!coordinationScript) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Script de coordination description_generation introuvable"
          });
        }
        const guideDescription = await getLatestInstructionScript3(ctx.user.id, "description_guide");
        const finalPrompt = await replaceScriptTags3(coordinationScript.content, {
          video_transcript: input.transcript,
          ab_test_report: `Titre actuel: ${input.videoTitle}`,
          guide_description: guideDescription?.content || "",
          custom_instructions: input.strategy || ""
        });
        const response = await invokeLLM2({
          model: input.model,
          messages: [
            { role: "system", content: finalPrompt },
            { role: "user", content: "G\xE9n\xE8re une description YouTube optimis\xE9e pour cette vid\xE9o." }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "description_suggestion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  tags: {
                    type: "string",
                    description: "Tags YouTube optimis\xE9s s\xE9par\xE9s par des virgules (500 caract\xE8res maximum au total)"
                  },
                  length_category: { type: "string" },
                  keyword_density: { type: "number" },
                  question_count: { type: "integer" },
                  rationale: { type: "string" }
                },
                required: ["description", "tags", "length_category", "keyword_density", "question_count", "rationale"],
                additionalProperties: false
              }
            }
          }
        });
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        if (!content || typeof content !== "string") {
          const generationId2 = await createAiGenerationHistory2({
            userId: ctx.user.id,
            generationType: "description_suggestions",
            model: input.model || "gpt-4o",
            durationMs,
            success: false,
            errorMessage: "No content returned"
          });
          return { description: "", rationale: "", generationId: generationId2 };
        }
        const parsed = JSON.parse(content);
        success = true;
        const generationId = await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "description_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success,
          errorMessage
        });
        return { ...parsed, generationId };
      } catch (error) {
        errorMessage = error.message;
        const durationMs = Date.now() - startTime;
        await createAiGenerationHistory2({
          userId: ctx.user.id,
          generationType: "description_suggestions",
          model: input.model || "gpt-4o",
          durationMs,
          success: false,
          errorMessage
        });
        throw error;
      }
    }),
    getAiGenerationStats: protectedProcedure.query(async ({ ctx }) => {
      const { getAiGenerationStats: getAiGenerationStats2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getAiGenerationStats2(ctx.user.id);
    }),
    getBestModelByCategory: protectedProcedure.query(async ({ ctx }) => {
      const { getBestModelByCategory: getBestModelByCategory2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getBestModelByCategory2(ctx.user.id);
    }),
    rateGeneration: protectedProcedure.input(z2.object({
      generationId: z2.number(),
      rating: z2.number().min(1).max(5)
    })).mutation(async ({ input }) => {
      const { updateAiGenerationRating: updateAiGenerationRating2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updateAiGenerationRating2(input.generationId, input.rating);
      return { success: true };
    }),
    saveFavoritePrompt: protectedProcedure.input(z2.object({
      promptType: z2.enum(["strategy", "title", "thumbnail", "description"]),
      promptContent: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { saveFavoritePrompt: saveFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const promptId = await saveFavoritePrompt2({
        userId: ctx.user.id,
        promptType: input.promptType,
        promptContent: input.promptContent
      });
      return { promptId, success: true };
    }),
    listFavoritePrompts: protectedProcedure.input(z2.object({
      promptType: z2.enum(["strategy", "title", "thumbnail", "description"]).optional()
    })).query(async ({ input, ctx }) => {
      const { getFavoritePrompts: getFavoritePrompts2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getFavoritePrompts2(ctx.user.id, input.promptType);
    }),
    deleteFavoritePrompt: protectedProcedure.input(z2.object({
      promptId: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const { deleteFavoritePrompt: deleteFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await deleteFavoritePrompt2(input.promptId, ctx.user.id);
      return { success: true };
    }),
    useFavoritePrompt: protectedProcedure.input(z2.object({
      promptId: z2.number()
    })).mutation(async ({ input }) => {
      const { useFavoritePrompt: useFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await useFavoritePrompt2(input.promptId);
      return { success: true };
    }),
    rateFavoritePrompt: protectedProcedure.input(z2.object({
      promptId: z2.number(),
      rating: z2.number().min(1).max(5)
    })).mutation(async ({ input, ctx }) => {
      const { rateFavoritePrompt: rateFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await rateFavoritePrompt2(input.promptId, input.rating, ctx.user.id);
      return { success: true };
    }),
    updatePromptCategories: protectedProcedure.input(z2.object({
      promptId: z2.number(),
      categories: z2.array(z2.string())
    })).mutation(async ({ input, ctx }) => {
      const { updatePromptCategories: updatePromptCategories2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await updatePromptCategories2(input.promptId, input.categories, ctx.user.id);
      return { success: true };
    }),
    resetRatings: protectedProcedure.input(z2.object({
      promptType: z2.enum(["strategy", "title", "thumbnail", "description", "all"])
    })).mutation(async ({ input, ctx }) => {
      const { resetFavoritePromptRatings: resetFavoritePromptRatings2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const count = await resetFavoritePromptRatings2(ctx.user.id, input.promptType);
      return { success: true, count };
    }),
    resetGenerationRatings: protectedProcedure.input(z2.object({
      generationType: z2.enum(["title", "thumbnail", "description", "strategy", "all"])
    })).mutation(async ({ input, ctx }) => {
      const { resetGenerationRatings: resetGenerationRatings2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const count = await resetGenerationRatings2(ctx.user.id, input.generationType);
      return { success: true, count };
    }),
    exportFavoritePrompts: protectedProcedure.query(async ({ ctx }) => {
      const { getFavoritePrompts: getFavoritePrompts2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const prompts = await getFavoritePrompts2(ctx.user.id);
      return { prompts };
    }),
    importFavoritePrompts: protectedProcedure.input(z2.object({
      prompts: z2.array(z2.object({
        promptType: z2.enum(["strategy", "title", "thumbnail", "description"]),
        promptContent: z2.string(),
        rating: z2.number().optional(),
        categories: z2.array(z2.string()).optional()
      })),
      overwrite: z2.boolean().default(false)
    })).mutation(async ({ input, ctx }) => {
      const { saveFavoritePrompt: saveFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      let imported = 0;
      let skipped = 0;
      for (const prompt of input.prompts) {
        try {
          await saveFavoritePrompt2({
            userId: ctx.user.id,
            promptType: prompt.promptType,
            promptContent: prompt.promptContent,
            rating: prompt.rating,
            categories: prompt.categories ? JSON.stringify(prompt.categories) : void 0
          });
          imported++;
        } catch (error) {
          skipped++;
        }
      }
      return { imported, skipped, success: true };
    })
  }),
  // Favorite Prompts router (alias pour compatibilité avec les composants)
  favoritePrompts: router({
    saveFavoritePrompt: protectedProcedure.input(z2.object({
      promptType: z2.enum(["strategy", "title", "thumbnail", "description"]),
      promptContent: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { saveFavoritePrompt: saveFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const promptId = await saveFavoritePrompt2({
        userId: ctx.user.id,
        promptType: input.promptType,
        promptContent: input.promptContent
      });
      return { promptId, success: true };
    }),
    listFavoritePrompts: protectedProcedure.input(z2.object({
      promptType: z2.enum(["strategy", "title", "thumbnail", "description"]).optional()
    })).query(async ({ input, ctx }) => {
      const { getFavoritePrompts: getFavoritePrompts2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getFavoritePrompts2(ctx.user.id, input.promptType);
    }),
    useFavoritePrompt: protectedProcedure.input(z2.object({
      promptId: z2.number()
    })).mutation(async ({ input }) => {
      const { useFavoritePrompt: useFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await useFavoritePrompt2(input.promptId);
      return { success: true };
    }),
    deleteFavoritePrompt: protectedProcedure.input(z2.object({
      promptId: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const { deleteFavoritePrompt: deleteFavoritePrompt2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await deleteFavoritePrompt2(input.promptId, ctx.user.id);
      return { success: true };
    })
  }),
  // Synchronization router
  sync: router({
    // Get YouTube configuration
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const { getYouTubeConfig: getYouTubeConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getYouTubeConfig2(ctx.user.id);
    }),
    // Get channel sync info (for ID-based sync)
    getChannelSyncInfo: protectedProcedure.query(async ({ ctx }) => {
      const { getChannelSyncInfo: getChannelSyncInfo2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getChannelSyncInfo2(ctx.user.id);
    }),
    // Save YouTube configuration
    saveConfig: protectedProcedure.input(z2.object({
      channelId: z2.string(),
      apiKey: z2.string(),
      autoSyncEnabled: z2.boolean().default(true)
    })).mutation(async ({ ctx, input }) => {
      const { upsertYouTubeConfig: upsertYouTubeConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await upsertYouTubeConfig2({
        userId: ctx.user.id,
        channelId: input.channelId,
        apiKey: input.apiKey,
        autoSyncEnabled: input.autoSyncEnabled,
        lastSyncAt: null
      });
      return { success: true };
    }),
    // Trigger manual synchronization
    syncNow: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig: getYouTubeConfig2, createSyncLog: createSyncLog2, updateSyncLog: updateSyncLog2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { syncUserVideos: syncUserVideos2 } = await Promise.resolve().then(() => (init_youtubeSync(), youtubeSync_exports));
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      const config = await getYouTubeConfig2(ctx.user.id);
      if (!config) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouv\xE9e. Veuillez d'abord configurer votre cha\xEEne."
        });
      }
      const startTime = /* @__PURE__ */ new Date();
      const logId = await createSyncLog2({
        userId: ctx.user.id,
        status: "success",
        videosImported: 0,
        videosUpdated: 0,
        errors: null,
        startedAt: startTime,
        completedAt: null
      });
      try {
        const result = await syncUserVideos2(
          ctx.user.id,
          config.channelId,
          config.apiKey
        );
        const endTime = /* @__PURE__ */ new Date();
        await updateSyncLog2(logId, {
          status: result.success ? "success" : "partial",
          videosImported: result.imported,
          videosUpdated: result.updated,
          errors: result.errors.join("; ") || null,
          completedAt: endTime
        });
        await notifyOwner2({
          title: "Synchronisation YouTube",
          content: `\u2705 Synchronisation termin\xE9e !

\u{1F4E5} ${result.imported} nouvelles vid\xE9os import\xE9es
\u{1F504} ${result.updated} vid\xE9os mises \xE0 jour`
        });
        return {
          success: result.success,
          imported: result.imported,
          updated: result.updated,
          errors: result.errors
        };
      } catch (error) {
        const endTime = /* @__PURE__ */ new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateSyncLog2(logId, {
          status: "failed",
          errors: errorMessage,
          completedAt: endTime
        });
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage
        });
      }
    }),
    // Get synchronization history
    getSyncLogs: protectedProcedure.input(z2.object({ limit: z2.number().default(20) }).optional()).query(async ({ ctx, input }) => {
      const { getSyncLogsByUser: getSyncLogsByUser2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getSyncLogsByUser2(ctx.user.id, input?.limit || 20);
    }),
    // Subscribe to YouTube webhook
    subscribeWebhook: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig: getYouTubeConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { subscribeToYouTubeChannel: subscribeToYouTubeChannel2 } = await Promise.resolve().then(() => (init_youtubeWebhook(), youtubeWebhook_exports));
      const config = await getYouTubeConfig2(ctx.user.id);
      if (!config) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouv\xE9e."
        });
      }
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.manus.im";
      const callbackUrl = `${baseUrl}/api/webhook/youtube`;
      const success = await subscribeToYouTubeChannel2(config.channelId, callbackUrl);
      if (!success) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'inscription au webhook YouTube."
        });
      }
      return { success: true, callbackUrl };
    }),
    // Unsubscribe from YouTube webhook
    unsubscribeWebhook: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig: getYouTubeConfig2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { unsubscribeFromYouTubeChannel: unsubscribeFromYouTubeChannel2 } = await Promise.resolve().then(() => (init_youtubeWebhook(), youtubeWebhook_exports));
      const config = await getYouTubeConfig2(ctx.user.id);
      if (!config) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouv\xE9e."
        });
      }
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.manus.im";
      const callbackUrl = `${baseUrl}/api/webhook/youtube`;
      const success = await unsubscribeFromYouTubeChannel2(config.channelId, callbackUrl);
      if (!success) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la d\xE9sinscription du webhook YouTube."
        });
      }
      return { success: true };
    })
  }),
  // Audience router - analytics avancées
  audience: router({
    // Get video analytics (watch time metrics)
    getAnalytics: protectedProcedure.input(z2.object({ videoId: z2.number() })).query(async ({ ctx, input }) => {
      const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb3();
      if (!db) return null;
      const { videoAnalytics: videoAnalytics2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc9 } = await import("drizzle-orm");
      const result = await db.select().from(videoAnalytics2).where(eq13(videoAnalytics2.videoId, input.videoId)).orderBy(desc9(videoAnalytics2.createdAt)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),
    // Get traffic sources
    getTrafficSources: protectedProcedure.input(z2.object({ videoId: z2.number() })).query(async ({ ctx, input }) => {
      const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb3();
      if (!db) return [];
      const { trafficSources: trafficSources2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc9 } = await import("drizzle-orm");
      return await db.select().from(trafficSources2).where(eq13(trafficSources2.videoId, input.videoId)).orderBy(desc9(trafficSources2.percentage));
    }),
    // Get demographics
    getDemographics: protectedProcedure.input(z2.object({ videoId: z2.number() })).query(async ({ ctx, input }) => {
      const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb3();
      if (!db) return [];
      const { demographics: demographics2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc9 } = await import("drizzle-orm");
      return await db.select().from(demographics2).where(eq13(demographics2.videoId, input.videoId)).orderBy(desc9(demographics2.viewsPercentage));
    }),
    // Get geography
    getGeography: protectedProcedure.input(z2.object({ videoId: z2.number() })).query(async ({ ctx, input }) => {
      const { getDb: getDb3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb3();
      if (!db) return [];
      const { geography: geography2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq13, desc: desc9 } = await import("drizzle-orm");
      return await db.select().from(geography2).where(eq13(geography2.videoId, input.videoId)).orderBy(desc9(geography2.percentage)).limit(20);
    })
  }),
  channelAnalytics: router({
    getOverview: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ ctx, input }) => {
      const { fetchChannelAnalytics: fetchChannelAnalytics2 } = await Promise.resolve().then(() => (init_channelAnalytics(), channelAnalytics_exports));
      return await fetchChannelAnalytics2(ctx.user.id, input.startDate, input.endDate);
    }),
    getDemographics: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ ctx, input }) => {
      const { fetchChannelDemographics: fetchChannelDemographics2 } = await Promise.resolve().then(() => (init_channelAnalytics(), channelAnalytics_exports));
      return await fetchChannelDemographics2(ctx.user.id, input.startDate, input.endDate);
    }),
    getGeography: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ ctx, input }) => {
      const { fetchChannelGeography: fetchChannelGeography2 } = await Promise.resolve().then(() => (init_channelAnalytics(), channelAnalytics_exports));
      return await fetchChannelGeography2(ctx.user.id, input.startDate, input.endDate);
    }),
    getTrafficSources: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ ctx, input }) => {
      const { fetchChannelTrafficSources: fetchChannelTrafficSources2 } = await Promise.resolve().then(() => (init_channelAnalytics(), channelAnalytics_exports));
      return await fetchChannelTrafficSources2(ctx.user.id, input.startDate, input.endDate);
    })
  }),
  instructionScripts: router({
    create: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      content: z2.string(),
      trainedBy: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { createInstructionScript: createInstructionScript2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      const scriptId = await createInstructionScript2(ctx.user.id, input.scriptType, input.content, input.trainedBy);
      return { success: true, scriptId };
    }),
    list: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"])
    })).query(async ({ ctx, input }) => {
      const { getInstructionScripts: getInstructionScripts2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      return await getInstructionScripts2(ctx.user.id, input.scriptType);
    }),
    getLatest: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"])
    })).query(async ({ ctx, input }) => {
      const { getLatestInstructionScript: getLatestInstructionScript3 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      return await getLatestInstructionScript3(ctx.user.id, input.scriptType);
    }),
    getByVersion: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      version: z2.number()
    })).query(async ({ ctx, input }) => {
      const { getInstructionScriptByVersion: getInstructionScriptByVersion2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      return await getInstructionScriptByVersion2(ctx.user.id, input.scriptType, input.version);
    }),
    getAllLatest: protectedProcedure.query(async ({ ctx }) => {
      const { getAllLatestScripts: getAllLatestScripts2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      return await getAllLatestScripts2(ctx.user.id);
    }),
    trainScript: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["title_guide", "thumbnail_mechanics", "midjourney_prompts"]),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
      channelId: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { trainScript: trainScript2 } = await Promise.resolve().then(() => (init_scriptTraining(), scriptTraining_exports));
      const trainedContent = await trainScript2({
        userId: ctx.user.id,
        scriptType: input.scriptType,
        model: input.model,
        channelId: input.channelId
      });
      return { trainedContent };
    }),
    setActiveVersion: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      version: z2.number()
    })).mutation(async ({ ctx, input }) => {
      const { setActiveVersion: setActiveVersion2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      await setActiveVersion2(ctx.user.id, input.scriptType, input.version);
      return { success: true };
    }),
    getActive: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"])
    })).query(async ({ ctx, input }) => {
      const { getActiveInstructionScript: getActiveInstructionScript2 } = await Promise.resolve().then(() => (init_instructionScripts(), instructionScripts_exports));
      return await getActiveInstructionScript2(ctx.user.id, input.scriptType);
    })
  }),
  coordinationScripts: router({
    upsert: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["thumbnail_generation", "title_generation", "description_generation", "strategy_generation", "title_and_thumbnail_generation"]),
      content: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const { upsertCoordinationScript: upsertCoordinationScript2 } = await Promise.resolve().then(() => (init_coordinationScripts(), coordinationScripts_exports));
      await upsertCoordinationScript2(ctx.user.id, input.scriptType, input.content);
      return { success: true };
    }),
    get: protectedProcedure.input(z2.object({
      scriptType: z2.enum(["thumbnail_generation", "title_generation", "description_generation", "strategy_generation", "title_and_thumbnail_generation"])
    })).query(async ({ ctx, input }) => {
      const { getCoordinationScript: getCoordinationScript2 } = await Promise.resolve().then(() => (init_coordinationScripts(), coordinationScripts_exports));
      return await getCoordinationScript2(ctx.user.id, input.scriptType);
    })
  }),
  // Brainstorm router (Pré-production et Post-production)
  brainstorm: router({
    generateVideoIdeas: protectedProcedure.input(z2.object({
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o")
    })).mutation(async ({ ctx, input }) => {
      const { generateVideoIdeas: generateVideoIdeas2 } = await Promise.resolve().then(() => (init_brainstorm(), brainstorm_exports));
      return await generateVideoIdeas2(ctx.user.id, input.model);
    }),
    generatePostProduction: protectedProcedure.input(z2.object({
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o"),
      transcript: z2.string().min(100, "La transcription doit faire au moins 100 caract\xE8res")
    })).mutation(async ({ ctx, input }) => {
      const { generatePostProduction: generatePostProduction2 } = await Promise.resolve().then(() => (init_brainstorm(), brainstorm_exports));
      return await generatePostProduction2(ctx.user.id, input.model, input.transcript);
    }),
    rateGeneration: protectedProcedure.input(z2.object({
      type: z2.enum(["video_ideas", "post_production"]),
      model: z2.string(),
      rating: z2.number().min(-1).max(1)
    })).mutation(async ({ ctx, input }) => {
      const { rateGeneration: rateGeneration2 } = await Promise.resolve().then(() => (init_brainstorm(), brainstorm_exports));
      await rateGeneration2(ctx.user.id, input.type, input.model, input.rating);
      return { success: true };
    })
  }),
  // Saved Ideas router
  savedIdeas: router({
    list: protectedProcedure.input(z2.object({
      status: z2.enum(["saved", "in_progress", "completed", "archived"]).optional(),
      ideaType: z2.enum(["video_idea", "title", "thumbnail", "tags", "description"]).optional()
    }).optional()).query(async ({ ctx, input }) => {
      return getSavedIdeas(ctx.user.id, input?.status, input?.ideaType);
    }),
    save: protectedProcedure.input(z2.object({
      ideaType: z2.enum(["video_idea", "title", "thumbnail", "tags", "description"]),
      title: z2.string(),
      summary: z2.string().optional(),
      source: z2.enum(["brainstorm_preprod", "brainstorm_postprod", "competition_analysis"]),
      model: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveIdea(ctx.user.id, input);
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["saved", "in_progress", "completed", "archived"])
    })).mutation(async ({ ctx, input }) => {
      return updateIdeaStatus(input.id, ctx.user.id, input.status);
    }),
    updateNotes: protectedProcedure.input(z2.object({
      id: z2.number(),
      notes: z2.string()
    })).mutation(async ({ ctx, input }) => {
      return updateIdeaNotes(input.id, ctx.user.id, input.notes);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      return deleteIdea(input.id, ctx.user.id);
    })
  }),
  // Competition Analysis router
  competition: router({
    search: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      generateVariations: z2.boolean().default(true)
    })).mutation(async ({ input }) => {
      const { searchCompetitorVideos: searchCompetitorVideos2 } = await Promise.resolve().then(() => (init_competitionAnalysis(), competitionAnalysis_exports));
      return searchCompetitorVideos2(input.keyword, input.generateVariations);
    }),
    analyze: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      variations: z2.array(z2.string()),
      videos: z2.array(z2.object({
        videoId: z2.string(),
        title: z2.string(),
        channelTitle: z2.string(),
        viewCount: z2.number(),
        viewCountText: z2.string(),
        publishedTimeText: z2.string(),
        duration: z2.string(),
        thumbnailUrl: z2.string(),
        description: z2.string()
      })),
      totalResults: z2.number()
    })).mutation(async ({ input }) => {
      const { analyzeCompetition: analyzeCompetition2 } = await Promise.resolve().then(() => (init_competitionAnalysis(), competitionAnalysis_exports));
      return analyzeCompetition2(input);
    }),
    saveVideo: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      videoId: z2.string(),
      videoTitle: z2.string(),
      channelTitle: z2.string().optional(),
      viewCount: z2.number().optional(),
      publishedAt: z2.string().optional(),
      thumbnailUrl: z2.string().optional(),
      duration: z2.string().optional(),
      description: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveCompetitorVideo(ctx.user.id, input);
    }),
    getSavedVideos: protectedProcedure.input(z2.object({
      keyword: z2.string().optional()
    }).optional()).query(async ({ ctx, input }) => {
      return getSavedCompetitorVideos(ctx.user.id, input?.keyword);
    })
  }),
  // Trends Explorer router (multi-source trends)
  trends: router({
    searchAll: protectedProcedure.input(z2.object({
      keyword: z2.string().min(2),
      sources: z2.array(z2.enum(["twitter", "reddit", "tiktok", "google_trends", "news"])),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o"),
      redditSubreddits: z2.array(z2.string()).optional()
    })).mutation(async ({ input }) => {
      const { searchAllTrends: searchAllTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return searchAllTrends2(input.keyword, input.sources, input.model, input.redditSubreddits);
    }),
    searchTwitter: protectedProcedure.input(z2.object({ keyword: z2.string() })).mutation(async ({ input }) => {
      const { searchTwitterTrends: searchTwitterTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return searchTwitterTrends2(input.keyword);
    }),
    searchReddit: protectedProcedure.input(z2.object({ subreddit: z2.string() })).mutation(async ({ input }) => {
      const { searchRedditTrends: searchRedditTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return searchRedditTrends2(input.subreddit);
    }),
    searchTikTok: protectedProcedure.input(z2.object({ keyword: z2.string() })).mutation(async ({ input }) => {
      const { searchTikTokTrends: searchTikTokTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return searchTikTokTrends2(input.keyword);
    }),
    generateGoogleTrends: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o")
    })).mutation(async ({ input }) => {
      const { generateGoogleTrends: generateGoogleTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return generateGoogleTrends2(input.keyword, input.model);
    }),
    generateNews: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o")
    })).mutation(async ({ input }) => {
      const { generateNewsTrends: generateNewsTrends2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return generateNewsTrends2(input.keyword, input.model);
    }),
    suggestSubreddits: protectedProcedure.input(z2.object({
      keyword: z2.string(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o")
    })).mutation(async ({ input }) => {
      const { suggestSubreddits: suggestSubreddits2 } = await Promise.resolve().then(() => (init_trends(), trends_exports));
      return suggestSubreddits2(input.keyword, input.model);
    })
  }),
  // Script Writing router (Écriture de scripts coordonnés)
  scriptWriting: router({
    // Get channel videos for export
    getChannelExport: protectedProcedure.query(async ({ ctx }) => {
      const { getChannelVideosForExport: getChannelVideosForExport2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      return getChannelVideosForExport2(ctx.user.id);
    }),
    // Export channel videos as CSV
    exportCSV: protectedProcedure.query(async ({ ctx }) => {
      const { getChannelVideosForExport: getChannelVideosForExport2, formatVideosAsCSV: formatVideosAsCSV2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      const data = await getChannelVideosForExport2(ctx.user.id);
      return { csv: formatVideosAsCSV2(data), totalVideos: data.totalVideos };
    }),
    // Get coordination prompt
    getCoordinationPrompt: protectedProcedure.query(async ({ ctx }) => {
      const { getScriptWritingCoordinationPrompt: getScriptWritingCoordinationPrompt2, DEFAULT_SCRIPT_COORDINATION_PROMPT: DEFAULT_SCRIPT_COORDINATION_PROMPT2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      const prompt = await getScriptWritingCoordinationPrompt2(ctx.user.id);
      return { prompt, isDefault: prompt === DEFAULT_SCRIPT_COORDINATION_PROMPT2 };
    }),
    // Save coordination prompt
    saveCoordinationPrompt: protectedProcedure.input(z2.object({ content: z2.string() })).mutation(async ({ ctx, input }) => {
      const { saveScriptWritingCoordinationPrompt: saveScriptWritingCoordinationPrompt2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      await saveScriptWritingCoordinationPrompt2(ctx.user.id, input.content);
      return { success: true };
    }),
    // Reset to default prompt
    resetCoordinationPrompt: protectedProcedure.mutation(async ({ ctx }) => {
      const { saveScriptWritingCoordinationPrompt: saveScriptWritingCoordinationPrompt2, DEFAULT_SCRIPT_COORDINATION_PROMPT: DEFAULT_SCRIPT_COORDINATION_PROMPT2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      await saveScriptWritingCoordinationPrompt2(ctx.user.id, DEFAULT_SCRIPT_COORDINATION_PROMPT2);
      return { success: true, prompt: DEFAULT_SCRIPT_COORDINATION_PROMPT2 };
    }),
    // Get all instruction scripts for preview
    getInstructionScripts: protectedProcedure.query(async ({ ctx }) => {
      const { getAllInstructionScripts: getAllInstructionScripts2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      return getAllInstructionScripts2(ctx.user.id);
    }),
    // Generate full script
    generateScript: protectedProcedure.input(z2.object({
      topic: z2.string().min(10, "Le sujet doit faire au moins 10 caract\xE8res"),
      customInstructions: z2.string().optional(),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
      coordinationPrompt: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { generateFullScript: generateFullScript2 } = await Promise.resolve().then(() => (init_scriptWriting(), scriptWriting_exports));
      return generateFullScript2(ctx.user.id, input);
    })
  }),
  // Nano Banana (Gemini Image Generation) router
  nanoBanana: router({
    generateThumbnail: protectedProcedure.input(z2.object({
      prompt: z2.string(),
      mode: z2.enum(["standard", "pro"]).default("standard"),
      aspectRatio: z2.enum(["16:9", "1:1", "4:3", "9:16"]).default("16:9"),
      referenceImages: z2.array(z2.object({
        data: z2.string(),
        // base64 encoded image
        mimeType: z2.string()
      })).optional()
    })).mutation(async ({ input }) => {
      const { generateImage: generateImage2 } = await Promise.resolve().then(() => (init_nanoBanana(), nanoBanana_exports));
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new TRPCError3({
          code: "PRECONDITION_FAILED",
          message: "Cl\xE9 API Gemini non configur\xE9e. Veuillez ajouter GEMINI_API_KEY dans les secrets."
        });
      }
      const referenceImages = input.referenceImages?.map((img) => ({
        data: Buffer.from(img.data, "base64"),
        mimeType: img.mimeType
      }));
      const result = await generateImage2({
        prompt: input.prompt,
        mode: input.mode,
        aspectRatio: input.aspectRatio,
        referenceImages,
        apiKey
      });
      return result;
    })
  }),
  // Script Studio - Méta-prompts personnels et corrections durables
  scriptStudio: router({
    // ===== Profiles (Méta-Prompts) =====
    getProfiles: protectedProcedure.query(async ({ ctx }) => {
      return await getScriptProfiles(ctx.user.id);
    }),
    getDefaultProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getDefaultProfile(ctx.user.id);
    }),
    createProfile: protectedProcedure.input(z2.object({
      name: z2.string().min(1).max(100),
      metaPrompt: z2.string().min(1),
      description: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return await createScriptProfile(
        ctx.user.id,
        input.name,
        input.metaPrompt,
        input.description
      );
    }),
    updateProfile: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      name: z2.string().min(1).max(100).optional(),
      metaPrompt: z2.string().min(1).optional(),
      description: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateScriptProfile(input.profileId, ctx.user.id, {
        name: input.name,
        metaPrompt: input.metaPrompt,
        description: input.description
      });
      return { success: true };
    }),
    setDefaultProfile: protectedProcedure.input(z2.object({ profileId: z2.number() })).mutation(async ({ ctx, input }) => {
      await setDefaultProfile(input.profileId, ctx.user.id);
      return { success: true };
    }),
    deleteProfile: protectedProcedure.input(z2.object({ profileId: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteScriptProfile(input.profileId, ctx.user.id);
      return { success: true };
    }),
    // ===== Corrections (Carnet de Corrections) =====
    getCorrections: protectedProcedure.input(z2.object({ activeOnly: z2.boolean().optional() }).optional()).query(async ({ ctx, input }) => {
      return await getScriptCorrections(ctx.user.id, input?.activeOnly ?? true);
    }),
    addCorrection: protectedProcedure.input(z2.object({
      problem: z2.string().min(1),
      correction: z2.string().min(1),
      category: z2.enum(["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"]).optional()
    })).mutation(async ({ ctx, input }) => {
      return await addScriptCorrection(
        ctx.user.id,
        input.problem,
        input.correction,
        input.category || "other"
      );
    }),
    generateCorrectionFromFeedback: protectedProcedure.input(z2.object({
      problem: z2.string().min(1),
      model: z2.enum(["gpt-4o", "gpt-4o-mini"]).optional()
    })).mutation(async ({ input }) => {
      return await generateCorrectionFromFeedback(
        input.problem,
        input.model || "gpt-4o"
      );
    }),
    toggleCorrection: protectedProcedure.input(z2.object({ correctionId: z2.number() })).mutation(async ({ ctx, input }) => {
      await toggleCorrectionActive(input.correctionId, ctx.user.id);
      return { success: true };
    }),
    deleteCorrection: protectedProcedure.input(z2.object({ correctionId: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteScriptCorrection(input.correctionId, ctx.user.id);
      return { success: true };
    }),
    // ===== History =====
    getHistory: protectedProcedure.input(z2.object({ limit: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return await getScriptHistory(ctx.user.id, input?.limit ?? 20);
    }),
    rateScript: protectedProcedure.input(z2.object({
      historyId: z2.number(),
      rating: z2.enum(["-1", "0", "1"]).transform((v) => parseInt(v)),
      feedback: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await rateScript(input.historyId, ctx.user.id, input.rating, input.feedback);
      return { success: true };
    }),
    // ===== Enhanced Generation =====
    generateScript: protectedProcedure.input(z2.object({
      topic: z2.string().min(1),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional(),
      customInstructions: z2.string().optional(),
      profileId: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      return await generateEnhancedScript(
        ctx.user.id,
        input.topic,
        input.model || "gpt-4o",
        input.customInstructions,
        input.profileId
      );
    }),
    getDefaultMetaPrompt: publicProcedure.query(() => {
      return { metaPrompt: DEFAULT_META_PROMPT };
    }),
    // ===== Templates =====
    getTemplates: publicProcedure.query(() => {
      return getProfileTemplates();
    }),
    createFromTemplate: protectedProcedure.input(z2.object({
      templateKey: z2.enum(["educatif", "storytelling", "polemique", "investigation", "divertissement"]),
      customName: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return await createProfileFromTemplate(
        ctx.user.id,
        input.templateKey,
        input.customName
      );
    }),
    // ===== Export/Import =====
    exportData: protectedProcedure.query(async ({ ctx }) => {
      return await exportProfilesAndCorrections(ctx.user.id);
    }),
    importData: protectedProcedure.input(z2.object({
      data: z2.object({
        version: z2.string(),
        exportedAt: z2.string(),
        profiles: z2.array(z2.object({
          name: z2.string(),
          description: z2.string().nullable(),
          metaPrompt: z2.string(),
          isDefault: z2.boolean()
        })),
        corrections: z2.array(z2.object({
          problem: z2.string(),
          correction: z2.string(),
          category: z2.string(),
          isActive: z2.boolean()
        }))
      }),
      replaceExisting: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      return await importProfilesAndCorrections(
        ctx.user.id,
        input.data,
        { replaceExisting: input.replaceExisting }
      );
    }),
    // ===== Learning Statistics =====
    getLearningStats: protectedProcedure.query(async ({ ctx }) => {
      return await getLearningStats(ctx.user.id);
    }),
    // Tags management
    getAllTags: protectedProcedure.query(async ({ ctx }) => {
      return await getAllTags(ctx.user.id);
    }),
    updateProfileTags: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      tags: z2.array(z2.string())
    })).mutation(async ({ ctx, input }) => {
      await updateProfileTags(ctx.user.id, input.profileId, input.tags);
      return { success: true };
    }),
    getProfilesByTag: protectedProcedure.input(z2.object({ tag: z2.string() })).query(async ({ ctx, input }) => {
      return await getProfilesByTag(ctx.user.id, input.tag);
    }),
    // Multi-profile comparison
    generateComparison: protectedProcedure.input(z2.object({
      topic: z2.string(),
      profileIds: z2.array(z2.number()).min(2).max(4),
      model: z2.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
      customInstructions: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return await generateComparisonScripts(
        ctx.user.id,
        input.topic,
        input.profileIds,
        input.model,
        input.customInstructions
      );
    }),
    // AI Assistant for negative scripts
    analyzeNegativeScripts: protectedProcedure.query(async ({ ctx }) => {
      return await analyzeNegativeScripts(ctx.user.id);
    }),
    applySuggestedCorrections: protectedProcedure.input(z2.object({
      corrections: z2.array(z2.object({
        problem: z2.string(),
        correction: z2.string(),
        category: z2.enum(["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"])
      }))
    })).mutation(async ({ ctx, input }) => {
      return await applySuggestedCorrections(ctx.user.id, input.corrections);
    }),
    // ===== Profile Versioning =====
    saveProfileVersion: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      changeDescription: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return await saveProfileVersion(ctx.user.id, input.profileId, input.changeDescription);
    }),
    getProfileVersions: protectedProcedure.input(z2.object({
      profileId: z2.number()
    })).query(async ({ ctx, input }) => {
      return await getProfileVersions(ctx.user.id, input.profileId);
    }),
    restoreProfileVersion: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      versionId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await restoreProfileVersion(ctx.user.id, input.profileId, input.versionId);
    }),
    compareProfileVersions: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      versionId1: z2.number(),
      versionId2: z2.number()
    })).query(async ({ ctx, input }) => {
      return await compareProfileVersions(
        ctx.user.id,
        input.profileId,
        input.versionId1,
        input.versionId2
      );
    }),
    // ===== Profile Branches (Experimental Variations) =====
    getBranches: protectedProcedure.input(z2.object({
      profileId: z2.number()
    })).query(async ({ ctx, input }) => {
      return await getProfileBranches(ctx.user.id, input.profileId);
    }),
    createBranch: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      name: z2.string(),
      description: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return await createProfileBranch(
        ctx.user.id,
        input.profileId,
        input.name,
        input.description
      );
    }),
    updateBranch: protectedProcedure.input(z2.object({
      branchId: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional(),
      metaPrompt: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { branchId, ...updates } = input;
      return await updateProfileBranch(ctx.user.id, branchId, updates);
    }),
    mergeBranch: protectedProcedure.input(z2.object({
      branchId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await mergeBranch(ctx.user.id, input.branchId);
    }),
    abandonBranch: protectedProcedure.input(z2.object({
      branchId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await abandonBranch(ctx.user.id, input.branchId);
    }),
    deleteBranch: protectedProcedure.input(z2.object({
      branchId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await deleteBranch(ctx.user.id, input.branchId);
    }),
    reactivateBranch: protectedProcedure.input(z2.object({
      branchId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await reactivateBranch(ctx.user.id, input.branchId);
    }),
    // Visual Diff
    getVersionDiff: protectedProcedure.input(z2.object({
      profileId: z2.number(),
      versionId1: z2.number(),
      versionId2: z2.number()
    })).query(async ({ ctx, input }) => {
      return await getVersionDiff(
        ctx.user.id,
        input.profileId,
        input.versionId1,
        input.versionId2
      );
    }),
    // Favorites
    toggleVersionFavorite: protectedProcedure.input(z2.object({
      versionId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      return await toggleVersionFavorite(ctx.user.id, input.versionId);
    }),
    getFavoriteVersions: protectedProcedure.query(async ({ ctx }) => {
      return await getFavoriteVersions(ctx.user.id);
    })
  }),
  // Backup automatique
  backup: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const backupData = await generateBackup(ctx.user.id);
      return backupData;
    }),
    saveToS3: protectedProcedure.mutation(async ({ ctx }) => {
      const backupData = await generateBackup(ctx.user.id);
      const { url, size } = await saveBackupToS3(ctx.user.id, backupData);
      return { url, size, itemsCount: {
        profiles: backupData.profiles.length,
        corrections: backupData.corrections.length,
        history: backupData.history.length
      } };
    }),
    restore: protectedProcedure.input(z2.object({ backupData: z2.any() })).mutation(async ({ ctx, input }) => {
      return await restoreFromBackup(ctx.user.id, input.backupData);
    }),
    estimateSize: protectedProcedure.query(async ({ ctx }) => {
      const backupData = await generateBackup(ctx.user.id);
      return {
        size: estimateBackupSize(backupData),
        itemsCount: {
          profiles: backupData.profiles.length,
          corrections: backupData.corrections.length,
          history: backupData.history.length
        }
      };
    })
  }),
  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSettings(ctx.user.id);
    }),
    update: protectedProcedure.input(z2.object({
      theme: z2.enum(["light", "dark", "system"]).optional(),
      backupFrequency: z2.enum(["daily", "weekly", "monthly"]).optional(),
      abTestCtrThreshold: z2.number().min(0).max(100).optional(),
      abTestViewsThreshold: z2.number().min(0).optional(),
      notifyNewVideos: z2.boolean().optional(),
      notifyABTestThreshold: z2.boolean().optional(),
      notifyBackupComplete: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      return await updateUserSettings(ctx.user.id, input);
    })
  }),
  // Video templates
  videoTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getVideoTemplates(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      titleTemplate: z2.string().optional(),
      descriptionTemplate: z2.string().optional(),
      tagsTemplate: z2.array(z2.string()).optional(),
      category: z2.string().optional(),
      isDefault: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const id = await createVideoTemplate(ctx.user.id, input);
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      titleTemplate: z2.string().optional(),
      descriptionTemplate: z2.string().optional(),
      tagsTemplate: z2.array(z2.string()).optional(),
      category: z2.string().optional(),
      isDefault: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await updateVideoTemplate(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return await deleteVideoTemplate(input.id);
    }),
    duplicate: protectedProcedure.input(z2.object({
      id: z2.number(),
      newName: z2.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      const newId = await duplicateVideoTemplate(input.id, ctx.user.id, input.newName);
      return { id: newId };
    }),
    incrementUsage: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await incrementTemplateUsage(input.id);
      return { success: true };
    }),
    getCategories: protectedProcedure.query(async ({ ctx }) => {
      return await getTemplateCategories(ctx.user.id);
    })
  }),
  // View Tracking router
  viewTracking: router({
    // Get top videos by different metrics
    getTopVideos: protectedProcedure.input(z2.object({
      period: z2.enum(["latest", "1h", "2h", "24h", "48h", "1week", "2weeks", "1month"]).default("24h"),
      limit: z2.number().min(1).max(20).default(5)
    }).optional()).query(async ({ ctx, input }) => {
      const { getTopVideos: getTopVideos2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      const period = input?.period || "24h";
      const limit = input?.limit || 5;
      return await getTopVideos2(ctx.user.id, period, limit);
    }),
    // Get all video trend stats for detailed view
    getAllStats: protectedProcedure.input(z2.object({
      period: z2.enum(["latest", "1h", "2h", "24h", "48h", "1week", "2weeks", "1month"]).default("24h")
    }).optional()).query(async ({ ctx, input }) => {
      const { getVideoTrendStats: getVideoTrendStats2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      const period = input?.period || "24h";
      return await getVideoTrendStats2(ctx.user.id, period);
    }),
    // Record stats snapshot (can be called anytime)
    recordStats: protectedProcedure.mutation(async ({ ctx }) => {
      const { recordStatsSnapshot: recordStatsSnapshot2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      const result = await recordStatsSnapshot2(ctx.user.id);
      return { success: true, ...result, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    }),
    // Get the timestamp of the last recorded snapshot
    getLastSnapshotTime: protectedProcedure.query(async ({ ctx }) => {
      const { getLastSnapshotTime: getLastSnapshotTime2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      return await getLastSnapshotTime2(ctx.user.id);
    }),
    // Check if stats have been recorded today (kept for backward compatibility)
    hasRecordedToday: protectedProcedure.query(async ({ ctx }) => {
      const { hasRecordedToday: hasRecordedToday2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      return await hasRecordedToday2(ctx.user.id);
    }),
    // Get raw daily stats for a period
    getDailyStats: protectedProcedure.input(z2.object({
      period: z2.enum(["24h", "48h", "1week", "2weeks", "1month"]).default("24h")
    }).optional()).query(async ({ ctx, input }) => {
      const { getAllDailyStats: getAllDailyStats2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      const period = input?.period || "24h";
      return await getAllDailyStats2(ctx.user.id, period);
    }),
    // Get view history for a specific video (for charts)
    getVideoHistory: protectedProcedure.input(z2.object({
      videoId: z2.number(),
      hours: z2.number().min(1).max(720).default(168)
      // Max 30 days
    })).query(async ({ ctx, input }) => {
      const { getVideoViewHistory: getVideoViewHistory2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      return await getVideoViewHistory2(input.videoId, ctx.user.id, input.hours);
    }),
    // Get aggregated view history for all videos (for charts)
    getAggregatedHistory: protectedProcedure.input(z2.object({
      hours: z2.number().min(1).max(720).default(168)
      // Max 30 days
    }).optional()).query(async ({ ctx, input }) => {
      const { getAggregatedViewHistory: getAggregatedViewHistory2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      return await getAggregatedViewHistory2(ctx.user.id, input?.hours || 168);
    }),
    // Compare two custom periods
    comparePeriods: protectedProcedure.input(z2.object({
      period1Start: z2.string().transform((s) => new Date(s)),
      period1End: z2.string().transform((s) => new Date(s)),
      period2Start: z2.string().transform((s) => new Date(s)),
      period2End: z2.string().transform((s) => new Date(s))
    })).query(async ({ ctx, input }) => {
      const { compareCustomPeriods: compareCustomPeriods2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      return await compareCustomPeriods2(
        ctx.user.id,
        input.period1Start,
        input.period1End,
        input.period2Start,
        input.period2End
      );
    })
  }),
  // Alerts router
  alerts: router({
    // Get all alerts for the user
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(viewAlerts).where(eq12(viewAlerts.userId, ctx.user.id)).orderBy(desc8(viewAlerts.createdAt));
    }),
    // Create a new alert
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1).max(255),
      videoId: z2.number().nullable().optional(),
      alertType: z2.enum(["growth", "decline", "views"]),
      threshold: z2.number().min(1),
      period: z2.enum(["1h", "2h", "24h", "48h", "1week"]).default("1h")
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const result = await db.insert(viewAlerts).values({
        userId: ctx.user.id,
        name: input.name,
        videoId: input.videoId || null,
        alertType: input.alertType,
        threshold: input.threshold,
        period: input.period,
        enabled: true
      });
      return { success: true, id: Number(result[0].insertId) };
    }),
    // Update an alert
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().min(1).max(255).optional(),
      threshold: z2.number().min(1).optional(),
      period: z2.enum(["1h", "2h", "24h", "48h", "1week"]).optional(),
      enabled: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const updateData = {};
      if (input.name !== void 0) updateData.name = input.name;
      if (input.threshold !== void 0) updateData.threshold = input.threshold;
      if (input.period !== void 0) updateData.period = input.period;
      if (input.enabled !== void 0) updateData.enabled = input.enabled;
      await db.update(viewAlerts).set(updateData).where(and9(
        eq12(viewAlerts.id, input.id),
        eq12(viewAlerts.userId, ctx.user.id)
      ));
      return { success: true };
    }),
    // Delete an alert
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(viewAlerts).where(and9(
        eq12(viewAlerts.id, input.id),
        eq12(viewAlerts.userId, ctx.user.id)
      ));
      return { success: true };
    }),
    // Get alert history
    getHistory: protectedProcedure.input(z2.object({
      limit: z2.number().min(1).max(100).default(50)
    }).optional()).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(alertHistory).where(eq12(alertHistory.userId, ctx.user.id)).orderBy(desc8(alertHistory.createdAt)).limit(input?.limit || 50);
    }),
    // Check alerts now (manual trigger)
    checkNow: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { triggered: [] };
      const userAlerts = await db.select().from(viewAlerts).where(and9(
        eq12(viewAlerts.userId, ctx.user.id),
        eq12(viewAlerts.enabled, true)
      ));
      if (userAlerts.length === 0) return { triggered: [] };
      const { checkAlerts: checkAlerts2 } = await Promise.resolve().then(() => (init_viewTracking(), viewTracking_exports));
      const triggered = [];
      const alertsByPeriod = /* @__PURE__ */ new Map();
      for (const alert of userAlerts) {
        const period = alert.period || "1h";
        if (!alertsByPeriod.has(period)) {
          alertsByPeriod.set(period, []);
        }
        alertsByPeriod.get(period).push(alert);
      }
      for (const [period, alerts] of alertsByPeriod) {
        const results = await checkAlerts2(
          ctx.user.id,
          alerts.map((a) => ({
            id: a.id,
            userId: a.userId,
            videoId: a.videoId,
            alertType: a.alertType,
            threshold: a.threshold,
            enabled: a.enabled
          })),
          period
        );
        for (const result of results) {
          if (result.triggered) {
            const alert = alerts.find(
              (a) => (a.videoId === result.videoId || a.videoId === null) && a.alertType === result.alertType
            );
            if (alert) {
              triggered.push({
                alertId: alert.id,
                alertName: alert.name,
                videoId: result.videoId,
                videoTitle: result.videoTitle,
                alertType: result.alertType,
                threshold: result.threshold,
                actualValue: result.actualValue
              });
              await db.insert(alertHistory).values({
                alertId: alert.id,
                userId: ctx.user.id,
                videoId: result.videoId,
                videoTitle: result.videoTitle,
                alertType: result.alertType,
                threshold: result.threshold,
                actualValue: result.actualValue,
                notificationSent: false
              });
              await db.update(viewAlerts).set({
                lastTriggeredAt: /* @__PURE__ */ new Date(),
                triggerCount: (alert.triggerCount || 0) + 1
              }).where(eq12(viewAlerts.id, alert.id));
            }
          }
        }
      }
      return { triggered };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.get("/api/webhook/youtube", async (req, res) => {
    const challenge = req.query["hub.challenge"];
    if (challenge) {
      const { verifyWebhookChallenge: verifyWebhookChallenge2 } = await Promise.resolve().then(() => (init_youtubeWebhook(), youtubeWebhook_exports));
      res.status(200).send(verifyWebhookChallenge2(challenge));
      return;
    }
    res.status(400).send("Missing challenge");
  });
  app.post("/api/webhook/youtube", express2.text({ type: "application/atom+xml" }), async (req, res) => {
    try {
      const { parseYouTubeNotification: parseYouTubeNotification2, handleYouTubeNotification: handleYouTubeNotification2 } = await Promise.resolve().then(() => (init_youtubeWebhook(), youtubeWebhook_exports));
      const notification = await parseYouTubeNotification2(req.body);
      if (notification) {
        handleYouTubeNotification2(notification).catch(console.error);
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("[Webhook] Error processing notification:", error);
      res.status(500).send("Error");
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    Promise.resolve().then(() => (init_cronJobs(), cronJobs_exports)).then(({ initializeCronJobs: initializeCronJobs2 }) => {
      initializeCronJobs2();
    }).catch(console.error);
  });
}
startServer().catch(console.error);
