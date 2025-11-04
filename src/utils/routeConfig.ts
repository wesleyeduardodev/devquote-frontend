/**
 * Configuração centralizada de rotas com suas respectivas permissões
 */

export interface RouteConfig {
  path: string;
  requiredScreen?: string;
  requiredScreens?: string[];
  requireAllScreens?: boolean;
  component: React.ComponentType<any>;
}

/**
 * Mapeamento de telas para códigos do backend
 */
export const SCREEN_CODES = {
  DASHBOARD: 'dashboard',
  TASKS: 'tasks',
  PROJECTS: 'projects', 
  DELIVERIES: 'deliveries',
  BILLING: 'billing',
  USERS: 'users',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;

/**
 * Mapeamento de recursos para operações
 */
export const RESOURCE_OPERATIONS = {
  CREATE: 'CREATE',
  READ: 'READ', 
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  BULK: 'BULK'
} as const;

/**
 * Mapeamento de recursos do sistema
 */
export const RESOURCES = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  DELIVERIES: 'deliveries',
  BILLING: 'billing',
  USERS: 'users',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;

/**
 * Perfis do sistema
 */
export const PROFILES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER', 
  USER: 'USER'
} as const;

/**
 * Configuração de permissões por perfil
 * Baseado na lógica do backend
 */
export const PROFILE_PERMISSIONS = {
  [PROFILES.ADMIN]: {
    screens: [
      SCREEN_CODES.DASHBOARD,
      SCREEN_CODES.TASKS,
      SCREEN_CODES.PROJECTS,
      SCREEN_CODES.DELIVERIES,
      SCREEN_CODES.BILLING,
      SCREEN_CODES.USERS,
      SCREEN_CODES.REPORTS,
      SCREEN_CODES.SETTINGS
    ],
    resources: [
      RESOURCES.TASKS,
      RESOURCES.PROJECTS,
      RESOURCES.DELIVERIES,
      RESOURCES.BILLING,
      RESOURCES.USERS,
      RESOURCES.REPORTS,
      RESOURCES.SETTINGS
    ]
  },
  [PROFILES.MANAGER]: {
    screens: [
      SCREEN_CODES.DASHBOARD,
      SCREEN_CODES.TASKS,
      SCREEN_CODES.DELIVERIES,
      SCREEN_CODES.BILLING
    ],
    resources: [
      RESOURCES.TASKS,
      RESOURCES.DELIVERIES,
      RESOURCES.BILLING
    ]
  },
  [PROFILES.USER]: {
    screens: [
      SCREEN_CODES.DASHBOARD,
      SCREEN_CODES.TASKS,
      SCREEN_CODES.DELIVERIES
    ],
    resources: [
      RESOURCES.TASKS,
      RESOURCES.DELIVERIES
    ]
  }
} as const;

/**
 * Configuração de mensagens de erro personalizadas
 */
export const ACCESS_DENIED_MESSAGES = {
  SCREEN: {
    [SCREEN_CODES.BILLING]: 'Você não tem acesso à área de faturamento.',
    [SCREEN_CODES.USERS]: 'Você não tem acesso ao gerenciamento de usuários.',
    [SCREEN_CODES.SETTINGS]: 'Você não tem acesso às configurações do sistema.',
    [SCREEN_CODES.REPORTS]: 'Você não tem acesso aos relatórios.',
    DEFAULT: 'Você não tem permissão para acessar esta área.'
  },
  RESOURCE: {
    CREATE: 'Você não tem permissão para criar novos registros.',
    UPDATE: 'Você não tem permissão para editar registros.',
    DELETE: 'Você não tem permissão para excluir registros.',
    BULK: 'Você não tem permissão para operações em lote.',
    DEFAULT: 'Você não tem permissão para executar esta operação.'
  }
} as const;