import { Server, Socket } from 'socket.io';
import { prisma } from '../utils/prisma.js';

interface PeerJoinPayload {
  roomCode: string;
  userId?: string;
  userName?: string;
  role: 'sender' | 'receiver';
}

interface SignalPayload {
  roomCode: string;
  targetId?: string;
  sdp?: any;
  candidate?: any;
}

interface StatusPayload {
  roomCode: string;
  status: 'CONNECTING' | 'CONNECTED' | 'TRANSFERRING' | 'COMPLETED' | 'CANCELLED';
  receiverId?: string;
}

export function registerSignalingHandler(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Peer connected: ${socket.id}`);

    // Join WebRTC room
    socket.on('join-room', async (payload: PeerJoinPayload) => {
      const { roomCode, userId, userName, role } = payload;
      const cleanRoomCode = roomCode.toUpperCase().trim();

      socket.join(cleanRoomCode);
      (socket as any).roomCode = cleanRoomCode;
      (socket as any).role = role;
      (socket as any).userId = userId;
      (socket as any).userName = userName || (role === 'sender' ? 'Sender' : 'Receiver');

      console.log(`[Socket.IO] ${socket.id} (${role}) joined room ${cleanRoomCode}`);

      // Notify other peers in room
      socket.to(cleanRoomCode).emit('peer-joined', {
        peerId: socket.id,
        role,
        userId,
        userName: (socket as any).userName,
      });

      // Update receiverId & status in DB if receiver joins
      if (role === 'receiver' && userId) {
        try {
          await prisma.transferSession.updateMany({
            where: { roomCode: cleanRoomCode, status: 'WAITING' },
            data: {
              receiverId: userId,
              status: 'CONNECTING',
            },
          });
        } catch (err) {
          console.error('Error updating session receiver:', err);
        }
      }
    });

    // Handle SDP Offer
    socket.on('offer', (payload: SignalPayload) => {
      const { roomCode, sdp } = payload;
      console.log(`[Socket.IO] Offer received in ${roomCode} from ${socket.id}`);
      socket.to(roomCode.toUpperCase()).emit('offer', {
        senderId: socket.id,
        sdp,
      });
    });

    // Handle SDP Answer
    socket.on('answer', (payload: SignalPayload) => {
      const { roomCode, sdp } = payload;
      console.log(`[Socket.IO] Answer received in ${roomCode} from ${socket.id}`);
      socket.to(roomCode.toUpperCase()).emit('answer', {
        senderId: socket.id,
        sdp,
      });
    });

    // Handle ICE Candidate
    socket.on('ice-candidate', (payload: SignalPayload) => {
      const { roomCode, candidate } = payload;
      socket.to(roomCode.toUpperCase()).emit('ice-candidate', {
        senderId: socket.id,
        candidate,
      });
    });

    // Update Session Lifecycle Status in DB & notify peers
    socket.on('update-session-status', async (payload: StatusPayload) => {
      const { roomCode, status, receiverId } = payload;
      const cleanRoomCode = roomCode.toUpperCase().trim();

      console.log(`[Socket.IO] Status update for ${cleanRoomCode}: ${status}`);

      try {
        await prisma.transferSession.updateMany({
          where: { roomCode: cleanRoomCode },
          data: {
            status,
            ...(receiverId ? { receiverId } : {}),
          },
        });
      } catch (err) {
        console.error('Error updating status in DB:', err);
      }

      io.in(cleanRoomCode).emit('session-status-changed', { status });
    });

    // Disconnect cleanup
    socket.on('disconnect', async () => {
      const roomCode = (socket as any).roomCode;
      const role = (socket as any).role;
      console.log(`[Socket.IO] Peer ${socket.id} (${role}) disconnected from room ${roomCode}`);

      if (roomCode) {
        socket.to(roomCode).emit('peer-disconnected', {
          peerId: socket.id,
          role,
        });
      }
    });
  });
}
