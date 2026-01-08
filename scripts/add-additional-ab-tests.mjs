import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
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
  console.log('🚀 Ajout des tests A/B supplémentaires pour "Le Paradoxe des Horloges"...\n');
  
  // Connexion à la base de données
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Utiliser le userId d'Omniscience
  const userId = 810200;
  
  // Titre actuel de la vidéo
  const currentTitle = "La PREUVE que le Temps n'existe pas: Le Paradoxe des Horloges";
  
  // Trouver la vidéo dans la base
  const [videos] = await connection.execute(
    'SELECT * FROM videos WHERE title = ?',
    [currentTitle]
  );
  
  if (videos.length === 0) {
    console.error(`❌ Vidéo "${currentTitle}" non trouvée dans la base de données`);
    await connection.end();
    return;
  }
  
  const video = videos[0];
  console.log(`✅ Vidéo trouvée (ID: ${video.id})`);
  
  // Définir les changements de titres (du plus ancien au plus récent)
  const titleChanges = [
    { title: "Le TEMPS n'existe PAS : Le Paradoxe des Horloges", date: "12/19/2024" },
    { title: "La Preuve que le Temps n'existe pas : Le Paradoxe des Horloges", date: "01/11/2025" },
    { title: "Et si le Temps n'Existait pas ?", date: "01/14/2025" },
    { title: currentTitle, date: "01/14/2025" } // Titre actuel
  ];
  
  let testsCreated = 0;
  let variantsCreated = 0;
  
  // Créer un test A/B pour chaque transition
  for (let i = 0; i < titleChanges.length - 1; i++) {
    const previousTitle = titleChanges[i].title;
    const nextTitle = titleChanges[i + 1].title;
    const testDate = parseDate(titleChanges[i + 1].date);
    const completedDate = addDays(titleChanges[i + 1].date, 7);
    
    const testName = `Évolution titre ${i + 1}`;
    
    console.log(`\n📝 Création du test "${testName}"`);
    console.log(`   De: "${previousTitle.substring(0, 50)}..."`);
    console.log(`   Vers: "${nextTitle.substring(0, 50)}..."`);
    
    // Créer le test A/B
    const [testResult] = await connection.execute(
      `INSERT INTO abTests (userId, videoId, name, variantType, status, startDate, endDate, createdAt) 
       VALUES (?, ?, ?, 'text', 'completed', ?, ?, ?)`,
      [userId, video.id, testName, testDate, completedDate, testDate]
    );
    
    const testId = testResult.insertId;
    testsCreated++;
    
    // Créer la variante contrôle (titre précédent)
    await connection.execute(
      `INSERT INTO testVariants (userId, testId, title, thumbnailUrl, thumbnailTitle, prompt, isControl, views, watchTimePercentage, createdAt) 
       VALUES (?, ?, ?, '', NULL, NULL, 1, 100, 47.5, ?)`,
      [userId, testId, previousTitle, testDate]
    );
    variantsCreated++;
    
    // Créer la variante gagnante (titre suivant, +5%)
    await connection.execute(
      `INSERT INTO testVariants (userId, testId, title, thumbnailUrl, thumbnailTitle, prompt, isControl, views, watchTimePercentage, createdAt) 
       VALUES (?, ?, ?, '', NULL, NULL, 0, 100, 52.5, ?)`,
      [userId, testId, nextTitle, testDate]
    );
    variantsCreated++;
    
    console.log(`   ✅ Test A/B créé avec 2 variantes (47.5% vs 52.5%)`);
  }
  
  await connection.end();
  
  console.log(`\n✨ Terminé !`);
  console.log(`📊 ${testsCreated} tests A/B créés`);
  console.log(`📊 ${variantsCreated} variantes créées`);
}

main().catch(console.error);
