import { useQuery } from '@tanstack/react-query';
import { getMyBookings, getUpcomingBookings, getBookingHistory } from '@/services/api/bookings';
import { queryKeys } from '@/config/query-keys';
import type { BookingFilters } from '@/types';

export const useCustomerBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: [...queryKeys.bookings.myBookings(), filters],
    queryFn: () => getMyBookings(filters),
  });
};

export const useUpcomingBookings = () => {
  return useQuery({
    queryKey: queryKeys.bookings.upcoming(),
    queryFn: () => getUpcomingBookings(),
  });
};

export const useBookingHistory = () => {
  return useQuery({
    queryKey: queryKeys.bookings.history(),
    queryFn: () => getBookingHistory(),
  });
};

