import { useState, useRef, useEffect } from 'react';
import TVFrame from '../Shared/TVFrame';
import { useSocket } from '../../hooks/useSocket';

interface PresentationActivityProps {
  activity: {
    presentationType?: 'google-slides' | 'screen-share' | 'youtube-broadcast' | 'upload';
    presentationUrl?: string;
    currentSlide?: number;
  };
  isViewMode: boolean;
  onUpdate: (data: any) => void;
  lessonId?: string;
  groupId?: number;
  isTeacher?: boolean;
}

const PresentationActivity = ({
  activity,
  isViewMode,
  onUpdate,
  lessonId,
  groupId,
  isTeacher = false
}: PresentationActivityProps) => {
  const [presentationType, setPresentationType] = useState(activity.presentationType || 'google-slides');
  const [presentationUrl, setPresentationUrl] = useState(activity.presentationUrl || '');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [inputUrl, setInputUrl] = useState(activity.presentationUrl || '');
  const [previewUrl, setPreviewUrl] = useState(activity.presentationUrl || '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement>(null);
  const teacherSocketIdRef = useRef<string | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { socket, isConnected } = useSocket();

  // STUN + our own coturn (when UDP open in Yandex SG) for NAT traversal.
  // No iceTransportPolicy='relay' — let browser pick best path (host on same network,
  // srflx via STUN across NATs, relay via TURN as a fallback).
  const TURN_HOST = '158.160.208.163';
  const TURN_USER = 'kidsapp';
  const TURN_PASS = 'ae73b5fd45bea7973e81f88a48e3cf5c';
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: `stun:${TURN_HOST}:3478` },
      { urls: `turn:${TURN_HOST}:3478?transport=udp`, username: TURN_USER, credential: TURN_PASS },
      { urls: `turn:${TURN_HOST}:3478?transport=tcp`, username: TURN_USER, credential: TURN_PASS },
    ],
  };

  const candidateType = (cand: RTCIceCandidate | RTCIceCandidateInit): string => {
    const s = (cand as any).candidate || '';
    const m = s.match(/ typ (\S+)/);
    return m ? m[1] : 'unknown';
  };

  // Debug log overlay state (student-side WebRTC diagnostics).
  // Hidden by default — append ?debug=1 to the URL to show it when diagnosing.
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const pushDebug = (msg: string) => {
    setDebugLogs((prev) => {
      const stamp = new Date().toLocaleTimeString();
      const next = [...prev, `${stamp} ${msg}`];
      return next.length > 40 ? next.slice(-40) : next;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, []);

  const [isMuted, setIsMuted] = useState(!isTeacher);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  // Attach stream to <video> after it mounts (it only renders when isScreenSharing === true)
  useEffect(() => {
    if (isScreenSharing && videoRef.current && streamRef.current) {
      const vid = videoRef.current;
      vid.srcObject = streamRef.current;
      // Students are always muted — sound comes from teacher's audio (Zoom/mic)
      vid.muted = true;
      pushDebug('▶ attaching stream, paused=' + vid.paused + ' muted=' + vid.muted);

      const tryPlay = (attempt: number) => {
        vid.play?.()
          .then(() => { pushDebug('▶ play() resolved (attempt ' + attempt + ')'); setNeedsTapToPlay(false); })
          .catch((err) => {
            console.warn('[WebRTC] video.play() failed (attempt ' + attempt + '):', err);
            pushDebug('❌ play() failed: ' + (err?.name || err?.message));
            if (attempt < 3) {
              setTimeout(() => tryPlay(attempt + 1), 300 * attempt);
            } else {
              setNeedsTapToPlay(true);
            }
          });
      };

      tryPlay(1);
    }
  }, [isScreenSharing, isTeacher]);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      setIsMuted(false);
      videoRef.current.play?.().catch((err) => console.warn('[WebRTC] unmute play() failed:', err));
    }
  };

  // ========== TEACHER: WebRTC Broadcasting ==========
  const startScreenShare = async () => {
    // Check HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert(`⚠️ Демонстрация экрана требует безопасного соединения (HTTPS)!\n\n` +
            `Вы сейчас на: ${window.location.protocol}//${window.location.host}\n\n` +
            `✅ Решения:\n` +
            `1. Откройте сайт по адресу https://uniplay-kids.ru/\n` +
            `2. Или используйте Google Slides вместо демонстрации экрана`);
      return;
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Демонстрация экрана не поддерживается в вашем браузере. Попробуйте использовать Chrome, Edge или Firefox.');
      return;
    }

    if (!socket || !isConnected) {
      alert('WebSocket не подключен. Подождите немного и попробуйте снова.');
      return;
    }

    try {
      // For YouTube broadcast the video already plays inside this tab, so capture
      // the current tab directly — Chrome offers "Share this tab" in one click
      // instead of the full screen/window picker. Other modes keep the full picker.
      const displayMediaOpts: any =
        presentationType === 'youtube-broadcast'
          ? { video: true, audio: true, preferCurrentTab: true }
          : { video: true, audio: true };
      // Capture screen with audio
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOpts);

      streamRef.current = stream;

      // For YouTube broadcast: crop the OUTGOING stream to just the player element
      // (Region Capture). Students then see only the video, not the whole lesson UI.
      // Teacher's own screen is unaffected. Falls back to full tab if unsupported.
      if (presentationType === 'youtube-broadcast' && ytIframeRef.current) {
        try {
          const [videoTrack] = stream.getVideoTracks();
          const CropTargetCtor = (window as any).CropTarget;
          if (CropTargetCtor?.fromElement && (videoTrack as any).cropTo) {
            const cropTarget = await CropTargetCtor.fromElement(ytIframeRef.current);
            await (videoTrack as any).cropTo(cropTarget);
            console.log('[WebRTC] Region Capture: cropped broadcast to YouTube player');
          } else {
            console.warn('[WebRTC] Region Capture not supported — students will see the full tab');
          }
        } catch (e) {
          console.warn('[WebRTC] Region Capture failed, sending full tab:', e);
        }
      }

      setIsScreenSharing(true);

      console.log('[WebRTC] Screen sharing started, setting up broadcast...');

      // Track when sharing stops
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err: any) {
      console.error('Error sharing screen:', err);
      if (err?.name === 'NotAllowedError') {
        alert('Вы отменили демонстрацию экрана или браузер заблокировал доступ');
      } else {
        alert('Не удалось поделиться экраном. Убедитесь, что вы используете современный браузер и безопасное соединение (HTTPS)');
      }
    }
  };

  const stopScreenShare = () => {
    // Stop local stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Notify students
    if (socket && isConnected && lessonId && groupId) {
      socket.emit('screen-share-stop', { lessonId, groupId });
    }

    setIsScreenSharing(false);
  };

  // ========== TEACHER: Handle student answers ==========
  useEffect(() => {
    if (!socket || !isTeacher || !isScreenSharing || !streamRef.current) return;

    const handleAnswer = async ({ studentId, answer }: { studentId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer from student:', studentId);

      try {
        // Create a new peer connection for this student
        const pc = new RTCPeerConnection(iceServers);

        // Add all tracks from screen share
        streamRef.current!.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current!);
        });

        // Handle ICE candidates for this specific student
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] Sending ICE candidate to student:', studentId);
            socket.emit('screen-share-ice-candidate', {
              peerId: studentId,
              candidate: event.candidate
            });
          }
        };

        // Set remote description (student's answer)
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[WebRTC] Set remote description for student:', studentId);

        // Store the peer connection
        peerConnectionsRef.current.set(studentId, pc);
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
      }
    };

    const handleIceCandidate = async ({ peerId, candidate }: { peerId: string; candidate: RTCIceCandidateInit }) => {
      console.log('[WebRTC] Received ICE candidate from:', peerId);

      try {
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    socket.on('screen-share-answer', handleAnswer);
    socket.on('screen-share-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('screen-share-answer', handleAnswer);
      socket.off('screen-share-ice-candidate', handleIceCandidate);
    };
  }, [socket, isTeacher, isScreenSharing]);

  // ========== TEACHER: Wait for offers from students ==========
  useEffect(() => {
    if (!socket || !isTeacher || !isScreenSharing || !streamRef.current) return;

    const handleStudentOffer = async ({ studentId, offer }: { studentId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Teacher received offer from student:', studentId);

      try {
        // Create peer connection for this student
        const pc = new RTCPeerConnection(iceServers);

        // Add all tracks from screen share
        streamRef.current!.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current!);
          console.log('[WebRTC] Added track to peer connection for student:', studentId);
        });

        // Handle ICE candidates for this student
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] Sending ICE candidate to student:', studentId);
            socket.emit('screen-share-ice-candidate', {
              peerId: studentId,
              candidate: event.candidate
            });
          }
        };

        // Set remote description (student's offer)
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('[WebRTC] Sending answer to student:', studentId);
        socket.emit('screen-share-answer', {
          studentId,
          answer: pc.localDescription
        });

        // Store peer connection
        peerConnectionsRef.current.set(studentId, pc);
      } catch (err) {
        console.error('[WebRTC] Error handling student offer:', err);
      }
    };

    // Reply to late-joining students asking for current status
    const handleStudentRequest = ({ studentId }: { studentId: string }) => {
      if (lessonId && groupId && studentId) {
        console.log('[WebRTC] Replying screen-share-ready to late student:', studentId);
        socket.emit('screen-share-ready-to', { studentId, lessonId, groupId });
      }
    };

    socket.on('screen-share-offer', handleStudentOffer);
    socket.on('screen-share-request', handleStudentRequest);

    // Notify students that teacher is ready to receive offers
    if (lessonId && groupId) {
      console.log('[WebRTC] Teacher ready to receive offers from students');
      socket.emit('screen-share-ready', { lessonId, groupId });
    }

    return () => {
      socket.off('screen-share-offer', handleStudentOffer);
      socket.off('screen-share-request', handleStudentRequest);
    };
  }, [socket, isTeacher, isScreenSharing, lessonId, groupId]);

  // ========== STUDENT: Create offer when teacher is ready ==========
  useEffect(() => {
    if (!socket || isTeacher || !isViewMode || (presentationType !== 'screen-share' && presentationType !== 'youtube-broadcast')) return;

    const handleTeacherReady = async ({ lessonId: readyLessonId, groupId: readyGroupId, teacherId }: { lessonId: string; groupId: number; teacherId?: string }) => {
      console.log('[WebRTC] Student received teacher ready signal');
      if (teacherId) teacherSocketIdRef.current = teacherId;
      pushDebug('✅ received teacher ready, teacherId=' + (teacherId || 'none'));

      try {
        // Create peer connection
        const pc = new RTCPeerConnection(iceServers);

        // Explicitly request audio + video reception (iOS Safari ignores legacy offerToReceive* options)
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
        pushDebug('🛰 transceivers added (recvonly)');

        pc.onicegatheringstatechange = () => {
          pushDebug('iceGather: ' + pc.iceGatheringState);
        };
        pc.onsignalingstatechange = () => {
          pushDebug('sigState: ' + pc.signalingState);
        };

        // Handle incoming tracks from teacher
        pc.ontrack = (event) => {
          console.log('[WebRTC] Student received track:', event.track.kind);
          pushDebug('🎬 ontrack: ' + event.track.kind);
          streamRef.current = event.streams[0];
          setIsScreenSharing(true);
        };

        pc.oniceconnectionstatechange = () => {
          pushDebug('iceState: ' + pc.iceConnectionState);
        };

        pc.onconnectionstatechange = () => {
          pushDebug('connState: ' + pc.connectionState);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const ct = candidateType(event.candidate);
            console.log('[WebRTC] Student sending ICE candidate', ct);
            pushDebug('📤 ICE cand: ' + ct);
            socket.emit('screen-share-ice-candidate', {
              peerId: teacherSocketIdRef.current || socket.id,  // Send to the teacher
              candidate: event.candidate
            });
          } else {
            pushDebug('📤 ICE gathering complete');
          }
        };

        // Create offer (transceivers above already declare what we want to receive)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        pushDebug('📋 localDesc set, sdp m-lines=' + ((offer.sdp || '').match(/^m=/gm)?.length ?? 0));

        console.log('[WebRTC] Student sending offer to teacher');
        pushDebug('📤 sent offer');
        socket.emit('screen-share-offer', {
          studentId: socket.id,
          offer: pc.localDescription
        });

        peerConnectionsRef.current.set('teacher', pc);
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
        pushDebug('❌ offer error: ' + (err as Error).message);
      }
    };

    const handleAnswer = async ({ studentId, answer }: { studentId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Student received answer from teacher');
      pushDebug('📥 received answer');

      try {
        const pc = peerConnectionsRef.current.get('teacher');
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('[WebRTC] Student set remote description');
          pushDebug('✅ remote desc set');
        }
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
        pushDebug('❌ remote desc error: ' + (err as Error).message);
      }
    };

    const handleStop = () => {
      console.log('[WebRTC] Teacher stopped screen sharing');

      // Close all connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      setIsScreenSharing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const handleIceCandidate = async ({ peerId, candidate }: { peerId: string; candidate: RTCIceCandidateInit }) => {
      console.log('[WebRTC] Student received ICE candidate from:', peerId);
      pushDebug('📥 ICE from teacher: ' + candidateType(candidate as any));

      try {
        const pc = peerConnectionsRef.current.get('teacher');
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
        pushDebug('❌ addIce error: ' + (err as Error).message);
      }
    };

    socket.on('screen-share-ready', handleTeacherReady);
    socket.on('screen-share-answer', handleAnswer);
    socket.on('screen-share-stop', handleStop);
    socket.on('screen-share-ice-candidate', handleIceCandidate);

    pushDebug('listener mounted, groupId=' + groupId);
    // Ask teacher whether screen share is already running (for late-joining students)
    if (groupId) {
      console.log('[WebRTC] Student requesting current screen-share status, groupId:', groupId);
      pushDebug('📨 sent screen-share-request');
      socket.emit('screen-share-request', { groupId });
    }

    return () => {
      socket.off('screen-share-ready', handleTeacherReady);
      socket.off('screen-share-answer', handleAnswer);
      socket.off('screen-share-stop', handleStop);
      socket.off('screen-share-ice-candidate', handleIceCandidate);
    };
  }, [socket, isTeacher, isViewMode, presentationType]);

  const extractGoogleSlidesId = (url: string): string => {
    const patterns = [
      /presentation\/d\/([a-zA-Z0-9-_]+)/,
      /presentation\/d\/e\/([a-zA-Z0-9-_]+)/,
      /presentation\/d\/e\/(2PACX-[a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (url.includes('/pub?') || url.includes('/embed')) {
      return 'USE_FULL_URL';
    }

    return '';
  };

  const handleUrlChange = (url: string) => {
    setPresentationUrl(url);
    onUpdate({
      ...activity,
      presentationType,
      presentationUrl: url
    });
  };

  const extractYoutubeId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return '';
  };

  const handleTypeChange = (type: 'google-slides' | 'screen-share' | 'youtube-broadcast' | 'upload') => {
    setPresentationType(type);
    onUpdate({
      ...activity,
      presentationType: type,
      presentationUrl
    });
  };

  if (!isViewMode) {
    // Edit mode — original layout with type cards
    return (
      <div className="w-full">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Выберите способ показа презентации:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleTypeChange('google-slides')}
              className={`p-4 rounded-lg border-2 transition-all ${presentationType === 'google-slides' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'}`}
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Google Slides</div>
              <div className="text-xs text-gray-600 mt-1">Вставить из Google</div>
            </button>
            <button
              onClick={() => handleTypeChange('screen-share')}
              className={`p-4 rounded-lg border-2 transition-all ${presentationType === 'screen-share' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'}`}
            >
              <div className="text-2xl mb-2">🖥️</div>
              <div className="font-semibold">Демонстрация экрана</div>
              <div className="text-xs text-gray-600 mt-1">Показать с компьютера</div>
            </button>
            <button
              onClick={() => handleTypeChange('youtube-broadcast')}
              className={`p-4 rounded-lg border-2 transition-all ${presentationType === 'youtube-broadcast' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'}`}
            >
              <div className="text-2xl mb-2">📺</div>
              <div className="font-semibold">YouTube + трансляция</div>
              <div className="text-xs text-gray-600 mt-1">Ссылка + screen-share</div>
            </button>
            <button
              onClick={() => handleTypeChange('upload')}
              className={`p-4 rounded-lg border-2 transition-all ${presentationType === 'upload' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'}`}
            >
              <div className="text-2xl mb-2">📤</div>
              <div className="font-semibold">Загрузить файл</div>
              <div className="text-xs text-gray-600 mt-1">PDF или изображения</div>
            </button>
          </div>
        </div>

        {presentationType === 'google-slides' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ссылка на Google Slides презентацию:
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/presentation/d/..."
              value={presentationUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-3"
            />
            <div className="text-sm text-gray-600">
              <p>💡 Совет: Откройте презентацию в Google Slides → Файл → Опубликовать в интернете → Встроить</p>
            </div>
            {presentationUrl && extractGoogleSlidesId(presentationUrl) && (
              <div className="mt-4 border-2 border-gray-200 rounded-lg overflow-hidden h-[600px]">
                <iframe
                  src={extractGoogleSlidesId(presentationUrl) === 'USE_FULL_URL' ? presentationUrl : `https://docs.google.com/presentation/d/e/${extractGoogleSlidesId(presentationUrl)}/embed?start=false&loop=false&delayms=3000`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {presentationType === 'screen-share' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🖥️</div>
            <h3 className="text-xl font-semibold mb-2">Демонстрация экрана с трансляцией</h3>
            <p className="text-gray-600 mb-4">
              В режиме просмотра вы сможете поделиться экраном<br />
              и ученики увидят его в реальном времени (как в Zoom)
            </p>
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Как это работает:</strong><br />
                1. Переключитесь в режим просмотра<br />
                2. Нажмите "Поделиться экраном"<br />
                3. Выберите окно с презентацией<br />
                4. Ученики увидят ваш экран с видео и аудио
              </p>
            </div>
          </div>
        )}

        {presentationType === 'youtube-broadcast' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ссылка на YouTube видео:
            </label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={presentationUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-3"
            />
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mt-2">
              <p className="text-sm text-blue-800">
                <strong>Как это работает на уроке:</strong><br />
                1. Учитель нажимает «Открыть YouTube и начать трансляцию»<br />
                2. Видео откроется в новой вкладке<br />
                3. Браузер спросит какое окно/вкладку расшарить — выберите YouTube-вкладку, обязательно с галочкой <em>«Поделиться звуком вкладки»</em><br />
                4. Ученики увидят видео и услышат звук через WebRTC (одна копия плеера, нет рассинхрона)
              </p>
            </div>
          </div>
        )}

        {presentationType === 'upload' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2">Загрузка презентации</h3>
            <p className="text-gray-600 mb-4">
              Конвертируйте вашу презентацию в PDF или изображения<br />
              для быстрой загрузки
            </p>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Рекомендация:</strong><br />
                Используйте Google Slides или демонстрацию экрана<br />
                для лучшей производительности
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View mode (for showing to students)
  return (
    <div className="w-full h-full">
      {presentationType === 'google-slides' && presentationUrl && extractGoogleSlidesId(presentationUrl) ? (
        <TVFrame>
          <iframe
            src={
              extractGoogleSlidesId(presentationUrl) === 'USE_FULL_URL'
                ? presentationUrl
                : `https://docs.google.com/presentation/d/e/${extractGoogleSlidesId(presentationUrl)}/embed?start=false&loop=false&delayms=3000`
            }
            className="w-full h-full"
            allowFullScreen
          />
        </TVFrame>
      ) : presentationType === 'youtube-broadcast' ? (
        <div className="w-full flex flex-col">
          {isTeacher ? (
            <>
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                {presentationUrl && extractYoutubeId(presentationUrl) ? (
                  <iframe
                    ref={ytIframeRef}
                    src={`https://www.youtube.com/embed/${extractYoutubeId(presentationUrl)}`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Ссылка на YouTube не задана — добавьте её в редакторе урока
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-center">
                {!isScreenSharing ? (
                  <button
                    onClick={startScreenShare}
                    disabled={!presentationUrl}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors text-lg shadow-lg"
                  >
                    📡 Транслировать ученикам
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                      🔴 Идёт трансляция ученикам
                    </span>
                    <button
                      onClick={stopScreenShare}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
                    >
                      Остановить
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-xs text-center mt-2 max-w-xl mx-auto">
                Браузер предложит <em>«Поделиться этой вкладкой»</em> — нажмите «Поделиться» и убедитесь, что включён <em>«звук вкладки»</em>. Отдельную вкладку с YouTube открывать не нужно.
              </p>
            </>
          ) : isScreenSharing ? null : (
            <div className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4 text-gray-400">📺</div>
              <p className="text-xl text-gray-500">Ожидание трансляции учителя...</p>
              {showDebug && debugLogs.length > 0 && (
                <div className="mt-6 w-full max-w-2xl max-h-64 overflow-y-auto bg-black/90 text-green-400 text-xs font-mono p-3 rounded-lg border border-green-500/30">
                  <div className="text-green-300 mb-1 font-bold">WebRTC debug log:</div>
                  {debugLogs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isTeacher && isScreenSharing && (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg">
                🟢 Трансляция учителя
              </div>
              {needsTapToPlay && (
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = isMuted;
                      videoRef.current.play?.()
                        .then(() => { pushDebug('▶ tap-play resolved'); setNeedsTapToPlay(false); })
                        .catch((e) => pushDebug('❌ tap-play: ' + (e?.name || e?.message)));
                    }
                  }}
                  className="absolute inset-0 m-auto w-64 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-2xl shadow-2xl"
                >
                  ▶ Tap to play
                </button>
              )}
            </div>
          )}
        </div>
      ) : presentationType === 'screen-share' ? (
        <div className="h-full">
          {!isScreenSharing && isTeacher ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-4">🖥️</div>
              <h3 className="text-2xl font-semibold mb-4">Демонстрация экрана</h3>
              <button
                onClick={startScreenShare}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                Поделиться экраном
              </button>
              <p className="text-gray-600 mt-4">
                Откройте презентацию на компьютере и нажмите кнопку выше
              </p>
            </div>
          ) : isScreenSharing ? (
            <div className="relative h-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
              {isTeacher && (
                <button
                  onClick={stopScreenShare}
                  className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Остановить демонстрацию
                </button>
              )}
              {!isTeacher && (
                <>
                  <div className="absolute top-4 left-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg">
                    🟢 Учитель демонстрирует экран
                  </div>
                  {needsTapToPlay && (
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = isMuted;
                          videoRef.current.play?.()
                            .then(() => { pushDebug('▶ tap-play resolved'); setNeedsTapToPlay(false); })
                            .catch((e) => pushDebug('❌ tap-play: ' + (e?.name || e?.message)));
                        }
                      }}
                      className="absolute inset-0 m-auto w-64 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-2xl shadow-2xl"
                    >
                      ▶ Tap to play
                    </button>
                  )}
                  {showDebug && debugLogs.length > 0 && (
                    <div className="absolute bottom-2 right-2 max-w-md max-h-48 overflow-y-auto bg-black/85 text-green-400 text-[10px] font-mono p-2 rounded border border-green-500/30">
                      {debugLogs.slice(-12).map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4 text-gray-400">🖥️</div>
                <p className="text-xl text-gray-500">Ожидание демонстрации экрана...</p>
              </div>
              {showDebug && debugLogs.length > 0 && (
                <div className="mt-6 w-full max-w-2xl max-h-64 overflow-y-auto bg-black/90 text-green-400 text-xs font-mono p-3 rounded-lg border border-green-500/30">
                  <div className="text-green-300 mb-1 font-bold">WebRTC debug log:</div>
                  {debugLogs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4 text-gray-400">📊</div>
            <p className="text-xl text-gray-500">Презентация не настроена</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationActivity;
