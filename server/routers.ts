import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { viewAlerts, alertHistory } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { fetchYouTubeVideos, fetchYouTubeVideoStats } from "./youtube";
import { getAuthUrl, handleCallback, hasYouTubeAuth, revokeYouTubeAuth } from "./youtubeAuth";
import { fetchUserYouTubeVideos } from "./youtubeOAuth";
import type { SyncResult } from "@shared/types";
import * as scriptStudio from "./scriptStudio";
import * as autoBackup from "./autoBackup";
import * as settings from "./settings";

export const appRouter = router({
  system: systemRouter,
  youtube: router({    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      return { url: getAuthUrl(ctx.user.id) };
    }),

    handleCallback: publicProcedure
      .input(z.object({ 
        code: z.string(),
        state: z.string().optional() // userId passé dans le state
      }))
      .mutation(async ({ input }) => {
        // Récupérer le userId depuis le state
        const userId = input.state ? parseInt(input.state, 10) : null;
        
        if (!userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User ID manquant dans le state'
          });
        }
        
        const success = await handleCallback(input.code, userId);
        
        if (success) {
          // Déclencher automatiquement la synchronisation des vidéos
          try {
            // Transcriptions désactivées pour économiser le quota API
            const videos = await fetchUserYouTubeVideos(userId, 30); // Dernières 30 jours
            let videosAdded = 0;
            let videosUpdated = 0;

            for (const video of videos) {
              const existingVideo = await db.getVideoByYouTubeId(video.id, userId);

              if (existingVideo) {
                await db.updateVideo(existingVideo.id, {
                  title: video.title,
                  description: video.description,
                  thumbnailUrl: video.thumbnailUrl,
                  viewCount: video.viewCount,
                  likeCount: video.likeCount,
                  commentCount: video.commentCount,
                });
                videosUpdated++;
              } else {
                await db.createVideo({
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
                  tags: video.tags ? JSON.stringify(video.tags) : null,
                });
                videosAdded++;
              }
            }
            
            console.log(`[YouTube Sync] Initial sync completed: ${videosAdded} added, ${videosUpdated} updated`);
          } catch (error) {
            console.error('[YouTube Sync] Error during initial sync:', error);
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

    syncMyVideos: protectedProcedure
      .input(z.object({
        periodDays: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Vérifier que l'utilisateur est authentifié avec YouTube
          if (!hasYouTubeAuth(ctx.user.id)) {
            throw new Error("YouTube authentication required");
          }

          // Transcriptions désactivées pour économiser le quota API
          const videos = await fetchUserYouTubeVideos(ctx.user.id, input.periodDays);
          let videosAdded = 0;
          let videosUpdated = 0;

          for (const video of videos) {
            const existingVideo = await db.getVideoByYouTubeId(video.id, ctx.user.id);

            if (existingVideo) {
              await db.updateVideo(existingVideo.id, {
                title: video.title,
                description: video.description,
                thumbnailUrl: video.thumbnailUrl,
                viewCount: video.viewCount,
                likeCount: video.likeCount,
                commentCount: video.commentCount,
                transcript: video.transcript,
                watchTimeMinutes: video.watchTimeMinutes,
                averageViewDuration: video.averageViewDuration,
                retentionCurve: video.retentionCurve,
              });
              videosUpdated++;
            } else {
              await db.createVideo({
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
                retentionCurve: video.retentionCurve,
              });
              videosAdded++;
            }
          }

          const result: SyncResult = {
            success: true,
            videosAdded,
            videosUpdated,
            errors: [],
          };

          return result;
        } catch (error: any) {
          console.error("[Sync Error]", error);
          return {
            success: false,
            videosAdded: 0,
            videosUpdated: 0,
            errors: [error.message],
          };
        }
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  videos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getVideosByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getVideoById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        youtubeId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        channelId: z.string().optional(),
        channelTitle: z.string().optional(),
        publishedAt: z.string().optional(),
        viewCount: z.number().optional(),
        likeCount: z.number().optional(),
        commentCount: z.number().optional(),
        duration: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const videoId = await db.createVideo({
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
          tags: input.tags ? JSON.stringify(input.tags) : null,
        });
        
        return { id: videoId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        tags: z.string().optional(),
        transcript: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateVideo(id, data, ctx.user.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteVideo(input.id, ctx.user.id);
        return { success: true };
      }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deleteAllVideos(ctx.user.id);
        return { success: true };
      }),

    syncFromYouTube: protectedProcedure
      .input(z.object({ 
        channelId: z.string(),
        periodDays: z.number().optional() // Nombre de jours à synchroniser (undefined = tout)
      }))
      .mutation(async ({ ctx, input }): Promise<SyncResult> => {
        try {
          const youtubeVideos = await fetchYouTubeVideos(input.channelId, input.periodDays);
          let videosAdded = 0;
          let videosUpdated = 0;
          const errors: string[] = [];

          for (const ytVideo of youtubeVideos) {
            try {
              // Check if video already exists
              const existingVideos = await db.getVideosByUserId(ctx.user.id);
              const existing = existingVideos.find(v => v.youtubeId === ytVideo.id);

              if (existing) {
                // Update existing video
                await db.updateVideo(existing.id, {
                  title: ytVideo.title,
                  description: ytVideo.description,
                  thumbnailUrl: ytVideo.thumbnailUrl,
                  viewCount: ytVideo.viewCount,
                  likeCount: ytVideo.likeCount,
                  commentCount: ytVideo.commentCount,
                });
                videosUpdated++;
              } else {
                // Create new video
                // publishedAt est au format texte ("3 hours ago"), on utilise null pour l'instant
                await db.createVideo({
                  userId: ctx.user.id,
                  youtubeId: ytVideo.id,
                  title: ytVideo.title,
                  description: ytVideo.description,
                  thumbnailUrl: ytVideo.thumbnailUrl,
                  channelId: ytVideo.channelId,
                  channelTitle: ytVideo.channelTitle,
                  publishedAt: null, // L'API Manus retourne du texte, pas une date ISO
                  viewCount: ytVideo.viewCount,
                  likeCount: ytVideo.likeCount,
                  commentCount: ytVideo.commentCount,
                  duration: ytVideo.duration,
                  tags: JSON.stringify(ytVideo.tags),
                  transcript: ytVideo.transcript || null,
                  watchTimeMinutes: ytVideo.watchTimeMinutes || 0,
                  averageViewDuration: ytVideo.averageViewDuration || 0,
                });
                videosAdded++;
              }
            } catch (error) {
              errors.push(`Failed to sync video ${ytVideo.id}: ${error}`);
            }
          }

          // Enregistrer les infos de synchronisation de la chaîne
          const channelTitle = youtubeVideos.length > 0 ? youtubeVideos[0].channelTitle : null;
          await db.upsertChannelSyncInfo({
            userId: ctx.user.id,
            channelId: input.channelId,
            channelTitle: channelTitle || 'Chaîne YouTube',
            videoCount: videosAdded + videosUpdated,
          });

          return {
            success: true,
            videosAdded,
            videosUpdated,
            errors,
            channelTitle: channelTitle || undefined,
          };
        } catch (error) {
          return {
            success: false,
            videosAdded: 0,
            videosUpdated: 0,
            errors: [String(error)],
          };
        }
      }),

    refreshStats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const video = await db.getVideoById(input.id, ctx.user.id);
        if (!video) {
          throw new Error("Video not found");
        }

        const stats = await fetchYouTubeVideoStats(video.youtubeId);
        
        await db.updateVideo(input.id, {
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
        });

        // Also create a stats history entry
        await db.createVideoStat({
          userId: ctx.user.id,
          videoId: input.id,
          date: new Date(),
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          watchTimeMinutes: 0,
          averageViewDuration: 0,
          subscribersGained: 0,
        });

        return { success: true, stats };
      }),
  }),

  abTests: router({
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllTestsByUser(ctx.user.id);
      }),

    listByVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTestsByVideoId(input.videoId, ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTestById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        name: z.string(),
        variantType: z.enum(["text", "thumbnail", "both"]).optional(),
        type: z.enum(["theme", "angle", "optimization"]).optional(),
        hypothesis: z.string().optional().nullable(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        variants: z.array(z.object({
          title: z.string(),
          thumbnailTitle: z.string().optional(),
          thumbnailPrompt: z.string().optional(),
          isControl: z.boolean().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const testId = await db.createABTest({
          userId: ctx.user.id,
          videoId: input.videoId,
          name: input.name,
          description: input.description || null,
          variantType: input.variantType || "both",
          status: "active",
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        });
        
        // Créer les variantes si fournies
        if (input.variants && input.variants.length > 0) {
          for (const variant of input.variants) {
            await db.createVariant({
              testId,
              userId: ctx.user.id,
              title: variant.title,
              thumbnailUrl: "",
              thumbnailTitle: variant.thumbnailTitle || null,
              prompt: variant.thumbnailPrompt || null,
              isControl: variant.isControl || false,
            });
          }
        }
        
        return { id: testId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "completed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateABTest(input.id, ctx.user.id, { status: input.status });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteABTest(input.id, ctx.user.id);
        return { success: true };
      }),

    declareWinner: protectedProcedure
      .input(z.object({
        testId: z.number(),
        winnerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateABTest(input.testId, ctx.user.id, {
          winnerId: input.winnerId,
          status: "completed",
        });
        return { success: true };
      }),

    completeTest: protectedProcedure
      .input(z.object({
        testId: z.number(),
        distributions: z.array(z.object({
          variantId: z.number(),
          watchTimePercentage: z.number(),
        })),
        winnerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Mettre à jour les pourcentages de watch time pour chaque variante
        for (const dist of input.distributions) {
          await db.updateVariant(dist.variantId, ctx.user.id, {
            watchTimePercentage: dist.watchTimePercentage,
          });
        }
        
        // Marquer le test comme terminé et déclarer le gagnant
        await db.updateABTest(input.testId, ctx.user.id, {
          winnerId: input.winnerId,
          status: "completed",
          endDate: new Date(),
        });
        
        return { success: true };
      }),

    exportPDF: protectedProcedure
      .input(z.object({ testId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateTestReportPDF } = await import("./exportPDF");
        
        const test = await db.getTestById(input.testId, ctx.user.id);
        if (!test) throw new Error("Test not found");
        
        const variants = await db.getVariantsByTestId(input.testId, ctx.user.id);
        
        const pdfBuffer = await generateTestReportPDF({ test, variants });
        
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `test-${test.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`,
        };
      }),

    exportCSV: protectedProcedure
      .input(z.object({ testId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const test = await db.getTestById(input.testId, ctx.user.id);
        if (!test) throw new Error("Test not found");
        
        const variants = await db.getVariantsByTestId(input.testId, ctx.user.id);
        
        // Generate CSV content
        const headers = [
          "Variante",
          "Type",
          "Contr\u00f4le",
          "Impressions",
          "Clics",
          "CTR (%)",
          "Vues",
          "Likes",
          "Commentaires",
          "Engagement (%)",
        ];
        
        const rows = variants.map((v: any) => [
          v.title,
          v.variantType || "title",
          v.isControl ? "Oui" : "Non",
          v.impressions || 0,
          v.clicks || 0,
          v.clickThroughRate ? (v.clickThroughRate / 100).toFixed(2) : "0.00",
          v.views || 0,
          v.likes || 0,
          v.comments || 0,
          v.engagementRate ? (v.engagementRate / 100).toFixed(2) : "0.00",
        ]);
        
        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.map(cell => `\"${cell}\"`).join(",")),
        ].join("\n");
        
        return {
          csv: Buffer.from(csvContent, "utf-8").toString("base64"),
          filename: `test-${test.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.csv`,
        };
      }),
  }),

  testVariants: router({
    listByTest: protectedProcedure
      .input(z.object({ testId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getVariantsByTestId(input.testId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        testId: z.number(),
        name: z.string(),
        title: z.string(),
        thumbnailTitle: z.string().optional(),
        description: z.string().optional(),
        isControl: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const variantId = await db.createTestVariant({
          testId: input.testId,
          userId: ctx.user.id,
          title: input.title,
          thumbnailUrl: "",
          thumbnailTitle: input.thumbnailTitle || null,
          isControl: input.isControl || false,
        });
        
        return { id: variantId };
      }),

    updateMetrics: protectedProcedure
      .input(z.object({
        variantId: z.number(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        ctr: z.number().optional(),
        trafficShare: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { variantId, impressions, clicks, ctr, trafficShare } = input;
        const updates: any = {};
        
        if (impressions !== undefined) updates.impressions = impressions;
        if (clicks !== undefined) updates.clicks = clicks;
        if (ctr !== undefined) updates.ctr = ctr;
        if (trafficShare !== undefined) updates.trafficShare = trafficShare;
        
        // Calculate CTR if both values are available and CTR not provided
        if (ctr === undefined && impressions !== undefined && clicks !== undefined && impressions > 0) {
          updates.ctr = (clicks / impressions) * 100; // CTR in percentage
        }
        
        await db.updateTestVariant(variantId, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTestVariant(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  videoStats: router({
    listByVideo: protectedProcedure
      .input(z.object({ 
        videoId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getStatsByVideoId(input.videoId, ctx.user.id, input.limit);
      }),
  }),

  openai: router({
    generateStrategy: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        transcript: z.string(),
        currentTitle: z.string(),
        channelId: z.string().optional(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-5', 'gpt-5-pro']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { generateStrategy } = await import('./openai');
        const { generateABTestReport } = await import('./abTestReport');
        const { createAiGenerationHistory } = await import('./db');
        const { fetchChannelTitles, formatChannelTitlesForPrompt } = await import('./channelTitles');
        
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        
        try {
          // Generate comprehensive A/B test report
          const abTestReport = await generateABTestReport(input.videoId, ctx.user.id);
          
          // Fetch current channel titles if channelId is provided
          let currentChannelTitles = '';
          if (input.channelId) {
            try {
              const titles = await fetchChannelTitles(input.channelId);
              currentChannelTitles = formatChannelTitlesForPrompt(titles);
            } catch (error) {
              console.error('[generateStrategy] Error fetching channel titles:', error);
            }
          }
          
          const result = await generateStrategy({
            video_transcript: input.transcript,
            ab_test_report: abTestReport,
            current_channel_titles: currentChannelTitles,
            model: input.model,
            userId: ctx.user.id,
          });
          
          success = result.success;
          if (!success) {
            errorMessage = result.error;
          }
          
          const durationMs = Date.now() - startTime;
          const generationId = await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'strategy',
            model: input.model || 'gpt-4o',
            durationMs,
            success,
            errorMessage,
          });
          
          return { 
            strategy: result.data || "",
            generationId 
          };
        } catch (error: any) {
          errorMessage = error.message;
          const durationMs = Date.now() - startTime;
          await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'strategy',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage,
          });
          throw error;
        }
      }),

    exportABTestReport: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        videoTitle: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const { generateABTestReport, formatReportForDownload } = await import('./abTestReport');
        const report = await generateABTestReport(input.videoId, ctx.user.id);
        const formattedReport = formatReportForDownload(report, input.videoTitle);
        return { report: formattedReport };
      }),

    generateSuggestions: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        transcript: z.string(),
        currentTitle: z.string(),
        strategy: z.string().optional(),
        customPrompt: z.string().optional(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-5', 'gpt-5-pro']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { generateSuggestions } = await import('./openai');
        const { generateABTestReport } = await import('./abTestReport');
        const { createAiGenerationHistory } = await import('./db');
        
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        
        try {
          // Generate comprehensive A/B test report
          const abTestReport = await generateABTestReport(input.videoId, ctx.user.id);
          
          const result = await generateSuggestions({
            video_transcript: input.transcript,
            ab_test_report: abTestReport,
            strategy_summary: input.strategy || input.customPrompt || "Générer des titres optimisés",
            model: input.model,
          });
          
          success = result.success;
          if (!success) {
            errorMessage = result.error;
          }
          
          const durationMs = Date.now() - startTime;
          
          // Transform OpenAI response to expected format
          if (result.success && result.data && result.data.video_title_suggestions && Array.isArray(result.data.video_title_suggestions)) {
            const suggestions = result.data.video_title_suggestions.map((item: any, index: number) => ({
              title: item.title,
              reason: `Suggestion #${item.rank || index + 1} - Optimisé pour maximiser le CTR`
            }));
            
            const generationId = await createAiGenerationHistory({
              userId: ctx.user.id,
              generationType: 'title_suggestions',
              model: input.model || 'gpt-4o',
              durationMs,
              success,
              errorMessage,
            });
            
            return { suggestions, generationId };
          }
          
          // If no suggestions or invalid format, throw error with details
          if (result.success && result.data) {
            console.error('[generateSuggestions] Invalid response structure:', JSON.stringify(result.data, null, 2));
            await createAiGenerationHistory({
              userId: ctx.user.id,
              generationType: 'title_suggestions',
              model: input.model || 'gpt-4o',
              durationMs,
              success: false,
              errorMessage: 'Invalid response structure',
            });
            throw new Error('La réponse de l\'IA n\'a pas le format attendu. Vérifiez les logs du serveur.');
          }
          
          const generationId = await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'title_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage: 'No suggestions returned',
          });
          return { suggestions: [], generationId };
        } catch (error: any) {
          errorMessage = error.message;
          const durationMs = Date.now() - startTime;
          await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'title_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage,
          });
          throw error;
        }
      }),

    generateThumbnailSuggestions: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        transcript: z.string(),
        strategy: z.string().optional(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-5', 'gpt-5-pro']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getCoordinationScript, replaceScriptTags } = await import('./coordinationScripts');
        const { getLatestInstructionScript } = await import('./instructionScripts');
        const { generateABTestReport } = await import('./abTestReport');
        const { invokeLLM } = await import('./_core/llm');
        const { createAiGenerationHistory } = await import('./db');
        
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        
        try {
        // 1. Get coordination script for thumbnail generation
        const coordinationScript = await getCoordinationScript(ctx.user.id, 'thumbnail_generation');
        if (!coordinationScript) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Aucun script de coordination pour la génération de miniatures trouvé. Veuillez créer un script dans la page Scripts d\'Instructions.'
          });
        }
        
        // 2. Get instruction scripts
        const guideThumbnailMechanics = await getLatestInstructionScript(ctx.user.id, 'thumbnail_mechanics');
        const guideMidjourneyPrompts = await getLatestInstructionScript(ctx.user.id, 'midjourney_prompts');
        
        // 3. Generate A/B test report
        const abTestReport = await generateABTestReport(input.videoId, ctx.user.id);
        
        // 4. Replace tags in coordination script
        const finalPrompt = await replaceScriptTags(coordinationScript.content, {
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          strategy_summary: input.strategy || 'Générer des suggestions de miniatures optimisées',
          guide_thumbnail_mechanics: guideThumbnailMechanics?.content || 'Guide non disponible',
          guide_midjourney_prompts: guideMidjourneyPrompts?.content || 'Guide non disponible',
        });
        
        // 5. Call OpenAI with final prompt
        const response = await invokeLLM({
          model: input.model,
          messages: [
            { role: 'system', content: 'Tu es un expert en optimisation de miniatures YouTube.' },
            { role: 'user', content: finalPrompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'thumbnail_suggestions',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Titre court et accrocheur de la miniature' },
                        description: { type: 'string', description: 'Description détaillée des éléments visuels' },
                        midjourneyPrompt: { type: 'string', description: 'Prompt Midjourney complet et prêt à l\'emploi' },
                        rationale: { type: 'string', description: 'Explication de pourquoi cette miniature devrait performer' }
                      },
                      required: ['title', 'description', 'midjourneyPrompt', 'rationale'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        });
        
        // 6. Parse and return suggestions
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        
        if (!content || typeof content !== 'string') {
          const generationId = await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'thumbnail_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage: 'No content returned',
          });
          return { suggestions: [], generationId };
        }
        
        const parsed = JSON.parse(content);
        success = true;
        
        const generationId = await createAiGenerationHistory({
          userId: ctx.user.id,
          generationType: 'thumbnail_suggestions',
          model: input.model || 'gpt-4o',
          durationMs,
          success,
          errorMessage,
        });
        
        return { suggestions: parsed.suggestions || [], generationId };
        } catch (error: any) {
          errorMessage = error.message;
          const durationMs = Date.now() - startTime;
          await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'thumbnail_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage,
          });
          throw error;
        }
      }),

    generateTitleAndThumbnailSuggestions: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        transcript: z.string(),
        currentTitle: z.string().optional(),
        channelId: z.string().optional(),
        strategy: z.string().optional(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-5', 'gpt-5-pro']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getCoordinationScript, replaceScriptTags } = await import('./coordinationScripts');
        const { getLatestInstructionScript } = await import('./instructionScripts');
        const { generateABTestReport } = await import('./abTestReport');
        const { invokeLLM } = await import('./_core/llm');
        const { createAiGenerationHistory } = await import('./db');
        const { fetchChannelTitles, formatChannelTitlesForPrompt } = await import('./channelTitles');
        
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        
        try {
        // 1. Get coordination script
        const coordinationScript = await getCoordinationScript(ctx.user.id, 'title_and_thumbnail_generation');
        if (!coordinationScript) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script de coordination title_and_thumbnail_generation introuvable'
          });
        }
        
        // 2. Get instruction scripts
        const guideChannelAnalysis = await getLatestInstructionScript(ctx.user.id, 'channel_analysis');
        const guideTitle = await getLatestInstructionScript(ctx.user.id, 'title_guide');
        const guideScriptAnalysis = await getLatestInstructionScript(ctx.user.id, 'script_analysis');
        const guideThumbnailMechanics = await getLatestInstructionScript(ctx.user.id, 'thumbnail_mechanics');
        const guideMidjourneyPrompts = await getLatestInstructionScript(ctx.user.id, 'midjourney_prompts');
        
        // 3. Generate A/B test report
        const abTestReport = await generateABTestReport(input.videoId, ctx.user.id);
        
        // 4. Fetch current channel titles if channelId is provided
        let currentChannelTitles = '';
        if (input.channelId) {
          try {
            const titles = await fetchChannelTitles(input.channelId);
            currentChannelTitles = formatChannelTitlesForPrompt(titles);
          } catch (error) {
            console.error('[generateTitleAndThumbnailSuggestions] Error fetching channel titles:', error);
          }
        }
        
        // 5. Replace tags
        const finalPrompt = await replaceScriptTags(coordinationScript.content, {
          guide_channel_analysis: guideChannelAnalysis?.content || '',
          guide_title: guideTitle?.content || '',
          guide_script_analysis: guideScriptAnalysis?.content || '',
          guide_thumbnail_mechanics: guideThumbnailMechanics?.content || '',
          guide_midjourney_prompts: guideMidjourneyPrompts?.content || '',
          video_transcript: input.transcript,
          ab_test_report: abTestReport,
          current_channel_titles: currentChannelTitles,
          strategy_summary: input.strategy || 'Générer des titres et miniatures optimisés'
        });
        
        // 5. Call OpenAI
        const response = await invokeLLM({
          model: input.model,
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: 'Génère 10 titres et 10 miniatures pour cette vidéo.' }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'title_and_thumbnail_suggestions',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  video_title_suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        rank: { type: 'integer' },
                        title: { type: 'string' }
                      },
                      required: ['rank', 'title'],
                      additionalProperties: false
                    }
                  },
                  thumbnail_suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        rank: { type: 'integer' },
                        thumbnail_title_variants: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        midjourney_prompt_variants: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['rank', 'thumbnail_title_variants', 'midjourney_prompt_variants'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['video_title_suggestions', 'thumbnail_suggestions'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        
        if (!content || typeof content !== 'string') {
          const generationId = await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'title_and_thumbnail_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage: 'No content returned',
          });
          return { titleSuggestions: [], thumbnailSuggestions: [], generationId };
        }
        
        const parsed = JSON.parse(content);
        success = true;
        
        const generationId = await createAiGenerationHistory({
          userId: ctx.user.id,
          generationType: 'title_and_thumbnail_suggestions',
          model: input.model || 'gpt-4o',
          durationMs,
          success,
          errorMessage,
        });
        
        return {
          titleSuggestions: parsed.video_title_suggestions || [],
          thumbnailSuggestions: parsed.thumbnail_suggestions || [],
          generationId
        };
        } catch (error: any) {
          errorMessage = error.message;
          const durationMs = Date.now() - startTime;
          await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'title_and_thumbnail_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage,
          });
          throw error;
        }
      }),

    generateDescriptionSuggestions: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        videoTitle: z.string(),
        transcript: z.string(),
        tags: z.string().optional(),
        strategy: z.string().optional(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'gpt-5', 'gpt-5-pro']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getCoordinationScript, replaceScriptTags } = await import('./coordinationScripts');
        const { getLatestInstructionScript } = await import('./instructionScripts');
        const { invokeLLM } = await import('./_core/llm');
        const { createAiGenerationHistory } = await import('./db');
        
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        
        try {
        // 1. Get coordination script
        const coordinationScript = await getCoordinationScript(ctx.user.id, 'description_generation');
        if (!coordinationScript) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script de coordination description_generation introuvable'
          });
        }
        
        // 2. Get instruction script
        const guideDescription = await getLatestInstructionScript(ctx.user.id, 'description_guide');
        
        // 3. Replace tags
        const finalPrompt = await replaceScriptTags(coordinationScript.content, {
          video_transcript: input.transcript,
          ab_test_report: `Titre actuel: ${input.videoTitle}`,
          guide_description: guideDescription?.content || '',
          custom_instructions: input.strategy || ''
        });
        
        // 4. Call OpenAI
        const response = await invokeLLM({
          model: input.model,
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: 'Génère une description YouTube optimisée pour cette vidéo.' }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'description_suggestion',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  tags: { 
                    type: 'string',
                    description: 'Tags YouTube optimisés séparés par des virgules (500 caractères maximum au total)'
                  },
                  length_category: { type: 'string' },
                  keyword_density: { type: 'number' },
                  question_count: { type: 'integer' },
                  rationale: { type: 'string' }
                },
                required: ['description', 'tags', 'length_category', 'keyword_density', 'question_count', 'rationale'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0]?.message?.content;
        const durationMs = Date.now() - startTime;
        
        if (!content || typeof content !== 'string') {
          const generationId = await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'description_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage: 'No content returned',
          });
          return { description: '', rationale: '', generationId };
        }
        
        const parsed = JSON.parse(content);
        success = true;
        
        const generationId = await createAiGenerationHistory({
          userId: ctx.user.id,
          generationType: 'description_suggestions',
          model: input.model || 'gpt-4o',
          durationMs,
          success,
          errorMessage,
        });
        
        return { ...parsed, generationId };
        } catch (error: any) {
          errorMessage = error.message;
          const durationMs = Date.now() - startTime;
          await createAiGenerationHistory({
            userId: ctx.user.id,
            generationType: 'description_suggestions',
            model: input.model || 'gpt-4o',
            durationMs,
            success: false,
            errorMessage,
          });
          throw error;
        }
      }),
    
    getAiGenerationStats: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAiGenerationStats } = await import('./db');
        return await getAiGenerationStats(ctx.user.id);
      }),
    
    getBestModelByCategory: protectedProcedure
      .query(async ({ ctx }) => {
        const { getBestModelByCategory } = await import('./db');
        return await getBestModelByCategory(ctx.user.id);
      }),
    
    rateGeneration: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ input }) => {
        const { updateAiGenerationRating } = await import('./db');
        await updateAiGenerationRating(input.generationId, input.rating);
        return { success: true };
      }),
    
    saveFavoritePrompt: protectedProcedure
      .input(z.object({
        promptType: z.enum(['strategy', 'title', 'thumbnail', 'description']),
        promptContent: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { saveFavoritePrompt } = await import('./db');
        const promptId = await saveFavoritePrompt({
          userId: ctx.user.id,
          promptType: input.promptType,
          promptContent: input.promptContent,
        });
        return { promptId, success: true };
      }),
    
    listFavoritePrompts: protectedProcedure
      .input(z.object({
        promptType: z.enum(['strategy', 'title', 'thumbnail', 'description']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { getFavoritePrompts } = await import('./db');
        return await getFavoritePrompts(ctx.user.id, input.promptType);
      }),
    
    deleteFavoritePrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { deleteFavoritePrompt } = await import('./db');
        await deleteFavoritePrompt(input.promptId, ctx.user.id);
        return { success: true };
      }),
    
    useFavoritePrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { useFavoritePrompt } = await import('./db');
        await useFavoritePrompt(input.promptId);
        return { success: true };
      }),
    
    rateFavoritePrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ input, ctx }) => {
        const { rateFavoritePrompt } = await import('./db');
        await rateFavoritePrompt(input.promptId, input.rating, ctx.user.id);
        return { success: true };
      }),
    
    updatePromptCategories: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        categories: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updatePromptCategories } = await import('./db');
        await updatePromptCategories(input.promptId, input.categories, ctx.user.id);
        return { success: true };
      }),
    
    resetRatings: protectedProcedure
      .input(z.object({
        promptType: z.enum(['strategy', 'title', 'thumbnail', 'description', 'all']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { resetFavoritePromptRatings } = await import('./db');
        const count = await resetFavoritePromptRatings(ctx.user.id, input.promptType);
        return { success: true, count };
      }),
    
    resetGenerationRatings: protectedProcedure
      .input(z.object({
        generationType: z.enum(['title', 'thumbnail', 'description', 'strategy', 'all']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { resetGenerationRatings } = await import('./db');
        const count = await resetGenerationRatings(ctx.user.id, input.generationType);
        return { success: true, count };
      }),
    
    exportFavoritePrompts: protectedProcedure
      .query(async ({ ctx }) => {
        const { getFavoritePrompts } = await import('./db');
        const prompts = await getFavoritePrompts(ctx.user.id);
        return { prompts };
      }),
    
    importFavoritePrompts: protectedProcedure
      .input(z.object({
        prompts: z.array(z.object({
          promptType: z.enum(['strategy', 'title', 'thumbnail', 'description']),
          promptContent: z.string(),
          rating: z.number().optional(),
          categories: z.array(z.string()).optional(),
        })),
        overwrite: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { saveFavoritePrompt } = await import('./db');
        let imported = 0;
        let skipped = 0;
        
        for (const prompt of input.prompts) {
          try {
            await saveFavoritePrompt({
              userId: ctx.user.id,
              promptType: prompt.promptType,
              promptContent: prompt.promptContent,
              rating: prompt.rating,
              categories: prompt.categories ? JSON.stringify(prompt.categories) : undefined,
            });
            imported++;
          } catch (error) {
            skipped++;
          }
        }
        
        return { imported, skipped, success: true };
      }),
  }),

  // Favorite Prompts router (alias pour compatibilité avec les composants)
  favoritePrompts: router({
    saveFavoritePrompt: protectedProcedure
      .input(z.object({
        promptType: z.enum(['strategy', 'title', 'thumbnail', 'description']),
        promptContent: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { saveFavoritePrompt } = await import('./db');
        const promptId = await saveFavoritePrompt({
          userId: ctx.user.id,
          promptType: input.promptType,
          promptContent: input.promptContent,
        });
        return { promptId, success: true };
      }),
    
    listFavoritePrompts: protectedProcedure
      .input(z.object({
        promptType: z.enum(['strategy', 'title', 'thumbnail', 'description']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { getFavoritePrompts } = await import('./db');
        return await getFavoritePrompts(ctx.user.id, input.promptType);
      }),
    
    useFavoritePrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { useFavoritePrompt } = await import('./db');
        await useFavoritePrompt(input.promptId);
        return { success: true };
      }),
    
    deleteFavoritePrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { deleteFavoritePrompt } = await import('./db');
        await deleteFavoritePrompt(input.promptId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Synchronization router
  sync: router({
    // Get YouTube configuration
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const { getYouTubeConfig } = await import("./db");
      return await getYouTubeConfig(ctx.user.id);
    }),

    // Get channel sync info (for ID-based sync)
    getChannelSyncInfo: protectedProcedure.query(async ({ ctx }) => {
      const { getChannelSyncInfo } = await import("./db");
      return await getChannelSyncInfo(ctx.user.id);
    }),

    // Save YouTube configuration
    saveConfig: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        apiKey: z.string(),
        autoSyncEnabled: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertYouTubeConfig } = await import("./db");
        await upsertYouTubeConfig({
          userId: ctx.user.id,
          channelId: input.channelId,
          apiKey: input.apiKey,
          autoSyncEnabled: input.autoSyncEnabled,
          lastSyncAt: null,
        });
        return { success: true };
      }),

    // Trigger manual synchronization
    syncNow: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig, createSyncLog, updateSyncLog } = await import("./db");
      const { syncUserVideos } = await import("./sync/youtubeSync");
      const { notifyOwner } = await import("./_core/notification");
      
      const config = await getYouTubeConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouv\u00e9e. Veuillez d'abord configurer votre cha\u00eene.",
        });
      }

      const startTime = new Date();
      const logId = await createSyncLog({
        userId: ctx.user.id,
        status: "success",
        videosImported: 0,
        videosUpdated: 0,
        errors: null,
        startedAt: startTime,
        completedAt: null,
      });

      try {
        const result = await syncUserVideos(
          ctx.user.id,
          config.channelId,
          config.apiKey
        );

        const endTime = new Date();
        await updateSyncLog(logId, {
          status: result.success ? "success" : "partial",
          videosImported: result.imported,
          videosUpdated: result.updated,
          errors: result.errors.join("; ") || null,
          completedAt: endTime,
        });

        // Notify owner
        await notifyOwner({
          title: "Synchronisation YouTube",
          content: `\u2705 Synchronisation termin\u00e9e !\n\n` +
            `\ud83d\udce5 ${result.imported} nouvelles vid\u00e9os import\u00e9es\n` +
            `\ud83d\udd04 ${result.updated} vid\u00e9os mises \u00e0 jour`,
        });

        return {
          success: result.success,
          imported: result.imported,
          updated: result.updated,
          errors: result.errors,
        };
      } catch (error) {
        const endTime = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await updateSyncLog(logId, {
          status: "failed",
          errors: errorMessage,
          completedAt: endTime,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
        });
      }
    }),

    // Get synchronization history
    getSyncLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ ctx, input }) => {
        const { getSyncLogsByUser } = await import("./db");
        return await getSyncLogsByUser(ctx.user.id, input?.limit || 20);
      }),
    
    // Subscribe to YouTube webhook
    subscribeWebhook: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig } = await import("./db");
      const { subscribeToYouTubeChannel } = await import("./webhooks/youtubeWebhook");
      
      const config = await getYouTubeConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouvée.",
        });
      }
      
      // Construire l'URL du callback webhook
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.manus.im";
      const callbackUrl = `${baseUrl}/api/webhook/youtube`;
      
      const success = await subscribeToYouTubeChannel(config.channelId, callbackUrl);
      
      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'inscription au webhook YouTube.",
        });
      }
      
      return { success: true, callbackUrl };
    }),
    
    // Unsubscribe from YouTube webhook
    unsubscribeWebhook: protectedProcedure.mutation(async ({ ctx }) => {
      const { getYouTubeConfig } = await import("./db");
      const { unsubscribeFromYouTubeChannel } = await import("./webhooks/youtubeWebhook");
      
      const config = await getYouTubeConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration YouTube non trouvée.",
        });
      }
      
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://api.manus.im";
      const callbackUrl = `${baseUrl}/api/webhook/youtube`;
      
      const success = await unsubscribeFromYouTubeChannel(config.channelId, callbackUrl);
      
      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la désinscription du webhook YouTube.",
        });
      }
      
      return { success: true };
    }),
  }),
  
  // Audience router - analytics avancées
  audience: router({
    // Get video analytics (watch time metrics)
    getAnalytics: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return null;
        
        const { videoAnalytics } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const result = await db
          .select()
          .from(videoAnalytics)
          .where(eq(videoAnalytics.videoId, input.videoId))
          .orderBy(desc(videoAnalytics.createdAt))
          .limit(1);
        
        return result.length > 0 ? result[0] : null;
      }),
    
    // Get traffic sources
    getTrafficSources: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        
        const { trafficSources } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        return await db
          .select()
          .from(trafficSources)
          .where(eq(trafficSources.videoId, input.videoId))
          .orderBy(desc(trafficSources.percentage));
      }),
    
    // Get demographics
    getDemographics: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        
        const { demographics } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        return await db
          .select()
          .from(demographics)
          .where(eq(demographics.videoId, input.videoId))
          .orderBy(desc(demographics.viewsPercentage));
      }),
    
    // Get geography
    getGeography: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        
        const { geography } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        return await db
          .select()
          .from(geography)
          .where(eq(geography.videoId, input.videoId))
          .orderBy(desc(geography.percentage))
          .limit(20);
      }),
  }),

  channelAnalytics: router({
    getOverview: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { fetchChannelAnalytics } = await import("./channelAnalytics");
        return await fetchChannelAnalytics(ctx.user.id, input.startDate, input.endDate);
      }),

    getDemographics: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { fetchChannelDemographics } = await import("./channelAnalytics");
        return await fetchChannelDemographics(ctx.user.id, input.startDate, input.endDate);
      }),

    getGeography: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { fetchChannelGeography } = await import("./channelAnalytics");
        return await fetchChannelGeography(ctx.user.id, input.startDate, input.endDate);
      }),

    getTrafficSources: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { fetchChannelTrafficSources } = await import("./channelAnalytics");
        return await fetchChannelTrafficSources(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  instructionScripts: router({
    create: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
        content: z.string(),
        trainedBy: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createInstructionScript } = await import("./instructionScripts");
        const scriptId = await createInstructionScript(ctx.user.id, input.scriptType, input.content, input.trainedBy);
        return { success: true, scriptId };
      }),

    list: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      }))
      .query(async ({ ctx, input }) => {
        const { getInstructionScripts } = await import("./instructionScripts");
        return await getInstructionScripts(ctx.user.id, input.scriptType);
      }),

    getLatest: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      }))
      .query(async ({ ctx, input }) => {
        const { getLatestInstructionScript } = await import("./instructionScripts");
        return await getLatestInstructionScript(ctx.user.id, input.scriptType);
      }),

    getByVersion: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
        version: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const { getInstructionScriptByVersion } = await import("./instructionScripts");
        return await getInstructionScriptByVersion(ctx.user.id, input.scriptType, input.version);
      }),

    getAllLatest: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAllLatestScripts } = await import("./instructionScripts");
        return await getAllLatestScripts(ctx.user.id);
      }),

    trainScript: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["title_guide", "thumbnail_mechanics", "midjourney_prompts"]),
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
        channelId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { trainScript } = await import("./scriptTraining");
        const trainedContent = await trainScript({
          userId: ctx.user.id,
          scriptType: input.scriptType,
          model: input.model,
          channelId: input.channelId,
        });
        return { trainedContent };
      }),

    setActiveVersion: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
        version: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { setActiveVersion } = await import("./instructionScripts");
        await setActiveVersion(ctx.user.id, input.scriptType, input.version);
        return { success: true };
      }),

    getActive: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["channel_analysis", "title_guide", "description_guide", "script_analysis", "thumbnail_mechanics", "midjourney_prompts"]),
      }))
      .query(async ({ ctx, input }) => {
        const { getActiveInstructionScript } = await import("./instructionScripts");
        return await getActiveInstructionScript(ctx.user.id, input.scriptType);
      }),
  }),

  coordinationScripts: router({
    upsert: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["thumbnail_generation", "title_generation", "description_generation", "strategy_generation", "title_and_thumbnail_generation"]),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertCoordinationScript } = await import("./coordinationScripts");
        await upsertCoordinationScript(ctx.user.id, input.scriptType, input.content);
        return { success: true };
      }),

    get: protectedProcedure
      .input(z.object({
        scriptType: z.enum(["thumbnail_generation", "title_generation", "description_generation", "strategy_generation", "title_and_thumbnail_generation"]),
      }))
      .query(async ({ ctx, input }) => {
        const { getCoordinationScript } = await import("./coordinationScripts");
        return await getCoordinationScript(ctx.user.id, input.scriptType);
      }),

  }),

  // Brainstorm router (Pré-production et Post-production)
  brainstorm: router({
    generateVideoIdeas: protectedProcedure
      .input(z.object({
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateVideoIdeas } = await import("./brainstorm");
        return await generateVideoIdeas(ctx.user.id, input.model);
      }),

    generatePostProduction: protectedProcedure
      .input(z.object({
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"]).default("gpt-4o"),
        transcript: z.string().min(100, "La transcription doit faire au moins 100 caractères"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generatePostProduction } = await import("./brainstorm");
        return await generatePostProduction(ctx.user.id, input.model, input.transcript);
      }),

    rateGeneration: protectedProcedure
      .input(z.object({
        type: z.enum(["video_ideas", "post_production"]),
        model: z.string(),
        rating: z.number().min(-1).max(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { rateGeneration } = await import("./brainstorm");
        await rateGeneration(ctx.user.id, input.type, input.model, input.rating);
        return { success: true };
      }),
  }),

  // Saved Ideas router
  savedIdeas: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(['saved', 'in_progress', 'completed', 'archived']).optional(),
        ideaType: z.enum(['video_idea', 'title', 'thumbnail', 'tags', 'description']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getSavedIdeas(ctx.user.id, input?.status, input?.ideaType);
      }),

    save: protectedProcedure
      .input(z.object({
        ideaType: z.enum(['video_idea', 'title', 'thumbnail', 'tags', 'description']),
        title: z.string(),
        summary: z.string().optional(),
        source: z.enum(['brainstorm_preprod', 'brainstorm_postprod', 'competition_analysis']),
        model: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.saveIdea(ctx.user.id, input);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['saved', 'in_progress', 'completed', 'archived']),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateIdeaStatus(input.id, ctx.user.id, input.status);
      }),

    updateNotes: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateIdeaNotes(input.id, ctx.user.id, input.notes);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteIdea(input.id, ctx.user.id);
      }),
  }),

  // Competition Analysis router
  competition: router({
    search: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        generateVariations: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const { searchCompetitorVideos } = await import('./competitionAnalysis');
        return searchCompetitorVideos(input.keyword, input.generateVariations);
      }),

    analyze: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        variations: z.array(z.string()),
        videos: z.array(z.object({
          videoId: z.string(),
          title: z.string(),
          channelTitle: z.string(),
          viewCount: z.number(),
          viewCountText: z.string(),
          publishedTimeText: z.string(),
          duration: z.string(),
          thumbnailUrl: z.string(),
          description: z.string(),
        })),
        totalResults: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeCompetition } = await import('./competitionAnalysis');
        return analyzeCompetition(input);
      }),

    saveVideo: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        videoId: z.string(),
        videoTitle: z.string(),
        channelTitle: z.string().optional(),
        viewCount: z.number().optional(),
        publishedAt: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.saveCompetitorVideo(ctx.user.id, input);
      }),

    getSavedVideos: protectedProcedure
      .input(z.object({
        keyword: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getSavedCompetitorVideos(ctx.user.id, input?.keyword);
      }),
  }),

  // Trends Explorer router (multi-source trends)
  trends: router({
    searchAll: protectedProcedure
      .input(z.object({
        keyword: z.string().min(2),
        sources: z.array(z.enum(['twitter', 'reddit', 'tiktok', 'google_trends', 'news'])),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']).default('gpt-4o'),
        redditSubreddits: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { searchAllTrends } = await import('./trends');
        return searchAllTrends(input.keyword, input.sources, input.model, input.redditSubreddits);
      }),

    searchTwitter: protectedProcedure
      .input(z.object({ keyword: z.string() }))
      .mutation(async ({ input }) => {
        const { searchTwitterTrends } = await import('./trends');
        return searchTwitterTrends(input.keyword);
      }),

    searchReddit: protectedProcedure
      .input(z.object({ subreddit: z.string() }))
      .mutation(async ({ input }) => {
        const { searchRedditTrends } = await import('./trends');
        return searchRedditTrends(input.subreddit);
      }),

    searchTikTok: protectedProcedure
      .input(z.object({ keyword: z.string() }))
      .mutation(async ({ input }) => {
        const { searchTikTokTrends } = await import('./trends');
        return searchTikTokTrends(input.keyword);
      }),

    generateGoogleTrends: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']).default('gpt-4o'),
      }))
      .mutation(async ({ input }) => {
        const { generateGoogleTrends } = await import('./trends');
        return generateGoogleTrends(input.keyword, input.model);
      }),

    generateNews: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']).default('gpt-4o'),
      }))
      .mutation(async ({ input }) => {
        const { generateNewsTrends } = await import('./trends');
        return generateNewsTrends(input.keyword, input.model);
      }),

    suggestSubreddits: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        model: z.enum(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']).default('gpt-4o'),
      }))
      .mutation(async ({ input }) => {
        const { suggestSubreddits } = await import('./trends');
        return suggestSubreddits(input.keyword, input.model);
      }),
  }),

  // Script Writing router (Écriture de scripts coordonnés)
  scriptWriting: router({
    // Get channel videos for export
    getChannelExport: protectedProcedure
      .query(async ({ ctx }) => {
        const { getChannelVideosForExport } = await import('./scriptWriting');
        return getChannelVideosForExport(ctx.user.id);
      }),

    // Export channel videos as CSV
    exportCSV: protectedProcedure
      .query(async ({ ctx }) => {
        const { getChannelVideosForExport, formatVideosAsCSV } = await import('./scriptWriting');
        const data = await getChannelVideosForExport(ctx.user.id);
        return { csv: formatVideosAsCSV(data), totalVideos: data.totalVideos };
      }),

    // Get coordination prompt
    getCoordinationPrompt: protectedProcedure
      .query(async ({ ctx }) => {
        const { getScriptWritingCoordinationPrompt, DEFAULT_SCRIPT_COORDINATION_PROMPT } = await import('./scriptWriting');
        const prompt = await getScriptWritingCoordinationPrompt(ctx.user.id);
        return { prompt, isDefault: prompt === DEFAULT_SCRIPT_COORDINATION_PROMPT };
      }),

    // Save coordination prompt
    saveCoordinationPrompt: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { saveScriptWritingCoordinationPrompt } = await import('./scriptWriting');
        await saveScriptWritingCoordinationPrompt(ctx.user.id, input.content);
        return { success: true };
      }),

    // Reset to default prompt
    resetCoordinationPrompt: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { saveScriptWritingCoordinationPrompt, DEFAULT_SCRIPT_COORDINATION_PROMPT } = await import('./scriptWriting');
        await saveScriptWritingCoordinationPrompt(ctx.user.id, DEFAULT_SCRIPT_COORDINATION_PROMPT);
        return { success: true, prompt: DEFAULT_SCRIPT_COORDINATION_PROMPT };
      }),

    // Get all instruction scripts for preview
    getInstructionScripts: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAllInstructionScripts } = await import('./scriptWriting');
        return getAllInstructionScripts(ctx.user.id);
      }),

    // Generate full script
    generateScript: protectedProcedure
      .input(z.object({
        topic: z.string().min(10, "Le sujet doit faire au moins 10 caractères"),
        customInstructions: z.string().optional(),
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
        coordinationPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateFullScript } = await import('./scriptWriting');
        return generateFullScript(ctx.user.id, input);
      }),
  }),

  // Nano Banana (Gemini Image Generation) router
  nanoBanana: router({
    generateThumbnail: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        mode: z.enum(['standard', 'pro']).default('standard'),
        aspectRatio: z.enum(['16:9', '1:1', '4:3', '9:16']).default('16:9'),
        referenceImages: z.array(z.object({
          data: z.string(), // base64 encoded image
          mimeType: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateImage } = await import('./nanoBanana');
        
        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY dans les secrets.'
          });
        }
        
        // Convert base64 images to Buffer if provided
        const referenceImages = input.referenceImages?.map(img => ({
          data: Buffer.from(img.data, 'base64'),
          mimeType: img.mimeType,
        }));
        
        const result = await generateImage({
          prompt: input.prompt,
          mode: input.mode,
          aspectRatio: input.aspectRatio,
          referenceImages,
          apiKey,
        });
        
        return result;
      }),
  }),

  // Script Studio - Méta-prompts personnels et corrections durables
  scriptStudio: router({
    // ===== Profiles (Méta-Prompts) =====
    getProfiles: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.getScriptProfiles(ctx.user.id);
    }),

    getDefaultProfile: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.getDefaultProfile(ctx.user.id);
    }),

    createProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        metaPrompt: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.createScriptProfile(
          ctx.user.id,
          input.name,
          input.metaPrompt,
          input.description
        );
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        name: z.string().min(1).max(100).optional(),
        metaPrompt: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.updateScriptProfile(input.profileId, ctx.user.id, {
          name: input.name,
          metaPrompt: input.metaPrompt,
          description: input.description,
        });
        return { success: true };
      }),

    setDefaultProfile: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.setDefaultProfile(input.profileId, ctx.user.id);
        return { success: true };
      }),

    deleteProfile: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.deleteScriptProfile(input.profileId, ctx.user.id);
        return { success: true };
      }),

    // ===== Corrections (Carnet de Corrections) =====
    getCorrections: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getScriptCorrections(ctx.user.id, input?.activeOnly ?? true);
      }),

    addCorrection: protectedProcedure
      .input(z.object({
        problem: z.string().min(1),
        correction: z.string().min(1),
        category: z.enum(["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.addScriptCorrection(
          ctx.user.id,
          input.problem,
          input.correction,
          input.category || "other"
        );
      }),

    generateCorrectionFromFeedback: protectedProcedure
      .input(z.object({
        problem: z.string().min(1),
        model: z.enum(["gpt-4o", "gpt-4o-mini"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await scriptStudio.generateCorrectionFromFeedback(
          input.problem,
          input.model || "gpt-4o"
        );
      }),

    toggleCorrection: protectedProcedure
      .input(z.object({ correctionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.toggleCorrectionActive(input.correctionId, ctx.user.id);
        return { success: true };
      }),

    deleteCorrection: protectedProcedure
      .input(z.object({ correctionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.deleteScriptCorrection(input.correctionId, ctx.user.id);
        return { success: true };
      }),

    // ===== History =====
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getScriptHistory(ctx.user.id, input?.limit ?? 20);
      }),

    rateScript: protectedProcedure
      .input(z.object({
        historyId: z.number(),
        rating: z.enum(["-1", "0", "1"]).transform(v => parseInt(v) as -1 | 0 | 1),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.rateScript(input.historyId, ctx.user.id, input.rating, input.feedback);
        return { success: true };
      }),

    // ===== Enhanced Generation =====
    generateScript: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).optional(),
        customInstructions: z.string().optional(),
        profileId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.generateEnhancedScript(
          ctx.user.id,
          input.topic,
          input.model || "gpt-4o",
          input.customInstructions,
          input.profileId
        );
      }),

    getDefaultMetaPrompt: publicProcedure.query(() => {
      return { metaPrompt: scriptStudio.DEFAULT_META_PROMPT };
    }),

    // ===== Templates =====
    getTemplates: publicProcedure.query(() => {
      return scriptStudio.getProfileTemplates();
    }),

    createFromTemplate: protectedProcedure
      .input(z.object({
        templateKey: z.enum(["educatif", "storytelling", "polemique", "investigation", "divertissement"]),
        customName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.createProfileFromTemplate(
          ctx.user.id,
          input.templateKey,
          input.customName
        );
      }),

    // ===== Export/Import =====
    exportData: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.exportProfilesAndCorrections(ctx.user.id);
    }),

    importData: protectedProcedure
      .input(z.object({
        data: z.object({
          version: z.string(),
          exportedAt: z.string(),
          profiles: z.array(z.object({
            name: z.string(),
            description: z.string().nullable(),
            metaPrompt: z.string(),
            isDefault: z.boolean(),
          })),
          corrections: z.array(z.object({
            problem: z.string(),
            correction: z.string(),
            category: z.string(),
            isActive: z.boolean(),
          })),
        }),
        replaceExisting: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.importProfilesAndCorrections(
          ctx.user.id,
          input.data as scriptStudio.ExportData,
          { replaceExisting: input.replaceExisting }
        );
      }),

    // ===== Learning Statistics =====
    getLearningStats: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.getLearningStats(ctx.user.id);
    }),

    // Tags management
    getAllTags: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.getAllTags(ctx.user.id);
    }),

    updateProfileTags: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        tags: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        await scriptStudio.updateProfileTags(ctx.user.id, input.profileId, input.tags);
        return { success: true };
      }),

    getProfilesByTag: protectedProcedure
      .input(z.object({ tag: z.string() }))
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getProfilesByTag(ctx.user.id, input.tag);
      }),

    // Multi-profile comparison
    generateComparison: protectedProcedure
      .input(z.object({
        topic: z.string(),
        profileIds: z.array(z.number()).min(2).max(4),
        model: z.enum(["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "gpt-5", "gpt-5-pro"]).default("gpt-4o"),
        customInstructions: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.generateComparisonScripts(
          ctx.user.id,
          input.topic,
          input.profileIds,
          input.model,
          input.customInstructions
        );
      }),

    // AI Assistant for negative scripts
    analyzeNegativeScripts: protectedProcedure.query(async ({ ctx }) => {
      return await scriptStudio.analyzeNegativeScripts(ctx.user.id);
    }),

    applySuggestedCorrections: protectedProcedure
      .input(z.object({
        corrections: z.array(z.object({
          problem: z.string(),
          correction: z.string(),
          category: z.enum(["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"]),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.applySuggestedCorrections(ctx.user.id, input.corrections);
      }),

    // ===== Profile Versioning =====
    saveProfileVersion: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        changeDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.saveProfileVersion(ctx.user.id, input.profileId, input.changeDescription);
      }),

    getProfileVersions: protectedProcedure
      .input(z.object({
        profileId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getProfileVersions(ctx.user.id, input.profileId);
      }),

    restoreProfileVersion: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        versionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.restoreProfileVersion(ctx.user.id, input.profileId, input.versionId);
      }),

    compareProfileVersions: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        versionId1: z.number(),
        versionId2: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await scriptStudio.compareProfileVersions(
          ctx.user.id,
          input.profileId,
          input.versionId1,
          input.versionId2
        );
      }),

    // ===== Profile Branches (Experimental Variations) =====
    getBranches: protectedProcedure
      .input(z.object({
        profileId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getProfileBranches(ctx.user.id, input.profileId);
      }),

    createBranch: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.createProfileBranch(
          ctx.user.id,
          input.profileId,
          input.name,
          input.description
        );
      }),

    updateBranch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        metaPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { branchId, ...updates } = input;
        return await scriptStudio.updateProfileBranch(ctx.user.id, branchId, updates);
      }),

    mergeBranch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.mergeBranch(ctx.user.id, input.branchId);
      }),

    abandonBranch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.abandonBranch(ctx.user.id, input.branchId);
      }),

    deleteBranch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.deleteBranch(ctx.user.id, input.branchId);
      }),

    reactivateBranch: protectedProcedure
      .input(z.object({
        branchId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.reactivateBranch(ctx.user.id, input.branchId);
      }),

    // Visual Diff
    getVersionDiff: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        versionId1: z.number(),
        versionId2: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await scriptStudio.getVersionDiff(
          ctx.user.id,
          input.profileId,
          input.versionId1,
          input.versionId2
        );
      }),

    // Favorites
    toggleVersionFavorite: protectedProcedure
      .input(z.object({
        versionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await scriptStudio.toggleVersionFavorite(ctx.user.id, input.versionId);
      }),

    getFavoriteVersions: protectedProcedure
      .query(async ({ ctx }) => {
        return await scriptStudio.getFavoriteVersions(ctx.user.id);
      }),
  }),

  // Backup automatique
  backup: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const backupData = await autoBackup.generateBackup(ctx.user.id);
      return backupData;
    }),

    saveToS3: protectedProcedure.mutation(async ({ ctx }) => {
      const backupData = await autoBackup.generateBackup(ctx.user.id);
      const { url, size } = await autoBackup.saveBackupToS3(ctx.user.id, backupData);
      return { url, size, itemsCount: {
        profiles: backupData.profiles.length,
        corrections: backupData.corrections.length,
        history: backupData.history.length,
      }};
    }),

    restore: protectedProcedure
      .input(z.object({ backupData: z.any() }))
      .mutation(async ({ ctx, input }) => {
        return await autoBackup.restoreFromBackup(ctx.user.id, input.backupData);
      }),

    estimateSize: protectedProcedure.query(async ({ ctx }) => {
      const backupData = await autoBackup.generateBackup(ctx.user.id);
      return {
        size: autoBackup.estimateBackupSize(backupData),
        itemsCount: {
          profiles: backupData.profiles.length,
          corrections: backupData.corrections.length,
          history: backupData.history.length,
        },
      };
    }),
  }),

  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await settings.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        backupFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        abTestCtrThreshold: z.number().min(0).max(100).optional(),
        abTestViewsThreshold: z.number().min(0).optional(),
        notifyNewVideos: z.boolean().optional(),
        notifyABTestThreshold: z.boolean().optional(),
        notifyBackupComplete: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await settings.updateUserSettings(ctx.user.id, input);
      }),
  }),

  // Video templates
  videoTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await settings.getVideoTemplates(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        titleTemplate: z.string().optional(),
        descriptionTemplate: z.string().optional(),
        tagsTemplate: z.array(z.string()).optional(),
        category: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await settings.createVideoTemplate(ctx.user.id, input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        titleTemplate: z.string().optional(),
        descriptionTemplate: z.string().optional(),
        tagsTemplate: z.array(z.string()).optional(),
        category: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await settings.updateVideoTemplate(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await settings.deleteVideoTemplate(input.id);
      }),

    duplicate: protectedProcedure
      .input(z.object({
        id: z.number(),
        newName: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const newId = await settings.duplicateVideoTemplate(input.id, ctx.user.id, input.newName);
        return { id: newId };
      }),

    incrementUsage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await settings.incrementTemplateUsage(input.id);
        return { success: true };
      }),

    getCategories: protectedProcedure.query(async ({ ctx }) => {
      return await settings.getTemplateCategories(ctx.user.id);
    }),
  }),

  // View Tracking router
  viewTracking: router({
    // Get top videos by different metrics
    getTopVideos: protectedProcedure
      .input(z.object({
        period: z.enum(['latest', '1h', '2h', '24h', '48h', '1week', '2weeks', '1month']).default('24h'),
        limit: z.number().min(1).max(20).default(5),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getTopVideos } = await import('./viewTracking');
        const period = input?.period || '24h';
        const limit = input?.limit || 5;
        return await getTopVideos(ctx.user.id, period, limit);
      }),

    // Get all video trend stats for detailed view
    getAllStats: protectedProcedure
      .input(z.object({
        period: z.enum(['latest', '1h', '2h', '24h', '48h', '1week', '2weeks', '1month']).default('24h'),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getVideoTrendStats } = await import('./viewTracking');
        const period = input?.period || '24h';
        return await getVideoTrendStats(ctx.user.id, period);
      }),

    // Record stats snapshot (can be called anytime)
    recordStats: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { recordStatsSnapshot } = await import('./viewTracking');
        const result = await recordStatsSnapshot(ctx.user.id);
        return { success: true, ...result, timestamp: new Date().toISOString() };
      }),

    // Get the timestamp of the last recorded snapshot
    getLastSnapshotTime: protectedProcedure
      .query(async ({ ctx }) => {
        const { getLastSnapshotTime } = await import('./viewTracking');
        return await getLastSnapshotTime(ctx.user.id);
      }),

    // Check if stats have been recorded today (kept for backward compatibility)
    hasRecordedToday: protectedProcedure
      .query(async ({ ctx }) => {
        const { hasRecordedToday } = await import('./viewTracking');
        return await hasRecordedToday(ctx.user.id);
      }),

    // Get raw daily stats for a period
    getDailyStats: protectedProcedure
      .input(z.object({
        period: z.enum(['24h', '48h', '1week', '2weeks', '1month']).default('24h'),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getAllDailyStats } = await import('./viewTracking');
        const period = input?.period || '24h';
        return await getAllDailyStats(ctx.user.id, period);
      }),

    // Get view history for a specific video (for charts)
    getVideoHistory: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        hours: z.number().min(1).max(720).default(168), // Max 30 days
      }))
      .query(async ({ ctx, input }) => {
        const { getVideoViewHistory } = await import('./viewTracking');
        return await getVideoViewHistory(input.videoId, ctx.user.id, input.hours);
      }),

    // Get aggregated view history for all videos (for charts)
    getAggregatedHistory: protectedProcedure
      .input(z.object({
        hours: z.number().min(1).max(720).default(168), // Max 30 days
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getAggregatedViewHistory } = await import('./viewTracking');
        return await getAggregatedViewHistory(ctx.user.id, input?.hours || 168);
      }),

    // Compare two custom periods
    comparePeriods: protectedProcedure
      .input(z.object({
        period1Start: z.string().transform(s => new Date(s)),
        period1End: z.string().transform(s => new Date(s)),
        period2Start: z.string().transform(s => new Date(s)),
        period2End: z.string().transform(s => new Date(s)),
      }))
      .query(async ({ ctx, input }) => {
        const { compareCustomPeriods } = await import('./viewTracking');
        return await compareCustomPeriods(
          ctx.user.id,
          input.period1Start,
          input.period1End,
          input.period2Start,
          input.period2End
        );
      }),
  }),

  // Alerts router
  alerts: router({
    // Get all alerts for the user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(viewAlerts)
          .where(eq(viewAlerts.userId, ctx.user.id))
          .orderBy(desc(viewAlerts.createdAt));
      }),

    // Create a new alert
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        videoId: z.number().nullable().optional(),
        alertType: z.enum(['growth', 'decline', 'views']),
        threshold: z.number().min(1),
        period: z.enum(['1h', '2h', '24h', '48h', '1week']).default('1h'),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(viewAlerts).values({
          userId: ctx.user.id,
          name: input.name,
          videoId: input.videoId || null,
          alertType: input.alertType,
          threshold: input.threshold,
          period: input.period,
          enabled: true,
        });
        
        return { success: true, id: Number(result[0].insertId) };
      }),

    // Update an alert
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        threshold: z.number().min(1).optional(),
        period: z.enum(['1h', '2h', '24h', '48h', '1week']).optional(),
        enabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.threshold !== undefined) updateData.threshold = input.threshold;
        if (input.period !== undefined) updateData.period = input.period;
        if (input.enabled !== undefined) updateData.enabled = input.enabled;
        
        await db.update(viewAlerts)
          .set(updateData)
          .where(and(
            eq(viewAlerts.id, input.id),
            eq(viewAlerts.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Delete an alert
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        await db.delete(viewAlerts)
          .where(and(
            eq(viewAlerts.id, input.id),
            eq(viewAlerts.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Get alert history
    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(alertHistory)
          .where(eq(alertHistory.userId, ctx.user.id))
          .orderBy(desc(alertHistory.createdAt))
          .limit(input?.limit || 50);
      }),

    // Check alerts now (manual trigger)
    checkNow: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { triggered: [] };
        
        // Get all enabled alerts for this user
        const userAlerts = await db
          .select()
          .from(viewAlerts)
          .where(and(
            eq(viewAlerts.userId, ctx.user.id),
            eq(viewAlerts.enabled, true)
          ));
        
        if (userAlerts.length === 0) return { triggered: [] };
        
        const { checkAlerts } = await import('./viewTracking');
        const triggered: Array<{
          alertId: number;
          alertName: string;
          videoId: number;
          videoTitle: string;
          alertType: string;
          threshold: number;
          actualValue: number;
        }> = [];
        
        // Group alerts by period and check
        const alertsByPeriod = new Map<string, typeof userAlerts>();
        for (const alert of userAlerts) {
          const period = alert.period || '1h';
          if (!alertsByPeriod.has(period)) {
            alertsByPeriod.set(period, []);
          }
          alertsByPeriod.get(period)!.push(alert);
        }
        
        for (const [period, alerts] of alertsByPeriod) {
          const results = await checkAlerts(
            ctx.user.id,
            alerts.map(a => ({
              id: a.id,
              userId: a.userId,
              videoId: a.videoId,
              alertType: a.alertType as 'growth' | 'decline' | 'views',
              threshold: a.threshold,
              enabled: a.enabled,
            })),
            period as 'latest' | '1h' | '2h' | '24h' | '48h' | '1week' | '2weeks' | '1month'
          );
          
          for (const result of results) {
            if (result.triggered) {
              const alert = alerts.find(a => 
                (a.videoId === result.videoId || a.videoId === null) && 
                a.alertType === result.alertType
              );
              if (alert) {
                triggered.push({
                  alertId: alert.id,
                  alertName: alert.name,
                  videoId: result.videoId,
                  videoTitle: result.videoTitle,
                  alertType: result.alertType,
                  threshold: result.threshold,
                  actualValue: result.actualValue,
                });
                
                // Record in history
                await db.insert(alertHistory).values({
                  alertId: alert.id,
                  userId: ctx.user.id,
                  videoId: result.videoId,
                  videoTitle: result.videoTitle,
                  alertType: result.alertType,
                  threshold: result.threshold,
                  actualValue: result.actualValue,
                  notificationSent: false,
                });
                
                // Update alert trigger count
                await db.update(viewAlerts)
                  .set({
                    lastTriggeredAt: new Date(),
                    triggerCount: (alert.triggerCount || 0) + 1,
                  })
                  .where(eq(viewAlerts.id, alert.id));
              }
            }
          }
        }
        
        return { triggered };
      }),
  }),

  // Configuration router (pour la gestion des clés API)
  config: router({
    // Récupérer toutes les configurations (masquées pour les clés sensibles)
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' });
        }
        
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Lire le fichier .env
        const envPath = path.join(process.cwd(), '.env');
        const config: Record<string, string> = {};
        
        try {
          const envContent = await fs.readFile(envPath, 'utf-8');
          const lines = envContent.split('\n');
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const [key, ...valueParts] = trimmed.split('=');
              if (key) {
                config[key] = valueParts.join('=').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
              }
            }
          }
        } catch (e) {
          // Fichier .env n'existe pas encore, retourner les valeurs par défaut
        }
        
        return config;
      }),

    // Mettre à jour la configuration
    update: protectedProcedure
      .input(z.record(z.string(), z.string()))
      .mutation(async ({ ctx, input }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' });
        }
        
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const envPath = path.join(process.cwd(), '.env');
        
        // Générer le contenu du fichier .env
        const lines: string[] = [
          '# Configuration TubeTest Tracker',
          '# Généré automatiquement - ' + new Date().toISOString(),
          ''
        ];
        
        for (const [key, value] of Object.entries(input)) {
          if (value && value.length > 0) {
            // Escape les valeurs avec des espaces ou caractères spéciaux
            const needsQuotes = value.includes(' ') || value.includes('"') || value.includes("'");
            lines.push(`${key}=${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}`);
          }
        }
        
        await fs.writeFile(envPath, lines.join('\n') + '\n');
        
        return { success: true, message: 'Configuration sauvegardée. Redémarrez le serveur pour appliquer les changements.' };
      }),

    // Tester une connexion
    testConnection: protectedProcedure
      .input(z.object({ category: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' });
        }
        
        const { ENV } = await import('./_core/env');
        
        switch (input.category) {
          case 'database':
            try {
              const db = await getDb();
              if (!db) {
                return { success: false, message: 'Base de données non configurée' };
              }
              // Test simple
              await db.execute(sql`SELECT 1`);
              return { success: true, message: 'Connexion à la base de données réussie' };
            } catch (e: any) {
              return { success: false, message: `Erreur: ${e.message}` };
            }
          
          case 'llm':
            try {
              const { isLLMConfigured, getCurrentLLMProvider } = await import('./_core/llm');
              if (!isLLMConfigured()) {
                return { success: false, message: 'Aucune clé API LLM configurée' };
              }
              return { success: true, message: `Provider LLM configuré: ${getCurrentLLMProvider()}` };
            } catch (e: any) {
              return { success: false, message: `Erreur: ${e.message}` };
            }
          
          case 'youtube':
            try {
              if (!ENV.youtubeApiKey) {
                return { success: false, message: 'Clé API YouTube non configurée' };
              }
              // Test simple de l'API YouTube
              const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${ENV.youtubeApiKey}`
              );
              if (response.ok) {
                return { success: true, message: 'Connexion à l\'API YouTube réussie' };
              } else {
                const error = await response.text();
                return { success: false, message: `Erreur API YouTube: ${error}` };
              }
            } catch (e: any) {
              return { success: false, message: `Erreur: ${e.message}` };
            }
          
          case 'storage':
            try {
              const { isStorageConfigured } = await import('./storage');
              if (!isStorageConfigured()) {
                return { success: false, message: 'Stockage S3 non configuré' };
              }
              return { success: true, message: 'Configuration S3 détectée' };
            } catch (e: any) {
              return { success: false, message: `Erreur: ${e.message}` };
            }
          
          case 'email':
            if (!ENV.smtpHost || !ENV.smtpUser) {
              return { success: false, message: 'Configuration SMTP incomplète' };
            }
            return { success: true, message: `SMTP configuré: ${ENV.smtpHost}` };
          
          case 'auth':
            if (!ENV.cookieSecret) {
              return { success: false, message: 'JWT_SECRET non configuré' };
            }
            return { success: true, message: 'Authentification configurée' };
          
          default:
            return { success: false, message: 'Catégorie inconnue' };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
