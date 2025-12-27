import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';

// --- Types & Interfaces ---

interface JWTPayload {
  userId: string;
  projects: string[];
}

interface FlagUpdateDelta {
  flagId: string;
  type: 'update' | 'delete' | 'create';
  patch: object;
  timestamp: number;
}

// --- Configuration ---

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

class RealtimeSyncGateway extends EventEmitter {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    super();
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: '*', credentials: true },
      path: '/socket.io'
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as JWTPayload;
      console.log(`User ${user.userId} connected`);

      if (!this.userSockets.has(user.userId)) {
        this.userSockets.set(user.userId, new Set());
      }
      this.userSockets.get(user.userId)!.add(socket.id);

      user.projects.forEach(projectId => {
        const roomName = `project:${projectId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined ${roomName}`);
      });

      socket.on('disconnect', () => {
        const sockSet = this.userSockets.get(user.userId);
        if (sockSet) {
          sockSet.delete(socket.id);
          if (sockSet.size === 0) this.userSockets.delete(user.userId);
        }
      });
    });
  }

  /**
   * Broadcasts a specific flag update to all clients subscribed to the project.
   * Uses "Delta Updates" to minimize payload.
   */
  public broadcastFlagUpdate(projectId: string, delta: FlagUpdateDelta) {
    const roomName = `project:${projectId}`;

    this.io.to(roomName).emit('flags:delta', {
      ...delta,
      timestamp: Date.now()
    });

    this.emit('internal:update_broadcast', { projectId, delta });
  }

  /**
   * Force a full snapshot resync for a specific project.
   */
  public requestResync(projectId: string, flags: any[]) {
    this.io.to(`project:${projectId}`).emit('flags:snapshot', flags);
  }
}

export default RealtimeSyncGateway;
