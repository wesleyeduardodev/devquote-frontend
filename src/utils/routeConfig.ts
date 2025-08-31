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
 * Utilitários para verificação de permissões
 */
export class PermissionUtils {
  /**
   * Verifica se um perfil tem acesso a uma tela
   */
  static profileHasScreen(profile: keyof typeof PROFILES, screen: string): boolean {
    return PROFILE_PERMISSIONS[profile]?.screens.includes(screen as any) ?? false;
  }

  /**
   * Verifica se um perfil tem acesso a um recurso
   */
  static profileHasResource(profile: keyof typeof PROFILES, resource: string): boolean {
    return PROFILE_PERMISSIONS[profile]?.resources.includes(resource as any) ?? false;
  }

  /**
   * Retorna todas as telas permitidas para um perfil
   */
  static getScreensForProfile(profile: keyof typeof PROFILES): string[] {
    return [...(PROFILE_PERMISSIONS[profile]?.screens ?? [])];
  }

  /**
   * Retorna todos os recursos permitidos para um perfil
   */
  static getResourcesForProfile(profile: keyof typeof PROFILES): string[] {
    return [...(PROFILE_PERMISSIONS[profile]?.resources ?? [])];
  }

  /**
   * Verifica se uma operação é permitida para um recurso
   * Por padrão, todos os perfis têm todas as operações nos recursos que podem acessar
   */
  static hasResourceOperation(resource: string, operation: string): boolean {
    return Object.values(RESOURCE_OPERATIONS).includes(operation as any);
  }
}

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

/**
 * Helper para obter mensagem de acesso negado
 */
export function getAccessDeniedMessage(
  type: 'SCREEN' | 'RESOURCE',
  key?: string
): string {
  if (type === 'SCREEN' && key) {
    return ACCESS_DENIED_MESSAGES.SCREEN[key as keyof typeof ACCESS_DENIED_MESSAGES.SCREEN] 
      || ACCESS_DENIED_MESSAGES.SCREEN.DEFAULT;
  }
  
  if (type === 'RESOURCE' && key) {
    return ACCESS_DENIED_MESSAGES.RESOURCE[key as keyof typeof ACCESS_DENIED_MESSAGES.RESOURCE]
      || ACCESS_DENIED_MESSAGES.RESOURCE.DEFAULT;
  }
  
  return 'Acesso negado.';
}