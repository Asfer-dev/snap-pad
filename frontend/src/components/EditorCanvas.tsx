// frontend/src/components/EditorCanvas.tsx
import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import React from 'react';
import { useNoteAutosave } from '../hooks/useNoteAutosave';
import { useNoteEditor } from '../hooks/useNoteEditor';
import type { RawNote } from '../types';

interface EditorCanvasProps {
  note: RawNote | null;
  breadcrumbs: string[];
  onNoteUpdate?: (updatedNote: RawNote) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  note,
  breadcrumbs,
  onNoteUpdate,
}) => {
  const { title, saveStatus, handleTitleChange, handleTitleBlur, scheduleContentAutosave } =
    useNoteAutosave({
      note,
      onNoteUpdate,
    });
  const { editor, getMarkdown } = useNoteEditor({
    note,
    onMarkdownChange: scheduleContentAutosave,
  });

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-neutral-400 text-sm">
        <p>Select a note from the sidebar or create a new one to begin writing.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden relative">
      <div className="px-8 py-3 border-b border-neutral-100 flex items-center space-x-2 text-xs text-neutral-400 font-medium select-none">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="hover:text-neutral-600 cursor-pointer transition-colors">{crumb}</span>
            {idx < breadcrumbs.length - 1 && <span>&gt;</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              handleTitleChange(e.target.value, getMarkdown());
            }}
            onBlur={() => {
              handleTitleBlur(getMarkdown());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="Untitled Note"
            className="w-full text-3xl font-bold tracking-tight text-neutral-900 mb-6 outline-none border-b border-transparent focus:border-neutral-100 pb-1.5 transition-colors placeholder-neutral-300 bg-transparent"
          />

          {editor && (
            <BubbleMenu
              editor={editor}
              className="flex items-center space-x-1 bg-neutral-900 text-white rounded-lg shadow-lg py-1 px-1.5 text-xs border border-neutral-800 flex-wrap max-w-sm sm:max-w-md"
            >
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
