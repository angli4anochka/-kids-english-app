import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

interface SocketAuth {
  role: string;
  userId: string;
  groupId?: number;
}

interface ConnectionState {
  isConnected: boolean;
  error: string | null;
  connectionCount: number;
}

/**
 * Singleton WebSocket service for managing a single socket connection
 * across the entire application. Uses reference counting to ensure
 * proper cleanup only when no components are using the socket.
 */
class SocketService {
  private static instance: SocketService | null = null;
  private socket: Socket | null = null;
  private currentAuth: SocketAuth | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    error: null,
    connectionCount: 0,
  };
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance of SocketService
   */
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to WebSocket server with authentication
   * Reuses existing connection if auth matches
   */
  connect(auth: SocketAuth): Socket | null {
    // If socket exists and auth matches, reuse it
    if (this.socket && this.authMatches(auth)) {
      console.log('[SocketService] Reusing existing connection:', this.socket?.id);
      this.connectionState.connectionCount++;
      return this.socket;
    }

    // Auth changed or no socket exists, create new connection
    if (this.socket) {
      console.log('[SocketService] Auth changed, disconnecting old socket');
      this.disconnect();
    }

    console.log('[SocketService] Creating new connection with auth:', auth);
    this.currentAuth = auth;

    this.socket = io(API_CONFIG.socketURL, {
      path: '/kids-api/socket.io/',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth,
    });

    this.setupEventHandlers();
    this.connectionState.connectionCount = 1;

    return this.socket;
  }

  /**
   * Decrement reference count and disconnect if no components using socket
   */
  release(): void {
    this.connectionState.connectionCount--;
    console.log('[SocketService] Released connection. Count:', this.connectionState.connectionCount);

    // Don't disconnect immediately - keep connection alive for reuse
    // Only disconnect on auth change or explicit cleanup
  }

  /**
   * Force disconnect (used when auth changes or app closes)
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentAuth = null;
      this.connectionState = {
        isConnected: false,
        error: null,
        connectionCount: 0,
      };
      this.listeners.clear();
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get connection state
   */
  getState(): Readonly<ConnectionState> {
    return { ...this.connectionState };
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    const listeners = this.getOrCreateListeners('stateChange');
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }

  /**
   * Emit event to server
   */
  emit(event: string, ...args: any[]): void {
    if (!this.socket || !this.connectionState.isConnected) {
      console.warn('[SocketService] Cannot emit - not connected');
      return;
    }

    console.log('[SocketService] Emitting:', event, args);
    this.socket.emit(event, ...args);
  }

  /**
   * Listen to event from server
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.socket) {
      console.warn('[SocketService] Cannot listen - no socket');
      return () => {};
    }

    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  /**
   * Remove listener for event
   */
  off(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Private methods

  private authMatches(auth: SocketAuth): boolean {
    if (!this.currentAuth) return false;

    return (
      this.currentAuth.userId === auth.userId &&
      this.currentAuth.groupId === auth.groupId &&
      this.currentAuth.role === auth.role
    );
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected:', this.socket?.id);
      this.connectionState.isConnected = true;
      this.connectionState.error = null;
      this.notifyStateChange();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
      this.connectionState.isConnected = false;
      this.notifyStateChange();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
      this.connectionState.error = `Connection error: ${error.message}`;
      this.connectionState.isConnected = false;
      this.notifyStateChange();
    });
  }

  private getOrCreateListeners(event: string): Set<Function> {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    return this.listeners.get(event)!;
  }

  private notifyStateChange(): void {
    const listeners = this.listeners.get('stateChange');
    if (listeners) {
      listeners.forEach((callback) => {
        (callback as Function)(this.connectionState);
      });
    }
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
