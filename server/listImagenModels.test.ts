import { describe, it } from "vitest";
import { GoogleGenAI } from "@google/genai";

describe("List Available Imagen Models", () => {
  it("should list all available models", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("[Test] GEMINI_API_KEY not found, skipping test");
      return;
    }

    console.log("\n=== Testing with v1beta (default) ===");
    const aiBeta = new GoogleGenAI({ apiKey });
    try {
      const pager = await aiBeta.models.list();
      console.log("[v1beta] Available Imagen models:");
      
      // Iterate through the pager
      for await (const model of pager) {
        if (model.name?.toLowerCase().includes('imagen')) {
          console.log(`  - ${model.name}`);
        }
      }
    } catch (error: any) {
      console.error("[v1beta] Error listing models:", error.message);
    }

    console.log("\n=== Testing with v1 ===");
    const aiV1 = new GoogleGenAI({ apiKey, apiVersion: 'v1' });
    try {
      const pager = await aiV1.models.list();
      console.log("[v1] Available Imagen models:");
      
      for await (const model of pager) {
        if (model.name?.toLowerCase().includes('imagen')) {
          console.log(`  - ${model.name}`);
        }
      }
    } catch (error: any) {
      console.error("[v1] Error listing models:", error.message);
    }

    console.log("\n=== Testing with v1alpha ===");
    const aiAlpha = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
    try {
      const pager = await aiAlpha.models.list();
      console.log("[v1alpha] Available Imagen models:");
      
      for await (const model of pager) {
        if (model.name?.toLowerCase().includes('imagen')) {
          console.log(`  - ${model.name}`);
        }
      }
    } catch (error: any) {
      console.error("[v1alpha] Error listing models:", error.message);
    }
  }, 60000); // 60 seconds timeout
});
