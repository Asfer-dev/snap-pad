// frontend/src/components/FolderItem.tsx
import React, { useState } from 'react';
import type { FolderNode } from '../types';

interface FolderItemProps {
  folder: FolderNode;
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: (folderId: string) => void;
  depth?: number;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  activeNoteId,
  onNoteSelect,
  onCreateNote,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="select-none">
      {/* Folder Row */}
      <div
        className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-neutral-100 cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 text-sm font-medium text-neutral-700">
          <span className="text-neutral-400 text-xs w-4">{isOpen ? '▼' : '▶'}</span>
          <span className="text-base">{isOpen ? '📂' : '📁'}</span>
          <span>{folder.name}</span>
        </div>

        {/* Hover-to-trigger "Add Note inside Folder" action */}
        <button
          title={`New Note in ${folder.name}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggling the folder collapse
            onCreateNote(folder.id);
          }}
          className="opacity-0 group-hover:opacity-100 hover:bg-neutral-200 text-neutral-500 rounded p-0.5 text-xs transition-opacity"
        >
          ➕📄
        </button>
      </div>

      {/* Expanded Folder Items */}
      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {/* Recursion: Render subfolders */}
          {folder.subfolders.map((subfolder) => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              activeNoteId={activeNoteId}
              onNoteSelect={onNoteSelect}
              onCreateNote={onCreateNote}
              depth={depth + 1}
            />
          ))}

          {/* Render local folder notes */}
          {folder.notes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => onNoteSelect(note.id)}
                className={`flex items-center space-x-2 py-1 px-3 text-sm rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
              >
                <span>📄</span>
                <span className="truncate">{note.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
