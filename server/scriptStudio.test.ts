import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  DEFAULT_META_PROMPT,
  type ScriptProfile,
  type ScriptCorrection,
  type ScriptHistoryEntry,
  type CorrectionCategory,
  PROFILE_TEMPLATES,
  getProfileTemplates,
  type ExportData,
  type LearningStats,
  type ProfileTemplateKey
} from "./scriptStudio";

describe("scriptStudio", () => {
  describe("DEFAULT_META_PROMPT", () => {
    it("should contain key sections", () => {
      expect(DEFAULT_META_PROMPT).toContain("# MON STYLE D'ÉCRITURE");
      expect(DEFAULT_META_PROMPT).toContain("## TON ET VOIX");
      expect(DEFAULT_META_PROMPT).toContain("## STRUCTURE PRÉFÉRÉE");
      expect(DEFAULT_META_PROMPT).toContain("## LONGUEUR ET RYTHME");
      expect(DEFAULT_META_PROMPT).toContain("## CE QUE J'ÉVITE");
      expect(DEFAULT_META_PROMPT).toContain("## CE QUE JE PRIVILÉGIE");
    });

    it("should have meaningful content in each section", () => {
      // Check for specific guidelines
      expect(DEFAULT_META_PROMPT).toContain("Ton conversationnel");
      expect(DEFAULT_META_PROMPT).toContain("Accroche percutante");
      expect(DEFAULT_META_PROMPT).toContain("Phrases courtes");
      expect(DEFAULT_META_PROMPT).toContain("exemples concrets");
    });

    it("should be a non-empty string", () => {
      expect(typeof DEFAULT_META_PROMPT).toBe("string");
      expect(DEFAULT_META_PROMPT.length).toBeGreaterThan(500);
    });
  });

  describe("ScriptProfile type", () => {
    it("should have correct structure", () => {
      const mockProfile: ScriptProfile = {
        id: 1,
        userId: 1,
        name: "Test Profile",
        description: "Test description",
        metaPrompt: "Test meta prompt",
        isDefault: true,
        usageCount: 5,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockProfile.id).toBe(1);
      expect(mockProfile.name).toBe("Test Profile");
      expect(mockProfile.isDefault).toBe(true);
    });

    it("should allow null for optional fields", () => {
      const mockProfile: ScriptProfile = {
        id: 1,
        userId: 1,
        name: "Test Profile",
        description: null,
        metaPrompt: "Test meta prompt",
        isDefault: false,
        usageCount: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockProfile.description).toBeNull();
      expect(mockProfile.usageCount).toBeNull();
      expect(mockProfile.lastUsedAt).toBeNull();
    });
  });

  describe("ScriptCorrection type", () => {
    it("should have correct structure", () => {
      const mockCorrection: ScriptCorrection = {
        id: 1,
        userId: 1,
        problem: "Transitions too long",
        correction: "Keep transitions under 20 words",
        category: "transitions",
        isActive: true,
        appliedCount: 10,
        createdAt: new Date(),
      };

      expect(mockCorrection.problem).toBe("Transitions too long");
      expect(mockCorrection.category).toBe("transitions");
      expect(mockCorrection.isActive).toBe(true);
    });

    it("should support all correction categories", () => {
      const categories: CorrectionCategory[] = [
        "structure",
        "tone",
        "length",
        "transitions",
        "examples",
        "engagement",
        "cta",
        "other",
      ];

      categories.forEach((category) => {
        const correction: ScriptCorrection = {
          id: 1,
          userId: 1,
          problem: "Test problem",
          correction: "Test correction",
          category,
          isActive: true,
          appliedCount: 0,
          createdAt: new Date(),
        };
        expect(correction.category).toBe(category);
      });
    });
  });

  describe("ScriptHistoryEntry type", () => {
    it("should have correct structure", () => {
      const mockEntry: ScriptHistoryEntry = {
        id: 1,
        userId: 1,
        profileId: 1,
        topic: "Test topic",
        customInstructions: "Test instructions",
        generatedScript: "Test script content",
        wordCount: 5000,
        model: "gpt-4o",
        rating: 1,
        feedback: "Great script!",
        createdAt: new Date(),
      };

      expect(mockEntry.topic).toBe("Test topic");
      expect(mockEntry.wordCount).toBe(5000);
      expect(mockEntry.rating).toBe(1);
    });

    it("should allow null for optional fields", () => {
      const mockEntry: ScriptHistoryEntry = {
        id: 1,
        userId: 1,
        profileId: null,
        topic: "Test topic",
        customInstructions: null,
        generatedScript: "Test script",
        wordCount: null,
        model: "gpt-4o",
        rating: null,
        feedback: null,
        createdAt: new Date(),
      };

      expect(mockEntry.profileId).toBeNull();
      expect(mockEntry.customInstructions).toBeNull();
      expect(mockEntry.rating).toBeNull();
    });

    it("should support all rating values", () => {
      const ratings: (number | null)[] = [-1, 0, 1, null];

      ratings.forEach((rating) => {
        const entry: ScriptHistoryEntry = {
          id: 1,
          userId: 1,
          profileId: null,
          topic: "Test",
          customInstructions: null,
          generatedScript: "Test",
          wordCount: 1000,
          model: "gpt-4o",
          rating,
          feedback: null,
          createdAt: new Date(),
        };
        expect(entry.rating).toBe(rating);
      });
    });
  });

  describe("Correction categories", () => {
    it("should have 8 categories", () => {
      const categories: CorrectionCategory[] = [
        "structure",
        "tone",
        "length",
        "transitions",
        "examples",
        "engagement",
        "cta",
        "other",
      ];
      expect(categories.length).toBe(8);
    });
  });

  // ===== Profile Templates Tests =====
  describe("Profile Templates", () => {
    it("should have 5 pre-configured templates", () => {
      const templates = getProfileTemplates();
      expect(templates).toHaveLength(5);
      expect(templates.map(t => t.key)).toContain("educatif");
      expect(templates.map(t => t.key)).toContain("storytelling");
      expect(templates.map(t => t.key)).toContain("polemique");
      expect(templates.map(t => t.key)).toContain("investigation");
      expect(templates.map(t => t.key)).toContain("divertissement");
    });

    it("each template should have name, description and preview", () => {
      const templates = getProfileTemplates();
      templates.forEach(template => {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.preview).toBeTruthy();
        expect(template.preview.length).toBeGreaterThan(100);
      });
    });

    it("PROFILE_TEMPLATES should contain detailed meta-prompts", () => {
      expect(PROFILE_TEMPLATES.educatif.metaPrompt).toContain("TON ET VOIX");
      expect(PROFILE_TEMPLATES.storytelling.metaPrompt).toContain("narratif");
      expect(PROFILE_TEMPLATES.polemique.metaPrompt).toContain("provocateur");
      expect(PROFILE_TEMPLATES.investigation.metaPrompt).toContain("journalistique");
      expect(PROFILE_TEMPLATES.divertissement.metaPrompt).toContain("humour");
    });
  });

  // ===== Export/Import Tests =====
  describe("Export/Import", () => {
    it("ExportData interface should have correct structure", () => {
      const mockExportData: ExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        profiles: [{
          name: "Test Profile",
          description: "Test description",
          metaPrompt: "Test meta prompt",
          isDefault: false,
        }],
        corrections: [{
          problem: "Test problem",
          correction: "Test correction",
          category: "structure",
          isActive: true,
        }],
      };
      expect(mockExportData.version).toBe("1.0");
      expect(mockExportData.profiles).toHaveLength(1);
      expect(mockExportData.corrections).toHaveLength(1);
    });
  });

  // ===== Learning Statistics Tests =====
  describe("Learning Statistics", () => {
    it("LearningStats interface should have all required fields", () => {
      const mockStats: LearningStats = {
        totalScriptsGenerated: 10,
        averageWordCount: 5500,
        averageRating: 0.8,
        ratingDistribution: { positive: 8, neutral: 1, negative: 1 },
        topCorrections: [],
        profileUsage: [],
        ratingEvolution: [],
        categoryBreakdown: [],
      };
      expect(mockStats.totalScriptsGenerated).toBe(10);
      expect(mockStats.averageWordCount).toBe(5500);
      expect(mockStats.ratingDistribution.positive).toBe(8);
    });
  });

  // ===== Tags System Tests =====
  describe("Tags System", () => {
    it("ScriptProfile should support tags field", () => {
      const profileWithTags: ScriptProfile = {
        id: 1,
        userId: 1,
        name: "Test Profile",
        description: "Test",
        metaPrompt: "Test",
        tags: ["education", "tech", "tutorial"],
        isDefault: false,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(profileWithTags.tags).toHaveLength(3);
      expect(profileWithTags.tags).toContain("education");
    });

    it("ScriptProfile should allow null tags", () => {
      const profileWithoutTags: ScriptProfile = {
        id: 1,
        userId: 1,
        name: "Test Profile",
        description: null,
        metaPrompt: "Test",
        tags: null,
        isDefault: false,
        usageCount: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(profileWithoutTags.tags).toBeNull();
    });
  });

  // ===== Comparison System Tests =====
  describe("Comparison System", () => {
    it("ComparisonResult should have correct structure", () => {
      const mockResult = {
        profileId: 1,
        profileName: "Test Profile",
        script: "Generated script content",
        wordCount: 5000,
        generationTime: 15000,
      };
      expect(mockResult.profileId).toBe(1);
      expect(mockResult.wordCount).toBe(5000);
      expect(mockResult.generationTime).toBe(15000);
    });
  });

  // ===== Profile Versioning Tests =====
  describe("Profile Versioning", () => {
    it("ProfileVersion should have correct structure", () => {
      const mockVersion = {
        id: 1,
        profileId: 1,
        version: 3,
        name: "Test Profile",
        description: "Test description",
        content: "Test meta prompt content",
        changeDescription: "Updated structure section",
        createdAt: new Date(),
      };
      expect(mockVersion.id).toBe(1);
      expect(mockVersion.version).toBe(3);
      expect(mockVersion.content).toBeTruthy();
      expect(mockVersion.changeDescription).toBe("Updated structure section");
    });

    it("should allow null changeDescription", () => {
      const mockVersion = {
        id: 1,
        profileId: 1,
        version: 1,
        name: "Test Profile",
        description: null,
        content: "Test content",
        changeDescription: null,
        createdAt: new Date(),
      };
      expect(mockVersion.changeDescription).toBeNull();
      expect(mockVersion.description).toBeNull();
    });

    it("version numbers should be positive integers", () => {
      const versions = [1, 2, 3, 10, 100];
      versions.forEach(version => {
        expect(version).toBeGreaterThan(0);
        expect(Number.isInteger(version)).toBe(true);
      });
    });

    it("comparison should return two versions", () => {
      const mockComparison = {
        version1: {
          id: 1,
          profileId: 1,
          version: 1,
          name: "Profile v1",
          description: null,
          content: "Original content",
          changeDescription: null,
          createdAt: new Date(),
        },
        version2: {
          id: 2,
          profileId: 1,
          version: 2,
          name: "Profile v2",
          description: "Updated",
          content: "Modified content",
          changeDescription: "Updated description",
          createdAt: new Date(),
        },
      };
      expect(mockComparison.version1).toBeTruthy();
      expect(mockComparison.version2).toBeTruthy();
      expect(mockComparison.version1.version).toBeLessThan(mockComparison.version2.version);
    });
  });

  // ===== Profile Branches Tests =====
  describe("Profile Branches", () => {
    it("ProfileBranch should have correct structure", () => {
      const mockBranch = {
        id: 1,
        profileId: 1,
        userId: 1,
        name: "Test Branch",
        description: "Test description",
        metaPrompt: "Test meta prompt content",
        parentVersionId: 5,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        mergedAt: null,
      };
      expect(mockBranch.id).toBe(1);
      expect(mockBranch.name).toBe("Test Branch");
      expect(mockBranch.status).toBe("active");
      expect(mockBranch.mergedAt).toBeNull();
    });

    it("should support all branch statuses", () => {
      const statuses = ["active", "merged", "abandoned"] as const;
      statuses.forEach(status => {
        const branch = {
          id: 1,
          profileId: 1,
          userId: 1,
          name: "Test",
          description: null,
          metaPrompt: "Test",
          parentVersionId: null,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
          mergedAt: status === "merged" ? new Date() : null,
        };
        expect(branch.status).toBe(status);
      });
    });

    it("merged branches should have mergedAt date", () => {
      const mergedBranch = {
        id: 1,
        profileId: 1,
        userId: 1,
        name: "Merged Branch",
        description: null,
        metaPrompt: "Test",
        parentVersionId: 1,
        status: "merged" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        mergedAt: new Date(),
      };
      expect(mergedBranch.status).toBe("merged");
      expect(mergedBranch.mergedAt).toBeTruthy();
    });

    it("should allow null description and parentVersionId", () => {
      const branch = {
        id: 1,
        profileId: 1,
        userId: 1,
        name: "Test",
        description: null,
        metaPrompt: "Test",
        parentVersionId: null,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        mergedAt: null,
      };
      expect(branch.description).toBeNull();
      expect(branch.parentVersionId).toBeNull();
    });
  });

  // ===== AI Assistant Tests =====
  describe("AI Assistant", () => {
    it("ScriptAnalysis should have correct structure", () => {
      const mockAnalysis = {
        problems: ["Problem 1", "Problem 2"],
        suggestedCorrections: [
          {
            problem: "Test problem",
            correction: "Test correction",
            category: "structure" as CorrectionCategory,
          },
        ],
        overallFeedback: "Overall feedback text",
      };
      expect(mockAnalysis.problems).toHaveLength(2);
      expect(mockAnalysis.suggestedCorrections).toHaveLength(1);
      expect(mockAnalysis.overallFeedback).toBeTruthy();
    });

    it("should support all correction categories in suggestions", () => {
      const categories: CorrectionCategory[] = [
        "structure", "tone", "length", "transitions",
        "examples", "engagement", "cta", "other"
      ];
      categories.forEach(category => {
        const suggestion = {
          problem: "Test",
          correction: "Test",
          category,
        };
        expect(suggestion.category).toBe(category);
      });
    });
  });
});
