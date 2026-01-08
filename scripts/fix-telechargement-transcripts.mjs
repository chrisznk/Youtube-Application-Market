import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const DATABASE_URL = process.env.DATABASE_URL;
const UPLOAD_DIR = '/home/ubuntu/upload';

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Mapping manuel des fichiers téléchargement vers les titres de vidéos
const manualMapping = {
  'téléchargement(5).txt': 'De quoi le VIDE est-il PLEIN ? Le Plus Grand Paradoxe de la Physique Quantique',
  'téléchargement(6).txt': 'Le Secret de la Conscience … révélé par une IA ?',
  'téléchargement(7).txt': 'Pourquoi le TEMPS s\'arrête à la VITESSE de la LUMIÈRE ?',
  'téléchargement(8).txt': 'LE FUTUR est-il écrit d\'avance ? La Physique Quantique & le Principe d\'Incertitude',
  'téléchargement(9).txt': 'Le paradoxe du QI élevé : L\'intelligence est elle un HANDICAP ?',
};

async function main() {
  console.log('🔧 Correction des transcriptions des fichiers téléchargement...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  let fixed = 0;
  let notFound = 0;
  
  for (const [filename, expectedTitle] of Object.entries(manualMapping)) {
    console.log(`📝 Fichier: ${filename}`);
    console.log(`   Titre attendu: ${expectedTitle}`);
    
    // Lire le contenu du fichier
    const filePath = `${UPLOAD_DIR}/${filename}`;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Chercher la vidéo par titre
      const [videos] = await connection.execute(
        'SELECT id, title FROM videos WHERE title = ?',
        [expectedTitle]
      );
      
      if (videos.length > 0) {
        const video = videos[0];
        console.log(`   ✅ Vidéo trouvée (ID: ${video.id})`);
        
        // Mettre à jour la transcription
        await connection.execute(
          'UPDATE videos SET transcript = ? WHERE id = ?',
          [content, video.id]
        );
        
        console.log(`   ✅ Transcription mise à jour\n`);
        fixed++;
      } else {
        console.log(`   ❌ Vidéo non trouvée dans la base de données\n`);
        notFound++;
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}\n`);
      notFound++;
    }
  }
  
  await connection.end();
  
  console.log('✨ Terminé !');
  console.log(`✅ ${fixed} transcriptions corrigées`);
  console.log(`❌ ${notFound} fichiers non trouvés`);
}

main().catch(console.error);
