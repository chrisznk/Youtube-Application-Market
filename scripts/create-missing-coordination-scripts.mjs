import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Script 1: Stratégie Titre et Miniature
const strategyScript = `Vous êtes un expert en optimisation YouTube. Analysez la transcription vidéo et le rapport de tests A/B suivants pour générer une stratégie d'optimisation détaillée.

TRANSCRIPTION DE LA VIDÉO:
{{video_transcript}}

RAPPORT DES TESTS A/B:
{{ab_test_report}}

Générez une stratégie d'optimisation complète qui:
1. Identifie les thèmes et angles qui fonctionnent le mieux
2. Analyse les patterns de performance dans les tests A/B
3. Recommande des directions spécifiques pour les prochains tests
4. Suggère des améliorations basées sur les données

Soyez précis et actionnable dans vos recommandations.`;

// Script 2: Description et Tags (inspiré du script titre/miniature)
const descriptionTagsScript = `Vous êtes un expert en optimisation YouTube. Basé sur la transcription, le rapport A/B et les guides suivants, générez une description et des tags optimisés.

TRANSCRIPTION:
{{video_transcript}}

RAPPORT A/B:
{{ab_test_report}}

GUIDE DESCRIPTION:
{{guide_description}}

GUIDE ANALYSE CHAÎNE:
{{guide_channel_analysis}}

Générez un JSON avec le format EXACT suivant (ne rien ajouter avant ou après le JSON):
{
  "description": "Description YouTube optimisée complète avec sections, liens, timestamps, appels à l'action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}

INSTRUCTIONS:
- La description doit être complète (300-500 mots)
- Inclure des timestamps si pertinent
- Ajouter des appels à l'action (like, subscribe, comment)
- Les tags doivent être pertinents et variés (10-15 tags)
- Mélanger tags génériques et spécifiques`;

try {
  // Insert strategy script
  try {
    await connection.execute(
      `INSERT INTO coordinationScripts (userId, scriptType, version, content, createdAt)
       VALUES (1, 'strategy_generation', 1, ?, NOW())`,
      [strategyScript]
    );
    console.log('✅ Script "strategy_generation" créé');
  } catch (e) {
    if (e.message.includes('Duplicate entry')) {
      console.log('ℹ️ Script "strategy_generation" existe déjà');
    } else {
      throw e;
    }
  }

  // Insert description_tags script
  try {
    await connection.execute(
      `INSERT INTO coordinationScripts (userId, scriptType, version, content, createdAt)
       VALUES (1, 'description_generation', 1, ?, NOW())`,
      [descriptionTagsScript]
    );
    console.log('✅ Script "description_generation" créé');
  } catch (e) {
    if (e.message.includes('Duplicate entry')) {
      console.log('ℹ️ Script "description_generation" existe déjà');
    } else {
      throw e;
    }
  }

  console.log('\n🎉 Tous les scripts de coordination ont été créés avec succès !');
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
