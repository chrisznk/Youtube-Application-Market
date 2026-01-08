import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { abTests, testVariants } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

// Types de notifications
export type NotificationType = 
  | "new_video_synced"
  | "ab_test_threshold"
  | "weekly_backup"
  | "sync_error";

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Seuils de performance pour les tests A/B
const AB_TEST_THRESHOLDS = {
  ctr_difference: 0.1, // 10% de différence de CTR
  views_minimum: 100, // Minimum de vues pour déclencher
  confidence_level: 0.95, // 95% de confiance statistique
};

/**
 * Envoie une notification push au propriétaire
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  const formattedTitle = formatNotificationTitle(payload.type, payload.title);
  const formattedContent = formatNotificationContent(payload);
  
  return await notifyOwner({
    title: formattedTitle,
    content: formattedContent,
  });
}

/**
 * Formate le titre de la notification selon le type
 */
function formatNotificationTitle(type: NotificationType, title: string): string {
  const prefixes: Record<NotificationType, string> = {
    new_video_synced: "📹 Nouvelle vidéo",
    ab_test_threshold: "🎯 Test A/B",
    weekly_backup: "💾 Backup",
    sync_error: "⚠️ Erreur",
  };
  
  return `${prefixes[type]} - ${title}`;
}

/**
 * Formate le contenu de la notification
 */
function formatNotificationContent(payload: PushNotificationPayload): string {
  let content = payload.content;
  
  if (payload.metadata) {
    content += "\n\n---\nDétails:";
    for (const [key, value] of Object.entries(payload.metadata)) {
      content += `\n• ${key}: ${value}`;
    }
  }
  
  return content;
}

/**
 * Notification pour une nouvelle vidéo synchronisée
 */
export async function notifyNewVideoSynced(videoTitle: string, videoId: string): Promise<boolean> {
  return await sendPushNotification({
    type: "new_video_synced",
    title: "Vidéo synchronisée",
    content: `La vidéo "${videoTitle}" a été synchronisée avec succès.`,
    metadata: {
      "ID vidéo": videoId,
      "Date": new Date().toLocaleString("fr-FR"),
    },
  });
}

/**
 * Notification pour un seuil de performance A/B atteint
 */
export async function notifyABTestThreshold(
  testName: string,
  winningVariant: string,
  ctrDifference: number,
  confidence: number
): Promise<boolean> {
  return await sendPushNotification({
    type: "ab_test_threshold",
    title: "Résultat significatif",
    content: `Le test "${testName}" a atteint un résultat statistiquement significatif. La variante "${winningVariant}" est gagnante.`,
    metadata: {
      "Différence CTR": `${(ctrDifference * 100).toFixed(2)}%`,
      "Niveau de confiance": `${(confidence * 100).toFixed(1)}%`,
      "Date": new Date().toLocaleString("fr-FR"),
    },
  });
}

/**
 * Notification pour le backup hebdomadaire
 */
export async function notifyWeeklyBackup(
  profilesCount: number,
  correctionsCount: number,
  backupSize: string
): Promise<boolean> {
  return await sendPushNotification({
    type: "weekly_backup",
    title: "Backup hebdomadaire terminé",
    content: `Le backup automatique de vos données a été effectué avec succès.`,
    metadata: {
      "Profils sauvegardés": profilesCount,
      "Corrections sauvegardées": correctionsCount,
      "Taille du backup": backupSize,
      "Date": new Date().toLocaleString("fr-FR"),
    },
  });
}

/**
 * Notification pour une erreur de synchronisation
 */
export async function notifySyncError(errorMessage: string, context: string): Promise<boolean> {
  return await sendPushNotification({
    type: "sync_error",
    title: "Erreur de synchronisation",
    content: `Une erreur s'est produite lors de la synchronisation: ${errorMessage}`,
    metadata: {
      "Contexte": context,
      "Date": new Date().toLocaleString("fr-FR"),
    },
  });
}

/**
 * Vérifie les tests A/B et envoie des notifications si des seuils sont atteints
 */
export async function checkABTestThresholds(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Récupérer les tests actifs
    const activeTests = await db
      .select()
      .from(abTests)
      .where(and(
        eq(abTests.userId, userId),
        eq(abTests.status, "active")
      ));
    
    for (const test of activeTests) {
      // Récupérer les variantes du test
      const variants = await db
        .select()
        .from(testVariants)
        .where(eq(testVariants.testId, test.id));
      
      if (variants.length < 2) continue;
      
      // Calculer les métriques (utiliser likes/views comme proxy de performance)
      const variantsWithMetrics = variants.map(v => ({
        ...v,
        engagementRate: v.likes && v.views ? (v.likes / v.views) : 0,
      }));
      
      // Trouver la variante gagnante
      const sortedVariants = variantsWithMetrics.sort((a, b) => b.engagementRate - a.engagementRate);
      const winner = sortedVariants[0];
      const loser = sortedVariants[sortedVariants.length - 1];
      
      if (!winner || !loser) continue;
      
      const engagementDifference = winner.engagementRate - loser.engagementRate;
      const totalViews = (winner.views || 0) + (loser.views || 0);
      
      // Vérifier si les seuils sont atteints
      if (
        engagementDifference >= AB_TEST_THRESHOLDS.ctr_difference &&
        totalViews >= AB_TEST_THRESHOLDS.views_minimum
      ) {
        // Calculer la confiance statistique (simplifiée)
        const confidence = calculateStatisticalConfidence(
          winner.engagementRate,
          loser.engagementRate,
          winner.views || 0,
          loser.views || 0
        );
        
        if (confidence >= AB_TEST_THRESHOLDS.confidence_level) {
          await notifyABTestThreshold(
            test.name,
            winner.title,
            engagementDifference,
            confidence
          );
        }
      }
    }
  } catch (error) {
    console.error("[PushNotifications] Error checking A/B test thresholds:", error);
  }
}

/**
 * Calcule la confiance statistique (test Z simplifié)
 */
function calculateStatisticalConfidence(
  ctr1: number,
  ctr2: number,
  n1: number,
  n2: number
): number {
  if (n1 === 0 || n2 === 0) return 0;
  
  const pooledCtr = (ctr1 * n1 + ctr2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooledCtr * (1 - pooledCtr) * (1/n1 + 1/n2));
  
  if (se === 0) return 0;
  
  const zScore = Math.abs(ctr1 - ctr2) / se;
  
  // Approximation de la fonction de distribution cumulative normale
  const confidence = 1 - 2 * (1 - normalCDF(zScore));
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Fonction de distribution cumulative normale (approximation)
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}
