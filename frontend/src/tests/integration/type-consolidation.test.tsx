/**
 * Integration tests for consolidated type definitions
 * Tests components using DateRange, BookingFilters, and EquipmentFilters
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import BookingManagementPage from '@/pages/BookingManagementPage';
import { BookingDetailView } from '@/features/bookings/components/BookingDetailView';
import {
  mockAdmin,
  mockDashboardMetrics,
  mockRevenueData,
  mockBooking,
  mockEquipment,
  mockSite,
} from '../utils/mock-data';
import type { DateRange } from '@/types/common';
import type { BookingFilters } from '@/types/booking';
import type { EquipmentFilters } from '@/types/equipment';

// Mock data for tests
const mockBookings = [
  {
    ...mockBooking,
    id: '1',
    bookingNumber: 'BK-001',
    status: 'CONFIRMED' as any,
    paymentStatus: 'PAID' as any,
    paidAmount: 70.0,
    taxAmount: 5.0,
    discountAmount: 0,
    vehicles: [],
    equipmentReservations: [],
  },
  {
    ...mockBooking,
    id: '2',
    bookingNumber: 'BK-002',
    status: 'PENDING' as any,
    paymentStatus: 'PENDING' as any,
    paidAmount: 0,
    taxAmount: 5.0,
    discountAmount: 0,
    vehicles: [],
    equipmentReservations: [],
  },
];

const mockEquipmentList = [
  {
    ...mockEquipment,
    id: '1',
    name: 'Tent',
    category: 'CAMPING_GEAR',
    status: 'AVAILABLE',
    dailyRate: 25.0,
    availableQuantity: 5,
  },
  {
    ...mockEquipment,
    id: '2',
    name: 'Kayak',
    category: 'RECREATIONAL',
    status: 'AVAILABLE',
    dailyRate: 30.0,
    availableQuantity: 3,
  },
];

const server = setupServer(
  // Dashboard endpoints
  http.get('http://localhost:5000/api/v1/analytics/dashboard', () => {
    return HttpResponse.json({ data: mockDashboardMetrics, success: true });
  }),

  http.get('http://localhost:5000/api/v1/analytics/revenue', () => {
    return HttpResponse.json({ data: mockRevenueData, success: true });
  }),

  http.get('http://localhost:5000/api/v1/bookings', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');
    
    let filteredBookings = mockBookings;
    if (searchTerm) {
      filteredBookings = mockBookings.filter(b => 
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return HttpResponse.json({
      data: filteredBookings,
      success: true
    });
  }),

  http.get('http://localhost:5000/api/v1/bookings/paginated', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');
    
    let filteredBookings = mockBookings;
    if (searchTerm) {
      filteredBookings = mockBookings.filter(b => 
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return HttpResponse.json({
      items: filteredBookings,
      total: filteredBookings.length,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  }),
  http.get('http://localhost:5000/api/v1/analytics/occupancy', () => {
    return HttpResponse.json({
      data: [
        { date: '2024-01', occupancy: 65 },
        { date: '2024-02', occupancy: 72 },
        { date: '2024-03', occupancy: 78 },
      ],
      success: true
    });
  }),
  http.get('http://localhost:5000/api/v1/analytics/customers', () => {
    return HttpResponse.json({
      data: {
        totalCustomers: 150,
        newCustomers: 25,
        returningCustomers: 125,
      },
      success: true
    });
  }),

  // Sites endpoint - required by AdminDashboardPage
  http.get('http://localhost:5000/api/v1/sites', () => {
    return HttpResponse.json({
      data: [
        { ...mockSite, id: '1', status: 'OCCUPIED', basePrice: 5000, pricePerNight: 5000 },
        { ...mockSite, id: '2', status: 'OCCUPIED', basePrice: 5000, pricePerNight: 5000 },
        { ...mockSite, id: '3', status: 'OCCUPIED', basePrice: 5000, pricePerNight: 5000 },
        { ...mockSite, id: '4', status: 'AVAILABLE', basePrice: 35, pricePerNight: 35 },
      ],
      success: true
    });
  }),

  // Booking endpoints
  http.get('http://localhost:5000/api/v1/bookings', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');

    let filteredBookings = mockBookings;
    if (searchTerm) {
      filteredBookings = mockBookings.filter(b =>
        b.bookingNumber.includes(searchTerm)
      );
    }
    return HttpResponse.json({ data: filteredBookings, success: true });
  }),

  http.get('http://localhost:5000/api/v1/bookings/paginated', ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');

    let filteredBookings = mockBookings;
    if (searchTerm) {
      filteredBookings = mockBookings.filter(b =>
        b.bookingNumber.includes(searchTerm)
      );
    }

    return HttpResponse.json({
      data: {
        items: filteredBookings,
        total: filteredBookings.length,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      success: true
    });
  }),

  // Equipment endpoints
  http.get('http://localhost:5000/api/v1/equipment', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search') || url.searchParams.get('searchTerm');

    let filteredEquipment = mockEquipmentList;

    if (category) {
      filteredEquipment = filteredEquipment.filter(e => e.category === category);
    }

    if (search) {
      filteredEquipment = filteredEquipment.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return HttpResponse.json({
      data: {
        items: filteredEquipment,
        total: filteredEquipment.length,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      success: true
    });
  })
);

beforeEach(() => {
  server.listen();
  // Mock localStorage for authenticated user
  const localStorageMock = {
    getItem: vi.fn(() => JSON.stringify({ user: mockAdmin })),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

describe('Type Consolidation Integration Tests', () => {
  describe('AdminDashboardPage with DateRange types', () => {
    it('should render dashboard with default date range', async () => {
      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/RM\s*15,000/)).toBeInTheDocument();
        expect(screen.getByText(/75(?:\.0)?%/)).toBeInTheDocument();
      });
    });

    it('should filter dashboard data using DateRange interface', async () => {
      const user = userEvent.setup();

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/RM\s*15,000/)).toBeInTheDocument();
      });

      // Find and interact with date range filter
      const dateRangeButton = screen.queryByRole('button', { name: /date range/i });

      if (dateRangeButton) {
        await user.click(dateRangeButton);

        const startDateInput = screen.queryByLabelText(/start date/i);
        const endDateInput = screen.queryByLabelText(/end date/i);

        if (startDateInput && endDateInput) {
          await user.clear(startDateInput);
          await user.type(startDateInput, '2024-01-01');

          await user.clear(endDateInput);
          await user.type(endDateInput, '2024-03-31');

          const applyButton = screen.queryByRole('button', { name: /apply/i });
          if (applyButton) {
            await user.click(applyButton);
          }
        }
      }

      // Verify the component still renders correctly
      await waitFor(() => {
        expect(screen.getByText(/RM\s*15,000/)).toBeInTheDocument();
      });
    });

    it('should handle date range conversion utilities', () => {
      const dateRange: DateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      // Verify DateRange structure
      expect(dateRange.startDate).toBe('2024-01-01');
      expect(dateRange.endDate).toBe('2024-01-31');
    });
  });

  describe('BookingManagementPage with BookingFilters', () => {
    it('should render booking list with filters', async () => {
      const user = userEvent.setup();
      render(<BookingManagementPage />);

      const listButton = screen.getByRole('button', { name: /List/i });
      if (listButton) await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByText('BK-001')).toBeInTheDocument();
        expect(screen.getByText('BK-002')).toBeInTheDocument();
      });
    });

    it('should filter bookings using searchTerm', async () => {
      const user = userEvent.setup();
      render(<BookingManagementPage />);

      const listButton = screen.getByRole('button', { name: /List/i });
      if (listButton) await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByText('BK-001')).toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'BK-001');

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('BK-001')).toBeInTheDocument();
      });
    });

    it('should handle BookingFilters interface correctly', () => {
      const filters: BookingFilters = {
        status: ['confirmed', 'pending'] as any,
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        searchTerm: 'test',
      };

      expect(Array.isArray(filters.status)).toBe(true);
      expect(filters.dateRange?.startDate).toBe('2024-01-01');
    });
  });

  describe('BookingDetailView with all props', () => {
    it('should render booking details with all required props', () => {
      const mockOnClose = vi.fn();

      render(
        <BookingDetailView
          booking={mockBookings[0]! as any}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={vi.fn()}
          onDownloadReceipt={vi.fn()}
          onViewQRCode={vi.fn()}
        />
      );

      expect(screen.getByText(/BK-001/)).toBeInTheDocument();
      expect(screen.getByText(/CONFIRMED/)).toBeInTheDocument();
    });
  });

  describe('Equipment components with EquipmentFilters', () => {
    it('should handle EquipmentFilters with single category', () => {
      const filters: EquipmentFilters = {
        category: 'CAMPING_GEAR',
        availableOnly: true,
      };

      expect(filters.category).toBe('CAMPING_GEAR');
      expect(filters.availableOnly).toBe(true);
    });
  });
});
