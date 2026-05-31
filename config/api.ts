// API Configuration
export const API_CONFIG = {
  // Backend URL - Kids English Backend API (proxied through nginx)
  baseURL: '/kids-api',

  // WebSocket URL - lazy getter so SSR does not touch `window`
  get socketURL() {
    return typeof window !== 'undefined' ? window.location.origin : '';
  },

  // Endpoints
  endpoints: {
    health: '/health',
    createSession: '/session/create',
    getSession: '/session',
    studentProgress: '/progress/student',
    // Auth endpoints
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    // Lesson endpoints
    lessons: '/lessons',
    createLesson: '/lessons',
    getLessons: '/lessons',
  },

  // WebSocket events
  socketEvents: {
    // Client to Server
    joinSession: 'join-session',
    changeActivity: 'change-activity',
    updateProgress: 'update-progress',

    // Server to Client
    activityChanged: 'activity-changed',
    participantJoined: 'participant-joined',
    participantLeft: 'participant-left',
    studentProgress: 'student-progress',
    teacherLeft: 'teacher-left',
  },
} as const;
