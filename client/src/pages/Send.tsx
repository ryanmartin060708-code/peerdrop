import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  File as FileIcon,
  X,
  Plus,
  QrCode,
  Copy,
  Check,
  Share2,
  Lock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { QRCodeModal } from '../components/ui/QRCodeModal.js';
import { api } from '../services/api.js';

export const Send: React.FC = () => {
  const navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper byte formatting
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createTransferSession = async () => {
    if (selectedFiles.length === 0) return;
    setIsCreatingSession(true);

    try {
      const res = await api.createSession(totalSize, selectedFiles.length);
      setRoomCode(res.session.roomCode);
      setSessionId(res.session.id);
    } catch (err: any) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!roomCode) return;
    const shareUrl = `${window.location.origin}/receive/${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleProceedToTransfer = () => {
    if (sessionId) {
      navigate(`/transfer/${sessionId}`, { state: { files: selectedFiles } });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-apple-gray-900 dark:text-white tracking-tight">
          Create Secure Transfer
        </h1>
        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
          Select files to share. Transfer occurs directly between browsers when peer connects.
        </p>
      </div>

      {!roomCode ? (
        <GlassCard className="p-8 space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-apple-blue bg-apple-blue/10 scale-[1.01]'
                : 'border-apple-gray-300 dark:border-apple-gray-700 hover:border-apple-blue hover:bg-apple-blue/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white mb-1">
              Drag & Drop files here
            </h3>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mb-4">
              or click to browse from your device
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-apple-gray-200 dark:bg-apple-gray-800 text-[11px] font-semibold text-apple-gray-600 dark:text-apple-gray-300">
              Supports any file size or type
            </span>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-apple-gray-700 dark:text-apple-gray-300">
                  Selected Files ({selectedFiles.length})
                </span>
                <span className="text-apple-blue font-bold">Total: {formatBytes(totalSize)}</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <AnimatePresence>
                  {selectedFiles.map((file, idx) => (
                    <motion.div
                      key={`${file.name}-${idx}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-apple-gray-100 dark:bg-apple-gray-800/60 border border-black/5 dark:border-white/5 text-xs"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 rounded-xl bg-apple-blue/10 text-apple-blue">
                          <FileIcon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-apple-gray-900 dark:text-white block truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-apple-gray-400">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-1.5 rounded-full text-apple-gray-400 hover:text-apple-red hover:bg-apple-red/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={createTransferSession}
                disabled={isCreatingSession}
                icon={isCreatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                className="w-full shadow-apple-md"
              >
                {isCreatingSession ? 'Generating Room...' : 'Create Secure Transfer'}
              </Button>
            </div>
          )}
        </GlassCard>
      ) : (
        /* Waiting & Sharing State Card */
        <GlassCard className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mx-auto shadow-apple-sm">
            <Share2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-apple-gray-900 dark:text-white">
              Transfer Room Ready
            </h2>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1">
              Share the room code or QR code with your receiver to start transfer.
            </p>
          </div>

          {/* Room Code Display */}
          <div className="max-w-sm mx-auto p-4 rounded-3xl bg-apple-gray-100 dark:bg-apple-gray-800 border border-black/5 dark:border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-apple-gray-400 tracking-wider">
              Room Code
            </span>
            <div className="font-mono text-3xl font-extrabold tracking-widest text-apple-blue">
              {roomCode}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowQR(true)}
              icon={<QrCode className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Show QR Code
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyShareLink}
              icon={copiedLink ? <Check className="w-4 h-4 text-apple-green" /> : <Copy className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {copiedLink ? 'Link Copied' : 'Copy Share Link'}
            </Button>
          </div>

          {/* Waiting Pulsing Indicator */}
          <div className="pt-4 flex items-center justify-center space-x-2 text-xs font-semibold text-apple-gray-500">
            <span className="w-2 h-2 rounded-full bg-apple-blue animate-ping" />
            <span>Waiting for receiver to join...</span>
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleProceedToTransfer}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-apple-md"
            >
              Enter Transfer Screen
            </Button>
          </div>
        </GlassCard>
      )}

      {/* QR Code Modal */}
      {roomCode && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          shareUrl={`${window.location.origin}/receive/${roomCode}`}
          roomCode={roomCode}
        />
      )}
    </div>
  );
};
