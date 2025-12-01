/**
 * OccupancyChart Component
 * Displays occupancy rates with heatmap visualization
 */

import React, { useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import type { OccupancyMetrics } from '@/services/api/analytics';

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
  if (rate >= 90) return 'text-red-700';
  if (rate >= 75) return 'text-orange-700';
  if (rate >= 50) return 'text-yellow-700';
  if (rate >= 25) return 'text-green-700';
  return 'text-blue-700';
};

export const OccupancyChart: React.FC<OccupancyChartProps> = ({ data, loading }) => {
  const [viewType, setViewType] = useState<ViewType>('chart');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Occupancy Rate</h3>
          <p className="text-sm text-gray-600 mt-1">
            Overall: {formatPercentage(data.overall)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'chart'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Chart
          </button>
          <button
            onClick={() => setViewType('heatmap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewType === 'heatmap'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Heatmap
          </button>
        </div>
      </div>

      {viewType === 'chart' && (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatPercentage}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => formatPercentage(value)}
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="occupancyRate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Occupancy Rate"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.byType.map((item) => (
              <div key={item.siteType} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{item.siteType}</h4>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${getOccupancyTextColor(item.occupancyRate)}`}>
                    {formatPercentage(item.occupancyRate)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
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
            {data.timeSeries.slice(0, 35).map((day, index) => {
              const date = new Date(day.date);
              const dayOfMonth = date.getDate();

              return (
                <div
                  key={index}
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

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Legend:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600">0-25%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">25-50%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-600">50-75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600">75-90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600">90-100%</span>
                </div>
              </div>
            </div>
          </div>

          {data.peakDays.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Peak Occupancy Days</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.peakDays.slice(0, 3).map((peak, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-900">{formatDate(peak.date)}</span>
                    <span className="text-sm font-semibold text-red-700">
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
