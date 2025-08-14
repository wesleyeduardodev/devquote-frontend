import React from 'react';

// Tipos base para formulários
export interface BaseFormProps<T = any> {
    onSubmit: (data: T) => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    disabled?: boolean;
    initialData?: Partial<T>;
}

// Tipos para campos de formulário
export interface FormFieldProps {
    name: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    helperText?: string;
}

// Input de texto
export interface TextInputProps extends FormFieldProps {
    type?: 'text' | 'email' | 'password' | 'tel' | 'url';
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    autoComplete?: string;
}

// Input numérico
export interface NumberInputProps extends FormFieldProps {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
}

// Textarea
export interface TextareaProps extends FormFieldProps {
    rows?: number;
    cols?: number;
    maxLength?: number;
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

// Select
export interface SelectProps extends FormFieldProps {
    options: SelectOption[];
    multiple?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    creatable?: boolean;
}

export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
    group?: string;
}

// Checkbox
export interface CheckboxProps extends FormFieldProps {
    checked?: boolean;
    indeterminate?: boolean;
}

// Radio
export interface RadioProps extends FormFieldProps {
    options: RadioOption[];
    direction?: 'horizontal' | 'vertical';
}

export interface RadioOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

// Date picker
export interface DatePickerProps extends FormFieldProps {
    format?: string;
    minDate?: Date | string;
    maxDate?: Date | string;
    showTime?: boolean;
    timeFormat?: string;
}

// File upload
export interface FileUploadProps extends FormFieldProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // em bytes
    maxFiles?: number;
    preview?: boolean;
    dragDrop?: boolean;
}

// Form validation
export interface ValidationRule {
    required?: boolean | string;
    min?: number | string;
    max?: number | string;
    minLength?: number | string;
    maxLength?: number | string;
    pattern?: RegExp | string;
    email?: boolean | string;
    url?: boolean | string;
    custom?: (value: any) => boolean | string;
}

export interface FieldValidation {
    [fieldName: string]: ValidationRule;
}

// Form state
export interface FormErrors {
    [fieldName: string]: string;
}

export interface FormTouched {
    [fieldName: string]: boolean;
}

export interface FormState<T = any> {
    values: T;
    errors: FormErrors;
    touched: FormTouched;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
}

// Form actions
export type FormAction<T = any> =
    | { type: 'SET_VALUE'; field: keyof T; value: any }
    | { type: 'SET_ERROR'; field: keyof T; error: string }
    | { type: 'SET_TOUCHED'; field: keyof T }
    | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
    | { type: 'RESET'; initialValues?: Partial<T> }
    | { type: 'VALIDATE' };

// Hook form types
export interface UseFormOptions<T = any> {
    initialValues?: Partial<T>;
    validation?: FieldValidation;
    onSubmit?: (values: T) => void | Promise<void>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

export interface UseFormReturn<T = any> {
    values: T;
    errors: FormErrors;
    touched: FormTouched;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
    handleChange: (field: keyof T) => (e: React.ChangeEvent<any>) => void;
    handleBlur: (field: keyof T) => () => void;
    handleSubmit: (e: React.FormEvent) => void;
    setFieldValue: (field: keyof T, value: any) => void;
    setFieldError: (field: keyof T, error: string) => void;
    reset: (values?: Partial<T>) => void;
    validate: () => boolean;
}