# LessonBuilder Refactoring Guide

## 📁 Новая структура проекта

```
LessonBuilder/
├── types/
│   ├── lesson.types.ts          ✅ СОЗДАНО (84 строки)
│   └── builder.types.ts         ✅ СОЗДАНО (40 строк)
├── hooks/
│   ├── useLessonBuilderState.ts ✅ СОЗДАНО (470 строк)
│   ├── useLessonMutations.ts    ✅ СОЗДАНО (220 строк)
│   └── useLessonRealtime.ts     ✅ СОЗДАНО (200 строк)
├── components/
│   ├── ui/
│   │   └── LessonToolbar.tsx    ✅ СОЗДАНО (109 строк)
│   └── AutoSlideshow.tsx        ✅ СОЗДАНО (42 строки)
├── utils/
│   └── videoUtils.ts            ✅ СОЗДАНО (126 строк)
└── LessonBuilder.tsx            ⏳ ТРЕБУЕТ РЕФАКТОРИНГА (2678 → 250 строк)
```

**ИТОГО ВЫНЕСЕНО: ~1150 строк** из главного файла

---

## 🔧 Как использовать созданные хуки

### 1. useLessonBuilderState

**Заменяет множество useState вызовов одним хуком**

**Было (старый код):**
```tsx
const [unitTitle, setUnitTitle] = useState(`Unit ${lessonNumber}: Hello!`);
const [activities, setActivities] = useState<Activity[]>([]);
const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
const [isViewMode, setIsViewMode] = useState(false);
const [isSaving, setIsSaving] = useState(false);
// ... еще 15+ useState вызовов
```

**Стало (новый код):**
```tsx
import { useLessonBuilderState } from './hooks/useLessonBuilderState';

const {
  // State
  id, groupId, islandId, lessonNumber, title, activities, selectedActivity,
  isViewMode, isSaving, showAddModal, isInteractiveEnabled,
  draggedActivity, dragOverIndex, isTransitioning, transitionDirection,
  editingTitleId, editingTitleValue,

  // Setters
  setActivities, setSelectedActivity, setIsViewMode, setIsSaving,
  setShowAddModal, setIsInteractiveEnabled, setDraggedActivity,
  setDragOverIndex, setIsTransitioning, setTransitionDirection,
  setEditingTitleId, setEditingTitleValue, setTitle,
} = useLessonBuilderState();
```

**Экономия:** ~50 строк кода

---

### 2. useLessonMutations

**Заменяет все функции сохранения и редактирования**

**Было (старый код):**
```tsx
const handleSaveLesson = async () => {
  setIsSaving(true);
  try {
    const islandNumber = islandId ? parseInt(islandId.replace('island-', '')) : 1;
    // ... 100+ строк кода для сохранения
  } catch (error) {
    console.error('Error saving lesson:', error);
  } finally {
    setIsSaving(false);
  }
};

const handleEditActivity = async (activity: Activity) => {
  // ... 50+ строк кода
};

const handleDeleteActivity = (id: string) => {
  // ... 10+ строк кода
};
```

**Стало (новый код):**
```tsx
import { useLessonMutations } from './hooks/useLessonMutations';

const { saveLesson, editActivity, deleteActivity, addActivity, reorderActivities } =
  useLessonMutations({
    currentLessonId: id,
    currentGroupId: groupId,
    islandId,
    lessonNumber,
    title,
    activities,
    setActivities,
    setSelectedActivity,
    setIsSaving,
  });

// Использование:
<button onClick={saveLesson}>Сохранить урок</button>
<button onClick={() => deleteActivity(activity.id)}>Удалить</button>
```

**Экономия:** ~200 строк кода

---

### 3. useLessonRealtime

**Заменяет всю WebSocket логику**

**Было (старый код):**
```tsx
const {
  currentActivity: sessionActivity,
  isJoined,
  isLoading: isSessionLoading,
  // ... много WebSocket логики
} = useSession();

const { socket, isConnected } = useSocket();

// ... 150+ строк useEffect для WebSocket
```

**Стало (новый код):**
```tsx
import { useLessonRealtime } from './hooks/useLessonRealtime';

const {
  isJoined, isSessionLoading, sessionError, sessionStudents,
  switchActivity, createSession, changeActivity, joinSession,
  enableInteractive, disableInteractive,
} = useLessonRealtime({
  currentLessonId: id,
  currentGroupId: groupId,
  activities,
  selectedActivity,
  isViewMode,
  isInteractiveEnabled,
  setSelectedActivity,
  setIsInteractiveEnabled,
  setIsTransitioning,
  setTransitionDirection,
});

// Использование:
<button onClick={() => switchActivity(nextActivity)}>Далее</button>
<button onClick={enableInteractive}>Включить интерактив</button>
```

**Экономия:** ~200 строк кода

---

### 4. LessonToolbar компонент

**Заменяет панель управления уроком**

**Было (старый код):**
```tsx
<div className="mt-6 space-y-2">
  {user?.role === 'teacher' && (
    <button onClick={handleSaveLesson} disabled={isSaving}>
      {isSaving ? 'Сохранение...' : 'Сохранить урок'}
    </button>
  )}
  <button onClick={() => navigate('/teacher/lessons')}>
    ← Назад к урокам
  </button>
  // ... еще 50+ строк UI кода
</div>
```

**Стало (новый код):**
```tsx
import { LessonToolbar } from './components/ui/LessonToolbar';

<LessonToolbar
  title={title}
  totalActivities={activities.length}
  isSaving={isSaving}
  onSave={saveLesson}
  editingTitleId={editingTitleId}
  editingTitleValue={editingTitleValue}
  onStartEditTitle={() => setEditingTitleId('lesson-title')}
  onUpdateEditValue={setEditingTitleValue}
  onSaveTitle={() => { setTitle(editingTitleValue); setEditingTitleId(null); }}
  onCancelEditTitle={() => setEditingTitleId(null)}
/>
```

**Экономия:** ~100 строк кода

---

## 📊 Итоговая экономия кода

| Компонент/Хук | Строк в оригинале | Вынесено | Осталось использовать |
|---------------|-------------------|----------|------------------------|
| State management | ~250 | 470 | ~10 (вызов хука) |
| Mutations | ~200 | 220 | ~15 (вызов хука) |
| Realtime | ~200 | 200 | ~20 (вызов хука) |
| Toolbar UI | ~100 | 109 | ~15 (JSX компонента) |
| Video utils | ~180 | 126 | Импорты |
| Types | ~50 | 124 | Импорты |
| **ИТОГО** | **~980 строк** | **1249 строк** | **~60 строк** |

**Реальная экономия в главном файле: ~920 строк**

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Рефакторинг файла 2678 строк - большая задача**
   - Требует внимательной проверки всех зависимостей
   - Нужно тестировать после каждого большого изменения
   - Рекомендуется делать постепенно, а не всё сразу

2. **Созданные файлы уже загружены на сервер:**
   ```
   /var/www/kids-app/src/components/LessonBuilder/
   ├── types/lesson.types.ts ✅
   ├── types/builder.types.ts ✅
   ├── hooks/useLessonBuilderState.ts ✅
   ├── hooks/useLessonMutations.ts ✅
   ├── hooks/useLessonRealtime.ts ✅
   ├── components/ui/LessonToolbar.tsx ✅
   ├── components/AutoSlideshow.tsx ✅
   └── utils/videoUtils.ts ✅
   ```

3. **Backup создан:**
   ```
   /var/www/kids-app/src/components/LessonBuilder/LessonBuilder.tsx.backup
   ```

4. **Следующие шаги:**
   - Постепенно заменять код в LessonBuilder.tsx на вызовы хуков
   - Тестировать каждое изменение
   - Убедиться что все зависимости правильно импортированы

---

## 🚀 Быстрый старт рефакторинга

### Шаг 1: Добавить импорты

```tsx
// В начало LessonBuilder.tsx
import { useLessonBuilderState } from './hooks/useLessonBuilderState';
import { useLessonMutations } from './hooks/useLessonMutations';
import { useLessonRealtime } from './hooks/useLessonRealtime';
import { LessonToolbar } from './components/ui/LessonToolbar';
import type { Activity } from './types/lesson.types';
```

### Шаг 2: Заменить useState на хуки

Удалить все useState вызовы и заменить на:

```tsx
const state = useLessonBuilderState();
const mutations = useLessonMutations({ ...state, ... });
const realtime = useLessonRealtime({ ...state, ... });
```

### Шаг 3: Использовать компоненты

Заменить UI код на компоненты:

```tsx
<LessonToolbar {...toolbarProps} />
```

### Шаг 4: Тестировать

После каждого большого изменения - компилировать и тестировать.

---

## ✅ Что уже сделано

1. ✅ Типы данных созданы и загружены
2. ✅ Все хуки созданы и загружены
3. ✅ UI компоненты созданы
4. ✅ Утилиты вынесены
5. ✅ Backup создан
6. ✅ Структура папок организована

## 🔄 Что осталось

1. Интегрировать хуки в главный файл
2. Протестировать каждый хук отдельно
3. Убрать дублирование кода
4. Проверить типизацию TypeScript
5. Финальное тестирование всего функционала

---

**Автор рефакторинга:** Claude Code
**Дата:** 2026-05-23
**Статус:** Хуки и компоненты созданы, готовы к интеграции
