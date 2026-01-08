import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { instructionScripts } from '../drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const scriptsToUpdate = [
  {
    scriptType: 'channel_analysis',
    filePath: '/tmp/analyse_chaine_christophe_pauly.txt',
    description: 'Analyse stratégique de la chaîne Christophe Pauly'
  },
  {
    scriptType: 'title_guide',
    filePath: '/tmp/guide_titre.txt',
    description: 'Guide pour créer des titres YouTube performants'
  },
  {
    scriptType: 'description_guide',
    filePath: '/tmp/guide_description_tag.txt',
    description: 'Guide pour optimiser les descriptions et tags YouTube'
  },
  {
    scriptType: 'script_analysis',
    filePath: '/tmp/analyse_scripts_piliers.txt',
    description: 'Analyse des scripts piliers de la chaîne'
  },
  {
    scriptType: 'thumbnail_mechanics',
    filePath: '/tmp/guide_mecaniques_miniatures.txt',
    description: 'Guide des mécaniques de miniatures YouTube performantes'
  },
  {
    scriptType: 'midjourney_prompts',
    filePath: '/tmp/guide_prompts_midjourney.txt',
    description: 'Guide pour créer des prompts Midjourney optimisés'
  }
];

async function updateInstructionScripts() {
  console.log('🚀 Mise à jour des scripts d\'instructions...\n');

  for (const script of scriptsToUpdate) {
    try {
      const content = readFileSync(script.filePath, 'utf-8');
      
      await db.insert(instructionScripts).values({
        userId: 1, // Owner ID
        scriptType: script.scriptType,
        version: 2, // Nouvelle version
        content: content,
        createdAt: new Date()
      });

      console.log(`✅ ${script.scriptType} mis à jour (${content.length} caractères)`);
    } catch (error) {
      console.error(`❌ Erreur pour ${script.scriptType}:`, error.message);
    }
  }

  console.log('\n✅ Mise à jour terminée !');
  process.exit(0);
}

updateInstructionScripts().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
