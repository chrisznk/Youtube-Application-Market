import { describe, expect, it } from "vitest";
import { generateImage } from "./nanoBanana";

describe("Nano Banana Image Generation", () => {
  it("should generate an image successfully with standard mode", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const result = await generateImage({
      prompt: "A simple red circle on white background",
      mode: "standard",
      apiKey,
    });

    expect(result).toHaveProperty("imageUrl");
    expect(result.imageUrl).toMatch(/^https?:\/\//);
    console.log("[Test] Generated image URL:", result.imageUrl);
  }, 30000); // 30 seconds timeout for image generation
});
