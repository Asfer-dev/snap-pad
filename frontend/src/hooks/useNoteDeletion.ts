import { useState } from 'react';
import type { RawNote } from '../types';
import { secureFetch } from '../utils/api';

interface UseNoteDeletionParams {
  note: RawNote | null;
  onNoteDelete?: (noteId: string) => void;
}

export const useNoteDeletion = ({ note, onNoteDelete }: UseNoteDeletionParams) => {
  const [deleteState, setDeleteState] = useState<{ noteId: string | null; active: boolean }>({
    noteId: null,
    active: false,
  });

  const isDeleting = deleteState.active && deleteState.noteId === note?.id;

  const beginDelete = () => {
    setDeleteState({
      noteId: note?.id ?? null,
      active: true,
    });
  };

  const cancelDelete = () => {
    setDeleteState((currentState) => ({
      ...currentState,
      active: false,
    }));
  };

  const handleDelete = async () => {
    if (!note) {
      return;
    }

    try {
      const response = await secureFetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      onNoteDelete?.(note.id);

      setDeleteState({
        noteId: null,
        active: false,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to delete the note. Please try again.');
    }
  };

  return {
    isDeleting,
    beginDelete,
    cancelDelete,
    handleDelete,
  };
};
