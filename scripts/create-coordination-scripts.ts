import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { coordinationScripts } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function createCoordinationScripts() {
  console.log('🚀 Création des scripts de coordination...\n');

  // Script 1: Génération de titres et miniatures
  try {
    const titleThumbnailContent = readFileSync('/tmp/title_and_thumbnail_generation_script.txt', 'utf-8');
    
    await db.insert(coordinationScripts).values({
      userId: 1,
      scriptType: 'title_and_thumbnail_generation',
      content: titleThumbnailContent,
      createdAt: new Date()
    }).onDuplicateKeyUpdate({
      set: {
        content: titleThumbnailContent,
        createdAt: new Date()
      }
    });

    console.log(`✅ title_and_thumbnail_generation créé (${titleThumbnailContent.length} caractères)`);
  } catch (error: any) {
    console.error(`❌ Erreur pour title_and_thumbnail_generation:`, error.message);
  }

  // Script 2: Génération de descriptions
  const descriptionScript = `Tu es un expert en optimisation de descriptions et tags YouTube pour la chaîne « Christophe Pauly ».

## Contexte dynamique (variables)

Pour chaque requête, tu reçois :
- Titre de la vidéo : {{video_title}}
- Transcription complète de la vidéo : {{video_transcript}}
- Tags générés : {{video_tags}}
- Guide des descriptions et tags : {{guide_description}}

## Objectif

Génère une description YouTube optimisée qui :
- Respecte les 43 règles d'or du guide des descriptions
- Maximise le CTR et l'engagement
- Utilise les mots-clés du titre avec une densité de 60-80%
- Inclut minimum 2 questions
- Commence par "Et si..."
- Respecte le rythme 50/25/25 (phrases courtes/moyennes/longues)

## Format de RÉPONSE (JSON STRICT)

Rends la réponse en JSON STRICTEMENT au format suivant :

{
  "description": "...",
  "length_category": "dramatique_court|equilibre|complexe|contemplatif|argumentatif|scientifique",
  "keyword_density": 0.75,
  "question_count": 2,
  "rationale": "Explication de pourquoi cette description fonctionne"
}

- Aucune autre clé, explication ou commentaire en dehors du JSON.
- Aucun Markdown.
- Seulement du JSON valide.`;

  try {
    await db.insert(coordinationScripts).values({
      userId: 1,
      scriptType: 'description_generation',
      content: descriptionScript,
      createdAt: new Date()
    }).onDuplicateKeyUpdate({
      set: {
        content: descriptionScript,
        createdAt: new Date()
      }
    });

    console.log(`✅ description_generation créé (${descriptionScript.length} caractères)`);
  } catch (error: any) {
    console.error(`❌ Erreur pour description_generation:`, error.message);
  }

  console.log('\n✅ Scripts de coordination créés !');
  process.exit(0);
}

createCoordinationScripts().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
