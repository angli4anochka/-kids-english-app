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

  // Получаем путь к изображению острова из public/img/
  const getIslandImagePath = (id: string) => {
    switch(id) {
      case 'island-1': return '/img/1.png';
      case 'island-2': return '/img/2.png';
      case 'island-3': return '/img/3.png';
      case 'island-4': return '/img/4.png';
      case 'island-5': return '/img/5.png';
      case 'island-6': return '/img/6.png';
      case 'island-7': return '/img/7.png';
      case 'island-8': return '/img/8.png';
      case 'island-9': return '/img/9.png';
      default: return '/img/1.png';
    }
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
          loading="lazy"
          className={
            island.id === 'island-8' ? 'w-[768px] h-[768px] object-contain' :
            island.id === 'island-1' || island.id === 'island-2' ? 'w-[512px] h-[512px] object-contain' :
            'w-96 h-96 object-contain'
          }
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
