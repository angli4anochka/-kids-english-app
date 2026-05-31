// Get island image path from public directory
export const getIslandImage = (islandId: string): Promise<string> => {
  const imageMap: Record<string, string> = {
    'island-1': '/img/1.png',
    'island-2': '/img/2.png',
    'island-3': '/img/3.png',
    'island-4': '/img/4.png',
    'island-5': '/img/5.png',
    'island-6': '/img/6.png',
    'island-7': '/img/7.png',
    'island-8': '/img/8.png',
    'island-9': '/img/9.png',
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
