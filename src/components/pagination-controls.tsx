import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onGoToPage: (page: number) => void;
  onGoToNextPage: () => void;
  onGoToPreviousPage: () => void;
  onGoToFirstPage: () => void;
  onGoToLastPage: () => void;
  itemsPerPage?: number;
  onSetItemsPerPage?: (count: number) => void;
  totalItems?: number;
  loading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onGoToPage,
  onGoToNextPage,
  onGoToPreviousPage,
  onGoToFirstPage,
  onGoToLastPage,
  itemsPerPage,
  onSetItemsPerPage,
  totalItems,
  loading = false,
}: PaginationControlsProps) {
  // Calculate page numbers to show (max 7: first, last, current, and 2 before/after current)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

  if (totalPages <= 1 && !loading) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
      {/* Items per page selector */}
      {itemsPerPage && onSetItemsPerPage && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="items-per-page" className="text-neutral-600 dark:text-neutral-400">
            Show:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onSetItemsPerPage(Number(e.target.value))}
            className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-neutral-600 dark:text-neutral-400">
            per page
          </span>
        </div>
      )}

      {/* Page info */}
      {totalItems && itemsPerPage && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{startItem}</span> to{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{endItem}</span> of{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{totalItems}</span> items
        </div>
      )}

      {/* Pagination buttons */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <button
          onClick={onGoToFirstPage}
          disabled={!hasPreviousPage || loading}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          aria-label="Go to first page"
        >
          ««
        </button>

        {/* Previous page */}
        <button
          onClick={onGoToPreviousPage}
          disabled={!hasPreviousPage || loading}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          aria-label="Go to previous page"
        >
          ‹
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-neutral-400">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onGoToPage(pageNum)}
                disabled={loading}
                className={`px-3 py-1.5 border rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={`Go to page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={onGoToNextPage}
          disabled={!hasNextPage || loading}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          aria-label="Go to next page"
        >
          ›
        </button>

        {/* Last page */}
        <button
          onClick={onGoToLastPage}
          disabled={!hasNextPage || loading}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          aria-label="Go to last page"
        >
          »»
        </button>
      </div>
    </div>
  );
}
