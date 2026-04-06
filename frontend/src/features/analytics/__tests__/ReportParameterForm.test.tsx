import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReportType } from '@/services/api/analytics';
import { ReportParameterForm } from '../ReportParameterForm';

const mockReportType: ReportType = {
  id: 'test-report',
  name: 'Test Report',
  description: 'A test report',
  category: 'financial',
  parameters: [
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'dateRange', label: 'Date Range', type: 'dateRange', required: false },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    { name: 'tags', label: 'Tags', type: 'multiSelect', required: false, options: [{ value: 'tag1', label: 'Tag 1' }, { value: 'tag2', label: 'Tag 2' }] },
    { name: 'count', label: 'Count', type: 'number', required: false },
    { name: 'notes', label: 'Notes', type: 'text', required: false },
  ],
};

describe('ReportParameterForm', () => {
  it('renders all field types', () => {
    render(<ReportParameterForm reportType={mockReportType} onSubmit={vi.fn()} />);

    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('shows required asterisks', () => {
    render(<ReportParameterForm reportType={mockReportType} onSubmit={vi.fn()} />);

    const startLabel = screen.getByText('Start Date').closest('label');
    const statusLabel = screen.getByText('Status').closest('label');

    expect(startLabel).toHaveTextContent('*');
    expect(statusLabel).toHaveTextContent('*');
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ReportParameterForm reportType={mockReportType} onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: /generate report/i }));

    expect(screen.getByText('Start Date is required')).toBeInTheDocument();
    expect(screen.getByText('Status is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with parameters when valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    const reportTypeWithDefaults: ReportType = {
      ...mockReportType,
      parameters: [
        { name: 'notes', label: 'Notes', type: 'text', required: true, defaultValue: 'test' },
      ],
    };
    render(<ReportParameterForm reportType={reportTypeWithDefaults} onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: /generate report/i }));

    expect(handleSubmit).toHaveBeenCalledWith({ notes: 'test' });
  });

  it('initializes parameters with default values', () => {
    const reportTypeWithDefaults: ReportType = {
      ...mockReportType,
      parameters: [
        { name: 'count', label: 'Count', type: 'number', required: false, defaultValue: 42 },
        { name: 'notes', label: 'Notes', type: 'text', required: false, defaultValue: 'hello' },
      ],
    };
    render(<ReportParameterForm reportType={reportTypeWithDefaults} onSubmit={vi.fn()} />);

    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ReportParameterForm reportType={mockReportType} onSubmit={vi.fn()} loading />);

    const button = screen.getByRole('button', { name: /generating/i });
    expect(button).toBeDisabled();
  });
});
