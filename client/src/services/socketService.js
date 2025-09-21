// src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  socket = null;
  listeners = new Map();
  pendingEmits = [];
  isConnecting = false;

  constructor() {
    this.SOCKET_URL =
      process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }

  // Connect to socket server
  connect(token = null) {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Prevent multiple connection attempts
    if (this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

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

    // Process pending emits when connected
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.isConnecting = false;
      this.processPendingEmits();
    });

    return this.socket;
  }

  // Alternative: Connect with Promise (use this OR the regular connect, not both)
  connectAsync(token = null) {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve(this.socket);
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const socketOptions = {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      };

      if (token) {
        socketOptions.auth = { token };
      }

      this.socket = io(this.SOCKET_URL, socketOptions);

      this.socket.once('connect', () => {
        console.log('Socket connected successfully');
        this.isConnecting = false;
        this.processPendingEmits();
        resolve(this.socket);
      });

      this.socket.once('connect_error', (error) => {
        console.error('Socket connection failed:', error);
        this.isConnecting = false;
        reject(error);
      });

      this.setupConnectionListeners();
    });
  }

  // Process queued events after connection
  processPendingEmits() {
    console.log(`Processing ${this.pendingEmits.length} pending emits`);
    while (this.pendingEmits.length > 0) {
      const { event, data } = this.pendingEmits.shift();
      console.log(`Emitting queued event: ${event}`);
      this.socket.emit(event, data);
    }
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.pendingEmits = [];
      this.isConnecting = false;
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
      console.warn(`Socket not connected. Queueing event: ${event}`);
      // Queue the emit for when connection is established
      this.pendingEmits.push({ event, data });

      // Try to connect if not already attempting
      if (!this.isConnecting && !this.socket) {
        this.connect();
      }
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
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnecting = false;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
    });
  }

  // Room management methods
  joinRoom(roomId) {
    console.log(`Attempting to join room: ${roomId}`);
    this.emit('join-room', roomId);
  }

  leaveRoom(roomId) {
    console.log(`Leaving room: ${roomId}`);
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
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else if (!this.socket) {
      this.connect();
    }
  }

  // Wait for connection (utility method)
  waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, timeout);

      if (this.socket) {
        this.socket.once('connect', () => {
          clearTimeout(timer);
          resolve();
        });
      } else {
        clearTimeout(timer);
        reject(new Error('Socket not initialized'));
      }
    });
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;
