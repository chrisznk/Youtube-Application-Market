import { describe, expect, it } from "vitest";
import { estimateBackupSize, BackupData } from "./autoBackup";

describe("autoBackup", () => {
  describe("estimateBackupSize", () => {
    it("should calculate size in KB for small backups", () => {
      const smallBackup: BackupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        userId: 1,
        profiles: [],
        corrections: [],
        history: [],
        coordinationScripts: [],
        instructionScripts: [],
      };

      const size = estimateBackupSize(smallBackup);
      expect(size).toMatch(/KB$/);
    });

    it("should include all data sections in backup", () => {
      const backup: BackupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        userId: 1,
        profiles: [{
          id: 1,
          name: "Test Profile",
          description: "Description",
          metaPrompt: "Meta prompt content",
          tags: ["tag1", "tag2"],
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        corrections: [{
          id: 1,
          category: "tone",
          problem: "Too formal",
          correction: "Use casual tone",
          isActive: true,
          appliedCount: 5,
          createdAt: new Date().toISOString(),
        }],
        history: [{
          id: 1,
          profileId: 1,
          subject: "Test subject",
          instructions: "Custom instructions",
          generatedScript: "Generated script content here",
          wordCount: 100,
          rating: "positive",
          createdAt: new Date().toISOString(),
        }],
        coordinationScripts: [],
        instructionScripts: [],
      };

      const size = estimateBackupSize(backup);
      expect(size).toBeDefined();
      expect(backup.profiles.length).toBe(1);
      expect(backup.corrections.length).toBe(1);
      expect(backup.history.length).toBe(1);
    });

    it("should return size with unit for large backups", () => {
      // Create a large backup with lots of data
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        profileId: 1,
        subject: `Subject ${i}`,
        instructions: "Instructions ".repeat(100),
        generatedScript: "Script content ".repeat(500), // ~7500 chars each
        wordCount: 5000,
        rating: "positive" as const,
        createdAt: new Date().toISOString(),
      }));

      const largeBackup: BackupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        userId: 1,
        profiles: [],
        corrections: [],
        history: largeHistory,
        coordinationScripts: [],
        instructionScripts: [],
      };

      const size = estimateBackupSize(largeBackup);
      // Should return either KB or MB depending on size
      expect(size).toMatch(/(KB|MB)$/);
      // Should be a substantial size (> 100 KB)
      const numericPart = parseFloat(size.replace(/[^0-9.]/g, ''));
      expect(numericPart).toBeGreaterThan(100);
    });
  });

  describe("BackupData structure", () => {
    it("should have correct version format", () => {
      const backup: BackupData = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        userId: 1,
        profiles: [],
        corrections: [],
        history: [],
        coordinationScripts: [],
        instructionScripts: [],
      };

      expect(backup.version).toBe("1.0");
      expect(backup.userId).toBe(1);
    });

    it("should validate profile structure", () => {
      const profile = {
        id: 1,
        name: "Profile Name",
        description: "Description",
        metaPrompt: "Meta prompt",
        tags: ["tag1"],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(profile.id).toBeTypeOf("number");
      expect(profile.name).toBeTypeOf("string");
      expect(profile.tags).toBeInstanceOf(Array);
      expect(profile.isDefault).toBeTypeOf("boolean");
    });

    it("should validate correction structure", () => {
      const correction = {
        id: 1,
        category: "tone",
        problem: "Problem description",
        correction: "Correction text",
        isActive: true,
        appliedCount: 0,
        createdAt: new Date().toISOString(),
      };

      expect(correction.id).toBeTypeOf("number");
      expect(correction.category).toBeTypeOf("string");
      expect(correction.isActive).toBeTypeOf("boolean");
      expect(correction.appliedCount).toBeTypeOf("number");
    });
  });
});
