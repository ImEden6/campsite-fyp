import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, Database, AlertTriangle } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/stores/uiStore';

const systemSettingsSchema = z.object({
    autoBackup: z.boolean(),
});

type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;

const SystemSettings: React.FC = () => {
    const { showToast } = useUIStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);

    const {
        handleSubmit,
        setValue,
        watch,
        formState: { isDirty },
    } = useForm<SystemSettingsFormValues>({
        resolver: zodResolver(systemSettingsSchema),
        defaultValues: {
            autoBackup: true,
        },
    });

    const autoBackup = watch('autoBackup');

    const onSubmit = async (data: SystemSettingsFormValues) => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Saved System Settings:', data);
        showToast('System settings saved successfully', 'success');
        setIsSaving(false);
    };

    const handleClearCache = async () => {
        setIsClearingCache(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showToast('System cache cleared successfully', 'success');
        setIsClearingCache(false);
        setIsClearCacheModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Version</div>
                            <div className="font-mono text-lg font-medium text-gray-900 dark:text-gray-100">v1.0.0-beta</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Environment</div>
                            <div className="font-mono text-lg font-medium text-gray-900 dark:text-gray-100">Production</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Database Status</div>
                            <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                Connected
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Last Backup</div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">2 hours ago</div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                    </CardHeader>
                    <CardBody className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Automatic Backups</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Backup database every 24 hours
                                </p>
                            </div>
                            <Switch
                                checked={autoBackup}
                                onChange={(checked) => setValue('autoBackup', checked, { shouldDirty: true })}
                            />
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsClearCacheModalOpen(true)}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Database className="w-4 h-4 mr-2" />
                                Clear System Cache
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={!isDirty || isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <Modal
                isOpen={isClearCacheModalOpen}
                onClose={() => !isClearingCache && setIsClearCacheModalOpen(false)}
                title="Clear System Cache"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setIsClearCacheModalOpen(false)}
                            disabled={isClearingCache}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleClearCache}
                            loading={isClearingCache}
                        >
                            Clear Cache
                        </Button>
                    </>
                }
            >
                <div className="flex items-start space-x-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to clear the system cache? This action may temporarily affect system performance while the cache is rebuilt. This action cannot be undone.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SystemSettings;
