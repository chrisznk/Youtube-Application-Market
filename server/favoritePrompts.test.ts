import { describe, expect, it, beforeEach } from "vitest";
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Favorite Prompts System", () => {
  let promptId: number;

  it("should save a favorite prompt", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.openai.saveFavoritePrompt({
      promptType: "title",
      promptContent: "Créer des titres accrocheurs avec des chiffres et des émotions",
    });

    expect(result.success).toBe(true);
    expect(result.promptId).toBeTypeOf("number");
    promptId = result.promptId;
  });

  it("should list favorite prompts by type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt first
    await caller.openai.saveFavoritePrompt({
      promptType: "title",
      promptContent: "Test prompt for listing",
    });

    const prompts = await caller.openai.listFavoritePrompts({
      promptType: "title",
    });

    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts[0]).toHaveProperty("promptContent");
    expect(prompts[0]).toHaveProperty("usageCount");
    expect(prompts[0]).toHaveProperty("lastUsedAt");
  });

  it("should increment usage count when using a favorite prompt", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt
    const saveResult = await caller.openai.saveFavoritePrompt({
      promptType: "description",
      promptContent: "Test prompt for usage tracking",
    });

    // Get initial state
    const promptsBefore = await caller.openai.listFavoritePrompts({
      promptType: "description",
    });
    const initialUsageCount = promptsBefore.find(
      (p: any) => p.id === saveResult.promptId
    )?.usageCount || 0;

    // Use the prompt
    await caller.openai.useFavoritePrompt({
      promptId: saveResult.promptId,
    });

    // Check usage count increased
    const promptsAfter = await caller.openai.listFavoritePrompts({
      promptType: "description",
    });
    const finalUsageCount = promptsAfter.find(
      (p: any) => p.id === saveResult.promptId
    )?.usageCount || 0;

    expect(finalUsageCount).toBe(initialUsageCount + 1);
  });

  it("should delete a favorite prompt", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save a prompt
    const saveResult = await caller.openai.saveFavoritePrompt({
      promptType: "thumbnail",
      promptContent: "Test prompt for deletion",
    });

    // Delete it
    const deleteResult = await caller.openai.deleteFavoritePrompt({
      promptId: saveResult.promptId,
    });

    expect(deleteResult.success).toBe(true);

    // Verify it's gone
    const prompts = await caller.openai.listFavoritePrompts({
      promptType: "thumbnail",
    });
    const deletedPrompt = prompts.find((p: any) => p.id === saveResult.promptId);
    expect(deletedPrompt).toBeUndefined();
  });

  it("should list all favorite prompts when no type is specified", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save prompts of different types
    await caller.openai.saveFavoritePrompt({
      promptType: "title",
      promptContent: "Title prompt",
    });
    await caller.openai.saveFavoritePrompt({
      promptType: "description",
      promptContent: "Description prompt",
    });

    const allPrompts = await caller.openai.listFavoritePrompts({});

    expect(Array.isArray(allPrompts)).toBe(true);
    expect(allPrompts.length).toBeGreaterThanOrEqual(2);
  });
});
