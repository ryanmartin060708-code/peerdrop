import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Clock, HardDrive, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { TransferSession } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { Badge } from '../components/ui/Badge.js';

export const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<TransferSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getUserHistory();
        setSessions(res.sessions);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatBytes = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-apple-gray-900 dark:text-white tracking-tight flex items-center space-x-2">
            <HistoryIcon className="w-7 h-7 text-apple-blue" />
            <span>Transfer History</span>
          </h1>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1">
            Complete record of your past peer-to-peer file sharing sessions
          </p>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-apple-gray-400">
            Loading session history...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-apple-gray-400">
            No transfer history recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-apple-gray-100/50 dark:bg-apple-gray-800/50 border-b border-black/5 dark:border-white/5 text-apple-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Room Code</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Files / Size</th>
                  <th className="px-6 py-3.5">Peer</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created At</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {sessions.map((s) => {
                  const isSender = s.senderId === user?.id;
                  const peerInfo = isSender ? s.receiver?.name || 'Receiver' : s.sender?.name || 'Sender';
                  return (
                    <tr key={s.id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-apple-gray-900 dark:text-white">
                        {s.roomCode}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${isSender ? 'text-apple-blue' : 'text-indigo-500'}`}>
                          {isSender ? 'Sender' : 'Receiver'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-apple-gray-600 dark:text-apple-gray-300">
                        {s.fileCount} files ({formatBytes(s.totalSize)})
                      </td>
                      <td className="px-6 py-4 text-apple-gray-600 dark:text-apple-gray-300 font-medium">
                        {peerInfo}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={s.status} />
                      </td>
                      <td className="px-6 py-4 text-apple-gray-400">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/transfer/${s.id}`)}
                        >
                          View
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
  );
};
