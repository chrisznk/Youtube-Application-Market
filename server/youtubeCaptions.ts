import { getAuthenticatedYouTubeService } from './youtubeAuth';

/**
 * Récupère la transcription d'une vidéo via YouTube Captions API
 * 
 * @param userId - ID de l'utilisateur
 * @param videoId - ID de la vidéo YouTube
 * @returns Transcription nettoyée ou null si non disponible
 */
export async function getVideoTranscript(userId: number, videoId: string): Promise<string | null> {
  try {
    // Récupérer le service YouTube authentifié
    const youtube = await getAuthenticatedYouTubeService(userId);

    // Lister les pistes de sous-titres disponibles
    const captionsListResponse = await youtube.captions.list({
      part: ['snippet'],
      videoId: videoId,
    });

    const captions = captionsListResponse.data.items;
    if (!captions || captions.length === 0) {
      console.log(`[YouTube Captions] No captions available for video ${videoId}`);
      return null;
    }

    // Trouver la piste de sous-titres en français ou la première disponible
    let captionId: string | undefined;
    for (const caption of captions) {
      if (caption.snippet?.language === 'fr' && caption.id) {
        captionId = caption.id;
        break;
      }
    }

    // Si aucune piste en français n'est trouvée, utiliser la première
    if (!captionId && captions.length > 0 && captions[0].id) {
      captionId = captions[0].id;
    }

    if (!captionId) {
      console.log(`[YouTube Captions] No valid caption ID found for video ${videoId}`);
      return null;
    }

    // Télécharger la transcription au format SRT
    const captionDownloadResponse = await youtube.captions.download({
      id: captionId,
      tfmt: 'srt',
    });

    // Convertir la réponse en texte
    const transcriptText = captionDownloadResponse.data as string;

    // Nettoyer la transcription (supprimer les numéros, les horodatages, etc.)
    const cleanedTranscript = cleanSrtTranscript(transcriptText);

    console.log(`[YouTube Captions] Transcript retrieved for video ${videoId} (${cleanedTranscript.length} characters)`);
    return cleanedTranscript;
  } catch (error: any) {
    console.error(`[YouTube Captions] Error fetching transcript for video ${videoId}:`, error.message);
    return null;
  }
}

/**
 * Formate une transcription au format SRT en conservant les horodatages
 * Convertit le format SRT en format lisible avec timestamps
 * 
 * @param srtText - Texte au format SRT
 * @returns Transcription formatée avec horodatages
 */
function cleanSrtTranscript(srtText: string): string {
  const lines = srtText.split('\n');
  let formattedText = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Vérifier si c'est un numéro de séquence (ligne contenant uniquement des chiffres)
    if (/^\d+$/.test(line)) {
      i++; // Sauter le numéro de séquence
      if (i < lines.length) {
        const timestamp = lines[i].trim();
        // Extraire uniquement le timestamp de début (avant "-->")
        const startTime = timestamp.split('-->')[0].trim();
        i++; // Passer à la ligne de texte
        
        // Collecter toutes les lignes de texte jusqu'à la ligne vide
        let textContent = '';
        while (i < lines.length && lines[i].trim() !== '') {
          textContent += lines[i].trim() + ' ';
          i++;
        }
        
        // Ajouter le timestamp et le texte formaté
        if (textContent.trim()) {
          formattedText += `[${startTime}] ${textContent.trim()}\n`;
        }
      }
    } else {
      i++;
    }
  }

  return formattedText.trim();
}
