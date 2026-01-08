import { describe, expect, it } from "vitest";
import { generateImage } from "./nanoBanana";

describe("NanoBanana Imagen 3 Test", () => {
  it("should generate an image using Imagen 3 (Pro mode)", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("[Test] GEMINI_API_KEY not found, skipping test");
      return;
    }

    console.log("[Test] Testing Imagen 4 Ultra with model: imagen-4.0-ultra-generate-001");

    const result = await generateImage({
      prompt: "A simple red circle on white background",
      mode: "pro", // This should use imagen-3.0-generate-002
      apiKey,
    });

    console.log("[Test] Image generated successfully!");
    console.log("[Test] Image URL:", result.imageUrl);

    expect(result).toHaveProperty("imageUrl");
    expect(result.imageUrl).toMatch(/^https?:\/\//);
  }, 60000); // 60 seconds timeout for image generation
});
