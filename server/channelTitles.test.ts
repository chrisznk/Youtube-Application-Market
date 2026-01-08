import { describe, expect, it, vi } from "vitest";
import { formatChannelTitlesForPrompt, type ChannelTitle } from "./channelTitles";

describe("channelTitles", () => {
  describe("formatChannelTitlesForPrompt", () => {
    it("returns appropriate message for empty titles array", () => {
      const result = formatChannelTitlesForPrompt([]);
      expect(result).toBe("Aucun titre de chaîne disponible.");
    });

    it("formats titles sorted by view count", () => {
      const titles: ChannelTitle[] = [
        { videoId: "vid1", title: "Titre avec peu de vues", publishedAt: "1 day ago", viewCount: 1000 },
        { videoId: "vid2", title: "Titre avec beaucoup de vues", publishedAt: "2 days ago", viewCount: 50000 },
        { videoId: "vid3", title: "Titre moyen", publishedAt: "3 days ago", viewCount: 10000 },
      ];

      const result = formatChannelTitlesForPrompt(titles);

      // Should contain the header
      expect(result).toContain("=== RAPPORT DES TITRES ACTUELS DE LA CHAÎNE ===");
      
      // Should contain all titles
      expect(result).toContain("Titre avec beaucoup de vues");
      expect(result).toContain("Titre moyen");
      expect(result).toContain("Titre avec peu de vues");
      
      // Should have the most viewed title first (rank 1)
      const lines = result.split('\n');
      const firstTitleLine = lines.find(line => line.includes('1. "'));
      expect(firstTitleLine).toContain("Titre avec beaucoup de vues");
    });

    it("includes pattern analysis section", () => {
      const titles: ChannelTitle[] = [
        { videoId: "vid1", title: "Comment devenir riche ?", publishedAt: "1 day ago", viewCount: 1000 },
        { videoId: "vid2", title: "Pourquoi les riches sont riches !", publishedAt: "2 days ago", viewCount: 2000 },
        { videoId: "vid3", title: "Le secret des millionnaires...", publishedAt: "3 days ago", viewCount: 3000 },
      ];

      const result = formatChannelTitlesForPrompt(titles);

      // Should contain pattern analysis
      expect(result).toContain("--- ANALYSE DES PATTERNS ---");
      expect(result).toContain("Mots-clés les plus fréquents:");
      expect(result).toContain("Structures utilisées:");
      expect(result).toContain("Questions (?)");
      expect(result).toContain("Exclamations (!)");
      expect(result).toContain("Suspense (...)");
    });

    it("correctly counts structure patterns", () => {
      const titles: ChannelTitle[] = [
        { videoId: "vid1", title: "Question ?", publishedAt: "1 day ago", viewCount: 1000 },
        { videoId: "vid2", title: "Exclamation !", publishedAt: "2 days ago", viewCount: 2000 },
        { videoId: "vid3", title: "Suspense...", publishedAt: "3 days ago", viewCount: 3000 },
        { videoId: "vid4", title: "MAJUSCULES", publishedAt: "4 days ago", viewCount: 4000 },
        { videoId: "vid5", title: "Normal", publishedAt: "5 days ago", viewCount: 5000 },
      ];

      const result = formatChannelTitlesForPrompt(titles);

      // Should show 1 question (20%)
      expect(result).toContain("Questions (?) : 1 titres (20%)");
      // Should show 1 exclamation (20%)
      expect(result).toContain("Exclamations (!) : 1 titres (20%)");
      // Should show 1 suspense (20%)
      expect(result).toContain("Suspense (...) : 1 titres (20%)");
      // Should show 1 majuscules (20%)
      expect(result).toContain("Majuscules d'emphase : 1 titres (20%)");
    });

    it("formats view counts with French locale", () => {
      const titles: ChannelTitle[] = [
        { videoId: "vid1", title: "Titre populaire", publishedAt: "1 day ago", viewCount: 1234567 },
      ];

      const result = formatChannelTitlesForPrompt(titles);

      // French locale uses space or non-breaking space as thousand separator
      // The exact format may vary, but it should contain the number
      expect(result).toMatch(/1[\s\u00A0]?234[\s\u00A0]?567/);
    });

    it("includes explanation about A/B testing and trends", () => {
      const titles: ChannelTitle[] = [
        { videoId: "vid1", title: "Test", publishedAt: "1 day ago", viewCount: 1000 },
      ];

      const result = formatChannelTitlesForPrompt(titles);

      expect(result).toContain("A/B testing continu");
      expect(result).toContain("tendances actuelles");
      expect(result).toContain("formulations qui génèrent le plus de clics");
    });
  });
});
