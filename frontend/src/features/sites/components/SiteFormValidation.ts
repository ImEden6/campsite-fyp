import type { SiteFormData } from './SiteForm';

export function validateSiteForm(data: SiteFormData): Partial<Record<keyof SiteFormData, string>> {
  const errors: Partial<Record<keyof SiteFormData, string>> = {};

  if (!data.name.trim()) {
    errors.name = 'Site name is required';
  }

  if (data.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1';
  }

  if (data.basePrice < 0) {
    errors.basePrice = 'Price cannot be negative';
  }

  if (data.maxVehicles < 0) {
    errors.maxVehicles = 'Max vehicles cannot be negative';
  }

  if (data.maxTents < 0) {
    errors.maxTents = 'Max tents cannot be negative';
  }

  if (data.size.length <= 0 || data.size.width <= 0) {
    errors.size = 'Site dimensions must be greater than 0';
  }

  return errors;
}
