import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the dataApi module
vi.mock("./_core/dataApi", () => ({
  callDataApi: vi.fn(),
}));

// Mock the llm module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { callDataApi } from "./_core/dataApi";
import { invokeLLM } from "./_core/llm";
import {
  searchRedditTrends,
  searchTikTokTrends,
  generateGoogleTrends,
  generateNewsTrends,
  suggestSubreddits,
} from "./trends";

describe("Trends Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchRedditTrends", () => {
    it("should return Reddit posts as trends", async () => {
      const mockPosts = {
        posts: [
          {
            data: {
              title: "Test Reddit Post",
              selftext: "This is a test post content",
              permalink: "/r/test/comments/123",
              score: 1500,
              num_comments: 250,
              author: "testuser",
              created_utc: 1702800000,
              thumbnail: "https://example.com/thumb.jpg",
            },
          },
        ],
        success: true,
      };

      vi.mocked(callDataApi).mockResolvedValue(mockPosts);

      const result = await searchRedditTrends("technology");

      expect(result.source).toBe("reddit");
      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].title).toBe("Test Reddit Post");
      expect(result.trends[0].engagement?.score).toBe(1500);
      expect(result.trends[0].engagement?.comments).toBe(250);
      expect(result.trends[0].author).toBe("testuser");
    });

    it("should handle empty results", async () => {
      vi.mocked(callDataApi).mockResolvedValue({ posts: [], success: true });

      const result = await searchRedditTrends("nonexistent");

      expect(result.source).toBe("reddit");
      expect(result.trends).toHaveLength(0);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(callDataApi).mockRejectedValue(new Error("API Error"));

      const result = await searchRedditTrends("test");

      expect(result.source).toBe("reddit");
      expect(result.trends).toHaveLength(0);
      expect(result.error).toBeDefined();
    });
  });

  describe("searchTikTokTrends", () => {
    it("should return TikTok videos as trends", async () => {
      const mockVideos = {
        data: [
          {
            desc: "Amazing TikTok video about AI",
            statistics: {
              play_count: 1000000,
              digg_count: 50000,
              comment_count: 2000,
              share_count: 5000,
            },
            author: {
              nickname: "creator123",
              unique_id: "creator123",
            },
            create_time: 1702800000,
            video: {
              cover: "https://example.com/cover.jpg",
            },
          },
        ],
      };

      vi.mocked(callDataApi).mockResolvedValue(mockVideos);

      const result = await searchTikTokTrends("AI");

      expect(result.source).toBe("tiktok");
      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].title).toBe("Amazing TikTok video about AI");
      expect(result.trends[0].engagement?.views).toBe(1000000);
      expect(result.trends[0].engagement?.likes).toBe(50000);
    });
  });

  describe("generateGoogleTrends", () => {
    it("should generate Google Trends via LLM", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                trends: [
                  {
                    query: "intelligence artificielle 2024",
                    volume: 85,
                    trend: "rising",
                    relatedTopics: ["ChatGPT", "machine learning", "automation"],
                  },
                  {
                    query: "comment utiliser l'IA",
                    volume: 72,
                    trend: "stable",
                    relatedTopics: ["tutoriel IA", "outils IA", "productivité"],
                  },
                ],
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse);

      const result = await generateGoogleTrends("intelligence artificielle");

      expect(result.source).toBe("google_trends");
      expect(result.trends).toHaveLength(2);
      expect(result.trends[0].title).toBe("intelligence artificielle 2024");
      expect(result.trends[0].engagement?.score).toBe(85);
      expect(result.trends[0].hashtags).toContain("ChatGPT");
    });

    it("should handle LLM errors gracefully", async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM Error"));

      const result = await generateGoogleTrends("test");

      expect(result.source).toBe("google_trends");
      expect(result.trends).toHaveLength(0);
      expect(result.error).toBeDefined();
    });
  });

  describe("generateNewsTrends", () => {
    it("should generate news trends via LLM", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                news: [
                  {
                    headline: "OpenAI lance GPT-5",
                    summary: "OpenAI a annoncé le lancement de GPT-5 avec des capacités révolutionnaires.",
                    angle: "Analyse des nouvelles fonctionnalités et impact sur le marché",
                    urgency: "breaking",
                  },
                ],
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse);

      const result = await generateNewsTrends("IA");

      expect(result.source).toBe("news");
      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].title).toBe("OpenAI lance GPT-5");
      expect(result.trends[0].hashtags).toContain("breaking");
    });
  });

  describe("suggestSubreddits", () => {
    it("should suggest relevant subreddits", async () => {
      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                subreddits: ["technology", "MachineLearning", "artificial", "futurology", "singularity"],
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse);

      const result = await suggestSubreddits("intelligence artificielle");

      expect(result).toHaveLength(5);
      expect(result).toContain("technology");
      expect(result).toContain("MachineLearning");
    });

    it("should return default subreddits on error", async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error("LLM Error"));

      const result = await suggestSubreddits("test");

      expect(result).toEqual(["all", "popular"]);
    });
  });
});
