import type { Island } from '../../types';

interface IslandButtonProps {
  island: Island;
  earnedPoints: number;
  onClick: () => void;
}

const IslandButton = ({ island, onClick }: IslandButtonProps) => {
  const isCompleted = island.status === 'completed';
  const isLocked = island.status === 'locked';
  const isAvailable = island.status === 'available';

  // Путь к оптимизированному WebP острова (статика, без on-the-fly оптимизации)
  const getIslandImagePath = (id: string) => {
    const n = id.replace('island-', '');
    const valid = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return `/img/island-${valid.includes(n) ? n : '1'}.webp`;
  };

  // Размер острова на карте (он же width/height для <img>)
  const getIslandSize = (id: string) => {
    if (id === 'island-8') return 768;
    if (id === 'island-1' || id === 'island-2') return 512;
    return 384;
  };

  // Функция для получения флажка в зависимости от статуса
  const getFlagElement = () => {
    if (isCompleted) {
      // Зеленый флажок для пройденных островов
      return (
        <div className="absolute -top-8 right-8 transform animate-bounce">
          <div className="relative">
            <div className="w-2 h-20 bg-gray-700 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-12 h-8 bg-green-500 rounded-sm"
                 style={{
                   clipPath: 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%)'
                 }}>
              <span className="text-white text-xs font-bold ml-1">✓</span>
            </div>
          </div>
        </div>
      );
    } else if (isLocked) {
      // Замок для заблокированных островов
      return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-6xl opacity-70">🔒</div>
        </div>
      );
    }
    // Убрали красный флаг для доступных островов
    return null;
  };

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${island.position.x}%`,
        top: `${island.position.y}%`,
        zIndex: 10,
      }}
    >
      {/* Island Button - показываем изображение острова */}
      <button
        onClick={onClick}
        className={`
          relative transition-all duration-200
          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer active:scale-95'}
          ${isCompleted ? 'brightness-110' : ''}
        `}
      >
        <img
          src={getIslandImagePath(island.id)}
          alt={island.title}
          width={getIslandSize(island.id)}
          height={getIslandSize(island.id)}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{
            width: getIslandSize(island.id),
            height: getIslandSize(island.id),
          }}
        />

        {/* Флажок или замок */}
        {getFlagElement()}

        {/* Звездочка для пройденных островов */}
        {isCompleted && (
          <div className="absolute top-0 left-0 text-5xl">⭐</div>
        )}
      </button>
    </div>
  );
};

export default IslandButton;
