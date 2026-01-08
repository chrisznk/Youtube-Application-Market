import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Transcript Optimization", () => {
  it("should retrieve videos with transcripts", async () => {
    const ctx = createAuthContext();
    
    // Récupérer les vidéos qui ont déjà une transcription
    const videosWithTranscript = await db.getVideosWithTranscript(ctx.user!.id);
    
    console.log(`\n[Test] Found ${videosWithTranscript.size} videos with transcripts`);
    
    if (videosWithTranscript.size > 0) {
      console.log(`[Test] Video IDs with transcripts:`, Array.from(videosWithTranscript));
    }
    
    expect(videosWithTranscript).toBeInstanceOf(Set);
  });

  it("should list all videos for the user", async () => {
    const ctx = createAuthContext();
    
    // Récupérer toutes les vidéos de l'utilisateur
    const allVideos = await db.getVideosByUserId(ctx.user!.id);
    
    console.log(`\n[Test] Found ${allVideos.length} total videos`);
    
    if (allVideos.length > 0) {
      const videosWithTranscript = allVideos.filter(v => v.transcript !== null && v.transcript !== undefined);
      const videosWithoutTranscript = allVideos.filter(v => !v.transcript);
      
      console.log(`[Test] Videos WITH transcript: ${videosWithTranscript.length}`);
      console.log(`[Test] Videos WITHOUT transcript: ${videosWithoutTranscript.length}`);
      
      if (videosWithTranscript.length > 0) {
        console.log(`\n[Test] Videos WITH transcripts:`);
        videosWithTranscript.forEach(v => {
          const transcriptLength = v.transcript ? v.transcript.length : 0;
          console.log(`  - ${v.title} (${v.youtubeId}) - ${transcriptLength} chars`);
        });
      }
      
      if (videosWithoutTranscript.length > 0) {
        console.log(`\n[Test] Videos WITHOUT transcripts:`);
        videosWithoutTranscript.forEach(v => {
          console.log(`  - ${v.title} (${v.youtubeId})`);
        });
      }
    }
    
    expect(allVideos).toBeInstanceOf(Array);
  });
});
