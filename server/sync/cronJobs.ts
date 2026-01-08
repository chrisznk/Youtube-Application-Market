import cron from "node-cron";
import { syncAllUsers, syncAllUserAnalytics } from "./youtubeSync";
import { createSyncLog, updateSyncLog, getAllYouTubeConfigs } from "../db";
import { notifyOwner } from "../_core/notification";
import { recordDailyStats, getTopVideos, TimePeriod } from "../viewTracking";

/**
 * Exécute la synchronisation quotidienne de toutes les vidéos YouTube
 */
export async function runDailySync() {
  console.log("[Cron] Starting daily YouTube synchronization...");
  
  const startTime = new Date();
  let logId: number | null = null;

  try {
    // Créer un log de synchronisation
    logId = await createSyncLog({
      userId: 0, // 0 = synchronisation globale
      status: "success",
      videosImported: 0,
      videosUpdated: 0,
      errors: null,
      startedAt: startTime,
      completedAt: null,
    });

    // Exécuter la synchronisation des vidéos
    const result = await syncAllUsers();
    
    // Synchroniser les analytics pour chaque utilisateur
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
    
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    // Mettre à jour le log
    if (logId) {
      await updateSyncLog(logId, {
        status: result.success ? "success" : "partial",
        videosImported: result.totalImported,
        videosUpdated: result.totalUpdated,
        errors: result.userResults
          .flatMap(r => r.errors)
          .filter(e => e.length > 0)
          .join("; ") || null,
        completedAt: endTime,
      });
    }

    // Notifier le propriétaire
    const message = result.success
      ? `✅ Synchronisation YouTube réussie !\n\n` +
        `📥 ${result.totalImported} nouvelles vidéos importées\n` +
        `🔄 ${result.totalUpdated} vidéos mises à jour\n` +
        `📊 ${totalAnalyticsSynced} analytics synchronisées\n` +
        `⏱️ Durée : ${duration}s`
      : `⚠️ Synchronisation YouTube partielle\n\n` +
        `📥 ${result.totalImported} nouvelles vidéos importées\n` +
        `🔄 ${result.totalUpdated} vidéos mises à jour\n` +
        `📊 ${totalAnalyticsSynced} analytics synchronisées\n` +
        `❌ Erreurs détectées\n` +
        `⏱️ Durée : ${duration}s`;

    await notifyOwner({
      title: "Synchronisation YouTube",
      content: message,
    });

    console.log(`[Cron] Daily sync completed: ${result.totalImported} imported, ${result.totalUpdated} updated`);
  } catch (error) {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[Cron] Daily sync failed:", errorMessage);

    // Mettre à jour le log en cas d'erreur
    if (logId) {
      await updateSyncLog(logId, {
        status: "failed",
        errors: errorMessage,
        completedAt: endTime,
      });
    }

    // Notifier le propriétaire de l'échec
    await notifyOwner({
      title: "❌ Échec de la synchronisation YouTube",
      content: `Une erreur s'est produite lors de la synchronisation automatique :\n\n${errorMessage}`,
    });
  }
}

/**
 * Initialise les tâches cron
 */
export function initializeCronJobs() {
  // Synchronisation quotidienne à 3h du matin
  cron.schedule("0 3 * * *", async () => {
    await runDailySync();
  }, {
    timezone: "Europe/Paris"
  });

  console.log("[Cron] Daily YouTube sync scheduled at 3:00 AM (Europe/Paris)");

  // Collecte des vues quotidiennes à minuit (pour le rapport quotidien)
  cron.schedule("0 0 * * *", async () => {
    await runDailyViewTracking();
  }, {
    timezone: "Europe/Paris"
  });

  console.log("[Cron] Daily view tracking scheduled at midnight (Europe/Paris)");
  
  // Collecte horaire des vues pour le suivi en temps réel
  cron.schedule("0 * * * *", async () => {
    await runHourlyViewTracking();
  }, {
    timezone: "Europe/Paris"
  });

  console.log("[Cron] Hourly view tracking scheduled (every hour)");
}

/**
 * Exécute la collecte horaire des vues (sans notification)
 * Enregistre un snapshot des vues actuelles pour le suivi en temps réel
 */
export async function runHourlyViewTracking() {
  console.log("[Cron] Starting hourly view tracking...");
  
  try {
    // Récupérer tous les utilisateurs avec une config YouTube
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

/**
 * Exécute la collecte quotidienne des vues et envoie le rapport par email
 */
export async function runDailyViewTracking() {
  console.log("[Cron] Starting daily view tracking...");
  
  try {
    // Récupérer tous les utilisateurs avec une config YouTube
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
    
    // Générer et envoyer le rapport quotidien pour le propriétaire
    await sendDailyViewReport();
    
    console.log(`[Cron] Daily view tracking completed: ${totalRecorded} recorded, ${totalErrors} errors`);
  } catch (error) {
    console.error("[Cron] Daily view tracking failed:", error);
  }
}

/**
 * Envoie le rapport quotidien des vues par email au propriétaire
 */
async function sendDailyViewReport() {
  try {
    // Récupérer les configs pour trouver l'utilisateur principal (propriétaire)
    const configs = await getAllYouTubeConfigs();
    if (configs.length === 0) return;
    
    // Utiliser le premier utilisateur (propriétaire)
    const userId = configs[0].userId;
    
    // Récupérer les top 5 de chaque catégorie
    const topVideos = await getTopVideos(userId, '24h', 5);
    
    // Formater le rapport
    const formatVideoList = (videos: typeof topVideos.topViewers, metric: 'views' | 'growth') => {
      if (videos.length === 0) return "Aucune donnée disponible";
      return videos.map((v, i) => {
        if (metric === 'views') {
          return `${i + 1}. ${v.title.substring(0, 40)}... (+${v.viewDelta.toLocaleString()} vues)`;
        } else {
          const rate = (v.viewGrowthRate / 100).toFixed(2);
          return `${i + 1}. ${v.title.substring(0, 40)}... (${rate}%)`;
        }
      }).join("\n");
    };
    
    const report = `📊 Rapport Quotidien des Vues - ${new Date().toLocaleDateString('fr-FR')}

` +
      `🚀 TOP 5 - PLUS DE VUES (24h)
${formatVideoList(topVideos.topViewers, 'views')}

` +
      `📈 TOP 5 - CROISSANCE
${formatVideoList(topVideos.topGrowing, 'growth')}

` +
      `📉 TOP 5 - DÉCROISSANCE
${formatVideoList(topVideos.topDeclining, 'growth')}

` +
      `💭 TOP 5 - MOINS DE VUES (24h)
${formatVideoList(topVideos.lowestViewers, 'views')}`;
    
    await notifyOwner({
      title: "Rapport Quotidien des Vues",
      content: report,
    });
    
    console.log("[Cron] Daily view report sent successfully");
  } catch (error) {
    console.error("[Cron] Error sending daily view report:", error);
  }
}
