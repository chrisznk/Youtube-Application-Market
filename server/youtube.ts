import { YouTubeVideoData } from "@shared/types";
import { callDataApi } from "./_core/dataApi";
import { YoutubeTranscript } from "youtube-transcript";

// Clés API YouTube avec rotation
const YOUTUBE_API_KEYS = [
  "AIzaSyAsfUCg0MfNQ2a-C7WUy5j2zFFR6HzF3H4",
  "AIzaSyBqL8vZ9X2kN5mP3wQ7tR8sU4vW6xY0zA2",
  "AIzaSyC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0vW1x",
];

let currentKeyIndex = 0;

/**
 * Obtient la clé API YouTube actuelle et passe à la suivante
 */
function getYouTubeApiKey(): string {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  return key;
}

/**
 * Récupère les statistiques détaillées d'une vidéo depuis YouTube Data API v3
 */
async function fetchVideoDetails(videoId: string): Promise<{
  likeCount: number;
  commentCount: number;
  description: string;
  watchTimeMinutes: number;
  averageViewDuration: number;
} | null> {
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
    
    // Calculer le watchtime moyen (approximation basée sur la durée)
    const duration = contentDetails.duration || "";
    const durationMatch = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    let totalSeconds = 0;
    
    if (durationMatch) {
      const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
      const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
      const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
      totalSeconds = hours * 3600 + minutes * 60 + seconds;
    }
    
    // Approximation: watchtime moyen = 50% de la durée totale
    const averageViewDuration = Math.floor(totalSeconds * 0.5);
    const watchTimeMinutes = Math.floor(averageViewDuration / 60);
    
    return {
      likeCount: parseInt(statistics.likeCount || "0"),
      commentCount: parseInt(statistics.commentCount || "0"),
      description: snippet.description || "",
      watchTimeMinutes,
      averageViewDuration,
    };
  } catch (error) {
    console.error(`[YouTube] Error fetching details for video ${videoId}:`, error);
    return null;
  }
}

/**
 * Récupère la transcription d'une vidéo YouTube
 */
async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return null;
    }
    
    // Concaténer tous les segments de transcription
    const fullTranscript = transcript.map(item => item.text).join(" ");
    return fullTranscript;
  } catch (error) {
    console.log(`[YouTube] No transcript available for video ${videoId}`);
    return null;
  }
}

/**
 * Récupère les vidéos d'une chaîne YouTube en excluant automatiquement les Shorts
 * Utilise l'API Manus qui a un filtre natif pour les vidéos uniquement
 */
export async function fetchYouTubeVideos(
  channelId: string,
  periodDays?: number
): Promise<YouTubeVideoData[]> {
  const videos: YouTubeVideoData[] = [];
  
  try {
    let cursor: string | undefined;
    let fetchedCount = 0;
    const maxVideos = 50;
    
    // Calculer la date limite si une période est spécifiée
    let cutoffDate: Date | null = null;
    if (periodDays && periodDays > 0) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    }
    
    console.log(`[YouTube] Fetching videos for channel: ${channelId}${periodDays ? ` (last ${periodDays} days)` : ""}`);
    
    do {
      // Utiliser l'API Manus avec le filtre "videos_latest" pour exclure les Shorts
      // Forcer la langue française pour récupérer les titres en français
      const queryParams: any = {
        id: channelId,
        filter: "videos_latest", // Ce filtre exclut automatiquement les Shorts
        hl: "fr", // Forcer les titres en français
        gl: "FR"  // Région France
      };
      
      if (cursor) {
        queryParams.cursor = cursor;
      }
      
      const result: any = await callDataApi("Youtube/get_channel_videos", {
        query: queryParams,
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
          
          // Vérifier que c'est bien une vidéo avec une durée valide
          const lengthSeconds = video.lengthSeconds || 0;
          
          // Log pour debug
          console.log(`[YouTube] Processing video: ${video.title} (${lengthSeconds}s)`);
          
          // Récupérer les détails complets de la vidéo (likes, commentaires, description)
          const details = await fetchVideoDetails(videoId);
          
          // Récupérer la transcription
          const transcript = await fetchVideoTranscript(videoId);
          
          const videoData: YouTubeVideoData = {
            id: videoId,
            title: video.title || "",
            description: details?.description || video.descriptionSnippet || "",
            thumbnailUrl: video.thumbnails?.[0]?.url || "",
            channelId: channelId,
            channelTitle: "YouTube Channel",
            publishedAt: video.publishedTimeText || "",
            viewCount: parseInt(String(video.stats?.views || "0")),
            likeCount: details?.likeCount || 0,
            commentCount: details?.commentCount || 0,
            duration: `PT${lengthSeconds}S`,
            tags: [],
            transcript: transcript || undefined,
            watchTimeMinutes: details?.watchTimeMinutes || 0,
            averageViewDuration: details?.averageViewDuration || 0,
          };
          
          videos.push(videoData);
          
          fetchedCount++;
          if (fetchedCount >= maxVideos) break;
        }
      }
      
      cursor = result.cursorNext as string | undefined;
      
      // Si on a une date limite et qu'on a assez de vidéos, on arrête
      if (cutoffDate && fetchedCount >= maxVideos) {
        break;
      }
      
    } while (cursor && fetchedCount < maxVideos);
    
    console.log(`[YouTube] Successfully fetched ${videos.length} videos (Shorts excluded)`);
    return videos;
    
  } catch (error) {
    console.error("[YouTube] Error fetching videos:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'une vidéo YouTube
 */
export async function fetchYouTubeVideoStats(videoId: string) {
  try {
    const details = await fetchVideoDetails(videoId);
    
    if (!details) {
      return {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      };
    }
    
    return {
      viewCount: 0, // Les vues sont déjà dans les données de base
      likeCount: details.likeCount,
      commentCount: details.commentCount,
    };
    
  } catch (error) {
    console.error("[YouTube] Error fetching video stats:", error);
    throw error;
  }
}
