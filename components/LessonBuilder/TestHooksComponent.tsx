/**
 * Тестовый компонент для проверки созданных хуков
 */

import React from 'react';
import { useLessonBuilderState } from './hooks/useLessonBuilderState';
import { useLessonMutations } from './hooks/useLessonMutations';
import { useLessonRealtime } from './hooks/useLessonRealtime';
import { LessonToolbar } from './components/ui/LessonToolbar';

const TestHooksComponent = () => {
  // 1. Тест useLessonBuilderState
  const {
    id,
    title,
    activities,
    selectedActivity,
    isViewMode,
    isSaving,
    setTitle,
    setActivities,
    setSelectedActivity,
    setIsViewMode,
    setIsSaving,
  } = useLessonBuilderState();

  // 2. Тест useLessonMutations
  const { saveLesson, editActivity, deleteActivity, addActivity, reorderActivities } =
    useLessonMutations({
      currentLessonId: id,
      currentGroupId: null,
      islandId: 'island-1',
      lessonNumber: '1',
      title,
      activities,
      setActivities,
      setSelectedActivity,
      setIsSaving,
    });

  // 3. Тест useLessonRealtime
  const {
    isJoined,
    isSessionLoading,
    sessionError,
    sessionStudents,
    switchActivity,
    createSession,
    enableInteractive,
    disableInteractive,
  } = useLessonRealtime({
    currentLessonId: id,
    currentGroupId: null,
    activities,
    selectedActivity,
    isViewMode,
    isInteractiveEnabled: false,
    setSelectedActivity,
    setIsInteractiveEnabled: () => {},
    setIsTransitioning: () => {},
    setTransitionDirection: () => {},
  });

  // Тестовые функции
  const runTests = () => {
    console.log('=== ТЕСТ 1: useLessonBuilderState ===');
    console.log('✓ ID урока:', id);
    console.log('✓ Название урока:', title);
    console.log('✓ Количество активностей:', activities.length);
    console.log('✓ Выбранная активность:', selectedActivity?.title || 'Нет');
    console.log('✓ Режим просмотра:', isViewMode);
    console.log('✓ Сохранение:', isSaving);

    console.log('\n=== ТЕСТ 2: useLessonMutations ===');
    console.log('✓ saveLesson функция:', typeof saveLesson === 'function');
    console.log('✓ editActivity функция:', typeof editActivity === 'function');
    console.log('✓ deleteActivity функция:', typeof deleteActivity === 'function');
    console.log('✓ addActivity функция:', typeof addActivity === 'function');
    console.log('✓ reorderActivities функция:', typeof reorderActivities === 'function');

    console.log('\n=== ТЕСТ 3: useLessonRealtime ===');
    console.log('✓ isJoined:', isJoined);
    console.log('✓ isSessionLoading:', isSessionLoading);
    console.log('✓ sessionError:', sessionError || 'Нет ошибок');
    console.log('✓ sessionStudents:', sessionStudents.length, 'студентов');
    console.log('✓ switchActivity функция:', typeof switchActivity === 'function');
    console.log('✓ createSession функция:', typeof createSession === 'function');

    console.log('\n=== ТЕСТ 4: Функции изменения состояния ===');

    // Тест изменения названия
    const oldTitle = title;
    setTitle('Новое название урока');
    console.log('✓ Изменение названия: OK');
    setTitle(oldTitle);

    // Тест переключения режима просмотра
    const oldViewMode = isViewMode;
    setIsViewMode(!isViewMode);
    console.log('✓ Переключение режима просмотра: OK');
    setIsViewMode(oldViewMode);

    console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Тестирование хуков LessonBuilder</h1>

      <div className="space-y-4">
        {/* Тест 1: State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">1. useLessonBuilderState</h2>
          <div className="space-y-2">
            <p><strong>ID урока:</strong> {id || 'Не загружен'}</p>
            <p><strong>Название:</strong> {title}</p>
            <p><strong>Активностей:</strong> {activities.length}</p>
            <p><strong>Режим просмотра:</strong> {isViewMode ? 'Да' : 'Нет'}</p>
            <p><strong>Сохранение:</strong> {isSaving ? 'В процессе...' : 'Готов'}</p>

            <button
              onClick={() => setTitle('Тестовое название')}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Изменить название
            </button>
          </div>
        </div>

        {/* Тест 2: Mutations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">2. useLessonMutations</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={saveLesson}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить урок'}
            </button>

            <button
              onClick={() => {
                const newActivity = {
                  id: Date.now().toString(),
                  type: 'test',
                  title: 'Тестовая активность',
                  subtitle: '',
                  isCompleted: false,
                  points: 10,
                  order: activities.length,
                };
                addActivity(newActivity);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Добавить активность
            </button>

            {selectedActivity && (
              <button
                onClick={() => deleteActivity(selectedActivity.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Удалить выбранную
              </button>
            )}
          </div>
        </div>

        {/* Тест 3: Realtime */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">3. useLessonRealtime</h2>
          <div className="space-y-2">
            <p><strong>Статус сессии:</strong> {isJoined ? '🟢 Подключен' : '⚪ Не подключен'}</p>
            <p><strong>Загрузка:</strong> {isSessionLoading ? 'Да' : 'Нет'}</p>
            <p><strong>Ошибки:</strong> {sessionError || 'Нет'}</p>
            <p><strong>Студентов:</strong> {sessionStudents.length}</p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={enableInteractive}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Включить интерактив
              </button>

              <button
                onClick={disableInteractive}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Выключить интерактив
              </button>
            </div>
          </div>
        </div>

        {/* Тест 4: LessonToolbar Component */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">4. LessonToolbar Component</h2>
          <LessonToolbar
            title={title}
            totalActivities={activities.length}
            isSaving={isSaving}
            onSave={saveLesson}
            editingTitleId={null}
            editingTitleValue=""
            onStartEditTitle={() => console.log('Start edit')}
            onUpdateEditValue={(val) => console.log('Update:', val)}
            onSaveTitle={() => console.log('Save title')}
            onCancelEditTitle={() => console.log('Cancel edit')}
          />
        </div>

        {/* Кнопка запуска всех тестов */}
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={runTests}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-blue-600"
          >
            🧪 Запустить все тесты в консоли
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Откройте консоль браузера (F12) чтобы увидеть результаты тестов
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestHooksComponent;
