import { BaseEntity } from './api.types';

export type FlowType = 'DESENVOLVIMENTO' | 'OPERACIONAL';

export type Environment = 'DESENVOLVIMENTO' | 'HOMOLOGACAO' | 'PRODUCAO';

export type TaskType =
    | 'BUG'
    | 'ENHANCEMENT'
    | 'NEW_FEATURE'
    | 'BACKUP'
    | 'DEPLOY'
    | 'LOGS'
    | 'NOVO_SERVIDOR'
    | 'MONITORING'
    | 'SUPPORT'
    | 'CODE_REVIEW'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task extends BaseEntity {
    id: number;
    code: string;
    title: string;
    description?: string;
    flowType: FlowType;
    environment?: Environment;
    taskType?: TaskType;
    priority?: TaskPriority;
    requesterId: number | string;
    requesterName?: string;
    assignedTo?: string;
    link?: string;
    meetingLink?: string;
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
    financialEmailSent?: boolean;
    taskEmailSent?: boolean;
}

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

export interface CreateTaskData {
    code?: string;
    title: string;
    description?: string;
    flowType: FlowType;
    environment?: Environment;
    taskType?: TaskType;
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

export interface CreateSubTaskData {
    title: string;
    description?: string;
    amount: number;
    estimatedHours?: number;
    assignedTo?: string;
    order?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
    id?: never;
    subTasks?: UpdateSubTaskData[];
}

export interface UpdateSubTaskData extends Partial<CreateSubTaskData> {
    id?: number;
}

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

export interface TaskFilters {
    flowTypes?: FlowType[];
    priority?: TaskPriority[];
    requesterId?: number | string;
    assignedTo?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    search?: string;
}

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

export interface TaskFormData {
    code?: string;
    title: string;
    description?: string;
    flowType: FlowType;
    environment?: Environment;
    taskType?: TaskType;
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

export interface SubTaskFormData {
    id?: number;
    title: string;
    description?: string;
    amount: number | string;
    estimatedHours?: number;
    assignedTo?: string;
    order?: number;
}

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

export interface TaskComment {
    id: number;
    taskId: number;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    parentId?: number;
}

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