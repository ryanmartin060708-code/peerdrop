import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  ShieldCheck,
  Send as SendIcon,
  Pause,
  Play,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useFileTransfer } from '../hooks/useFileTransfer.js';
import { useChat } from '../hooks/useChat.js';
import { api } from '../services/api.js';
import { TransferSession } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { ProgressBar } from '../components/ui/ProgressBar.js';
import { Badge } from '../components/ui/Badge.js';

export const ActiveTransfer: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<TransferSession | null>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'chat'>('transfer');
  const [chatInput, setChatInput] = useState('');
  const [isLoadingSession, setIsLoadingLoadingSession] = useState(true);

  // Read state passed from previous navigation (files or role)
  const initialFiles: File[] = location.state?.files || [];
  const initialRole: 'sender' | 'receiver' = location.state?.role || 'sender';

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch session details from backend
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;
      try {
        const res = await api.getSessionById(sessionId);
        setSession(res.session);
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoadingLoadingSession(false);
      }
    };
    loadSession();
  }, [sessionId]);

  const role = session ? (session.senderId === user?.id ? 'sender' : 'receiver') : initialRole;
  const roomCode = session?.roomCode || '';

  // Initialize WebRTC and Transfer engines
  const {
    webrtc,
    peerState,
    isPeerConnected,
    peerName,
    error: webrtcError,
    updateSessionStatus,
  } = useWebRTC({
    roomCode,
    role,
    userId: user?.id,
    userName: user?.name,
    onControlMessage: (msg) => handleControlMessage(msg),
    onFileChunk: (chunk) => handleFileChunk(chunk),
    onChatMessage: (msg) => handleIncomingChatMessage(msg),
  });

  const {
    files,
    incomingMetadata,
    progress,
    transferState,
    currentFileIndex,
    sha256Verified,
    addFiles,
    requestTransfer,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    handleControlMessage,
    handleFileChunk,
    formatBytes,
    formatSpeed,
    formatETA,
  } = useFileTransfer(webrtc);

  const { messages, sendMessage, addSystemMessage, handleIncomingChatMessage } = useChat(
    webrtc,
    user?.id,
    user?.name
  );

  // Pre-load files into hook if passed from Send page
  useEffect(() => {
    if (initialFiles.length > 0 && files.length === 0) {
      addFiles(initialFiles);
    }
  }, [initialFiles]);

  // Request transfer once WebRTC connects for sender
  useEffect(() => {
    if (isPeerConnected && role === 'sender' && files.length > 0 && transferState === 'idle') {
      addSystemMessage('Peer connected. Preparing file transfer metadata...');
      updateSessionStatus('CONNECTED');
      requestTransfer();
    }
  }, [isPeerConnected, role, files, transferState]);

  // System notifications on connection status changes
  useEffect(() => {
    if (peerState === 'connected') {
      addSystemMessage(`WebRTC DataChannel connected with ${peerName}.`);
    } else if (peerState === 'disconnected') {
      addSystemMessage('Peer disconnected from room.');
    }
  }, [peerState, peerName]);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
      </div>
    );
  }

  const currentFileProgress = progress[currentFileIndex];
  const overallTotalBytes = progress.reduce((acc, p) => acc + p.size, 0);
  const overallTransferredBytes = progress.reduce((acc, p) => acc + p.transferredBytes, 0);
  const overallPct = overallTotalBytes > 0 ? (overallTransferredBytes / overallTotalBytes) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Session Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-apple-gray-900 dark:text-white">
                Session: <span className="font-mono text-apple-blue">{roomCode}</span>
              </h1>
              <Badge status={transferState.toUpperCase()} />
            </div>
            <p className="text-xs text-apple-gray-500">
              Role: <span className="font-semibold">{role === 'sender' ? 'Sender' : 'Receiver'}</span> • Peer Connection:{' '}
              <span className={`font-semibold ${isPeerConnected ? 'text-apple-green' : 'text-amber-500'}`}>
                {peerState}
              </span>
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden bg-apple-gray-200 dark:bg-apple-gray-800 p-1 rounded-full border border-black/5 dark:border-white/5">
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 ${
              activeTab === 'transfer' ? 'bg-white dark:bg-apple-gray-700 shadow-apple-sm' : 'text-apple-gray-500'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 ${
              activeTab === 'chat' ? 'bg-white dark:bg-apple-gray-700 shadow-apple-sm' : 'text-apple-gray-500'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({messages.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid (Desktop: Left = Transfer, Right = Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transfer Interface */}
        <div className={`lg:col-span-7 space-y-6 ${activeTab === 'transfer' ? 'block' : 'hidden lg:block'}`}>
          {/* Active File Progress Card */}
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-apple-gray-900 dark:text-white">
                    {transferState === 'transferring'
                      ? 'Transferring Files'
                      : transferState === 'completed'
                      ? 'Transfer Completed'
                      : 'Transfer Status'}
                  </h3>
                  <span className="text-xs text-apple-gray-500">
                    {formatBytes(overallTransferredBytes)} of {formatBytes(overallTotalBytes)} total
                  </span>
                </div>
              </div>

              {transferState === 'transferring' && (
                <Button variant="danger" size="sm" onClick={cancelTransfer}>
                  Cancel
                </Button>
              )}
            </div>

            {/* Overall Progress Bar */}
            <ProgressBar
              progress={overallPct}
              statusText={
                transferState === 'waiting_approval'
                  ? 'Waiting for receiver approval...'
                  : transferState === 'transferring'
                  ? `Sending file ${currentFileIndex + 1} of ${progress.length}`
                  : transferState === 'completed'
                  ? 'All files transferred'
                  : 'Ready'
              }
              speedText={currentFileProgress ? formatSpeed(currentFileProgress.speedBytesPerSec) : ''}
              etaText={currentFileProgress ? `ETA ${formatETA(currentFileProgress.etaSeconds)}` : ''}
            />

            {/* Receiver Prompt Banner */}
            {role === 'receiver' && transferState === 'waiting_approval' && incomingMetadata && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sender requested file transfer</span>
                </div>
                <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300">
                  {incomingMetadata.length} file(s) total ({formatBytes(incomingMetadata.reduce((a, b) => a + b.size, 0))})
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={acceptTransfer}>
                    Accept Transfer
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectTransfer}>
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* SHA-256 Hash Verification Notice */}
            {sha256Verified !== null && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2.5 ${
                  sha256Verified
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-apple-red/10 border-apple-red/20 text-apple-red'
                }`}
              >
                {sha256Verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>SHA-256 Integrity Verified: File bytes match sender hash perfectly.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>Integrity Warning: SHA-256 hash mismatch detected.</span>
                  </>
                )}
              </div>
            )}
          </GlassCard>

          {/* Individual File Items List */}
          <GlassCard className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-apple-gray-900 dark:text-white">
              File Queue ({progress.length})
            </h4>

            <div className="space-y-3">
              {progress.map((item, idx) => (
                <div
                  key={item.fileId || idx}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col space-y-2 transition-colors ${
                    idx === currentFileIndex && transferState === 'transferring'
                      ? 'bg-apple-blue/5 border-apple-blue/30'
                      : 'bg-apple-gray-100 dark:bg-apple-gray-800/60 border-black/5 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileText className="w-4 h-4 text-apple-blue shrink-0" />
                      <span className="font-semibold text-apple-gray-900 dark:text-white truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-apple-gray-500 font-mono shrink-0">
                      {formatBytes(item.size)}
                    </span>
                  </div>

                  <ProgressBar
                    progress={item.progressPercentage}
                    color={item.status === 'completed' || item.status === 'verified' ? 'green' : 'blue'}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Peer Chat */}
        <div className={`lg:col-span-5 ${activeTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
          <GlassCard className="p-0 overflow-hidden h-[540px] flex flex-col justify-between">
            {/* Chat Top Bar */}
            <div className="p-4 bg-apple-gray-100/50 dark:bg-apple-gray-800/50 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-apple-blue" />
                <span className="font-bold text-sm text-apple-gray-900 dark:text-white">
                  RTCDataChannel Chat
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-semibold">
                Direct P2P
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-apple-gray-400">
                  No chat messages yet. Send a message to your peer!
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="text-center text-[11px] text-apple-gray-400 py-1 italic font-mono"
                      >
                        — {msg.content} —
                      </div>
                    );
                  }

                  const isMe = msg.senderId === user?.id || msg.senderName === 'You';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-apple-gray-400 mb-1 px-1">
                        {isMe ? 'You' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-apple-blue text-white rounded-br-none'
                            : 'bg-apple-gray-200 dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendChat}
              className="p-3 bg-apple-gray-100/50 dark:bg-apple-gray-800/50 border-t border-black/5 dark:border-white/5 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isPeerConnected ? 'Type message...' : 'Waiting for peer connection...'}
                disabled={!isPeerConnected}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-apple-gray-800 border border-black/5 dark:border-white/10 rounded-full text-xs text-apple-gray-900 dark:text-white placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!isPeerConnected || !chatInput.trim()}
                icon={<SendIcon className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
