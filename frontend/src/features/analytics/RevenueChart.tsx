/**
 * RevenueChart Component
 * Displays revenue trends over time with switchable chart types
 */

import React, { useState, useMemo } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { RevenueMetrics } from '@campsite-management/shared';
import { getChartColors, CHART_COLORS } from '@/utils/chartColors';
import { useDarkMode } from '@/hooks/useDarkMode';
import { formatCurrency as formatMYR } from '@/utils/currency';

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
          label: (ctx) => `Revenue: ${formatMYR(ctx.parsed.y ?? 0)}`,
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
          callback: (value) => formatMYR(Number(value)),
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
          label: (ctx) => `Revenue: ${formatMYR(ctx.parsed.y ?? 0)}`,
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
          callback: (value) => formatMYR(Number(value)),
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
        display: false, // render our own legend
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
            return formatMYR(value);
          },
        },
      },
    },
  }), [colors]);

  // Prepare chart data, use separate typed data for line and bar
  const lineData = useMemo<ChartData<'line'>>(() => ({
    labels: data.timeSeries.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.timeSeries.map(d => d.revenue),
      borderColor: colors.success,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return colors.success;
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'oklch(0.72 0.190 145 / 0.1)');
        gradient.addColorStop(0.5, 'oklch(0.77 0.180 75 / 0.4)');
        gradient.addColorStop(1, 'oklch(0.62 0.180 260 / 0.6)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: CHART_COLORS.slice(0, data.timeSeries.length),
      pointBorderColor: isDark ? 'oklch(0.30 0.020 260)' : 'oklch(1 0 0)',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }), [data.timeSeries, colors.success, isDark]);

  const barData = useMemo<ChartData<'bar'>>(() => ({
    labels: data.timeSeries.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.timeSeries.map(d => d.revenue),
      backgroundColor: data.timeSeries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderRadius: 8,
      hoverBackgroundColor: data.timeSeries.map((_, i) => {
        const baseColor = CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0]!;
        return baseColor.replace(')', ' / 0.8)');
      }),
    }],
  }), [data.timeSeries]);

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
      <div className="bg-white dark:bg-night-surface rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-night-surface-alt rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-night-surface-alt rounded"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return formatMYR(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-white dark:bg-night-surface rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-primary-100">Revenue Trends</h3>
          <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">
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
              : 'bg-gray-100 dark:bg-night-surface-alt text-gray-600 dark:text-secondary-400 hover:bg-gray-200 dark:hover:bg-night-surface-alt'
              }`}
            title="Line Chart"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-night-surface-alt text-gray-600 dark:text-secondary-400 hover:bg-gray-200 dark:hover:bg-night-surface-alt'
              }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'pie'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-night-surface-alt text-gray-600 dark:text-secondary-400 hover:bg-gray-200 dark:hover:bg-night-surface-alt'
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
            <h4 className="text-sm font-semibold text-gray-900 dark:text-primary-100 mb-3">Revenue by Site Type</h4>
            <div className="space-y-2">
              {data.byType.map((item, index) => (
                <div key={item.siteType} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-primary-100">{item.siteType}</div>
                    <div className="text-xs text-gray-600 dark:text-secondary-400">
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
