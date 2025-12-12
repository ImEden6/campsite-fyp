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
  type SitePerformance,
} from '@/services/api/analytics';
import {
  generateMockDashboardMetrics,
  generateMockRevenueMetrics,
  generateMockOccupancyMetrics,
  generateMockCustomerInsights,
  generateMockSitePerformance,
} from '@/services/api/mockAnalyticsData';
import { queryKeys } from '@/config/query-keys';
import {
  DashboardMetrics,
  DateRangeFilter,
  type DateRange,
} from '@/features/analytics';

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
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
    if (sortField !== field) return <Minus className="w-3 h-3 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Cabin': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'RV': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Tent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Site Performance</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Performance metrics by site</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Site
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('revenue')}
              >
                <span className="flex items-center gap-1">
                  Revenue <SortIcon field="revenue" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('bookings')}
              >
                <span className="flex items-center gap-1">
                  Bookings <SortIcon field="bookings" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('occupancyRate')}
              >
                <span className="flex items-center gap-1">
                  Occupancy <SortIcon field="occupancyRate" />
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('averageRating')}
              >
                <span className="flex items-center gap-1">
                  Rating <SortIcon field="averageRating" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((site) => (
              <tr
                key={site.siteId}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {site.siteName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(site.siteType)}`}>
                    {site.siteType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(site.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {site.bookings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${site.occupancyRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {site.occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
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

  // Use mock data as fallback - now date-range aware
  const metrics = dashboardMetrics ?? generateMockDashboardMetrics(dateRange);
  const revenue = revenueMetrics ?? generateMockRevenueMetrics(dateRange);
  const occupancy = occupancyMetrics ?? generateMockOccupancyMetrics(dateRange);
  const customers = customerInsights ?? generateMockCustomerInsights(dateRange);
  const sites = sitePerformance ?? generateMockSitePerformance(dateRange);

  const handleRefresh = () => {
    refetchMetrics();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track revenue, occupancy, and customer insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-8">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Dashboard Metrics */}
        <div className="mb-8">
          <DashboardMetrics metrics={metrics} loading={metricsLoading} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={revenue} loading={revenueLoading} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <OccupancyChart data={occupancy} loading={occupancyLoading} />
          </Suspense>
        </div>

        {/* Customer Insights */}
        <div className="mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            <CustomerInsights data={customers} loading={customersLoading} />
          </Suspense>
        </div>

        {/* Site Performance Table */}
        <div className="mb-8">
          <SitePerformanceTable data={sites} loading={sitesLoading} />
        </div>

        {/* Quick Stats Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Performance Summary</h3>
                <p className="text-blue-100 text-sm">
                  Revenue is up {metrics.revenueChange.toFixed(1)}% compared to last period
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.activeBookings}</p>
                <p className="text-blue-100 text-xs">Active Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.occupancyRate.toFixed(0)}%</p>
                <p className="text-blue-100 text-xs">Occupancy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${metrics.averageBookingValue.toFixed(0)}</p>
                <p className="text-blue-100 text-xs">Avg Booking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;