import { useNavigate } from '@/utils/routing-adapter';
import { islands } from '../data/islands';
import { useProgress } from '../hooks/useProgress';
import IslandButton from '../components/Map/IslandButton';
import { soundManager } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';

const MapScreen = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user, logout } = useAuth();

  // Определяем статус каждого острова на основе прогресса
  const isMarusya = String(user?.id) === '12';

  const getIslandStatus = (islandId: string, index: number) => {
    // Первый остров всегда доступен
    if (isMarusya && islandId === 'island-1') return 'completed';
    if (isMarusya && islandId === 'island-2') return 'available';
    if (index === 0) return 'available';

    // Если остров завершён
    if (progress.completedIslands.includes(islandId)) {
      return 'completed';
    }

    // Если предыдущий остров завершён, этот становится доступен
    const previousIsland = islands[index - 1];
    if (progress.completedIslands.includes(previousIsland.id)) {
      return 'available';
    }

    return 'locked';
  };

  const handleIslandClick = (islandId: string, status: string) => {
    if (status === 'locked') {
      soundManager.playIncorrect();
      return;
    }

    soundManager.playClick();
    navigate(`/island/${islandId}`);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://storage.yandexcloud.net/kids-app/public-assets/img/background.webp)' }}>
      {/* Welcome message */}
      {user && (
        <div className="absolute top-8 left-8 z-20">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur rounded-2xl shadow-2xl px-6 py-4 border-4 border-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👋</span>
                <div>
                  <div className="text-2xl font-bold text-white">Добро пожаловать!</div>
                  <div className="text-lg text-white/90">{user.displayName}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  logout();
                  navigate('/login');
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all hover:scale-105 active:scale-95 border-2 border-white/50 font-semibold flex items-center gap-2"
                title="Выйти из системы"
              >
                <span>🚪</span>
                <span>Выход</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons - bottom right */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-4">
        {user?.role === 'student' && (
          <>
            <button
              onClick={() => {
                soundManager.playClick();
                navigate('/student/profile');
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-indigo-600 flex items-center gap-3"
            >
              <span className="text-3xl">🧑‍🎓</span>
              <span>Мой кабинет</span>
            </button>
          </>
        )}
        <button
          onClick={() => {
            soundManager.playClick();
            navigate('/scoreboard');
          }}
          className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-yellow-500 flex items-center gap-3"
        >
          <span className="text-3xl">🏆</span>
          <span>Таблица лидеров</span>
        </button>

        {/* Teacher Dashboard button - only for teachers */}
        {user?.role === 'teacher' && (
          <button
            onClick={() => {
              soundManager.playClick();
              navigate('/teacher/dashboard');
            }}
            className="px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-green-600 flex items-center gap-3"
          >
            <span className="text-3xl">👨‍🏫</span>
            <span>Дашборд учителя</span>
          </button>
        )}
      </div>

      {/* Progress indicator - hidden as per request */}
      {/* <div className="absolute top-8 left-8 z-20">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl px-6 py-4 border-4 border-purple-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div>
              <div className="text-2xl font-bold text-purple-600">{progress.totalPoints}</div>
              <div className="text-sm text-gray-600">Всего баллов</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Islands Map */}
      <div className="relative z-10 w-full h-screen flex items-center justify-center">
        <div className="relative w-full max-w-7xl h-[80vh]">
          {islands.map((island, index) => {
            const status = getIslandStatus(island.id, index);
            const islandProgress = progress.islandProgress[island.id];
            const earnedPoints = islandProgress?.earnedPoints || 0;

            return (
              <IslandButton
                key={island.id}
                island={{ ...island, status }}
                earnedPoints={earnedPoints}
                onClick={() => handleIslandClick(island.id, status)}
              />
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default MapScreen;
