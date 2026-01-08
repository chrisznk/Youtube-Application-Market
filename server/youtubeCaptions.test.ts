import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVideoTranscript } from './youtubeCaptions';
import * as youtubeAuth from './youtubeAuth';

// Mock de getAuthenticatedYouTubeService
vi.mock('./youtubeAuth', () => ({
  getAuthenticatedYouTubeService: vi.fn(),
}));

describe('youtubeCaptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVideoTranscript', () => {
    it('should return null when no captions are available', async () => {
      // Mock du service YouTube qui retourne une liste vide de sous-titres
      const mockYouTubeService = {
        captions: {
          list: vi.fn().mockResolvedValue({
            data: {
              items: [],
            },
          }),
        },
      };

      vi.mocked(youtubeAuth.getAuthenticatedYouTubeService).mockResolvedValue(mockYouTubeService as any);

      const result = await getVideoTranscript(1, 'test-video-id');

      expect(result).toBeNull();
      expect(mockYouTubeService.captions.list).toHaveBeenCalledWith({
        part: ['snippet'],
        videoId: 'test-video-id',
      });
    });

    it('should return timestamped transcript when captions are available', async () => {
      // Mock du service YouTube avec des sous-titres disponibles
      const mockSrtContent = `1
00:00:00,000 --> 00:00:05,000
Bonjour tout le monde

2
00:00:05,000 --> 00:00:10,000
Ceci est une transcription de test

3
00:00:10,000 --> 00:00:15,000
Merci de regarder cette vidéo`;

      const mockYouTubeService = {
        captions: {
          list: vi.fn().mockResolvedValue({
            data: {
              items: [
                {
                  id: 'caption-id-1',
                  snippet: {
                    language: 'fr',
                  },
                },
              ],
            },
          }),
          download: vi.fn().mockResolvedValue({
            data: mockSrtContent,
          }),
        },
      };

      vi.mocked(youtubeAuth.getAuthenticatedYouTubeService).mockResolvedValue(mockYouTubeService as any);

      const result = await getVideoTranscript(1, 'test-video-id');

      // Vérifier que le résultat contient les horodatages au format [HH:MM:SS,mmm]
      expect(result).toContain('[00:00:00,000]');
      expect(result).toContain('Bonjour tout le monde');
      expect(result).toContain('[00:00:05,000]');
      expect(result).toContain('Ceci est une transcription de test');
      expect(result).toContain('[00:00:10,000]');
      expect(result).toContain('Merci de regarder cette vidéo');
      
      expect(mockYouTubeService.captions.list).toHaveBeenCalledWith({
        part: ['snippet'],
        videoId: 'test-video-id',
      });
      expect(mockYouTubeService.captions.download).toHaveBeenCalledWith({
        id: 'caption-id-1',
        tfmt: 'srt',
      });
    });

    it('should prefer French captions when available', async () => {
      // Mock du service YouTube avec plusieurs langues de sous-titres
      const mockYouTubeService = {
        captions: {
          list: vi.fn().mockResolvedValue({
            data: {
              items: [
                {
                  id: 'caption-id-en',
                  snippet: {
                    language: 'en',
                  },
                },
                {
                  id: 'caption-id-fr',
                  snippet: {
                    language: 'fr',
                  },
                },
              ],
            },
          }),
          download: vi.fn().mockResolvedValue({
            data: '1\n00:00:00,000 --> 00:00:05,000\nBonjour',
          }),
        },
      };

      vi.mocked(youtubeAuth.getAuthenticatedYouTubeService).mockResolvedValue(mockYouTubeService as any);

      await getVideoTranscript(1, 'test-video-id');

      // Vérifier que c'est bien la piste française qui a été téléchargée
      expect(mockYouTubeService.captions.download).toHaveBeenCalledWith({
        id: 'caption-id-fr',
        tfmt: 'srt',
      });
    });

    it('should return null when authentication fails', async () => {
      // Mock qui lève une erreur d'authentification
      vi.mocked(youtubeAuth.getAuthenticatedYouTubeService).mockRejectedValue(
        new Error('No YouTube authentication found for this user')
      );

      const result = await getVideoTranscript(1, 'test-video-id');

      expect(result).toBeNull();
    });
  });
});
