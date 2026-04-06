import { EquipmentCategory, EquipmentStatus } from '@campsite-management/shared';

export const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: EquipmentCategory.CAMPING_GEAR, label: 'Camping Gear' },
  { value: EquipmentCategory.RECREATIONAL, label: 'Recreational' },
  { value: EquipmentCategory.KITCHEN, label: 'Kitchen' },
  { value: EquipmentCategory.SAFETY, label: 'Safety' },
  { value: EquipmentCategory.MAINTENANCE, label: 'Maintenance' },
] as const;

export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: EquipmentStatus.AVAILABLE, label: 'Available' },
  { value: EquipmentStatus.RENTED, label: 'Rented' },
  { value: EquipmentStatus.MAINTENANCE, label: 'Maintenance' },
  { value: EquipmentStatus.OUT_OF_SERVICE, label: 'Out of Service' },
] as const;

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  [EquipmentCategory.CAMPING_GEAR]: 'Camping Gear',
  [EquipmentCategory.RECREATIONAL]: 'Recreational',
  [EquipmentCategory.KITCHEN]: 'Kitchen',
  [EquipmentCategory.SAFETY]: 'Safety',
  [EquipmentCategory.MAINTENANCE]: 'Maintenance',
};

export const STATUS_BADGE_COLORS: Record<EquipmentStatus, string> = {
  [EquipmentStatus.AVAILABLE]: 'success',
  [EquipmentStatus.RENTED]: 'warning',
  [EquipmentStatus.MAINTENANCE]: 'info',
  [EquipmentStatus.OUT_OF_SERVICE]: 'error',
};
