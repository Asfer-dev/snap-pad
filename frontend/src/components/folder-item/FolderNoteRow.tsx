import React from 'react';
import type { NoteNode } from '../../types';
import { FileIcon } from '../icon';

interface FolderNoteRowProps {
  note: NoteNode;
  isActive: boolean;
  depth: number;
  onNoteSelect: (id: string) => void;
  onRequestDeleteNote: (note: NoteNode) => void;
}

export const FolderNoteRow: React.FC<FolderNoteRowProps> = ({
  note,
  isActive,
  depth,
  onNoteSelect,
  onRequestDeleteNote,
}) => {
  return (
    <div
      onClick={() => onNoteSelect(note.id)}
      className={`group flex items-center space-x-2 py-1 px-3 text-sm rounded-md cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-100'
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <FileIcon className="h-5.5 w-5.5 shrink-0" />
      <button
        type="button"
        title={`Delete ${note.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onRequestDeleteNote(note);
        }}
        className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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
      <span className="truncate">{note.title}</span>
    </div>
  );
};
