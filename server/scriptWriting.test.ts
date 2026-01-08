import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  formatVideosAsCSV, 
  formatVideosForPrompt, 
  DEFAULT_SCRIPT_COORDINATION_PROMPT,
  type ChannelExportData 
} from "./scriptWriting";

// Mock data
const mockChannelData: ChannelExportData = {
  totalVideos: 3,
  totalViews: 150000,
  totalLikes: 5000,
  totalComments: 500,
  averageViews: 50000,
  videos: [
    {
      youtubeId: "video1",
      title: "Comment investir en bourse pour les débutants",
      description: "Dans cette vidéo, je vous explique les bases de l'investissement",
      views: 75000,
      likes: 2500,
      comments: 250,
      publishedAt: new Date("2024-01-15"),
      duration: "PT15M30S",
      thumbnail: "https://example.com/thumb1.jpg",
    },
    {
      youtubeId: "video2",
      title: "Les 5 erreurs à éviter en trading",
      description: "Découvrez les erreurs les plus courantes des traders débutants",
      views: 50000,
      likes: 1500,
      comments: 150,
      publishedAt: new Date("2024-02-20"),
      duration: "PT12M45S",
      thumbnail: "https://example.com/thumb2.jpg",
    },
    {
      youtubeId: "video3",
      title: "Analyse technique : les bases",
      description: "Apprenez les fondamentaux de l'analyse technique",
      views: 25000,
      likes: 1000,
      comments: 100,
      publishedAt: new Date("2024-03-10"),
      duration: "PT20M00S",
      thumbnail: "https://example.com/thumb3.jpg",
    },
  ],
};

describe("scriptWriting", () => {
  describe("formatVideosAsCSV", () => {
    it("should format videos as CSV with correct headers", () => {
      const csv = formatVideosAsCSV(mockChannelData);
      const lines = csv.split("\n");
      
      // Check headers
      expect(lines[0]).toBe("YouTube ID,Titre,Description,Vues,Likes,Commentaires,Date de publication,Durée");
      
      // Check that we have the right number of rows (header + 3 videos)
      expect(lines.length).toBe(4);
    });

    it("should correctly escape quotes in titles and descriptions", () => {
      const dataWithQuotes: ChannelExportData = {
        ...mockChannelData,
        videos: [{
          youtubeId: "test",
          title: 'Test "with quotes"',
          description: 'Description "with quotes"',
          views: 1000,
          likes: 100,
          comments: 10,
          publishedAt: new Date("2024-01-01"),
          duration: "PT10M",
          thumbnail: null,
        }],
      };
      
      const csv = formatVideosAsCSV(dataWithQuotes);
      expect(csv).toContain('""with quotes""');
    });

    it("should handle empty data", () => {
      const emptyData: ChannelExportData = {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        averageViews: 0,
        videos: [],
      };
      
      const csv = formatVideosAsCSV(emptyData);
      const lines = csv.split("\n");
      
      // Should only have headers
      expect(lines.length).toBe(1);
    });
  });

  describe("formatVideosForPrompt", () => {
    it("should format videos for prompt with statistics", () => {
      const formatted = formatVideosForPrompt(mockChannelData);
      
      expect(formatted).toContain("## STATISTIQUES DE LA CHAÎNE");
      expect(formatted).toContain("Total vidéos: 3");
      expect(formatted).toContain("## TOP 50 VIDÉOS");
    });

    it("should include video titles and view counts", () => {
      const formatted = formatVideosForPrompt(mockChannelData);
      
      expect(formatted).toContain("Comment investir en bourse pour les débutants");
      // Le format fr-FR utilise un espace insécable (\u00A0)
      expect(formatted).toMatch(/75[\s\u00A0]000 vues/);
    });

    it("should limit to 50 videos", () => {
      const manyVideos: ChannelExportData = {
        ...mockChannelData,
        totalVideos: 100,
        videos: Array.from({ length: 100 }, (_, i) => ({
          youtubeId: `video${i}`,
          title: `Video ${i}`,
          description: `Description ${i}`,
          views: 1000 - i,
          likes: 100,
          comments: 10,
          publishedAt: new Date(),
          duration: "PT10M",
          thumbnail: null,
        })),
      };
      
      const formatted = formatVideosForPrompt(manyVideos);
      
      // Should only have 50 videos listed
      expect(formatted).toContain("50.");
      expect(formatted).not.toContain("51.");
    });
  });

  describe("DEFAULT_SCRIPT_COORDINATION_PROMPT", () => {
    it("should contain all required guide tags", () => {
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("<<<GUIDE_TITRE>>>");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("<<<GUIDE_META_AB_TEST>>>");
    });

    it("should contain all required dynamic tags", () => {
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("{{channel_videos_data}}");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("{{script_topic}}");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("{{custom_instructions}}");
    });

    it("should contain script structure sections", () => {
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("PHASE 1: ACCROCHE");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("PHASE 2: CONTEXTE");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("PHASE 3: DÉVELOPPEMENT");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("PHASE 4: CLIMAX");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("PHASE 5: CONCLUSION");
    });

    it("should specify target word count", () => {
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("5000");
      expect(DEFAULT_SCRIPT_COORDINATION_PROMPT).toContain("6000");
    });
  });
});
