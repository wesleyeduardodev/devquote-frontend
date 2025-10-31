// Currency formatters
export const formatCurrency = (value: number | string, currency: string = 'BRL'): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return 'R$ 0,00';

    const localeMap: Record<string, string> = {
        BRL: 'pt-BR',
        USD: 'en-US',
        EUR: 'de-DE',
    };

    return new Intl.NumberFormat(localeMap[currency] || 'pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};

// Number formatters
export const formatNumber = (value: number | string, decimals: number = 0): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0';

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
};

export const formatPercentage = (value: number | string, decimals: number = 1): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0%';

    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue / 100);
};

// Date formatters
export const formatDate = (date: Date | string | null | undefined, format: string = 'dd/MM/yyyy'): string => {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '-';

    switch (format) {
        case 'dd/MM/yyyy':
            return dateObj.toLocaleDateString('pt-BR');
        case 'dd/MM/yyyy HH:mm':
            return dateObj.toLocaleString('pt-BR');
        case 'yyyy-MM-dd':
            return dateObj.toISOString().split('T')[0];
        case 'relative':
            return formatRelativeDate(dateObj);
        default:
            return dateObj.toLocaleDateString('pt-BR');
    }
};

/**
 * Formata uma data de input (formato YYYY-MM-DD) para dd/MM/yyyy
 * Trata a data como local, evitando problemas de timezone
 */
export const formatInputDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';

    // Parse manual para evitar problemas de timezone
    const parts = dateString.split('-');
    if (parts.length !== 3) return '-';

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
    return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatDateShort = (date: Date | string | null | undefined): string => {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '-';

    return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
};

export const formatRelativeDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();

    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    if (diff < minute) return 'agora';
    if (diff < hour) return `${Math.floor(diff / minute)} min atrás`;
    if (diff < day) return `${Math.floor(diff / hour)} h atrás`;
    if (diff < week) return `${Math.floor(diff / day)} dias atrás`;
    if (diff < month) return `${Math.floor(diff / week)} semanas atrás`;
    if (diff < year) return `${Math.floor(diff / month)} meses atrás`;

    return `${Math.floor(diff / year)} anos atrás`;
};

// Time formatters
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}min`;
};

export const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}min`;

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) return `${wholeHours}h`;

    return `${wholeHours}h ${minutes}min`;
};

// Text formatters
export const formatName = (name: string): string => {
    if (!name) return '';

    return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const formatInitials = (name: string): string => {
    if (!name) return '';

    const words = name.trim().split(' ').filter(word => word.length > 0);

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const formatPhone = (phone: string): string => {
    if (!phone) return '';

    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');

    // Formato brasileiro
    if (numbers.length === 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    if (numbers.length === 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    return phone;
};

export const formatCPF = (cpf: string): string => {
    if (!cpf) return '';

    const numbers = cpf.replace(/\D/g, '');

    if (numbers.length === 11) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }

    return cpf;
};

export const formatCNPJ = (cnpj: string): string => {
    if (!cnpj) return '';

    const numbers = cnpj.replace(/\D/g, '');

    if (numbers.length === 14) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
    }

    return cnpj;
};

export const formatCEP = (cep: string): string => {
    if (!cep) return '';

    const numbers = cep.replace(/\D/g, '');

    if (numbers.length === 8) {
        return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }

    return cep;
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// URL formatter
export const formatUrl = (url: string): string => {
    if (!url) return '';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }

    return url;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;

    return `${text.substring(0, maxLength)}...`;
};

// Format code (for task codes, etc.)
export const formatCode = (code: string): string => {
    if (!code) return '';

    return code.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
};

// Status formatter
export const formatStatus = (status: string): string => {
    if (!status) return '';

    const statusLabels: Record<string, string> = {
        PENDING: 'Pendente',
        IN_PROGRESS: 'Em Progresso',
        DEVELOPMENT: 'Desenvolvimento',
        DELIVERED: 'Entregue',
        HOMOLOGATION: 'Homologação',
        PRODUCTION: 'Produção',
        COMPLETED: 'Concluído',
        CANCELLED: 'Cancelado',
        ON_HOLD: 'Em Espera',
        DRAFT: 'Rascunho',
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
        TESTING: 'Em Teste',
        ACTIVE: 'Ativo',
        INACTIVE: 'Inativo',
    };

    return statusLabels[status] || status;
};

// Priority formatter
export const formatPriority = (priority: string): string => {
    if (!priority) return '';

    const priorityLabels: Record<string, string> = {
        LOW: 'Baixa',
        MEDIUM: 'Média',
        HIGH: 'Alta',
        URGENT: 'Urgente',
    };

    return priorityLabels[priority] || priority;
};