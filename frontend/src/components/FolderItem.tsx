// frontend/src/components/FolderItem.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { FolderNode } from '../types';

interface FolderItemProps {
  folder: FolderNode;
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onCreateNote: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  depth?: number;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  activeNoteId,
  onNoteSelect,
  onCreateNote,
  onDeleteFolder,
  onRenameFolder,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renamePromptOpenRef = useRef(false);

  // Close context menu if user clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="select-none">
      {/* Folder Row */}
      <div
        className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-neutral-100 cursor-pointer transition-colors relative"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 text-sm font-medium text-neutral-700 min-w-0 flex-1">
          <span className="text-neutral-400 text-xs w-4">{isOpen ? '▼' : '▶'}</span>
          <span className="text-base">{isOpen ? '📂' : '📁'}</span>
          <span className="truncate">{folder.name}</span>
        </div>

        {/* Action Controls Matrix */}
        <div className="flex items-center space-x-1">
          {/* Hover-to-trigger "Add Note inside Folder" action */}
          <button
            type="button"
            title={`New Note in ${folder.name}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling folder collapse
              setIsOpen(true);
              onCreateNote(folder.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-neutral-200 text-neutral-500 rounded p-0.5 text-xs transition-opacity"
          >
            ➕📄
          </button>

          {/* 3-Dot Trigger Button */}
          <button
            type="button"
            title="Folder Options"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling folder collapse
              setShowMenu(!showMenu);
            }}
            className={`${
              showMenu ? 'opacity-100 bg-neutral-200' : 'opacity-0 group-hover:opacity-100'
            } hover:bg-neutral-200 text-neutral-500 rounded p-0.5 text-xs transition-opacity font-bold`}
          >
            •••
          </button>

          {/* Context Popover Dropdown Panel Menu */}
          {showMenu && (
            <div
              ref={menuRef} // 👈 ATTACHED DIRECTLY HERE NOW
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()} // 👈 STOPS ALL INTERNAL CLICKS FROM BLEEDING OUT
              className="absolute right-2 top-8 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 text-xs text-left"
            >
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  setShowMenu(false);

                  if (renamePromptOpenRef.current) {
                    return;
                  }

                  renamePromptOpenRef.current = true;

                  try {
                    const currentName = folder.name;
                    const newName = window.prompt('Rename folder to:', currentName);

                    if (newName && newName.trim() !== '' && newName !== currentName) {
                      onRenameFolder(folder.id, newName.trim());
                    }
                  } finally {
                    renamePromptOpenRef.current = false;
                  }
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-neutral-700 flex items-center space-x-2"
              >
                <span>✏️</span> <span>Rename</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  setShowMenu(false);

                  if (
                    window.confirm(
                      `Are you sure you want to delete "${folder.name}"? This will delete all contents permanently.`,
                    )
                  ) {
                    onDeleteFolder(folder.id);
                  }
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 border-t border-neutral-100 flex items-center space-x-2"
              >
                <span>🗑️</span> <span>Delete</span>
              </button>
            </div>
          )}
        </div>
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
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
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
