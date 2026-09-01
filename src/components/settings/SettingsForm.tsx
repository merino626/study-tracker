import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { AppSettings, ThemeMode, UpdateSettingsInput } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

interface SettingsFormProps {
  settings: AppSettings;
  onUpdate: (data: UpdateSettingsInput) => Promise<void>;
}

export function SettingsForm({ settings, onUpdate }: SettingsFormProps) {
  const { setTheme } = useTheme();
  const [weeklyGoal, setWeeklyGoal] = useState(String(settings.weeklyGoalHours));
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setWeeklyGoal(String(settings.weeklyGoalHours));
  }, [settings.weeklyGoalHours]);

  const handleWeeklyGoalSave = useCallback(async () => {
    const parsed = Number(weeklyGoal);

    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 168) {
      setGoalError('Informe um valor entre 1 e 168 horas.');
      return;
    }

    try {
      setIsSavingGoal(true);
      setGoalError(null);
      await onUpdate({ weeklyGoalHours: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar meta';
      setGoalError(message);
    } finally {
      setIsSavingGoal(false);
    }
  }, [onUpdate, weeklyGoal]);

  const handleThemeChange = useCallback(
    async (theme: ThemeMode) => {
      setTheme(theme);
      await onUpdate({ theme });
    },
    [onUpdate, setTheme],
  );

  const handleToggle = useCallback(
    async (field: 'alwaysOnTop' | 'launchOnStartup', value: boolean) => {
      setActionError(null);
      try {
        await onUpdate({ [field]: value });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao salvar configuração';
        setActionError(message);
      }
    },
    [onUpdate],
  );

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Meta semanal</CardTitle>
          <CardDescription>Defina quantas horas deseja estudar por semana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="weeklyGoal">Horas por semana</Label>
              <Input
                id="weeklyGoal"
                type="number"
                min={1}
                max={168}
                step={0.5}
                value={weeklyGoal}
                onChange={(event) => {
                  setWeeklyGoal(event.target.value);
                  setGoalError(null);
                }}
                onBlur={() => void handleWeeklyGoalSave()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleWeeklyGoalSave();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void handleWeeklyGoalSave()} disabled={isSavingGoal}>
                {isSavingGoal ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {goalError && <p className="text-destructive text-sm">{goalError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha o tema do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={settings.theme === value ? 'default' : 'outline'}
                className={cn('h-auto flex-col gap-2 py-4')}
                onClick={() => void handleThemeChange(value)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento</CardTitle>
          <CardDescription>Preferências do cronômetro e do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="alwaysOnTop">Sempre no topo</Label>
              <p className="text-muted-foreground text-xs">
                Mantém a janela acima das outras durante o estudo.
              </p>
            </div>
            <Switch
              id="alwaysOnTop"
              checked={settings.alwaysOnTop}
              onCheckedChange={(checked) => void handleToggle('alwaysOnTop', checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="launchOnStartup">Iniciar com o Windows</Label>
              <p className="text-muted-foreground text-xs">
                Abre o Study Tracker automaticamente ao ligar o computador.
              </p>
            </div>
            <Switch
              id="launchOnStartup"
              checked={settings.launchOnStartup}
              onCheckedChange={(checked) => void handleToggle('launchOnStartup', checked)}
            />
          </div>

          {actionError && <p className="text-destructive text-sm">{actionError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
