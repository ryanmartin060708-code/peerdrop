import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Share2,
  UploadCloud,
  DownloadCloud,
  History,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from './Button.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Sync theme class on HTML element
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
    { path: '/send', label: 'Send', icon: <UploadCloud className="w-4 h-4" /> },
    { path: '/history', label: 'History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-black/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-apple-sm group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-apple-gray-900 dark:text-white">
              PeerDrop
            </span>
            <span className="text-[10px] tracking-wide text-apple-gray-400 font-medium -mt-1">
              Send files. Directly.
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1 bg-apple-gray-200/50 dark:bg-apple-gray-800/50 p-1 rounded-full border border-black/5 dark:border-white/5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-apple-gray-900 dark:text-white'
                      : 'text-apple-gray-500 hover:text-apple-gray-800 dark:hover:text-apple-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-white dark:bg-apple-gray-700 rounded-full shadow-apple-sm"
                      transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                    />
                  )}
                  <span className="relative z-10">{link.icon}</span>
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white hover:bg-apple-gray-200 dark:hover:bg-apple-gray-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-apple-gray-200/60 dark:bg-apple-gray-800/60 text-xs font-medium hover:bg-apple-gray-300 dark:hover:bg-apple-gray-700 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-apple-blue text-white flex items-center justify-center text-[10px] font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-apple-gray-900 dark:text-apple-gray-100">
                  {user?.name}
                </span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-full text-apple-gray-500 hover:text-apple-red hover:bg-apple-red/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
