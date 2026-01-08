import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

  return ctx;
}

describe("YouTube Connection Flow", () => {
  it("should return unauthenticated when no YouTube config exists", async () => {
    const ctx = createAuthContext(999999); // ID qui n'existe pas
    const caller = appRouter.createCaller(ctx);

    const result = await caller.youtube.checkAuth();

    expect(result).toEqual({ authenticated: false });
  });

  it("should return authenticated when YouTube config exists with tokens", async () => {
    // Créer une configuration YouTube de test
    const userId = 1;
    await db.upsertYouTubeConfig({
      userId,
      channelId: "test-channel-id",
      channelTitle: "Test Channel",
      apiKey: "",
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
      autoSyncEnabled: true,
    });

    const ctx = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.youtube.checkAuth();

    expect(result).toEqual({ authenticated: true });
  });

  it("should generate YouTube auth URL with correct parameters", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.youtube.getAuthUrl();

    expect(result.url).toBeDefined();
    expect(result.url).toContain("accounts.google.com");
    expect(result.url).toContain("youtube.readonly");
    expect(result.url).toContain("yt-analytics.readonly");
    expect(result.url).toContain("state=1"); // userId dans le state
  });

  it("should retrieve YouTube config with channel information", async () => {
    const userId = 1;
    const channelTitle = "My Test Channel";
    
    await db.upsertYouTubeConfig({
      userId,
      channelId: "test-channel-123",
      channelTitle,
      apiKey: "",
      accessToken: "test-token",
      refreshToken: "test-refresh",
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
      autoSyncEnabled: true,
    });

    const ctx = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    const config = await caller.sync.getConfig();

    expect(config).toBeDefined();
    expect(config?.channelTitle).toBe(channelTitle);
    expect(config?.userId).toBe(userId);
  });
});
