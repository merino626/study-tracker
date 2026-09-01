import { z } from 'zod';
import { BACKUP_MODULES, COURSE_PRIORITIES, COURSE_STATUSES } from '../constants/courses';

const optionalIsoDateSchema = z
  .string()
  .datetime({ message: 'Data inválida' })
  .nullable()
  .optional();
const urlSchema = z.string().url('URL inválida').nullable().optional().or(z.literal(''));

export const courseIdSchema = z.string().min(1, 'ID do curso é obrigatório');

export const courseTagsSchema = z.array(z.string().min(1).max(50)).max(20);

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  platform: z.string().min(1, 'Plataforma é obrigatória').max(100),
  url: urlSchema,
  instructor: z.string().max(200).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  officialHours: z.number().positive('Carga horária deve ser maior que zero').nullable().optional(),
  startedAt: optionalIsoDateSchema,
  completedAt: optionalIsoDateSchema,
  status: z.enum(COURSE_STATUSES).optional(),
  priority: z.enum(COURSE_PRIORITIES).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(50000).optional(),
  tags: courseTagsSchema.optional(),
});

export const updateCourseSchema = createCourseSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar',
  });

export const restoreBackupSchema = z.object({
  filePath: z.string().min(1, 'Caminho do backup é obrigatório'),
  modules: z.array(z.enum(BACKUP_MODULES)).min(1, 'Selecione ao menos um módulo'),
});

export const backupFilePathSchema = z.object({
  filePath: z.string().min(1, 'Caminho do backup é obrigatório'),
});
