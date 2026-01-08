import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("openai procedures", () => {
  it("generateStrategy returns a strategy string", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.openai.generateStrategy({
      videoId: 1,
      transcript: "This is a test video about artificial intelligence and machine learning.",
      currentTitle: "AI Basics",
    });

    expect(result).toHaveProperty("strategy");
    expect(typeof result.strategy).toBe("string");
    expect(result.strategy.length).toBeGreaterThan(0);
  }, 30000);

  it("generateSuggestions returns an array of suggestions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.openai.generateSuggestions({
      videoId: 1,
      transcript: "This video explains quantum physics in simple terms.",
      currentTitle: "Quantum Physics 101",
      strategy: "Focus on making complex topics accessible",
      customPrompt: "Use numbers and emotional hooks",
    });

    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
    
    if (result.suggestions.length > 0) {
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion).toHaveProperty("title");
      expect(firstSuggestion).toHaveProperty("reason");
      expect(typeof firstSuggestion.title).toBe("string");
      expect(typeof firstSuggestion.reason).toBe("string");
    }
  }, 30000);

  it("generateSuggestions works without optional parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.openai.generateSuggestions({
      videoId: 1,
      transcript: "A comprehensive guide to web development.",
      currentTitle: "Web Dev Tutorial",
    });

    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.suggestions)).toBe(true);
  }, 30000);
});
