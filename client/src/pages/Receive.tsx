import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DownloadCloud, KeyRound, AlertCircle, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { api } from '../services/api.js';
import { TransferSession } from '../types/index.js';

export const Receive: React.FC = () => {
  const { roomCode: paramRoomCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(paramRoomCode || '');
  const [session, setSession] = useState<TransferSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async (code: string) => {
    if (!code || code.length < 5) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.getSessionByRoomCode(code);
      setSession(res.session);
    } catch (err: any) {
      setError(err.message || 'Room code not found or expired.');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramRoomCode && paramRoomCode !== 'code') {
      fetchSession(paramRoomCode);
    }
  }, [paramRoomCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      fetchSession(inputCode.trim().toUpperCase());
    }
  };

  const handleAccept = () => {
    if (session) {
      navigate(`/transfer/${session.id}`, { state: { role: 'receiver', roomCode: session.roomCode } });
    }
  };

  const handleDecline = () => {
    navigate('/dashboard');
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-apple-gray-900 dark:text-white tracking-tight">
          Receive Transfer
        </h1>
        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
          Enter room code to connect directly to sender browser
        </p>
      </div>

      <GlassCard className="p-8 space-y-6">
        {/* Search / Enter Code Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
              Enter 6-Character Room Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="7K4P9X"
                className="w-full pl-10 pr-4 py-3 bg-apple-gray-100 dark:bg-apple-gray-800 border border-black/5 dark:border-white/10 rounded-2xl font-mono text-base font-bold tracking-widest text-apple-gray-900 dark:text-white uppercase placeholder-normal placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || !inputCode.trim()}
            icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            {isLoading ? 'Locating room...' : 'Find Room'}
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Found Session Details Card */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 border-t border-black/5 dark:border-white/5 space-y-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto shadow-apple-sm">
              <DownloadCloud className="w-7 h-7" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-[11px] font-bold mb-2">
                Transfer Request Found
              </span>
              <h3 className="text-xl font-bold text-apple-gray-900 dark:text-white">
                {session.sender?.name || 'Someone'} wants to send you files
              </h3>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1">
                Room Code: <span className="font-mono font-bold text-apple-gray-800 dark:text-apple-gray-200">{session.roomCode}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-apple-gray-100 dark:bg-apple-gray-800/80 border border-black/5 dark:border-white/5 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-apple-gray-500">Sender:</span>
                <span className="font-semibold text-apple-gray-900 dark:text-white">
                  {session.sender?.name} ({session.sender?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-apple-gray-500">Files:</span>
                <span className="font-semibold text-apple-gray-900 dark:text-white">
                  {session.fileCount} file(s) ({formatBytes(session.totalSize)})
                </span>
              </div>
            </div>

            {/* Accept / Decline actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleDecline}
                icon={<XCircle className="w-4 h-4 text-apple-red" />}
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleAccept}
                icon={<CheckCircle2 className="w-4 h-4 text-white" />}
                className="shadow-apple-md"
              >
                Accept & Connect
              </Button>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
};
