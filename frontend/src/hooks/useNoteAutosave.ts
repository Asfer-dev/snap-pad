import { useEffect, useRef, useState } from 'react';
import type { RawNote } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseNoteAutosaveParams {
  note: RawNote | null;
  onNoteUpdate?: (updatedNote: RawNote) => void;
}

export const useNoteAutosave = ({ note, onNoteUpdate }: UseNoteAutosaveParams) => {
  const [title, setTitle] = useState(() => note?.title || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    const nextTitle = note?.title || '';
    setTitle(nextTitle);
    titleRef.current = nextTitle;
    setSaveStatus('saved');

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, [note?.id, note?.title]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const scheduleAutosave = (updatedTitle: string, updatedContent: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!note) {
      return;
    }

    setSaveStatus('saving');

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ title: updatedTitle, content: updatedContent }),
        });

        if (!response.ok) {
          throw new Error('Autosave failed');
        }

        setSaveStatus('saved');

        onNoteUpdate?.({
          ...note,
          title: updatedTitle,
          content: updatedContent,
        });
      } catch (error) {
        console.error(error);
        setSaveStatus('error');
      }
    }, 1200);
  };

  const handleTitleChange = (nextTitle: string, currentContent: string) => {
    setTitle(nextTitle);
    titleRef.current = nextTitle;
    scheduleAutosave(nextTitle, currentContent);
  };

  const handleTitleBlur = (currentContent: string) => {
    if (!note || titleRef.current === note.title) {
      return;
    }

    scheduleAutosave(titleRef.current, currentContent);
  };

  const scheduleContentAutosave = (updatedContent: string) => {
    scheduleAutosave(titleRef.current, updatedContent);
  };

  return {
    title,
    saveStatus,
    handleTitleChange,
    handleTitleBlur,
    scheduleAutosave,
    scheduleContentAutosave,
  };
};
