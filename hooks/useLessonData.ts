import { useState, useEffect } from 'react';
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
  setUnitTitle: (title: string) => void;
  setActivities: (activities: Activity[]) => void;
  setCurrentLessonId: (id: string | null) => void;
  setCurrentGroupId: (id: number | null) => void;
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

  // Load current lesson and groupId
  useEffect(() => {
    // IMPORTANT: If lessonIdFromUrl exists, ONLY use that - don't search by islandId
    // This prevents the bug where we first load the correct lesson, then overwrite it
    // with the first lesson of the island
    if (lessonIdFromUrl) {
      const loadByLessonId = async () => {
        console.log('Using lessonId from URL:', lessonIdFromUrl);
        setCurrentLessonId(lessonIdFromUrl);
        // Load lesson to get groupId
        try {
          const lesson = await lessonService.getLesson(lessonIdFromUrl);
          setCurrentGroupId(lesson.groupId || null);
        } catch (error) {
          console.error('Error loading lesson by ID:', error);
        }
      };
      loadByLessonId();
      return; // Don't continue to island-based search
    }

    // Only search by island if no lessonId in URL
    const loadCurrentLesson = async () => {
      if (!islandId) return;

      try {
        const islandNumber = parseInt(islandId.replace('island-', ''));

        // For teacher - load from their groups
        // For student - load from their group
        const groupIdFilter = userRole === 'student' ? userGroupId : undefined;
        const lessons = await lessonService.getLessons(groupIdFilter);
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lesson = lessons.find(l => l.islandId === islandNumber && (l.orderIndex === lessonNum || l.order_index === lessonNum));

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
        const lesson = lessons.find(l => l.islandId === islandNumber && (l.orderIndex === lessonNum || l.order_index === lessonNum));

        if (lesson && lesson.id) {
          console.log('Loading lesson for student:', lesson.id);

          // Set lesson title
          setUnitTitle(lesson.title || `Unit ${lessonNumber}: Hello!`);

          // Load activities from backend API
          try {
            const lessonActivities = await lessonService.getActivities(lesson.id);
            console.log('Loaded activities from API:', lessonActivities.length);

            if (lessonActivities && lessonActivities.length > 0) {
              // Transform API activities to our Activity interface
              const transformedActivities = lessonActivities.map((apiActivity: any) => {
                const contentData = apiActivity.content_data || apiActivity.contentData;
                const contentUrl = apiActivity.content_url || apiActivity.contentUrl;

                // Debug video activities
                if (apiActivity.type === 'video') {
                  console.log('[VIDEO DEBUG]', {
                    title: apiActivity.title,
                    type: apiActivity.type,
                    contentUrl,
                    content_url: apiActivity.content_url,
                    audio_url: apiActivity.audio_url
                  });
                }

                return {
                  id: apiActivity.id,
                  type: apiActivity.type,
                  title: apiActivity.title,
                  subtitle: apiActivity.subtitle || '',
                  isCompleted: contentData?.isCompleted || false,
                  points: apiActivity.points || 10,
                  tags: contentData?.tags || [],
                  content: contentData?.content,
                  // Extract from contentData first, fallback to contentUrl based on type
                  imageUrl: contentData?.imageUrl || (apiActivity.type === 'image' ? contentUrl : undefined),
                  videoUrl: contentData?.videoUrl || (apiActivity.type === 'video' || apiActivity.type === 'youtube' ? contentUrl : undefined),
                  wordwallUrl: contentData?.wordwallUrl || (apiActivity.type === 'wordwall' || apiActivity.type === 'game' ? contentUrl : undefined),
                  geniallyUrl: contentData?.geniallyUrl || (apiActivity.type === 'genially' ? contentUrl : undefined),
                  audioUrl: apiActivity.audio_url || contentData?.audioUrl,
                  dragTextData: contentData?.dragTextData,
                  presentationType: contentData?.presentationType,
                  presentationUrl: contentData?.presentationUrl,
                  slides: contentData?.slides,
                  currentSlide: contentData?.currentSlide,
                  snakeWordConfig: contentData?.snakeWordConfig,
                  letterTraceConfig: contentData?.letterTraceConfig,
                  letterRaceConfig: contentData?.letterRaceConfig,
                  letterMazeConfig: contentData?.letterMazeConfig,
                };
              });

              setActivities(transformedActivities);
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

  // Load lesson data for teachers from API
  useEffect(() => {
    if (userRole !== 'teacher' || !currentLessonId) return;

    const loadLessonForTeacher = async () => {
      try {
        console.log('Loading lesson for teacher from API, lessonId:', currentLessonId);

        // Fetch lesson details
        const lesson = await lessonService.getLesson(currentLessonId);
        if (lesson?.title) {
          setUnitTitle(lesson.title);
        }

        // Fetch activities
        const activitiesData = await lessonService.getActivities(currentLessonId);
        console.log('Loaded activities for teacher:', activitiesData);

        // Only load from API if localStorage is empty
        if (activitiesData.length > 0) {
          // Transform API data to frontend format
          const transformedActivities: Activity[] = activitiesData.map((apiActivity: any) => {
            const contentData = apiActivity.content_data || apiActivity.contentData;
            const contentUrl = apiActivity.content_url || apiActivity.contentUrl;

            const transformed = {
              id: apiActivity.id,
              type: apiActivity.type,
              title: apiActivity.title,
              subtitle: apiActivity.subtitle || '',
              isCompleted: contentData?.isCompleted || false,
              points: apiActivity.points || 10,
              tags: contentData?.tags || [],
              content: contentData?.content,
              // Extract from contentData first, fallback to contentUrl based on type
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

            // Debug log for activities with audio
            if (transformed.audioUrl || apiActivity.audio_url) {
              console.log('Activity with audio:', {
                title: transformed.title,
                type: transformed.type,
                audioUrl: transformed.audioUrl,
                audio_url_from_api: apiActivity.audio_url
              });
            }

            return transformed;
          });

          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error('Error loading lesson for teacher:', error);
      }
    };

    loadLessonForTeacher();
  }, [userRole, currentLessonId]);

  return {
    currentLessonId,
    currentGroupId,
    unitTitle,
    activities,
    setUnitTitle,
    setActivities,
    setCurrentLessonId,
    setCurrentGroupId,
  };
};
