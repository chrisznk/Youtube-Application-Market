import { getDb } from "./db";
import { testVariants, videos, instructionScripts } from "../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { fetchChannelTitles } from "./channelTitles";

type TrainableScriptType = "title_guide" | "thumbnail_mechanics" | "midjourney_prompts";
type ModelType = "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini" | "gpt-5" | "gpt-5-pro";

interface TrainScriptParams {
  userId: number;
  scriptType: TrainableScriptType;
  model: ModelType;
  channelId?: string;
}

/**
 * Récupère tous les A/B tests de l'utilisateur depuis 1 an
 */
async function getAllUserABTests(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "Aucun A/B test disponible";

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const variants = await db
    .select()
    .from(testVariants)
    .where(
      and(
        eq(testVariants.userId, userId),
        gte(testVariants.createdAt, oneYearAgo)
      )
    )
    .orderBy(desc(testVariants.createdAt));

  if (variants.length === 0) {
    return "Aucun A/B test disponible";
  }

  // Formater les résultats des A/B tests
  const formattedTests = variants.map((v, idx) => {
    const metrics = [];
    if (v.views) metrics.push(`Vues: ${v.views}`);
    if (v.watchTimePercentage) metrics.push(`Répartition Watch Time: ${v.watchTimePercentage}%`);
    if (v.likes) metrics.push(`Likes: ${v.likes}`);
    if (v.comments) metrics.push(`Commentaires: ${v.comments}`);
    if (v.watchTimeMinutes) metrics.push(`Watch Time: ${v.watchTimeMinutes} min`);
    
    return `Test #${idx + 1}:
- Titre: ${v.title || "N/A"}
- Contrôle: ${v.isControl ? "Oui" : "Non"}
- Métriques: ${metrics.length > 0 ? metrics.join(", ") : "N/A"}
- Date: ${v.createdAt ? new Date(v.createdAt).toLocaleDateString("fr-FR") : "N/A"}`;
  });

  return formattedTests.join("\n\n");
}

/**
 * Récupère le script actuel de l'utilisateur
 */
async function getCurrentScript(userId: number, scriptType: TrainableScriptType): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const scripts = await db
    .select()
    .from(instructionScripts)
    .where(
      and(
        eq(instructionScripts.userId, userId),
        eq(instructionScripts.scriptType, scriptType)
      )
    )
    .orderBy(desc(instructionScripts.version))
    .limit(1);

  return scripts[0]?.content || null;
}

/**
 * Génère le prompt d'entraînement selon le type de script
 */
function generateTrainingPrompt(
  scriptType: TrainableScriptType,
  currentScript: string,
  abTestsReport: string,
  channelTitles: string
): string {
  const scriptTypeLabels: Record<TrainableScriptType, string> = {
    title_guide: "guide de création de titres YouTube",
    thumbnail_mechanics: "guide des mécaniques de miniatures",
    midjourney_prompts: "guide de création de prompts Midjourney pour les miniatures",
  };

  return `Tu es un expert en optimisation de contenu YouTube. Tu dois mettre à jour un ${scriptTypeLabels[scriptType]} en te basant sur les données réelles d'A/B testing et les titres actuels de la chaîne.

## SCRIPT ACTUEL À AMÉLIORER
${currentScript}

## DONNÉES D'A/B TESTING (dernière année)
${abTestsReport}

## TITRES ACTUELS DE LA CHAÎNE (dernière année)
Ces titres représentent ce qui fonctionne actuellement sur la chaîne. Ils reflètent les tendances actuelles et les patterns qui génèrent de l'engagement.
${channelTitles}

## INSTRUCTIONS IMPORTANTES

1. **OBJECTIF** : Mettre à jour le script en y incorporant :
   - Les nouveaux patterns gagnants découverts dans les A/B tests
   - Les schémas qui fonctionnent dans les titres actuels de la chaîne
   - Les tendances actuelles observées

2. **RÈGLES STRICTES** :
   - Le script mis à jour doit faire APPROXIMATIVEMENT LA MÊME LONGUEUR que l'original (±20%)
   - Ne pas perdre d'informations utiles qui restent valides
   - Supprimer uniquement les règles qui sont clairement obsolètes ou contredites par les données
   - Ajouter les nouveaux patterns découverts de manière concise
   - Garder le même format et la même structure que l'original

3. **ANALYSE À EFFECTUER** :
   - Identifier les patterns récurrents dans les titres/miniatures qui performent bien
   - Repérer les formulations, mots-clés ou structures qui génèrent un bon CTR
   - Noter les tendances actuelles (mots à la mode, formats populaires)
   - Détecter les règles du script actuel qui ne sont plus validées par les données

4. **FORMAT DE SORTIE** :
   Retourne UNIQUEMENT le script mis à jour, sans commentaires ni explications.
   Le script doit être prêt à être utilisé tel quel.

Génère maintenant le script mis à jour :`;
}

/**
 * Entraîne un script d'instruction en analysant les A/B tests et les titres actuels
 */
export async function trainScript(params: TrainScriptParams): Promise<string> {
  const { userId, scriptType, model, channelId } = params;

  // 1. Récupérer le script actuel
  const currentScript = await getCurrentScript(userId, scriptType);
  if (!currentScript) {
    throw new Error("Aucun script existant à entraîner. Veuillez d'abord publier une version.");
  }

  // 2. Récupérer tous les A/B tests
  const abTestsReport = await getAllUserABTests(userId);

  // 3. Récupérer les titres actuels de la chaîne (si channelId fourni)
  let channelTitles = "Aucun ID de chaîne fourni - les titres actuels ne seront pas analysés.";
  if (channelId) {
    try {
      const titles = await fetchChannelTitles(channelId);
      if (titles.length > 0) {
        channelTitles = titles.map((t, idx) => `${idx + 1}. ${t.title} (${t.publishedAt})`).join("\n");
      } else {
        channelTitles = "Aucun titre trouvé pour cette chaîne.";
      }
    } catch (error) {
      console.error("[ScriptTraining] Error fetching channel titles:", error);
      channelTitles = "Erreur lors de la récupération des titres de la chaîne.";
    }
  }

  // 4. Générer le prompt d'entraînement
  const prompt = generateTrainingPrompt(scriptType, currentScript, abTestsReport, channelTitles);

  // 5. Appeler le LLM
  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    // Note: Le modèle est géré par le système, on ne peut pas le changer dynamiquement
  });

  const trainedContent = response.choices[0]?.message?.content;
  if (!trainedContent) {
    throw new Error("Le modèle n'a pas généré de contenu.");
  }

  // S'assurer que le contenu est une string
  if (typeof trainedContent !== 'string') {
    throw new Error("Le modèle a retourné un format de contenu inattendu.");
  }

  return trainedContent;
}
