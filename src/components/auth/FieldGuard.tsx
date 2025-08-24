import React, { ReactNode, cloneElement, isValidElement } from 'react';
import { useAuth } from '@/hooks/useAuth';

type FieldGuardProps = {
  children: ReactNode;
  resource: string;
  field: string;
  fallback?: ReactNode;
};

/**
 * Componente que controla a visibilidade de campos baseado em permissões
 */
export function FieldGuard({ children, resource, field, fallback }: FieldGuardProps) {
  const { getFieldPermission } = useAuth();
  const permission = getFieldPermission(resource, field);

  if (permission === 'HIDDEN') {
    return fallback ? <>{fallback}</> : null;
  }

  // Se o campo é READ-ONLY e é um elemento de input, aplicar readonly
  if (permission === 'READ' && isValidElement(children)) {
    const element = children as React.ReactElement<any>;
    
    // Lista de elementos de input que suportam readonly
    const inputElements = ['input', 'textarea', 'select'];
    
    if (inputElements.includes(element.type as string)) {
      return cloneElement(element, {
        ...element.props,
        readOnly: true,
        disabled: element.props.disabled || false,
        className: `${element.props.className || ''} bg-gray-50 cursor-not-allowed`.trim()
      });
    }
  }

  return <>{children}</>;
}

type ConditionalFieldProps = {
  children: ReactNode;
  resource: string;
  field: string;
  whenEditable?: ReactNode;
  whenReadOnly?: ReactNode;
  whenHidden?: ReactNode;
};

/**
 * Componente que renderiza conteúdo diferente baseado na permissão do campo
 */
export function ConditionalField({ 
  children, 
  resource, 
  field,
  whenEditable,
  whenReadOnly,
  whenHidden
}: ConditionalFieldProps) {
  const { getFieldPermission } = useAuth();
  const permission = getFieldPermission(resource, field);

  switch (permission) {
    case 'HIDDEN':
      return whenHidden ? <>{whenHidden}</> : null;
    
    case 'READ':
      return whenReadOnly ? <>{whenReadOnly}</> : <>{children}</>;
    
    case 'EDIT':
    default:
      return whenEditable ? <>{whenEditable}</> : <>{children}</>;
  }
}

type FieldLabelProps = {
  resource: string;
  field: string;
  label: string;
  required?: boolean;
  className?: string;
};

/**
 * Label que só aparece se o campo não estiver oculto
 */
export function ProtectedFieldLabel({ 
  resource, 
  field, 
  label, 
  required = false,
  className = ""
}: FieldLabelProps) {
  const { getFieldPermission } = useAuth();
  const permission = getFieldPermission(resource, field);

  if (permission === 'HIDDEN') {
    return null;
  }

  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`}>
      {label}
      {required && permission === 'EDIT' && (
        <span className="text-red-500 ml-1">*</span>
      )}
      {permission === 'READ' && (
        <span className="text-gray-400 text-xs ml-2">(somente leitura)</span>
      )}
    </label>
  );
}

/**
 * Hook para aplicar permissões de campo em formulários
 */
export function useFieldPermissions() {
  const { getFieldPermission, canEditField } = useAuth();

  const getFieldProps = (resource: string, field: string) => {
    const permission = getFieldPermission(resource, field);
    
    return {
      hidden: permission === 'HIDDEN',
      readOnly: permission === 'READ',
      editable: permission === 'EDIT',
      permission,
      canEdit: canEditField(resource, field)
    };
  };

  const getInputProps = (resource: string, field: string, baseProps: any = {}) => {
    const permission = getFieldPermission(resource, field);
    
    if (permission === 'HIDDEN') {
      return { ...baseProps, style: { display: 'none' } };
    }
    
    if (permission === 'READ') {
      return {
        ...baseProps,
        readOnly: true,
        className: `${baseProps.className || ''} bg-gray-50 cursor-not-allowed`.trim(),
        tabIndex: -1
      };
    }

    return baseProps;
  };

  return {
    getFieldPermission,
    canEditField,
    getFieldProps,
    getInputProps
  };
}