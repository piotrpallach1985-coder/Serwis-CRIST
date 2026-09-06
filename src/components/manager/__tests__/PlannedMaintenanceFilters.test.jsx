import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlannedMaintenanceFilters from '../PlannedMaintenanceFilters';

describe('PlannedMaintenanceFilters', () => {
  const defaultProps = {
    isArchive: false,
    filterTime: 'all',
    setFilterTime: vi.fn(),
    filterRegion: '',
    setFilterRegion: vi.fn(),
    filterMachine: '',
    setFilterMachine: vi.fn(),
    clearFilters: vi.fn(),
    showColumnMenu: false,
    setShowColumnMenu: vi.fn(),
    columns: { name: true, machine: true },
    toggleColumn: vi.fn(),
    regions: [{ id: 'R1', name: 'Rejon 1' }],
    machines: [{ id: 'M1', name: 'Maszyna 1' }],
    viewMode: 'list',
    setViewMode: vi.fn(),
  };

  it('renders time filters when not in archive', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} />);
    expect(screen.getByText(/Najbliższe 30 dni/i)).toBeInTheDocument();
  });

  it('hides time filters when in archive', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} isArchive={true} />);
    expect(screen.queryByText(/Najbliższe 30 dni/i)).not.toBeInTheDocument();
  });

  it('calls setFilterTime when a time filter is clicked', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} />);
    fireEvent.click(screen.getByText(/Najbliższe 30 dni/i));
    expect(defaultProps.setFilterTime).toHaveBeenCalledWith('30');
  });

  it('shows clear filters button if filters are active', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} filterTime="30" />);
    const clearBtn = screen.getByText(/Wyczyść filtry/i);
    expect(clearBtn).toBeInTheDocument();
    
    fireEvent.click(clearBtn);
    expect(defaultProps.clearFilters).toHaveBeenCalled();
  });

  it('toggles column menu', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} />);
    const colBtn = screen.getByText(/Kolumny/i);
    fireEvent.click(colBtn);
    expect(defaultProps.setShowColumnMenu).toHaveBeenCalledWith(true);
  });

  it('triggers column toggle when checkbox is clicked', () => {
    render(<PlannedMaintenanceFilters {...defaultProps} showColumnMenu={true} />);
    const typeCheckbox = screen.getByLabelText(/Typ Serwisu/i);
    fireEvent.click(typeCheckbox);
    expect(defaultProps.toggleColumn).toHaveBeenCalledWith('name');
  });
});
