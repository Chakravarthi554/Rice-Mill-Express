const { expect } = require('chai');
const { io } = require('socket.io-client');
const sinon = require('sinon');
const { createServer } = require('http');
const express = require('express');
const setupSocketServer = require('../utils/socketServer');
const { createAdapter } = require('@socket.io/redis-adapter');
const { client } = require('../utils/redis'); // Redis client used by the app

describe('WebSocket Server', function () {
  let httpServer, socketServer, clientSocket;

  before(async () => {
    // Setup Express & HTTP server
    const app = express();
    httpServer = createServer(app);
    
    // Mock redis client
    const redisMock = require('redis');
    const mockClient = {
      connect: sinon.stub().resolves(),
      on: sinon.stub(),
      duplicate: sinon.stub().returnsThis()
    };
    sinon.stub(redisMock, 'createClient').returns(mockClient);
    
    // Mount Socket.io
    socketServer = await setupSocketServer(httpServer);
    
    return new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = io(`http://localhost:${port}`);
        clientSocket.on('connect', resolve);
      });
    });
  });

  after(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (socketServer) {
      socketServer.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    sinon.restore();
  });

  it('should join an order room successfully', (done) => {
    const orderId = 'order_12345';
    
    // Simulate user joining an order room
    clientSocket.emit('joinRoom', orderId);

    // Give it a moment to join the room on the server side
    setTimeout(() => {
      // Get the sockets in the room
      const roomSockets = socketServer.sockets.adapter.rooms.get(orderId);
      expect(roomSockets).to.not.be.undefined;
      done();
    }, 50);
  });

  it('should broadcast an ORDER_UPDATE event to the correct room', (done) => {
    const orderId = 'order_12345';
    const payload = { status: 'Delivered', orderId };
    
    // Setup the listener
    clientSocket.once('ORDER_UPDATE', (data) => {
      expect(data.status).to.equal('Delivered');
      expect(data.orderId).to.equal(orderId);
      done();
    });

    // We emit joinRoom just in case the previous test is isolated
    clientSocket.emit('joinRoom', orderId);

    setTimeout(() => {
      // Broadcast from the server
      socketServer.to(orderId).emit('ORDER_UPDATE', payload);
    }, 50);
  });
});
