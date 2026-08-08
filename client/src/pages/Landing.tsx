import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Share2,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-8 sm:pt-16 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-semibold"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Pure WebRTC Peer-to-Peer Transfer</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-apple-gray-900 dark:text-white leading-[1.05]"
        >
          Send files.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-apple-blue via-indigo-500 to-purple-500">
            Directly.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.2 }}
          className="text-lg sm:text-xl text-apple-gray-600 dark:text-apple-gray-300 max-w-2xl mx-auto leading-relaxed"
        >
          Fast, private peer-to-peer file sharing powered by WebRTC. Your files travel directly between browsers without touching any cloud server.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/send')}
            icon={<Share2 className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-apple-md"
          >
            Send a file
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/receive/code')}
            icon={<Download className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            Receive files
          </Button>
        </motion.div>
      </section>

      {/* Interactive P2P Device Communication Visualization */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: 0.4 }}
        className="relative max-w-4xl mx-auto w-full"
      >
        <GlassCard className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative">
            {/* Sender Node */}
            <div className="flex flex-col items-center text-center space-y-3 z-10">
              <div className="w-20 h-20 rounded-3xl bg-apple-gray-100 dark:bg-apple-gray-800 border border-black/5 dark:border-white/10 flex items-center justify-center text-apple-blue shadow-apple-sm">
                <Laptop className="w-10 h-10" />
              </div>
              <div>
                <span className="font-semibold text-sm text-apple-gray-900 dark:text-white block">
                  Sender Browser
                </span>
                <span className="text-xs text-apple-gray-400">Browser A</span>
              </div>
            </div>

            {/* Direct P2P Channel */}
            <div className="flex-1 flex flex-col items-center w-full px-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-apple-blue mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypted RTCDataChannel</span>
              </div>

              <div className="relative w-full h-2 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: 'linear',
                  }}
                  className="w-1/3 h-full bg-gradient-to-r from-transparent via-apple-blue to-transparent rounded-full"
                />
              </div>

              <span className="text-[11px] text-apple-gray-500 mt-2 font-mono">
                No Cloud Storage • Zero Data Logs
              </span>
            </div>

            {/* Receiver Node */}
            <div className="flex flex-col items-center text-center space-y-3 z-10">
              <div className="w-20 h-20 rounded-3xl bg-apple-gray-100 dark:bg-apple-gray-800 border border-black/5 dark:border-white/10 flex items-center justify-center text-indigo-500 shadow-apple-sm">
                <Smartphone className="w-10 h-10" />
              </div>
              <div>
                <span className="font-semibold text-sm text-apple-gray-900 dark:text-white block">
                  Receiver Browser
                </span>
                <span className="text-xs text-apple-gray-400">Browser B</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.section>

      {/* 3 Core Value Props */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white mb-2">
            100% Private & Serverless
          </h3>
          <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
            The Node.js server coordinates WebRTC signaling only. Files are never uploaded, stored, or processed on server disks.
          </p>
        </GlassCard>

        <GlassCard hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white mb-2">
            Max Network Speed
          </h3>
          <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
            Direct peer connection yields maximum transfer bandwidth. Transfer gigabyte files in seconds over local Wi-Fi or high-speed LAN.
          </p>
        </GlassCard>

        <GlassCard hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white mb-2">
            SHA-256 Verified Integrity
          </h3>
          <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
            Cryptographic SHA-256 hash checks run automatically before and after transfer using Web Crypto API to ensure 100% byte fidelity.
          </p>
        </GlassCard>
      </section>
    </div>
  );
};
