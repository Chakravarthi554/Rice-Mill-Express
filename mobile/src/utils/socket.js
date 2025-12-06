import { EventEmitter } from 'events';

class OrderTrackingSocket extends EventEmitter {
  constructor(userId) {
    super();
    this.userId = userId;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    const protocol = __DEV__ ? 'ws' : 'wss';
    const host = __DEV__ ? 'localhost:5000' : 'your-production-domain.com';
    this.socket = new WebSocket(`${protocol}://${host}/ws?userId=${this.userId}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onclose = () => {
      this.emit('disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export default OrderTrackingSocket;