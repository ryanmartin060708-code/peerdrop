import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Check, Download, X, Share2 } from 'lucide-react';
import { Button } from './Button.js';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  roomCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  roomCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0071e3',
          light: '#ffffff',
        },
      }).catch((err) => console.error('QR Code render error:', err));
    }
  }, [isOpen, shareUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `peerdrop-qr-${roomCode}.png`;
      a.click();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="relative apple-glass-card w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 flex flex-col items-center text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-apple-gray-500 hover:text-apple-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 flex items-center justify-center text-apple-blue mb-4">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-apple-gray-900 dark:text-white mb-1">
              Scan to Connect
            </h3>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mb-6">
              Scan with mobile camera or share link below
            </p>

            {/* QR Canvas */}
            <div className="p-4 bg-white rounded-2xl border border-black/5 shadow-apple-sm mb-6">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            {/* Room Code pill */}
            <div className="w-full bg-apple-gray-100 dark:bg-apple-gray-800 rounded-2xl p-3 mb-4 flex items-center justify-between border border-black/5 dark:border-white/5">
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-apple-gray-400 block">
                  Room Code
                </span>
                <span className="font-mono text-lg font-bold tracking-wider text-apple-gray-900 dark:text-white">
                  {roomCode}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                icon={copiedCode ? <Check className="w-4 h-4 text-apple-green" /> : <Copy className="w-4 h-4" />}
              >
                {copiedCode ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {/* Actions */}
            <div className="w-full grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadQR}
                icon={<Download className="w-4 h-4" />}
              >
                QR Image
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyLink}
                icon={copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              >
                {copiedLink ? 'Copied Link' : 'Copy Link'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
