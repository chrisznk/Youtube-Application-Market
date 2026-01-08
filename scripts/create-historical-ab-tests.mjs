import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse le fichier d'historique
function parseHistoryFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  
  const videoHistories = [];
  let currentVideo = null;
  let currentChanges = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecte le début d'une nouvelle vidéo (titre actuel)
    if (line === 'Title Changes') {
      // On a trouvé la section des changements
      continue;
    } else if (line === 'Original Title') {
      // Fin des changements pour cette vidéo
      if (currentVideo && currentChanges.length > 0) {
        // Inverser pour avoir du plus ancien au plus récent
        currentChanges.reverse();
        videoHistories.push({
          currentTitle: currentVideo,
          changes: currentChanges
        });
      }
      currentVideo = null;
      currentChanges = [];
    } else if (!currentVideo && line && !line.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      // C'est le titre actuel de la vidéo
      currentVideo = line;
    } else if (currentVideo && !line.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      // C'est un titre dans l'historique
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        currentChanges.push({
          title: line,
          date: nextLine
        });
        i++; // Skip la date
      }
    }
  }
  
  return videoHistories;
}

// Convertit une date MM/DD/YYYY en format MySQL DATETIME
function parseDate(dateStr) {
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Ajoute 7 jours à une date
function addDays(dateStr, days) {
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  console.log('🚀 Début de la création des tests A/B historiques...\n');
  
  // Connexion à la base de données
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Parse le fichier d'historique
  const historyFilePath = '/home/ubuntu/upload/pasted_content.txt';
  const videoHistories = parseHistoryFile(historyFilePath);
  
  console.log(`📊 ${videoHistories.length} vidéos avec historique trouvées\n`);
  
  // Récupérer toutes les vidéos de la base
  const [allVideos] = await connection.execute('SELECT * FROM videos');
  
  let totalTestsCreated = 0;
  let totalVariantsCreated = 0;
  
  for (const history of videoHistories) {
    console.log(`\n📹 Traitement: ${history.currentTitle}`);
    console.log(`   ${history.changes.length} changements de titre détectés`);
    
    // Trouver la vidéo correspondante dans la base
    const video = allVideos.find(v => 
      v.title === history.currentTitle || 
      history.changes.some(c => c.title === v.title)
    );
    
    if (!video) {
      console.log(`   ⚠️  Vidéo non trouvée dans la base de données, ignorée`);
      continue;
    }
    
    console.log(`   ✅ Vidéo trouvée (ID: ${video.id})`);
    
    // Créer un test A/B pour chaque transition de titre
    for (let i = 0; i < history.changes.length - 1; i++) {
      const previousTitle = history.changes[i].title;
      const nextTitle = history.changes[i + 1].title;
      const testDate = parseDate(history.changes[i + 1].date);
      const completedDate = addDays(history.changes[i + 1].date, 7);
      
      // Créer le test A/B
      const testName = `Évolution titre ${i + 1}`;
      
      // Utiliser le userId d'Omniscience
      const userId = 810200; // ID de l'utilisateur omniscience@polemikos.fr
      
      const [testResult] = await connection.execute(
        `INSERT INTO abTests (userId, videoId, name, variantType, status, startDate, endDate, createdAt) 
         VALUES (?, ?, ?, 'text', 'completed', ?, ?, ?)`,
        [userId, video.id, testName, testDate, completedDate, testDate]
      );
      
      const testId = testResult.insertId;
      totalTestsCreated++;
      
      // Créer la variante contrôle (titre précédent)
      await connection.execute(
        `INSERT INTO testVariants (userId, testId, title, thumbnailUrl, thumbnailTitle, prompt, isControl, views, watchTimePercentage, createdAt) 
         VALUES (?, ?, ?, '', NULL, NULL, 1, 100, 47.5, ?)`,
        [userId, testId, previousTitle, testDate]
      );
      totalVariantsCreated++;
      
      // Créer la variante gagnante (titre suivant, +5%)
      await connection.execute(
        `INSERT INTO testVariants (userId, testId, title, thumbnailUrl, thumbnailTitle, prompt, isControl, views, watchTimePercentage, createdAt) 
         VALUES (?, ?, ?, '', NULL, NULL, 0, 100, 52.5, ?)`,
        [userId, testId, nextTitle, testDate]
      );
      totalVariantsCreated++;
      
      console.log(`   ✅ Test A/B créé: "${previousTitle.substring(0, 50)}..." → "${nextTitle.substring(0, 50)}..." (+5%)`);
    }
  }
  
  await connection.end();
  
  console.log(`\n✨ Terminé !`);
  console.log(`📊 ${totalTestsCreated} tests A/B créés`);
  console.log(`📊 ${totalVariantsCreated} variantes créées`);
}

main().catch(console.error);
