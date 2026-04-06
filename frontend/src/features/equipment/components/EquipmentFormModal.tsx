import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EquipmentCategory } from '@campsite-management/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEquipment, updateEquipment, deleteEquipment } from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment, CreateEquipmentRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { CATEGORY_OPTIONS } from '../utils/equipmentConstants';

const equipmentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  category: z.nativeEnum(EquipmentCategory),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  dailyRate: z.number().min(0, 'Daily rate cannot be negative'),
  weeklyRate: z.number().min(0, 'Weekly rate cannot be negative'),
  monthlyRate: z.number().min(0, 'Monthly rate cannot be negative'),
  deposit: z.number().min(0, 'Deposit cannot be negative'),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: EquipmentCategory.CAMPING_GEAR,
      quantity: 1,
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      deposit: 0,
    },
  });

  useEffect(() => {
    if (equipment) {
      reset({
        name: equipment.name,
        description: equipment.description || '',
        category: equipment.category as EquipmentCategory,
        quantity: equipment.quantity,
        dailyRate: equipment.dailyRate,
        weeklyRate: equipment.weeklyRate,
        monthlyRate: equipment.monthlyRate,
        deposit: equipment.deposit,
      });
    } else {
      reset({
        name: '',
        description: '',
        category: EquipmentCategory.CAMPING_GEAR,
        quantity: 1,
        dailyRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        deposit: 0,
      });
    }
  }, [equipment, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEquipmentRequest) => createEquipment(data),
    onSuccess: () => {
      showToast('Equipment created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create equipment', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateEquipmentRequest) => updateEquipment(equipment!.id, data),
    onSuccess: () => {
      showToast('Equipment updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update equipment', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipment(equipment!.id),
    onSuccess: () => {
      showToast('Equipment deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete equipment', 'error');
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    if (equipment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment ? 'Edit Equipment' : 'Add Equipment'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <Input
            type="text"
            {...register('name')}
            error={errors.name?.message}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <Select
              value={watch('category')}
              onChange={(value) => setValue('category', value as EquipmentCategory)}
              options={CATEGORY_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <Input
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              min={1}
              error={errors.quantity?.message}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate *</label>
            <Input
              type="number"
              {...register('dailyRate', { valueAsNumber: true })}
              min={0}
              step={0.01}
              error={errors.dailyRate?.message}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Rate *</label>
            <Input
              type="number"
              {...register('weeklyRate', { valueAsNumber: true })}
              min={0}
              step={0.01}
              error={errors.weeklyRate?.message}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate *</label>
            <Input
              type="number"
              {...register('monthlyRate', { valueAsNumber: true })}
              min={0}
              step={0.01}
              error={errors.monthlyRate?.message}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit *</label>
          <Input
            type="number"
            {...register('deposit', { valueAsNumber: true })}
            min={0}
            step={0.01}
            error={errors.deposit?.message}
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : equipment
                ? 'Update'
                : 'Create'}
          </Button>
          {equipment && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
