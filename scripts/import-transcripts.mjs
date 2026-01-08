import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
const UPLOAD_DIR = '/home/ubuntu/upload';

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Normalise un titre pour le matching (enlève espaces, ponctuation, met en minuscules)
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Calcule la similarité entre deux chaînes (Levenshtein distance simplifiée)
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Extrait le titre du nom de fichier
function extractTitleFromFilename(filename) {
  // Format: [French(auto-generated)]TitreDeVidéo[DownSub.com].txt
  const match = filename.match(/\[French\(auto-generated\)\](.+?)\[DownSub\.com\]/);
  if (match) {
    let title = match[1];
    // Enlève les numéros de version (1), (2), etc.
    title = title.replace(/\(\d+\)$/, '');
    // Décode les caractères spéciaux
    title = title
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Ajoute des espaces entre minuscules et majuscules
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Ajoute des espaces entre majuscules
      .replace(/_/g, ' ')
      .replace(/'/g, "'")
      .trim();
    return title;
  }
  return null;
}

// Extrait des mots-clés du contenu pour deviner le sujet
function extractKeywords(content) {
  const lines = content.split('\n').slice(0, 100).join(' '); // Premières 100 lignes
  const words = lines.toLowerCase().match(/\b\w{4,}\b/g) || [];
  
  // Compte les occurrences
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Filtre les mots communs
  const stopWords = new Set(['dans', 'avec', 'pour', 'plus', 'tout', 'tous', 'cette', 'comme', 'peut', 'fait', 'dire', 'être', 'avoir', 'faire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir', 'devoir', 'prendre', 'donner', 'trouver', 'passer', 'mettre', 'parler', 'aimer', 'suivre', 'vivre', 'croire', 'tenir', 'devenir', 'laisser', 'porter', 'partir', 'arriver', 'penser', 'rester', 'sembler', 'falloir', 'comprendre', 'attendre', 'entendre', 'rendre', 'perdre', 'répondre', 'descendre', 'vendre', 'défendre', 'dépendre', 'suspendre', 'étendre', 'tendre', 'fendre', 'pendre']);
  
  // Retourne les mots les plus fréquents (hors stop words)
  return Object.entries(wordCount)
    .filter(([word]) => !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

async function main() {
  console.log('🚀 Import des transcriptions...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Récupérer toutes les vidéos
  const [videos] = await connection.execute('SELECT id, title FROM videos');
  console.log(`📹 ${videos.length} vidéos trouvées dans la base de données\n`);
  
  // Lister tous les fichiers de transcription
  const files = await fs.readdir(UPLOAD_DIR);
  const transcriptFiles = files.filter(f => 
    f.startsWith('[French') || f.startsWith('téléchargement')
  );
  
  console.log(`📄 ${transcriptFiles.length} fichiers de transcription trouvés\n`);
  
  let matched = 0;
  let unmatched = 0;
  const unmatchedFiles = [];
  
  for (const filename of transcriptFiles) {
    const filePath = path.join(UPLOAD_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    
    let bestMatch = null;
    let bestScore = 0;
    
    // Essayer d'extraire le titre du nom de fichier
    const extractedTitle = extractTitleFromFilename(filename);
    
    if (extractedTitle) {
      console.log(`📝 Fichier: ${filename}`);
      console.log(`   Titre extrait: ${extractedTitle}`);
      
      // Chercher la meilleure correspondance
      const normalizedExtracted = normalizeTitle(extractedTitle);
      
      for (const video of videos) {
        const normalizedVideo = normalizeTitle(video.title);
        const score = similarity(normalizedExtracted, normalizedVideo);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = video;
        }
      }
    } else {
      // Fichier "téléchargement" - analyser le contenu
      console.log(`📝 Fichier: ${filename} (analyse du contenu...)`);
      const keywords = extractKeywords(content);
      console.log(`   Mots-clés: ${keywords.slice(0, 5).join(', ')}...`);
      
      // Chercher la vidéo qui contient le plus de mots-clés
      for (const video of videos) {
        const normalizedVideo = normalizeTitle(video.title);
        let score = 0;
        
        for (const keyword of keywords) {
          if (normalizedVideo.includes(keyword)) {
            score += 1;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = video;
        }
      }
    }
    
    if (bestMatch && bestScore > 0.5) {
      console.log(`   ✅ Match trouvé: "${bestMatch.title}" (score: ${(bestScore * 100).toFixed(1)}%)`);
      
      // Mettre à jour la transcription
      await connection.execute(
        'UPDATE videos SET transcript = ? WHERE id = ?',
        [content, bestMatch.id]
      );
      
      matched++;
    } else {
      console.log(`   ❌ Aucun match trouvé (meilleur score: ${(bestScore * 100).toFixed(1)}%)`);
      unmatchedFiles.push({ filename, bestMatch: bestMatch?.title, score: bestScore });
      unmatched++;
    }
    
    console.log('');
  }
  
  await connection.end();
  
  console.log('\n✨ Terminé !');
  console.log(`✅ ${matched} transcriptions importées`);
  console.log(`❌ ${unmatched} fichiers non matchés`);
  
  if (unmatchedFiles.length > 0) {
    console.log('\n📋 Fichiers non matchés:');
    unmatchedFiles.forEach(({ filename, bestMatch, score }) => {
      console.log(`   - ${filename}`);
      if (bestMatch) {
        console.log(`     Meilleur match: "${bestMatch}" (${(score * 100).toFixed(1)}%)`);
      }
    });
  }
}

main().catch(console.error);
