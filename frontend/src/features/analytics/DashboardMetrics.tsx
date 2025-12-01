/**
 * DashboardMetrics Component
 * Displays key performance indicators (KPIs) for the admin dashboard
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Percent } from 'lucide-react';
import type { DashboardMetrics as DashboardMetricsType } from '@/services/api/analytics';

interface DashboardMetricsProps {
  metrics: DashboardMetricsType;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, format = 'number' }) => {
  const isPositive = change >= 0;
  const formattedValue = typeof value === 'number' 
    ? format === 'currency' 
      ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : format === 'percentage'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString()
    : value;

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <div className={`flex items-center text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="w-16 h-5 bg-gray-200 rounded"></div>
    </div>
    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
    <div className="w-32 h-8 bg-gray-200 rounded"></div>
  </div>
);

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        change={metrics.revenueChange}
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        format="currency"
      />
      <MetricCard
        title="Occupancy Rate"
        value={metrics.occupancyRate}
        change={metrics.occupancyChange}
        icon={<Percent className="w-6 h-6 text-blue-600" />}
        format="percentage"
      />
      <MetricCard
        title="Active Bookings"
        value={metrics.activeBookings}
        change={metrics.bookingsChange}
        icon={<Calendar className="w-6 h-6 text-blue-600" />}
      />
      <MetricCard
        title="Total Customers"
        value={metrics.totalCustomers}
        change={metrics.customersChange}
        icon={<Users className="w-6 h-6 text-blue-600" />}
      />
    </div>
  );
};
