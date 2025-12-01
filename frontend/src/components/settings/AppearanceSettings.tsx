import React from 'react';
import { Sun, Moon, Smartphone } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useUIStore } from '@/stores/uiStore';
import { Theme } from '@/types';

const AppearanceSettings: React.FC = () => {
    const { theme, setTheme } = useUIStore();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => setTheme(Theme.LIGHT)}
                            className={`
                relative flex flex-col items-center p-4 rounded-xl border-2 transition-all
                ${theme === Theme.LIGHT
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
              `}
                        >
                            <div className="p-3 rounded-full bg-white shadow-sm mb-3">
                                <Sun className="w-6 h-6 text-yellow-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Light Mode</span>
                        </button>

                        <button
                            onClick={() => setTheme(Theme.DARK)}
                            className={`
                relative flex flex-col items-center p-4 rounded-xl border-2 transition-all
                ${theme === Theme.DARK
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
              `}
                        >
                            <div className="p-3 rounded-full bg-gray-900 shadow-sm mb-3">
                                <Moon className="w-6 h-6 text-primary-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
                        </button>

                        <button
                            disabled
                            className="relative flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        >
                            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm mb-3">
                                <Smartphone className="w-6 h-6 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">System (Coming Soon)</span>
                        </button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default AppearanceSettings;
