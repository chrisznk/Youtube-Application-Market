import { describe, it, expect } from "vitest";
import { YoutubeTranscript } from "youtube-transcript";

describe("YouTube Transcript Test", () => {
  it("should fetch transcript for a single video", async () => {
    // Test avec une vidéo de l'utilisateur
    const testVideoId = "WIERU7DDUns";
    
    console.log(`\n[Test] Fetching transcript for video: ${testVideoId}`);
    
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(testVideoId);
      
      console.log(`[Test] Transcript fetched successfully!`);
      console.log(`[Test] Number of segments: ${transcriptData.length}`);
      
      if (transcriptData.length > 0) {
        console.log(`[Test] First segment:`, transcriptData[0]);
        console.log(`[Test] Last segment:`, transcriptData[transcriptData.length - 1]);
        
        // Formater avec horodatages
        const formattedTranscript = transcriptData
          .slice(0, 5) // Prendre les 5 premiers segments pour l'exemple
          .map(item => {
            const totalSeconds = Math.floor(item.offset / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return `[${timestamp}] ${item.text}`;
          })
          .join('\n');
        
        console.log(`\n[Test] Formatted transcript (first 5 segments):\n${formattedTranscript}`);
      }
      
      expect(transcriptData).toBeDefined();
      expect(transcriptData.length).toBeGreaterThan(0);
      
    } catch (error: any) {
      console.error(`[Test] Error fetching transcript:`, error.message);
      throw error;
    }
  }, 30000); // 30 seconds timeout
});
