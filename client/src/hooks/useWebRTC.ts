import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebRTCManager } from '../services/webrtc/WebRTCManager.js';
import { ControlMessage, ChatMessage } from '../types/index.js';

interface UseWebRTCOptions {
  roomCode: string;
  role: 'sender' | 'receiver';
  userId?: string;
  userName?: string;
  onControlMessage?: (msg: ControlMessage) => void;
  onFileChunk?: (chunk: ArrayBuffer) => void;
  onChatMessage?: (msg: ChatMessage) => void;
}

export function useWebRTC({
  roomCode,
  role,
  userId,
  userName,
  onControlMessage,
  onFileChunk,
  onChatMessage,
}: UseWebRTCOptions) {
  const [peerState, setPeerState] = useState<RTCPeerConnectionState>('new');
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [peerName, setPeerName] = useState<string>('Peer');
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);

  const initWebRTC = useCallback(() => {
    if (!roomCode) return;

    // Connect Socket.IO for signaling
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // Initialize WebRTC Manager
    const isInitiator = role === 'sender';
    const webrtc = new WebRTCManager(isInitiator, {
      onConnectionStateChange: (state) => {
        setPeerState(state);
        if (state === 'connected') {
          setIsPeerConnected(true);
        } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          setIsPeerConnected(false);
        }
      },
      onControlMessage: (msg) => {
        if (onControlMessage) onControlMessage(msg);
      },
      onFileChunk: (chunk) => {
        if (onFileChunk) onFileChunk(chunk);
      },
      onChatMessage: (msg) => {
        if (onChatMessage) onChatMessage(msg);
      },
      onIceCandidate: (candidate) => {
        socket.emit('ice-candidate', { roomCode, candidate });
      },
      onError: (err) => {
        setError(err.message);
      },
    });
    webrtcRef.current = webrtc;

    // Socket Signaling Event Handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected, joining room:', roomCode);
      socket.emit('join-room', { roomCode, userId, userName, role });
    });

    socket.on('peer-joined', async (data: { peerId: string; role: string; userName?: string }) => {
      console.log('[Socket] Peer joined room:', data);
      if (data.userName) setPeerName(data.userName);

      // Sender creates SDP Offer when receiver joins
      if (role === 'sender') {
        try {
          const offer = await webrtc.createOffer();
          socket.emit('offer', { roomCode, sdp: offer });
        } catch (err: any) {
          console.error('[WebRTC] Offer creation failed:', err);
          setError(err.message);
        }
      }
    });

    socket.on('offer', async (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => {
      if (role === 'receiver') {
        try {
          const answer = await webrtc.handleOffer(data.sdp);
          socket.emit('answer', { roomCode, sdp: answer });
        } catch (err: any) {
          console.error('[WebRTC] Offer handling failed:', err);
          setError(err.message);
        }
      }
    });

    socket.on('answer', async (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => {
      if (role === 'sender') {
        try {
          await webrtc.handleAnswer(data.sdp);
        } catch (err: any) {
          console.error('[WebRTC] Answer handling failed:', err);
          setError(err.message);
        }
      }
    });

    socket.on('ice-candidate', async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
      await webrtc.addIceCandidate(data.candidate);
    });

    socket.on('peer-disconnected', () => {
      setIsPeerConnected(false);
      setPeerState('disconnected');
    });

    return () => {
      socket.disconnect();
      webrtc.close();
    };
  }, [roomCode, role, userId, userName, onControlMessage, onFileChunk, onChatMessage]);

  useEffect(() => {
    const cleanup = initWebRTC();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initWebRTC]);

  const updateSessionStatus = useCallback(
    (status: 'CONNECTING' | 'CONNECTED' | 'TRANSFERRING' | 'COMPLETED' | 'CANCELLED') => {
      if (socketRef.current) {
        socketRef.current.emit('update-session-status', { roomCode, status });
      }
    },
    [roomCode]
  );

  return {
    webrtc: webrtcRef.current,
    peerState,
    isPeerConnected,
    peerName,
    error,
    updateSessionStatus,
  };
}
