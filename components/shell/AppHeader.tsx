'use client';

/**
 * App Header - Sprint 3
 * Top navigation with search, notifications, and user menu
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react';

interface AppHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function AppHeader({ onMenuClick, sidebarOpen }: AppHeaderProps) {
  const { detectedIndustry } = useIndustryStore();
  const { locale, setLocale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isRTL = locale === 'ar';

  const mockNotifications = [
    { id: 1, title: 'New competitor activity', time: '5 min ago' },
    { id: 2, title: 'Price change detected', time: '1 hour ago' },
    { id: 3, title: 'Weekly report ready', time: '2 hours ago' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Menu Button (mobile) + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} className="text-gray-600" />
          </button>

          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                size={18}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                className={`w-full py-2 ${
                  isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                } bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isRTL ? 'English' : 'العربية'}
          >
            <Globe size={20} className="text-gray-600" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell size={20} className="text-gray-600" />
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: industryConfig.primaryColor }}
              />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">
                      {isRTL ? 'الإشعارات' : 'Notifications'}
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button
                      className="w-full text-sm font-medium hover:underline"
                      style={{ color: industryConfig.primaryColor }}
                    >
                      {isRTL ? 'عرض الكل' : 'View all'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: industryConfig.primaryColor }}
              >
                JD
              </div>
              <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-500">john@company.com</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <User size={18} />
                      <span>{isRTL ? 'الملف الشخصي' : 'Profile'}</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <Settings size={18} />
                      <span>{isRTL ? 'الإعدادات' : 'Settings'}</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <LogOut size={18} />
                      <span>{isRTL ? 'تسجيل الخروج' : 'Sign out'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
