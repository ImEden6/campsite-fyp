import { apiClient } from '@/services/api/client';
import type {
  Payment,
  PaymentIntent,
  CreatePaymentIntentRequest,
  RefundRequest,
  RefundResponse,
} from '../types/payment.types';
import { getMockBookingPayments, getMockPaymentHistory } from './mockCurrentPayments';
import { env } from '@/config/env';
import { createMockPaymentIntent, createMockConfirmedPayment, getMockPaymentIntentData } from './mock-payment-intent';

export const paymentService = {
  /**
   * Create a payment intent for a booking
   */
  createPaymentIntent: async (
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> => {
    // Environment-gated mock for dev/preview
    if (env.useMockPayments) {
      console.warn('[Mock] Using mock payment intent (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      return createMockPaymentIntent(
        data.amount, 
        data.currency || 'myr',
        data.bookingId,
        data.description
      );
    }

    const response = await apiClient.post<PaymentIntent>(
      '/payments/intent',
      data
    );
    return response.data;
  },

  /**
   * Get payment details by ID
   */
  getPayment: async (paymentId: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Get all payments for a booking
   */
  getBookingPayments: async (bookingId: string): Promise<Payment[]> => {
    // In mock-payments mode, always use local mock store and skip real API
    if (env.useMockPayments) {
      console.warn('[Mock] Using mock booking payments (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
      return getMockBookingPayments(bookingId);
    }

    try {
      const response = await apiClient.get<Payment[]>(
        `/bookings/${bookingId}/payments`
      );
      // Validate response is an array
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response: expected array of payments');
      }
      return response.data;
    } catch (error) {
      console.warn('[Mock] Using mock booking payments', error);
      return getMockBookingPayments(bookingId);
    }
  },

  /**
   * Get payment history for current user
   */
  getPaymentHistory: async (): Promise<Payment[]> => {
    // In mock-payments mode, always use local mock history and skip real API
    if (env.useMockPayments) {
      console.warn('[Mock] Using mock payment history (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
      return getMockPaymentHistory();
    }

    try {
      const response = await apiClient.get<Payment[]>('/payments/history');
      // Validate response is an array
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response: expected array of payments');
      }
      return response.data;
    } catch (error) {
      console.warn('[Mock] Using mock payment history', error);
      return getMockPaymentHistory();
    }
  },

  /**
   * Process a refund
   */
  processRefund: async (data: RefundRequest): Promise<RefundResponse> => {
    const response = await apiClient.post<RefundResponse>(
      `/payments/${data.paymentId}/refund`,
      {
        amount: data.amount,
        reason: data.reason,
      }
    );
    return response.data;
  },

  /**
   * Download payment receipt
   */
  downloadReceipt: async (paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Confirm payment intent (after Stripe confirmation)
   */
  confirmPayment: async (paymentIntentId: string): Promise<Payment> => {
    // Environment-gated mock for dev/preview
    if (env.useMockPayments) {
      console.warn('[Mock] Confirming mock payment (VITE_USE_MOCK_PAYMENTS=true)');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      // Retrieve the original amount/currency/bookingId from the stored mock payment intent
      const intentData = getMockPaymentIntentData(paymentIntentId);
      const amount = intentData?.amount ?? 0;
      const currency = intentData?.currency ?? 'myr';
      const bookingId = intentData?.bookingId;
      
      return createMockConfirmedPayment(paymentIntentId, bookingId, amount, currency);
    }

    const response = await apiClient.post<Payment>(
      `/payments/confirm/${paymentIntentId}`
    );
    return response.data;
  },
};
