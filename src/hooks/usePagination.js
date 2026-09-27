import { useState, useEffect, useMemo } from 'react';

/**
 * Generyczny hook do paginacji typu "Load more"
 * @param {Array} items - Pełna lista odfiltrowanych elementów
 * @param {number} itemsPerPage - Liczba elementów na stronę (domyślnie 30)
 * @param {Array} resetDependencies - Tablica zależności, których zmiana resetuje stronę do 1
 * @returns {Object} - Zwraca { currentItems, hasMore, loadMore, currentPage, setCurrentPage }
 */
export function usePagination(items = [], itemsPerPage = 30, resetDependencies = []) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, resetDependencies);

  const currentItems = useMemo(() => {
    return items.slice(0, currentPage * itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const hasMore = currentItems.length < items.length;

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  return {
    currentItems,
    hasMore,
    loadMore,
    currentPage,
    setCurrentPage
  };
}
