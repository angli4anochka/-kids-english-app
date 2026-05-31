import type { Activity } from '../../types';
import ImageActivityRenderer from './ActivityRenderers/ImageActivityRenderer';
import VideoActivityRenderer from './ActivityRenderers/VideoActivityRenderer';
import PresentationActivityRenderer from './ActivityRenderers/PresentationActivityRenderer';
import SnakeWordActivityRenderer from './ActivityRenderers/SnakeWordActivityRenderer';
import LetterTraceActivityRenderer from './ActivityRenderers/LetterTraceActivityRenderer';
import LetterRaceActivityRenderer from './ActivityRenderers/LetterRaceActivityRenderer';
import LetterMazeActivityRenderer from './ActivityRenderers/LetterMazeActivityRenderer';
import WordwallActivityRenderer from './ActivityRenderers/WordwallActivityRenderer';
import InteractiveActivityRenderer from './ActivityRenderers/InteractiveActivityRenderer';
import GeniallyActivityRenderer from './ActivityRenderers/GeniallyActivityRenderer';
import CompleteActivityRenderer from './ActivityRenderers/CompleteActivityRenderer';
import DragWordsActivityRenderer from './ActivityRenderers/DragWordsActivityRenderer';

interface ActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  sessionId?: string;
  socket?: any;
  isConnected?: boolean;
  onEdit: (activity: Activity) => void;
}

/**
 * Central component for rendering different activity types
 * Routes to specific activity renderers based on activity type
 */
const ActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  sessionId,
  socket,
  isConnected,
  onEdit,
}: ActivityRendererProps) => {
  // Image activity
  if (activity.type === 'image') {
    return (
      <ImageActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        onEdit={onEdit}
      />
    );
  }

  // Video activity
  if (activity.type === 'video') {
    return (
      <VideoActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        socket={socket}
        isConnected={isConnected || false}
        onEdit={onEdit}
      />
    );
  }

  // Internal video activity (uses same renderer as video)
  if (activity.type === 'internal-video') {
    return (
      <VideoActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        socket={socket}
        isConnected={isConnected || false}
        onEdit={onEdit}
      />
    );
  }

  // Presentation activity
  if (activity.type === 'presentation') {
    return (
      <PresentationActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        onEdit={onEdit}
      />
    );
  }

  // Snake Word game
  if (activity.type === 'snake-word') {
    return (
      <SnakeWordActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        sessionId={sessionId}
        onEdit={onEdit}
      />
    );
  }

  // Letter Trace game
  if (activity.type === 'letter-trace') {
    return (
      <LetterTraceActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        sessionId={sessionId}
        onEdit={onEdit}
      />
    );
  }

  // Letter Race game
  if (activity.type === 'letter-race') {
    return (
      <LetterRaceActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        sessionId={sessionId}
        onEdit={onEdit}
      />
    );
  }

  // Letter Maze game
  if (activity.type === 'letter-maze') {
    return (
      <LetterMazeActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        sessionId={sessionId}
        onEdit={onEdit}
      />
    );
  }

  // Wordwall game
  if (activity.type === 'wordwall') {
    return (
      <WordwallActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        onEdit={onEdit}
      />
    );
  }

  // Interactive activity
  if (activity.type === 'interactive') {
    return (
      <InteractiveActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        onEdit={onEdit}
      />
    );
  }

  // Genially presentation
  if (activity.type === 'genially') {
    return (
      <GeniallyActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        onEdit={onEdit}
      />
    );
  }

  // Complete activity
  if (activity.type === 'complete') {
    return (
      <CompleteActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        onEdit={onEdit}
      />
    );
  }

  // Drag Words activity
  if (activity.type === 'drag-words') {
    return (
      <DragWordsActivityRenderer
        activity={activity}
        isViewMode={isViewMode}
        isTeacher={isTeacher}
        lessonId={lessonId}
        groupId={groupId}
        onEdit={onEdit}
      />
    );
  }

  // Placeholder for other activity types
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-xl text-gray-700 mb-2">Activity type: {activity.type}</p>
        <p className="text-gray-500">Renderer component will be created for this activity type</p>
      </div>
    </div>
  );
};

export default ActivityRenderer;
