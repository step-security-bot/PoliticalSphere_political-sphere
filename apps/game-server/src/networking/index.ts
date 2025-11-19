/**
 * Basic networking utilities for game server
 * Handles connection management, message routing, and network diagnostics
 */

export interface NetworkMessage {
  type: string;
  payload: any;
  senderId?: string;
  timestamp: Date;
}

export interface ConnectionInfo {
  id: string;
  ip: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class NetworkManager {
  private connections: Map<string, ConnectionInfo> = new Map();

  /**
   * Register a new connection
   */
  registerConnection(id: string, ip: string): void {
    this.connections.set(id, {
      id,
      ip,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });
  }

  /**
   * Update last activity for a connection
   */
  updateActivity(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Remove a connection
   */
  removeConnection(id: string): void {
    this.connections.delete(id);
  }

  /**
   * Get connection info
   */
  getConnection(id: string): ConnectionInfo | undefined {
    return this.connections.get(id);
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * Broadcast message to all connections
   */
  broadcast(message: NetworkMessage): void {
    // In a real implementation, this would send to all connected clients
    console.log('Broadcasting message:', message);
  }

  /**
   * Send message to specific connection
   */
  sendTo(id: string, message: NetworkMessage): void {
    // In a real implementation, this would send to specific client
    console.log('Sending to', id, ':', message);
  }

  /**
   * Get network statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
  } {
    return {
      totalConnections: this.connections.size,
      activeConnections: this.connections.size, // Basic implementation
    };
  }

  /**
   * Check if connection is healthy
   */
  isHealthy(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) return false;

    const now = new Date();
    const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();
    return timeSinceActivity < 30000; // 30 seconds timeout
  }
}

export const networkManager = new NetworkManager();
