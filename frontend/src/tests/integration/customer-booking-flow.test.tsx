import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import CustomerBookingPage from '@/pages/CustomerBookingPage';
import { mockSite } from '@/tests/utils/mock-data';
import { BookingFlowDriver } from '../utils/booking-flow-driver';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';

const server = setupServer(
    http.get('*/api/v1/sites/:id', ({ params }) => {
        const site = params.id === mockSite.id ? mockSite : { ...mockSite, id: params.id as string };
        return HttpResponse.json({ data: site });
    }),

    http.post('*/api/v1/bookings', async ({ request }) => {
        const body = await request.json() as { specialRequests?: string };
        if (body.specialRequests === 'TRIGGER_ERROR') {
            return HttpResponse.json({ message: 'Simulated API Error' }, { status: 500 });
        }
        return HttpResponse.json({
            data: { id: 'customer-booking-id', bookingNumber: 'BK-CUST-456', totalAmount: 100 }
        });
    }),

    http.post('*/api/v1/bookings/price', () => {
        return HttpResponse.json({
            data: { totalAmount: 100, depositAmount: 50, days: 3 },
            success: true
        });
    }),

    http.get('*/api/v1/equipment/available', () => {
        return HttpResponse.json({
            data: [{
                id: 'eq-1',
                name: 'Family Tent',
                description: 'Large 4-person tent',
                category: 'CAMPING_GEAR',
                dailyRate: 25,
                quantity: 5,
                available: true,
                images: []
            }],
            success: true
        });
    })
);

function resetStores() {
    useAuthStore.setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
    });
    useBookingStore.getState().clearFilters();
    useBookingStore.getState().setSelectedBooking(null);
}

function setTestAuth() {
    localStorage.setItem('campsite_auth_token', 'fake-token');
    localStorage.setItem('campsite_user', JSON.stringify({ id: 'user-1', role: 'CUSTOMER', firstName: 'John', lastName: 'Doe' }));
    useAuthStore.setState({
        user: { id: 'user-1', role: 'CUSTOMER', firstName: 'John', lastName: 'Doe' } as any,
        tokens: { accessToken: 'fake-token', refreshToken: 'fake-refresh', expiresIn: 3600 },
        isAuthenticated: true,
        isLoading: false,
        error: null,
    });
}

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
});

beforeEach(() => {
    localStorage.clear();
    resetStores();
    window.scrollTo = vi.fn();
    setTestAuth();
});

afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
    localStorage.clear();
    resetStores();
});

afterAll(() => {
    server.close();
});

describe('Customer Booking Flow', () => {
    const siteId = 'site-1';

    const renderPage = () => {
        window.history.pushState({}, 'Customer Booking', `/customer/book?siteId=${siteId}`);
        render(<CustomerBookingPage />);
    };

    it('should complete a booking successfully (Happy Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);
        renderPage();

        await driver.completeCustomerBooking({
            checkInDate: '2026-07-01',
            checkOutDate: '2026-07-05',
            guests: { adults: 2, children: 0, pets: 0 }
        });

        await waitFor(() => {
            expect(window.location.pathname).toContain('/customer/bookings/customer-booking-id');
        });
    });

    it('should display error when API call fails (Negative Path)', async () => {
        const user = userEvent.setup();
        const driver = new BookingFlowDriver(user);
        renderPage();

        await driver.fillDates('2025-07-01', '2025-07-05');
        await driver.setGuests(2, 0, 0);
        await driver.fillGuestDetails(2);
        await driver.skipVehicles();
        await driver.skipEquipment();

        await waitFor(() => expect(screen.getByText(/review & confirm/i)).toBeInTheDocument());

        const specialRequestsInput = screen.getByPlaceholderText(/any special requests/i);
        await user.type(specialRequestsInput, 'TRIGGER_ERROR');

        await driver.reviewAndConfirm();

        try {
            const errorMessage = await screen.findByText(/Failed to create booking/i);
            expect(errorMessage).toBeInTheDocument();
        } catch (e) {
            const html = document.body.innerHTML;
            const fs = await import('fs');
            fs.writeFileSync('customer-debug.html', String(html));
            throw e;
        }
    });
});
