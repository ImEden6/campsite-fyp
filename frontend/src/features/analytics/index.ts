/**
 * Analytics Feature Exports
 */

export { DashboardMetrics } from './DashboardMetrics';
export { DateRangeFilter } from './DateRangeFilter';
export { ReportTypeSelector } from './ReportTypeSelector';
export { ReportParameterForm } from './ReportParameterForm';
export { ReportDisplay } from './ReportDisplay';
export { ReportHistory } from './ReportHistory';
export type { DateRange } from './DateRangeFilter';

// Chart components are heavy (use recharts library) - export as lazy-loadable
// When importing these, use: const RevenueChart = lazy(() => import('@/features/analytics').then(m => ({ default: m.RevenueChart })));
export { RevenueChart } from './RevenueChart';
export { OccupancyChart } from './OccupancyChart';
export { CustomerInsights } from './CustomerInsights';
