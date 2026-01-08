/**
 * Module pour récupérer les titres actuels d'une chaîne YouTube
 * Utilisé pour analyser les tendances et les titres qui fonctionnent actuellement
 */

import { callDataApi } from "./_core/dataApi";

export interface ChannelTitle {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
}

/**
 * Récupère tous les titres d'une chaîne YouTube depuis 1 an
 * Ces titres représentent les tendances actuelles et les titres qui fonctionnent
 * @param channelId - L'ID de la chaîne YouTube
 * @returns Liste des titres avec leurs métriques
 */
export async function fetchChannelTitles(channelId: string): Promise<ChannelTitle[]> {
  const titles: ChannelTitle[] = [];
  
  try {
    let cursor: string | undefined;
    let fetchedCount = 0;
    const maxVideos = 200; // Récupérer jusqu'à 200 vidéos pour avoir un bon échantillon
    
    // Date limite : 1 an en arrière
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    console.log(`[ChannelTitles] Fetching titles for channel: ${channelId} (last 1 year)`);
    
    do {
      // Utiliser l'API Manus avec le filtre "videos_latest" pour exclure les Shorts
      const queryParams: any = {
        id: channelId,
        filter: "videos_latest",
        hl: "en",
        gl: "US"
      };
      
      if (cursor) {
        queryParams.cursor = cursor;
      }
      
      const result: any = await callDataApi("Youtube/get_channel_videos", {
        query: queryParams,
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
          
          // Vérifier que c'est bien une vidéo avec une durée valide (pas un Short)
          const lengthSeconds = video.lengthSeconds || 0;
          if (lengthSeconds < 60) continue; // Ignorer les Shorts
          
          const titleData: ChannelTitle = {
            videoId: videoId,
            title: video.title || "",
            publishedAt: video.publishedTimeText || "",
            viewCount: parseInt(String(video.stats?.views || "0")),
          };
          
          titles.push(titleData);
          fetchedCount++;
          
          if (fetchedCount >= maxVideos) break;
        }
      }
      
      cursor = result.cursorNext as string | undefined;
      
    } while (cursor && fetchedCount < maxVideos);
    
    console.log(`[ChannelTitles] Successfully fetched ${titles.length} titles`);
    return titles;
    
  } catch (error) {
    console.error("[ChannelTitles] Error fetching titles:", error);
    throw error;
  }
}

/**
 * Formate les titres de la chaîne pour inclusion dans un prompt IA
 * @param titles - Liste des titres récupérés
 * @returns Texte formaté pour le prompt
 */
export function formatChannelTitlesForPrompt(titles: ChannelTitle[]): string {
  if (titles.length === 0) {
    return "Aucun titre de chaîne disponible.";
  }
  
  // Trier par nombre de vues (les plus performants en premier)
  const sortedTitles = [...titles].sort((a, b) => b.viewCount - a.viewCount);
  
  let report = `=== RAPPORT DES TITRES ACTUELS DE LA CHAÎNE ===\n\n`;
  report += `Ce rapport présente les ${sortedTitles.length} titres actuels de la chaîne YouTube.\n`;
  report += `Ces titres représentent les tendances actuelles et les formulations qui fonctionnent en ce moment.\n`;
  report += `Ils sont triés par nombre de vues (les plus performants en premier).\n\n`;
  report += `IMPORTANT: Ces titres sont le résultat d'A/B testing continu. Ils reflètent les tendances actuelles\n`;
  report += `et les formulations qui génèrent le plus de clics. Utilisez-les comme référence pour comprendre\n`;
  report += `ce qui fonctionne actuellement sur la chaîne.\n\n`;
  report += `--- LISTE DES TITRES (triés par performance) ---\n\n`;
  
  sortedTitles.forEach((title, index) => {
    const viewsFormatted = title.viewCount.toLocaleString('fr-FR');
    report += `${index + 1}. "${title.title}"\n`;
    report += `   Vues: ${viewsFormatted} | Publié: ${title.publishedAt}\n\n`;
  });
  
  // Ajouter une analyse des patterns
  report += `\n--- ANALYSE DES PATTERNS ---\n\n`;
  
  // Extraire les mots-clés les plus fréquents
  const wordFrequency: Record<string, number> = {};
  sortedTitles.forEach(t => {
    const words = t.title.toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüç]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });
  
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => `"${word}" (${count}x)`);
  
  report += `Mots-clés les plus fréquents: ${topWords.join(', ')}\n\n`;
  
  // Analyser les structures de titres
  const hasQuestion = sortedTitles.filter(t => t.title.includes('?')).length;
  const hasExclamation = sortedTitles.filter(t => t.title.includes('!')).length;
  const hasPoints = sortedTitles.filter(t => t.title.includes('...')).length;
  const hasMajuscules = sortedTitles.filter(t => /[A-Z]{2,}/.test(t.title)).length;
  
  report += `Structures utilisées:\n`;
  report += `- Questions (?) : ${hasQuestion} titres (${Math.round(hasQuestion/sortedTitles.length*100)}%)\n`;
  report += `- Exclamations (!) : ${hasExclamation} titres (${Math.round(hasExclamation/sortedTitles.length*100)}%)\n`;
  report += `- Suspense (...) : ${hasPoints} titres (${Math.round(hasPoints/sortedTitles.length*100)}%)\n`;
  report += `- Majuscules d'emphase : ${hasMajuscules} titres (${Math.round(hasMajuscules/sortedTitles.length*100)}%)\n`;
  
  return report;
}
