# Analytics API Documentation

## Overview

The Analytics API service provides comprehensive analytics and reporting functionality for the Campsite Management System. It includes dashboard metrics, revenue analysis, occupancy tracking, customer insights, site performance metrics, and customizable report generation.

**Service Location**: `frontend/src/services/api/analytics.ts`

## Table of Contents

- [Types](#types)
- [API Methods](#api-methods)
- [React Query Integration](#react-query-integration)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

---

## Types

### DashboardMetrics

Overview metrics for the admin dashboard with period-over-period comparisons.

```typescript
interface DashboardMetrics {
  totalRevenue: number;           // Total revenue in current period
  revenueChange: number;          // Percentage change from previous period
  occupancyRate: number;          // Current occupancy rate (0-100)
  occupancyChange: number;        // Percentage change from previous period
  activeBookings: number;         // Number of active bookings
  bookingsChange: number;         // Percentage change from previous period
  totalCustomers: number;         // Total customer count
  customersChange: number;        // Percentage change from previous period
  averageBookingValue: number;    // Average booking value
  averageStayDuration: number;    // Average stay duration in days
}
```

### RevenueMetrics

Detailed revenue analysis with breakdowns and time series data.

```typescript
interface RevenueMetrics {
  total: number;                  // Total revenue for period
  byType: {                       // Revenue breakdown by site type
    siteType: string;
    revenue: number;
    percentage: number;
  }[];
  timeSeries: RevenueDataPoint[]; // Time series data
  growth: number;                 // Growth percentage
}

interface RevenueDataPoint {
  date: string;                   // ISO date string
  revenue: number;                // Revenue for this date
  bookings: number;               // Number of bookings
  siteType?: string;              // Optional site type filter
}
```

### OccupancyMetrics

Occupancy analysis with site type breakdowns and peak day identification.

```typescript
interface OccupancyMetrics {
  overall: number;                // Overall occupancy rate (0-100)
  byType: {                       // Occupancy by site type
    siteType: string;
    occupancyRate: number;
    totalSites: number;
    occupiedSites: number;
  }[];
  timeSeries: OccupancyDataPoint[]; // Time series data
  peakDays: {                     // Days with highest occupancy
    date: string;
    occupancyRate: number;
  }[];
}

interface OccupancyDataPoint {
  date: string;                   // ISO date string
  occupancyRate: number;          // Occupancy rate (0-100)
  totalSites: number;             // Total available sites
  occupiedSites: number;          // Number of occupied sites
  siteType?: string;              // Optional site type filter
}
```

### CustomerInsights

Comprehensive customer analytics including demographics and booking patterns.

```typescript
interface CustomerInsights {
  totalCustomers: number;         // Total customer count
  newCustomers: number;           // New customers in period
  returningCustomers: number;     // Returning customers
  retentionRate: number;          // Customer retention rate (0-100)
  averageLifetimeValue: number;   // Average customer lifetime value
  demographics: {
    ageGroups: {
      range: string;              // e.g., "18-24", "25-34"
      count: number;
      percentage: number;
    }[];
    locations: {
      state: string;              // State/province
      count: number;
      percentage: number;
    }[];
  };
  bookingPatterns: {
    averageStayDuration: number;  // Average stay in days
    preferredSiteTypes: {
      type: string;
      count: number;
      percentage: number;
    }[];
    seasonalTrends: {
      month: string;              // Month name
      bookings: number;           // Booking count
    }[];
  };
}
```

### SitePerformance

Performance metrics for individual campsites.

```typescript
interface SitePerformance {
  siteId: string;                 // Unique site identifier
  siteName: string;               // Site name
  siteType: string;               // Site type (tent, RV, cabin)
  revenue: number;                // Total revenue generated
  bookings: number;               // Number of bookings
  occupancyRate: number;          // Occupancy rate (0-100)
  averageRating: number;          // Average customer rating
  averageStayDuration: number;    // Average stay duration in days
}
```

### Report Types

Report generation and management types.

```typescript
interface ReportType {
  id: string;                     // Report type identifier
  name: string;                   // Display name
  description: string;            // Report description
  category: 'financial' | 'operational' | 'customer' | 'inventory';
  parameters: ReportParameter[];  // Required parameters
}

interface ReportParameter {
  name: string;                   // Parameter name
  label: string;                  // Display label
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number' | 'text';
  required: boolean;              // Is parameter required
  options?: {                     // Options for select types
    value: string;
    label: string;
  }[];
  defaultValue?: any;             // Default value
}

interface ReportConfig {
  reportTypeId: string;           // Report type to generate
  parameters: Record<string, any>; // Parameter values
  format: 'csv' | 'pdf' | 'excel'; // Output format
}

interface GeneratedReport {
  id: string;                     // Report identifier
  reportTypeId: string;           // Report type
  reportName: string;             // Report name
  parameters: Record<string, any>; // Parameters used
  format: string;                 // Output format
  fileUrl: string;                // Download URL
  generatedAt: string;            // Generation timestamp
  expiresAt: string;              // Expiration timestamp
}
```

### Parameter Types

```typescript
interface DateRangeParams {
  startDate: string;              // ISO date string
  endDate: string;                // ISO date string
}

interface RevenueParams extends DateRangeParams {
  groupBy?: 'day' | 'week' | 'month'; // Time grouping
  siteType?: string;              // Filter by site type
}

interface OccupancyParams extends DateRangeParams {
  siteType?: string;              // Filter by site type
}
```

---

## API Methods

### getDashboardMetrics

Get overview metrics for the admin dashboard.

```typescript
getDashboardMetrics(dateRange?: DateRangeParams): Promise<DashboardMetrics>
```

**Parameters:**
- `dateRange` (optional): Date range for metrics calculation

**Returns:** Dashboard metrics with period-over-period comparisons

**Example:**
```typescript
import { getDashboardMetrics } from '@services/api/analytics';

// Get current metrics (default period)
const metrics = await getDashboardMetrics();

// Get metrics for specific date range
const customMetrics = await getDashboardMetrics({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

---

### getRevenueMetrics

Get detailed revenue analysis with breakdowns and trends.

```typescript
getRevenueMetrics(params: RevenueParams): Promise<RevenueMetrics>
```

**Parameters:**
- `params.startDate`: Start date (ISO string)
- `params.endDate`: End date (ISO string)
- `params.groupBy` (optional): Time grouping ('day', 'week', 'month')
- `params.siteType` (optional): Filter by site type

**Returns:** Revenue metrics with time series and breakdowns

**Example:**
```typescript
import { getRevenueMetrics } from '@services/api/analytics';

const revenue = await getRevenueMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  groupBy: 'month',
  siteType: 'RV'
});

console.log(`Total revenue: $${revenue.total}`);
console.log(`Growth: ${revenue.growth}%`);
```

---

### getOccupancyMetrics

Get occupancy analysis with site type breakdowns.

```typescript
getOccupancyMetrics(params: OccupancyParams): Promise<OccupancyMetrics>
```

**Parameters:**
- `params.startDate`: Start date (ISO string)
- `params.endDate`: End date (ISO string)
- `params.siteType` (optional): Filter by site type

**Returns:** Occupancy metrics with time series and peak days

**Example:**
```typescript
import { getOccupancyMetrics } from '@services/api/analytics';

const occupancy = await getOccupancyMetrics({
  startDate: '2024-06-01',
  endDate: '2024-08-31'
});

console.log(`Overall occupancy: ${occupancy.overall}%`);
console.log('Peak days:', occupancy.peakDays);
```

---

### getCustomerInsights

Get comprehensive customer analytics and demographics.

```typescript
getCustomerInsights(dateRange?: DateRangeParams): Promise<CustomerInsights>
```

**Parameters:**
- `dateRange` (optional): Date range for analysis

**Returns:** Customer insights with demographics and booking patterns

**Example:**
```typescript
import { getCustomerInsights } from '@services/api/analytics';

const insights = await getCustomerInsights({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

console.log(`Retention rate: ${insights.retentionRate}%`);
console.log(`Average lifetime value: $${insights.averageLifetimeValue}`);
```

---

### getSitePerformance

Get performance metrics for all campsites.

```typescript
getSitePerformance(dateRange?: DateRangeParams): Promise<SitePerformance[]>
```

**Parameters:**
- `dateRange` (optional): Date range for metrics

**Returns:** Array of site performance metrics

**Example:**
```typescript
import { getSitePerformance } from '@services/api/analytics';

const performance = await getSitePerformance({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Sort by revenue
const topSites = performance.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
```

---

### getReportTypes

Get available report types with their parameters.

```typescript
getReportTypes(): Promise<ReportType[]>
```

**Returns:** Array of available report types

**Example:**
```typescript
import { getReportTypes } from '@services/api/analytics';

const reportTypes = await getReportTypes();

// Find financial reports
const financialReports = reportTypes.filter(r => r.category === 'financial');
```

---

### generateReport

Generate a custom report with specified parameters.

```typescript
generateReport(config: ReportConfig): Promise<GeneratedReport>
```

**Parameters:**
- `config.reportTypeId`: Report type identifier
- `config.parameters`: Report parameters
- `config.format`: Output format ('csv', 'pdf', 'excel')

**Returns:** Generated report metadata with download URL

**Example:**
```typescript
import { generateReport } from '@services/api/analytics';

const report = await generateReport({
  reportTypeId: 'revenue-summary',
  parameters: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    groupBy: 'month'
  },
  format: 'pdf'
});

console.log('Report URL:', report.fileUrl);
```

---

### getReportHistory

Get history of previously generated reports.

```typescript
getReportHistory(): Promise<GeneratedReport[]>
```

**Returns:** Array of generated reports

**Example:**
```typescript
import { getReportHistory } from '@services/api/analytics';

const history = await getReportHistory();

// Get recent reports
const recentReports = history.slice(0, 10);
```

---

### downloadReport

Download a generated report file.

```typescript
downloadReport(reportId: string): Promise<Blob>
```

**Parameters:**
- `reportId`: Report identifier

**Returns:** Report file as Blob

**Example:**
```typescript
import { downloadReport } from '@services/api/analytics';

const blob = await downloadReport('report-123');

// Create download link
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'report.pdf';
link.click();
URL.revokeObjectURL(url);
```

---

## React Query Integration

### Custom Hooks

Create custom hooks for analytics data with React Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics, getRevenueMetrics } from '@services/api/analytics';
import type { DateRangeParams } from '@services/api/analytics';

// Dashboard metrics hook
export const useDashboardMetrics = (dateRange?: DateRangeParams) => {
  return useQuery({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: () => getDashboardMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Revenue metrics hook
export const useRevenueMetrics = (params: RevenueParams) => {
  return useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: () => getRevenueMetrics(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Site performance hook
export const useSitePerformance = (dateRange?: DateRangeParams) => {
  return useQuery({
    queryKey: ['analytics', 'sites', dateRange],
    queryFn: () => getSitePerformance(dateRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Report Generation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateReport } from '@services/api/analytics';

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      // Invalidate report history
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports', 'history'] });
    },
  });
};
```

---

## Usage Examples

### Dashboard Component

```typescript
import { useDashboardMetrics } from '@hooks/useAnalytics';
import { useState } from 'react';

export const Dashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const { data: metrics, isLoading } = useDashboardMetrics(dateRange);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change={metrics.revenueChange}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${metrics.occupancyRate}%`}
          change={metrics.occupancyChange}
        />
        <MetricCard
          title="Active Bookings"
          value={metrics.activeBookings}
          change={metrics.bookingsChange}
        />
      </div>
    </div>
  );
};
```

### Revenue Chart Component

```typescript
import { useRevenueMetrics } from '@hooks/useAnalytics';
import { LineChart } from '@components/charts';

export const RevenueChart = () => {
  const { data: revenue } = useRevenueMetrics({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    groupBy: 'month'
  });

  if (!revenue) return null;

  return (
    <div>
      <h2>Revenue Trends</h2>
      <LineChart
        data={revenue.timeSeries}
        xKey="date"
        yKey="revenue"
      />
      <div className="breakdown">
        {revenue.byType.map(type => (
          <div key={type.siteType}>
            {type.siteType}: ${type.revenue} ({type.percentage}%)
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Report Generator Component

```typescript
import { useGenerateReport, useReportTypes } from '@hooks/useAnalytics';
import { useState } from 'react';

export const ReportGenerator = () => {
  const { data: reportTypes } = useReportTypes();
  const generateReport = useGenerateReport();
  const [selectedType, setSelectedType] = useState('');

  const handleGenerate = async () => {
    const report = await generateReport.mutateAsync({
      reportTypeId: selectedType,
      parameters: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      format: 'pdf'
    });

    // Download report
    window.open(report.fileUrl, '_blank');
  };

  return (
    <div>
      <h2>Generate Report</h2>
      <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
        {reportTypes?.map(type => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      <button onClick={handleGenerate} disabled={generateReport.isPending}>
        {generateReport.isPending ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
};
```

---

## Error Handling

All analytics API methods throw errors that should be handled appropriately:

```typescript
import { getDashboardMetrics } from '@services/api/analytics';
import type { ApiError } from '@services/api/types';

try {
  const metrics = await getDashboardMetrics();
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.statusCode === 403) {
    console.error('Insufficient permissions to view analytics');
  } else if (apiError.statusCode === 400) {
    console.error('Invalid date range:', apiError.message);
  } else {
    console.error('Failed to load analytics:', apiError.message);
  }
}
```

### React Query Error Handling

```typescript
const { data, error, isError } = useDashboardMetrics();

if (isError) {
  return (
    <div className="error">
      <h3>Failed to load dashboard metrics</h3>
      <p>{error.message}</p>
    </div>
  );
}
```

---

## Best Practices

1. **Caching**: Use appropriate `staleTime` values for analytics data (5-10 minutes)
2. **Date Ranges**: Always validate date ranges before making API calls
3. **Loading States**: Show loading indicators for better UX
4. **Error Boundaries**: Wrap analytics components in error boundaries
5. **Permissions**: Check user permissions before displaying analytics
6. **Real-time Updates**: Subscribe to `metrics:updated` WebSocket event for live data
7. **Report Expiration**: Check `expiresAt` timestamp before using report URLs
8. **Performance**: Use pagination and filtering for large datasets

---

## Related Documentation

- [WebSocket Events](./websocket.md) - Real-time analytics updates
- [API Client Types](./README.md#frontend-api-client) - Core API types
- [User Guide: Analytics](../user-guide/analytics.md) - End-user analytics guide
