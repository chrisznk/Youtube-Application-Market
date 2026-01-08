import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("videos procedures", () => {
  it("should list videos for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.videos.list();
    
    expect(Array.isArray(videos)).toBe(true);
  });

  it("should create a video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.videos.create({
      youtubeId: "test123",
      title: "Test Video",
      description: "Test Description",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should delete all videos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.videos.deleteAll();

    expect(result).toEqual({ success: true });
  });
});

describe("abTests procedures", () => {
  it("should create an A/B test", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a video
    const video = await caller.videos.create({
      youtubeId: "test456",
      title: "Test Video for A/B",
    });

    // Then create a test
    const result = await caller.abTests.create({
      videoId: video.id,
      name: "Test A/B #1",
      description: "Testing titles",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list tests by video", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const video = await caller.videos.create({
      youtubeId: "test789",
      title: "Test Video",
    });

    const tests = await caller.abTests.listByVideo({ videoId: video.id });

    expect(Array.isArray(tests)).toBe(true);
  });
});

describe("testVariants procedures", () => {
  it("should create a test variant", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create video and test first
    const video = await caller.videos.create({
      youtubeId: "test101",
      title: "Test Video",
    });

    const test = await caller.abTests.create({
      videoId: video.id,
      name: "Test A/B",
    });

    // Create variant
    const result = await caller.testVariants.create({
      testId: test.id,
      name: "Variant A",
      title: "Alternative Title",
      isControl: false,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});
