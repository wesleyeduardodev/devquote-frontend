import React, { useState, useCallback, useEffect } from "react";
import { FormProvider, useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DollarSign, Paperclip, ChevronDown, ChevronUp } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import SubTaskForm from "./SubTaskForm";
import FilePicker from "../ui/FilePicker";
import AttachmentList from "../ui/AttachmentList";
import RichTextEditor from "../ui/RichTextEditor";
import { TaskAttachmentResponse } from "@/services/taskAttachmentService";

interface SubTask {
  title: string;
  description?: string;
  amount: string;
  taskId?: number | null;
  excluded?: boolean;
}

interface TaskData {
  requesterId: number;
  title: string;
  description?: string;
  flowType: string;
  environment?: string;
  code: string;
  link?: string;
  meetingLink?: string;
  hasSubTasks?: boolean;
  amount?: string;
  taskType?: string;
  serverOrigin?: string;
  systemModule?: string;
  priority?: string;
  subTasks?: any[];
}

interface TaskFormProps {
  initialData?: any;
  onSubmit: (data: any, pendingFiles?: File[]) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  taskId?: number;
  onFilesUploaded?: (attachments: TaskAttachmentResponse[]) => void;
}

const createSchema = (isEdit: boolean) =>
  yup.object({
    title: yup
      .string()
      .required("Título é obrigatório")
      .max(200, "Máximo 200 caracteres"),
    description: yup.string().optional(),
    flowType: yup.string().required("Tipo de fluxo é obrigatório"),
    environment: yup.string().optional(),
    code: isEdit
      ? yup
          .string()
          .required("Código é obrigatório")
          .max(50, "Máximo 50 caracteres")
      : yup.string().when("flowType", {
          is: "DESENVOLVIMENTO",
          then: (schema) =>
            schema
              .required("Código é obrigatório para tarefas de desenvolvimento")
              .max(50, "Máximo 50 caracteres"),
          otherwise: (schema) => schema.optional(),
        }),
    requesterId: yup.mixed().required("Solicitante é obrigatório"),
    link: yup.string().url("URL inválida").optional(),
    meetingLink: yup
      .string()
      .url("URL inválida")
      .max(500, "Máximo 500 caracteres")
      .optional(),
    hasSubTasks: yup.boolean().optional(),
    amount: yup.string().optional(),
    taskType: yup.string().optional(),
    serverOrigin: yup.string().max(100, "Máximo 100 caracteres").optional(),
    systemModule: yup.string().max(100, "Máximo 100 caracteres").optional(),
    priority: yup.string().required("Prioridade é obrigatória"),
    subTasks: yup.array().optional(),
  });

const TaskForm: React.FC<TaskFormProps> = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  taskId,
  onFilesUploaded,
}) => {
  const { hasProfile } = useAuth();
  const isAdmin = hasProfile("ADMIN");
  const isEdit = !!initialData?.id;

  const methods = useForm<TaskData>({
    resolver: yupResolver(createSchema(isEdit)),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      flowType: initialData?.flowType || "DESENVOLVIMENTO",
      environment: initialData?.environment || "",
      code: initialData?.code || "",
      link: initialData?.link || "",
      meetingLink: initialData?.meetingLink || "",
      hasSubTasks:
        initialData?.hasSubTasks !== undefined
          ? initialData.hasSubTasks
          : false,
      amount: initialData?.amount || "",
      taskType: initialData?.taskType || "",
      serverOrigin: initialData?.serverOrigin || "",
      systemModule: initialData?.systemModule || "",
      priority: initialData?.priority || "MEDIUM",
      subTasks: initialData?.subTasks
        ? [...initialData.subTasks].sort((a, b) => {
            if (a.id && b.id) return a.id - b.id;

            if (a.id) return -1;
            if (b.id) return 1;

            return 0;
          })
        : [
            {
              title: "",
              description: "",
              amount: "",
            },
          ],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = methods;

  const hasSubTasks = useWatch({ control, name: "hasSubTasks" });
  const watchSubTasks = useWatch({ control, name: "subTasks" });
  const flowType = useWatch({ control, name: "flowType" });

  useEffect(() => {
    if (flowType === "OPERACIONAL" && !initialData?.id) {
      methods.setValue("code", "");
    }
  }, [flowType, methods, initialData?.id]);

  useEffect(() => {
    if (initialData?.id) {
      reset({
        title: initialData?.title || "",
        description: initialData?.description || "",
        flowType: initialData?.flowType || "DESENVOLVIMENTO",
        environment: initialData?.environment || "",
        code: initialData?.code || "",
        link: initialData?.link || "",
        meetingLink: initialData?.meetingLink || "",
        hasSubTasks:
          initialData?.hasSubTasks !== undefined
            ? initialData.hasSubTasks
            : false,
        amount: initialData?.amount || "",
        taskType: initialData?.taskType || "",
        serverOrigin: initialData?.serverOrigin || "",
        systemModule: initialData?.systemModule || "",
        priority: initialData?.priority || "MEDIUM",
        subTasks: initialData?.subTasks
          ? [...initialData.subTasks].sort((a, b) => {
              if (a.id && b.id) return a.id - b.id;
              if (a.id) return -1;
              if (b.id) return 1;
              return 0;
            })
          : [{ title: "", description: "", amount: "" }],
      });
    }
  }, [initialData, reset]);

  const [subTaskError, setSubTaskError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachmentCount, setAttachmentCount] = useState(0);

  const [isAttachmentSectionExpanded, setIsAttachmentSectionExpanded] =
    useState(false);

  const handleHasSubTasksChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;

      if (!isChecked && initialData?.id && watchSubTasks) {
        const activeSubTasks = watchSubTasks.filter((st: any) => !st?.excluded);
        if (activeSubTasks.length > 0) {
          setSubTaskError(
            "Para desmarcar esta opção, você precisa remover todas as subtarefas primeiro e depois atualizar a tarefa."
          );

          setTimeout(() => {
            methods.setValue("hasSubTasks", true);
          }, 0);
          return;
        }
      }

      setSubTaskError(null);
      methods.setValue("hasSubTasks", isChecked);
    },
    [initialData?.id, watchSubTasks, methods]
  );

  const handleFormSubmit = async (data: TaskData): Promise<void> => {
    try {
      setSubTaskError(null);
      setFormError(null);

      if (data.hasSubTasks) {
        if (!data.subTasks || data.subTasks.length === 0) {
          setFormError(
            'Quando "Esta tarefa possui subtarefas" estiver marcado, você deve adicionar pelo menos uma subtarefa.'
          );
          const formElement = document.querySelector("form");
          if (formElement) {
            formElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }

        const invalidSubtasks = data.subTasks
          .map((subTask: any, index: number) => ({
            index: index + 1,
            hasTitle: subTask.title && subTask.title.trim() !== "",
          }))
          .filter((st) => !st.hasTitle);

        if (invalidSubtasks.length > 0) {
          const errorMsg =
            invalidSubtasks.length === 1
              ? `Subtarefa ${invalidSubtasks[0].index}: O título é obrigatório`
              : `Subtarefas ${invalidSubtasks
                  .map((st) => st.index)
                  .join(", ")}: Os títulos são obrigatórios`;

          setFormError(errorMsg);
          const formElement = document.querySelector("form");
          if (formElement) {
            formElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }
      }

      const formattedData = {
        ...data,
        requesterId: data.requesterId || initialData?.requesterId,
        amount: data.hasSubTasks
          ? undefined
          : isAdmin
          ? parseFloat(data.amount || "0")
          : null,
        subTasks: data.hasSubTasks
          ? (data.subTasks || []).map((subTask: any) => ({
              ...subTask,
              amount: parseFloat(subTask.amount || "0"),
              taskId: initialData?.id || null,
            }))
          : [],
      };

      await onSubmit(
        formattedData,
        pendingFiles.length > 0 ? pendingFiles : undefined
      );

      if (!initialData?.id) {
        reset();
        setPendingFiles([]);
      }
    } catch (error: any) {
      console.error("Erro no formulário de tarefa:", error);

      if (error?.message && error.message.includes("Tem Subtarefas")) {
        setSubTaskError(
          'Não é possível desmarcar "Tem Subtarefas" enquanto existirem subtarefas vinculadas. Remova todas as subtarefas primeiro.'
        );

        methods.setValue("hasSubTasks", true);
      } else if (
        error?.message &&
        !error.message.includes("Requester not selected")
      ) {
        let errorMessage = "Erro ao processar solicitação";

        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          const fieldErrors = error.response.data.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(", ");
          errorMessage = `Campos inválidos: ${fieldErrors}`;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setFormError(errorMessage);

        const formElement = document.querySelector("form");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        throw error;
      }
    }
  };

  const desenvolvimentoTaskTypeOptions = [
    { value: "", label: "Selecione..." },
    { value: "BUG", label: "🐛 Bug" },
    { value: "ENHANCEMENT", label: "📨 Melhoria" },
    { value: "NEW_FEATURE", label: "✨ Nova Funcionalidade" },
  ];

  const operacionalTaskTypeOptions = [
    { value: "", label: "Selecione..." },
    { value: "BACKUP", label: "💾 Backup" },
    { value: "DEPLOY", label: "🚀 Deploy" },
    { value: "LOGS", label: "📋 Logs" },
    { value: "DATABASE_APPLICATION", label: "💿 Aplicação de Banco" },
    { value: "NOVO_SERVIDOR", label: "🖥️ Novo Servidor" },
    { value: "MONITORING", label: "📊 Monitoramento" },
    { value: "SUPPORT", label: "🛠️ Suporte" },
    { value: "CODE_REVIEW", label: "🔎 Revisão de Código" },
  ];

  const taskTypeOptions =
    flowType === "OPERACIONAL"
      ? operacionalTaskTypeOptions
      : desenvolvimentoTaskTypeOptions;

  const priorityOptions = [
    { value: "LOW", label: "🟢 Baixa" },
    { value: "MEDIUM", label: "🟡 Média" },
    { value: "HIGH", label: "🟠 Alta" },
    { value: "URGENT", label: "🔴 Urgente" },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Exibição de erro geral */}
        {formError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao processar solicitação
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{formError}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-sm font-medium text-red-800 underline hover:text-red-900"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <input {...register("requesterId")} type="hidden" />

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Fluxo <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register("flowType")}
                  type="radio"
                  value="DESENVOLVIMENTO"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  💻 Desenvolvimento
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register("flowType")}
                  type="radio"
                  value="OPERACIONAL"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  ⚙️ Operacional
                </span>
              </label>
            </div>
            {errors.flowType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.flowType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register("code")}
              label="Código"
              placeholder={
                initialData?.id
                  ? "Digite o código da tarefa"
                  : flowType === "OPERACIONAL"
                  ? "Será gerado automaticamente"
                  : "Digite o código da tarefa"
              }
              error={errors.code?.message}
              maxLength={100}
              required={flowType === "DESENVOLVIMENTO" || !!initialData?.id}
              disabled={flowType === "OPERACIONAL" && !initialData?.id}
            />

            <Select
              {...register("priority")}
              label="Prioridade"
              error={errors.priority?.message}
              required
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <div className="md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("title")}
                  rows={2}
                  placeholder="Digite o título da tarefa&#10;Máximo 200 caracteres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  maxLength={200}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              {...register("taskType")}
              label="Tipo de Tarefa"
              error={errors.taskType?.message}
            >
              {taskTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              {...register("environment")}
              label="Ambiente"
              error={errors.environment?.message}
            >
              <option value="">Selecione...</option>
              <option value="DESENVOLVIMENTO">🔧 Desenvolvimento</option>
              <option value="HOMOLOGACAO">🧪 Homologação</option>
              <option value="PRODUCAO">🚀 Produção</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register("systemModule")}
              label="Módulo do Sistema"
              placeholder="Ex: Autenticação, Relatórios, Dashboard..."
              error={errors.systemModule?.message}
              maxLength={100}
            />

            <Input
              {...register("serverOrigin")}
              label="Servidor"
              placeholder="Ex: Produção, Homologação, Desenvolvimento..."
              error={errors.serverOrigin?.message}
              maxLength={100}
            />
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Descricao"
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Descreva a tarefa em detalhes (opcional). Voce pode colar imagens diretamente..."
                error={errors.description?.message}
                disabled={isSubmitting || loading}
                minHeight="200px"
                entityType="TASK"
                entityId={taskId || initialData?.id}
              />
            )}
          />
        </div>

        {/* Links e Informações Adicionais */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register("link")}
              type="url"
              label="Link da Tarefa"
              placeholder="https://exemplo.com (opcional)"
              error={errors.link?.message}
              maxLength={200}
            />

            <Input
              {...register("meetingLink")}
              type="url"
              label="Link da Reunião"
              placeholder="https://meet.google.com/... (opcional)"
              error={errors.meetingLink?.message}
              maxLength={500}
            />
          </div>
        </div>

        {/* Configuração de Subtarefas/Valor */}
        <div className="space-y-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3">
                <input
                  {...register("hasSubTasks")}
                  type="checkbox"
                  id="hasSubTasks"
                  onChange={handleHasSubTasksChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="hasSubTasks"
                  className="text-sm font-medium text-gray-700"
                >
                  Esta tarefa possui subtarefas?
                </label>
              </div>
              {subTaskError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{subTaskError}</p>
                </div>
              )}
            </div>

            {hasSubTasks ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Subtarefas
                </h3>
                <SubTaskForm taskId={taskId || initialData?.id} />
                {errors.subTasks && (
                  <p className="mt-2 text-sm text-red-600">
                    {(errors as any).subTasks?.message}
                  </p>
                )}
              </div>
            ) : (
              isAdmin && (
                <div className="relative">
                  <Input
                    {...register("amount")}
                    type="number"
                    step="0.01"
                    min="0"
                    label="Valor da Tarefa"
                    placeholder="0,00"
                    error={errors.amount?.message}
                  />
                  <DollarSign className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
                </div>
              )
            )}
          </div>
        </div>

        {/* Seção de Anexos - Colapsável */}
        <div className="border-t pt-6">
          {/* Cabeçalho clicável */}
          <div
            className="cursor-pointer border border-gray-200 rounded-lg"
            onClick={() =>
              setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)
            }
          >
            <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <span className="text-lg font-medium text-gray-900">
                    Anexos
                  </span>
                  {!taskId
                    ? pendingFiles.length > 0 && (
                        <span className="text-sm font-medium text-blue-600">
                          ({pendingFiles.length})
                        </span>
                      )
                    : attachmentCount > 0 && (
                        <span className="text-sm font-medium text-blue-600">
                          ({attachmentCount})
                        </span>
                      )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {isAttachmentSectionExpanded ? "Recolher" : "Expandir"}
                  </span>
                  {isAttachmentSectionExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Componente oculto para carregar contagem */}
          {taskId && taskId > 0 && !isAttachmentSectionExpanded && (
            <div className="hidden">
              <AttachmentList
                taskId={taskId}
                refreshTrigger={attachmentRefresh}
                onCountChange={setAttachmentCount}
              />
            </div>
          )}

          {/* Conteúdo da seção quando expandida */}
          {isAttachmentSectionExpanded && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {taskId
                    ? "Faca upload de documentos, planilhas, imagens ou outros arquivos relacionados a tarefa"
                    : "Selecione arquivos que serao anexados apos criar a tarefa"}
                </p>
              </div>

              {/* Componente único para criação e edição */}
              <FilePicker
                files={pendingFiles}
                onFilesChange={setPendingFiles}
                maxFiles={10}
                maxFileSize={10}
                disabled={isSubmitting || loading}
                taskId={taskId}
                showUploadButton={!!taskId}
                onUploadSuccess={(attachments) => {
                  onFilesUploaded?.(attachments);
                  setAttachmentRefresh((prev) => prev + 1);
                }}
              />

              {taskId && taskId > 0 && (
                <div className="mt-4">
                  <AttachmentList
                    taskId={taskId}
                    refreshTrigger={attachmentRefresh}
                    forceExpanded={true}
                    onCountChange={setAttachmentCount}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Voltar
            </Button>
          )}
          <Button
            type="submit"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {initialData?.id ? "Atualizar" : "Criar"} Tarefa
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TaskForm;
