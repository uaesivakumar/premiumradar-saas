'use client';

/**
 * @deprecated S372: This component is deprecated.
 * Use LeftRail from components/workspace/core instead.
 *
 * Static navigation sidebar has been replaced by the dynamic
 * LeftRail that shows sections based on state (LOCKED UX).
 *
 * TODO: Delete this file after confirming no dependencies.
 *
 * OLD: Sidebar Component - Sprint 3
 * OLD: Responsive collapsible sidebar
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import {
  Home,
  Search,
  Users,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  Send,
  Play,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  labelAr: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Home', labelAr: 'الرئيسية', href: '/dashboard', icon: <Home size={20} /> },
  { label: 'Discovery', labelAr: 'الاكتشاف', href: '/dashboard/discovery', icon: <Search size={20} /> },
  { label: 'Ranking', labelAr: 'التصنيف', href: '/dashboard/ranking', icon: <Trophy size={20} /> },
  { label: 'Outreach', labelAr: 'التواصل', href: '/dashboard/outreach', icon: <Send size={20} /> },
  { label: 'Analytics', labelAr: 'التحليلات', href: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Demo', labelAr: 'العرض', href: '/dashboard/demo', icon: <Play size={20} /> },
];

const bottomItems: NavItem[] = [
  // Admin removed - Super Admin is now at hidden /superadmin route (founder-only)
  { label: 'Settings', labelAr: 'الإعدادات', href: '/dashboard/settings', icon: <Settings size={20} /> },
  { label: 'Help', labelAr: 'المساعدة', href: '/dashboard/help', icon: <HelpCircle size={20} /> },
];

export function Sidebar({ isOpen, mobileOpen, onMobileClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const isRTL = locale === 'ar';

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive
            ? 'text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        style={isActive ? { backgroundColor: industryConfig.primaryColor } : undefined}
        title={!isOpen ? (isRTL ? item.labelAr : item.label) : undefined}
      >
        <span className={isActive ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {isRTL ? item.labelAr : item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: industryConfig.primaryColor }}
          >
            PR
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-gray-900 whitespace-nowrap overflow-hidden"
              >
                PremiumRadar
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <button
        onClick={onToggle}
        className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-all ${
          isRTL ? '-left-3' : '-right-3'
        }`}
      >
        {isOpen ? (
          isRTL ? <ChevronRight size={14} className="text-gray-500" /> : <ChevronLeft size={14} className="text-gray-500" />
        ) : (
          isRTL ? <ChevronLeft size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 256 : 80 }}
        className={`hidden lg:flex lg:flex-col fixed top-0 bottom-0 bg-white border-gray-200 z-30 ${
          isRTL ? 'right-0 border-l' : 'left-0 border-r'
        }`}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: isRTL ? 300 : -300 }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? 300 : -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`lg:hidden fixed top-0 bottom-0 w-64 bg-white z-50 flex flex-col ${
              isRTL ? 'right-0 border-l' : 'left-0 border-r'
            } border-gray-200`}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
