import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyContextForm, CompanyContextFormData } from '../components/pages/CompanyContextForm';
import * as apiService from '../utils/api-service';
import * as companiesCache from '../utils/companiesCache';

// Mock the API and cache modules
vi.mock('../utils/api-service');
vi.mock('../utils/companiesCache');

describe('CompanyContextForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock cached companies
    vi.mocked(companiesCache.getCachedCompanies).mockReturnValue([
      { id: 'uber', name: 'Uber' },
      { id: 'airbnb', name: 'Airbnb' }
    ]);
  });

  it('should render company selection buttons', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check for fixed company buttons
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('should render role selection buttons', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check for role buttons
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('should have default company and role selected', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Meta should be selected by default
    const metaButton = screen.getByRole('button', { name: /Meta/i });
    expect(metaButton.className).toContain('bg-indigo-50');

    // Backend should be selected by default
    const backendButton = screen.getByText('Backend').closest('button');
    expect(backendButton?.className).toContain('bg-indigo-50');
  });

  it('should update selection when clicking different company', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const appleButton = screen.getByRole('button', { name: /Apple/i });
    fireEvent.click(appleButton);

    expect(appleButton.className).toContain('bg-indigo-50');
  });

  it('should update selection when clicking different role', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const mlButton = screen.getByText('Machine Learning').closest('button');
    if (mlButton) {
      fireEvent.click(mlButton);
      expect(mlButton.className).toContain('bg-indigo-50');
    }
  });

  it('should submit form with both company and roleFamily', async () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select Google company
    const googleButton = screen.getByRole('button', { name: /Google/i });
    fireEvent.click(googleButton);

    // Select Frontend role
    const frontendButton = screen.getByText('Frontend').closest('button');
    if (frontendButton) {
      fireEvent.click(frontendButton);
    }

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Get Random Problem/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        company: 'google',
        roleFamily: 'frontend'
      } as CompanyContextFormData);
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <CompanyContextForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});