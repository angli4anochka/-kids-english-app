import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@/utils/routing-adapter';
import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';

export default function TeacherDashboard() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const teacherName = user?.displayName?.trim() || user?.email?.split('@')[0] || '';
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [subscription, setSubscription] = useState<{ status: string; daysLeft: number; plan: string | null } | null>(null);
  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<string[]>(['']);
  const [tutorsDeskGroups, setTutorsDeskGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedTutorsDeskGroup, setSelectedTutorsDeskGroup] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/kids-api/teacher-subscription?teacherId=' + user.id)
      .then(r => r.json())
      .then(d => { if (d.success) setSubscription({ status: d.status, daysLeft: d.daysLeft, plan: d.plan }); })
      .catch(() => {});
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const addStudentField = () => {
    setStudents([...students, '']);
  };

  const updateStudent = (index: number, value: string) => {
    const newStudents = [...students];
    newStudents[index] = value;
    setStudents(newStudents);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const fetchTutorsDeskGroups = async () => {
    setIsLoadingGroups(true);
    try {
      // Get auth token from main TutorsDesk app (stored as 'token')
      const authToken = localStorage.getItem('token');
      console.log('Auth token found:', authToken ? 'YES' : 'NO');

      if (!authToken) {
        alert('Необходимо войти в TutorsDesk (tutorsdesk.ru)');
        setIsLoadingGroups(false);
        return;
      }

      console.log('Fetching groups from /api/groups...');
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch groups: ${response.status} ${errorText}`);
      }

      const groups = await response.json();
      console.log('Groups loaded:', groups.length);
      setTutorsDeskGroups(groups);
    } catch (error) {
      console.error('Error fetching TutorsDesk groups:', error);
      alert('Ошибка при загрузке групп из TutorsDesk. Проверьте консоль для деталей.');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleImportFromTutorsDesk = () => {
    setShowGroupModal(false);
    setShowImportModal(true);
    fetchTutorsDeskGroups();
  };

  const handleSelectGroupForImport = async (tutorsDeskGroup: any) => {
    try {
      // Fetch full group details with students
      const authToken = localStorage.getItem('token');
      console.log('Fetching group details for:', tutorsDeskGroup.id);

      const response = await fetch(`/api/groups/${tutorsDeskGroup.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }

      const groupDetails = await response.json();
      console.log('Group details loaded:', groupDetails);
      console.log('Students:', groupDetails.students);
      console.log('Non-personal students:', groupDetails.students?.filter((s: any) => !s.isPersonal));

      setSelectedTutorsDeskGroup(groupDetails);
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert('Ошибка при загрузке деталей группы');
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedTutorsDeskGroup) return;

    try {
      // Import ALL students (including personal ones)
      const allStudents = selectedTutorsDeskGroup.students || [];
      const studentNames = allStudents.map((s: any) => s.fullName);

      console.log('Importing group:', selectedTutorsDeskGroup.name);
      console.log('Student names:', studentNames);

      if (studentNames.length === 0) {
        alert('В группе нет учеников для импорта');
        return;
      }

      const response = await fetch('/kids-api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedTutorsDeskGroup.name,
          teacherId: user?.id,
          students: studentNames,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to import group');
      }

      alert(`Группа "${selectedTutorsDeskGroup.name}" импортирована с ${studentNames.length} учениками!`);
      setShowImportModal(false);
      setSelectedTutorsDeskGroup(null);
      setTutorsDeskGroups([]);
    } catch (error) {
      console.error('Error importing group:', error);
      alert('Ошибка при импорте группы');
    }
  };

  const handleCreateGroup = async () => {
    const validStudents = students.filter(s => s.trim() !== '');

    try {
      const response = await fetch('/kids-api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          teacherId: user?.id,
          students: validStudents,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create group');
      }

      alert(`Группа "${groupName}" создана с ${validStudents.length} учениками!`);
      setShowCreateForm(false);
      setShowGroupModal(false);
      setGroupName('');
      setStudents(['']);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Ошибка при создании группы');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card variant="elevated" padding="lg" rounded="2xl" className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: user?.avatarColor }}
              >
                {teacherName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Добро пожаловать{isAuthLoading ? '...' : teacherName ? `, ${teacherName}` : ''}!
                </h1>
                <p className="text-gray-600">{isAuthLoading ? '' : user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {subscription?.status === 'active' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 text-green-700 rounded-lg font-semibold text-sm">
                  <span>✅</span>
                  <span>Подписка — {subscription.daysLeft} {subscription.daysLeft === 1 ? 'день' : subscription.daysLeft < 5 ? 'дня' : 'дней'}</span>
                </div>
              )}
              {subscription?.status === 'trial' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg font-semibold text-sm">
                  <span>⏳</span>
                  <span>Пробный — {subscription.daysLeft} {subscription.daysLeft === 1 ? 'день' : subscription.daysLeft < 5 ? 'дня' : 'дней'}</span>
                </div>
              )}
              {(subscription?.status === 'trial_expired' || subscription?.status === 'expired') && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 text-red-600 rounded-lg font-semibold text-sm">
                  <span>🔒</span>
                  <span>Нет подписки</span>
                </div>
              )}
              {user?.email === 'angli4anochka@gmail.com' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold text-sm"
                >
                  ⚙️ Админ
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </Card>

        {/* Subscription Banner */}
        {subscription?.status === 'active' && subscription.daysLeft <= 7 && (
          <div className="mb-6 bg-orange-50 border border-orange-300 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-bold text-orange-800">Подписка истекает через {subscription.daysLeft} {subscription.daysLeft === 1 ? 'день' : subscription.daysLeft < 5 ? 'дня' : 'дней'}</div>
                <div className="text-sm text-orange-600">Напишите нам, чтобы продлить</div>
              </div>
            </div>
            <a href="https://t.me/angli4anochka" target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition">
              Продлить →
            </a>
          </div>
        )}

        {(subscription?.status === 'trial_expired' || subscription?.status === 'expired') && (
          <div className="mb-6 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-5 text-white">
              <div className="text-2xl font-bold mb-1">
                {subscription.status === 'trial_expired' ? '🔒 Пробный период завершён' : '🔒 Подписка истекла'}
              </div>
              <div className="text-red-100 text-sm">Выберите тариф и напишите нам для активации</div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'monthly', label: '1 месяц', days: 30, price: '490 ₽', note: null },
                  { key: 'quarterly', label: '3 месяца', days: 90, price: '1 290 ₽', note: 'Экономия 180 ₽', highlight: false },
                  { key: 'annual', label: '1 год', days: 365, price: '3 900 ₽', note: 'Выгоднее всего', highlight: true },
                ].map(plan => (
                  <div key={plan.key}
                    className={`relative rounded-xl border-2 p-5 text-center ${plan.highlight ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">Популярный</div>
                    )}
                    <div className="text-lg font-bold text-gray-800 mb-1">{plan.label}</div>
                    <div className={`text-3xl font-black mb-1 ${plan.highlight ? 'text-purple-600' : 'text-gray-800'}`}>{plan.price}</div>
                    {plan.note && <div className="text-xs text-green-600 font-semibold mb-2">{plan.note}</div>}
                    <a href={'https://t.me/angli4anochka?text=' + encodeURIComponent('Хочу подписку «' + plan.label + '» для ' + (user?.displayName || user?.email || ''))}
                      target="_blank" rel="noreferrer"
                      className={`block w-full mt-3 py-2 rounded-lg font-semibold text-sm transition ${plan.highlight ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                      Выбрать
                    </a>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-gray-500">
                После оплаты напишите в <a href="https://t.me/angli4anochka" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-semibold">@angli4anochka</a> — активируем в течение нескольких минут
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Lessons Card */}
          <Card variant="elevated" padding="lg" rounded="2xl" hover className="cursor-pointer">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Мои уроки</h2>
            <p className="text-gray-600 mb-4">Просмотр и управление созданными уроками</p>
            <button
              onClick={() => navigate('/teacher/lessons')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Открыть
            </button>
          </Card>

          {/* Sessions Card */}
          <Card variant="elevated" padding="lg" rounded="2xl" hover className="cursor-pointer">
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Сессии</h2>
            <p className="text-gray-600 mb-4">Начать урок со студентами</p>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              Запустить
            </button>
          </Card>

          {/* Statistics Card */}
          <Card variant="elevated" padding="lg" rounded="2xl">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Статистика</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего уроков:</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Активных сессий:</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Студентов:</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </Card>

          {/* My Groups Card */}
          <Card variant="elevated" padding="lg" rounded="2xl" hover className="cursor-pointer">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Мои группы</h2>
            <p className="text-gray-600 mb-4">Просмотр и управление группами</p>
            <button
              onClick={() => navigate('/teacher/groups')}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Открыть
            </button>
          </Card>

          {/* Help Card */}
          <Card variant="elevated" padding="lg" rounded="2xl">
            <div className="text-4xl mb-4">❓</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Помощь</h2>
            <p className="text-gray-600 mb-4">Инструкции и поддержка</p>
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              Открыть
            </button>
          </Card>
        </div>
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && !showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Добавить группу
            </h2>

            <div className="space-y-4">
              {/* Create New Group Option */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">➕</span>
                  <div className="text-left">
                    <div className="text-lg">Создать группу</div>
                    <div className="text-sm opacity-90">Создать новую группу с нуля</div>
                  </div>
                </div>
              </button>

              {/* Import from TutorDesk Option */}
              <button
                onClick={handleImportFromTutorsDesk}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div className="text-left">
                    <div className="text-lg">Импортировать из TutorDesk</div>
                    <div className="text-sm opacity-90">Синхронизировать с существующей группой</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowGroupModal(false)}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Создать группу</h2>

            {/* Group Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название группы
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Например: Группа 5А"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* Students List */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ученики
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={student}
                      onChange={(e) => updateStudent(index, e.target.value)}
                      placeholder={`Имя ученика ${index + 1}`}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    />
                    {students.length > 1 && (
                      <button
                        onClick={() => removeStudent(index)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addStudentField}
                className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                + Добавить ученика
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setGroupName('');
                  setStudents(['']);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || students.filter(s => s.trim()).length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from TutorsDesk Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Импорт группы из TutorsDesk
            </h2>

            {isLoadingGroups && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p className="text-gray-600">Загрузка групп...</p>
              </div>
            )}

            {!isLoadingGroups && tutorsDeskGroups.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-600">Нет доступных групп в TutorsDesk</p>
              </div>
            )}

            {!isLoadingGroups && tutorsDeskGroups.length > 0 && !selectedTutorsDeskGroup && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Выберите группу для импорта:</p>
                {tutorsDeskGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroupForImport(group)}
                    className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 rounded-xl p-4 transition text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-gray-800">{group.name}</div>
                        <div className="text-sm text-gray-600">
                          {group._count?.students || 0} учеников
                        </div>
                      </div>
                      <div className="text-2xl">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedTutorsDeskGroup && (
              <div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {selectedTutorsDeskGroup.name}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Ученики:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTutorsDeskGroup.students?.map((student: any) => (
                        <div
                          key={student.id}
                          className="bg-white px-3 py-2 rounded-lg text-sm text-gray-700"
                        >
                          👤 {student.fullName}
                        </div>
                      ))}
                    </div>
                    {(!selectedTutorsDeskGroup.students || selectedTutorsDeskGroup.students.length === 0) && (
                      <p className="text-gray-500 text-sm">Нет учеников для импорта</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTutorsDeskGroup(null)}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={!selectedTutorsDeskGroup.students || selectedTutorsDeskGroup.students.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Импортировать ({selectedTutorsDeskGroup.students?.length || 0} уч.)
                  </button>
                </div>
              </div>
            )}

            {!selectedTutorsDeskGroup && (
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setTutorsDeskGroups([]);
                }}
                className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
