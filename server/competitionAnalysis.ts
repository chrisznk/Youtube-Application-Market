import { callDataApi } from "./_core/dataApi";
import { invokeLLM } from "./_core/llm";

interface YouTubeSearchResult {
  type: string;
  video?: {
    videoId: string;
    title: string;
    channelTitle: string;
    publishedTimeText: string;
    lengthText: string;
    viewCountText: string;
    descriptionSnippet?: string;
    thumbnails?: Array<{ url: string }>;
  };
}

interface YouTubeSearchResponse {
  contents: YouTubeSearchResult[];
  cursorNext?: string;
  estimatedResults?: number;
}

export interface CompetitorVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  viewCountText: string;
  publishedTimeText: string;
  duration: string;
  thumbnailUrl: string;
  description: string;
}

export interface CompetitionResult {
  keyword: string;
  variations: string[];
  videos: CompetitorVideo[];
  totalResults: number;
}

/**
 * Generate keyword variations using AI
 */
export async function generateKeywordVariations(keyword: string): Promise<string[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en SEO YouTube. Génère des variations de mots-clés pour la recherche de vidéos concurrentes.
        
Pour le mot-clé donné, génère 5 variations pertinentes que les utilisateurs pourraient rechercher sur YouTube.
Inclus :
- Le mot-clé original
- Des synonymes
- Des formulations alternatives
- Des questions liées
- Des variations avec "comment", "pourquoi", "meilleur", etc.

Réponds UNIQUEMENT avec un tableau JSON de strings, sans explication.
Exemple: ["mot clé", "variation 1", "variation 2", "comment faire X", "meilleur Y"]`
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
              description: "Liste des variations de mots-clés"
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
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    return parsed.variations || [keyword];
  } catch {
    return [keyword];
  }
}

/**
 * Parse view count text to number
 */
function parseViewCount(viewCountText: string): number {
  if (!viewCountText) return 0;
  
  // Remove "vues" or "views" and spaces
  const cleaned = viewCountText.toLowerCase()
    .replace(/vues?|views?/gi, '')
    .replace(/\s/g, '')
    .trim();
  
  // Handle French abbreviations (k, M, Md)
  const multipliers: Record<string, number> = {
    'k': 1000,
    'm': 1000000,
    'md': 1000000000,
    'b': 1000000000
  };
  
  for (const [suffix, multiplier] of Object.entries(multipliers)) {
    if (cleaned.endsWith(suffix)) {
      const num = parseFloat(cleaned.replace(suffix, '').replace(',', '.'));
      return Math.round(num * multiplier);
    }
  }
  
  // Try to parse as regular number
  const num = parseFloat(cleaned.replace(/,/g, '.').replace(/\s/g, ''));
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Search YouTube for competitor videos
 */
export async function searchCompetitorVideos(
  keyword: string,
  generateVariations: boolean = true
): Promise<CompetitionResult> {
  // Generate keyword variations if requested
  let variations: string[] = [keyword];
  if (generateVariations) {
    variations = await generateKeywordVariations(keyword);
  }
  
  const allVideos: CompetitorVideo[] = [];
  const seenVideoIds = new Set<string>();
  
  // Search for each variation
  for (const variation of variations) {
    try {
      const response = await callDataApi("Youtube/search", {
        query: {
          q: variation,
          hl: "fr",
          gl: "FR"
        }
      }) as YouTubeSearchResponse;
      
      if (response?.contents) {
        for (const item of response.contents) {
          if (item.type === 'video' && item.video) {
            const video = item.video;
            
            // Skip if already seen
            if (seenVideoIds.has(video.videoId)) continue;
            seenVideoIds.add(video.videoId);
            
            allVideos.push({
              videoId: video.videoId,
              title: video.title,
              channelTitle: video.channelTitle || 'Inconnu',
              viewCount: parseViewCount(video.viewCountText || '0'),
              viewCountText: video.viewCountText || '0 vues',
              publishedTimeText: video.publishedTimeText || 'Date inconnue',
              duration: video.lengthText || 'N/A',
              thumbnailUrl: video.thumbnails?.[0]?.url || '',
              description: video.descriptionSnippet || ''
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Competition] Error searching for "${variation}":`, error);
    }
  }
  
  // Sort by view count (descending)
  allVideos.sort((a, b) => b.viewCount - a.viewCount);
  
  return {
    keyword,
    variations,
    videos: allVideos.slice(0, 30), // Limit to top 30 videos
    totalResults: allVideos.length
  };
}

/**
 * Analyze competition results with AI
 */
export async function analyzeCompetition(result: CompetitionResult): Promise<string> {
  const topVideos = result.videos.slice(0, 10);
  
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en stratégie YouTube. Analyse les vidéos concurrentes et fournis des insights actionnables.

Analyse les patterns suivants :
1. **Formats de titres** : Quels mots-clés, structures et accroches fonctionnent ?
2. **Durées populaires** : Quelle durée semble performer le mieux ?
3. **Chaînes dominantes** : Qui sont les principaux acteurs ?
4. **Opportunités** : Quels angles ne sont pas encore exploités ?
5. **Recommandations** : Comment se différencier et performer ?

Sois concis et actionnable. Utilise des bullet points.`
      },
      {
        role: "user",
        content: `Mot-clé recherché : "${result.keyword}"
Variations utilisées : ${result.variations.join(', ')}

Top 10 vidéos par nombre de vues :
${topVideos.map((v, i) => `${i + 1}. "${v.title}" - ${v.channelTitle} - ${v.viewCountText} - ${v.duration}`).join('\n')}`
      }
    ]
  });

  const analysisContent = response.choices[0]?.message?.content;
  return typeof analysisContent === 'string' ? analysisContent : "Analyse non disponible";
}
