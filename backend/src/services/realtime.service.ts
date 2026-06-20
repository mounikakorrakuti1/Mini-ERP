import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { dashboardService } from './dashboard.service.js';

class RealtimeService {
  private io?: Server;

  init(server: HttpServer) {
    this.io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
    });
    this.io.on('connection', (socket) => {
      socket.emit('socket:ready', { connected: true, timestamp: new Date().toISOString() });
    });
  }

  async broadcastDashboardUpdate() {
    if (!this.io) return;
    const [summary, roleSummary] = await Promise.all([
      dashboardService.summary(),
      dashboardService.roleSummary(),
    ]);
    this.io.emit('dashboard:update', {
      summary,
      roleSummary,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastNotification(notification: unknown) {
    this.io?.emit('notification:new', {
      notification,
      timestamp: new Date().toISOString(),
    });
  }
}

export const realtimeService = new RealtimeService();
