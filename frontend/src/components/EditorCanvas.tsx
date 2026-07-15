// frontend/src/components/EditorCanvas.tsx
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item'; // 👈 Import Task Item
import TaskList from '@tiptap/extension-task-list'; // 👈 Import Task List
import { Markdown } from '@tiptap/markdown';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useRef, useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
}

interface EditorCanvasProps {
  note: Note | null;
  breadcrumbs: string[];
  onNoteUpdate?: (updatedNote: Note) => void;
  onNoteDelete?: (noteId: string) => void;
}

interface MarkdownEditor extends Editor {
  getMarkdown(): string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  note,
  breadcrumbs,
  onNoteUpdate,
  onNoteDelete,
}) => {
  const [title, setTitle] = useState(() => note?.title || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [isDeleting, setIsDeleting] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
        }),
        Markdown,
        TaskList, // 👈 Enable checkbox lists
        TaskItem.configure({
          nested: true, // Allows nesting checkmarks
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
        setSaveStatus('saving');
        const updatedMarkdown = (editor as MarkdownEditor).getMarkdown();
        triggerAutosave(title, updatedMarkdown);
      },
    },
    [note?.id],
  );

  // Sync content
  useEffect(() => {
    if (editor && note) {
      const currentMarkdown = (editor as MarkdownEditor).getMarkdown();

      const timeoutId = setTimeout(() => {
        if (editor.isDestroyed) return;

        if (note.content !== currentMarkdown) {
          editor.commands.setContent(note.content, {
            emitUpdate: false,
            contentType: 'markdown',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
        }

        setSaveStatus('saved');
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [note, note?.id, note?.content, editor]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const triggerAutosave = (updatedTitle: string, updatedContent: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!note) return;

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

        if (!response.ok) throw new Error('Autosave failed');

        setSaveStatus('saved');

        if (onNoteUpdate) {
          onNoteUpdate({
            ...note,
            title: updatedTitle,
            content: updatedContent,
          });
        }
      } catch (err) {
        console.error(err);
        setSaveStatus('error');
      }
    }, 1200);
  };

  const handleTitleBlur = () => {
    if (note && title !== note.title) {
      setSaveStatus('saving');
      const currentMarkdown = editor ? (editor as MarkdownEditor).getMarkdown() : note.content;
      triggerAutosave(title, currentMarkdown);
    }
  };

  // 👈 API request handler for deleting the note
  const handleDelete = async () => {
    if (!note) return;
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete note');

      if (onNoteDelete) {
        onNoteDelete(note.id);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete the note. Please try again.');
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-neutral-400 text-sm">
        <p>Select a note from the sidebar or create a new one to begin writing.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden relative">
      {/* Breadcrumbs */}
      <div className="px-8 py-3 border-b border-neutral-100 flex items-center space-x-2 text-xs text-neutral-400 font-medium select-none">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="hover:text-neutral-600 cursor-pointer transition-colors">{crumb}</span>
            {idx < breadcrumbs.length - 1 && <span>&gt;</span>}
          </React.Fragment>
        ))}
      </div>

      {/* 👈 Clean Interactive Delete Action */}
      <div className="flex items-center space-x-2 text-xs">
        {isDeleting ? (
          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-500 font-medium">Delete permanently?</span>
            <button
              onClick={handleDelete}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setIsDeleting(false)}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-medium rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsDeleting(true)}
            className="text-neutral-400 hover:text-red-500 font-medium transition-colors p-1"
            title="Delete Note"
          >
            {/* Simple inline Trash Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.5 w-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('saving');
              const currentMarkdown = editor
                ? (editor as MarkdownEditor).getMarkdown()
                : note.content;
              triggerAutosave(e.target.value, currentMarkdown);
            }}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="Untitled Note"
            className="w-full text-3xl font-bold tracking-tight text-neutral-900 mb-6 outline-none border-b border-transparent focus:border-neutral-100 pb-1.5 transition-colors placeholder-neutral-300 bg-transparent"
          />

          {/* Expanded Rich Formatting Bubble Menu */}
          {editor && (
            <BubbleMenu
              editor={editor}
              className="flex items-center space-x-1 bg-neutral-900 text-white rounded-lg shadow-lg py-1 px-1.5 text-xs border border-neutral-800 flex-wrap max-w-sm sm:max-w-md"
            >
              {/* Bold & Italic */}
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('bold') ? 'text-blue-400 font-bold' : ''}`}
              >
                B
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('italic') ? 'text-blue-400 italic' : ''}`}
              >
                I
              </button>

              {/* Dynamic Link / Unlink */}
              {editor.isActive('link') ? (
                <button
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  className="px-2 py-1 rounded bg-red-950 text-red-400 hover:bg-red-900/60 transition-colors font-medium"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) {
                      const formattedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
                      editor.chain().focus().setLink({ href: formattedUrl }).run();
                    }
                  }}
                  className="px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
                >
                  Link
                </button>
              )}

              <div className="w-px h-4 bg-neutral-800 mx-1" />

              {/* Headings */}
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-blue-400 font-bold' : ''}`}
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-blue-400 font-bold' : ''}`}
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'text-blue-400 font-bold' : ''}`}
              >
                H3
              </button>

              <div className="w-px h-4 bg-neutral-800 mx-1" />

              {/* List Toggles */}
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('bulletList') ? 'text-blue-400 font-bold' : ''}`}
                title="Bullet List"
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('orderedList') ? 'text-blue-400 font-bold' : ''}`}
                title="Numbered List"
              >
                1. List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`px-2 py-1 rounded hover:bg-neutral-800 transition-colors ${editor.isActive('taskList') ? 'text-blue-400 font-bold' : ''}`}
                title="Checklist"
              >
                [✓] Task
              </button>
            </BubbleMenu>
          )}

          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Saving Indicator */}
      <div className="absolute bottom-4 right-6 text-xs text-neutral-400 select-none bg-neutral-50 border border-neutral-200/60 rounded-full px-3 py-1 shadow-sm font-medium">
        {saveStatus === 'saving' && (
          <span className="flex items-center space-x-1">
            <span className="animate-pulse w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block" />
            <span>Saving...</span>
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center space-x-1 text-green-600">
            <span>Saved ✓</span>
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center space-x-1 text-red-500">
            <span>Error Saving ⚠</span>
          </span>
        )}
      </div>
    </div>
  );
};
