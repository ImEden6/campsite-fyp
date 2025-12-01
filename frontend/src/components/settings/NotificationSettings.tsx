import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';

const notificationSettingsSchema = z.object({
    emailNotifications: z.boolean(),
    marketingEmails: z.boolean(),
    pushNotifications: z.boolean(),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

const NotificationSettings: React.FC = () => {
    const { showToast } = useUIStore();
    const [isSaving, setIsSaving] = useState(false);

    const {
        handleSubmit,
        setValue,
        watch,
        formState: { isDirty },
    } = useForm<NotificationSettingsFormValues>({
        resolver: zodResolver(notificationSettingsSchema),
        defaultValues: {
            emailNotifications: true,
            marketingEmails: false,
            pushNotifications: false,
        },
    });

    const values = watch();

    const onSubmit = async (data: NotificationSettingsFormValues) => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Saved Notification Settings:', data);
        showToast('Notification settings saved successfully', 'success');
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                </CardHeader>
                <CardBody className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Booking Alerts</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive emails when new bookings are made
                            </p>
                        </div>
                        <Switch
                            checked={values.emailNotifications}
                            onChange={(checked) => setValue('emailNotifications', checked, { shouldDirty: true })}
                        />
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Marketing Updates</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive news and product updates
                            </p>
                        </div>
                        <Switch
                            checked={values.marketingEmails}
                            onChange={(checked) => setValue('marketingEmails', checked, { shouldDirty: true })}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Browser Notifications</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Receive real-time alerts in your browser
                            </p>
                        </div>
                        <Switch
                            checked={values.pushNotifications}
                            onChange={(checked) => setValue('pushNotifications', checked, { shouldDirty: true })}
                        />
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
    );
};

export default NotificationSettings;
