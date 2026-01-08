import { parseStringPromise } from "xml2js";
import { syncUserVideos } from "../sync/youtubeSync";
import { getYouTubeConfig } from "../db";
import { notifyOwner } from "../_core/notification";

/**
 * Vérifie le challenge de YouTube lors de l'inscription au webhook
 */
export function verifyWebhookChallenge(challenge: string): string {
  return challenge;
}

/**
 * Parse le XML de notification YouTube
 */
export async function parseYouTubeNotification(xmlBody: string): Promise<{
  videoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
} | null> {
  try {
    const parsed = await parseStringPromise(xmlBody);
    
    // Structure du XML YouTube PubSubHubbub:
    // <feed>
    //   <entry>
    //     <yt:videoId>...</yt:videoId>
    //     <yt:channelId>...</yt:channelId>
    //     <title>...</title>
    //     <published>...</published>
    //   </entry>
    // </feed>
    
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
      publishedAt: publishedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Webhook] Error parsing YouTube notification:", error);
    return null;
  }
}

/**
 * Traite une notification de nouvelle vidéo YouTube
 */
export async function handleYouTubeNotification(notification: {
  videoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
}): Promise<void> {
  console.log(`[Webhook] New video detected: ${notification.title} (${notification.videoId})`);

  try {
    // Trouver l'utilisateur correspondant à ce channelId
    const { getAllYouTubeConfigs } = await import("../db");
    const configs = await getAllYouTubeConfigs();
    
    const userConfig = configs.find(c => c.channelId === notification.channelId);
    if (!userConfig) {
      console.log(`[Webhook] No user config found for channel ${notification.channelId}`);
      return;
    }

    // Déclencher une synchronisation instantanée pour cet utilisateur
    const result = await syncUserVideos(
      userConfig.userId,
      userConfig.channelId,
      userConfig.apiKey
    );

    // Notifier le propriétaire
    await notifyOwner({
      title: "🎬 Nouvelle vidéo détectée !",
      content: 
        `Titre: ${notification.title}\n\n` +
        `📥 ${result.imported} nouvelles vidéos importées\n` +
        `🔄 ${result.updated} vidéos mises à jour\n\n` +
        `La synchronisation instantanée a été effectuée avec succès.`,
    });

    console.log(`[Webhook] Sync completed: ${result.imported} imported, ${result.updated} updated`);
  } catch (error) {
    console.error("[Webhook] Error handling notification:", error);
    
    await notifyOwner({
      title: "❌ Erreur webhook YouTube",
      content: `Une erreur s'est produite lors du traitement d'une notification de nouvelle vidéo:\n\n${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * S'abonne aux notifications YouTube pour un channel
 */
export async function subscribeToYouTubeChannel(
  channelId: string,
  callbackUrl: string
): Promise<boolean> {
  try {
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe";
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "hub.callback": callbackUrl,
        "hub.topic": topicUrl,
        "hub.mode": "subscribe",
        "hub.verify": "async",
        "hub.lease_seconds": "864000", // 10 jours
      }).toString(),
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

/**
 * Se désabonne des notifications YouTube pour un channel
 */
export async function unsubscribeFromYouTubeChannel(
  channelId: string,
  callbackUrl: string
): Promise<boolean> {
  try {
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe";
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "hub.callback": callbackUrl,
        "hub.topic": topicUrl,
        "hub.mode": "unsubscribe",
        "hub.verify": "async",
      }).toString(),
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
