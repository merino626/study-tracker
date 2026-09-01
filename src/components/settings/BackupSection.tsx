import { useCallback, useState } from 'react';
import { Archive, Download, FolderOpen, RotateCcw, ShieldCheck } from 'lucide-react';
import type { AppSettings, BackupPreview, UpdateSettingsInput } from '@shared/types/models';
import { BACKUP_MODULES } from '@shared/constants/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBackup } from '@/hooks/useBackup';

interface BackupSectionProps {
  settings: AppSettings;
  onUpdate: (data: UpdateSettingsInput) => Promise<void>;
  onPickBackupFolder: () => Promise<string | null>;
}

const MODULE_LABELS: Record<(typeof BACKUP_MODULES)[number], string> = {
  sessions: 'Sessões de estudo',
  courses: 'Cursos, caderno e anexos',
  settings: 'Configurações e metas',
};

export function BackupSection({ settings, onUpdate, onPickBackupFolder }: BackupSectionProps) {
  const hasFolder = Boolean(settings.backupFolderPath);
  const backup = useBackup(hasFolder);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set(BACKUP_MODULES));

  const handlePickFolder = useCallback(async () => {
    setActionError(null);
    try {
      const folderPath = await onPickBackupFolder();
      if (folderPath) {
        await onUpdate({ backupFolderPath: folderPath });
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Erro ao selecionar pasta');
    }
  }, [onPickBackupFolder, onUpdate]);

  const handleCreateBackup = useCallback(async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      setIsCreating(true);
      const created = await backup.createBackup();
      setActionSuccess(`Backup criado: ${created.fileName}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Erro ao criar backup');
    } finally {
      setIsCreating(false);
    }
  }, [backup]);

  const handlePickRestoreFile = useCallback(async () => {
    setActionError(null);
    setPreview(null);
    try {
      const filePath = await backup.pickBackupFile();
      if (!filePath) {
        return;
      }
      setSelectedFile(filePath);
      const previewData = await backup.previewBackup(filePath);
      setPreview(previewData);
      if (!previewData.valid) {
        setActionError(previewData.errors.join(' '));
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Erro ao ler backup');
    }
  }, [backup]);

  const handleRestore = useCallback(async () => {
    if (!selectedFile || !preview?.valid) {
      return;
    }

    setActionError(null);
    try {
      await backup.restoreBackup({
        filePath: selectedFile,
        modules: [...selectedModules] as Array<(typeof BACKUP_MODULES)[number]>,
      });
      setActionSuccess('Restauração concluída com sucesso.');
      setPreview(null);
      setSelectedFile(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Erro ao restaurar backup');
    }
  }, [backup, preview, selectedFile, selectedModules]);

  const toggleModule = (module: string) => {
    setSelectedModules((current) => {
      const next = new Set(current);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="size-4" />
          Backup e restauração
        </CardTitle>
        <CardDescription>
          Mantenha cópias de segurança em JSON compactado. Backups automáticos diários e ao encerrar
          o app (configurável).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-0.5">
            <Label>Pasta de backup</Label>
            <p className="text-muted-foreground text-xs">
              Local onde os arquivos backup-AAAA-MM-DD-HH-MM-SS.zip serão salvos.
            </p>
          </div>
          <p className="bg-muted rounded-md px-3 py-2 text-sm break-all">
            {settings.backupFolderPath ?? 'Nenhuma pasta selecionada'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => void handlePickFolder()}>
              <FolderOpen className="size-4" />
              Selecionar pasta
            </Button>
            {settings.backupFolderPath && (
              <Button variant="ghost" onClick={() => void onUpdate({ backupFolderPath: null })}>
                Remover
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="autoBackupDaily">Backup automático diário</Label>
              <p className="text-muted-foreground text-xs">
                Cria um backup ao abrir o app, se passou mais de 24h desde o último.
              </p>
            </div>
            <Switch
              id="autoBackupDaily"
              checked={settings.autoBackupDaily}
              onCheckedChange={(checked) => void onUpdate({ autoBackupDaily: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="backupOnQuit">Backup ao encerrar</Label>
              <p className="text-muted-foreground text-xs">
                Gera backup automaticamente ao fechar o aplicativo.
              </p>
            </div>
            <Switch
              id="backupOnQuit"
              checked={settings.backupOnQuit}
              onCheckedChange={(checked) => void onUpdate({ backupOnQuit: checked })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            disabled={!hasFolder || isCreating}
            onClick={() => void handleCreateBackup()}
          >
            <Download className="size-4" />
            {isCreating ? 'Criando backup...' : 'Backup manual'}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void handlePickRestoreFile()}>
            <RotateCcw className="size-4" />
            Restaurar backup
          </Button>
        </div>

        {hasFolder && backup.backups.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Versões recentes ({backup.backups.length})</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {backup.backups.slice(0, 10).map((item) => (
                <button
                  key={item.filePath}
                  type="button"
                  className="hover:bg-accent flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
                  onClick={() => {
                    setSelectedFile(item.filePath);
                    void backup.previewBackup(item.filePath).then(setPreview);
                  }}
                >
                  <span className="truncate">{item.fileName}</span>
                  <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                    {(item.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={preview.valid ? 'size-4 text-green-600' : 'text-destructive size-4'}
              />
              <p className="text-sm font-medium">
                {preview.valid ? 'Backup válido' : 'Backup inválido'}
              </p>
            </div>

            {preview.valid && (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>Sessões: {preview.counts.sessions}</p>
                  <p>Cursos: {preview.counts.courses}</p>
                  <p>Anotações: {preview.counts.courseNotes}</p>
                  <p>Anexos: {preview.counts.courseAttachments}</p>
                  <p>Configurações: {preview.counts.settings}</p>
                  <p>Categorias: {preview.counts.categories}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Módulos para restaurar</p>
                  {BACKUP_MODULES.map((module) => (
                    <label key={module} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedModules.has(module)}
                        onChange={() => toggleModule(module)}
                      />
                      {MODULE_LABELS[module]}
                    </label>
                  ))}
                </div>

                <Button
                  className="gap-2"
                  disabled={selectedModules.size === 0}
                  onClick={() => void handleRestore()}
                >
                  <RotateCcw className="size-4" />
                  Confirmar restauração
                </Button>
              </>
            )}

            {!preview.valid && (
              <p className="text-destructive text-sm">{preview.errors.join(' ')}</p>
            )}
          </div>
        )}

        {actionError && <p className="text-destructive text-sm">{actionError}</p>}
        {actionSuccess && <p className="text-sm text-green-600">{actionSuccess}</p>}
      </CardContent>
    </Card>
  );
}
