// Utilities for Campsite Management System

import { REGEX_PATTERNS, DATE_FORMATS, VALIDATION_RULES } from '../constants';
import { Booking, Site, Payment, SiteType, UserRole, ValidationError } from '../types';

// Date Utilities
export const dateUtils = {
  formatDate(date: Date, format: string = DATE_FORMATS.DISPLAY): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: format.includes('MMM') ? 'short' : '2-digit',
      day: '2-digit',
    }).format(date);
  },

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  getDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },

  isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  },

  getWeekdays(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  },

  getMonths(): string[] {
    return ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
  },

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day;
    return new Date(result.setDate(diff));
  },

  getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + 6;
    return new Date(result.setDate(diff));
  },

  getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  },

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  },

  parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  },

  toISOString(date: Date): string {
    return date.toISOString();
  },

  fromISOString(isoString: string): Date {
    return new Date(isoString);
  },
};

// Currency Utilities
export const currencyUtils = {
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  formatPercentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  },

  parseCurrency(currencyString: string): number {
    const numericString = currencyString.replace(/[^0-9.-]+/g, '');
    return parseFloat(numericString) || 0;
  },

  calculateTax(amount: number, taxRate: number): number {
    return amount * taxRate;
  },

  calculateTotalWithTax(amount: number, taxRate: number): number {
    return amount + this.calculateTax(amount, taxRate);
  },

  calculateDiscount(amount: number, discountPercentage: number): number {
    return amount * (discountPercentage / 100);
  },

  calculateDiscountedAmount(amount: number, discountPercentage: number): number {
    return amount - this.calculateDiscount(amount, discountPercentage);
  },

  roundToNearestCent(amount: number): number {
    return Math.round(amount * 100) / 100;
  },
};

// Validation Utilities
export const validationUtils = {
  validateEmail(email: string): boolean {
    return REGEX_PATTERNS.EMAIL.test(email);
  },

  validatePhone(phone: string): boolean {
    return REGEX_PATTERNS.PHONE.test(phone);
  },

  validatePassword(password: string): boolean {
    return REGEX_PATTERNS.PASSWORD.test(password);
  },

  validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  },

  validateBookingNumber(bookingNumber: string): boolean {
    return REGEX_PATTERNS.BOOKING_NUMBER.test(bookingNumber);
  },

  validateZipCode(zipCode: string): boolean {
    return REGEX_PATTERNS.ZIP_CODE.test(zipCode);
  },

  validateLicensePlate(licensePlate: string): boolean {
    return REGEX_PATTERNS.LICENSE_PLATE.test(licensePlate);
  },

  validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  },

  validateStayDuration(startDate: Date, endDate: Date): boolean {
    const days = dateUtils.getDaysBetween(startDate, endDate);
    return days >= VALIDATION_RULES.BOOKING.MIN_STAY_DAYS &&
      days <= VALIDATION_RULES.BOOKING.MAX_STAY_DAYS;
  },

  validateGuestCount(adults: number, children: number): boolean {
    return (adults + children) <= VALIDATION_RULES.BOOKING.MAX_GUESTS && adults > 0;
  },

  validateVehicleCount(vehicleCount: number): boolean {
    return vehicleCount <= VALIDATION_RULES.BOOKING.MAX_VEHICLES;
  },

  validatePriceRange(price: number): boolean {
    return price >= VALIDATION_RULES.SITE.MIN_PRICE && price <= VALIDATION_RULES.SITE.MAX_PRICE;
  },

  validateName(name: string): boolean {
    return name.length >= VALIDATION_RULES.USER.NAME_MIN_LENGTH &&
      name.length <= VALIDATION_RULES.USER.NAME_MAX_LENGTH;
  },

  validateRequired(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  },

  validateMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength;
  },

  validateMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  },
};

// String Utilities
export const stringUtils = {
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  },

  kebabCase(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
      .replace(/^-/, '')
      .replace(/[_\s]+/g, '-');
  },

  snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[-\s]+/g, '_');
  },

  truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  slugify(str: string): string {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  pluralize(word: string, count: number): string {
    if (count === 1) return word;

    // Simple pluralization rules
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch')) {
      return word + 'es';
    }
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    return word + 's';
  },

  removeSpaces(str: string): string {
    return str.replace(/\s+/g, '');
  },

  normalizeSpaces(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  },

  escapeHtml(str: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
  },

  stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  },
};

// Array Utilities
export const arrayUtils = {
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  flatten<T>(array: T[][]): T[] {
    return array.reduce((acc, val) => acc.concat(val), []);
  },

  sum(array: number[]): number {
    return array.reduce((sum, num) => sum + num, 0);
  },

  average(array: number[]): number {
    return array.length > 0 ? this.sum(array) / array.length : 0;
  },

  min(array: number[]): number {
    return Math.min(...array);
  },

  max(array: number[]): number {
    return Math.max(...array);
  },

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    return shuffled;
  },

  sample<T>(array: T[], count: number = 1): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, count);
  },

  paginate<T>(array: T[], page: number, limit: number): { items: T[]; total: number; hasNext: boolean; hasPrevious: boolean } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = array.slice(startIndex, endIndex);

    return {
      items,
      total: array.length,
      hasNext: endIndex < array.length,
      hasPrevious: page > 1,
    };
  },
};

// Object Utilities
export const objectUtils = {
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  isEmpty(obj: unknown): boolean {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  deepClone<T extends object | null | undefined>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T;

    const cloned = {} as T;
    Object.keys(obj as object).forEach(key => {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== null && typeof value === 'object') {
        (cloned as Record<string, unknown>)[key] = this.deepClone(value as object | null | undefined);
      } else {
        (cloned as Record<string, unknown>)[key] = value;
      }
    });
    return cloned;
  },

  merge<T, U>(target: T, source: U): T & U {
    return { ...target, ...source };
  },

  deepMerge<T, U>(target: T, source: U): T & U {
    const result = { ...target } as T & U;

    Object.keys(source as object).forEach(key => {
      const sourceValue = (source as Record<string, unknown>)[key];
      const targetValue = (target as Record<string, unknown>)[key];

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        (result as Record<string, unknown>)[key] = this.deepMerge((targetValue || {}) as object, sourceValue as object) as unknown;
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    });

    return result;
  },

  getValue<T>(obj: unknown, path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object' || !(key in current)) {
        return defaultValue as T;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current as T;
  },

  setValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
  },
};

// ID Generation Utilities
export const idUtils = {
  generateId(): string {
    // Use crypto.randomUUID() for browser
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Manual UUID v4 generation as fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  generateBookingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateShortId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateNumericId(length: number = 6): string {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateSlug(text: string): string {
    return stringUtils.slugify(text) + '-' + this.generateShortId(6);
  },
};

// Business Logic Utilities
export const businessUtils = {
  calculateBookingTotal(site: Site, checkIn: Date, checkOut: Date, taxRate: number, discountAmount: number = 0): {
    nights: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  } {
    const nights = dateUtils.getDaysBetween(checkIn, checkOut);
    const subtotal = site.basePrice * nights;
    const tax = currencyUtils.calculateTax(subtotal, taxRate);
    const total = subtotal + tax - discountAmount;

    return {
      nights,
      subtotal: currencyUtils.roundToNearestCent(subtotal),
      tax: currencyUtils.roundToNearestCent(tax),
      discount: discountAmount,
      total: currencyUtils.roundToNearestCent(total),
    };
  },

  calculateOccupancyRate(occupiedSites: number, totalSites: number): number {
    if (totalSites === 0) return 0;
    return (occupiedSites / totalSites) * 100;
  },

  calculateAverageStayDuration(bookings: Booking[]): number {
    if (bookings.length === 0) return 0;

    const totalDays = bookings.reduce((sum, booking) => {
      return sum + dateUtils.getDaysBetween(booking.checkInDate, booking.checkOutDate);
    }, 0);

    return totalDays / bookings.length;
  },

  calculateRevenue(bookings: Booking[], period: 'day' | 'week' | 'month' | 'year' = 'month'): number {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = dateUtils.getStartOfWeek(now);
        break;
      case 'month':
        startDate = dateUtils.getStartOfMonth(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return bookings
      .filter(booking => booking.createdAt >= startDate)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
  },

  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'CONFIRMED': return '#4caf50';
      case 'CHECKED_IN': return '#2196f3';
      case 'CHECKED_OUT': return '#9e9e9e';
      case 'CANCELLED': return '#f44336';
      case 'NO_SHOW': return '#795548';
      default: return '#9e9e9e';
    }
  },

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'PAID': return '#4caf50';
      case 'PARTIAL': return '#ffeb3b';
      case 'REFUNDED': return '#9c27b0';
      case 'FAILED': return '#f44336';
      default: return '#9e9e9e';
    }
  },

  getSiteTypeLabel(type: SiteType): string {
    switch (type) {
      case 'TENT': return 'Tent Site';
      case 'RV': return 'RV Site';
      case 'CABIN': return 'Cabin';
      default: return 'Unknown';
    }
  },

  getUserRoleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Manager';
      case 'STAFF': return 'Staff';
      case 'CUSTOMER': return 'Customer';
      default: return 'Unknown';
    }
  },

  canUserAccessResource(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      ADMIN: 3,
      MANAGER: 2,
      STAFF: 1,
      CUSTOMER: 0,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  isBookingEditable(booking: Booking): boolean {
    return ['PENDING', 'CONFIRMED'].includes(booking.status);
  },

  isBookingCancellable(booking: Booking): boolean {
    return ['PENDING', 'CONFIRMED'].includes(booking.status) &&
      booking.checkInDate > new Date();
  },

  canCheckIn(booking: Booking): boolean {
    return booking.status === 'CONFIRMED' &&
      dateUtils.isSameDay(booking.checkInDate, new Date());
  },

  canCheckOut(booking: Booking): boolean {
    return booking.status === 'CHECKED_IN';
  },

  calculateDepositAmount(totalAmount: number, depositPercentage: number): number {
    return currencyUtils.roundToNearestCent(totalAmount * (depositPercentage / 100));
  },

  calculateRefundAmount(payment: Payment, refundPercentage: number = 100): number {
    return currencyUtils.roundToNearestCent(payment.amount * (refundPercentage / 100));
  },
};

// Error Handling Utilities
export const errorUtils = {
  createValidationError(field: string, message: string, code: string): ValidationError {
    return { field, message, code };
  },

  formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(error => `${error.field}: ${error.message}`).join(', ');
  },

  isValidationError(error: unknown): error is ValidationError {
    return error !== null && typeof error === 'object' &&
      'field' in error && 'message' in error && 'code' in error;
  },

  handleApiError(error: unknown): { message: string; code?: string } {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string; code?: string } } }).response;
      if (response?.data?.message) {
        return {
          message: response.data.message,
          code: response.data.code,
        };
      }
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return { message: error.message };
    }

    return { message: 'An unexpected error occurred' };
  },
};

// Local Storage Utilities
export const storageUtils = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof localStorage === 'undefined') {
        return defaultValue || null;
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Handle quota exceeded or other storage errors
    }
  },

  remove(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Handle storage errors
    }
  },

  clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // Handle storage errors
    }
  },

  getSession<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof sessionStorage === 'undefined') {
        return defaultValue || null;
      }
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  setSession(key: string, value: unknown): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Handle storage errors
    }
  },

  removeSession(key: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch {
      // Handle storage errors
    }
  },

  clearSession(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch {
      // Handle storage errors
    }
  },
};

// URL Utilities
export const urlUtils = {
  buildUrl(base: string, path: string, params?: Record<string, unknown>): string {
    const url = new URL(path, base);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  },

  parseQueryString(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      result[key] = value;
    }

    return result;
  },

  buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};
