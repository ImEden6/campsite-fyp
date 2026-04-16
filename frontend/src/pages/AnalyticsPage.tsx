/**
 * AnalyticsPage
 * Full analytics dashboard with metrics, charts, and insights
 */

import React, { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Download,
  ChevronUp,
  ChevronDown,
  Minus,
  Star,
} from 'lucide-react';
import {
  getDashboardMetrics,
  getRevenueMetrics,
  getOccupancyMetrics,
  getCustomerInsights,
  getSitePerformance,
} from '@/services/api/analytics';
import type { SitePerformance } from '@campsite-management/shared';
import { queryKeys } from '@/config/query-keys';
import {
  DashboardMetrics,
  DateRangeFilter,
  type DateRange,
} from '@/features/analytics';
import { formatCurrency } from '@/utils/currency';
import Button from '@/components/ui/Button';

// Lazy load heavy chart components
const RevenueChart = lazy(() =>
  import('@/features/analytics').then(m => ({ default: m.RevenueChart }))
);
const OccupancyChart = lazy(() =>
  import('@/features/analytics').then(m => ({ default: m.OccupancyChart }))
);
const CustomerInsights = lazy(() =>
  import('@/features/analytics').then(m => ({ default: m.CustomerInsights }))
);

// Chart loading skeleton
const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-night-surface rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-night-surface-alt rounded w-1/4 mb-4"></div>
    <div className="h-64 bg-gray-200 dark:bg-night-surface-alt rounded"></div>
  </div>
);

// Site Performance Table Component
interface SitePerformanceTableProps {
  data: SitePerformance[];
  loading?: boolean;
}

type SortField = 'revenue' | 'bookings' | 'occupancyRate' | 'averageRating';
type SortDirection = 'asc' | 'desc';

const SitePerformanceTable: React.FC<SitePerformanceTableProps> = ({ data, loading }) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Minus className="w-3 h-3 text-secondary-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-night-surface rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-night-surface-alt rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-night-surface-alt rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrencyValue = (value: number) =>
    formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Cabin': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'RV': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Tent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-night-surface-alt dark:text-secondary-300';
    }
  };

  return (
    <div className="bg-white dark:bg-night-surface rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100">Site Performance</h3>
        <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">Performance metrics by site</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-night-surface-alt">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                Site
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-secondary-200"
                onClick={() => handleSort('revenue')}
              >
                <span className="flex items-center gap-1">
                  Revenue <SortIcon field="revenue" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-secondary-200"
                onClick={() => handleSort('bookings')}
              >
                <span className="flex items-center gap-1">
                  Bookings <SortIcon field="bookings" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-secondary-200"
                onClick={() => handleSort('occupancyRate')}
              >
                <span className="flex items-center gap-1">
                  Occupancy <SortIcon field="occupancyRate" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-secondary-200"
                onClick={() => handleSort('averageRating')}
              >
                <span className="flex items-center gap-1">
                  Rating <SortIcon field="averageRating" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
            {sortedData.map((site) => (
              <tr
                key={site.siteId}
                className="hover:bg-gray-50 dark:hover:bg-night-surface-alt/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-primary-100">
                    {site.siteName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(site.siteType)}`}>
                    {site.siteType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-primary-100">
                  {formatCurrencyValue(site.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-secondary-400">
                  {site.bookings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-night-surface-alt rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${site.occupancyRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-secondary-400">
                      {site.occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-primary-100">
                      {site.averageRating.toFixed(1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return {
      startDate: monthAgo.toISOString().split('T')[0]!,
      endDate: today.toISOString().split('T')[0]!,
    };
  });

  // Dashboard metrics query with mock fallback
  const {
    data: dashboardMetrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.analytics.dashboard(dateRange),
    queryFn: () => getDashboardMetrics(dateRange),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Revenue metrics query with mock fallback
  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery({
    queryKey: queryKeys.analytics.revenue({ dateRange }),
    queryFn: () => getRevenueMetrics({ ...dateRange }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Occupancy metrics query with mock fallback
  const { data: occupancyMetrics, isLoading: occupancyLoading } = useQuery({
    queryKey: queryKeys.analytics.occupancy({ dateRange }),
    queryFn: () => getOccupancyMetrics(dateRange),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Customer insights query with mock fallback
  const { data: customerInsights, isLoading: customersLoading } = useQuery({
    queryKey: queryKeys.analytics.customers({ dateRange }),
    queryFn: () => getCustomerInsights(dateRange),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Site performance query with mock fallback
  const { data: sitePerformance, isLoading: sitesLoading } = useQuery({
    queryKey: queryKeys.analytics.sites({ dateRange }),
    queryFn: () => getSitePerformance(dateRange),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Use data from API (backend handles mock/real data based on USE_MOCK_DATA env var)
  const metrics = dashboardMetrics;
  const revenue = revenueMetrics;
  const occupancy = occupancyMetrics;
  const customers = customerInsights;
  const sites = sitePerformance ?? [];

  const handleRefresh = () => {
    refetchMetrics();
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-primary-100">Analytics Dashboard</h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Track revenue, occupancy, and customer insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-8">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Dashboard Metrics */}
        <div className="mb-8">
          {metrics && <DashboardMetrics metrics={metrics} loading={metricsLoading} />}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            {revenue ? <RevenueChart data={revenue} loading={revenueLoading} /> : <ChartSkeleton />}
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            {occupancy ? <OccupancyChart data={occupancy} loading={occupancyLoading} /> : <ChartSkeleton />}
          </Suspense>
        </div>

        {/* Customer Insights */}
        <div className="mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            {customers ? <CustomerInsights data={customers} loading={customersLoading} /> : <ChartSkeleton />}
          </Suspense>
        </div>

        {/* Site Performance Table */}
        <div className="mb-8">
          <SitePerformanceTable data={sites} loading={sitesLoading} />
        </div>

        {/* Quick Stats Footer */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-700 rounded-xl p-6 text-white shadow-lg shadow-primary-600/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <h3 className="font-heading text-lg font-semibold">Performance Summary</h3>
                <p className="text-white/80 text-sm">
                  Revenue is up {metrics?.revenueChange?.toFixed(1) ?? '0.0'}% compared to last period
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics?.activeBookings ?? 0}</p>
                <p className="text-white/80 text-xs">Active Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics?.occupancyRate?.toFixed(0) ?? 0}%</p>
                <p className="text-white/80 text-xs">Occupancy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(metrics?.averageBookingValue ?? 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p className="text-white/80 text-xs">Avg Booking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;