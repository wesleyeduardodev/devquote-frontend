import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Package, X } from 'lucide-react';
import { AvailableProject } from '../../types/delivery.types';
import { projectService } from '../../services/projectService';
import DataTable, { Column } from '../ui/DataTable';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectsSelect: (projects: AvailableProject[]) => void;
    selectedTaskTitle?: string;
    excludeProjectIds?: number[];
}

export default function ProjectSelectionModal({
    isOpen,
    onClose,
    onProjectsSelect,
    selectedTaskTitle,
    excludeProjectIds = []
}: ProjectSelectionModalProps) {
    const [projects, setProjects] = useState<AvailableProject[]>([]);
    const [allProjects, setAllProjects] = useState<AvailableProject[]>([]);
    const [paginationData, setPaginationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());

    // Ref para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Estados para DataTable
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Record<string, string>>({});

    // Buscar projetos disponíveis com paginação
    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            // Usar paginação da API corretamente - MESMA LÓGICA DO taskService
            const searchFilters: Record<string, string> = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    searchFilters[key] = value.toString();
                }
            });

            const response = await projectService.getAllPaginated({
                page,
                size,
                sort: [{ field: sortField, direction: sortDirection }],
                filters: searchFilters
            });

            // Converter para o formato esperado e filtrar projetos excluídos
            const availableProjects: AvailableProject[] = (response.content || [])
                .map(project => ({
                    id: project.id,
                    name: project.name,
                    repositoryUrl: project.repositoryUrl
                }))
                .filter(project => !excludeProjectIds.includes(project.id));

            setProjects(availableProjects);
            setPaginationData(response);

            // Buscar todos os projetos apenas uma vez para seleção
            if (page === 0) {
                try {
                    const allResponse = await projectService.getAll();
                    const allAvailableProjects = (allResponse.content || [])
                        .map(project => ({
                            id: project.id,
                            name: project.name,
                            repositoryUrl: project.repositoryUrl
                        }))
                        .filter(project => !excludeProjectIds.includes(project.id));
                    setAllProjects(allAvailableProjects);
                } catch (e) {
                    console.warn('Não foi possível carregar todos os projetos:', e);
                    setAllProjects(availableProjects);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            setProjects([]);
            setPaginationData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Carregar projetos quando modal abre ou parâmetros mudam (COM DEBOUNCE)
    useEffect(() => {
        if (!isOpen) return;

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Para page, size e sorting, executa imediatamente
        const isImmediateChange = Object.keys(filters).length === 0;
        
        if (isImmediateChange) {
            fetchProjects();
        } else {
            // Para filtros, usa debounce de 800ms
            debounceTimerRef.current = setTimeout(() => {
                fetchProjects();
            }, 800);
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isOpen, page, size, sortField, sortDirection, filters]);

    // Reset quando modal abre
    useEffect(() => {
        if (isOpen) {
            setSelectedProjects(new Set());
            setPage(0);
            setFilters({});
            
            // Limpa qualquer timer pendente
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        }
    }, [isOpen]);

    // Fechar com ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Alternar seleção de projeto
    const toggleProjectSelection = (projectId: number) => {
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(projectId)) {
            newSelected.delete(projectId);
        } else {
            newSelected.add(projectId);
        }
        setSelectedProjects(newSelected);
    };

    // Handler de clique na linha
    const handleRowClick = (project: AvailableProject) => {
        toggleProjectSelection(project.id);
    };

    // Selecionar/deselecionar todos da página atual
    const toggleSelectAll = () => {
        const newSelected = new Set(selectedProjects);
        
        // Verificar se todos os projetos da página atual estão selecionados
        const allCurrentPageSelected = projects.every(project => selectedProjects.has(project.id));
        
        if (allCurrentPageSelected && projects.length > 0) {
            // Deselecionar todos da página atual
            projects.forEach(project => {
                newSelected.delete(project.id);
            });
        } else {
            // Selecionar todos da página atual
            projects.forEach(project => {
                newSelected.add(project.id);
            });
        }
        
        setSelectedProjects(newSelected);
    };

    // Confirmar seleção
    const handleConfirmSelection = () => {
        const selectedProjectsList = allProjects.filter(project => 
            selectedProjects.has(project.id)
        );
        onProjectsSelect(selectedProjectsList);
        onClose();
    };


    // Definir colunas da tabela
    const columns: Column<AvailableProject>[] = [
        {
            key: 'selected',
            title: 'Selecionar',
            sortable: false,
            filterable: false,
            headerRender: () => (
                <div className="flex items-center justify-center" title="Selecionar todos desta página">
                    <input
                        type="checkbox"
                        checked={projects.length > 0 && projects.every(project => selectedProjects.has(project.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ),
            render: (project) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedProjects.has(project.id)}
                        onChange={() => toggleProjectSelection(project.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ),
            width: '60px'
        },
        {
            key: 'name',
            title: 'Nome do Projeto',
            sortable: true,
            filterable: true,
            render: (project) => (
                <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 truncate" title={project.name}>
                        {project.name}
                    </span>
                </div>
            ),
            width: '100%'
        }
    ];

    if (!isOpen) return null;

    const selectedCount = selectedProjects.size;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white sticky top-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-2">
                                Selecionar Repositórios/Projetos
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                            title="Fechar (ESC)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {selectedCount > 0 && (
                        <div className="mt-3 text-sm">
                            <span className="font-medium text-blue-600">{selectedCount}</span>
                            {' '}projeto{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(85vh-140px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner size="lg" />
                            <span className="ml-3 text-gray-600">Carregando projetos...</span>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Nenhum projeto encontrado
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Cadastre projetos para poder selecioná-los
                                </p>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={projects}
                            columns={columns}
                            onRowClick={handleRowClick}
                            selectedRows={Array.from(selectedProjects)}
                            loading={isLoading}
                            showColumnToggle={false}
                            
                            // Paginação
                            pagination={paginationData ? {
                                currentPage: page,
                                pageSize: size,
                                totalElements: paginationData.totalElements,
                                totalPages: paginationData.totalPages
                            } : null}
                            onPageChange={setPage}
                            onPageSizeChange={setSize}
                            
                            // Ordenação
                            sorting={[{ field: sortField, direction: sortDirection }]}
                            onSort={(field, direction) => {
                                setSortField(field);
                                setSortDirection(direction);
                                setPage(0);
                            }}
                            
                            // Filtros
                            filters={filters}
                            onFilter={(field, value) => {
                                setFilters(prev => ({
                                    ...prev,
                                    [field]: value || undefined
                                }));
                                setPage(0);
                            }}
                            onClearFilters={() => {
                                setFilters({});
                                setPage(0);
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-1.5 border-t border-gray-200 bg-white flex items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600">
                        {paginationData?.totalElements || 0} projeto{(paginationData?.totalElements || 0) !== 1 ? 's' : ''} disponível{(paginationData?.totalElements || 0) !== 1 ? 'eis' : ''}
                        {selectedCount > 0 && (
                            <span className="ml-2 font-medium text-blue-600">
                                • {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex justify-center">
                        <Button
                            onClick={handleConfirmSelection}
                        >
                            Selecionar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}