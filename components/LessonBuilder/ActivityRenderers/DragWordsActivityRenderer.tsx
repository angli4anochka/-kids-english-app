import { useState } from 'react';
import type { Activity } from '../../../types';
import DragTextSession from '../DragTextSession';
import DragTextStudent from '../DragTextStudent';

interface DragWordsActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения Drag Words активности
 * Игра перетаскивания слов для заполнения пропусков
 */
const DragWordsActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  onEdit,
}: DragWordsActivityRendererProps) => {
  const activityData = activity as any;
  const text = activityData.dragTextData?.text || '';
  const [showSession, setShowSession] = useState(false);

  // If not in view mode, show editor
  if (!isViewMode) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Drag Words Activity</h3>
          <p className="text-gray-600 mb-4">
            Create text with draggable words. Wrap words in square brackets: [word]
          </p>
          <textarea
            placeholder="Example: The cat [sat] on the [mat]"
            className="w-full p-4 border rounded-lg min-h-48 font-mono"
            onChange={(e) => {
              onEdit({
                ...activity,
                dragTextData: { text: e.target.value },
              } as any);
            }}
            value={text}
          />
          <p className="text-sm text-gray-500 mt-2">
            Words in [brackets] will become draggable blanks for students
          </p>
        </div>
      </div>
    );
  }

  // In view mode - show session launcher for teacher, or student view
  if (isTeacher) {
    if (showSession && lessonId && groupId) {
      return (
        <DragTextSession
          activityText={text}
          lessonId={lessonId}
          activityIndex={activity.orderIndex || 0}
          groupId={groupId}
          onClose={() => setShowSession(false)}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📝</div>
          <h3 className="text-2xl font-semibold mb-4">Drag Words Activity</h3>
          <p className="text-gray-600 mb-6">
            Start a session for students to practice word dragging
          </p>
          <button
            onClick={() => setShowSession(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  // Student view - check if there's an active session
  // For now, show a placeholder. In real implementation, check for sessionId from WebSocket
  const sessionId = (activityData as any).sessionId || '';

  if (sessionId) {
    return <DragTextStudent activityText={text} sessionId={sessionId} />;
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl text-gray-700">Waiting for teacher to start the session...</p>
      </div>
    </div>
  );
};

export default DragWordsActivityRenderer;
