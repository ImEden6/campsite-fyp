import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Switch } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';

const generalSettingsSchema = z.object({
    siteName: z.string().min(1, 'Site name is required').max(50, 'Site name must be less than 50 characters'),
    supportEmail: z.string().email('Invalid email address'),
    maintenanceMode: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

const GeneralSettings: React.FC = () => {
    const { showToast } = useUIStore();
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        watch,
    } = useForm<GeneralSettingsFormValues>({
        resolver: zodResolver(generalSettingsSchema),
        defaultValues: {
            siteName: 'Campsite Manager',
            supportEmail: 'support@example.com',
            maintenanceMode: false,
        },
    });

    const maintenanceMode = watch('maintenanceMode');

    const onSubmit = async (data: GeneralSettingsFormValues) => {
        setIsSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Saved General Settings:', data);
        showToast('General settings saved successfully', 'success');
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardBody className="space-y-6">
                    <Input
                        label="Site Name"
                        placeholder="Enter site name"
                        error={errors.siteName?.message}
                        {...register('siteName')}
                    />
                    <Input
                        label="Support Email"
                        type="email"
                        placeholder="Enter support email"
                        error={errors.supportEmail?.message}
                        {...register('supportEmail')}
                    />
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Maintenance</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Maintenance Mode</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Disable access to the public site while you make changes
                            </p>
                        </div>
                        <Switch
                            checked={maintenanceMode}
                            onChange={(checked) => setValue('maintenanceMode', checked, { shouldDirty: true })}
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

export default GeneralSettings;
