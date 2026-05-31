// Video URL parsing and embed URL generation utilities

export interface VideoInfo {
  platform: 'youtube' | 'vk' | 'rutube' | 'direct' | 'unknown';
  embedUrl?: string;
  videoId?: string;
  isSupported: boolean;
}

const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=([^&\s]+)/,
  /youtu\.be\/([^&\s]+)/,
  /youtube\.com\/embed\/([^&\s]+)/,
  /youtube\.com\/v\/([^&\s]+)/
];

const VK_PATTERNS = [
  /vk\.com\/video(-?\d+_\d+)/,
  /vkvideo\.ru\/video(-?\d+_\d+)/
];

const RUTUBE_PATTERNS = [
  /rutube\.ru\/video\/([a-zA-Z0-9]+)/,
  /rutube\.ru\/play\/embed\/([a-zA-Z0-9]+)/
];

const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function parseVideoUrl(url: string, autoplay = false): VideoInfo {
  if (!url) {
    return { platform: 'unknown', isSupported: false };
  }

  const autoplayParam = autoplay ? '1' : '0';

  // Check YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        platform: 'youtube',
        videoId: match[1],
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        isSupported: true
      };
    }
  }

  // Check for YouTube ID only (11 characters)
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return {
      platform: 'youtube',
      videoId: url,
      embedUrl: `https://www.youtube.com/embed/${url}`,
      isSupported: true
    };
  }

  // Check VK Video
  for (const pattern of VK_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const [oid, id] = match[1].split('_');
      return {
        platform: 'vk',
        videoId: match[1],
        embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=${autoplayParam}`,
        isSupported: true
      };
    }
  }

  // Check RuTube
  for (const pattern of RUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        platform: 'rutube',
        videoId: match[1],
        embedUrl: `https://rutube.ru/play/embed/${match[1]}`,
        isSupported: true
      };
    }
  }

  // Check if it's a direct video file
  if (url.match(VIDEO_FILE_PATTERN) || url.includes('/video/')) {
    return {
      platform: 'direct',
      embedUrl: url,
      isSupported: true
    };
  }

  return {
    platform: 'unknown',
    isSupported: false
  };
}

export function isYouTubeUrl(url: string): boolean {
  const info = parseVideoUrl(url);
  return info.platform === 'youtube';
}

export function getVideoEmbedUrl(url: string, autoplay = false): string | null {
  const info = parseVideoUrl(url, autoplay);
  return info.embedUrl || null;
}