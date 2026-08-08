import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, ShieldCheck, Calendar, Key, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { GlassCard } from '../components/ui/GlassCard.js';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-apple-gray-900 dark:text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-1">
          Manage your account settings and WebRTC security preferences
        </p>
      </div>

      <GlassCard className="p-8 space-y-6">
        {/* User Header */}
        <div className="flex items-center space-x-4 border-b border-black/5 dark:border-white/5 pb-6">
          <div className="w-16 h-16 rounded-full bg-apple-blue text-white flex items-center justify-center text-2xl font-bold shadow-apple-md">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-xs text-apple-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Account Details List */}
        <div className="space-y-4 text-xs">
          <div className="flex justify-between py-2.5 border-b border-black/5 dark:border-white/5">
            <span className="text-apple-gray-500 font-medium flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-apple-blue" /> Name
            </span>
            <span className="font-semibold text-apple-gray-900 dark:text-white">{user?.name}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-black/5 dark:border-white/5">
            <span className="text-apple-gray-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-apple-blue" /> Email
            </span>
            <span className="font-semibold text-apple-gray-900 dark:text-white">{user?.email}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-black/5 dark:border-white/5">
            <span className="text-apple-gray-500 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> WebRTC Data Policy
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Zero Server Storage Verified
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center">
          <Button variant="danger" size="md" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Log Out Account
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
