import { BaseEntity } from './api.types';

// Interface principal para Project
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

// Status do projeto
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

// Tipo para criação de projeto
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

// Tipo para atualização de projeto
export interface UpdateProjectData extends Partial<CreateProjectData> {
    id?: never; // Impede atualização do ID
}

// Project com dados relacionados
export interface ProjectWithRelations extends Project {
    client?: {
        id: number;
        name: string;
        email?: string;
    };
    quotes?: {
        id: number;
        title?: string;
        totalAmount: number;
        status: string;
    }[];
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

// Filtros para listagem de projetos
export interface ProjectFilters {
    status?: ProjectStatus[];
    technologies?: string[];
    clientId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Estatísticas de projetos
export interface ProjectStats {
    total: number;
    byStatus: Record<ProjectStatus, number>;
    completed: number;
    inProgress: number;
    onHold: number;
    totalValue?: number;
}

// Form data para componentes de formulário
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

// Configurações do repositório
export interface RepositoryConfig {
    url: string;
    branch: string;
    provider: 'github' | 'gitlab' | 'bitbucket' | 'other';
    accessToken?: string;
    webhookUrl?: string;
}

// Métricas do projeto
export interface ProjectMetrics {
    totalTasks: number;
    completedTasks: number;
    totalQuotes: number;
    approvedQuotes: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    totalValue: number;
    completionPercentage: number;
}