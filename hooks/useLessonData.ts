import { useState, useEffect, useRef, useCallback } from 'react';
import { lessonService } from '../services/lessonService';
import type { Activity } from '../types';

interface UseLessonDataParams {
  islandId?: string;
  lessonNumber?: string;
  lessonIdFromUrl?: string | null;
  userRole?: 'teacher' | 'student';
  userGroupId?: number;
}

interface UseLessonDataReturn {
  currentLessonId: string | null;
  currentGroupId: number | null;
  unitTitle: string;
  activities: Activity[];
  isLoading: boolean;
  setUnitTitle: (title: string) => void;
  setActivities: (activities: Activity[]) => void;
  setCurrentLessonId: (id: string | null) => void;
  setCurrentGroupId: (id: number | null) => void;
  enrichActivity: (lessonId: string, activityId: string) => Promise<void>;
}

/**
 * Hook for managing lesson data loading from API
 * Handles loading lessons for both teachers and students
 */
export const useLessonData = ({
  islandId,
  lessonNumber,
  lessonIdFromUrl,
  userRole,
  userGroupId,
}: UseLessonDataParams): UseLessonDataReturn => {
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const [unitTitle, setUnitTitle] = useState(lessonNumber ? `Unit ${lessonNumber}: Hello!` : 'Новый урок');
  const [activities, setActivities] = useState<Activity[]>([]);
  // true while any fetch is in flight — keeps the UI from flashing empty state
  const [isLoading, setIsLoading] = useState(!!lessonIdFromUrl || !!(islandId && lessonNumber));
  // Track which activity IDs already have full content_data loaded
  const enrichedIds = useRef<Set<string>>(new Set());

  // Safety net: never spin forever — bail after 10 s
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setIsLoading(false), 30_000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Load current lesson and groupId
  useEffect(() => {
    // IMPORTANT: If lessonIdFromUrl exists, ONLY use that - don't search by islandId
    // This prevents the bug where we first load the correct lesson, then overwrite it
    // with the first lesson of the island
    if (lessonIdFromUrl) {
      const loadByLessonId = async () => {
        console.log('Using lessonId from URL:', lessonIdFromUrl);
        setCurrentLessonId(lessonIdFromUrl);
        try {
          const lesson = await lessonService.getLesson(lessonIdFromUrl);
          setCurrentGroupId(lesson.groupId || null);
        } catch (error) {
          console.error('Error loading lesson by ID:', error);
        }
        // isLoading stays true until teacher effect loads activities
      };
      loadByLessonId();
      return;
    }

    // Only search by island if no lessonId in URL
    const loadCurrentLesson = async () => {
      if (!islandId || !lessonNumber) return;

      try {
        const islandNumber = parseInt(islandId.replace('island-', ''));

        // For teacher - load from their groups
        // For student - load from their group
        const groupIdFilter = userRole === 'student' ? userGroupId : undefined;
        const lessons = await lessonService.getLessons(groupIdFilter);
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lesson = lessons.find(l => l.islandId === islandNumber && (l as any).island_order === lessonNum);

        if (lesson) {
          setCurrentLessonId(lesson.id);
          setCurrentGroupId(lesson.groupId || null);
          console.log('Loaded lesson:', lesson.id, 'for island', islandNumber, 'lesson#', lessonNum, 'groupId:', lesson.groupId);
        } else {
          console.warn('No lesson found for island', islandNumber, 'lesson#', lessonNum, 'groupId:', groupIdFilter);
        }
      } catch (error) {
        console.error('Error loading current lesson:', error);
      }
    };

    loadCurrentLesson();
  }, [islandId, lessonIdFromUrl, userRole, userGroupId, lessonNumber]);

  // Load lesson data for students
  useEffect(() => {
    const loadLessonForStudent = async () => {
      if (userRole !== 'student' || !islandId || !userGroupId) return;

      try {
        const islandNumber = parseInt(islandId.replace('island-', ''));
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lessons = await lessonService.getLessons(userGroupId);
        const lesson = lessons.find(l => l.islandId === islandNumber && (l as any).island_order === lessonNum);

        if (lesson && lesson.id) {
          console.log('Loading lesson for student:', lesson.id);
          setUnitTitle(lesson.title || `Unit ${lessonNumber}: Hello!`);

          try {
            // Slim load — no content_data; activities are enriched on-demand when shown
            const lessonActivities = await lessonService.getActivities(lesson.id, true /* slim */);
            console.log('Loaded slim activities from API:', lessonActivities.length);

            if (lessonActivities && lessonActivities.length > 0) {
              setActivities(lessonActivities.map(transformApiActivity));
              console.log('Activities loaded successfully for student');
            } else {
              console.log('No activities found in database');
            }
          } catch (actError) {
            console.error('Error loading activities from API:', actError);
          }
        }
      } catch (error) {
        console.error('Error loading lesson for student:', error);
      }
    };

    loadLessonForStudent();
  }, [userRole, islandId, lessonNumber, userGroupId]);

  // Shared helper: transform a raw DB activity row to our Activity type
  const transformApiActivity = (apiActivity: any): Activity => {
    const contentData = apiActivity.content_data || apiActivity.contentData;
    const contentUrl = apiActivity.content_url || apiActivity.contentUrl;
    return {
      id: apiActivity.id,
      type: apiActivity.type,
      title: apiActivity.title,
      subtitle: apiActivity.subtitle || '',
      isCompleted: contentData?.isCompleted || false,
      points: apiActivity.points || 10,
      tags: contentData?.tags || [],
      content: contentData?.content,
      imageUrl: contentData?.imageUrl || (apiActivity.type === 'image' ? contentUrl : undefined),
      videoUrl: contentData?.videoUrl || (apiActivity.type === 'video' || apiActivity.type === 'youtube' ? contentUrl : undefined),
      wordwallUrl: contentData?.wordwallUrl || (apiActivity.type === 'wordwall' || apiActivity.type === 'game' ? contentUrl : undefined),
      geniallyUrl: contentData?.geniallyUrl || (apiActivity.type === 'genially' ? contentUrl : undefined),
      audioUrl: apiActivity.audio_url || contentData?.audioUrl,
      dragTextData: contentData?.dragTextData,
      presentationType: contentData?.presentationType,
      presentationUrl: contentData?.presentationUrl,
      slides: contentData?.slides,
      currentSlide: contentData?.currentSlide || 0,
      externalUrl: contentData?.externalUrl,
      snakeWordConfig: contentData?.snakeWordConfig,
      letterTraceConfig: contentData?.letterTraceConfig,
      letterRaceConfig: contentData?.letterRaceConfig,
      letterMazeConfig: contentData?.letterMazeConfig,
    };
  };

  // Fetch full content_data for one activity and merge it into the activities array.
  // No-op if the activity has already been enriched.
  const enrichActivity = useCallback(async (lessonId: string, activityId: string) => {
    if (enrichedIds.current.has(activityId)) return;
    enrichedIds.current.add(activityId); // optimistic — prevents duplicate fetches
    try {
      const full = await lessonService.getActivity(lessonId, activityId);
      const enriched = transformApiActivity(full);
      setActivities(prev => prev.map(a => a.id === activityId ? enriched : a));
    } catch (err) {
      enrichedIds.current.delete(activityId); // allow retry on error
      console.error('Error enriching activity:', activityId, err);
    }
  }, []);

  // Load lesson data for teachers from API
  useEffect(() => {
    // Still waiting for currentLessonId to be set — do nothing yet
    if (!currentLessonId) return;

    // User is loaded but isn't a teacher — stop the spinner (student path handles its own loading)
    if (userRole !== undefined && userRole !== 'teacher') {
      setIsLoading(false);
      return;
    }

    // userRole still unknown (auth not resolved yet) — wait for next render
    if (!userRole) return;

    const loadLessonForTeacher = async () => {
      try {
        console.log('Loading lesson for teacher from API, lessonId:', currentLessonId);

        // Fetch lesson metadata and slim activity list in parallel — no content_data yet
        const [lesson, activitiesData] = await Promise.all([
          lessonService.getLesson(currentLessonId),
          lessonService.getActivities(currentLessonId, true /* slim */),
        ]);

        if (lesson?.title) {
          setUnitTitle(lesson.title);
        }

        console.log('Loaded slim activities for teacher:', activitiesData.length);

        if (activitiesData.length > 0) {
          const transformedActivities: Activity[] = activitiesData.map(transformApiActivity);
          setActivities(transformedActivities);

          // Debug log for activities with audio
          transformedActivities.forEach(a => {
            if (a.audioUrl) {
              console.log('Activity with audio:', { title: a.title, type: a.type, audioUrl: a.audioUrl });
            }
          });
        }
      } catch (error) {
        console.error('Error loading lesson for teacher:', error);
      } finally {
        // Show the lesson immediately — content_data loads on-demand per activity
        setIsLoading(false);
      }
    };

    loadLessonForTeacher();
  }, [userRole, currentLessonId]);

  return {
    currentLessonId,
    currentGroupId,
    unitTitle,
    activities,
    isLoading,
    setUnitTitle,
    setActivities,
    setCurrentLessonId,
    setCurrentGroupId,
    enrichActivity,
  };
};
