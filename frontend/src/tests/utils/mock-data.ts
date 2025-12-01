// Mock data for testing

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'STAFF' as const,
  phone: '555-0100',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAdmin = {
  ...mockUser,
  id: '2',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
};

export const mockStaff = {
  ...mockUser,
  id: '3',
  email: 'staff@example.com',
  role: 'STAFF' as const,
};

export const mockSite = {
  id: '1',
  name: 'Site A1',
  type: 'TENT' as const,
  status: 'AVAILABLE' as const,
  capacity: 4,
  pricePerNight: 35.00,
  description: 'Beautiful tent site with lake view',
  amenities: ['Water', 'Fire Pit', 'Picnic Table'],
  images: ['/images/site-a1.jpg'],
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockBooking = {
  id: '1',
  userId: '1',
  siteId: '1',
  checkInDate: new Date('2024-12-20'),
  checkOutDate: new Date('2024-12-22'),
  status: 'CONFIRMED' as const,
  totalAmount: 70.00,
  depositAmount: 35.00,
  guests: {
    adults: 2,
    children: 1,
    pets: 0,
  },
  specialRequests: 'Early check-in if possible',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
  site: mockSite,
};

export const mockPayment = {
  id: '1',
  bookingId: '1',
  amount: 70.00,
  status: 'COMPLETED' as const,
  paymentMethod: 'CARD' as const,
  stripePaymentIntentId: 'pi_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockEquipment = {
  id: '1',
  name: 'Kayak',
  category: 'WATERCRAFT' as const,
  description: 'Single person kayak',
  pricePerDay: 25.00,
  quantity: 10,
  available: 8,
  status: 'AVAILABLE' as const,
  images: ['/images/kayak.jpg'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockNotification = {
  id: '1',
  userId: '1',
  type: 'BOOKING_CONFIRMED' as const,
  title: 'Booking Confirmed',
  message: 'Your booking has been confirmed',
  read: false,
  createdAt: new Date('2024-01-01'),
};

export const mockAuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const mockDashboardMetrics = {
  totalRevenue: 15000,
  occupancyRate: 75,
  activeBookings: 25,
  pendingPayments: 3,
  revenueChange: 12.5,
  occupancyChange: -2.3,
  bookingsChange: 8.1,
};

export const mockRevenueData = [
  { date: '2024-01', revenue: 5000 },
  { date: '2024-02', revenue: 6500 },
  { date: '2024-03', revenue: 7200 },
  { date: '2024-04', revenue: 8100 },
];
