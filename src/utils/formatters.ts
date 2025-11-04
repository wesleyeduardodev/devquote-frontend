
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

export const formatNumber = (value: number | string, decimals: number = 0): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0';

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
};

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

export const formatInputDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';

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

export const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}min`;

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) return `${wholeHours}h`;

    return `${wholeHours}h ${minutes}min`;
};

export const formatName = (name: string): string => {
    if (!name) return '';

    return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const formatPhone = (phone: string): string => {
    if (!phone) return '';

    const numbers = phone.replace(/\D/g, '');

    if (numbers.length === 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    if (numbers.length === 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    return phone;
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;

    return `${text.substring(0, maxLength)}...`;
};

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