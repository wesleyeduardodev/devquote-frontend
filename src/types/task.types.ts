import { BaseEntity } from './api.types';

// Prioridade da tarefa
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Interface principal para Task
export interface Task extends BaseEntity {
    id: number;
    code: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    requesterId: number | string;
    requesterName?: string;
    assignedTo?: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    estimatedHours?: number;
    actualHours?: number;
    startDate?: string;
    dueDate?: string;
    completedAt?: string;
    tags?: string[];
    subTasks?: SubTask[];
    createdByUserId?: number;
    createdByUserName?: string;
    updatedByUserId?: number;
    updatedByUserName?: string;
    hasDelivery?: boolean;
    hasQuoteInBilling?: boolean;
}

// Subtarefa
export interface SubTask extends BaseEntity {
    id: number;
    taskId: number;
    title: string;
    description?: string;
    amount: number;
    estimatedHours?: number;
    actualHours?: number;
    assignedTo?: string;
    completedAt?: string;
    order?: number;
}

// Tipo para criação de tarefa
export interface CreateTaskData {
    code?: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    requesterId: number | string;
    assignedTo?: string;
    link?: string;
    estimatedHours?: number;
    startDate?: string;
    dueDate?: string;
    tags?: string[];
    subTasks?: CreateSubTaskData[];
}

// Tipo para criação de subtarefa
export interface CreateSubTaskData {
    title: string;
    description?: string;
    amount: number;
    estimatedHours?: number;
    assignedTo?: string;
    order?: number;
}

// Tipo para atualização de tarefa
export interface UpdateTaskData extends Partial<CreateTaskData> {
    id?: never; // Impede atualização do ID
    subTasks?: UpdateSubTaskData[];
}

// Tipo para atualização de subtarefa
export interface UpdateSubTaskData extends Partial<CreateSubTaskData> {
    id?: number; // Permite ID para identificar subtarefa existente
}

// Task com dados relacionados
export interface TaskWithRelations extends Task {
    requester?: {
        id: number | string;
        name: string;
        email?: string;
        company?: string;
    };
    assignee?: {
        id: string;
        name: string;
        email?: string;
    };
    project?: {
        id: number;
        name: string;
    };
}

// Filtros para listagem de tarefas
export interface TaskFilters {
    priority?: TaskPriority[];
    requesterId?: number | string;
    assignedTo?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Estatísticas de tarefas
export interface TaskStats {
    total: number;
    byPriority: Record<TaskPriority, number>;
    totalValue: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    totalHours: number;
    estimatedHours: number;
    actualHours: number;
}

// Form data para componentes de formulário
export interface TaskFormData {
    code?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    requesterId: string | number;
    assignedTo?: string;
    link?: string;
    estimatedHours?: number;
    startDate?: string;
    dueDate?: string;
    tags?: string[];
    subTasks: SubTaskFormData[];
}

// Form data para subtarefas
export interface SubTaskFormData {
    id?: number;
    title: string;
    description?: string;
    amount: number | string;
    estimatedHours?: number;
    assignedTo?: string;
    order?: number;
}

// Atividade/Log da tarefa
export interface TaskActivity {
    id: number;
    taskId: number;
    type: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'COMMENT' | 'COMPLETED';
    description: string;
    oldValue?: any;
    newValue?: any;
    createdBy: string;
    createdAt: string;
}

// Comentário da tarefa
export interface TaskComment {
    id: number;
    taskId: number;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    parentId?: number; // Para respostas
}

// Anexo da tarefa
export interface TaskAttachment {
    id: number;
    taskId: number;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
}