/**
 * Module de recherche de tendances multi-sources
 * Sources: Twitter/X, Reddit, TikTok, YouTube, Google (via IA)
 */

import { callDataApi } from "./_core/dataApi";
import { invokeLLM } from "./_core/llm";

export interface TrendItem {
  source: "twitter" | "reddit" | "tiktok" | "youtube" | "google_trends" | "news";
  title: string;
  description?: string;
  url?: string;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    score?: number;
  };
  hashtags?: string[];
  publishedAt?: string;
  author?: string;
  thumbnail?: string;
}

export interface TrendSearchResult {
  source: string;
  trends: TrendItem[];
  error?: string;
}

/**
 * Recherche les tendances Twitter/X pour un mot-clé
 */
export async function searchTwitterTrends(keyword: string): Promise<TrendSearchResult> {
  try {
    // D'abord, rechercher un profil populaire dans le domaine
    const profileResult = await callDataApi("Twitter/get_user_profile_by_username", {
      query: { username: keyword.replace(/\s+/g, "") },
    }) as Record<string, unknown>;

    // Ensuite, rechercher les tweets populaires
    // Note: L'API Twitter disponible ne permet pas de recherche directe par mot-clé
    // On utilise donc une approche alternative via l'IA pour générer des tendances
    
    const trends: TrendItem[] = [];
    
    // Si on a trouvé un profil, récupérer ses tweets
    if (profileResult?.result) {
      const userData = (profileResult.result as Record<string, unknown>)?.data as Record<string, unknown>;
      const user = (userData?.user as Record<string, unknown>)?.result as Record<string, unknown>;
      
      if (user?.rest_id) {
        const tweetsResult = await callDataApi("Twitter/get_user_tweets", {
          query: { user: String(user.rest_id), count: "10" },
        }) as Record<string, unknown>;
        
        // Parser les tweets
        const timeline = (tweetsResult?.result as Record<string, unknown>)?.timeline as Record<string, unknown>;
        const instructions = (timeline?.instructions as Array<Record<string, unknown>>) || [];
        
        for (const instruction of instructions) {
          if (instruction?.type === "TimelineAddEntries") {
            const entries = (instruction.entries as Array<Record<string, unknown>>) || [];
            for (const entry of entries) {
              const entryId = entry?.entryId as string;
              if (entryId?.startsWith("tweet-")) {
                const content = entry?.content as Record<string, unknown>;
                const itemContent = content?.itemContent as Record<string, unknown>;
                const tweetResults = itemContent?.tweet_results as Record<string, unknown>;
                const result = tweetResults?.result as Record<string, unknown>;
                const legacy = result?.legacy as Record<string, unknown>;
                
                if (legacy?.full_text) {
                  trends.push({
                    source: "twitter",
                    title: (legacy.full_text as string).substring(0, 100),
                    description: legacy.full_text as string,
                    engagement: {
                      likes: legacy.favorite_count as number || 0,
                      shares: legacy.retweet_count as number || 0,
                      comments: legacy.reply_count as number || 0,
                    },
                    publishedAt: legacy.created_at as string,
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

/**
 * Recherche les posts populaires Reddit
 */
export async function searchRedditTrends(subreddit: string): Promise<TrendSearchResult> {
  try {
    const result = await callDataApi("Reddit/AccessAPI", {
      query: { subreddit, limit: "25" },
    }) as Record<string, unknown>;
    
    const posts = (result?.posts as Array<Record<string, unknown>>) || [];
    const trends: TrendItem[] = [];
    
    for (const postWrapper of posts) {
      const post = postWrapper?.data as Record<string, unknown>;
      if (post) {
        trends.push({
          source: "reddit",
          title: post.title as string || "",
          description: (post.selftext as string)?.substring(0, 300) || "",
          url: `https://reddit.com${post.permalink || ""}`,
          engagement: {
            score: post.score as number || 0,
            comments: post.num_comments as number || 0,
          },
          author: post.author as string,
          publishedAt: new Date((post.created_utc as number || 0) * 1000).toISOString(),
          thumbnail: post.thumbnail as string,
        });
      }
    }
    
    return { source: "reddit", trends };
  } catch (error) {
    console.error("[Trends] Reddit search error:", error);
    return { source: "reddit", trends: [], error: String(error) };
  }
}

/**
 * Recherche les vidéos TikTok populaires
 */
export async function searchTikTokTrends(keyword: string): Promise<TrendSearchResult> {
  try {
    const result = await callDataApi("Tiktok/search_tiktok_video_general", {
      query: { keyword },
    }) as Record<string, unknown>;
    
    const videos = (result?.data as Array<Record<string, unknown>>) || [];
    const trends: TrendItem[] = [];
    
    for (const video of videos.slice(0, 20)) {
      const stats = video?.statistics as Record<string, unknown>;
      const author = video?.author as Record<string, unknown>;
      
      trends.push({
        source: "tiktok",
        title: (video.desc as string)?.substring(0, 100) || "",
        description: video.desc as string || "",
        engagement: {
          views: stats?.play_count as number || 0,
          likes: stats?.digg_count as number || 0,
          comments: stats?.comment_count as number || 0,
          shares: stats?.share_count as number || 0,
        },
        author: author?.nickname as string || author?.unique_id as string,
        publishedAt: video.create_time ? new Date((video.create_time as number) * 1000).toISOString() : undefined,
        thumbnail: (video.video as Record<string, unknown>)?.cover as string,
      });
    }
    
    return { source: "tiktok", trends };
  } catch (error) {
    console.error("[Trends] TikTok search error:", error);
    return { source: "tiktok", trends: [], error: String(error) };
  }
}

/**
 * Génère des tendances Google Trends via l'IA
 */
export async function generateGoogleTrends(keyword: string, model: string = "gpt-4o"): Promise<TrendSearchResult> {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en tendances de recherche Google. Ton rôle est de générer des tendances de recherche réalistes et actuelles basées sur un mot-clé donné.
          
Tu dois retourner un JSON avec exactement 10 tendances de recherche liées au mot-clé, avec pour chaque tendance:
- query: la requête de recherche exacte
- volume: un score de volume estimé (1-100)
- trend: "rising" ou "stable" ou "declining"
- relatedTopics: 3 sujets connexes

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`
        },
        {
          role: "user",
          content: `Génère 10 tendances de recherche Google actuelles pour le mot-clé: "${keyword}"
          
Pense aux:
- Questions fréquentes des internautes
- Sujets d'actualité liés
- Recherches comparatives
- Tutoriels et guides recherchés
- Controverses ou débats actuels`
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
                    query: { type: "string", description: "La requête de recherche" },
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
      return { source: "google_trends", trends: [], error: "Pas de réponse de l'IA" };
    }
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    
    const parsed = JSON.parse(content) as { trends: Array<{ query: string; volume: number; trend: string; relatedTopics: string[] }> };
    
    const trends: TrendItem[] = parsed.trends.map(t => ({
      source: "google_trends" as const,
      title: t.query,
      description: `Tendance: ${t.trend} | Sujets connexes: ${t.relatedTopics.join(", ")}`,
      engagement: {
        score: t.volume,
      },
      hashtags: t.relatedTopics,
    }));
    
    return { source: "google_trends", trends };
  } catch (error) {
    console.error("[Trends] Google Trends generation error:", error);
    return { source: "google_trends", trends: [], error: String(error) };
  }
}

/**
 * Génère des sujets d'actualité via l'IA
 */
export async function generateNewsTrends(keyword: string, model: string = "gpt-4o"): Promise<TrendSearchResult> {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un journaliste expert qui suit l'actualité en temps réel. Ton rôle est de générer des sujets d'actualité récents et pertinents basés sur un mot-clé donné.
          
Tu dois retourner un JSON avec exactement 10 sujets d'actualité liés au mot-clé, avec pour chaque sujet:
- headline: le titre de l'actualité
- summary: un résumé de 2-3 phrases
- angle: l'angle vidéo YouTube potentiel
- urgency: "breaking" ou "trending" ou "evergreen"

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`
        },
        {
          role: "user",
          content: `Génère 10 sujets d'actualité récents pour le mot-clé: "${keyword}"
          
Pense aux:
- Actualités des dernières semaines
- Annonces et lancements récents
- Controverses et débats actuels
- Évolutions technologiques ou scientifiques
- Événements à venir`
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
                    headline: { type: "string", description: "Titre de l'actualité" },
                    summary: { type: "string", description: "Résumé de l'actualité" },
                    angle: { type: "string", description: "Angle vidéo YouTube potentiel" },
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
      return { source: "news", trends: [], error: "Pas de réponse de l'IA" };
    }
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    
    const parsed = JSON.parse(content) as { news: Array<{ headline: string; summary: string; angle: string; urgency: string }> };
    
    const trends: TrendItem[] = parsed.news.map(n => ({
      source: "news" as const,
      title: n.headline,
      description: `${n.summary}\n\n📹 Angle vidéo: ${n.angle}`,
      hashtags: [n.urgency],
    }));
    
    return { source: "news", trends };
  } catch (error) {
    console.error("[Trends] News generation error:", error);
    return { source: "news", trends: [], error: String(error) };
  }
}

/**
 * Recherche de tendances multi-sources
 */
export async function searchAllTrends(
  keyword: string,
  sources: Array<"twitter" | "reddit" | "tiktok" | "google_trends" | "news">,
  model: string = "gpt-4o",
  redditSubreddits?: string[]
): Promise<TrendSearchResult[]> {
  const results: TrendSearchResult[] = [];
  
  const promises: Promise<TrendSearchResult>[] = [];
  
  for (const source of sources) {
    switch (source) {
      case "twitter":
        promises.push(searchTwitterTrends(keyword));
        break;
      case "reddit":
        // Rechercher dans plusieurs subreddits pertinents
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
        error: result.reason?.message || "Erreur inconnue",
      });
    }
  }
  
  return results;
}

/**
 * Génère des suggestions de subreddits pertinents pour un mot-clé
 */
export async function suggestSubreddits(keyword: string, model: string = "gpt-4o"): Promise<string[]> {
  try {
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: `Tu es un expert Reddit. Retourne une liste de 5 subreddits pertinents pour un mot-clé donné.
Réponds UNIQUEMENT avec un JSON contenant un tableau "subreddits" de noms de subreddits (sans le r/).`
        },
        {
          role: "user",
          content: `Quels sont les 5 subreddits les plus pertinents pour le mot-clé: "${keyword}"?`
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
    
    const parsed = JSON.parse(content) as { subreddits: string[] };
    return parsed.subreddits || ["all", "popular"];
  } catch {
    return ["all", "popular"];
  }
}
