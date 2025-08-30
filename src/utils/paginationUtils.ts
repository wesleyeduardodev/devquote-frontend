/**
 * Utility functions for pagination display
 * Backend uses 0-based indexing, but UI should show 1-based to users
 */

export const getDisplayPageNumber = (currentPage: number, totalPages: number): number => {
    return totalPages > 0 ? currentPage + 1 : 0;
};

export const formatPaginationText = (currentPage: number, totalPages: number): string => {
    const displayPage = getDisplayPageNumber(currentPage, totalPages);
    return `Página ${displayPage} de ${totalPages}`;
};

export const formatMobilePaginationText = (currentPage: number, totalPages: number): string => {
    const displayPage = getDisplayPageNumber(currentPage, totalPages);
    return `${displayPage}/${totalPages}`;
};