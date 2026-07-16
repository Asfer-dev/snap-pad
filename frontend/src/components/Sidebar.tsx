// frontend/src/components/Sidebar.tsx
import React from 'react';
import type { SidebarTree } from '../types';
import { FolderItem } from './FolderItem';

interface SidebarProps {
  tree: SidebarTree;
  activeNoteId: string | null;
  userName: string;
  onNoteSelect: (id: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onSignOut: () => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activeNoteId,
  userName,
  onNoteSelect,
  onCreateNote,
  onCreateFolder,
  onSignOut,
  onDeleteFolder,
  onRenameFolder,
}) => {
  return (
    <div className="w-64 border-r border-neutral-200 bg-white h-screen flex flex-col justify-between">
      {/* Top Section: App logo & Main Controls */}
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-bold tracking-tight text-neutral-800">SnapPad</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onCreateNote(null)}
              title="New Note"
              className="p-1 rounded hover:bg-neutral-100 text-sm transition-colors"
            >
              ➕📄
            </button>
            <button
              onClick={onCreateFolder}
              title="New Folder"
              className="p-1 rounded hover:bg-neutral-100 text-sm transition-colors"
            >
              ➕📁
            </button>
          </div>
        </div>

        {/* Middle Section: Scrollable Tree Menu */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {/* 1. Render Folders (Recursively) */}
          {tree.rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              activeNoteId={activeNoteId}
              onNoteSelect={onNoteSelect}
              onCreateNote={(fId) => onCreateNote(fId)}
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
            />
          ))}

          {/* 2. Render Root Notes (Uncategorized) */}
          {tree.rootNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => onNoteSelect(note.id)}
                className={`flex items-center space-x-2 py-1.5 px-3 text-sm rounded-md cursor-pointer select-none transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>📄</span>
                <span className="truncate">{note.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned Bottom Section: User Metadata & Action */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-neutral-700 truncate">{userName}</span>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
