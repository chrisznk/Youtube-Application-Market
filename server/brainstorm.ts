import { invokeLLM } from "./_core/llm";
import { getActiveInstructionScript } from "./instructionScripts";
import { getVideosByUserId } from "./db";
import type { Video } from "../drizzle/schema";

interface VideoIdea {
  title: string;
  summary: string;
}

interface PostProdResult {
  titles: string[];
  thumbnailIdeas: string[];
  tagsSets: string[];
  descriptions: string[];
}

/**
 * Génère 10 idées de vidéos basées sur l'analyse de la chaîne
 */
export async function generateVideoIdeas(
  userId: number,
  model: string
): Promise<{ ideas: VideoIdea[] }> {
  // Récupérer les scripts d'instruction actifs
  const channelAnalysis = await getActiveInstructionScript(userId, "channel_analysis");
  const scriptPillars = await getActiveInstructionScript(userId, "script_analysis");
  const titleGuide = await getActiveInstructionScript(userId, "title_guide");

  // Récupérer toutes les vidéos de la chaîne avec leurs stats
  const videos = await getVideosByUserId(userId);
  
  // Formater les données des vidéos
  const videosData = videos.map((v: Video) => ({
    title: v.title,
    description: v.description || "",
    views: v.viewCount || 0,
    likes: v.likeCount || 0,
    comments: v.commentCount || 0,
    publishedAt: v.publishedAt,
  }));

  // Trier par vues pour identifier les vidéos les plus performantes
  const sortedByViews = [...videosData].sort((a: { views: number }, b: { views: number }) => b.views - a.views);
  const topPerformers = sortedByViews.slice(0, 10);

  const prompt = `Tu es un expert en stratégie de contenu YouTube. Ton objectif est de générer 10 idées de vidéos innovantes et engageantes pour cette chaîne.

## ANALYSE DE LA CHAÎNE
${channelAnalysis?.content || "Non disponible"}

## PILIERS D'UN BON SCRIPT
${scriptPillars?.content || "Non disponible"}

## GUIDE DE TITRE
${titleGuide?.content || "Non disponible"}

## VIDÉOS DE LA CHAÎNE (${videos.length} vidéos)
${videosData.map(v => `- "${v.title}" | ${v.views} vues | ${v.likes} likes | ${v.comments} commentaires`).join("\n")}

## TOP 10 DES VIDÉOS LES PLUS VUES
${topPerformers.map((v, i) => `${i + 1}. "${v.title}" - ${v.views} vues`).join("\n")}

## MISSION
Génère exactement 10 idées de vidéos qui :
1. S'inscrivent dans la ligne éditoriale de la chaîne
2. Exploitent les sujets qui ont le mieux fonctionné
3. Apportent de la nouveauté et de l'originalité
4. Ont un fort potentiel viral
5. Respectent les principes du guide de titre

Pour chaque idée, fournis :
- Un titre accrocheur et optimisé
- Un court résumé (2-3 phrases) expliquant le concept et l'angle

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "ideas": [
    {
      "title": "Titre de la vidéo",
      "summary": "Court résumé du concept et de l'angle de la vidéo."
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es un expert en stratégie YouTube. Tu réponds uniquement en JSON valide." },
      { role: "user", content: prompt }
    ],
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_ideas",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" }
                },
                required: ["title", "summary"],
                additionalProperties: false
              }
            }
          },
          required: ["ideas"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Pas de réponse de l'IA");
  }

  const result = JSON.parse(content);
  return { ideas: result.ideas.slice(0, 10) };
}

/**
 * Génère le contenu post-production à partir d'une transcription
 */
export async function generatePostProduction(
  userId: number,
  model: string,
  transcript: string
): Promise<PostProdResult> {
  // Récupérer les scripts d'instruction actifs
  const channelAnalysis = await getActiveInstructionScript(userId, "channel_analysis");
  const titleGuide = await getActiveInstructionScript(userId, "title_guide");
  const descriptionGuide = await getActiveInstructionScript(userId, "description_guide");
  const thumbnailMechanics = await getActiveInstructionScript(userId, "thumbnail_mechanics");

  const prompt = `Tu es un expert en optimisation YouTube. À partir de cette transcription, génère du contenu optimisé pour maximiser les performances de la vidéo.

## ANALYSE DE LA CHAÎNE
${channelAnalysis?.content || "Non disponible"}

## GUIDE DE TITRE
${titleGuide?.content || "Non disponible"}

## GUIDE DE DESCRIPTION
${descriptionGuide?.content || "Non disponible"}

## MÉCANIQUES DE MINIATURE
${thumbnailMechanics?.content || "Non disponible"}

## TRANSCRIPTION DE LA VIDÉO
${transcript}

## MISSION
Génère :
1. **10 titres** accrocheurs et optimisés pour le CTR
2. **10 idées de miniatures** avec description visuelle détaillée
3. **2 sets de tags** (IMPORTANT : chaque set doit faire maximum 500 caractères, tags séparés par des virgules)
4. **2 descriptions** complètes et optimisées pour le SEO

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "titles": ["titre1", "titre2", ...],
  "thumbnailIdeas": ["description miniature 1", "description miniature 2", ...],
  "tagsSets": ["tag1, tag2, tag3...", "tag1, tag2, tag3..."],
  "descriptions": ["description complète 1", "description complète 2"]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Tu es un expert en optimisation YouTube. Tu réponds uniquement en JSON valide." },
      { role: "user", content: prompt }
    ],
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "post_production",
        strict: true,
        schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" }
            },
            thumbnailIdeas: {
              type: "array",
              items: { type: "string" }
            },
            tagsSets: {
              type: "array",
              items: { type: "string" }
            },
            descriptions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["titles", "thumbnailIdeas", "tagsSets", "descriptions"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Pas de réponse de l'IA");
  }

  const result = JSON.parse(content);
  
  // S'assurer que les tags ne dépassent pas 500 caractères
  const tagsSets = result.tagsSets.map((tags: string) => {
    if (tags.length > 500) {
      // Tronquer intelligemment au dernier tag complet avant 500 caractères
      const truncated = tags.substring(0, 500);
      const lastComma = truncated.lastIndexOf(",");
      return lastComma > 0 ? truncated.substring(0, lastComma) : truncated;
    }
    return tags;
  });

  return {
    titles: result.titles.slice(0, 10),
    thumbnailIdeas: result.thumbnailIdeas.slice(0, 10),
    tagsSets: tagsSets.slice(0, 2),
    descriptions: result.descriptions.slice(0, 2)
  };
}

/**
 * Enregistre une notation pour une génération
 */
export async function rateGeneration(
  userId: number,
  type: "video_ideas" | "post_production",
  model: string,
  rating: number
): Promise<void> {
  // Pour l'instant, on log simplement la notation
  // Plus tard, on pourra l'enregistrer en base pour améliorer les modèles
  console.log(`[Brainstorm] User ${userId} rated ${type} with model ${model}: ${rating}`);
}
