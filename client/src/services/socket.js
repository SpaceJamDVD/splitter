// src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  socket = null;
  listeners = new Map();

  constructor() {
    this.SOCKET_URL =
      process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }

  // Connect to socket server
  connect(token = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketOptions = {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    };

    // Add authentication if token provided
    if (token) {
      socketOptions.auth = { token };
    }

    this.socket = io(this.SOCKET_URL, socketOptions);

    // Setup connection event listeners
    this.setupConnectionListeners();

    return this.socket;
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Emit an event to server
  emit(event, data = {}) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  // Listen for an event from server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);

      // Store callback reference for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);

      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  // Setup connection event listeners
  setupConnectionListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server. Attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });
  }

  // Room management methods
  joinRoom(roomId) {
    this.emit('join-room', roomId);
  }

  leaveRoom(roomId) {
    this.emit('leave-room', roomId);
  }

  // Message methods
  sendMessage(messageData) {
    this.emit('send-message', messageData);
  }

  onMessageReceived(callback) {
    this.on('receive-message', callback);
  }

  // Notification methods
  onNotification(callback) {
    this.on('notification', callback);
  }

  // Transaction/Balance update methods (for your expense app)
  onTransactionUpdate(callback) {
    this.on('transaction-update', callback);
  }

  onBalanceUpdate(callback) {
    this.on('balance-update', callback);
  }

  onGroupUpdate(callback) {
    this.on('group-update', callback);
  }

  // Emit transaction events
  emitTransactionCreated(transactionData) {
    this.emit('transaction-created', transactionData);
  }

  emitTransactionUpdated(transactionData) {
    this.emit('transaction-updated', transactionData);
  }

  emitTransactionDeleted(transactionId) {
    this.emit('transaction-deleted', transactionId);
  }

  // Utility method to get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }

  // Method to manually reconnect
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;
