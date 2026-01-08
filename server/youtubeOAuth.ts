import { getAuthenticatedYouTubeService, getAuthenticatedAnalyticsService } from './youtubeAuth';
import { getVideoTranscript } from './youtubeCaptions';
import type { YouTubeVideoData } from '../shared/types';

/**
 * Récupère toutes les vidéos de la chaîne de l'utilisateur authentifié avec OAuth2
 */
export async function fetchUserYouTubeVideos(
  userId: number,
  periodDays: number = 7
): Promise<YouTubeVideoData[]> {
  const videos: YouTubeVideoData[] = [];
  
  try {
    const youtube = await getAuthenticatedYouTubeService(userId);
    
    // Récupérer l'ID de la chaîne de l'utilisateur
    const channelResponse = await youtube.channels.list({
      part: ['id', 'contentDetails'],
      mine: true,
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      console.log('[YouTube OAuth] No channel found for user');
      return [];
    }
    
    const channel = channelResponse.data.items[0];
    const channelId = channel.id!;
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      console.log('[YouTube OAuth] No uploads playlist found');
      return [];
    }
    
    console.log(`[YouTube OAuth] Fetching videos from uploads playlist: ${uploadsPlaylistId}`);
    
    // Calculer la date limite si une période est spécifiée
    let cutoffDate: Date | null = null;
    if (periodDays && periodDays > 0) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    }
    
    // Récupérer les vidéos de la playlist
    let nextPageToken: string | undefined;
    let fetchedCount = 0;
    const maxVideos = 50;
    
    do {
      const playlistResponse = await youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: nextPageToken,
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
        
        // Récupérer les détails complets de la vidéo
        const videoResponse = await youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: [videoId],
        });
        
        if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
          continue;
        }
        
        const video = videoResponse.data.items[0];
        const snippet = video.snippet!;
        const contentDetails = video.contentDetails!;
        const statistics = video.statistics!;
        
        // Vérifier la durée pour exclure les Shorts (< 60 secondes)
        const duration = contentDetails.duration || '';
        const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        let totalSeconds = 0;
        
        if (durationMatch) {
          const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
          const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
          const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
          totalSeconds = hours * 3600 + minutes * 60 + seconds;
        }
        
        // Exclure les Shorts (moins de 60 secondes)
        if (totalSeconds < 60) {
          console.log(`[YouTube OAuth] Skipping Short: ${snippet.title} (${totalSeconds}s)`);
          continue;
        }
        
        // Vérifier la date de publication si une période est spécifiée
        // TEMPORAIREMENT DÉSACTIVÉ pour permettre la récupération des transcriptions de toutes les vidéos
        // const publishedAt = new Date(snippet.publishedAt!);
        // if (cutoffDate && publishedAt < cutoffDate) {
        //   console.log(`[YouTube OAuth] Video too old, skipping: ${snippet.title}`);
        //   continue;
        // }
        
        console.log(`[YouTube OAuth] Processing video: ${snippet.title} (${totalSeconds}s)`);
        
        // Récupérer la transcription via YouTube Captions API (OAuth2)
        // DÉSACTIVÉ: Pour économiser le quota API, les transcriptions doivent être saisies manuellement
        let transcript: string | undefined;
        
        // Récupérer la courbe de rétention via YouTube Analytics API
        let retentionCurve: string | undefined;
        console.log(`[YouTube OAuth] Attempting to fetch retention curve for ${videoId}...`);
        try {
          const retentionData = await fetchVideoRetentionCurve(userId, videoId);
          if (retentionData && retentionData.length > 0) {
            retentionCurve = JSON.stringify(retentionData);
            console.log(`[YouTube OAuth] Retrieved retention curve for ${videoId} (${retentionData.length} points)`);
          }
        } catch (error) {
          console.error(`[YouTube OAuth] Error fetching retention curve for ${videoId}:`, error);
        }
        
        // Calculer le watchtime moyen (approximation: 50% de la durée)
        const averageViewDuration = Math.floor(totalSeconds * 0.5);
        const watchTimeMinutes = Math.floor(averageViewDuration / 60);
        
        const videoData: YouTubeVideoData = {
          id: videoId,
          title: snippet.title || '',
          description: snippet.description || '',
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
          channelId: channelId,
          channelTitle: snippet.channelTitle || 'YouTube Channel',
          publishedAt: snippet.publishedAt || '',
          viewCount: parseInt(String(statistics.viewCount || '0')),
          likeCount: parseInt(String(statistics.likeCount || '0')),
          commentCount: parseInt(String(statistics.commentCount || '0')),
          duration: duration,
          tags: snippet.tags || [],
          transcript,
          watchTimeMinutes,
          averageViewDuration,
          retentionCurve,
        };
        
        videos.push(videoData);
        fetchedCount++;
      }
      
      nextPageToken = playlistResponse.data.nextPageToken || undefined;
      
      if (fetchedCount >= maxVideos) {
        break;
      }
      
    } while (nextPageToken);
    
    console.log(`[YouTube OAuth] Successfully fetched ${videos.length} videos (Shorts excluded)`);
    return videos;
    
  } catch (error) {
    console.error('[YouTube OAuth] Error fetching videos:', error);
    throw error;
  }
}


/**
 * Récupère la courbe de rétention d'une vidéo depuis YouTube Analytics API
 * Retourne un tableau de points {time: number (secondes), retention: number (pourcentage)}
 */
export async function fetchVideoRetentionCurve(
  userId: number,
  videoId: string
): Promise<Array<{ time: number; retention: number }> | null> {
  try {
    const youtube = await getAuthenticatedYouTubeService(userId);
    
    // YouTube Analytics API nécessite youtubeAnalytics service
    const { google } = await import('googleapis');
    const auth = youtube.context._options.auth;
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
    
    // Récupérer les données de rétention absolue
    // La métrique 'audienceWatchRatio' donne le pourcentage de spectateurs à chaque moment
    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2000-01-01', // Date très ancienne pour avoir toutes les données
      endDate: new Date().toISOString().split('T')[0],
      metrics: 'audienceWatchRatio,elapsedVideoTimeRatio',
      dimensions: 'elapsedVideoTimeRatio',
      filters: `video==${videoId}`,
      sort: 'elapsedVideoTimeRatio',
    });
    
    if (!response.data.rows || response.data.rows.length === 0) {
      console.log(`[YouTube Analytics] No retention data found for video ${videoId}`);
      return null;
    }
    
    // Transformer les données en format utilisable
    // elapsedVideoTimeRatio est en pourcentage (0-100) du temps total de la vidéo
    // audienceWatchRatio est le pourcentage de spectateurs encore présents
    const retentionCurve = response.data.rows.map((row: any[]) => ({
      time: parseFloat(row[0]), // Pourcentage du temps de la vidéo
      retention: parseFloat(row[1]), // Pourcentage de rétention
    }));
    
    console.log(`[YouTube Analytics] Retrieved ${retentionCurve.length} retention points for video ${videoId}`);
    return retentionCurve;
    
  } catch (error: any) {
    console.error(`[YouTube Analytics] Error fetching retention curve for video ${videoId}:`, error.message);
    
    // Si l'API Analytics n'est pas activée ou accessible, retourner null
    if (error.code === 403 || error.code === 404) {
      console.log('[YouTube Analytics] Analytics API not available or not enabled for this channel');
    }
    
    return null;
  }
}

/**
 * Récupère le watch time moyen et la durée moyenne de visionnage d'une vidéo
 */
export async function fetchVideoWatchTimeStats(
  userId: number,
  videoId: string
): Promise<{ watchTimeMinutes: number; averageViewDuration: number } | null> {
  try {
    const youtube = await getAuthenticatedYouTubeService(userId);
    
    const { google } = await import('googleapis');
    const auth = youtube.context._options.auth;
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
    
    // Récupérer les statistiques de watch time
    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2000-01-01',
      endDate: new Date().toISOString().split('T')[0],
      metrics: 'estimatedMinutesWatched,averageViewDuration',
      filters: `video==${videoId}`,
    });
    
    if (!response.data.rows || response.data.rows.length === 0) {
      console.log(`[YouTube Analytics] No watch time stats found for video ${videoId}`);
      return null;
    }
    
    const row = response.data.rows[0];
    return {
      watchTimeMinutes: parseInt(row[0]) || 0,
      averageViewDuration: parseInt(row[1]) || 0, // En secondes
    };
    
  } catch (error: any) {
    console.error(`[YouTube Analytics] Error fetching watch time stats for video ${videoId}:`, error.message);
    return null;
  }
}

/**
 * Formate un timestamp en millisecondes en format [HH:MM:SS]
 */
function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
