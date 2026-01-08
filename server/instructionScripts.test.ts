import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: 1,
              userId: 1,
              scriptType: "title_guide",
              version: 1,
              content: "Test content",
              trainedBy: null,
              isActive: true,
              createdAt: new Date(),
            }])),
          })),
          limit: vi.fn(() => Promise.resolve([{
            id: 1,
            userId: 1,
            scriptType: "title_guide",
            version: 1,
            content: "Test content",
            trainedBy: null,
            isActive: true,
            createdAt: new Date(),
          }])),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    })),
  })),
}));

describe("instructionScripts", () => {
  describe("setActiveVersion", () => {
    it("should export setActiveVersion function", async () => {
      const { setActiveVersion } = await import("./instructionScripts");
      expect(typeof setActiveVersion).toBe("function");
    });
  });

  describe("getActiveInstructionScript", () => {
    it("should export getActiveInstructionScript function", async () => {
      const { getActiveInstructionScript } = await import("./instructionScripts");
      expect(typeof getActiveInstructionScript).toBe("function");
    });
  });

  describe("createInstructionScript", () => {
    it("should export createInstructionScript function", async () => {
      const { createInstructionScript } = await import("./instructionScripts");
      expect(typeof createInstructionScript).toBe("function");
    });
  });
});
