import api from './api'

interface SortInfo {
  field: string
  direction: 'asc' | 'desc'
}

interface FilterParams {
  id?: string
  name?: string
  createdAt?: string
  updatedAt?: string
}

interface PaginatedParams {
  page: number
  size: number
  sort: SortInfo[]
  filters?: FilterParams
}

export const moduleService = {
  getAll: async (): Promise<any> => {
    const response = await api.get('/modules?page=0&size=500&sort=name,asc')
    return response.data
  },

  getAllPaginated: async (params: PaginatedParams): Promise<any> => {
    const { page, size, sort, filters } = params
    const queryParams = new URLSearchParams({ page: page.toString(), size: size.toString() })
    sort.map((s) => `${s.field},${s.direction}`).forEach((s) => queryParams.append('sort', s))
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') queryParams.append(key, value.toString())
      })
    }
    const response = await api.get(`/modules?${queryParams.toString()}`)
    return response.data
  },

  getById: async (id: any): Promise<any> => {
    const response = await api.get(`/modules/${id}`)
    return response.data
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post('/modules', data)
    return response.data
  },

  update: async (id: any, data: any): Promise<any> => {
    const response = await api.put(`/modules/${id}`, data)
    return response.data
  },

  delete: async (id: any): Promise<void> => {
    await api.delete(`/modules/${id}`)
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.delete('/modules/bulk', { data: ids })
  },
}
