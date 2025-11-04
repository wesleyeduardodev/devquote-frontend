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

export const formatRecordCountText = (
    currentPage: number, 
    pageSize: number, 
    totalElements: number
): string => {
    if (totalElements === 0) {
        return "Nenhum registro encontrado";
    }
    
    const startRecord = (currentPage * pageSize) + 1;
    const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);
    
    return `${startRecord}-${endRecord} de ${totalElements} registro${totalElements !== 1 ? 's' : ''}`;
};

export const formatMobileRecordCountText = (
    currentPage: number, 
    pageSize: number, 
    totalElements: number
): string => {
    if (totalElements === 0) {
        return "0 registros";
    }
    
    const startRecord = (currentPage * pageSize) + 1;
    const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);
    
    return `${startRecord}-${endRecord} de ${totalElements}`;
};