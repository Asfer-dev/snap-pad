import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from '@tiptap/markdown';
import { Editor, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

interface NoteEditorSource {
  id: string;
  content: string;
}

interface MarkdownEditor extends Editor {
  getMarkdown(): string;
}

interface UseNoteEditorParams {
  note: NoteEditorSource | null;
  onMarkdownChange?: (markdown: string) => void;
}

export const useNoteEditor = ({ note, onMarkdownChange }: UseNoteEditorParams) => {
  const onMarkdownChangeRef = useRef(onMarkdownChange);

  useEffect(() => {
    onMarkdownChangeRef.current = onMarkdownChange;
  }, [onMarkdownChange]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
        }),
        Markdown,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
      ],
      content: '',
      editorProps: {
        attributes: {
          class:
            'prose prose-neutral focus:outline-none max-w-full min-h-[400px] text-neutral-800 leading-relaxed',
        },
      },
      onUpdate: ({ editor }) => {
        const currentMarkdown = (editor as MarkdownEditor).getMarkdown();
        onMarkdownChangeRef.current?.(currentMarkdown);
      },
    },
    [note?.id],
  );

  useEffect(() => {
    if (!editor || !note) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (editor.isDestroyed) {
        return;
      }

      const currentMarkdown = (editor as MarkdownEditor).getMarkdown();

      if (note.content !== currentMarkdown) {
        editor.commands.setContent(note.content, {
          emitUpdate: false,
          contentType: 'markdown',
        });
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [editor, note]);

  const getMarkdown = () => {
    if (!editor) {
      return note?.content ?? '';
    }

    return (editor as MarkdownEditor).getMarkdown();
  };

  return {
    editor,
    getMarkdown,
  };
};
