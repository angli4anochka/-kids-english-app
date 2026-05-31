/**
 * Хук для управления состоянием урока и активностей
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from '@/utils/routing-adapter';
import type { Activity, LessonState } from '../types/lesson.types';
import { useAuth } from '../../../contexts/AuthContext';
import { lessonService } from '../../../services/lessonService';

export const useLessonBuilderState = () => {
  const { islandId, lessonNumber } = useParams<{ islandId: string; lessonNumber: string }>();
  const [searchParams] = useSearchParams();
  const lessonIdFromUrl = searchParams.get('lessonId');
  const { user } = useAuth();

  // Main lesson state
  const [state, setState] = useState<LessonState>({
    id: null,
    groupId: null,
    islandId: islandId || '',
    lessonNumber: lessonNumber || '1',
    title: `Unit ${lessonNumber}: Hello!`,
    activities: [],
    selectedActivity: null,

    // UI state
    isViewMode: false,
    isSaving: false,
    showAddModal: false,
    showSession: false,
    isInteractiveEnabled: false,

    // Session
    sessionGroupId: null,
    liveSessionId: null,
    activeSession: null,

    // Drag and drop
    draggedActivity: null,
    dragOverIndex: null,

    // Animation
    isTransitioning: false,
    transitionDirection: 'right',
    showActivityOverlay: true,

    // Editing
    editingTitleId: null,
    editingTitleValue: '',
  });

  // Automatically enable view mode for students
  useEffect(() => {
    if (user?.role === 'student') {
      setState(prev => ({ ...prev, isViewMode: true }));
    }
  }, [user]);

  // Load current lesson and groupId
  useEffect(() => {
    // IMPORTANT: If lessonIdFromUrl exists, ONLY use that - don't search by islandId
    if (lessonIdFromUrl) {
      const loadByLessonId = async () => {
        console.log('Using lessonId from URL:', lessonIdFromUrl);
        setState(prev => ({ ...prev, id: lessonIdFromUrl }));

        try {
          const lesson = await lessonService.getLesson(lessonIdFromUrl);
          setState(prev => ({ ...prev, groupId: lesson.groupId || null }));
        } catch (error) {
          console.error('Error loading lesson by ID:', error);
        }
      };
      loadByLessonId();
      return;
    }

    // Only search by island if no lessonId in URL
    const loadCurrentLesson = async () => {
      if (!islandId || !user) return;

      try {
        const islandNumber = parseInt(islandId.replace('island-', ''));
        const groupIdFilter = user.role === 'student' ? user.groupId : undefined;
        const lessons = await lessonService.getLessons(groupIdFilter);
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lesson = lessons.find(l => l.islandId === islandNumber && (l.orderIndex === lessonNum || l.order_index === lessonNum));

        if (lesson) {
          setState(prev => ({
            ...prev,
            id: lesson.id,
            groupId: lesson.groupId || null,
          }));
          console.log('Loaded lesson:', lesson.id, 'for island', islandNumber, 'lesson#', lessonNum, 'groupId:', lesson.groupId);
        } else {
          console.warn('No lesson found for island', islandNumber, 'lesson#', lessonNum, 'groupId:', groupIdFilter);
        }
      } catch (error) {
        console.error('Error loading current lesson:', error);
      }
    };

    loadCurrentLesson();
  }, [islandId, user, lessonIdFromUrl, lessonNumber]);

  // Load lesson from database for students
  useEffect(() => {
    const loadLessonForStudent = async () => {
      if (user?.role !== 'student' || !islandId || !user.groupId) return;

      try {
        const islandNumber = parseInt(islandId.replace('island-', ''));
        const lessonNum = lessonNumber ? parseInt(lessonNumber) : 1;
        const lessons = await lessonService.getLessons(user.groupId);
        const lesson = lessons.find(l => l.islandId === islandNumber && (l.orderIndex === lessonNum || l.order_index === lessonNum));

        if (lesson && lesson.id) {
          console.log('Loading lesson for student:', lesson.id);

          setState(prev => ({ ...prev, title: lesson.title || `Unit ${lessonNumber}: Hello!` }));

          try {
            const lessonActivities = await lessonService.getActivities(lesson.id);
            console.log('Loaded activities from API:', lessonActivities.length);

            if (lessonActivities && lessonActivities.length > 0) {
              const transformedActivities = lessonActivities.map((apiActivity: any) => {
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
                  currentSlide: contentData?.currentSlide,
                  snakeWordConfig: contentData?.snakeWordConfig,
                  letterTraceConfig: contentData?.letterTraceConfig,
                  letterRaceConfig: contentData?.letterRaceConfig,
                  letterMazeConfig: contentData?.letterMazeConfig,
                };
              });

              setState(prev => ({
                ...prev,
                activities: transformedActivities,
                selectedActivity: transformedActivities[0],
              }));
              console.log('Activities loaded successfully for student');
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
  }, [user, islandId, lessonNumber]);

  // Load lesson data for teachers from API
  useEffect(() => {
    if (user?.role !== 'teacher' || !state.id) return;

    const loadLessonForTeacher = async () => {
      try {
        console.log('Loading lesson for teacher from API, lessonId:', state.id);

        const lesson = await lessonService.getLesson(state.id!);
        if (lesson?.title) {
          setState(prev => ({ ...prev, title: lesson.title }));
        }

        const activitiesData = await lessonService.getActivities(state.id!);
        console.log('Loaded activities for teacher:', activitiesData);

        if (activitiesData.length > 0) {
          const transformedActivities: Activity[] = activitiesData.map((apiActivity: any) => {
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
          });

          setState(prev => ({
            ...prev,
            activities: transformedActivities,
            selectedActivity: transformedActivities.length > 0 ? transformedActivities[0] : null,
          }));
        }
      } catch (error) {
        console.error('Error loading lesson for teacher:', error);
      }
    };

    loadLessonForTeacher();
  }, [user, state.id]);

  // Sync activity with teacher for students (polling every 1 second)
  useEffect(() => {
    if (user?.role !== 'student' || !state.id || state.activities.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/kids-api/lessons/${state.id}/state`);
        const data = await response.json();

        if (data.success) {
          const serverIndex = data.data.currentActivityIndex;
          const serverInteractive = data.data.isInteractiveEnabled;
          const currentIndex = state.activities.findIndex(a => a.id === state.selectedActivity?.id);

          // Update interactive permission
          if (serverInteractive !== state.isInteractiveEnabled) {
            console.log('Student syncing interactive permission:', serverInteractive);
            setState(prev => ({ ...prev, isInteractiveEnabled: serverInteractive }));
          }

          // INSTANT SYNC: Students immediately follow teacher's activity index
          if (serverIndex !== currentIndex && state.activities[serverIndex]) {
            console.log('Student syncing to activity index:', serverIndex);
            setState(prev => ({ ...prev, selectedActivity: state.activities[serverIndex] }));
          }
        }
      } catch (error) {
        console.error('Error syncing lesson state:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, state.id, state.activities, state.selectedActivity, state.isInteractiveEnabled]);

  // Methods to update state
  const updateState = <K extends keyof LessonState>(key: K, value: LessonState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const setActivities = (activities: Activity[]) => {
    setState(prev => ({ ...prev, activities }));
  };

  const setSelectedActivity = (activity: Activity | null) => {
    setState(prev => ({ ...prev, selectedActivity: activity }));
  };

  const setIsViewMode = (isViewMode: boolean) => {
    setState(prev => ({ ...prev, isViewMode }));
  };

  const setIsSaving = (isSaving: boolean) => {
    setState(prev => ({ ...prev, isSaving }));
  };

  const setShowAddModal = (showAddModal: boolean) => {
    setState(prev => ({ ...prev, showAddModal }));
  };

  const setIsInteractiveEnabled = (isInteractiveEnabled: boolean) => {
    setState(prev => ({ ...prev, isInteractiveEnabled }));
  };

  const setDraggedActivity = (activity: Activity | null) => {
    setState(prev => ({ ...prev, draggedActivity: activity }));
  };

  const setDragOverIndex = (index: number | null) => {
    setState(prev => ({ ...prev, dragOverIndex: index }));
  };

  const setIsTransitioning = (isTransitioning: boolean) => {
    setState(prev => ({ ...prev, isTransitioning }));
  };

  const setTransitionDirection = (direction: 'left' | 'right') => {
    setState(prev => ({ ...prev, transitionDirection: direction }));
  };

  const setEditingTitleId = (id: string | null) => {
    setState(prev => ({ ...prev, editingTitleId: id }));
  };

  const setEditingTitleValue = (value: string) => {
    setState(prev => ({ ...prev, editingTitleValue: value }));
  };

  const setTitle = (title: string) => {
    setState(prev => ({ ...prev, title }));
  };

  return {
    // State
    ...state,

    // Setters
    updateState,
    setActivities,
    setSelectedActivity,
    setIsViewMode,
    setIsSaving,
    setShowAddModal,
    setIsInteractiveEnabled,
    setDraggedActivity,
    setDragOverIndex,
    setIsTransitioning,
    setTransitionDirection,
    setEditingTitleId,
    setEditingTitleValue,
    setTitle,
  };
};
