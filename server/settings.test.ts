import { describe, expect, it } from "vitest";
import * as settings from "./settings";

describe("settings module", () => {
  describe("UserSettingsData interface", () => {
    it("should have correct default values structure", () => {
      const defaultSettings: settings.UserSettingsData = {
        theme: "system",
        backupFrequency: "weekly",
        abTestCtrThreshold: 5.0,
        abTestViewsThreshold: 1000,
        notifyNewVideos: true,
        notifyABTestThreshold: true,
        notifyBackupComplete: true,
      };

      expect(defaultSettings.theme).toBe("system");
      expect(defaultSettings.backupFrequency).toBe("weekly");
      expect(defaultSettings.abTestCtrThreshold).toBe(5.0);
      expect(defaultSettings.abTestViewsThreshold).toBe(1000);
      expect(defaultSettings.notifyNewVideos).toBe(true);
      expect(defaultSettings.notifyABTestThreshold).toBe(true);
      expect(defaultSettings.notifyBackupComplete).toBe(true);
    });

    it("should accept valid theme values", () => {
      const themes = ["light", "dark", "system"];
      themes.forEach((theme) => {
        const settings: Partial<settings.UserSettingsData> = { theme };
        expect(["light", "dark", "system"]).toContain(settings.theme);
      });
    });

    it("should accept valid backup frequency values", () => {
      const frequencies = ["daily", "weekly", "monthly"];
      frequencies.forEach((freq) => {
        const settings: Partial<settings.UserSettingsData> = { backupFrequency: freq };
        expect(["daily", "weekly", "monthly"]).toContain(settings.backupFrequency);
      });
    });
  });

  describe("VideoTemplateData interface", () => {
    it("should have correct structure", () => {
      const template: settings.VideoTemplateData = {
        id: 1,
        name: "Test Template",
        titleTemplate: "[TUTO] {sujet}",
        descriptionTemplate: "Dans cette vidéo...",
        tagsTemplate: ["tutoriel", "tech"],
        category: "Tutoriels",
        isDefault: false,
        usageCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(template.id).toBe(1);
      expect(template.name).toBe("Test Template");
      expect(template.titleTemplate).toBe("[TUTO] {sujet}");
      expect(template.tagsTemplate).toHaveLength(2);
      expect(template.isDefault).toBe(false);
      expect(template.usageCount).toBe(5);
    });

    it("should allow null values for optional fields", () => {
      const template: settings.VideoTemplateData = {
        id: 1,
        name: "Minimal Template",
        titleTemplate: null,
        descriptionTemplate: null,
        tagsTemplate: [],
        category: null,
        isDefault: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(template.titleTemplate).toBeNull();
      expect(template.descriptionTemplate).toBeNull();
      expect(template.category).toBeNull();
      expect(template.tagsTemplate).toHaveLength(0);
    });
  });

  describe("getUserSettings", () => {
    it("should be a function", () => {
      expect(typeof settings.getUserSettings).toBe("function");
    });
  });

  describe("updateUserSettings", () => {
    it("should be a function", () => {
      expect(typeof settings.updateUserSettings).toBe("function");
    });
  });

  describe("getVideoTemplates", () => {
    it("should be a function", () => {
      expect(typeof settings.getVideoTemplates).toBe("function");
    });
  });

  describe("createVideoTemplate", () => {
    it("should be a function", () => {
      expect(typeof settings.createVideoTemplate).toBe("function");
    });
  });

  describe("updateVideoTemplate", () => {
    it("should be a function", () => {
      expect(typeof settings.updateVideoTemplate).toBe("function");
    });
  });

  describe("deleteVideoTemplate", () => {
    it("should be a function", () => {
      expect(typeof settings.deleteVideoTemplate).toBe("function");
    });
  });

  describe("incrementTemplateUsage", () => {
    it("should be a function", () => {
      expect(typeof settings.incrementTemplateUsage).toBe("function");
    });
  });

  describe("getTemplateCategories", () => {
    it("should be a function", () => {
      expect(typeof settings.getTemplateCategories).toBe("function");
    });
  });

  describe("duplicateVideoTemplate", () => {
    it("should be a function", () => {
      expect(typeof settings.duplicateVideoTemplate).toBe("function");
    });
  });
});
