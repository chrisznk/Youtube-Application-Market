import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { scriptProfiles, scriptCorrections, scriptHistory, scriptProfileVersions } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { getAllInstructionScripts, getChannelVideosForExport, formatVideosForPrompt } from "./scriptWriting";

// ============ Script Profiles (Méta-Prompts) ============

export const DEFAULT_META_PROMPT = `# MON STYLE D'ÉCRITURE

## TON ET VOIX
- Ton conversationnel et accessible
- Utiliser "tu" pour créer de la proximité
- Éviter le jargon technique sans explication
- Injecter de l'humour quand approprié

## STRUCTURE PRÉFÉRÉE
- Accroche percutante dans les 30 premières secondes
- Transitions fluides entre les sections
- Récapitulations régulières pour ancrer les concepts
- Conclusion avec call-to-action clair

## LONGUEUR ET RYTHME
- Phrases courtes (max 20 mots en moyenne)
- Paragraphes de 2-3 phrases maximum
- Alterner entre information et storytelling
- Pauses stratégiques pour l'impact

## CE QUE J'ÉVITE
- Les introductions trop longues
- Les listes à rallonge sans contexte
- Le ton professoral ou condescendant
- Les promesses non tenues dans le script

## CE QUE JE PRIVILÉGIE
- Les exemples concrets et relatable
- Les anecdotes personnelles
- Les données chiffrées pour crédibiliser
- Les questions rhétoriques pour engager`;

export interface ScriptProfile {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  metaPrompt: string;
  tags: string[] | null;
  isDefault: boolean;
  usageCount: number | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all script profiles for a user
 */
export async function getScriptProfiles(userId: number): Promise<ScriptProfile[]> {
  const db = await getDb();
  if (!db) return [];

  const profiles = await db
    .select()
    .from(scriptProfiles)
    .where(eq(scriptProfiles.userId, userId))
    .orderBy(desc(scriptProfiles.isDefault), desc(scriptProfiles.lastUsedAt));

  return profiles;
}

/**
 * Get the default profile for a user, or create one if none exists
 */
export async function getDefaultProfile(userId: number): Promise<ScriptProfile | null> {
  const db = await getDb();
  if (!db) return null;

  // Try to get existing default profile
  const existing = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.userId, userId), eq(scriptProfiles.isDefault, true)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default profile if none exists
  await db.insert(scriptProfiles).values({
    userId,
    name: "Mon Style par Défaut",
    description: "Profil de base pour l'écriture de scripts",
    metaPrompt: DEFAULT_META_PROMPT,
    isDefault: true,
  });

  const newProfile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.userId, userId), eq(scriptProfiles.isDefault, true)))
    .limit(1);

  return newProfile[0] || null;
}

/**
 * Create a new script profile
 */
export async function createScriptProfile(
  userId: number,
  name: string,
  metaPrompt: string,
  description?: string
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scriptProfiles).values({
    userId,
    name,
    description: description || null,
    metaPrompt,
    isDefault: false,
  });

  return { id: Number(result[0].insertId) };
}

/**
 * Update a script profile with automatic version save
 */
export async function updateScriptProfile(
  profileId: number,
  userId: number,
  updates: { name?: string; description?: string; metaPrompt?: string },
  autoSaveVersion: boolean = true
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current profile state before update for auto-versioning
  if (autoSaveVersion && updates.metaPrompt) {
    const currentProfile = await db
      .select()
      .from(scriptProfiles)
      .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
      .limit(1);

    if (currentProfile.length > 0) {
      const profile = currentProfile[0];
      // Only save version if metaPrompt actually changed
      if (profile.metaPrompt !== updates.metaPrompt) {
        await saveProfileVersion(
          userId,
          profileId,
          "Sauvegarde automatique avant modification"
        );
      }
    }
  }

  await db
    .update(scriptProfiles)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)));
}

/**
 * Set a profile as default (and unset others)
 */
export async function setDefaultProfile(profileId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Unset all defaults for this user
  await db
    .update(scriptProfiles)
    .set({ isDefault: false })
    .where(eq(scriptProfiles.userId, userId));

  // Set the new default
  await db
    .update(scriptProfiles)
    .set({ isDefault: true })
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)));
}

/**
 * Delete a script profile
 */
export async function deleteScriptProfile(profileId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Don't allow deleting the default profile
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length > 0 && profile[0].isDefault) {
    throw new Error("Impossible de supprimer le profil par défaut");
  }

  await db
    .delete(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)));
}

// ============ Script Corrections (Carnet de Corrections) ============

export type CorrectionCategory = "structure" | "tone" | "length" | "transitions" | "examples" | "engagement" | "cta" | "other";

export interface ScriptCorrection {
  id: number;
  userId: number;
  problem: string;
  correction: string;
  category: CorrectionCategory;
  isActive: boolean;
  appliedCount: number | null;
  createdAt: Date;
}

/**
 * Get all corrections for a user
 */
export async function getScriptCorrections(userId: number, activeOnly = true): Promise<ScriptCorrection[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(scriptCorrections)
    .where(eq(scriptCorrections.userId, userId));

  if (activeOnly) {
    query = db
      .select()
      .from(scriptCorrections)
      .where(and(eq(scriptCorrections.userId, userId), eq(scriptCorrections.isActive, true)));
  }

  const corrections = await query.orderBy(desc(scriptCorrections.createdAt));
  return corrections;
}

/**
 * Add a new correction from user feedback
 */
export async function addScriptCorrection(
  userId: number,
  problem: string,
  correction: string,
  category: CorrectionCategory = "other"
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scriptCorrections).values({
    userId,
    problem,
    correction,
    category,
    isActive: true,
  });

  return { id: Number(result[0].insertId) };
}

/**
 * Generate a correction rule from user feedback using AI
 */
export async function generateCorrectionFromFeedback(
  problem: string,
  model: "gpt-4o" | "gpt-4o-mini" = "gpt-4o"
): Promise<{ correction: string; category: CorrectionCategory }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en écriture de scripts YouTube. L'utilisateur te signale un problème dans un script généré. 
Tu dois transformer ce feedback en une RÈGLE CORRECTIVE claire et actionnable qui sera appliquée aux futures générations.

Réponds UNIQUEMENT en JSON avec ce format:
{
  "correction": "La règle corrective à appliquer (instruction claire et précise)",
  "category": "une des catégories: structure, tone, length, transitions, examples, engagement, cta, other"
}`,
      },
      {
        role: "user",
        content: `Problème signalé par l'utilisateur: "${problem}"

Génère une règle corrective durable pour éviter ce problème à l'avenir.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : '';
  
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        correction: parsed.correction || problem,
        category: parsed.category || "other",
      };
    }
  } catch {
    // Fallback if parsing fails
  }

  return {
    correction: `Éviter: ${problem}`,
    category: "other",
  };
}

/**
 * Toggle a correction's active status
 */
export async function toggleCorrectionActive(correctionId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(scriptCorrections)
    .where(and(eq(scriptCorrections.id, correctionId), eq(scriptCorrections.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(scriptCorrections)
      .set({ isActive: !existing[0].isActive })
      .where(eq(scriptCorrections.id, correctionId));
  }
}

/**
 * Delete a correction
 */
export async function deleteScriptCorrection(correctionId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(scriptCorrections)
    .where(and(eq(scriptCorrections.id, correctionId), eq(scriptCorrections.userId, userId)));
}

/**
 * Increment the applied count for corrections
 */
async function incrementCorrectionCounts(correctionIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db || correctionIds.length === 0) return;

  for (const id of correctionIds) {
    await db
      .update(scriptCorrections)
      .set({ appliedCount: db.select().from(scriptCorrections).where(eq(scriptCorrections.id, id)).then(r => (r[0]?.appliedCount || 0) + 1) as any })
      .where(eq(scriptCorrections.id, id));
  }
}

// ============ Script History ============

export interface ScriptHistoryEntry {
  id: number;
  userId: number;
  profileId: number | null;
  topic: string;
  customInstructions: string | null;
  generatedScript: string;
  wordCount: number | null;
  model: string;
  rating: number | null;
  feedback: string | null;
  createdAt: Date;
}

/**
 * Get script history for a user
 */
export async function getScriptHistory(userId: number, limit = 20): Promise<ScriptHistoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const history = await db
    .select()
    .from(scriptHistory)
    .where(eq(scriptHistory.userId, userId))
    .orderBy(desc(scriptHistory.createdAt))
    .limit(limit);

  return history;
}

/**
 * Save a generated script to history
 */
export async function saveScriptToHistory(
  userId: number,
  topic: string,
  generatedScript: string,
  wordCount: number,
  model: string,
  profileId?: number,
  customInstructions?: string
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scriptHistory).values({
    userId,
    profileId: profileId || null,
    topic,
    customInstructions: customInstructions || null,
    generatedScript,
    wordCount,
    model,
  });

  return { id: Number(result[0].insertId) };
}

/**
 * Rate a script in history
 */
export async function rateScript(
  historyId: number,
  userId: number,
  rating: -1 | 0 | 1,
  feedback?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scriptHistory)
    .set({ rating, feedback: feedback || null })
    .where(and(eq(scriptHistory.id, historyId), eq(scriptHistory.userId, userId)));
}

// ============ Enhanced Script Generation ============

/**
 * Build the complete prompt with profile, corrections, and guides
 */
export async function buildEnhancedScriptPrompt(
  userId: number,
  topic: string,
  customInstructions?: string,
  profileId?: number
): Promise<{ prompt: string; profileUsed: ScriptProfile | null; correctionsApplied: ScriptCorrection[] }> {
  // Get profile (use specified or default)
  let profile: ScriptProfile | null = null;
  
  if (profileId) {
    const db = await getDb();
    if (db) {
      const profiles = await db
        .select()
        .from(scriptProfiles)
        .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
        .limit(1);
      profile = profiles[0] || null;
    }
  }
  
  if (!profile) {
    profile = await getDefaultProfile(userId);
  }

  // Get active corrections
  const corrections = await getScriptCorrections(userId, true);

  // Get instruction scripts
  const instructionScriptsData = await getAllInstructionScripts(userId);

  // Get channel data
  const channelData = await getChannelVideosForExport(userId);
  const channelVideosFormatted = formatVideosForPrompt(channelData);

  // Build corrections section
  const correctionsSection = corrections.length > 0
    ? `## RÈGLES CORRECTIVES DURABLES (À RESPECTER IMPÉRATIVEMENT)
${corrections.map((c, i) => `${i + 1}. [${c.category.toUpperCase()}] ${c.correction}`).join('\n')}`
    : '';

  // Build the complete prompt
  const prompt = `# GÉNÉRATION DE SCRIPT YOUTUBE (5000-6000 MOTS)

## MON MÉTA-PROMPT PERSONNEL
${profile?.metaPrompt || DEFAULT_META_PROMPT}

${correctionsSection}

## CONTEXTE DE LA CHAÎNE
${instructionScriptsData.channel_analysis || 'Non disponible'}

## GUIDE DES TITRES
${instructionScriptsData.title_guide || 'Non disponible'}

## GUIDE D'ÉCRITURE DE SCRIPTS
${instructionScriptsData.script_analysis || 'Non disponible'}

## DONNÉES DE LA CHAÎNE
${channelVideosFormatted}

## SUJET DU SCRIPT
${topic}

## INSTRUCTIONS PERSONNALISÉES
${customInstructions || 'Aucune instruction supplémentaire'}

---

# STRUCTURE DU SCRIPT (5000-6000 mots)

## PHASE 1: ACCROCHE (300-500 mots)
L'accroche doit captiver immédiatement selon mon style personnel.

## PHASE 2: CONTEXTE ET ENJEUX (500-800 mots)
Établir le contexte et créer l'urgence.

## PHASE 3: DÉVELOPPEMENT PRINCIPAL (3000-3500 mots)
Le cœur du contenu, structuré en sections claires.

## PHASE 4: CLIMAX ET RÉVÉLATION (500-700 mots)
Le moment le plus impactant du script.

## PHASE 5: CONCLUSION ET CALL-TO-ACTION (300-500 mots)
Récapitulation et appel à l'action.

---

GÉNÈRE MAINTENANT LE SCRIPT COMPLET EN RESPECTANT MON STYLE ET LES RÈGLES CORRECTIVES:`;

  return {
    prompt,
    profileUsed: profile,
    correctionsApplied: corrections,
  };
}

/**
 * Generate a script with the enhanced system
 */
export async function generateEnhancedScript(
  userId: number,
  topic: string,
  model: "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini" | "gpt-5" | "gpt-5-pro" = "gpt-4o",
  customInstructions?: string,
  profileId?: number
): Promise<{
  script: string;
  wordCount: number;
  sections: string[];
  historyId: number;
  profileUsed: ScriptProfile | null;
  correctionsApplied: number;
}> {
  // Build the enhanced prompt
  const { prompt, profileUsed, correctionsApplied } = await buildEnhancedScriptPrompt(
    userId,
    topic,
    customInstructions,
    profileId
  );

  // Generate script
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en écriture de scripts YouTube. Tu génères des scripts complets, engageants et optimisés pour la rétention d'audience. Écris toujours en français. Respecte scrupuleusement le méta-prompt personnel et les règles correctives de l'utilisateur.",
      },
      {
        role: "user",
        content: prompt,
      },
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

  // Update profile usage
  if (profileUsed) {
    const db = await getDb();
    if (db) {
      await db
        .update(scriptProfiles)
        .set({ 
          usageCount: (profileUsed.usageCount || 0) + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(scriptProfiles.id, profileUsed.id));
    }
  }

  // Save to history
  const { id: historyId } = await saveScriptToHistory(
    userId,
    topic,
    script,
    wordCount,
    model,
    profileUsed?.id,
    customInstructions
  );

  return {
    script,
    wordCount,
    sections: sections.length > 0 ? sections : ['Script généré'],
    historyId,
    profileUsed,
    correctionsApplied: correctionsApplied.length,
  };
}


// ============ Profile Templates ============

export const PROFILE_TEMPLATES = {
  educatif: {
    name: "Éducatif",
    description: "Pour les tutoriels, formations et vidéos explicatives",
    metaPrompt: `# STYLE ÉDUCATIF

## TON ET VOIX
- Ton pédagogue et bienveillant
- Utiliser "tu" pour créer de la proximité avec l'apprenant
- Expliquer chaque concept technique avec des analogies simples
- Encourager et valoriser la progression

## STRUCTURE PRÉFÉRÉE
- Introduction qui pose le problème à résoudre
- Annonce claire du plan (3-5 points maximum)
- Progression logique du simple au complexe
- Récapitulations après chaque section importante
- Exercice pratique ou mise en application à la fin

## LONGUEUR ET RYTHME
- Phrases courtes et claires (max 15 mots en moyenne)
- Un concept par paragraphe
- Pauses régulières pour laisser assimiler
- Répétition des points clés sous différentes formes

## CE QUE J'ÉVITE
- Le jargon non expliqué
- Les digressions hors sujet
- Aller trop vite sur les fondamentaux
- Supposer que l'audience connaît les prérequis

## CE QUE JE PRIVILÉGIE
- Les exemples concrets et reproductibles
- Les schémas mentaux et frameworks
- Les erreurs courantes à éviter
- Les astuces de pro et raccourcis`,
  },

  storytelling: {
    name: "Storytelling",
    description: "Pour les vidéos narratives, histoires et documentaires",
    metaPrompt: `# STYLE STORYTELLING

## TON ET VOIX
- Ton narratif et immersif
- Créer une connexion émotionnelle avec l'audience
- Utiliser le présent de narration pour l'immersion
- Varier le rythme selon l'intensité dramatique

## STRUCTURE PRÉFÉRÉE
- Accroche mystérieuse ou choquante (in medias res)
- Présentation du protagoniste et de ses enjeux
- Montée en tension progressive
- Retournements de situation et révélations
- Climax émotionnel
- Résolution et leçon à retenir

## LONGUEUR ET RYTHME
- Phrases variées selon l'émotion (courtes pour tension, longues pour contemplation)
- Cliffhangers avant les transitions
- Moments de respiration entre les pics d'intensité
- Descriptions sensorielles pour l'immersion

## CE QUE J'ÉVITE
- Les explications qui cassent le rythme narratif
- Les spoilers trop précoces
- Les personnages sans profondeur
- Les transitions abruptes

## CE QUE JE PRIVILÉGIE
- Les détails qui rendent l'histoire vivante
- Les dialogues reconstitués
- Les parallèles avec l'expérience du spectateur
- Les twists bien amenés`,
  },

  polemique: {
    name: "Polémique",
    description: "Pour les vidéos d'opinion, débats et analyses critiques",
    metaPrompt: `# STYLE POLÉMIQUE

## TON ET VOIX
- Ton affirmé et provocateur (sans être agressif)
- Assumer ses opinions avec conviction
- Interpeller directement l'audience
- Utiliser l'ironie et le sarcasme avec parcimonie

## STRUCTURE PRÉFÉRÉE
- Accroche provocante qui pose la thèse
- Présentation du consensus à déconstruire
- Arguments principaux avec preuves
- Anticipation et réfutation des contre-arguments
- Appel à l'action ou à la réflexion

## LONGUEUR ET RYTHME
- Phrases percutantes et mémorables
- Alternance entre argumentation et punchlines
- Montée en puissance vers la conclusion
- Pauses rhétoriques pour l'impact

## CE QUE J'ÉVITE
- Les attaques ad hominem
- Les généralisations abusives
- Ignorer les arguments adverses valides
- Le ton moralisateur ou condescendant

## CE QUE JE PRIVILÉGIE
- Les données et sources vérifiables
- Les exemples concrets qui illustrent la thèse
- Les questions rhétoriques qui font réfléchir
- Les formules choc qui restent en mémoire`,
  },

  investigation: {
    name: "Investigation",
    description: "Pour les enquêtes, révélations et analyses approfondies",
    metaPrompt: `# STYLE INVESTIGATION

## TON ET VOIX
- Ton journalistique et factuel
- Objectivité apparente avec angle éditorial subtil
- Créer le suspense autour des découvertes
- Crédibilité et sérieux dans le traitement

## STRUCTURE PRÉFÉRÉE
- Accroche qui pose l'énigme ou le scandale
- Contexte et enjeux de l'enquête
- Présentation méthodique des indices
- Témoignages et sources multiples
- Révélation progressive de la vérité
- Implications et suites possibles

## LONGUEUR ET RYTHME
- Précision dans les faits et les dates
- Alternance entre narration et analyse
- Moments de tension avant les révélations
- Récapitulations pour ne pas perdre l'audience

## CE QUE J'ÉVITE
- Les accusations sans preuves
- Les raccourcis dans le raisonnement
- Négliger le contexte
- Les conclusions hâtives

## CE QUE JE PRIVILÉGIE
- Les sources primaires et documents
- La chronologie précise des événements
- Les connexions entre les acteurs
- Les implications systémiques`,
  },

  divertissement: {
    name: "Divertissement",
    description: "Pour les vidéos légères, humour et contenu viral",
    metaPrompt: `# STYLE DIVERTISSEMENT

## TON ET VOIX
- Ton léger et énergique
- Humour omniprésent (autodérision, absurde, références pop)
- Complicité avec l'audience
- Spontanéité et authenticité

## STRUCTURE PRÉFÉRÉE
- Accroche fun qui donne le ton
- Enchaînement rapide de segments
- Running gags et callbacks
- Moments de surprise et d'inattendu
- Conclusion mémorable ou twist final

## LONGUEUR ET RYTHME
- Phrases courtes et punchy
- Rythme soutenu sans temps mort
- Variations de ton pour surprendre
- Pauses comiques bien placées

## CE QUE J'ÉVITE
- Les longueurs et les explications
- L'humour qui tombe à plat
- Prendre le sujet trop au sérieux
- Les transitions molles

## CE QUE JE PRIVILÉGIE
- Les punchlines et one-liners
- Les références à la culture internet
- L'interaction avec les commentaires/communauté
- Les moments "quotables" et partageables`,
  },
};

export type ProfileTemplateKey = keyof typeof PROFILE_TEMPLATES;

/**
 * Get all available profile templates
 */
export function getProfileTemplates(): Array<{
  key: ProfileTemplateKey;
  name: string;
  description: string;
  preview: string;
}> {
  return Object.entries(PROFILE_TEMPLATES).map(([key, template]) => ({
    key: key as ProfileTemplateKey,
    name: template.name,
    description: template.description,
    preview: template.metaPrompt.slice(0, 200) + '...',
  }));
}

/**
 * Create a profile from a template
 */
export async function createProfileFromTemplate(
  userId: number,
  templateKey: ProfileTemplateKey,
  customName?: string
): Promise<{ id: number }> {
  const template = PROFILE_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template "${templateKey}" not found`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scriptProfiles).values({
    userId,
    name: customName || template.name,
    description: template.description,
    metaPrompt: template.metaPrompt,
    isDefault: false,
  });

  return { id: Number(result[0].insertId) };
}

// ============ Export/Import ============

export interface ExportData {
  version: string;
  exportedAt: string;
  profiles: Array<{
    name: string;
    description: string | null;
    metaPrompt: string;
    isDefault: boolean;
  }>;
  corrections: Array<{
    problem: string;
    correction: string;
    category: string;
    isActive: boolean;
  }>;
}

/**
 * Export all profiles and corrections to JSON
 */
export async function exportProfilesAndCorrections(userId: number): Promise<ExportData> {
  const profiles = await getScriptProfiles(userId);
  const corrections = await getScriptCorrections(userId, false);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    profiles: profiles.map(p => ({
      name: p.name,
      description: p.description,
      metaPrompt: p.metaPrompt,
      isDefault: p.isDefault,
    })),
    corrections: corrections.map(c => ({
      problem: c.problem,
      correction: c.correction,
      category: c.category,
      isActive: c.isActive,
    })),
  };
}

/**
 * Import profiles and corrections from JSON
 */
export async function importProfilesAndCorrections(
  userId: number,
  data: ExportData,
  options: { replaceExisting?: boolean } = {}
): Promise<{ profilesImported: number; correctionsImported: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let profilesImported = 0;
  let correctionsImported = 0;

  // Import profiles
  for (const profile of data.profiles) {
    // Check if profile with same name exists
    const existing = await db
      .select()
      .from(scriptProfiles)
      .where(and(eq(scriptProfiles.userId, userId), eq(scriptProfiles.name, profile.name)))
      .limit(1);

    if (existing.length > 0) {
      if (options.replaceExisting) {
        await db
          .update(scriptProfiles)
          .set({
            description: profile.description,
            metaPrompt: profile.metaPrompt,
            updatedAt: new Date(),
          })
          .where(eq(scriptProfiles.id, existing[0].id));
        profilesImported++;
      }
    } else {
      await db.insert(scriptProfiles).values({
        userId,
        name: profile.name,
        description: profile.description,
        metaPrompt: profile.metaPrompt,
        isDefault: false, // Never import as default
      });
      profilesImported++;
    }
  }

  // Import corrections
  for (const correction of data.corrections) {
    // Check if similar correction exists
    const existing = await db
      .select()
      .from(scriptCorrections)
      .where(and(
        eq(scriptCorrections.userId, userId),
        eq(scriptCorrections.problem, correction.problem)
      ))
      .limit(1);

    if (existing.length > 0) {
      if (options.replaceExisting) {
        await db
          .update(scriptCorrections)
          .set({
            correction: correction.correction,
            category: correction.category as CorrectionCategory,
            isActive: correction.isActive,
          })
          .where(eq(scriptCorrections.id, existing[0].id));
        correctionsImported++;
      }
    } else {
      await db.insert(scriptCorrections).values({
        userId,
        problem: correction.problem,
        correction: correction.correction,
        category: correction.category as CorrectionCategory,
        isActive: correction.isActive,
      });
      correctionsImported++;
    }
  }

  return { profilesImported, correctionsImported };
}

// ============ Learning Statistics ============

export interface LearningStats {
  totalScriptsGenerated: number;
  averageWordCount: number;
  averageRating: number;
  ratingDistribution: { positive: number; neutral: number; negative: number };
  topCorrections: Array<{
    id: number;
    problem: string;
    correction: string;
    category: string;
    appliedCount: number;
  }>;
  profileUsage: Array<{
    id: number;
    name: string;
    usageCount: number;
    lastUsedAt: Date | null;
  }>;
  ratingEvolution: Array<{
    month: string;
    averageRating: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Get learning statistics for a user
 */
export async function getLearningStats(userId: number): Promise<LearningStats> {
  const db = await getDb();
  if (!db) {
    return {
      totalScriptsGenerated: 0,
      averageWordCount: 0,
      averageRating: 0,
      ratingDistribution: { positive: 0, neutral: 0, negative: 0 },
      topCorrections: [],
      profileUsage: [],
      ratingEvolution: [],
      categoryBreakdown: [],
    };
  }

  // Get all history entries
  const history = await db
    .select()
    .from(scriptHistory)
    .where(eq(scriptHistory.userId, userId))
    .orderBy(desc(scriptHistory.createdAt));

  // Get all corrections
  const corrections = await db
    .select()
    .from(scriptCorrections)
    .where(eq(scriptCorrections.userId, userId))
    .orderBy(desc(scriptCorrections.appliedCount));

  // Get all profiles
  const profiles = await db
    .select()
    .from(scriptProfiles)
    .where(eq(scriptProfiles.userId, userId))
    .orderBy(desc(scriptProfiles.usageCount));

  // Calculate statistics
  const totalScriptsGenerated = history.length;
  
  const wordCounts = history.map(h => h.wordCount || 0).filter(w => w > 0);
  const averageWordCount = wordCounts.length > 0
    ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
    : 0;

  const ratings = history.map(h => h.rating).filter(r => r !== null) as number[];
  const averageRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  const ratingDistribution = {
    positive: ratings.filter(r => r === 1).length,
    neutral: ratings.filter(r => r === 0).length,
    negative: ratings.filter(r => r === -1).length,
  };

  // Top corrections (most applied)
  const topCorrections = corrections.slice(0, 10).map(c => ({
    id: c.id,
    problem: c.problem,
    correction: c.correction,
    category: c.category,
    appliedCount: c.appliedCount || 0,
  }));

  // Profile usage
  const profileUsage = profiles.map(p => ({
    id: p.id,
    name: p.name,
    usageCount: p.usageCount || 0,
    lastUsedAt: p.lastUsedAt,
  }));

  // Rating evolution by month
  const ratingByMonth = new Map<string, { sum: number; count: number }>();
  for (const entry of history) {
    if (entry.rating !== null) {
      const month = entry.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = ratingByMonth.get(month) || { sum: 0, count: 0 };
      existing.sum += entry.rating;
      existing.count++;
      ratingByMonth.set(month, existing);
    }
  }
  const ratingEvolution = Array.from(ratingByMonth.entries())
    .map(([month, data]) => ({
      month,
      averageRating: data.sum / data.count,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Category breakdown
  const categoryCount = new Map<string, number>();
  for (const correction of corrections) {
    const count = categoryCount.get(correction.category) || 0;
    categoryCount.set(correction.category, count + 1);
  }
  const totalCorrections = corrections.length;
  const categoryBreakdown = Array.from(categoryCount.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCorrections > 0 ? Math.round((count / totalCorrections) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalScriptsGenerated,
    averageWordCount,
    averageRating,
    ratingDistribution,
    topCorrections,
    profileUsage,
    ratingEvolution,
    categoryBreakdown,
  };
}


// ============ Tags System ============

/**
 * Get all unique tags used by a user
 */
export async function getAllTags(userId: number): Promise<string[]> {
  const profiles = await getScriptProfiles(userId);
  const allTags = new Set<string>();
  
  for (const profile of profiles) {
    if (profile.tags && Array.isArray(profile.tags)) {
      profile.tags.forEach(tag => allTags.add(tag));
    }
  }
  
  return Array.from(allTags).sort();
}

/**
 * Update tags for a profile
 */
export async function updateProfileTags(
  userId: number,
  profileId: number,
  tags: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    throw new Error("Profile not found");
  }

  await db
    .update(scriptProfiles)
    .set({ tags: tags.length > 0 ? tags : null })
    .where(eq(scriptProfiles.id, profileId));
}

/**
 * Get profiles filtered by tag
 */
export async function getProfilesByTag(userId: number, tag: string): Promise<ScriptProfile[]> {
  const profiles = await getScriptProfiles(userId);
  return profiles.filter(p => p.tags && p.tags.includes(tag));
}

// ============ Multi-Profile Comparison ============

export interface ComparisonResult {
  profileId: number;
  profileName: string;
  script: string;
  wordCount: number;
  generationTime: number;
}

/**
 * Generate the same script with multiple profiles for comparison
 */
export async function generateComparisonScripts(
  userId: number,
  topic: string,
  profileIds: number[],
  model: "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini" | "gpt-5" | "gpt-5-pro" = "gpt-4o",
  customInstructions?: string
): Promise<ComparisonResult[]> {
  const results: ComparisonResult[] = [];

  for (const profileId of profileIds) {
    const startTime = Date.now();
    
    try {
      const result = await generateEnhancedScript(
        userId,
        topic,
        model,
        customInstructions,
        profileId
      );
      
      const profile = result.profileUsed;
      
      results.push({
        profileId,
        profileName: profile?.name || "Profil inconnu",
        script: result.script,
        wordCount: result.wordCount,
        generationTime: Date.now() - startTime,
      });
    } catch (error) {
      console.error(`Error generating script for profile ${profileId}:`, error);
      results.push({
        profileId,
        profileName: "Erreur",
        script: `Erreur lors de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        wordCount: 0,
        generationTime: Date.now() - startTime,
      });
    }
  }

  return results;
}

// ============ AI Assistant for Negative Scripts ============

export interface ScriptAnalysis {
  problems: string[];
  suggestedCorrections: Array<{
    problem: string;
    correction: string;
    category: CorrectionCategory;
  }>;
  overallFeedback: string;
}

/**
 * Analyze negatively rated scripts and suggest corrections
 */
export async function analyzeNegativeScripts(userId: number): Promise<ScriptAnalysis> {
  const db = await getDb();
  if (!db) {
    return {
      problems: [],
      suggestedCorrections: [],
      overallFeedback: "Base de données non disponible",
    };
  }

  // Get all negatively rated scripts
  const negativeScripts = await db
    .select()
    .from(scriptHistory)
    .where(and(
      eq(scriptHistory.userId, userId),
      eq(scriptHistory.rating, -1)
    ))
    .orderBy(desc(scriptHistory.createdAt))
    .limit(10);

  if (negativeScripts.length === 0) {
    return {
      problems: [],
      suggestedCorrections: [],
      overallFeedback: "Aucun script noté négativement trouvé. Continuez à générer et évaluer vos scripts !",
    };
  }

  // Get existing corrections to avoid duplicates
  const existingCorrections = await db
    .select()
    .from(scriptCorrections)
    .where(eq(scriptCorrections.userId, userId));

  const existingProblems = existingCorrections.map(c => c.problem.toLowerCase());

  // Build analysis prompt
  const scriptsForAnalysis = negativeScripts.map((s, i) => 
    `### Script ${i + 1} (${s.topic}):\n${s.generatedScript.slice(0, 2000)}...\n\nFeedback utilisateur: ${s.feedback || 'Aucun feedback'}`
  ).join('\n\n---\n\n');

  const existingCorrectionsText = existingCorrections.length > 0
    ? `\n\nCORRECTIONS DÉJÀ EN PLACE (ne pas répéter):\n${existingCorrections.map(c => `- ${c.problem}`).join('\n')}`
    : '';

  const analysisPrompt = `Tu es un expert en analyse de scripts YouTube. Analyse les scripts suivants qui ont été notés négativement par l'utilisateur et identifie les problèmes récurrents.

SCRIPTS À ANALYSER:
${scriptsForAnalysis}
${existingCorrectionsText}

CATÉGORIES DE CORRECTIONS DISPONIBLES:
- structure: Structure du script
- tone: Ton et style
- length: Longueur des sections
- transitions: Transitions entre sections
- examples: Exemples et illustrations
- engagement: Engagement de l'audience
- cta: Call-to-action
- other: Autres

Réponds en JSON avec ce format exact:
{
  "problems": ["problème 1", "problème 2", ...],
  "suggestedCorrections": [
    {
      "problem": "description du problème identifié",
      "correction": "règle corrective à appliquer",
      "category": "une des catégories ci-dessus"
    }
  ],
  "overallFeedback": "Résumé général des améliorations à apporter"
}

Propose 3 à 5 corrections concrètes et actionnables.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Tu es un expert en analyse de scripts YouTube. Tu réponds uniquement en JSON valide.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "script_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              problems: {
                type: "array",
                items: { type: "string" },
                description: "Liste des problèmes identifiés",
              },
              suggestedCorrections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    problem: { type: "string", description: "Description du problème" },
                    correction: { type: "string", description: "Règle corrective" },
                    category: { 
                      type: "string", 
                      enum: ["structure", "tone", "length", "transitions", "examples", "engagement", "cta", "other"],
                      description: "Catégorie de la correction" 
                    },
                  },
                  required: ["problem", "correction", "category"],
                  additionalProperties: false,
                },
                description: "Corrections suggérées",
              },
              overallFeedback: {
                type: "string",
                description: "Feedback général",
              },
            },
            required: ["problems", "suggestedCorrections", "overallFeedback"],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No response from LLM");
    }

    const content = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const analysis = JSON.parse(content) as ScriptAnalysis;

    // Filter out corrections that already exist
    analysis.suggestedCorrections = analysis.suggestedCorrections.filter(
      c => !existingProblems.includes(c.problem.toLowerCase())
    );

    return analysis;
  } catch (error) {
    console.error("Error analyzing negative scripts:", error);
    return {
      problems: ["Erreur lors de l'analyse"],
      suggestedCorrections: [],
      overallFeedback: `Erreur lors de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Apply suggested corrections from analysis
 */
export async function applySuggestedCorrections(
  userId: number,
  corrections: Array<{
    problem: string;
    correction: string;
    category: CorrectionCategory;
  }>
): Promise<{ applied: number }> {
  let applied = 0;

  for (const correction of corrections) {
    try {
      await addScriptCorrection(
        userId,
        correction.problem,
        correction.correction,
        correction.category
      );
      applied++;
    } catch (error) {
      console.error("Error applying correction:", error);
    }
  }

  return { applied };
}


// ============ Profile Versioning ============

export interface ProfileVersion {
  id: number;
  profileId: number;
  version: number;
  name: string;
  description: string | null;
  content: string;
  changeDescription: string | null;
  isFavorite: boolean;
  createdAt: Date;
}

/**
 * Save a new version of a profile
 */
export async function saveProfileVersion(
  userId: number,
  profileId: number,
  changeDescription?: string
): Promise<{ version: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the profile
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    throw new Error("Profile not found");
  }

  // Get the latest version number
  const latestVersion = await db
    .select({ maxVersion: sql<number>`MAX(version)` })
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.profileId, profileId));

  const newVersion = (latestVersion[0]?.maxVersion || 0) + 1;

  // Save the version
  await db.insert(scriptProfileVersions).values({
    profileId,
    version: newVersion,
    name: profile[0].name,
    description: profile[0].description,
    content: profile[0].metaPrompt,
    changeDescription: changeDescription || null,
  });

  return { version: newVersion };
}

/**
 * Get all versions of a profile
 */
export async function getProfileVersions(
  userId: number,
  profileId: number
): Promise<ProfileVersion[]> {
  const db = await getDb();
  if (!db) return [];

  // Verify ownership
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    return [];
  }

  const versions = await db
    .select()
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.profileId, profileId))
    .orderBy(desc(scriptProfileVersions.version));

  return versions.map(v => ({
    ...v,
    isFavorite: v.isFavorite ?? false,
  }));
}

/**
 * Restore a profile to a previous version
 */
export async function restoreProfileVersion(
  userId: number,
  profileId: number,
  versionId: number
): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    throw new Error("Profile not found");
  }

  // Get the version to restore
  const version = await db
    .select()
    .from(scriptProfileVersions)
    .where(and(
      eq(scriptProfileVersions.id, versionId),
      eq(scriptProfileVersions.profileId, profileId)
    ))
    .limit(1);

  if (version.length === 0) {
    throw new Error("Version not found");
  }

  // Save current state as a new version before restoring
  await saveProfileVersion(userId, profileId, `Avant restauration vers v${version[0].version}`);

  // Restore the profile
  await db
    .update(scriptProfiles)
    .set({
      name: version[0].name,
      description: version[0].description,
      metaPrompt: version[0].content,
      updatedAt: new Date(),
    })
    .where(eq(scriptProfiles.id, profileId));

  // Save the restored state as a new version
  await saveProfileVersion(userId, profileId, `Restauré depuis v${version[0].version}`);

  return { success: true };
}

/**
 * Compare two versions of a profile
 */
export async function compareProfileVersions(
  userId: number,
  profileId: number,
  versionId1: number,
  versionId2: number
): Promise<{
  version1: ProfileVersion | null;
  version2: ProfileVersion | null;
}> {
  const db = await getDb();
  if (!db) return { version1: null, version2: null };

  // Verify ownership
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    return { version1: null, version2: null };
  }

  const [v1, v2] = await Promise.all([
    db.select().from(scriptProfileVersions)
      .where(and(eq(scriptProfileVersions.id, versionId1), eq(scriptProfileVersions.profileId, profileId)))
      .limit(1),
    db.select().from(scriptProfileVersions)
      .where(and(eq(scriptProfileVersions.id, versionId2), eq(scriptProfileVersions.profileId, profileId)))
      .limit(1),
  ]);

  return {
    version1: v1[0] || null,
    version2: v2[0] || null,
  };
}

/**
 * Delete old versions, keeping only the last N versions
 */
export async function pruneOldVersions(
  profileId: number,
  keepCount: number = 20
): Promise<{ deleted: number }> {
  const db = await getDb();
  if (!db) return { deleted: 0 };

  // Get all versions ordered by version number descending
  const versions = await db
    .select({ id: scriptProfileVersions.id })
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.profileId, profileId))
    .orderBy(desc(scriptProfileVersions.version));

  if (versions.length <= keepCount) {
    return { deleted: 0 };
  }

  // Delete versions beyond keepCount
  const toDelete = versions.slice(keepCount).map(v => v.id);
  
  if (toDelete.length > 0) {
    await db
      .delete(scriptProfileVersions)
      .where(inArray(scriptProfileVersions.id, toDelete));
  }

  return { deleted: toDelete.length };
}


// ============ Profile Branches (Experimental Variations) ============

import { scriptProfileBranches } from "../drizzle/schema";

export interface ProfileBranch {
  id: number;
  profileId: number;
  userId: number;
  name: string;
  description: string | null;
  metaPrompt: string;
  parentVersionId: number | null;
  status: "active" | "merged" | "abandoned";
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
}

/**
 * Get all branches for a profile
 */
export async function getProfileBranches(
  userId: number,
  profileId: number
): Promise<ProfileBranch[]> {
  const db = await getDb();
  if (!db) return [];

  const branches = await db
    .select()
    .from(scriptProfileBranches)
    .where(and(
      eq(scriptProfileBranches.profileId, profileId),
      eq(scriptProfileBranches.userId, userId)
    ))
    .orderBy(desc(scriptProfileBranches.createdAt));

  return branches;
}

/**
 * Create a new branch from a profile
 */
export async function createProfileBranch(
  userId: number,
  profileId: number,
  name: string,
  description?: string
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the profile to branch from
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(eq(scriptProfiles.id, profileId), eq(scriptProfiles.userId, userId)))
    .limit(1);

  if (profile.length === 0) {
    throw new Error("Profile not found");
  }

  // Get the latest version ID for reference
  const latestVersion = await db
    .select({ id: scriptProfileVersions.id })
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.profileId, profileId))
    .orderBy(desc(scriptProfileVersions.version))
    .limit(1);

  const result = await db.insert(scriptProfileBranches).values({
    profileId,
    userId,
    name,
    description: description || null,
    metaPrompt: profile[0].metaPrompt,
    parentVersionId: latestVersion[0]?.id || null,
    status: "active",
  });

  return { id: Number(result[0].insertId) };
}

/**
 * Update a branch's meta-prompt
 */
export async function updateProfileBranch(
  userId: number,
  branchId: number,
  updates: { name?: string; description?: string; metaPrompt?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scriptProfileBranches)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(
      eq(scriptProfileBranches.id, branchId),
      eq(scriptProfileBranches.userId, userId)
    ));
}

/**
 * Merge a branch into the main profile
 */
export async function mergeBranch(
  userId: number,
  branchId: number
): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the branch
  const branch = await db
    .select()
    .from(scriptProfileBranches)
    .where(and(
      eq(scriptProfileBranches.id, branchId),
      eq(scriptProfileBranches.userId, userId),
      eq(scriptProfileBranches.status, "active")
    ))
    .limit(1);

  if (branch.length === 0) {
    throw new Error("Branch not found or not active");
  }

  const profileId = branch[0].profileId;

  // Save current profile state as a version before merging
  await saveProfileVersion(userId, profileId, `Avant fusion de la branche "${branch[0].name}"`);

  // Update the profile with branch content
  await db
    .update(scriptProfiles)
    .set({
      metaPrompt: branch[0].metaPrompt,
      updatedAt: new Date(),
    })
    .where(eq(scriptProfiles.id, profileId));

  // Mark branch as merged
  await db
    .update(scriptProfileBranches)
    .set({
      status: "merged",
      mergedAt: new Date(),
    })
    .where(eq(scriptProfileBranches.id, branchId));

  // Save post-merge state
  await saveProfileVersion(userId, profileId, `Après fusion de la branche "${branch[0].name}"`);

  return { success: true };
}

/**
 * Abandon a branch (mark as abandoned without deleting)
 */
export async function abandonBranch(
  userId: number,
  branchId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scriptProfileBranches)
    .set({
      status: "abandoned",
      updatedAt: new Date(),
    })
    .where(and(
      eq(scriptProfileBranches.id, branchId),
      eq(scriptProfileBranches.userId, userId)
    ));
}

/**
 * Delete a branch permanently
 */
export async function deleteBranch(
  userId: number,
  branchId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(scriptProfileBranches)
    .where(and(
      eq(scriptProfileBranches.id, branchId),
      eq(scriptProfileBranches.userId, userId)
    ));
}

/**
 * Reactivate an abandoned branch
 */
export async function reactivateBranch(
  userId: number,
  branchId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scriptProfileBranches)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(and(
      eq(scriptProfileBranches.id, branchId),
      eq(scriptProfileBranches.userId, userId),
      eq(scriptProfileBranches.status, "abandoned")
    ));
}


// ============ Visual Diff Between Versions ============

import * as Diff from "diff";

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber?: number;
}

export interface VersionDiff {
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

/**
 * Generate a visual diff between two version contents
 */
export function generateVersionDiff(oldContent: string, newContent: string): VersionDiff {
  const diff = Diff.diffLines(oldContent, newContent);
  
  const lines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  diff.forEach((part) => {
    const partLines = part.value.split("\n").filter((line, idx, arr) => 
      // Remove empty last line from split
      !(idx === arr.length - 1 && line === "")
    );

    partLines.forEach((line) => {
      if (part.added) {
        lines.push({ type: "added", content: line });
        addedCount++;
      } else if (part.removed) {
        lines.push({ type: "removed", content: line });
        removedCount++;
      } else {
        lines.push({ type: "unchanged", content: line });
        unchangedCount++;
      }
    });
  });

  return {
    lines,
    stats: {
      added: addedCount,
      removed: removedCount,
      unchanged: unchangedCount,
    },
  };
}

/**
 * Compare two versions and return a visual diff
 */
export async function getVersionDiff(
  userId: number,
  profileId: number,
  versionId1: number,
  versionId2: number
): Promise<VersionDiff | null> {
  const comparison = await compareProfileVersions(userId, profileId, versionId1, versionId2);
  
  if (!comparison.version1 || !comparison.version2) {
    return null;
  }

  return generateVersionDiff(comparison.version1.content, comparison.version2.content);
}


// ============ Favorite Versions System ============

/**
 * Toggle favorite status for a version
 */
export async function toggleVersionFavorite(
  userId: number,
  versionId: number
): Promise<{ isFavorite: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the version and verify ownership through profile
  const version = await db
    .select({
      id: scriptProfileVersions.id,
      profileId: scriptProfileVersions.profileId,
      isFavorite: scriptProfileVersions.isFavorite,
    })
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.id, versionId))
    .limit(1);

  if (version.length === 0) {
    throw new Error("Version not found");
  }

  // Verify user owns the profile
  const profile = await db
    .select()
    .from(scriptProfiles)
    .where(and(
      eq(scriptProfiles.id, version[0].profileId),
      eq(scriptProfiles.userId, userId)
    ))
    .limit(1);

  if (profile.length === 0) {
    throw new Error("Access denied");
  }

  const newFavoriteStatus = !version[0].isFavorite;

  await db
    .update(scriptProfileVersions)
    .set({ isFavorite: newFavoriteStatus })
    .where(eq(scriptProfileVersions.id, versionId));

  return { isFavorite: newFavoriteStatus };
}

/**
 * Get all favorite versions for a user
 */
export async function getFavoriteVersions(userId: number): Promise<ProfileVersion[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all profiles for this user
  const userProfiles = await db
    .select({ id: scriptProfiles.id })
    .from(scriptProfiles)
    .where(eq(scriptProfiles.userId, userId));

  if (userProfiles.length === 0) {
    return [];
  }

  const profileIds = userProfiles.map(p => p.id);

  const favorites = await db
    .select()
    .from(scriptProfileVersions)
    .where(and(
      inArray(scriptProfileVersions.profileId, profileIds),
      eq(scriptProfileVersions.isFavorite, true)
    ))
    .orderBy(desc(scriptProfileVersions.createdAt));

  return favorites;
}

/**
 * Modified pruneOldVersions to protect favorites
 */
export async function pruneOldVersionsProtectFavorites(
  profileId: number,
  keepCount: number = 20
): Promise<{ deleted: number; protected: number }> {
  const db = await getDb();
  if (!db) return { deleted: 0, protected: 0 };

  // Get all versions ordered by version number descending
  const versions = await db
    .select({ 
      id: scriptProfileVersions.id,
      isFavorite: scriptProfileVersions.isFavorite 
    })
    .from(scriptProfileVersions)
    .where(eq(scriptProfileVersions.profileId, profileId))
    .orderBy(desc(scriptProfileVersions.version));

  // Separate favorites and non-favorites
  const favorites = versions.filter(v => v.isFavorite);
  const nonFavorites = versions.filter(v => !v.isFavorite);

  // Only delete non-favorites beyond keepCount
  const toKeep = nonFavorites.slice(0, keepCount);
  const toDelete = nonFavorites.slice(keepCount).map(v => v.id);

  if (toDelete.length > 0) {
    await db
      .delete(scriptProfileVersions)
      .where(inArray(scriptProfileVersions.id, toDelete));
  }

  return { 
    deleted: toDelete.length, 
    protected: favorites.length 
  };
}
