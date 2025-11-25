'use client';

/**
 * Settings Page - S15
 *
 * Main settings hub with navigation to sub-sections.
 */

import Link from 'next/link';
import { useLocaleStore } from '@/lib/stores/locale-store';
import {
  User,
  Users,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Palette,
  Key,
  ChevronRight,
} from 'lucide-react';

const settingsSections = [
  {
    id: 'profile',
    label: 'Profile',
    labelAr: 'الملف الشخصي',
    description: 'Update your personal information',
    descriptionAr: 'تحديث معلوماتك الشخصية',
    icon: <User size={20} />,
    href: '/dashboard/settings/profile',
  },
  {
    id: 'team',
    label: 'Team',
    labelAr: 'الفريق',
    description: 'Manage team members and permissions',
    descriptionAr: 'إدارة أعضاء الفريق والصلاحيات',
    icon: <Users size={20} />,
    href: '/dashboard/settings/team',
  },
  {
    id: 'billing',
    label: 'Billing',
    labelAr: 'الفوترة',
    description: 'Manage subscription and payment methods',
    descriptionAr: 'إدارة الاشتراك وطرق الدفع',
    icon: <CreditCard size={20} />,
    href: '/dashboard/settings/billing',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    labelAr: 'الإشعارات',
    description: 'Configure email and push notifications',
    descriptionAr: 'تكوين إشعارات البريد الإلكتروني والدفع',
    icon: <Bell size={20} />,
    href: '/dashboard/settings/notifications',
  },
  {
    id: 'security',
    label: 'Security',
    labelAr: 'الأمان',
    description: 'Password, 2FA, and security settings',
    descriptionAr: 'كلمة المرور والتحقق بخطوتين وإعدادات الأمان',
    icon: <Shield size={20} />,
    href: '/dashboard/settings/security',
  },
  {
    id: 'language',
    label: 'Language & Region',
    labelAr: 'اللغة والمنطقة',
    description: 'Language, timezone, and regional settings',
    descriptionAr: 'إعدادات اللغة والمنطقة الزمنية',
    icon: <Globe size={20} />,
    href: '/dashboard/settings/language',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    labelAr: 'المظهر',
    description: 'Theme, colors, and display preferences',
    descriptionAr: 'السمة والألوان وتفضيلات العرض',
    icon: <Palette size={20} />,
    href: '/dashboard/settings/appearance',
  },
  {
    id: 'api',
    label: 'API Keys',
    labelAr: 'مفاتيح API',
    description: 'Manage API keys and integrations',
    descriptionAr: 'إدارة مفاتيح API والتكاملات',
    icon: <Key size={20} />,
    href: '/dashboard/settings/api',
  },
];

export default function SettingsPage() {
  const { locale } = useLocaleStore();
  const isRTL = locale === 'ar';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRTL
            ? 'إدارة حسابك وتفضيلاتك'
            : 'Manage your account and preferences'}
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">
                {isRTL ? section.labelAr : section.label}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {isRTL ? section.descriptionAr : section.description}
              </p>
            </div>
            <ChevronRight
              size={20}
              className="text-gray-300 group-hover:text-blue-500 transition-colors"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
