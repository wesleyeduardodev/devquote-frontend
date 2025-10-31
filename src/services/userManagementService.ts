import api from './api';
import { Profile, UserProfile } from '@/types/profile';
import { profileService } from './profileService';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    username?: string;
    email?: string;
    name?: string;
    enabled?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

// Cache para os perfis para evitar múltiplas chamadas
let profilesCache: Profile[] | null = null;

// Função para buscar os perfis (com cache)
const getProfiles = async (): Promise<Profile[]> => {
    if (!profilesCache) {
        try {
            profilesCache = await profileService.getAll();
        } catch (error) {
            console.error('Erro ao buscar perfis:', error);
            profilesCache = [];
        }
    }
    return profilesCache;
};

// Função para mapear usuário do backend para frontend
const mapUserFromBackend = async (backendUser: any): Promise<UserProfile> => {
    const profiles = await getProfiles();
    
    // Mapeia os códigos dos perfis para objetos Profile completos
    const userProfiles = backendUser.roles?.map((roleCode: string) => 
        profiles.find(p => p.code === roleCode)
    ).filter(Boolean) || [];
    
    return {
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email,
        firstName: '', // Deprecated
        lastName: '', // Deprecated
        name: backendUser.name || '',
        enabled: backendUser.enabled,
        active: backendUser.enabled, // Para compatibilidade
        profiles: userProfiles,
        roles: backendUser.roles || [],
        createdAt: backendUser.createdAt,
        updatedAt: backendUser.updatedAt
    };
};

export const userManagementService = {
    getAll: async (): Promise<UserProfile[]> => {
        const response = await api.get('/admin/users');
        const users = response.data;
        
        // Mapeia cada usuário para o formato correto
        const mappedUsers = await Promise.all(
            users.map((user: any) => mapUserFromBackend(user))
        );
        
        return mappedUsers;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
        const { page, size, sort, filters } = params;

        const sortParams = sort.map(s => `${s.field},${s.direction}`);

        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        // Adiciona parâmetros de ordenação
        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        // Adiciona parâmetros de filtro
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const response = await api.get(`/admin/users?${queryParams.toString()}`);
        const data = response.data;
        
        // Mapeia os usuários na resposta paginada
        const mappedUsers = await Promise.all(
            data.content.map((user: any) => mapUserFromBackend(user))
        );
        
        return {
            ...data,
            content: mappedUsers
        };
    },

    getById: async (id: number): Promise<UserProfile> => {
        const response = await api.get(`/admin/users/${id}`);
        return mapUserFromBackend(response.data);
    },

    create: async (data: any): Promise<UserProfile> => {
        const response = await api.post('/admin/users', data);
        return mapUserFromBackend(response.data);
    },

    update: async (id: number, data: any): Promise<UserProfile> => {
        const response = await api.put(`/admin/users/${id}`, data);
        return mapUserFromBackend(response.data);
    },

    updatePermissions: async (id: number, data: any): Promise<any> => {
        const response = await api.put(`/admin/users/${id}/permissions`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/users/${id}`);
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/admin/users/bulk', { data: ids });
    },

    getAllPermissions: async (): Promise<any> => {
        const response = await api.get('/admin/users/permissions');
        return response.data;
    },

    resetPassword: async (id: number): Promise<void> => {
        await api.post(`/admin/users/${id}/reset-password`);
    }
};