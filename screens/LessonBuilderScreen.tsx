import { useParams } from '@/utils/routing-adapter';
import LessonBuilder from '../components/LessonBuilder/LessonBuilder';

interface LessonBuilderScreenProps {
  lessonId?: string;
}

export default function LessonBuilderScreen({ lessonId: propLessonId }: LessonBuilderScreenProps = {}) {
  // Try to get lessonId from route params if not provided as prop
  const params = useParams<{ lessonId?: string }>();
  const lessonId = propLessonId || params.lessonId;

  return <LessonBuilder lessonId={lessonId} />;
}
