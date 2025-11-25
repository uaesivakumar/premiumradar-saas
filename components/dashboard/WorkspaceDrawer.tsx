'use client';

/**
 * Workspace Drawer - Sprint 4
 * Slide-out panel for workspace management and quick actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import {
  X,
  Plus,
  Building2,
  Users,
  Settings,
  ChevronRight,
  Check,
} from 'lucide-react';

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
}

export function WorkspaceDrawer({ isOpen, onClose }: WorkspaceDrawerProps) {
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [selectedWorkspace, setSelectedWorkspace] = useState('ws-1');
  const isRTL = locale === 'ar';

  const workspaces: Workspace[] = [
    { id: 'ws-1', name: 'Acme Corporation', role: 'owner', memberCount: 12 },
    { id: 'ws-2', name: 'Sales Team', role: 'admin', memberCount: 8 },
    { id: 'ws-3', name: 'Partner Portal', role: 'member', memberCount: 25 },
  ];

  const quickActions = [
    { label: isRTL ? 'إنشاء مساحة عمل' : 'Create Workspace', icon: <Plus size={18} /> },
    { label: isRTL ? 'دعوة أعضاء' : 'Invite Members', icon: <Users size={18} /> },
    { label: isRTL ? 'إعدادات المساحة' : 'Workspace Settings', icon: <Settings size={18} /> },
  ];

  const roleLabels = {
    owner: isRTL ? 'مالك' : 'Owner',
    admin: isRTL ? 'مدير' : 'Admin',
    member: isRTL ? 'عضو' : 'Member',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: isRTL ? -400 : 400 }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? -400 : 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col ${
              isRTL ? 'left-0' : 'right-0'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {isRTL ? 'مساحات العمل' : 'Workspaces'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Workspace List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                  <motion.button
                    key={workspace.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedWorkspace(workspace.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedWorkspace === workspace.id
                        ? 'border-current bg-current/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                    style={
                      selectedWorkspace === workspace.id
                        ? { borderColor: industryConfig.primaryColor, color: industryConfig.primaryColor }
                        : undefined
                    }
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{
                        backgroundColor:
                          selectedWorkspace === workspace.id
                            ? industryConfig.primaryColor
                            : '#9CA3AF',
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{workspace.name}</span>
                        {selectedWorkspace === workspace.id && (
                          <Check
                            size={16}
                            style={{ color: industryConfig.primaryColor }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            workspace.role === 'owner'
                              ? 'bg-purple-100 text-purple-700'
                              : workspace.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {roleLabels[workspace.role]}
                        </span>
                        <span>
                          {workspace.memberCount}{' '}
                          {isRTL ? 'أعضاء' : 'members'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
              </h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span style={{ color: industryConfig.primaryColor }}>
                      {action.icon}
                    </span>
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                }}
              >
                {isRTL ? 'إدارة جميع المساحات' : 'Manage All Workspaces'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default WorkspaceDrawer;
