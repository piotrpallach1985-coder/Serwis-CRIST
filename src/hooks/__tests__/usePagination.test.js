import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePagination } from '../usePagination';

describe('usePagination Hook', () => {
  const dummyItems = Array.from({ length: 120 }, (_, i) => i + 1); // [1, 2, ..., 120]

  it('powinien poczatkowo zwrocic domyslna liczbe elementow (30)', () => {
    const { result } = renderHook(() => usePagination(dummyItems));
    
    expect(result.current.currentItems.length).toBe(30);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasMore).toBe(true);
  });

  it('powinien doczytac kolejna paczke po wywolaniu loadMore', () => {
    const { result } = renderHook(() => usePagination(dummyItems, 50));
    
    expect(result.current.currentItems.length).toBe(50);
    
    act(() => {
      result.current.loadMore();
    });
    
    expect(result.current.currentItems.length).toBe(100);
    expect(result.current.hasMore).toBe(true);
    
    act(() => {
      result.current.loadMore();
    });
    
    expect(result.current.currentItems.length).toBe(120);
    expect(result.current.hasMore).toBe(false); // Brak wiecej elementow
  });

  it('powinien zresetowac paginacje gdy zmieniaja sie zaleznosci', () => {
    let deps = ['filter1'];
    const { result, rerender } = renderHook(() => usePagination(dummyItems, 50, deps));
    
    act(() => { result.current.loadMore(); });
    expect(result.current.currentPage).toBe(2);
    
    // Zmieniamy zaleznosc
    deps = ['filter2'];
    rerender();
    
    // Strona powinna wrocic do 1
    expect(result.current.currentPage).toBe(1);
    expect(result.current.currentItems.length).toBe(50);
  });
});
