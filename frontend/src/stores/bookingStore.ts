/**
 * Booking Store
 * Manages booking filters and selected booking state
 */

import { create } from 'zustand';
import { Booking, BookingFilters, BookingStatus } from '@/types';

interface BookingState {
  selectedBooking: Booking | null;
  filters: BookingFilters;
}

interface BookingActions {
  setSelectedBooking: (booking: Booking | null) => void;
  setFilters: (filters: BookingFilters) => void;
  updateFilters: (filters: Partial<BookingFilters>) => void;
  clearFilters: () => void;
  setStatusFilter: (status: BookingStatus[]) => void;
  setDateRangeFilter: (start: Date, end: Date) => void;
  setSiteTypeFilter: (siteType: string[]) => void;
  setSearchTerm: (searchTerm: string) => void;
}

type BookingStore = BookingState & BookingActions;

const initialFilters: BookingFilters = {
  status: undefined,
  dateRange: undefined,
  siteType: undefined,
  searchTerm: undefined,
};

export const useBookingStore = create<BookingStore>((set) => ({
  // Initial state
  selectedBooking: null,
  filters: initialFilters,

  // Set selected booking
  setSelectedBooking: (booking: Booking | null) => {
    set({ selectedBooking: booking });
  },

  // Set all filters at once
  setFilters: (filters: BookingFilters) => {
    set({ filters });
  },

  // Update filters partially
  updateFilters: (filters: Partial<BookingFilters>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    }));
  },

  // Clear all filters
  clearFilters: () => {
    set({ filters: initialFilters });
  },

  // Set status filter
  setStatusFilter: (status: BookingStatus[]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        status: status.length > 0 ? status : undefined,
      },
    }));
  },

  // Set date range filter
  setDateRangeFilter: (start: Date, end: Date) => {
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: { startDate: start.toISOString().split('T')[0]!, endDate: end.toISOString().split('T')[0]! },
      },
    }));
  },

  // Set site type filter
  setSiteTypeFilter: (siteType: string[]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        siteType: siteType.length > 0 ? siteType : undefined,
      },
    }));
  },

  // Set search term
  setSearchTerm: (searchTerm: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        searchTerm: searchTerm.trim() || undefined,
      },
    }));
  },
}));
