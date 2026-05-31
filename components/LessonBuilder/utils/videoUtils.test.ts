/**
 * Unit tests for videoUtils
 */

import { describe, it, expect } from 'vitest';
import { parseVideoUrl, isDirectVideoUrl, extractYoutubeId } from './videoUtils';

describe('parseVideoUrl', () => {
  describe('YouTube URLs', () => {
    it('should parse standard YouTube watch URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
        platform: 'youtube',
        supportsSync: true,
      });
    });

    it('should parse shortened youtu.be URL', () => {
      const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toEqual({
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
        platform: 'youtube',
        supportsSync: true,
      });
    });

    it('should parse YouTube embed URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result).toEqual({
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
        platform: 'youtube',
        supportsSync: true,
      });
    });

    it('should parse YouTube /v/ URL', () => {
      const result = parseVideoUrl('https://www.youtube.com/v/dQw4w9WgXcQ');
      expect(result).toEqual({
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
        platform: 'youtube',
        supportsSync: true,
      });
    });

    it('should parse YouTube ID only', () => {
      const result = parseVideoUrl('dQw4w9WgXcQ');
      expect(result).toEqual({
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
        platform: 'youtube',
        supportsSync: true,
      });
    });

    it('should add autoplay parameter when autoplay is true', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', true);
      expect(result.embedUrl).toContain('autoplay=1');
    });

    it('should not add autoplay parameter when autoplay is false', () => {
      const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', false);
      expect(result.embedUrl).toContain('autoplay=0');
    });
  });

  describe('VK Video URLs', () => {
    it('should parse standard VK video URL', () => {
      const result = parseVideoUrl('https://vk.com/video-12345678_987654321');
      expect(result).toEqual({
        embedUrl: 'https://vk.com/video_ext.php?oid=-12345678&id=987654321&autoplay=0',
        platform: 'vk',
        supportsSync: false,
      });
    });

    it('should parse VK video URL with path', () => {
      const result = parseVideoUrl('https://vk.com/somegroup?z=video-12345678_987654321');
      expect(result).toEqual({
        embedUrl: 'https://vk.com/video_ext.php?oid=-12345678&id=987654321&autoplay=0',
        platform: 'vk',
        supportsSync: false,
      });
    });

    it('should handle positive OID for VK', () => {
      const result = parseVideoUrl('https://vk.com/video12345678_987654321');
      expect(result).toEqual({
        embedUrl: 'https://vk.com/video_ext.php?oid=12345678&id=987654321&autoplay=0',
        platform: 'vk',
        supportsSync: false,
      });
    });
  });

  describe('RuTube URLs', () => {
    it('should parse standard RuTube video URL', () => {
      const result = parseVideoUrl('https://rutube.ru/video/abc123def456');
      expect(result).toEqual({
        embedUrl: 'https://rutube.ru/play/embed/abc123def456',
        platform: 'rutube',
        supportsSync: false,
      });
    });

    it('should parse RuTube embed URL', () => {
      const result = parseVideoUrl('https://rutube.ru/play/embed/abc123def456');
      expect(result).toEqual({
        embedUrl: 'https://rutube.ru/play/embed/abc123def456',
        platform: 'rutube',
        supportsSync: false,
      });
    });
  });

  describe('Direct video file URLs', () => {
    it('should parse .mp4 file URL', () => {
      const result = parseVideoUrl('https://example.com/video.mp4');
      expect(result).toEqual({
        embedUrl: 'https://example.com/video.mp4',
        platform: 'direct',
        supportsSync: false,
      });
    });

    it('should parse .webm file URL', () => {
      const result = parseVideoUrl('https://example.com/video.webm');
      expect(result).toEqual({
        embedUrl: 'https://example.com/video.webm',
        platform: 'direct',
        supportsSync: false,
      });
    });

    it('should parse .ogg file URL', () => {
      const result = parseVideoUrl('https://example.com/video.ogg');
      expect(result).toEqual({
        embedUrl: 'https://example.com/video.ogg',
        platform: 'direct',
        supportsSync: false,
      });
    });

    it('should parse .mov file URL', () => {
      const result = parseVideoUrl('https://example.com/video.mov');
      expect(result).toEqual({
        embedUrl: 'https://example.com/video.mov',
        platform: 'direct',
        supportsSync: false,
      });
    });

    it('should parse video file URL with query parameters', () => {
      const result = parseVideoUrl('https://example.com/video.mp4?quality=hd&autoplay=1');
      expect(result).toEqual({
        embedUrl: 'https://example.com/video.mp4?quality=hd&autoplay=1',
        platform: 'direct',
        supportsSync: false,
      });
    });

    it('should handle case-insensitive file extensions', () => {
      const result = parseVideoUrl('https://example.com/video.MP4');
      expect(result.platform).toBe('direct');
    });
  });

  describe('Unknown URLs', () => {
    it('should return unknown for invalid URL', () => {
      const result = parseVideoUrl('not-a-video-url');
      expect(result).toEqual({
        embedUrl: '',
        platform: 'unknown',
        supportsSync: false,
      });
    });

    it('should return unknown for unsupported platform', () => {
      const result = parseVideoUrl('https://vimeo.com/123456789');
      expect(result).toEqual({
        embedUrl: '',
        platform: 'unknown',
        supportsSync: false,
      });
    });

    it('should return unknown for empty string', () => {
      const result = parseVideoUrl('');
      expect(result).toEqual({
        embedUrl: '',
        platform: 'unknown',
        supportsSync: false,
      });
    });
  });
});

describe('isDirectVideoUrl', () => {
  it('should return true for .mp4 files', () => {
    expect(isDirectVideoUrl('https://example.com/video.mp4')).toBe(true);
  });

  it('should return true for .webm files', () => {
    expect(isDirectVideoUrl('https://example.com/video.webm')).toBe(true);
  });

  it('should return true for .ogg files', () => {
    expect(isDirectVideoUrl('https://example.com/video.ogg')).toBe(true);
  });

  it('should return true for .mov files', () => {
    expect(isDirectVideoUrl('https://example.com/video.mov')).toBe(true);
  });

  it('should return true for video files with query parameters', () => {
    expect(isDirectVideoUrl('https://example.com/video.mp4?quality=hd')).toBe(true);
  });

  it('should return false for YouTube URLs', () => {
    expect(isDirectVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
  });

  it('should return false for non-video files', () => {
    expect(isDirectVideoUrl('https://example.com/image.jpg')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isDirectVideoUrl('https://example.com/video.MP4')).toBe(true);
    expect(isDirectVideoUrl('https://example.com/video.WEBM')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isDirectVideoUrl('')).toBe(false);
  });
});

describe('extractYoutubeId', () => {
  it('should extract ID from standard YouTube watch URL', () => {
    const id = extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from shortened youtu.be URL', () => {
    const id = extractYoutubeId('https://youtu.be/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from YouTube embed URL', () => {
    const id = extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from YouTube /v/ URL', () => {
    const id = extractYoutubeId('https://www.youtube.com/v/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should return the ID if input is just an ID', () => {
    const id = extractYoutubeId('dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should return null for non-YouTube URLs', () => {
    const id = extractYoutubeId('https://vimeo.com/123456789');
    expect(id).toBeNull();
  });

  it('should return null for invalid YouTube URLs', () => {
    const id = extractYoutubeId('https://www.youtube.com/channel/UC123');
    expect(id).toBeNull();
  });

  it('should return null for empty string', () => {
    const id = extractYoutubeId('');
    expect(id).toBeNull();
  });

  it('should return null for IDs that are not 11 characters', () => {
    const id = extractYoutubeId('abc123');
    expect(id).toBeNull();
  });

  it('should handle YouTube URLs with extra query parameters', () => {
    const id = extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
    expect(id).toBe('dQw4w9WgXcQ');
  });
});
