import PresentationActivity from '../PresentationActivity';
import type { Activity } from '../../../types';

interface PresentationActivityRendererProps {
  activity: Activity;
  isViewMode: boolean;
  isTeacher: boolean;
  lessonId?: string;
  groupId?: number;
  onEdit: (activity: Activity) => void;
}

/**
 * Компонент для отображения презентационной активности
 * Поддерживает Google Slides, screen share, и загруженные презентации
 */
const PresentationActivityRenderer = ({
  activity,
  isViewMode,
  isTeacher,
  lessonId,
  groupId,
  onEdit,
}: PresentationActivityRendererProps) => {
  const presentationActivity = activity as any;

  return (
    <PresentationActivity
      activity={{
        presentationType: presentationActivity.presentationType,
        presentationUrl: presentationActivity.presentationUrl,
        currentSlide: presentationActivity.currentSlide,
      }}
      isViewMode={isViewMode}
      onUpdate={(data: any) => {
        onEdit({
          ...activity,
          ...data,
        });
      }}
      lessonId={lessonId}
      groupId={groupId}
      isTeacher={isTeacher}
    />
  );
};

export default PresentationActivityRenderer;
