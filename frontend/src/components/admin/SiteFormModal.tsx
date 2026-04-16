import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createSite, updateSite } from '@/services/api/sites';
import { SiteType, SiteStatus, MeasurementUnit, type Site } from '@/types';


const siteFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    type: z.nativeEnum(SiteType),
    status: z.nativeEnum(SiteStatus).default(SiteStatus.AVAILABLE),
    basePrice: z.coerce.number().min(0, 'Price must be >= 0'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be >= 1'),
    description: z.string().optional(),
    amenities: z.array(z.string()).default([]),
    maxVehicles: z.coerce.number().int().min(0, 'Must be >= 0').default(1),
    maxTents: z.coerce.number().int().min(0, 'Must be >= 0').default(1),
    isPetFriendly: z.boolean().default(false),
    hasElectricity: z.boolean().default(false),
    hasWater: z.boolean().default(false),
    hasSewer: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;


interface SiteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSite: Site | null; // null = create mode
    defaultType?: SiteType | undefined;   // optional default for create mode
}


const COMMON_AMENITIES = [
    'Fire Pit',
    'Picnic Table',
    'Grill',
    'Shade Structure',
    'Level Ground',
    'Mountain View',
    'Lake View',
    'Privacy Screen',
];


const SiteFormModal: React.FC<SiteFormModalProps> = ({
    isOpen,
    onClose,
    editingSite,
    defaultType = SiteType.TENT,
}) => {
    const queryClient = useQueryClient();
    const [mutationError, setMutationError] = useState<string | null>(null);

    const isEditMode = editingSite !== null;

    // Form setup with react-hook-form + zod resolver
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SiteFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(siteFormSchema) as any,
        defaultValues: {
            name: '',
            type: defaultType,
            status: SiteStatus.AVAILABLE,
            basePrice: 0,
            capacity: 1,
            description: '',
            amenities: [],
            maxVehicles: 1,
            maxTents: 1,
            isPetFriendly: false,
            hasElectricity: false,
            hasWater: false,
            hasSewer: false,
            hasWifi: false,
        },
    });

    const selectedAmenities = watch('amenities') || [];

    // Reset form when editingSite changes
    useEffect(() => {
        if (isOpen) {
            setMutationError(null);
            if (editingSite) {
                // Edit mode: populate form with existing site data
                reset({
                    name: editingSite.name,
                    type: editingSite.type,
                    status: editingSite.status,
                    basePrice: editingSite.basePrice,
                    capacity: editingSite.capacity,
                    description: editingSite.description || '',
                    amenities: editingSite.amenities || [],
                    maxVehicles: editingSite.maxVehicles,
                    maxTents: editingSite.maxTents,
                    isPetFriendly: editingSite.isPetFriendly,
                    hasElectricity: editingSite.hasElectricity,
                    hasWater: editingSite.hasWater,
                    hasSewer: editingSite.hasSewer,
                    hasWifi: editingSite.hasWifi,
                });
            } else {
                // Create mode: reset to defaults
                reset({
                    name: '',
                    type: defaultType,
                    status: SiteStatus.AVAILABLE,
                    basePrice: 0,
                    capacity: 1,
                    description: '',
                    amenities: [],
                    maxVehicles: 1,
                    maxTents: 1,
                    isPetFriendly: false,
                    hasElectricity: false,
                    hasWater: false,
                    hasSewer: false,
                    hasWifi: false,
                });
            }
        }
    }, [isOpen, editingSite, defaultType, reset]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<Site>) => createSite(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            onClose();
        },
        onError: (error: Error) => {
            setMutationError(error.message || 'Failed to create site');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Site> }) => updateSite(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            onClose();
        },
        onError: (error: Error) => {
            setMutationError(error.message || 'Failed to update site');
        },
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    // Form submission handler
    const onSubmit = (formValues: SiteFormValues) => {
        const siteData: Partial<Site> = {
            name: formValues.name,
            type: formValues.type,
            status: formValues.status,
            basePrice: formValues.basePrice,
            capacity: formValues.capacity,
            description: formValues.description,
            amenities: formValues.amenities,
            maxVehicles: formValues.maxVehicles,
            maxTents: formValues.maxTents,
            isPetFriendly: formValues.isPetFriendly,
            hasElectricity: formValues.hasElectricity,
            hasWater: formValues.hasWater,
            hasSewer: formValues.hasSewer,
            hasWifi: formValues.hasWifi,
            images: editingSite?.images || [],
            size: editingSite?.size || { length: 30, width: 20, unit: MeasurementUnit.FEET },
            location: editingSite?.location || { latitude: 0, longitude: 0, mapPosition: { x: 0, y: 0 } },
        };

        if (isEditMode && editingSite) {
            updateMutation.mutate({ id: editingSite.id, data: siteData });
        } else {
            createMutation.mutate(siteData);
        }
    };

    // Amenity toggle handler
    const toggleAmenity = (amenity: string) => {
        const current = selectedAmenities;
        if (current.includes(amenity)) {
            setValue('amenities', current.filter((a) => a !== amenity), { shouldDirty: true });
        } else {
            setValue('amenities', [...current, amenity], { shouldDirty: true });
        }
    };

    // Modal footer
    const footer = (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
            >
                Cancel
            </Button>
            <Button
                type="submit"
                form="site-form"
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                ) : (
                    isEditMode ? 'Save Changes' : 'Create'
                )}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Site' : 'Add Site'}
            footer={footer}
            size="lg"
            closeOnBackdrop={!isPending}
        >
            <form id="site-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Error display */}
                {mutationError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                        <div className="text-red-600 dark:text-red-400 text-sm flex-1">{mutationError}</div>
                        <button
                            type="button"
                            onClick={() => setMutationError(null)}
                            className="text-red-400 hover:text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-secondary-300 border-b pb-2">
                        Basic Information
                    </h3>

                    <Input
                        label="Site Name"
                        placeholder="e.g., Lakeside Tent Site A1"
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                Site Type
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-night-surface px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                {...register('type')}
                            >
                                {Object.values(SiteType).map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                                Status
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-night-surface px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                {...register('status')}
                            >
                                {Object.values(SiteStatus).map((status) => (
                                    <option key={status} value={status}>
                                        {status.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Base Price (per night)"
                            type="number"
                            min="0"
                            step="0.01"
                            error={errors.basePrice?.message}
                            {...register('basePrice')}
                        />

                        <Input
                            label="Capacity (guests)"
                            type="number"
                            min="1"
                            error={errors.capacity?.message}
                            {...register('capacity')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 dark:border-secondary-600 bg-white dark:bg-night-surface px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Describe this site..."
                            {...register('description')}
                        />
                    </div>
                </div>

                {/* Limits */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-secondary-300 border-b pb-2">
                        Limits
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Max Vehicles"
                            type="number"
                            min="0"
                            error={errors.maxVehicles?.message}
                            {...register('maxVehicles')}
                        />

                        <Input
                            label="Max Tents"
                            type="number"
                            min="0"
                            error={errors.maxTents?.message}
                            {...register('maxTents')}
                        />
                    </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-secondary-300 border-b pb-2">
                        Features
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { key: 'isPetFriendly', label: 'Pet Friendly' },
                            { key: 'hasElectricity', label: 'Electricity' },
                            { key: 'hasWater', label: 'Water Hookup' },
                            { key: 'hasSewer', label: 'Sewer Hookup' },
                            { key: 'hasWifi', label: 'WiFi' },
                        ].map(({ key, label }) => (
                            <label
                                key={key}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    {...register(key as keyof SiteFormValues)}
                                />
                                <span className="text-sm text-gray-700 dark:text-secondary-300">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-secondary-300 border-b pb-2">
                        Amenities
                    </h3>

                    <div className="flex flex-wrap gap-2">
                        {COMMON_AMENITIES.map((amenity) => (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedAmenities.includes(amenity)
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-night-surface-alt dark:text-secondary-300 hover:bg-gray-200 dark:hover:bg-night-surface-alt'
                                    }`}
                            >
                                {amenity}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default SiteFormModal;