import { useAuth } from './useAuth';

/**
 * Hook especializado para verificação de permissões de telas
 */
export function useScreenPermissions() {
  const { hasScreenAccess, hasAnyScreenAccess } = useAuth();

  return {
    // Verificações por tela específica
    canAccessDashboard: () => hasScreenAccess('dashboard'),
    canAccessTasks: () => hasScreenAccess('tasks'),
    canAccessProjects: () => hasScreenAccess('projects'),
    canAccessQuotes: () => hasScreenAccess('quotes'),
    canAccessDeliveries: () => hasScreenAccess('deliveries'),
    canAccessBilling: () => hasScreenAccess('billing'),
    canAccessUsers: () => hasScreenAccess('users'),
    canAccessReports: () => hasScreenAccess('reports'),
    canAccessSettings: () => hasScreenAccess('settings'),
    
    // Verificações genéricas
    hasScreenAccess,
    hasAnyScreenAccess,
    
    // Verificações de grupos de telas
    canAccessManagement: () => hasAnyScreenAccess(['users', 'settings']),
    canAccessCore: () => hasAnyScreenAccess(['tasks', 'projects', 'quotes', 'deliveries']),
    canAccessFinancial: () => hasAnyScreenAccess(['billing', 'reports'])
  };
}

/**
 * Hook especializado para verificação de permissões de recursos/operações
 */
export function useResourcePermissions() {
  const { hasResourcePermission, hasAnyResourcePermission } = useAuth();

  return {
    // Tasks permissions
    canCreateTask: () => hasResourcePermission('tasks', 'CREATE'),
    canReadTask: () => hasResourcePermission('tasks', 'READ'),
    canUpdateTask: () => hasResourcePermission('tasks', 'UPDATE'),
    canDeleteTask: () => hasResourcePermission('tasks', 'DELETE'),
    canBulkTask: () => hasResourcePermission('tasks', 'BULK'),
    hasAnyTaskPermission: () => hasAnyResourcePermission('tasks', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK']),
    
    // Projects permissions
    canCreateProject: () => hasResourcePermission('projects', 'CREATE'),
    canReadProject: () => hasResourcePermission('projects', 'READ'),
    canUpdateProject: () => hasResourcePermission('projects', 'UPDATE'),
    canDeleteProject: () => hasResourcePermission('projects', 'DELETE'),
    canBulkProject: () => hasResourcePermission('projects', 'BULK'),
    hasAnyProjectPermission: () => hasAnyResourcePermission('projects', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK']),
    
    // Quotes permissions
    canCreateQuote: () => hasResourcePermission('quotes', 'CREATE'),
    canReadQuote: () => hasResourcePermission('quotes', 'READ'),
    canUpdateQuote: () => hasResourcePermission('quotes', 'UPDATE'),
    canDeleteQuote: () => hasResourcePermission('quotes', 'DELETE'),
    canBulkQuote: () => hasResourcePermission('quotes', 'BULK'),
    hasAnyQuotePermission: () => hasAnyResourcePermission('quotes', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK']),
    
    // Deliveries permissions
    canCreateDelivery: () => hasResourcePermission('deliveries', 'CREATE'),
    canReadDelivery: () => hasResourcePermission('deliveries', 'READ'),
    canUpdateDelivery: () => hasResourcePermission('deliveries', 'UPDATE'),
    canDeleteDelivery: () => hasResourcePermission('deliveries', 'DELETE'),
    canBulkDelivery: () => hasResourcePermission('deliveries', 'BULK'),
    hasAnyDeliveryPermission: () => hasAnyResourcePermission('deliveries', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK']),
    
    // Billing permissions
    canCreateBilling: () => hasResourcePermission('billing', 'CREATE'),
    canReadBilling: () => hasResourcePermission('billing', 'READ'),
    canUpdateBilling: () => hasResourcePermission('billing', 'UPDATE'),
    canDeleteBilling: () => hasResourcePermission('billing', 'DELETE'),
    canBulkBilling: () => hasResourcePermission('billing', 'BULK'),
    hasAnyBillingPermission: () => hasAnyResourcePermission('billing', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK']),
    
    // Generic permissions
    hasResourcePermission,
    hasAnyResourcePermission
  };
}

/**
 * Hook especializado para verificação de permissões de campos
 */
export function useFieldPermissions() {
  const { getFieldPermission, canEditField } = useAuth();

  return {
    getFieldPermission,
    canEditField,
    
    // Helpers para verificação específica
    isFieldHidden: (resource: string, field: string) => getFieldPermission(resource, field) === 'HIDDEN',
    isFieldReadOnly: (resource: string, field: string) => getFieldPermission(resource, field) === 'READ',
    isFieldEditable: (resource: string, field: string) => getFieldPermission(resource, field) === 'EDIT',
    
    // Filtrar campos por permissão
    filterEditableFields: (resource: string, fields: string[]) => {
      return fields.filter(field => canEditField(resource, field));
    },
    filterVisibleFields: (resource: string, fields: string[]) => {
      return fields.filter(field => getFieldPermission(resource, field) !== 'HIDDEN');
    }
  };
}

/**
 * Hook especializado para verificação de perfis
 */
export function useProfilePermissions() {
  const { hasProfile, hasAnyProfile } = useAuth();

  return {
    isAdmin: () => hasProfile('ADMIN'),
    isManager: () => hasProfile('MANAGER'),
    isUser: () => hasProfile('USER'),
    
    hasProfile,
    hasAnyProfile,
    
    // Verificações de grupos
    hasAdminAccess: () => hasProfile('ADMIN'),
    hasManagementAccess: () => hasAnyProfile(['ADMIN', 'MANAGER']),
    hasBasicAccess: () => hasAnyProfile(['ADMIN', 'MANAGER', 'USER'])
  };
}

/**
 * Hook agregador que combina todas as verificações de permissão
 */
export function usePermissions() {
  const screenPermissions = useScreenPermissions();
  const resourcePermissions = useResourcePermissions();
  const fieldPermissions = useFieldPermissions();
  const profilePermissions = useProfilePermissions();

  return {
    screen: screenPermissions,
    resource: resourcePermissions,
    field: fieldPermissions,
    profile: profilePermissions
  };
}