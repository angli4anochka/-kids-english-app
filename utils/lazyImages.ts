// Get island image path from public directory
export const getIslandImage = (islandId: string): Promise<string> => {
  const imageMap: Record<string, string> = {
    'island-1': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-1.webp',
    'island-2': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-2.webp',
    'island-3': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-3.webp',
    'island-4': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-4.webp',
    'island-5': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-5.webp',
    'island-6': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-6.webp',
    'island-7': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-7.webp',
    'island-8': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-8.webp',
    'island-9': 'https://storage.yandexcloud.net/kids-app/public-assets/img/island-9.webp',
  };

  const imagePath = imageMap[islandId] || imageMap['island-1'];
  return Promise.resolve(imagePath);
};

export const preloadIslandImage = (islandId: string) => {
  // Preload image in background
  getIslandImage(islandId).catch(() => {
    console.warn(`Failed to preload image for ${islandId}`);
  });
};
