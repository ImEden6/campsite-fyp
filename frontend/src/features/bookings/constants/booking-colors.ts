import { BookingStatus } from '@/types';

export const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  [BookingStatus.CHECKED_IN]: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  [BookingStatus.CHECKED_OUT]: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-night-surface-alt/50 dark:text-secondary-200 dark:border-secondary-600',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
  [BookingStatus.NO_SHOW]: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
};
