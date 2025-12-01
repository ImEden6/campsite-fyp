import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { mockAdmin, mockDashboardMetrics, mockRevenueData } from '../utils/mock-data';

const server = setupServer(
  http.get('/api/analytics/dashboard', () => {
    return HttpResponse.json(mockDashboardMetrics);
  }),
  http.get('/api/analytics/revenue', () => {
    return HttpResponse.json(mockRevenueData);
  }),
  http.get('/api/analytics/occupancy', () => {
    return HttpResponse.json([
      { date: '2024-01', occupancy: 65 },
      { date: '2024-02', occupancy: 72 },
      { date: '2024-03', occupancy: 78 },
    ]);
  })
);

beforeEach(() => {
  server.listen();
  // Mock authenticated admin user
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
    JSON.stringify({ user: mockAdmin })
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Admin Dashboard Flow', () => {
  it('should display dashboard metrics', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      expect(screen.getByText(/75%/)).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument();
    });
  });

  it('should display revenue chart', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/revenue/i)).toBeInTheDocument();
      // Check for chart data points
      mockRevenueData.forEach((data) => {
        expect(screen.getByText(new RegExp(data.date))).toBeInTheDocument();
      });
    });
  });

  it('should filter dashboard by date range', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
    });

    // Open date range picker
    const dateRangeButton = screen.getByRole('button', { name: /date range/i });
    await user.click(dateRangeButton);

    // Select custom date range
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    await user.type(startDateInput, '2024-01-01');
    await user.type(endDateInput, '2024-03-31');

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
    });
  });

  it('should export report', async () => {
    const user = userEvent.setup();
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    server.use(
      http.get('/api/reports/export', () => {
        return new HttpResponse('mock-csv-data', {
          headers: {
            'Content-Type': 'text/csv',
          },
        });
      })
    );

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    // Select CSV format
    const csvOption = screen.getByRole('menuitem', { name: /csv/i });
    await user.click(csvOption);

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('should display occupancy trends', async () => {
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/occupancy/i)).toBeInTheDocument();
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });
});
