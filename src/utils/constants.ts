// Status constants
export const STATUS = {
    // Delivery Status
    DELIVERY: {
        PENDING: 'PENDING',
        DEVELOPMENT: 'DEVELOPMENT',
        DELIVERED: 'DELIVERED',
        HOMOLOGATION: 'HOMOLOGATION',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        PRODUCTION: 'PRODUCTION',
    },

    // Project Status
    PROJECT: {
        PLANNING: 'PLANNING',
        IN_PROGRESS: 'IN_PROGRESS',
        ON_HOLD: 'ON_HOLD',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
    },

    // Requester Status
    REQUESTER: {
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        SUSPENDED: 'SUSPENDED',
        PENDING_APPROVAL: 'PENDING_APPROVAL',
    },
} as const;

// Priority constants
export const PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
} as const;

// Status labels for display
export const STATUS_LABELS = {
    // Delivery Labels
    PENDING: 'Pendente',
    DEVELOPMENT: 'Desenvolvimento',
    DELIVERED: 'Entregue',
    HOMOLOGATION: 'Homologação',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    PRODUCTION: 'Produção',

    // Project Labels
    PLANNING: 'Planejamento',

    // Requester Labels
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
    PENDING_APPROVAL: 'Aguardando Aprovação',
} as const;

// Priority labels
export const PRIORITY_LABELS = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
} as const;

// Color mappings for status badges
export const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    DEVELOPMENT: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    HOMOLOGATION: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PRODUCTION: 'bg-emerald-100 text-emerald-800',

    PLANNING: 'bg-indigo-100 text-indigo-800',

    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
} as const;

// Priority colors
export const PRIORITY_COLORS = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
} as const;

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile',
    },
    REQUESTERS: '/requesters',
    TASKS: '/tasks',
    PROJECTS: '/projects',
    DELIVERIES: '/deliveries',
    BILLING_PERIODS: '/billing-periods',
    BILLING_TASKS: '/billing-period-tasks',
} as const;

// Form validation limits
export const VALIDATION_LIMITS = {
    NAME_MAX_LENGTH: 200,
    EMAIL_MAX_LENGTH: 200,
    PHONE_MAX_LENGTH: 20,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    CODE_MAX_LENGTH: 50,
    URL_MAX_LENGTH: 500,
    STATUS_MAX_LENGTH: 30,
    AMOUNT_MAX: 999999.99,
    AMOUNT_MIN: 0.01,
} as const;

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
    API: 'yyyy-MM-dd',
    API_WITH_TIME: 'yyyy-MM-ddTHH:mm:ss',
} as const;

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_PAGE_SIZE: 100,
} as const;

// File upload constants
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    MAX_FILES: 5,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth.token',
    AUTH_USER: 'auth.user',
    THEME: 'app.theme',
    LANGUAGE: 'app.language',
    SIDEBAR_COLLAPSED: 'ui.sidebar.collapsed',
} as const;

// Theme constants
export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const;

// Language constants
export const LANGUAGES = {
    PT_BR: 'pt-BR',
    EN_US: 'en-US',
} as const;

// Currency constants
export const CURRENCY = {
    BRL: {
        code: 'BRL',
        symbol: 'R$',
        locale: 'pt-BR',
    },
    USD: {
        code: 'USD',
        symbol: '$',
        locale: 'en-US',
    },
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^(\+?[0-9\-(). ]*)?$/,
    URL: /^https?:\/\/.+/,
    CODE: /^[A-Z0-9-_]+$/i,
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

// Breakpoints (px)
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
} as const;