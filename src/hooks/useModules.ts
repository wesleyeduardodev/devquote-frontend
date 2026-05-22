import { useState, useEffect, useCallback, useRef } from 'react'
import { moduleService } from '@/services/moduleService'
import toast from 'react-hot-toast'

interface SystemModule {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  pageSize: number
  totalElements: number
  first: boolean
  last: boolean
}

interface SortInfo {
  field: string
  direction: 'asc' | 'desc'
}

interface FilterParams {
  [key: string]: string | undefined
  id?: string
  name?: string
}

interface UseModulesParams {
  page?: number
  size?: number
  sort?: SortInfo[]
  filters?: FilterParams
}

export const useModules = (initialParams?: UseModulesParams) => {
  const [modules, setModules] = useState<SystemModule[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialParams?.page || 0)
  const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10)
  const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [{ field: 'name', direction: 'asc' }])
  const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchModules = useCallback(async (params?: UseModulesParams) => {
    try {
      setLoading(true)
      setError(null)
      const data = await moduleService.getAllPaginated({
        page: params?.page ?? currentPage,
        size: params?.size ?? pageSize,
        sort: params?.sort ?? sorting,
        filters: params?.filters ?? filters,
      })
      setModules(data.content)
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar módulos')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sorting, filters])

  const createModule = useCallback(async (data: { name: string }) => {
    const created = await moduleService.create(data)
    await fetchModules()
    toast.success('Módulo criado com sucesso!')
    return created
  }, [fetchModules])

  const updateModule = useCallback(async (id: number, data: { name: string }) => {
    const updated = await moduleService.update(id, data)
    await fetchModules()
    toast.success('Módulo atualizado com sucesso!')
    return updated
  }, [fetchModules])

  const deleteModule = useCallback(async (id: number) => {
    await moduleService.delete(id)
    await fetchModules()
    toast.success('Módulo excluído com sucesso!')
  }, [fetchModules])

  const deleteBulkModules = useCallback(async (ids: number[]) => {
    await moduleService.deleteBulk(ids)
    await fetchModules()
    toast.success(`${ids.length} módulo(s) excluído(s) com sucesso!`)
  }, [fetchModules])

  const setPage = useCallback((page: number) => setCurrentPage(page), [])
  const setPageSize = useCallback((size: number) => { setCurrentPageSize(size); setCurrentPage(0) }, [])
  const setFilter = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
    setCurrentPage(0)
  }, [])
  const clearFilters = useCallback(() => { setFilters({}); setCurrentPage(0) }, [])

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => fetchModules(), 300)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [currentPage, pageSize, sorting, filters])

  return {
    modules, pagination, loading, error, sorting, filters,
    fetchModules, createModule, updateModule, deleteModule, deleteBulkModules,
    setPage, setPageSize, setFilter, clearFilters,
  }
}

export default useModules
