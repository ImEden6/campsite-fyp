/**
 * CustomerInsights Component
 * Displays customer analytics and demographics
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Users, TrendingUp, DollarSign, Repeat } from 'lucide-react';
import type { CustomerInsights as CustomerInsightsType } from '@/services/api/analytics';

interface CustomerInsightsProps {
  data: CustomerInsightsType;
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({ data, loading }) => {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Insights</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">New Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.newCustomers.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Retention Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.retentionRate.toFixed(1)}%</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Avg Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.averageLifetimeValue)}</p>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Age Groups */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Age Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.demographics.ageGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Guest Origins */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Guest Origins</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.demographics.locations.slice(0, 5)}
                dataKey="count"
                nameKey="state"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: unknown) => {
                  const data = entry as { state: string; percentage: number };
                  return `${data.state}: ${data.percentage.toFixed(1)}%`;
                }}
              >
                {data.demographics.locations.slice(0, 5).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Patterns Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Booking Patterns</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preferred Site Types */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-3">Preferred Site Types</h5>
            <div className="space-y-3">
              {data.bookingPatterns.preferredSiteTypes.map((item, index) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900">{item.type}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Average Stay:</span>{' '}
                {data.bookingPatterns.averageStayDuration.toFixed(1)} nights
              </p>
            </div>
          </div>

          {/* Seasonal Trends */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-3">Seasonal Trends</h5>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.bookingPatterns.seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-green-900 mb-2">New Customers</h5>
            <p className="text-2xl font-bold text-green-700">{data.newCustomers.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">
              {((data.newCustomers / data.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h5 className="text-sm font-semibold text-purple-900 mb-2">Returning Customers</h5>
            <p className="text-2xl font-bold text-purple-700">{data.returningCustomers.toLocaleString()}</p>
            <p className="text-xs text-purple-600 mt-1">
              {((data.returningCustomers / data.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
