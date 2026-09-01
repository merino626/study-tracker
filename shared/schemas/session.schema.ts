import { z } from 'zod';

const isoDateSchema = z.string().datetime({ message: 'Data inválida' });

export const sessionIdSchema = z.string().min(1, 'ID da sessão é obrigatório');

export const createSessionSchema = z
  .object({
    startedAt: isoDateSchema,
    endedAt: isoDateSchema,
    durationSeconds: z
      .number()
      .int('Duração deve ser um número inteiro')
      .positive('Duração deve ser maior que zero'),
    courseId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => new Date(data.endedAt) >= new Date(data.startedAt), {
    message: 'Hora final deve ser posterior à hora inicial',
    path: ['endedAt'],
  });

export const updateSessionSchema = z
  .object({
    startedAt: isoDateSchema.optional(),
    endedAt: isoDateSchema.optional(),
    durationSeconds: z
      .number()
      .int('Duração deve ser um número inteiro')
      .positive('Duração deve ser maior que zero')
      .optional(),
    courseId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar',
  });
