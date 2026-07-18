import React from 'react';
import type { NoteNode } from '../types';
import { Dialog } from './custom-ui/dialog';

interface DeleteNoteDialogProps {
  note: NoteNode | null;
  onOpenChange: (open: boolean) => void;
  onDeleteNote: (noteId: string) => void | Promise<void>;
}

export const DeleteNoteDialog: React.FC<DeleteNoteDialogProps> = ({
  note,
  onOpenChange,
  onDeleteNote,
}) => {
  const handleConfirmDelete = async () => {
    if (!note) return;

    await onDeleteNote(note.id);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={Boolean(note)}
      title="Delete note?"
      description={note ? `This will permanently delete "${note.title}".` : undefined}
      onOpenChange={onOpenChange}
    >
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirmDelete}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </Dialog>
  );
};
