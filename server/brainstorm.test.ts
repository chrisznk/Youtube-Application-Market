import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./instructionScripts", () => ({
  getActiveInstructionScript: vi.fn(),
}));

vi.mock("./db", () => ({
  getVideosByUserId: vi.fn(),
}));

import { generateVideoIdeas, generatePostProduction, rateGeneration } from "./brainstorm";
import { invokeLLM } from "./_core/llm";
import { getActiveInstructionScript } from "./instructionScripts";
import { getVideosByUserId } from "./db";

describe("brainstorm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateVideoIdeas", () => {
    it("should generate 10 video ideas based on channel data", async () => {
      // Mock instruction scripts
      (getActiveInstructionScript as any).mockResolvedValue({
        content: "Test script content",
      });

      // Mock videos
      (getVideosByUserId as any).mockResolvedValue([
        {
          title: "Test Video 1",
          description: "Description 1",
          viewCount: 1000,
          likeCount: 100,
          commentCount: 50,
          publishedAt: new Date(),
        },
        {
          title: "Test Video 2",
          description: "Description 2",
          viewCount: 2000,
          likeCount: 200,
          commentCount: 100,
          publishedAt: new Date(),
        },
      ]);

      // Mock LLM response
      const mockIdeas = [
        { title: "Idea 1", summary: "Summary 1" },
        { title: "Idea 2", summary: "Summary 2" },
        { title: "Idea 3", summary: "Summary 3" },
        { title: "Idea 4", summary: "Summary 4" },
        { title: "Idea 5", summary: "Summary 5" },
        { title: "Idea 6", summary: "Summary 6" },
        { title: "Idea 7", summary: "Summary 7" },
        { title: "Idea 8", summary: "Summary 8" },
        { title: "Idea 9", summary: "Summary 9" },
        { title: "Idea 10", summary: "Summary 10" },
      ];

      (invokeLLM as any).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ ideas: mockIdeas }),
            },
          },
        ],
      });

      const result = await generateVideoIdeas(1, "gpt-4o");

      expect(result.ideas).toHaveLength(10);
      expect(result.ideas[0]).toHaveProperty("title");
      expect(result.ideas[0]).toHaveProperty("summary");
      expect(getActiveInstructionScript).toHaveBeenCalledTimes(3);
      expect(getVideosByUserId).toHaveBeenCalledWith(1);
    });

    it("should throw error when LLM returns no content", async () => {
      (getActiveInstructionScript as any).mockResolvedValue({ content: "Test" });
      (getVideosByUserId as any).mockResolvedValue([]);
      (invokeLLM as any).mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(generateVideoIdeas(1, "gpt-4o")).rejects.toThrow("Pas de réponse de l'IA");
    });
  });

  describe("generatePostProduction", () => {
    it("should generate post-production content from transcript", async () => {
      (getActiveInstructionScript as any).mockResolvedValue({
        content: "Test script content",
      });

      const mockResult = {
        titles: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5", "Title 6", "Title 7", "Title 8", "Title 9", "Title 10"],
        thumbnailIdeas: ["Thumb 1", "Thumb 2", "Thumb 3", "Thumb 4", "Thumb 5", "Thumb 6", "Thumb 7", "Thumb 8", "Thumb 9", "Thumb 10"],
        tagsSets: ["tag1, tag2, tag3", "tag4, tag5, tag6"],
        descriptions: ["Description 1", "Description 2"],
      };

      (invokeLLM as any).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResult),
            },
          },
        ],
      });

      const result = await generatePostProduction(1, "gpt-4o", "This is a test transcript with more than 100 characters to pass validation. Lorem ipsum dolor sit amet.");

      expect(result.titles).toHaveLength(10);
      expect(result.thumbnailIdeas).toHaveLength(10);
      expect(result.tagsSets).toHaveLength(2);
      expect(result.descriptions).toHaveLength(2);
    });

    it("should truncate tags to 500 characters", async () => {
      (getActiveInstructionScript as any).mockResolvedValue({
        content: "Test script content",
      });

      // Create tags longer than 500 characters
      const longTags = "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13, tag14, tag15, tag16, tag17, tag18, tag19, tag20, tag21, tag22, tag23, tag24, tag25, tag26, tag27, tag28, tag29, tag30, tag31, tag32, tag33, tag34, tag35, tag36, tag37, tag38, tag39, tag40, tag41, tag42, tag43, tag44, tag45, tag46, tag47, tag48, tag49, tag50, tag51, tag52, tag53, tag54, tag55, tag56, tag57, tag58, tag59, tag60, tag61, tag62, tag63, tag64, tag65, tag66, tag67, tag68, tag69, tag70";

      const mockResult = {
        titles: ["Title 1"],
        thumbnailIdeas: ["Thumb 1"],
        tagsSets: [longTags, "short tags"],
        descriptions: ["Description 1"],
      };

      (invokeLLM as any).mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResult),
            },
          },
        ],
      });

      const result = await generatePostProduction(1, "gpt-4o", "This is a test transcript with more than 100 characters to pass validation. Lorem ipsum dolor sit amet.");

      // First tag set should be truncated to 500 characters or less
      expect(result.tagsSets[0].length).toBeLessThanOrEqual(500);
    });
  });

  describe("rateGeneration", () => {
    it("should log rating without throwing", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await expect(rateGeneration(1, "video_ideas", "gpt-4o", 1)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Brainstorm]")
      );

      consoleSpy.mockRestore();
    });
  });
});
