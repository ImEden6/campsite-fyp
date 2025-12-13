/**
 * RevenueChart Component
 * Displays revenue trends over time with time series data
 */

import React, { useState } from 'react';
// Deep imports for better tree-shaking
import { LineChart } from 'recharts/es6/chart/LineChart';
import { BarChart } from 'recharts/es6/chart/BarChart';
import { PieChart } from 'recharts/es6/chart/PieChart';
import { Line } from 'recharts/es6/cartesian/Line';
import { Bar } from 'recharts/es6/cartesian/Bar';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { Legend } from 'recharts/es6/component/Legend';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { Pie } from 'recharts/es6/polar/Pie';
import { Cell } from 'recharts/es6/component/Cell';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { RevenueMetrics } from '@/services/api/analytics';

interface RevenueChartProps {
  data: RevenueMetrics;
  loading?: boolean;
}

type ChartType = 'line' | 'bar' | 'pie';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const [chartType, setChartType] = useState<ChartType>('line');

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

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <p className="text-sm text-gray-600 mt-1">
            Total: {formatCurrency(data.total)}
            <span className={`ml-2 ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%)
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'line'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title="Line Chart"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'pie'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title="Pie Chart"
          >
            <PieChartIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {chartType === 'line' && (
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
              tickFormatter={formatCurrency}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
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
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartType === 'bar' && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.timeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === 'pie' && (
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byType}
                dataKey="revenue"
                nameKey="siteType"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: unknown) => {
                  const data = props as { siteType: string; percentage: number };
                  return `${data.siteType}: ${data.percentage.toFixed(1)}%`;
                }}
                labelLine={true}
              >
                {data.byType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="shrink-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Revenue by Site Type</h4>
            <div className="space-y-2">
              {data.byType.map((item, index) => (
                <div key={item.siteType} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.siteType}</div>
                    <div className="text-xs text-gray-600">
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
