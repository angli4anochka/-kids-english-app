/**
 * Утилиты для работы с видео URL разных платформ
 */

export interface ParsedVideoUrl {
  embedUrl: string;
  platform: 'youtube' | 'vk' | 'rutube' | 'direct' | 'unknown';
  supportsSync: boolean;
}

/**
 * Парсит URL видео и возвращает embed URL для iframe
 */
export const parseVideoUrl = (url: string, autoplay: boolean = false): ParsedVideoUrl => {
  const autoplayParam = autoplay ? '1' : '0';

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=${autoplayParam}`,
        platform: 'youtube',
        supportsSync: true,
      };
    }
  }

  // VK Video patterns
  const vkPatterns = [
    /vk\.com\/video(-?\d+_\d+)/,
    /vk\.com\/.*video(-?\d+_\d+)/,
  ];

  for (const pattern of vkPatterns) {
    const match = url.match(pattern);
    if (match) {
      const [oid, id] = match[1].split('_');
      return {
        embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=${autoplayParam}`,
        platform: 'vk',
        supportsSync: false,
      };
    }
  }

  // RuTube patterns
  const rutubePatterns = [
    /rutube\.ru\/video\/([a-zA-Z0-9]+)/,
    /rutube\.ru\/play\/embed\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of rutubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        embedUrl: `https://rutube.ru/play/embed/${match[1]}`,
        platform: 'rutube',
        supportsSync: false,
      };
    }
  }

  // YouTube ID only (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return {
      embedUrl: `https://www.youtube.com/embed/${url}?autoplay=${autoplayParam}`,
      platform: 'youtube',
      supportsSync: true,
    };
  }

  // Direct video file (mp4, webm, ogg, mov)
  const videoFilePattern = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  if (videoFilePattern.test(url)) {
    return {
      embedUrl: url,
      platform: 'direct',
      supportsSync: false,
    };
  }

  return {
    embedUrl: '',
    platform: 'unknown',
    supportsSync: false,
  };
};

/**
 * Проверяет, является ли URL прямой ссылкой на видео файл
 */
export const isDirectVideoUrl = (url: string): boolean => {
  const videoFilePattern = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  return videoFilePattern.test(url);
};

/**
 * Извлекает YouTube ID из различных форматов URL
 */
export const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Check if it's just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
};
