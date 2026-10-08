import { useNavigate } from '@/utils/routing-adapter';
import { useEffect, useState } from 'react';
import { islands } from '../data/islands';
import { kidsBoxIslandTwoLessonIds } from '../data/kidsBoxIslandLessons';
import { useProgress } from '../hooks/useProgress';
import IslandButton from '../components/Map/IslandButton';
import { soundManager } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';

const MapScreen = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user, logout } = useAuth();
  const [islandTwoComplete, setIslandTwoComplete] = useState(false);
  const [serverCompletedIslands, setServerCompletedIslands] = useState<Set<string>>(new Set());

  useEffect(() => {
    const groupId = user?.groupId || user?.group_id;
    if (user?.role !== 'student' || !groupId) return;
    fetch(`/kids-api/groups/${groupId}/progress`)
      .then(response => response.json())
      .then(result => {
        if (!result.success) return;
        const completedLessonIds = new Set((result.data || []).filter((item: any) => item.is_completed).map((item: any) => String(item.lesson_id)));
        setIslandTwoComplete(kidsBoxIslandTwoLessonIds.every(id => completedLessonIds.has(id)));
        setServerCompletedIslands(new Set(
          (result.data || [])
            .filter((item: any) => item.is_completed && item.island_id)
            .map((item: any) => 'island-' + item.island_id)
        ));
      })
      .catch(error => console.error('[MapScreen] Failed to load group progress:', error));
  }, [user?.role, user?.groupId, user?.group_id]);

  // Р С›Р С—РЎР‚Р ВµР Т‘Р ВµР В»РЎРЏР ВµР С РЎРѓРЎвЂљР В°РЎвЂљРЎС“РЎРѓ Р С”Р В°Р В¶Р Т‘Р С•Р С–Р С• Р С•РЎРѓРЎвЂљРЎР‚Р С•Р Р†Р В° Р Р…Р В° Р С•РЎРѓР Р…Р С•Р Р†Р Вµ Р С—РЎР‚Р С•Р С–РЎР‚Р ВµРЎРѓРЎРѓР В°

  const getIslandStatus = (islandId: string, index: number) => {
    const studentGroupId = user?.groupId || (user as any)?.group_id;
    if (Number(studentGroupId) === 7 && islandId === 'island-1') return 'completed';
    if (Number(studentGroupId) === 7) {
      if (islandId === 'island-2') return islandTwoComplete ? 'completed' : 'available';
      if (islandId === 'island-3') return islandTwoComplete ? 'available' : 'locked';
      return 'locked';
    }
    // Р СџР ВµРЎР‚Р Р†РЎвЂ№Р в„– Р С•РЎРѓРЎвЂљРЎР‚Р С•Р Р† Р Р†РЎРѓР ВµР С–Р Т‘Р В° Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р…
    const islandNumber = index + 1;
    const nextIslandReached = serverCompletedIslands.has(`island-${islandNumber + 1}`);
    if (nextIslandReached) return 'completed';
    if (serverCompletedIslands.has(islandId)) return 'available';
    if (index === 0) return 'available';

    // Р вЂўРЎРѓР В»Р С‘ Р С•РЎРѓРЎвЂљРЎР‚Р С•Р Р† Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬РЎвЂР Р…
    if (progress.completedIslands.includes(islandId)) {
      return 'completed';
    }

    // Р вЂўРЎРѓР В»Р С‘ Р С—РЎР‚Р ВµР Т‘РЎвЂ№Р Т‘РЎС“РЎвЂ°Р С‘Р в„– Р С•РЎРѓРЎвЂљРЎР‚Р С•Р Р† Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬РЎвЂР Р…, РЎРЊРЎвЂљР С•РЎвЂљ РЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р С‘РЎвЂљРЎРѓРЎРЏ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р…
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
    <div className="h-[100dvh] min-h-0 w-full relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://storage.yandexcloud.net/kids-app/public-assets/img/background.webp)' }}>
      {/* Welcome message */}
      {user && (
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 xl:top-8 xl:left-8 z-20">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur rounded-2xl shadow-2xl px-3 py-2 sm:px-4 sm:py-3 xl:px-6 xl:py-4 border-2 xl:border-4 border-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{'\u{1F44B}'}</span>
                <div>
                  <div className="text-base sm:text-lg xl:text-2xl font-bold text-white">{'\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c!'}</div>
                  <div className="text-sm sm:text-base xl:text-lg text-white/90">{user.displayName}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  logout();
                  navigate('/login');
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all hover:scale-105 active:scale-95 border-2 border-white/50 font-semibold flex items-center gap-2"
                title={'\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u0441\u0438\u0441\u0442\u0435\u043c\u044b'}
              >
                <span>{'\u{1F6AA}'}</span>
                <span>{'\u0412\u044b\u0445\u043e\u0434'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons - bottom right */}
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 xl:bottom-8 xl:right-8 z-20 flex flex-wrap justify-end gap-2 xl:gap-4 max-w-[94vw]">
        {user?.role === 'student' && (
          <>
            <button
              onClick={() => {
                soundManager.playClick();
                navigate('/student/profile');
              }}
              className="px-3 py-2 sm:px-4 sm:py-3 xl:px-8 xl:py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white font-bold text-sm sm:text-base xl:text-xl rounded-xl xl:rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-indigo-600 flex items-center gap-3"
            >
              <span className="text-3xl">{'\u{1F9D1}\u200D\u{1F393}'}</span>
              <span>{'\u041c\u043e\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442'}</span>
            </button>
          </>
        )}
        <button
          onClick={() => {
            soundManager.playClick();
            navigate('/scoreboard');
          }}
          className="px-3 py-2 sm:px-4 sm:py-3 xl:px-8 xl:py-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white font-bold text-sm sm:text-base xl:text-xl rounded-xl xl:rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-yellow-500 flex items-center gap-3"
        >
          <span className="text-3xl">{'\u{1F3C6}'}</span>
          <span>{'\u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u043b\u0438\u0434\u0435\u0440\u043e\u0432'}</span>
        </button>

        {/* Teacher Dashboard button - only for teachers */}
        {user?.role === 'teacher' && (
          <button
            onClick={() => {
              soundManager.playClick();
              navigate('/teacher/dashboard');
            }}
            className="px-3 py-2 sm:px-4 sm:py-3 xl:px-8 xl:py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold text-sm sm:text-base xl:text-xl rounded-xl xl:rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transform transition-all border-4 border-green-600 flex items-center gap-3"
          >
            <span className="text-3xl">{'\u{1F468}\u200D\u{1F3EB}'}</span>
            <span>{'\u0414\u0430\u0448\u0431\u043e\u0440\u0434 \u0443\u0447\u0438\u0442\u0435\u043b\u044f'}</span>
          </button>
        )}
      </div>

      {/* Progress indicator - hidden as per request */}
      {/* <div className="absolute top-3 left-3 sm:top-5 sm:left-5 xl:top-8 xl:left-8 z-20">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl px-3 py-2 sm:px-4 sm:py-3 xl:px-6 xl:py-4 border-2 xl:border-4 border-purple-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">РІВ­С’</span>
            <div>
              <div className="text-2xl font-bold text-purple-600">{progress.totalPoints}</div>
              <div className="text-sm text-gray-600">Р вЂ™РЎРѓР ВµР С–Р С• Р В±Р В°Р В»Р В»Р С•Р Р†</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Islands Map */}
      <div className="relative z-10 flex h-[100dvh] w-full items-center justify-center">
        <div className="relative h-[72dvh] w-full max-w-7xl sm:h-[76dvh] xl:h-[80dvh]">
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
