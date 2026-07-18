import React, { useState } from 'react';
import type { NoteNode, SidebarTree } from '../types';
import { CreateFolderDialog } from './CreateFolderDialog';
import { DeleteNoteDialog } from './DeleteNoteDialog';
import { FolderItem } from './folder-item/FolderItem';
import { AddFileIcon, AddFolderIcon, FileIcon, SnapPadIcon } from './icon';

interface SidebarProps {
  tree: SidebarTree;
  activeNoteId: string | null;
  userName: string;
  onNoteSelect: (id: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: (folderName: string) => void | Promise<void>;
  onSignOut: () => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void | Promise<void>;
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
  onDeleteNote,
  onRenameFolder,
}) => {
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [notePendingDeletion, setNotePendingDeletion] = useState<NoteNode | null>(null);

  return (
    <div className="w-64 border-r border-neutral-200 bg-white h-screen flex flex-col justify-between">
      {/* Top Section: App logo & Main Controls */}
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SnapPadIcon className="h-7 w-7 shrink-0" />
            <span className="text-lg font-bold tracking-tight text-neutral-800">SnapPad</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onCreateNote(null)}
              title="New Note"
              className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <AddFileIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsCreateFolderDialogOpen(true)}
              title="New Folder"
              className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <AddFolderIcon className="h-6 w-6" />
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
              onRequestDeleteNote={setNotePendingDeletion}
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
                className={`group flex items-center space-x-2 py-1.5 px-3 text-sm rounded-md cursor-pointer select-none transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <FileIcon className="h-5.5 w-5.5 shrink-0" />
                <button
                  type="button"
                  title={`Delete ${note.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setNotePendingDeletion(note);
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
          className="text-xs font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      <CreateFolderDialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
        onCreateFolder={onCreateFolder}
      />
      <DeleteNoteDialog
        note={notePendingDeletion}
        onOpenChange={(open) => {
          if (!open) setNotePendingDeletion(null);
        }}
        onDeleteNote={onDeleteNote}
      />
    </div>
  );
};
