/**
 * SettingsPage
 * Application settings and configuration
 */

import React, { useState } from 'react';
import {
  Settings,
  Monitor,
  Bell,
  Server
} from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import { GlassCard } from '@/components/ui/GlassCard';

import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'system';

interface TabDefinition {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const user = useAuthStore((state) => state.user);

  const tabs: TabDefinition[] = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Monitor,
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
    },
    {
      id: 'system',
      label: 'System',
      icon: Server,
      roles: [UserRole.ADMIN]
    },
  ];

  const filteredTabs = tabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Manage your application preferences and system configurations
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <GlassCard className="w-full lg:w-64 flex-shrink-0 p-4" intensity="medium">
            <nav className="space-y-1">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`
                      w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </GlassCard>

          {/* Content Area */}
          <div className="flex-1">
            <div className={activeTab === 'general' ? 'block' : 'hidden'}>
              <GeneralSettings />
            </div>
            <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
              <AppearanceSettings />
            </div>
            <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
              <NotificationSettings />
            </div>
            {user?.role === UserRole.ADMIN && (
              <div className={activeTab === 'system' ? 'block' : 'hidden'}>
                <SystemSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
