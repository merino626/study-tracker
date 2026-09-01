import { z } from 'zod';

const MAX_WEEKLY_GOAL_HOURS = 168;

export const updateSettingsSchema = z
  .object({
    weeklyGoalHours: z
      .number()
      .positive('Meta semanal deve ser maior que zero')
      .max(MAX_WEEKLY_GOAL_HOURS, `Meta semanal não pode exceder ${MAX_WEEKLY_GOAL_HOURS}h`)
      .optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    alwaysOnTop: z.boolean().optional(),
    launchOnStartup: z.boolean().optional(),
    backupFolderPath: z.string().nullable().optional(),
    backupOnQuit: z.boolean().optional(),
    autoBackupDaily: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar',
  });
