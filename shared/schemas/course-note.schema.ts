import { z } from 'zod';

export const courseNoteIdSchema = z.string().min(1, 'ID da anotação é obrigatório');

export const courseNoteCourseIdSchema = z.object({
  courseId: z.string().min(1, 'ID do curso é obrigatório'),
});

export const createCourseNoteSchema = z.object({
  courseId: z.string().min(1, 'ID do curso é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  content: z.string().max(100_000).optional(),
});

export const updateCourseNoteSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().max(100_000).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar',
  });

export const courseAttachmentIdSchema = z.object({
  attachmentId: z.string().min(1, 'ID do anexo é obrigatório'),
});

export const courseAttachmentListSchema = z.object({
  courseId: z.string().min(1, 'ID do curso é obrigatório'),
  noteId: z.string().min(1).nullable().optional(),
});

export const courseAttachmentAddSchema = z.object({
  courseId: z.string().min(1, 'ID do curso é obrigatório'),
  noteId: z.string().min(1).nullable().optional(),
});
