import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { UserConnectData, UserDisconnectData, CallData, CallResponse } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/callcontrol',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const activeCalls = new Map<string, CallData>();
const userConnections = new Map<string, { maxCalls: number; currentCalls: number }>();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('USER_CONNECT', (data: UserConnectData) => {
    try {
      userConnections.set(data.username, {
        maxCalls: data.maxCalls,
        currentCalls: 0
      });

      socket.emit('USER_CONNECTED', data);
      
      // Start sending random calls
      startSendingCalls(socket, data.username);
    } catch (error) {
      socket.emit('USER_CONNECTION_ERROR', {
        ...data,
        error: 'Failed to connect user'
      });
    }
  });

  socket.on('USER_DISCONNECT', (data: UserDisconnectData) => {
    try {
      userConnections.delete(data.username);
      socket.emit('USER_DISCONNECTED', data);
    } catch (error) {
      socket.emit('USER_DISCONNECTION_ERROR', {
        ...data,
        error: 'Failed to disconnect user'
      });
    }
  });

  socket.on('NEW_CALL_ANSWERED', (data: CallResponse) => {
    try {
      const call = activeCalls.get(data.callId);
      if (call) {
        socket.emit('NEW_CALL_ANSWERED', { callId: data.callId });
      } else {
        socket.emit('NEW_CALL_ERROR', {
          callId: data.callId,
          error: 'Call not found'
        });
      }
    } catch (error) {
      socket.emit('NEW_CALL_ERROR', {
        callId: data.callId,
        error: 'Failed to answer call'
      });
    }
  });

  socket.on('END_CALL', (data: CallResponse) => {
    try {
      const call = activeCalls.get(data.callId);
      if (call) {
        activeCalls.delete(data.callId);
        socket.emit('CALL_ENDED', { callId: data.callId });
      } else {
        socket.emit('END_CALL_ERROR', {
          callId: data.callId,
          error: 'Call not found'
        });
      }
    } catch (error) {
      socket.emit('END_CALL_ERROR', {
        callId: data.callId,
        error: 'Failed to end call'
      });
    }
  });
});

function startSendingCalls(socket: any, username: string) {
  const sendRandomCall = () => {
    const userInfo = userConnections.get(username);
    
    if (userInfo && userInfo.currentCalls < userInfo.maxCalls) {
      const newCall: CallData = {
        callId: Math.random().toString(36).substring(7),
        media: 'CHAT',
        startDate: new Date(),
        service: 'Customer Support',
        caller: `Caller ${Math.floor(Math.random() * 1000)}`
      };

      activeCalls.set(newCall.callId, newCall);
      userInfo.currentCalls++;
      socket.emit('NEW_CALL', newCall);
    }

    // Schedule next call between 0-15 seconds
    const nextCallDelay = Math.random() * 15000;
    setTimeout(sendRandomCall, nextCallDelay);
  };

  sendRandomCall();
}

const PORT = 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});