/**
 * Unit tests for videoHelpers utility
 */

import { describe, it, expect } from 'vitest';
import { parseVideoUrl, isYouTubeUrl, getVideoEmbedUrl } from './videoHelpers';

describe('parseVideoUrl', () => {
  describe('YouTube URLs', () => {
    it('should parse standard YouTube watch URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should parse shortened youtu.be URL', () => {
      const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should parse YouTube embed URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should parse YouTube /v/ URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/v/dQw4w9WgXcQ');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should parse YouTube ID only (11 characters)', () => {
      const result = parseVideoUrl('dQw4w9WgXcQ');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should handle YouTube URLs with additional query parameters', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s');

      expect(result.platform).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.isSupported).toBe(true);
    });

    it('should not parse non-YouTube ID as YouTube', () => {
      const result = parseVideoUrl('abc123');

      expect(result.platform).toBe('unknown');
      expect(result.isSupported).toBe(false);
    });
  });

  describe('VK Video URLs', () => {
    it('should parse VK video URL with negative OID', () => {
      const result = parseVideoUrl('https://vk.com/video-12345678_987654321');

      expect(result.platform).toBe('vk');
      expect(result.videoId).toBe('-12345678_987654321');
      expect(result.embedUrl).toBe('https://vk.com/video_ext.php?oid=-12345678&id=987654321&autoplay=0');
      expect(result.isSupported).toBe(true);
    });

    it('should parse VK video URL with positive OID', () => {
      const result = parseVideoUrl('https://vk.com/video12345678_987654321');

      expect(result.platform).toBe('vk');
      expect(result.videoId).toBe('12345678_987654321');
      expect(result.embedUrl).toBe('https://vk.com/video_ext.php?oid=12345678&id=987654321&autoplay=0');
      expect(result.isSupported).toBe(true);
    });

    it('should parse VK video URL from vkvideo.ru domain', () => {
      const result = parseVideoUrl('https://vkvideo.ru/video-12345678_987654321');

      expect(result.platform).toBe('vk');
      expect(result.videoId).toBe('-12345678_987654321');
      expect(result.isSupported).toBe(true);
    });

    it('should include autoplay parameter in VK embed URL', () => {
      const result = parseVideoUrl('https://vk.com/video-12345678_987654321', true);

      expect(result.embedUrl).toBe('https://vk.com/video_ext.php?oid=-12345678&id=987654321&autoplay=1');
    });
  });

  describe('RuTube URLs', () => {
    it('should parse RuTube video URL', () => {
      const result = parseVideoUrl('https://rutube.ru/video/abc123def456');

      expect(result.platform).toBe('rutube');
      expect(result.videoId).toBe('abc123def456');
      expect(result.embedUrl).toBe('https://rutube.ru/play/embed/abc123def456');
      expect(result.isSupported).toBe(true);
    });

    it('should parse RuTube embed URL', () => {
      const result = parseVideoUrl('https://rutube.ru/play/embed/abc123def456');

      expect(result.platform).toBe('rutube');
      expect(result.videoId).toBe('abc123def456');
      expect(result.embedUrl).toBe('https://rutube.ru/play/embed/abc123def456');
      expect(result.isSupported).toBe(true);
    });
  });

  describe('Direct video file URLs', () => {
    it('should parse .mp4 file URL', () => {
      const result = parseVideoUrl('https://example.com/video.mp4');

      expect(result.platform).toBe('direct');
      expect(result.embedUrl).toBe('https://example.com/video.mp4');
      expect(result.isSupported).toBe(true);
    });

    it('should parse .webm file URL', () => {
      const result = parseVideoUrl('https://example.com/video.webm');

      expect(result.platform).toBe('direct');
      expect(result.isSupported).toBe(true);
    });

    it('should parse .ogg file URL', () => {
      const result = parseVideoUrl('https://example.com/video.ogg');

      expect(result.platform).toBe('direct');
      expect(result.isSupported).toBe(true);
    });

    it('should parse .mov file URL', () => {
      const result = parseVideoUrl('https://example.com/video.mov');

      expect(result.platform).toBe('direct');
      expect(result.isSupported).toBe(true);
    });

    it('should parse video file URL with query parameters', () => {
      const result = parseVideoUrl('https://example.com/video.mp4?quality=hd');

      expect(result.platform).toBe('direct');
      expect(result.embedUrl).toBe('https://example.com/video.mp4?quality=hd');
      expect(result.isSupported).toBe(true);
    });

    it('should be case-insensitive for file extensions', () => {
      const result = parseVideoUrl('https://example.com/VIDEO.MP4');

      expect(result.platform).toBe('direct');
      expect(result.isSupported).toBe(true);
    });

    it('should parse URLs containing /video/ path', () => {
      const result = parseVideoUrl('https://example.com/video/123');

      expect(result.platform).toBe('direct');
      expect(result.isSupported).toBe(true);
    });
  });

  describe('Unknown/unsupported URLs', () => {
    it('should return unknown for empty string', () => {
      const result = parseVideoUrl('');

      expect(result.platform).toBe('unknown');
      expect(result.isSupported).toBe(false);
    });

    it('should return unknown for unsupported platform', () => {
      const result = parseVideoUrl('https://vimeo.com/123456789');

      expect(result.platform).toBe('unknown');
      expect(result.isSupported).toBe(false);
    });

    it('should return unknown for invalid URL format', () => {
      const result = parseVideoUrl('not-a-valid-url');

      expect(result.platform).toBe('unknown');
      expect(result.isSupported).toBe(false);
    });
  });

  describe('Autoplay parameter', () => {
    it('should not include autoplay by default', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      // YouTube does not include autoplay in embedUrl from parseVideoUrl
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should include autoplay when autoplay=true for VK', () => {
      const result = parseVideoUrl('https://vk.com/video-12345678_987654321', true);

      expect(result.embedUrl).toContain('autoplay=1');
    });

    it('should not include autoplay when autoplay=false for VK', () => {
      const result = parseVideoUrl('https://vk.com/video-12345678_987654321', false);

      expect(result.embedUrl).toContain('autoplay=0');
    });
  });
});

describe('isYouTubeUrl', () => {
  it('should return true for YouTube watch URL', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for youtu.be short URL', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for YouTube embed URL', () => {
    expect(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for YouTube /v/ URL', () => {
    expect(isYouTubeUrl('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for 11-character YouTube ID', () => {
    expect(isYouTubeUrl('dQw4w9WgXcQ')).toBe(true);
  });

  it('should return false for VK video URL', () => {
    expect(isYouTubeUrl('https://vk.com/video-12345678_987654321')).toBe(false);
  });

  it('should return false for RuTube URL', () => {
    expect(isYouTubeUrl('https://rutube.ru/video/abc123')).toBe(false);
  });

  it('should return false for direct video file URL', () => {
    expect(isYouTubeUrl('https://example.com/video.mp4')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isYouTubeUrl('')).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isYouTubeUrl('not-a-url')).toBe(false);
  });
});

describe('getVideoEmbedUrl', () => {
  it('should return embed URL for YouTube video', () => {
    const embedUrl = getVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should return embed URL for VK video', () => {
    const embedUrl = getVideoEmbedUrl('https://vk.com/video-12345678_987654321');

    expect(embedUrl).toBe('https://vk.com/video_ext.php?oid=-12345678&id=987654321&autoplay=0');
  });

  it('should return embed URL for RuTube video', () => {
    const embedUrl = getVideoEmbedUrl('https://rutube.ru/video/abc123');

    expect(embedUrl).toBe('https://rutube.ru/play/embed/abc123');
  });

  it('should return embed URL for direct video file', () => {
    const embedUrl = getVideoEmbedUrl('https://example.com/video.mp4');

    expect(embedUrl).toBe('https://example.com/video.mp4');
  });

  it('should return null for unsupported URL', () => {
    const embedUrl = getVideoEmbedUrl('https://vimeo.com/123456789');

    expect(embedUrl).toBeNull();
  });

  it('should return null for empty string', () => {
    const embedUrl = getVideoEmbedUrl('');

    expect(embedUrl).toBeNull();
  });

  it('should respect autoplay parameter', () => {
    const embedUrl = getVideoEmbedUrl('https://vk.com/video-12345678_987654321', true);

    expect(embedUrl).toContain('autoplay=1');
  });

  it('should not include autoplay by default', () => {
    const embedUrl = getVideoEmbedUrl('https://vk.com/video-12345678_987654321');

    expect(embedUrl).toContain('autoplay=0');
  });
});
