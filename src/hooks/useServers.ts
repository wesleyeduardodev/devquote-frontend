import { useState, useEffect, useCallback, useRef } from 'react'
import { serverService } from '@/services/serverService'
import toast from 'react-hot-toast'

interface Server {
  id: number
  name: string
  link?: string
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
  link?: string
}

interface UseServersParams {
  page?: number
  size?: number
  sort?: SortInfo[]
  filters?: FilterParams
}

export const useServers = (initialParams?: UseServersParams) => {
  const [servers, setServers] = useState<Server[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialParams?.page || 0)
  const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10)
  const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [{ field: 'name', direction: 'asc' }])
  const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchServers = useCallback(async (params?: UseServersParams) => {
    try {
      setLoading(true)
      setError(null)
      const data = await serverService.getAllPaginated({
        page: params?.page ?? currentPage,
        size: params?.size ?? pageSize,
        sort: params?.sort ?? sorting,
        filters: params?.filters ?? filters,
      })
      setServers(data.content)
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar servidores')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sorting, filters])

  const createServer = useCallback(async (data: { name: string; link?: string }) => {
    const created = await serverService.create(data)
    await fetchServers()
    toast.success('Servidor criado com sucesso!')
    return created
  }, [fetchServers])

  const updateServer = useCallback(async (id: number, data: { name: string; link?: string }) => {
    const updated = await serverService.update(id, data)
    await fetchServers()
    toast.success('Servidor atualizado com sucesso!')
    return updated
  }, [fetchServers])

  const deleteServer = useCallback(async (id: number) => {
    await serverService.delete(id)
    await fetchServers()
    toast.success('Servidor excluído com sucesso!')
  }, [fetchServers])

  const deleteBulkServers = useCallback(async (ids: number[]) => {
    await serverService.deleteBulk(ids)
    await fetchServers()
    toast.success(`${ids.length} servidor(es) excluído(s) com sucesso!`)
  }, [fetchServers])

  const setPage = useCallback((page: number) => setCurrentPage(page), [])
  const setPageSize = useCallback((size: number) => { setCurrentPageSize(size); setCurrentPage(0) }, [])
  const setFilter = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
    setCurrentPage(0)
  }, [])
  const clearFilters = useCallback(() => { setFilters({}); setCurrentPage(0) }, [])

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => fetchServers(), 300)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [currentPage, pageSize, sorting, filters])

  return {
    servers, pagination, loading, error, sorting, filters,
    fetchServers, createServer, updateServer, deleteServer, deleteBulkServers,
    setPage, setPageSize, setFilter, clearFilters,
  }
}

export default useServers
