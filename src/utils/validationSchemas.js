import * as yup from 'yup';

export const requesterSchema = yup.object({
  name: yup
      .string()
      .required('Nome é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres')
      .trim(),

  email: yup
      .string()
      .email('Formato de email inválido')
      .max(200, 'Email deve ter no máximo 200 caracteres')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  phone: yup
      .string()
      .max(20, 'Telefone deve ter no máximo 20 caracteres')
      .matches(
          /^(\+?[0-9\-(). ]*)?$/,
          'Formato de telefone inválido'
      )
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),
});

export const subTaskSchema = yup.object({
  title: yup
      .string()
      .required('Título é obrigatório')
      .max(200, 'Título deve ter no máximo 200 caracteres')
      .trim(),

  description: yup
      .string()
      .max(200, 'Descrição deve ter no máximo 200 caracteres')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  amount: yup
      .number()
      .required('Valor é obrigatório')
      .min(0.01, 'Valor deve ser maior que zero')
      .max(999999.99, 'Valor deve ser menor que 1.000.000')
      .typeError('Valor deve ser um número válido'),

  status: yup
      .string()
      .required('Status é obrigatório')
      .max(30, 'Status deve ter no máximo 30 caracteres'),
});

export const taskWithSubTasksSchema = yup.object({
  requesterId: yup
      .number()
      .required('Solicitante é obrigatório')
      .typeError('Selecione um solicitante válido'),

  title: yup
      .string()
      .required('Título é obrigatório')
      .trim(),

  description: yup
      .string()
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  status: yup
      .string()
      .required('Status é obrigatório'),

  code: yup
      .string()
      .required('Código é obrigatório')
      .trim(),

  link: yup
      .string()
      .url('Link deve ser uma URL válida')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  subTasks: yup
      .array()
      .of(subTaskSchema)
      .min(1, 'Pelo menos uma subtarefa é obrigatória')
      .required('Subtarefas são obrigatórias'),
});

export const deliverySchema = yup.object({
  quoteId: yup
      .number()
      .required('Orçamento é obrigatório')
      .typeError('Selecione um orçamento válido'),

  projectId: yup
      .number()
      .required('Projeto é obrigatório')
      .typeError('Selecione um projeto válido'),

  branch: yup
      .string()
      .max(200, 'Branch deve ter no máximo 200 caracteres')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  pullRequest: yup
      .string()
      .url('Pull Request deve ser uma URL válida')
      .max(300, 'Pull Request deve ter no máximo 300 caracteres')
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  script: yup
      .string()
      .nullable()
      .transform((value, originalValue) => originalValue === '' ? null : value),

  status: yup
      .string()
      .required('Status é obrigatório')
      .max(30, 'Status deve ter no máximo 30 caracteres'),
});