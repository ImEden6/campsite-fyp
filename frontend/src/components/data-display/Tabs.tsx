import React, { useState, useEffect, Suspense } from 'react';
import { cn } from '@/utils/cn';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode | (() => Promise<{ default: React.ComponentType }>);
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  lazyLoad?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  lazyLoad = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    new Set([defaultTab || tabs[0]?.id].filter((id): id is string => id != null))
  );

  useEffect(() => {
    if (activeTab && !loadedTabs.has(activeTab)) {
      setLoadedTabs((prev) => new Set([...Array.from(prev), activeTab]));
    }
  }, [activeTab, loadedTabs]);

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
      onChange?.(tabId);
    }
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const renderTabButton = (tab: Tab) => {
    const isActive = activeTab === tab.id;

    const baseStyles = 'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    const variantStyles = {
      default: cn(
        'border-b-2',
        isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
        tab.disabled && 'cursor-not-allowed opacity-50'
      ),
      pills: cn(
        'rounded-md',
        isActive ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
        tab.disabled && 'cursor-not-allowed opacity-50'
      ),
      underline: cn(
        'border-b-2',
        isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
        tab.disabled && 'cursor-not-allowed opacity-50'
      ),
    };

    return (
      <button
        key={tab.id}
        onClick={() => handleTabChange(tab.id)}
        disabled={tab.disabled}
        className={cn(baseStyles, variantStyles[variant])}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${tab.id}`}
        id={`tab-${tab.id}`}
      >
        {tab.icon && <span>{tab.icon}</span>}
        <span>{tab.label}</span>
      </button>
    );
  };

  const renderTabContent = () => {
    if (!activeTabData) return null;

    const shouldRender = !lazyLoad || loadedTabs.has(activeTab);
    if (!shouldRender) return null;

    const content = activeTabData.content;

    // Check if content is a lazy-loaded component
    if (typeof content === 'function') {
      const LazyComponent = React.lazy(content as () => Promise<{ default: React.ComponentType }>);
      return (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="h-8 w-8 animate-spin text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            </div>
          }
        >
          <LazyComponent />
        </Suspense>
      );
    }

    return content;
  };

  const containerStyles = {
    default: 'border-b border-gray-200',
    pills: 'gap-2',
    underline: 'border-b border-gray-200',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn('flex', containerStyles[variant])}
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map(renderTabButton)}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4"
      >
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Tabs;
