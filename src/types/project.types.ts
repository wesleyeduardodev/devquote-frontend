import { BaseEntity } from './api.types';

export interface Project extends BaseEntity {
    id: number;
    name: string;
    description?: string;
    repositoryUrl?: string;
    status?: ProjectStatus;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    clientId?: number;
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface CreateProjectData {
    name: string;
    description?: string;
    repositoryUrl?: string;
    status?: ProjectStatus;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    clientId?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
    id?: never;
}

export interface ProjectWithRelations extends Project {
    client?: {
        id: number;
        name: string;
        email?: string;
    };
    deliveries?: {
        id: number;
        status: string;
        createdAt: string;
    }[];
    tasks?: {
        id: number;
        title: string;
        status: string;
    }[];
}

export interface ProjectFilters {
    status?: ProjectStatus[];
    technologies?: string[];
    clientId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface ProjectStats {
    total: number;
    byStatus: Record<ProjectStatus, number>;
    completed: number;
    inProgress: number;
    onHold: number;
    totalValue?: number;
}

export interface ProjectFormData {
    name: string;
    description?: string;
    repositoryUrl?: string;
    status: ProjectStatus;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    clientId?: string | number;
}

export interface RepositoryConfig {
    url: string;
    branch: string;
    provider: 'github' | 'gitlab' | 'bitbucket' | 'other';
    accessToken?: string;
    webhookUrl?: string;
}

export interface ProjectMetrics {
    totalTasks: number;
    completedTasks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    totalValue: number;
    completionPercentage: number;
}