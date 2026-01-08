/**
 * Generate A/B Test Report for AI prompts
 * Creates a comprehensive text report of all A/B tests for a specific video
 */

import { getTestsByVideoId, getVariantsByTestId } from './db';
import type { ABTest, TestVariant } from '../drizzle/schema';

interface TestWithVariants {
  test: ABTest;
  variants: TestVariant[];
}

/**
 * Generate a comprehensive A/B test report for a video
 * This report is used as input for AI prompts ({{ab_test_report}} variable)
 */
export async function generateABTestReport(videoId: number, userId: number): Promise<string> {
  const tests = await getTestsByVideoId(videoId, userId);
  
  if (tests.length === 0) {
    return "Aucun test A/B n'a encore été réalisé pour cette vidéo.";
  }

  // Fetch variants for each test
  const testsWithVariants: TestWithVariants[] = [];
  for (const test of tests) {
    const variants = await getVariantsByTestId(test.id, userId);
    testsWithVariants.push({ test, variants });
  }

  // Build the report
  let report = `RAPPORT D'A/B TESTING - ${tests.length} test(s) réalisé(s)\n\n`;
  report += `═══════════════════════════════════════════════════════════════\n\n`;

  for (let i = 0; i < testsWithVariants.length; i++) {
    const { test, variants } = testsWithVariants[i];
    
    report += `TEST #${i + 1}: ${test.name}\n`;
    report += `─────────────────────────────────────────────────────────────\n`;
    report += `Type: ${test.type} | Variante: ${test.variantType}\n`;
    if (test.description) {
      report += `Description: ${test.description}\n`;
    }
    report += `Statut: ${test.status}\n`;
    if (test.startDate) {
      report += `Période: ${new Date(test.startDate).toLocaleDateString('fr-FR')}`;
      if (test.endDate) {
        report += ` → ${new Date(test.endDate).toLocaleDateString('fr-FR')}`;
      }
      report += `\n`;
    }
    report += `\n`;

    // Variants performance
    report += `VARIANTES TESTÉES (${variants.length}):\n\n`;
    
    // Sort variants by performance (watchTimePercentage first, then views)
    const sortedVariants = [...variants].sort((a, b) => {
      if (b.watchTimePercentage !== a.watchTimePercentage) {
        return (b.watchTimePercentage || 0) - (a.watchTimePercentage || 0);
      }
      return Number(b.views || 0) - Number(a.views || 0);
    });

    for (let j = 0; j < sortedVariants.length; j++) {
      const variant = sortedVariants[j];
      const isWinner = test.winnerId === variant.id;
      const isControl = variant.isControl;
      
      report += `  ${j + 1}. ${variant.title}`;
      if (isWinner) report += ` [GAGNANT]`;
      if (isControl) report += ` [CONTRÔLE]`;
      report += `\n`;
      
      // Metrics
      const watchTimePercent = variant.watchTimePercentage ? `${variant.watchTimePercentage}%` : 'N/A';
      const avgDuration = variant.averageViewDuration 
        ? `${Math.floor(variant.averageViewDuration / 60)}:${String(variant.averageViewDuration % 60).padStart(2, '0')}`
        : 'N/A';
      const watchTime = variant.watchTimeMinutes ? `${variant.watchTimeMinutes} min` : 'N/A';
      
      report += `     • Vues: ${variant.views || 0} | Likes: ${variant.likes || 0} | Commentaires: ${variant.comments || 0}\n`;
      report += `     • Répartition Watch Time: ${watchTimePercent} | Watch Time Total: ${watchTime}\n`;
      report += `     • Durée moyenne: ${avgDuration}\n`;
      
      if (variant.thumbnailTitle) {
        report += `     • Texte miniature: "${variant.thumbnailTitle}"\n`;
      }
      report += `\n`;
    }

    // Analysis summary
    if (test.winnerId) {
      const winner = variants.find(v => v.id === test.winnerId);
      if (winner) {
        report += `RÉSULTAT: Le titre gagnant est "${winner.title}"\n`;
        const control = variants.find(v => v.isControl);
        if (control && winner.id !== control.id) {
          const watchTimeImprovement = winner.watchTimePercentage && control.watchTimePercentage
            ? ((winner.watchTimePercentage - control.watchTimePercentage) / control.watchTimePercentage * 100).toFixed(1)
            : null;
          if (watchTimeImprovement) {
            report += `Amélioration du Watch Time: ${watchTimeImprovement}% vs contrôle\n`;
          }
        }
      }
    }

    report += `\n`;
    if (i < testsWithVariants.length - 1) {
      report += `═══════════════════════════════════════════════════════════════\n\n`;
    }
  }

  // Overall insights
  report += `\n═══════════════════════════════════════════════════════════════\n`;
  report += `ANALYSE GLOBALE:\n\n`;
  
  const allVariants = testsWithVariants.flatMap(t => t.variants);
  const winners = testsWithVariants
    .filter(t => t.test.winnerId)
    .map(t => t.variants.find(v => v.id === t.test.winnerId))
    .filter(Boolean) as TestVariant[];
  
  if (winners.length > 0) {
    report += `Nombre de tests complétés: ${winners.length}\n`;
    report += `\nTITRES GAGNANTS (par ordre chronologique):\n`;
    winners.forEach((winner, idx) => {
      report += `${idx + 1}. "${winner.title}"\n`;
    });
  }
  
  report += `\n═══════════════════════════════════════════════════════════════\n`;

  return report;
}

/**
 * Export A/B test report as downloadable text file
 */
export function formatReportForDownload(report: string, videoTitle: string): string {
  const header = `RAPPORT D'A/B TESTING
Vidéo: ${videoTitle}
Date d'export: ${new Date().toLocaleString('fr-FR')}

`;
  return header + report;
}
