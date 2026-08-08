import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  HardDrive,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TransferSession } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { Badge } from '../components/ui/Badge.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentSessions, setRecentSessions] = useState<TransferSession[]>([]);
  const [receiveRoomCode, setReceiveRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getUserHistory();
        setRecentSessions(res.sessions);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiveRoomCode.trim()) {
      navigate(`/receive/${receiveRoomCode.trim().toUpperCase()}`);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-apple-gray-900 dark:text-white tracking-tight">
            Welcome, {user?.name || 'Peer'}
          </h1>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1">
            Direct WebRTC peer-to-peer file sharing hub
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Server Data Storage</span>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Action Card */}
        <GlassCard hoverEffect className="flex flex-col justify-between space-y-6">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-apple-blue flex items-center justify-center text-white mb-4 shadow-apple-md">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-apple-gray-900 dark:text-white mb-2">
              Send Files
            </h2>
            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
              Create a secure WebRTC transfer room. Select files, generate a room code or QR code, and send directly to your peer.
            </p>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/send')}
            icon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto self-start shadow-apple-sm"
          >
            Create Transfer Session
          </Button>
        </GlassCard>

        {/* Receive Action Card */}
        <GlassCard hoverEffect className="flex flex-col justify-between space-y-6">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-4 shadow-apple-md">
              <DownloadCloud className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-apple-gray-900 dark:text-white mb-2">
              Receive Files
            </h2>
            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
              Have a 6-character room code from a sender? Enter it below to join the room and receive files directly into your browser.
            </p>
          </div>

          <form onSubmit={handleReceiveSubmit} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-apple-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={receiveRoomCode}
                onChange={(e) => setReceiveRoomCode(e.target.value.toUpperCase())}
                placeholder="Room Code (e.g. 7K4P9X)"
                className="w-full pl-10 pr-4 py-2.5 bg-apple-gray-100 dark:bg-apple-gray-800 border border-black/5 dark:border-white/10 rounded-full font-mono text-sm font-bold uppercase tracking-wider text-apple-gray-900 dark:text-white placeholder-normal placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Connect
            </Button>
          </form>
        </GlassCard>
      </div>

      {/* Security Disclaimer Banner */}
      <GlassCard className="bg-gradient-to-r from-apple-blue/5 via-indigo-500/5 to-transparent border-apple-blue/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-apple-blue/10 text-apple-blue shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                Your files stay on your device.
              </h4>
              <p className="text-xs text-apple-gray-600 dark:text-apple-gray-400 mt-0.5">
                PeerDrop does not operate cloud storage. Binary file chunks are transmitted encrypted directly between WebRTC browser peers.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-apple-blue" />
            <span>Recent Transfer Sessions</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            View All
          </Button>
        </div>

        <GlassCard className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-apple-gray-400">Loading history...</div>
          ) : recentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-apple-gray-400">
              No recent transfer sessions found. Start by creating a transfer!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-apple-gray-100/50 dark:bg-apple-gray-800/50 border-b border-black/5 dark:border-white/5 text-apple-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Room Code</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Files / Size</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {recentSessions.slice(0, 5).map((session) => {
                    const isSender = session.senderId === user?.id;
                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-apple-gray-900 dark:text-white">
                          {session.roomCode}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              isSender ? 'text-apple-blue' : 'text-indigo-500'
                            }`}
                          >
                            {isSender ? 'Sender' : 'Receiver'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-apple-gray-600 dark:text-apple-gray-300">
                          {session.fileCount} files ({formatBytes(session.totalSize)})
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={session.status} />
                        </td>
                        <td className="px-6 py-4 text-apple-gray-400">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/transfer/${session.id}`)}
                          >
                            Open
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
