import { apiClient } from '@/services/api/client';
import type {
  Payment,
  PaymentIntent,
  CreatePaymentIntentRequest,
  RefundRequest,
  RefundResponse,
} from '../types/payment.types';

export const paymentService = {
  /**
   * Create a payment intent for a booking
   */
  createPaymentIntent: async (
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> => {
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
    const response = await apiClient.get<Payment[]>(
      `/bookings/${bookingId}/payments`
    );
    return response.data;
  },

  /**
   * Get payment history for current user
   */
  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await apiClient.get<Payment[]>('/payments/history');
    return response.data;
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
    const response = await apiClient.post<Payment>(
      `/payments/confirm/${paymentIntentId}`
    );
    return response.data;
  },
};
