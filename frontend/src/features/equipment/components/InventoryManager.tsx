/**
 * InventoryManager Component
 * Admin interface for managing equipment inventory
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  type CreateEquipmentRequest,
  type UpdateEquipmentRequest,
} from '@/services/api/equipment';
import { queryKeys } from '@/config/query-keys';
import type { Equipment, EquipmentCategory, EquipmentStatus, EquipmentFilters } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface InventoryManagerProps {
  onSelectEquipment?: (equipment: Equipment) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  onSelectEquipment,
}) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Fetch equipment
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.equipment.list({ ...filters, search: searchTerm }),
    queryFn: () => getEquipment({ ...filters, search: searchTerm }, page, 20),
  });

  const handleFilterChange = (key: keyof EquipmentFilters, value: string | number | boolean | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEquipment(null);
  };

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RENTED':
        return 'warning';
      case 'MAINTENANCE':
        return 'info';
      case 'OUT_OF_SERVICE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getLowStockWarning = (equipment: Equipment) => {
    const threshold = Math.ceil(equipment.quantity * 0.2); // 20% threshold
    return equipment.availableQuantity <= threshold;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <Button variant="primary" onClick={handleAddNew}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            value={
              Array.isArray(filters.category)
                ? filters.category[0] || ''
                : filters.category || ''
            }
            onChange={(value) =>
              handleFilterChange('category', value || '')
            }
            options={[
              { value: '', label: 'All Categories' },
              { value: 'CAMPING_GEAR', label: 'Camping Gear' },
              { value: 'RECREATIONAL', label: 'Recreational' },
              { value: 'KITCHEN', label: 'Kitchen' },
              { value: 'SAFETY', label: 'Safety' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
            ]}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load equipment inventory.</p>
        </div>
      )}

      {/* Equipment Table */}
      {!isLoading && !error && data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((equipment) => (
                  <tr
                    key={equipment.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectEquipment?.(equipment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          {equipment.images && equipment.images.length > 0 ? (
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={equipment.images[0]}
                              alt={equipment.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {equipment.name}
                          </div>
                          {equipment.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {equipment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {equipment.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(equipment.status)}>
                        {equipment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {equipment.availableQuantity} / {equipment.quantity}
                        </span>
                        {getLowStockWarning(equipment) && (
                          <Badge variant="warning">Low</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(equipment.dailyRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(equipment);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * data.pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * data.pagination.limit, data.pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{data.pagination.total}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipment Form Modal */}
      {isFormOpen && (
        <EquipmentFormModal
          equipment={editingEquipment}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
            handleCloseForm();
          }}
        />
      )}
    </div>
  );
};

// Equipment Form Modal Component
interface EquipmentFormModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    name: equipment?.name || '',
    description: equipment?.description || '',
    category: (equipment?.category || 'CAMPING_GEAR') as EquipmentCategory,
    quantity: equipment?.quantity || 1,
    dailyRate: equipment?.dailyRate || 0,
    weeklyRate: equipment?.weeklyRate || 0,
    monthlyRate: equipment?.monthlyRate || 0,
    deposit: equipment?.deposit || 0,
  });

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      showToast('Equipment created successfully', 'success');
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create equipment', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEquipmentRequest) =>
      updateEquipment(equipment!.id, data),
    onSuccess: () => {
      showToast('Equipment updated successfully', 'success');
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
      onSuccess();
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete equipment', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (equipment) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteMutation.mutate();
    }
  };

  const handleChange = (field: keyof CreateEquipmentRequest, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment ? 'Edit Equipment' : 'Add Equipment'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <Select
              value={formData.category}
              onChange={(value) => handleChange('category', value)}
              options={[
                { value: 'CAMPING_GEAR', label: 'Camping Gear' },
                { value: 'RECREATIONAL', label: 'Recreational' },
                { value: 'KITCHEN', label: 'Kitchen' },
                { value: 'SAFETY', label: 'Safety' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <Input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate *
            </label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={formData.dailyRate}
              onChange={(e) => handleChange('dailyRate', parseFloat(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Rate *
            </label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={formData.weeklyRate}
              onChange={(e) => handleChange('weeklyRate', parseFloat(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rate *
            </label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={formData.monthlyRate}
              onChange={(e) => handleChange('monthlyRate', parseFloat(e.target.value))}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Deposit *
          </label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={formData.deposit}
            onChange={(e) => handleChange('deposit', parseFloat(e.target.value))}
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending || updateMutation.isPending
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
