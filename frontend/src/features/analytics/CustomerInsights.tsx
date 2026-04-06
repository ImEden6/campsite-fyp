/**
 * CustomerInsights Component
 * Displays customer analytics and demographics
 */

import React, { useMemo } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import { Users, TrendingUp, DollarSign, Repeat } from 'lucide-react';
import type { CustomerInsights as CustomerInsightsType } from '@campsite-management/shared';
import { getChartColors, CHART_COLORS } from '@/utils/chartColors';
import { useDarkMode } from '@/hooks/useDarkMode';
import { formatCurrency as formatMYR } from '@/utils/currency';

interface CustomerInsightsProps {
  data: CustomerInsightsType;
  loading?: boolean;
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({ data, loading }) => {
  // Reactively detect dark mode
  const isDark = useDarkMode();
  const colors = getChartColors(isDark);

  // Memoize chart options
  const barOptions = useMemo<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
    },
  }), [colors]);

  const pieOptions = useMemo<ChartOptions<'pie'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
      },
    },
  }), [colors]);

  const lineOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
    },
  }), [colors]);

  // Prepare chart data
  const ageData = useMemo<ChartData<'bar'>>(() => ({
    labels: data.demographics.ageGroups.map(d => d.range),
    datasets: [{
      data: data.demographics.ageGroups.map(d => d.count),
      backgroundColor: colors.primary,
      borderRadius: 8,
    }],
  }), [data.demographics.ageGroups, colors.primary]);

  const locationData = useMemo<ChartData<'pie'>>(() => ({
    labels: data.demographics.locations.slice(0, 5).map(d => d.state),
    datasets: [{
      data: data.demographics.locations.slice(0, 5).map(d => d.count),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
    }],
  }), [data.demographics.locations]);

  const seasonalData = useMemo<ChartData<'line'>>(() => ({
    labels: data.bookingPatterns.seasonalTrends.map(d => d.month),
    datasets: [{
      data: data.bookingPatterns.seasonalTrends.map(d => d.bookings),
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}33`,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  }), [data.bookingPatterns.seasonalTrends, colors.primary]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return formatMYR(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Customer Insights</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.totalCustomers.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">New Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.newCustomers.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.retentionRate.toFixed(1)}%</p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data.averageLifetimeValue)}</p>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Age Groups */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Age Distribution</h4>
          <div className="relative h-[250px]">
            <Bar data={ageData} options={barOptions} />
          </div>
        </div>

        {/* Guest Origins */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Guest Origins</h4>
          <div className="relative h-[250px]">
            <Pie data={locationData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Booking Patterns Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Booking Patterns</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preferred Site Types */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Preferred Site Types</h5>
            <div className="space-y-3">
              {data.bookingPatterns.preferredSiteTypes.map((item, index) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{item.type}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">Average Stay:</span>{' '}
                {data.bookingPatterns.averageStayDuration.toFixed(1)} nights
              </p>
            </div>
          </div>

          {/* Seasonal Trends */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Seasonal Trends</h5>
            <div className="relative h-[200px]">
              <Line data={seasonalData} options={lineOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h5 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">New Customers</h5>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{data.newCustomers.toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {((data.newCustomers / data.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Returning Customers</h5>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{data.returningCustomers.toLocaleString()}</p>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
              {((data.returningCustomers / data.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
