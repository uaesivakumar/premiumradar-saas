'use client';

/**
 * SIVA Context Provider - Sprint 76: Intelligent UI
 *
 * Provides SIVA intelligence context throughout the app.
 * Tracks currently viewed entity and auto-fetches insights.
 *
 * Usage:
 * 1. Wrap app with <SivaContextProvider>
 * 2. Use useSivaContext() to access insights
 * 3. Call setActiveEntity() when user selects a company
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  getProactiveInsights,
  type ProactiveInsightsResponse,
} from '@/lib/integrations/siva-client';

// =============================================================================
// TYPES
// =============================================================================

export interface EntityContext {
  id?: string;
  name: string;
  type: 'company' | 'contact' | 'signal';
  domain?: string;
  sector?: string;
}

export interface SivaContextState {
  // Current entity being viewed
  activeEntity: EntityContext | null;

  // Proactive insights for active entity
  insights: ProactiveInsightsResponse | null;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Notifications/alerts
  notifications: SivaNotification[];

  // Insights panel visibility
  showInsightsPanel: boolean;
}

export interface SivaNotification {
  id: string;
  type: 'insight' | 'alert' | 'action' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  entityName?: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
}

export interface SivaContextActions {
  setActiveEntity: (entity: EntityContext | null) => void;
  refreshInsights: () => Promise<void>;
  clearEntity: () => void;
  addNotification: (notification: Omit<SivaNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleInsightsPanel: () => void;
  setShowInsightsPanel: (show: boolean) => void;
}

type SivaContextValue = SivaContextState & SivaContextActions;

// =============================================================================
// CONTEXT
// =============================================================================

const SivaContext = createContext<SivaContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface SivaContextProviderProps {
  children: ReactNode;
  tenantId?: string;
  autoFetchInsights?: boolean;
  notificationLimit?: number;
}

export function SivaContextProvider({
  children,
  tenantId,
  autoFetchInsights = true,
  notificationLimit = 10,
}: SivaContextProviderProps) {
  // State
  const [activeEntity, setActiveEntityState] = useState<EntityContext | null>(null);
  const [insights, setInsights] = useState<ProactiveInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SivaNotification[]>([]);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);

  // Fetch insights for entity
  const fetchInsights = useCallback(async (entity: EntityContext) => {
    if (!entity) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProactiveInsights({
        companyId: entity.id,
        companyName: entity.name,
        domain: entity.domain,
        tenantId,
      });

      if (response.success) {
        setInsights(response);

        // Auto-generate notifications for high-priority insights
        if (response.insights.some(i => i.priority === 1)) {
          const topInsight = response.insights.find(i => i.priority === 1);
          if (topInsight) {
            addNotificationInternal({
              type: 'insight',
              title: topInsight.title,
              message: topInsight.message,
              priority: 'high',
              entityName: entity.name,
            });
          }
        }
      } else {
        setError('Unable to load insights');
      }
    } catch (err) {
      console.error('[SivaContext] Error fetching insights:', err);
      setError('Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // Set active entity
  const setActiveEntity = useCallback((entity: EntityContext | null) => {
    setActiveEntityState(entity);

    if (!entity) {
      setInsights(null);
      setError(null);
      return;
    }

    if (autoFetchInsights) {
      fetchInsights(entity);
    }
  }, [autoFetchInsights, fetchInsights]);

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    if (activeEntity) {
      await fetchInsights(activeEntity);
    }
  }, [activeEntity, fetchInsights]);

  // Clear entity
  const clearEntity = useCallback(() => {
    setActiveEntityState(null);
    setInsights(null);
    setError(null);
  }, []);

  // Add notification (internal)
  const addNotificationInternal = useCallback((
    notification: Omit<SivaNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: SivaNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, notificationLimit);
    });
  }, [notificationLimit]);

  // Add notification (public)
  const addNotification = addNotificationInternal;

  // Mark notification read
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Toggle insights panel
  const toggleInsightsPanel = useCallback(() => {
    setShowInsightsPanel(prev => !prev);
  }, []);

  // Context value
  const value: SivaContextValue = {
    // State
    activeEntity,
    insights,
    isLoading,
    error,
    notifications,
    showInsightsPanel,

    // Actions
    setActiveEntity,
    refreshInsights,
    clearEntity,
    addNotification,
    markNotificationRead,
    clearNotifications,
    toggleInsightsPanel,
    setShowInsightsPanel,
  };

  return (
    <SivaContext.Provider value={value}>
      {children}
    </SivaContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useSivaContext(): SivaContextValue {
  const context = useContext(SivaContext);

  if (!context) {
    throw new Error('useSivaContext must be used within a SivaContextProvider');
  }

  return context;
}

// =============================================================================
// NOTIFICATION BADGE COMPONENT
// =============================================================================

export function SivaNotificationBadge() {
  const { notifications } = useSivaContext();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

// =============================================================================
// NOTIFICATION LIST COMPONENT
// =============================================================================

export function SivaNotificationList() {
  const { notifications, markNotificationRead, clearNotifications } = useSivaContext();

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No notifications
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-medium text-gray-400 uppercase">Notifications</span>
        <button
          onClick={clearNotifications}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Clear all
        </button>
      </div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => markNotificationRead(notification.id)}
          className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
            notification.read ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`w-2 h-2 mt-1.5 rounded-full ${
              notification.priority === 'high' ? 'bg-red-500' :
              notification.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-500'
            }`} />
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-white">{notification.title}</h5>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
              {notification.entityName && (
                <span className="text-xs text-cyan-400">{notification.entityName}</span>
              )}
              <span className="text-xs text-gray-500 block mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SivaContextProvider;
