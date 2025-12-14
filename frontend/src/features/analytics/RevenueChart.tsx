/**
 * RevenueChart Component
 * Displays revenue trends over time with switchable chart types
 */

import React, { useState, useMemo } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { RevenueMetrics } from '@/services/api/analytics';
import { getChartColors, CHART_COLORS } from '@/utils/chartColors';
import { useDarkMode } from '@/hooks/useDarkMode';

interface RevenueChartProps {
  data: RevenueMetrics;
  loading?: boolean;
}

type ChartType = 'line' | 'bar' | 'pie';

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const [chartType, setChartType] = useState<ChartType>('line');

  // Reactively detect dark mode
  const isDark = useDarkMode();
  const colors = getChartColors(isDark);

  // Memoize chart options to prevent flickering
  const lineOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: colors.text },
      },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `Revenue: $${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        ticks: {
          color: colors.textMuted,
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
        grid: { color: colors.grid },
      },
    },
  }), [colors]);

  const barOptions = useMemo<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: colors.text },
      },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `Revenue: $${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        ticks: {
          color: colors.textMuted,
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
        grid: { color: colors.grid },
      },
    },
  }), [colors]);

  const pieOptions = useMemo<ChartOptions<'pie'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We render our own legend
      },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed as number;
            return `$${value.toLocaleString()}`;
          },
        },
      },
    },
  }), [colors]);

  // Prepare chart data - use separate typed data for line and bar
  const lineData = useMemo<ChartData<'line'>>(() => ({
    labels: data.timeSeries.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.timeSeries.map(d => d.revenue),
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}33`,
      fill: true,
      tension: 0.4,
    }],
  }), [data.timeSeries, colors.primary]);

  const barData = useMemo<ChartData<'bar'>>(() => ({
    labels: data.timeSeries.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.timeSeries.map(d => d.revenue),
      backgroundColor: colors.primary,
      borderRadius: 8,
    }],
  }), [data.timeSeries, colors.primary]);

  const pieData = useMemo<ChartData<'pie'>>(() => ({
    labels: data.byType.map(d => d.siteType),
    datasets: [{
      data: data.byType.map(d => d.revenue),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
    }],
  }), [data.byType]);

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
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trends</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total: {formatCurrency(data.total)}
            <span className={`ml-2 ${data.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'line'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            title="Line Chart"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'pie'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            title="Pie Chart"
          >
            <PieChartIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {chartType === 'line' && (
        <div className="relative h-[300px]">
          <Line data={lineData} options={lineOptions} />
        </div>
      )}

      {chartType === 'bar' && (
        <div className="relative h-[300px]">
          <Bar data={barData} options={barOptions} />
        </div>
      )}

      {chartType === 'pie' && (
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative h-[300px] w-full lg:w-1/2">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="shrink-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Revenue by Site Type</h4>
            <div className="space-y-2">
              {data.byType.map((item, index) => (
                <div key={item.siteType} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.siteType}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.revenue)} ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
