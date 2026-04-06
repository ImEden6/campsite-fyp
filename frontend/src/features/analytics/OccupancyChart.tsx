/**
 * OccupancyChart Component
 * Displays occupancy rates with heatmap visualization
 */

import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import { Calendar, TrendingUp } from 'lucide-react';
import type { OccupancyMetrics } from '@campsite-management/shared';
import { getChartColors, CHART_COLORS } from '@/utils/chartColors';
import { useDarkMode } from '@/hooks/useDarkMode';

interface OccupancyChartProps {
  data: OccupancyMetrics;
  loading?: boolean;
}

type ViewType = 'chart' | 'heatmap';

const getOccupancyColor = (rate: number): string => {
  if (rate >= 90) return 'bg-red-500';
  if (rate >= 75) return 'bg-orange-500';
  if (rate >= 50) return 'bg-yellow-500';
  if (rate >= 25) return 'bg-green-500';
  return 'bg-blue-500';
};

const getOccupancyTextColor = (rate: number): string => {
  if (rate >= 90) return 'text-red-700 dark:text-red-400';
  if (rate >= 75) return 'text-orange-700 dark:text-orange-400';
  if (rate >= 50) return 'text-yellow-700 dark:text-yellow-400';
  if (rate >= 25) return 'text-green-700 dark:text-green-400';
  return 'text-blue-700 dark:text-blue-400';
};

export const OccupancyChart: React.FC<OccupancyChartProps> = ({ data, loading }) => {
  const [viewType, setViewType] = useState<ViewType>('chart');

  // Reactively detect dark mode
  const isDark = useDarkMode();
  const colors = getChartColors(isDark);

  // Memoize chart options
  const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
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
          label: (ctx) => `Occupancy: ${(ctx.parsed.y ?? 0).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: colors.textMuted,
          callback: (value) => `${value}%`,
        },
        grid: { color: colors.grid },
      },
    },
  }), [colors]);

  // Prepare chart data
  const chartData = useMemo<ChartData<'line'>>(() => ({
    labels: data.timeSeries.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Occupancy Rate',
      data: data.timeSeries.map(d => d.occupancyRate),
      borderColor: colors.warning,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return colors.warning;
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'oklch(0.62 0.180 260 / 0.1)');
        gradient.addColorStop(0.5, 'oklch(0.72 0.190 145 / 0.4)');
        gradient.addColorStop(1, 'oklch(0.77 0.180 75 / 0.6)');
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
  }), [data.timeSeries, colors.warning, isDark]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Occupancy Rate</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overall: {formatPercentage(data.overall)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'chart'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Chart
          </button>
          <button
            onClick={() => setViewType('heatmap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'heatmap'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Heatmap
          </button>
        </div>
      </div>

      {viewType === 'chart' && (
        <>
          <div className="relative h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.byType.map((item) => (
              <div key={item.siteType} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{item.siteType}</h4>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${getOccupancyTextColor(item.occupancyRate)}`}>
                    {formatPercentage(item.occupancyRate)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {item.occupiedSites} / {item.totalSites} sites occupied
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {viewType === 'heatmap' && (
        <div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {data.timeSeries.slice(0, 35).map((day) => {
              const date = new Date(day.date);
              const dayOfMonth = date.getDate();

              return (
                <div
                  key={day.date}
                  className={`aspect-square rounded-lg ${getOccupancyColor(day.occupancyRate)} 
                    hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer relative group`}
                  title={`${formatDate(day.date)}: ${formatPercentage(day.occupancyRate)}`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-medium">
                    <span>{dayOfMonth}</span>
                    <span className="text-[10px] opacity-90">{formatPercentage(day.occupancyRate)}</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {formatDate(day.date)}: {formatPercentage(day.occupancyRate)}
                    <br />
                    {day.occupiedSites} / {day.totalSites} sites
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Legend:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">0-25%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">25-50%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">50-75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">75-90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">90-100%</span>
                </div>
              </div>
            </div>
          </div>

          {data.peakDays.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Peak Occupancy Days</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.peakDays.slice(0, 3).map((peak, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(peak.date)}</span>
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                      {formatPercentage(peak.occupancyRate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
