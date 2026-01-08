import PDFDocument from "pdfkit";
import type { ABTest } from "../drizzle/schema";

interface VariantData {
  id: number;
  title: string;
  isControl: boolean;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  watchTimePercentage: number | null;
  watchTimeMinutes: number | null;
  averageViewDuration: number | null;
  thumbnailUrl: string;
  thumbnailTitle: string | null;
  prompt: string | null;
}

interface ExportData {
  test: ABTest;
  variants: VariantData[];
}

export async function generateTestReportPDF(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Rapport de Test A/B", { align: "center" });

      doc.moveDown();

      // Test Information
      doc.fontSize(16).font("Helvetica-Bold").text("Informations du Test");
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica");
      doc.text(`Nom: ${data.test.name}`);
      doc.text(`Type: ${data.test.type}`);
      doc.text(`Statut: ${data.test.status}`);
      if (data.test.description) {
        doc.text(`Description: ${data.test.description}`);
      }
      doc.text(`Créé le: ${new Date(data.test.createdAt).toLocaleDateString("fr-FR")}`);
      if (data.test.startDate) {
        doc.text(`Date de début: ${new Date(data.test.startDate).toLocaleDateString("fr-FR")}`);
      }
      if (data.test.endDate) {
        doc.text(`Date de fin: ${new Date(data.test.endDate).toLocaleDateString("fr-FR")}`);
      }

      doc.moveDown(2);

      // Variants Performance Table
      doc.fontSize(16).font("Helvetica-Bold").text("Performance des Variantes");
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [180, 70, 70, 70, 70];

      // Table Header
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Variante", tableLeft, tableTop);
      doc.text("Vues", tableLeft + colWidths[0], tableTop);
      doc.text("Watch %", tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text("Likes", tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.text("Comments", tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);

      // Draw header line
      doc
        .moveTo(tableLeft, tableTop + 15)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
        .stroke();

      // Table Rows
      let currentY = tableTop + 25;
      doc.font("Helvetica");

      data.variants.forEach((variant) => {
        const watchTimePercent = variant.watchTimePercentage ? `${variant.watchTimePercentage}%` : "0%";
        const variantName = variant.isControl ? `${variant.title} (Contrôle)` : variant.title;

        doc.text(variantName.substring(0, 35), tableLeft, currentY, { width: colWidths[0] - 10 });
        doc.text((variant.views || 0).toLocaleString(), tableLeft + colWidths[0], currentY);
        doc.text(watchTimePercent, tableLeft + colWidths[0] + colWidths[1], currentY);
        doc.text((variant.likes || 0).toLocaleString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY);
        doc.text((variant.comments || 0).toLocaleString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY);

        currentY += 30;

        // Add new page if needed
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      });

      doc.moveDown(3);

      // Winner Section
      if (data.test.winnerId) {
        const winner = data.variants.find((v) => v.id === data.test.winnerId);
        if (winner) {
          doc.fontSize(14).font("Helvetica-Bold").fillColor("#10b981").text("🏆 Variante Gagnante");
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica").fillColor("#000000");
          doc.text(`Titre: ${winner.title}`);
          doc.text(`Watch Time: ${winner.watchTimePercentage ? `${winner.watchTimePercentage}%` : "0%"}`);
          doc.text(`Vues: ${(winner.views || 0).toLocaleString()}`);
          doc.text(`Likes: ${(winner.likes || 0).toLocaleString()}`);
        }
      }

      doc.moveDown(3);

      // Summary Statistics
      doc.fontSize(14).font("Helvetica-Bold").text("Statistiques Globales");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");

      const totalViews = data.variants.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = data.variants.reduce((sum, v) => sum + (v.likes || 0), 0);
      const totalComments = data.variants.reduce((sum, v) => sum + (v.comments || 0), 0);
      const totalWatchTime = data.variants.reduce((sum, v) => sum + (v.watchTimeMinutes || 0), 0);

      doc.text(`Total Vues: ${totalViews.toLocaleString()}`);
      doc.text(`Total Likes: ${totalLikes.toLocaleString()}`);
      doc.text(`Total Commentaires: ${totalComments.toLocaleString()}`);
      doc.text(`Watch Time Total: ${totalWatchTime.toLocaleString()} minutes`);
      doc.text(`Nombre de Variantes: ${data.variants.length}`);

      // Footer
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(
          `Rapport généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
          50,
          doc.page.height - 50,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
