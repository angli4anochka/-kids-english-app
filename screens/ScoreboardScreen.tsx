import { useNavigate } from '@/utils/routing-adapter';
import { useState, useEffect } from 'react';
import { islands, teams } from '../data/islands';
import { useProgress } from '../hooks/useProgress';
import { soundManager } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';


// Prize options for each badge slot
const PRIZE_OPTIONS = [
  { type: 'points', emoji: '💰', name: '+10 баллов', value: 10 },
  { type: 'island_picture', emoji: '🏝️', name: 'Картинка острова', value: 'island' },
  { type: 'homework_skip', emoji: '📝', name: 'Пропуск домашки', value: 'skip' },
  { type: 'super_badge', emoji: '⭐', name: 'Супер-значок', value: 'super' },
];

// Badge system: 6 slots, each costs 50 points
const BADGE_SLOTS = [
  { pointsRequired: 50, position: 0 },
  { pointsRequired: 100, position: 1 },
  { pointsRequired: 150, position: 2 },
  { pointsRequired: 200, position: 3 },
  { pointsRequired: 250, position: 4 },
  { pointsRequired: 300, position: 5 },
];

interface Student {
  id: number;
  group_id: number;
  student_name: string;
  created_at: string;
  points: number;
  prizes?: string; // JSON string of unlocked prizes
}

interface Group {
  id: number;
  name: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  students: Student[];
}

const ScoreboardScreen = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<{ id: string; name: string; currentPoints: number } | null>(null);
  const [newPoints, setNewPoints] = useState<string>('');
  const [globalLeader, setGlobalLeader] = useState<{ student_name: string; points: number; group_name: string } | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchGlobalLeader();
  }, [user?.id]);

  const fetchGroups = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      if (user.role === 'student') {
        // For students, fetch only their group
        if (!user.groupId) {
          console.error('Student has no groupId');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/kids-api/groups/${user.groupId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setGroups([data.data]);
          setSelectedGroupId(data.data.id);
        }
      } else {
        // For teachers, fetch all their groups
        const response = await fetch(`/kids-api/groups?teacherId=${user.id}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setGroups(data.data);
          // Select first group by default only if no group is currently selected
          if (!selectedGroupId) {
            setSelectedGroupId(data.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalLeader = async () => {
    try {
      const response = await fetch('/kids-api/students/leader');
      const data = await response.json();

      if (data.success && data.data) {
        setGlobalLeader(data.data);
      }
    } catch (err) {
      console.error('Error fetching global leader:', err);
    }
  };

  const handleEditPoints = (studentId: string, studentName: string, currentPoints: number) => {
    setEditingStudent({ id: studentId, name: studentName, currentPoints });
    setNewPoints(currentPoints.toString());
    soundManager.playClick();
  };

  const handleSavePoints = async () => {
    if (!editingStudent) return;

    const points = parseInt(newPoints, 10);
    if (isNaN(points) || points < 0) {
      alert('Пожалуйста, введите корректное число баллов (0 или больше)');
      return;
    }

    try {
      const response = await fetch(`/kids-api/students/${editingStudent.id}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh groups and global leader to get updated points
        await fetchGroups();
        await fetchGlobalLeader();
        setEditingStudent(null);
        setNewPoints('');
        soundManager.playCorrect();
      } else {
        alert('Ошибка при сохранении баллов: ' + data.error);
        soundManager.playIncorrect();
      }
    } catch (error) {
      console.error('Error saving points:', error);
      alert('Ошибка при сохранении баллов');
      soundManager.playIncorrect();
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setNewPoints('');
    soundManager.playClick();
  };

  // Find selected group
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Convert students to display format with real points from database
  const groupStudents = (selectedGroup?.students ?? []).map((student) => ({
    id: student.id.toString(),
    name: student.student_name,
    avatar: student.student_name.charAt(0).toUpperCase(),
    points: student.points || 0, // Use real points from database
    groupId: student.group_id,
  })) || [];

  // Сортируем по баллам для рейтинга
  const sortedStudents = [...groupStudents].sort((a, b) => b.points - a.points);

  // Топ-3 для рейтинга
  const top3 = sortedStudents.slice(0, 3);

  // Лидер сезона
  const leader = sortedStudents[0];

  const handleBackToMap = () => {
    soundManager.playClick();
    // Teachers must not fall into the student island map — send them to their dashboard
    navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/map');
  };

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[index % colors.length];
  };

  // Calculate which badge slots are unlocked and assign random prizes
  const getUnlockedBadges = (points: number, studentId: string, savedPrizes?: string, pointsOffset = 0) => {
    // Parse saved prizes or create empty array
    let prizes: Array<{position: number, prize: typeof PRIZE_OPTIONS[0]} | null> = [];

    if (savedPrizes) {
      try {
        prizes = JSON.parse(savedPrizes);
      } catch (e) {
        prizes = [];
      }
    }

    return BADGE_SLOTS.map((slot, index) => {
      const unlocked = points >= slot.pointsRequired + pointsOffset;

      // If unlocked but no prize assigned yet, randomly select one
      if (unlocked && !prizes[index]) {
        // Use studentId and position as seed for consistent randomization
        const seed = parseInt(studentId) + slot.position;
        const prizeIndex = seed % PRIZE_OPTIONS.length;
        const prize = PRIZE_OPTIONS[prizeIndex];

        return {
          ...slot,
          pointsRequired: slot.pointsRequired + pointsOffset,
          unlocked: true,
          prize,
        };
      } else if (unlocked && prizes[index]) {
        // Use saved prize
        return {
          ...slot,
          pointsRequired: slot.pointsRequired + pointsOffset,
          unlocked: true,
          prize: prizes[index]?.prize || PRIZE_OPTIONS[0],
        };
      } else {
        // Locked slot
        return {
          ...slot,
          pointsRequired: slot.pointsRequired + pointsOffset,
          unlocked: false,
          prize: null,
        };
      }
    });
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden p-2 sm:p-3 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(https://storage.yandexcloud.net/kids-app/public-assets/img/background.webp)'
      }}
    >
      {/* Основной контейнер на весь экран с отступом 15px */}
      <div className="w-full relative">
        {/* Тропические элементы фона */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Облака */}
          <div className="absolute top-10 left-10 text-6xl opacity-80">☁️</div>
          <div className="absolute top-20 right-20 text-7xl opacity-70">☁️</div>
          <div className="absolute top-32 left-1/3 text-5xl opacity-60">☁️</div>

          {/* Пальмы */}
          <div className="absolute top-40 left-5 text-8xl">🌴</div>
          <div className="absolute top-32 right-10 text-9xl">🌴</div>

          {/* Попугай */}
          <div className="absolute top-1/3 left-12 text-6xl">🦜</div>

          {/* Внизу - песок/пляж */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-200 to-transparent"></div>

          {/* Бочка */}
          <div className="absolute bottom-20 left-8 text-6xl">🛢️</div>

          {/* Кокосы */}
          <div className="absolute bottom-24 left-28 text-4xl">🥥</div>
          <div className="absolute bottom-28 left-32 text-3xl">🥥</div>

          {/* Морская звезда */}
          <div className="absolute bottom-16 right-32 text-4xl">⭐</div>

          {/* Сундук с сокровищами */}
          <div className="absolute bottom-16 right-16 text-7xl">💰</div>
        </div>

        <div className="relative z-10 w-full max-w-[1500px] mx-auto p-1 sm:p-2 lg:p-4 space-y-3">
        {/* Header - Деревянная табличка с короной */}
        <div className="text-center">
          <div className="inline-block relative">
            {/* Корона над табличкой */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl">
              👑
            </div>

            {/* Деревянная табличка */}
            <div className="bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-700 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl border-4 border-amber-800">
              <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg mb-1">
                Чемпион сезона 🏆
              </h1>
              <p className="text-base text-amber-100">Очки и награды по группам</p>
            </div>

            {/* Цветы */}
            <div className="absolute -top-4 -left-8 text-5xl">🌺</div>
            <div className="absolute -top-4 -right-8 text-5xl">🌺</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <p className="text-2xl text-gray-700">Загрузка групп...</p>
          </div>
        )}

        {/* No Groups State */}
        {!isLoading && groups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-2xl text-gray-700 mb-4">У вас пока нет групп</p>
            <button
              onClick={() => navigate('/teacher/groups')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
            >
              Создать группу
            </button>
          </div>
        )}

        {/* Вкладки групп - только для учителей */}
        {!isLoading && groups.length > 0 && user?.role === 'teacher' && (
          <div className="flex justify-center gap-3 flex-wrap">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  soundManager.playClick();
                }}
                className={`px-4 py-2 rounded-xl font-bold text-base transition-all transform hover:scale-105 ${
                  selectedGroupId === group.id
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105'
                    : 'bg-gradient-to-br from-amber-200 to-yellow-300 text-amber-900 shadow-md'
                }`}
              >
                {group.name} {selectedGroupId === group.id && '⭐'}
              </button>
            ))}
          </div>
        )}

        {/* Основная панель - две колонки: 2/3 и 1/3 */}
        {!isLoading && selectedGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Левая панель - Ученики (2/3) */}
          <div className="relative lg:col-span-2">
            {/* Деревянная рамка */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl shadow-xl border-4 border-amber-700 p-3">
              {/* Заголовок */}
              <div className="bg-gradient-to-r from-amber-600 to-yellow-700 rounded-xl px-4 py-2 mb-3 text-center border-2 border-amber-800">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Ученики</h2>
              </div>

              {/* Список учеников */}
              <div className="space-y-2">
                {groupStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-2.5 shadow-md border-2 border-amber-300 flex flex-wrap items-center gap-2"
                  >
                    {/* Имя */}
                    <div className="flex-1">
                      <div className="text-base font-bold text-gray-800">{student.name}</div>
                    </div>

                    {/* Баллы */}
                    <div className="flex items-center gap-1 bg-amber-200 px-3 py-1.5 rounded-lg border-2 border-amber-400">
                      <span className="text-2xl">🌟</span>
                      <span className="text-base font-bold text-amber-900">{student.points}</span>
                    </div>

                    {/* Кнопка редактирования баллов - только для учителей */}
                    {user?.role === 'teacher' && (
                      <button
                        onClick={() => handleEditPoints(student.id, student.name, student.points)}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                        title="Изменить баллы"
                      >
                        ✏️
                      </button>
                    )}

                    {/* Призы в кружочках - открываются по мере набора баллов */}
                    <div className="flex flex-wrap gap-1.5">
                      {(student.id === '12' || (user?.role === 'student' && String(user.id) === student.id && progress.completedIslands.includes('island-1'))) ? (<>
                        <div className="flex h-12 min-w-28 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-100 to-green-200 px-3 shadow" title="Остров 1 пройден — награды собраны">
                          <span className="text-2xl">🏝️</span>
                          <span className="text-left leading-tight"><b className="block text-xs text-emerald-900">Остров 1</b><small className="text-[10px] font-bold text-emerald-700">{getUnlockedBadges(student.points, student.id).filter(slot => slot.unlocked).length} наград</small></span>
                        </div>
                        {getUnlockedBadges(student.points, student.id, undefined, 250).filter(slot => slot.unlocked).map((slot, i) => (
                          <div key={`island-2-${i}`} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-400 bg-gradient-to-br from-cyan-100 to-blue-200 text-xl shadow" title={`${slot.prize?.name || 'Награда'} острова 2 (${slot.pointsRequired} баллов)`}>{slot.prize?.emoji}</div>
                        ))}
                      </>) : getUnlockedBadges(student.points, student.id).map((slot, i) => (
                        <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl transition-all ${slot.unlocked && slot.prize ? 'border-amber-400 bg-gradient-to-br from-yellow-200 to-amber-300' : 'border-gray-400 bg-gray-300 opacity-45'}`} title={slot.unlocked && slot.prize ? `${slot.prize.name} (${slot.pointsRequired} баллов)` : `Заблокировано: нужно ${slot.pointsRequired} баллов`}>
                          {slot.unlocked && slot.prize ? slot.prize.emoji : '❓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Декорация - бамбук */}
            <div className="absolute -top-4 -left-4 text-6xl">🎋</div>
            <div className="absolute -bottom-4 -right-4 text-6xl">🎋</div>
          </div>

          {/* Правая панель - Рейтинг (1/3) */}
          <div className="relative lg:col-span-1">
            {/* Деревянная рамка */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl shadow-xl border-4 border-amber-700 p-3 h-full">
              {/* Заголовок */}
              <div className="bg-gradient-to-r from-amber-600 to-yellow-700 rounded-xl px-4 py-2 mb-3 text-center border-2 border-amber-800">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Рейтинг</h2>
              </div>

              {/* Топ-3 места */}
              <div className="space-y-3">
                {top3.map((student, index) => {
                  const rank = index + 1;
                  let bgColor = '';
                  let icon = '';
                  let textColor = '';

                  if (rank === 1) {
                    bgColor = 'bg-gradient-to-br from-yellow-300 to-amber-400';
                    icon = '🏆';
                    textColor = 'text-amber-900';
                  } else if (rank === 2) {
                    bgColor = 'bg-gradient-to-br from-gray-200 to-gray-400';
                    icon = '🥈';
                    textColor = 'text-gray-800';
                  } else if (rank === 3) {
                    bgColor = 'bg-gradient-to-br from-orange-300 to-orange-500';
                    icon = '🥉';
                    textColor = 'text-orange-900';
                  }

                  return (
                    <div
                      key={student.id}
                      className={`${bgColor} rounded-xl p-3 shadow-lg border-2 ${rank === 1 ? 'border-yellow-500 scale-105' : rank === 2 ? 'border-gray-500' : 'border-orange-600'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{icon}</div>
                          <div>
                            <div className={`text-xl font-bold ${textColor}`}>
                              {rank} место
                            </div>
                            <div className={`text-base ${textColor} opacity-80`}>
                              {student.name}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${textColor}`}>
                          {student.points} 🌟
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Пустое место для баланса */}
              {top3.length < 3 && (
                <div className="mt-6 text-center text-gray-500 text-lg">
                  Еще нет достаточно участников
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Лидер сезона - ГЛОБАЛЬНЫЙ из всех групп */}
        {!isLoading && globalLeader && (
          <div className="text-center">
            <div className="inline-block bg-gradient-to-br from-yellow-200 via-amber-200 to-orange-200 px-10 py-4 rounded-full shadow-2xl border-4 border-amber-600">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xl sm:text-2xl font-bold text-amber-900">
                <span className="text-3xl">👑</span>
                <span>Лидер сезона: {globalLeader.student_name}</span>
                <span className="text-lg text-amber-700">({globalLeader.group_name})</span>
                <span className="text-3xl">{globalLeader.points} баллов</span>
                <span className="text-3xl">🌿</span>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки навигации */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleBackToMap}
            className="px-10 py-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transform transition-all border-4 border-blue-700"
          >
            {user?.role === 'teacher' ? '⬅️ В кабинет учителя' : '⬅️ Вернуться на карту'}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              // Здесь можно добавить переход к детальной статистике
            }}
            className="px-10 py-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transform transition-all border-4 border-purple-700"
          >
            📊 Моя статистика
          </button>
        </div>
      </div>

        {/* Модальное окно редактирования баллов */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                ✏️ Редактировать баллы
              </h2>

              <div className="mb-6">
                <p className="text-lg text-gray-600 mb-2">Ученик:</p>
                <p className="text-2xl font-bold text-gray-800 mb-4">{editingStudent.name}</p>

                <p className="text-lg text-gray-600 mb-2">Текущие баллы: {editingStudent.currentPoints}</p>

                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Новые баллы:
                </label>
                <input
                  type="number"
                  min="0"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="Введите баллы"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSavePoints}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  ✅ Сохранить
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreboardScreen;
