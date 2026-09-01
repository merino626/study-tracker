import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CourseNote } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CourseAttachmentPanel } from '@/components/courses/CourseAttachmentPanel';
import { useCourseNotes } from '@/hooks/useCourseNotes';
import { cn } from '@/lib/utils';
import { formatSessionDateTime } from '@/utils/date';

interface CourseNotebookTabProps {
  courseId: string;
}

export function CourseNotebookTab({ courseId }: CourseNotebookTabProps) {
  const { notes, createNote, updateNote, deleteNote } = useCourseNotes(courseId);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0]?.id ?? null);
    }
  }, [notes, selectedNoteId]);

  const handleCreateNote = async () => {
    setError(null);
    try {
      const note = await createNote({
        courseId,
        title: 'Nova anotação',
        content: '',
      });
      setSelectedNoteId(note.id);
      setTitle(note.title);
      setContent(note.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar anotação');
    }
  };

  const handleSave = async () => {
    if (!selectedNoteId) {
      return;
    }

    setError(null);
    try {
      setIsSaving(true);
      await updateNote(selectedNoteId, { title: title.trim() || 'Sem título', content });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar anotação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNoteId) {
      return;
    }

    await deleteNote(selectedNoteId);
    setSelectedNoteId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-3">
        <Button className="w-full gap-2" variant="outline" onClick={() => void handleCreateNote()}>
          <Plus className="size-4" />
          Nova página
        </Button>

        <div className="max-h-[520px] space-y-1 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-muted-foreground px-1 text-xs">
              Seu caderno está vazio. Crie a primeira anotação.
            </p>
          ) : (
            notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === selectedNoteId}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))
          )}
        </div>
      </aside>

      <section className="space-y-4 rounded-lg border p-4">
        {selectedNote ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="noteTitle">Título</Label>
              <Input
                id="noteTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da anotação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noteContent">Conteúdo (Markdown)</Label>
              <textarea
                id="noteContent"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={14}
                placeholder="Escreva suas anotações aqui...&#10;&#10;# Título&#10;- Item 1&#10;- Item 2"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-64 w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>

            <CourseAttachmentPanel courseId={courseId} noteId={selectedNoteId} />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar anotação'}
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => void handleDelete()}>
                <Trash2 className="size-4" />
                Excluir página
              </Button>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
          </>
        ) : (
          <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-2 text-sm">
            <p>Selecione uma página ou crie uma nova anotação.</p>
            <Button variant="outline" onClick={() => void handleCreateNote()}>
              Criar primeira anotação
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

interface NoteListItemProps {
  note: CourseNote;
  isActive: boolean;
  onClick: () => void;
}

function NoteListItem({ note, isActive, onClick }: NoteListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent w-full rounded-md border px-3 py-2 text-left transition-colors',
        isActive && 'border-primary bg-accent',
      )}
    >
      <p className="truncate text-sm font-medium">{note.title}</p>
      <p className="text-muted-foreground mt-1 text-xs">{formatSessionDateTime(note.updatedAt)}</p>
    </button>
  );
}
