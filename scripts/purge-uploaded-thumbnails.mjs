import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

async function purgeUploadedThumbnails() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log('🗑️  Purge des miniatures uploadées des tests A/B...\n');

    // 1. Compter les variantes avec des miniatures uploadées (non vides)
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM testVariants WHERE thumbnailUrl != '' AND thumbnailUrl IS NOT NULL`
    );
    const count = countResult[0].count;
    console.log(`📊 Nombre de variantes avec miniatures uploadées : ${count}`);

    if (count === 0) {
      console.log('✅ Aucune miniature à purger !');
      return;
    }

    // 2. Afficher quelques exemples de miniatures qui seront purgées
    const [examples] = await connection.execute(
      `SELECT id, title, thumbnailUrl FROM testVariants WHERE thumbnailUrl != '' AND thumbnailUrl IS NOT NULL LIMIT 5`
    );
    console.log('\n📋 Exemples de miniatures qui seront purgées :');
    examples.forEach((variant) => {
      console.log(`  - Variante #${variant.id}: "${variant.title}" → ${variant.thumbnailUrl}`);
    });

    // 3. Purger toutes les miniatures uploadées (mettre thumbnailUrl à chaîne vide)
    console.log('\n🔄 Purge en cours...');
    const [result] = await connection.execute(
      `UPDATE testVariants SET thumbnailUrl = '' WHERE thumbnailUrl != '' AND thumbnailUrl IS NOT NULL`
    );

    console.log(`\n✅ Purge terminée ! ${result.affectedRows} miniatures purgées.`);
    console.log('ℹ️  Les miniatures YouTube (dans la table videos) sont conservées.');

  } catch (error) {
    console.error('❌ Erreur lors de la purge :', error);
    throw error;
  } finally {
    await connection.end();
  }
}

purgeUploadedThumbnails();
