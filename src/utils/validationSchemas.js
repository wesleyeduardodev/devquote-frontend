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