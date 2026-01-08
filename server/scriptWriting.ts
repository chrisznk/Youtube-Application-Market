import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { videos, videoStats, instructionScripts, coordinationScripts } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export interface ChannelVideoExport {
  youtubeId: string;
  title: string;
  description: string | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: Date | null;
  duration: string | null;
  thumbnail: string | null;
}

export interface ChannelExportData {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageViews: number;
  videos: ChannelVideoExport[];
}

/**
 * Get all videos from a user's channel with stats for export
 */
export async function getChannelVideosForExport(userId: number): Promise<ChannelExportData> {
  const db = await getDb();
  if (!db) {
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      averageViews: 0,
      videos: [],
    };
  }

  // Get all videos with their latest stats
  const allVideos = await db
    .select({
      youtubeId: videos.youtubeId,
      title: videos.title,
      description: videos.description,
      publishedAt: videos.publishedAt,
      duration: videos.duration,
      thumbnail: videos.thumbnailUrl,
      views: videos.viewCount,
      likes: videos.likeCount,
      comments: videos.commentCount,
    })
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.publishedAt));

  const videoExports: ChannelVideoExport[] = allVideos.map(v => ({
    youtubeId: v.youtubeId,
    title: v.title,
    description: v.description,
    views: v.views || 0,
    likes: v.likes || 0,
    comments: v.comments || 0,
    publishedAt: v.publishedAt,
    duration: v.duration,
    thumbnail: v.thumbnail,
  }));

  const totalViews = videoExports.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videoExports.reduce((sum, v) => sum + v.likes, 0);
  const totalComments = videoExports.reduce((sum, v) => sum + v.comments, 0);

  return {
    totalVideos: videoExports.length,
    totalViews,
    totalLikes,
    totalComments,
    averageViews: videoExports.length > 0 ? Math.round(totalViews / videoExports.length) : 0,
    videos: videoExports,
  };
}

/**
 * Format channel videos for CSV export
 */
export function formatVideosAsCSV(data: ChannelExportData): string {
  const headers = ["YouTube ID", "Titre", "Description", "Vues", "Likes", "Commentaires", "Date de publication", "Durée"];
  const rows = data.videos.map(v => [
    v.youtubeId,
    `"${(v.title || '').replace(/"/g, '""')}"`,
    `"${(v.description || '').replace(/"/g, '""').substring(0, 500)}"`,
    v.views.toString(),
    v.likes.toString(),
    v.comments.toString(),
    v.publishedAt ? new Date(v.publishedAt).toISOString().split('T')[0] : '',
    v.duration || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Format channel videos for display in prompts
 */
export function formatVideosForPrompt(data: ChannelExportData): string {
  const lines = data.videos.slice(0, 50).map((v, i) => {
    return `${i + 1}. "${v.title}" - ${v.views.toLocaleString('fr-FR')} vues, ${v.likes.toLocaleString('fr-FR')} likes`;
  });

  return `## STATISTIQUES DE LA CHAÎNE
- Total vidéos: ${data.totalVideos}
- Total vues: ${data.totalViews.toLocaleString('fr-FR')}
- Moyenne vues/vidéo: ${data.averageViews.toLocaleString('fr-FR')}

## TOP 50 VIDÉOS (par date)
${lines.join('\n')}`;
}

// Default script coordination prompt for 5000-6000 word scripts
export const DEFAULT_SCRIPT_COORDINATION_PROMPT = `# SCRIPT DE COORDINATION - ÉCRITURE DE SCRIPT YOUTUBE (5000-6000 MOTS)

Tu es un expert en écriture de scripts YouTube. Tu vas créer un script complet et engageant de 5000 à 6000 mots.

## CONTEXTE DE LA CHAÎNE
<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>

## GUIDE DES TITRES
<<<GUIDE_TITRE>>>

## GUIDE D'ÉCRITURE DE SCRIPTS
<<<GUIDE_META_AB_TEST>>>

## DONNÉES DE LA CHAÎNE
{{channel_videos_data}}

## SUJET DU SCRIPT
{{script_topic}}

## INSTRUCTIONS PERSONNALISÉES
{{custom_instructions}}

---

# STRUCTURE DU SCRIPT (5000-6000 mots)

## PHASE 1: ACCROCHE (300-500 mots)
L'accroche doit captiver immédiatement. Utilise une des techniques suivantes:
- Question provocante qui remet en question une croyance
- Statistique choquante ou contre-intuitive
- Histoire personnelle ou anecdote captivante
- Promesse de valeur claire et spécifique
- Teaser du contenu le plus impactant

## PHASE 2: CONTEXTE ET ENJEUX (500-800 mots)
- Explique pourquoi ce sujet est important maintenant
- Présente les enjeux pour le spectateur
- Établis ta crédibilité sur le sujet
- Crée un sentiment d'urgence ou de curiosité

## PHASE 3: DÉVELOPPEMENT PRINCIPAL (3000-3500 mots)
Divise en 3-5 sections principales avec:
- Des sous-titres clairs et engageants
- Des exemples concrets et des études de cas
- Des transitions fluides entre les sections
- Des moments de récapitulation
- Des "pattern interrupts" pour maintenir l'attention

## PHASE 4: CLIMAX ET RÉVÉLATION (500-700 mots)
- Le moment le plus impactant du script
- La révélation principale ou l'insight clé
- L'application pratique immédiate

## PHASE 5: CONCLUSION ET CALL-TO-ACTION (300-500 mots)
- Récapitulation des points clés
- Call-to-action clair (like, subscribe, commentaire)
- Teaser pour la prochaine vidéo
- Fin mémorable

---

# RÈGLES D'ÉCRITURE

1. **Langage conversationnel**: Écris comme tu parles, utilise "tu" et "je"
2. **Phrases courtes**: Maximum 20 mots par phrase en moyenne
3. **Paragraphes courts**: 2-3 phrases maximum
4. **Mots de transition**: "Mais", "Et", "Donc", "Parce que", "En fait"
5. **Questions rhétoriques**: Engage le spectateur régulièrement
6. **Répétition stratégique**: Répète les concepts clés 3 fois
7. **Storytelling**: Intègre des histoires et anecdotes
8. **Données et preuves**: Appuie tes arguments avec des faits
9. **Humour dosé**: Ajoute de l'humour quand approprié
10. **Émotion**: Fais ressentir quelque chose au spectateur

---

# FORMAT DE SORTIE

Génère le script complet avec:
- [ACCROCHE] pour marquer le début de l'accroche
- [CONTEXTE] pour le contexte
- [SECTION 1], [SECTION 2], etc. pour les sections principales
- [CLIMAX] pour le climax
- [CONCLUSION] pour la conclusion
- [CTA] pour le call-to-action

Inclus également:
- Des indications de ton entre parenthèses (enthousiaste), (sérieux), (humoristique)
- Des pauses suggérées avec [PAUSE]
- Des moments de B-roll suggérés avec [B-ROLL: description]

---

GÉNÈRE MAINTENANT LE SCRIPT COMPLET:`;

/**
 * Get all instruction scripts for a user
 */
export async function getAllInstructionScripts(userId: number) {
  const db = await getDb();
  if (!db) return {};

  const scriptTypes = [
    "channel_analysis",
    "title_guide", 
    "description_guide",
    "script_analysis",
    "thumbnail_mechanics",
    "midjourney_prompts"
  ] as const;

  const scripts: Record<string, string> = {};

  for (const scriptType of scriptTypes) {
    const result = await db
      .select()
      .from(instructionScripts)
      .where(
        and(
          eq(instructionScripts.userId, userId),
          eq(instructionScripts.scriptType, scriptType),
          eq(instructionScripts.isActive, true)
        )
      )
      .orderBy(desc(instructionScripts.version))
      .limit(1);

    if (result.length > 0) {
      scripts[scriptType] = result[0].content;
    }
  }

  return scripts;
}

export interface ScriptGenerationInput {
  topic: string;
  customInstructions?: string;
  model?: "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini" | "gpt-5" | "gpt-5-pro";
  coordinationPrompt?: string;
}

/**
 * Generate a full YouTube script using the coordination prompt
 */
export async function generateFullScript(
  userId: number,
  input: ScriptGenerationInput
): Promise<{ script: string; wordCount: number; sections: string[] }> {
  // Get all instruction scripts
  const instructionScriptsData = await getAllInstructionScripts(userId);
  
  // Get channel videos data
  const channelData = await getChannelVideosForExport(userId);
  const channelVideosFormatted = formatVideosForPrompt(channelData);

  // Use custom coordination prompt or default
  let prompt = input.coordinationPrompt || DEFAULT_SCRIPT_COORDINATION_PROMPT;

  // Replace guide tags
  prompt = prompt.replaceAll('<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>', instructionScriptsData.channel_analysis || 'Guide non disponible');
  prompt = prompt.replaceAll('<<<GUIDE_TITRE>>>', instructionScriptsData.title_guide || 'Guide non disponible');
  prompt = prompt.replaceAll('<<<GUIDE_META_AB_TEST>>>', instructionScriptsData.script_analysis || 'Guide non disponible');
  prompt = prompt.replaceAll('<<<GUIDE_MINIATURES>>>', instructionScriptsData.thumbnail_mechanics || 'Guide non disponible');
  prompt = prompt.replaceAll('<<<GUIDE_PROMPTS_MIDJOURNEY>>>', instructionScriptsData.midjourney_prompts || 'Guide non disponible');
  prompt = prompt.replaceAll('<<<GUIDE_DESCRIPTION>>>', instructionScriptsData.description_guide || 'Guide non disponible');

  // Replace dynamic tags
  prompt = prompt.replaceAll('{{channel_videos_data}}', channelVideosFormatted);
  prompt = prompt.replaceAll('{{script_topic}}', input.topic);
  prompt = prompt.replaceAll('{{custom_instructions}}', input.customInstructions || 'Aucune instruction supplémentaire');

  // Generate script using LLM
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en écriture de scripts YouTube. Tu génères des scripts complets, engageants et optimisés pour la rétention d'audience. Écris toujours en français."
      },
      {
        role: "user",
        content: prompt
      }
    ],
  });

  const messageContent = response.choices[0]?.message?.content;
  const script = typeof messageContent === 'string' ? messageContent : '';
  
  // Count words
  const wordCount = script.split(/\s+/).filter(word => word.length > 0).length;

  // Extract sections
  const sectionRegex = /\[(ACCROCHE|CONTEXTE|SECTION \d+|CLIMAX|CONCLUSION|CTA)\]/g;
  const sections: string[] = [];
  let match;
  while ((match = sectionRegex.exec(script)) !== null) {
    sections.push(match[1]);
  }

  return {
    script,
    wordCount,
    sections: sections.length > 0 ? sections : ['Script généré sans sections marquées'],
  };
}

/**
 * Get or create the script writing coordination prompt for a user
 */
export async function getScriptWritingCoordinationPrompt(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return DEFAULT_SCRIPT_COORDINATION_PROMPT;

  const result = await db
    .select()
    .from(coordinationScripts)
    .where(
      and(
        eq(coordinationScripts.userId, userId),
        eq(coordinationScripts.scriptType, 'strategy_generation')
      )
    )
    .limit(1);

  if (result.length > 0) {
    return result[0].content;
  }

  return DEFAULT_SCRIPT_COORDINATION_PROMPT;
}

/**
 * Save the script writing coordination prompt for a user
 */
export async function saveScriptWritingCoordinationPrompt(
  userId: number,
  content: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if exists
  const existing = await db
    .select()
    .from(coordinationScripts)
    .where(
      and(
        eq(coordinationScripts.userId, userId),
        eq(coordinationScripts.scriptType, 'strategy_generation')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(coordinationScripts)
      .set({ content, createdAt: new Date() })
      .where(
        and(
          eq(coordinationScripts.userId, userId),
          eq(coordinationScripts.scriptType, 'strategy_generation')
        )
      );
  } else {
    await db.insert(coordinationScripts).values({
      userId,
      scriptType: 'script_writing' as any,
      version: 1,
      content,
    });
  }
}
