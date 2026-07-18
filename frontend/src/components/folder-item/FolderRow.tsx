import React from 'react';
import type { FolderNode } from '../../types';
import { AddFileIcon, FolderIcon } from '../icon';
import { FolderOptionsMenu } from './FolderOptionsMenu';

interface FolderRowProps {
  folder: FolderNode;
  depth: number;
  isOpen: boolean;
  showMenu: boolean;
  onToggleOpen: () => void;
  onCreateNote: (folderId: string) => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onRequestRename: () => void;
  onRequestDelete: () => void;
}

export const FolderRow: React.FC<FolderRowProps> = ({
  folder,
  depth,
  isOpen,
  showMenu,
  onToggleOpen,
  onCreateNote,
  onMenuToggle,
  onMenuClose,
  onRequestRename,
  onRequestDelete,
}) => {
  return (
    <div
      className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-neutral-100 cursor-pointer transition-colors relative"
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={onToggleOpen}
    >
      <div className="flex items-center space-x-2 text-sm font-medium text-neutral-700 min-w-0 flex-1">
        <span className="text-neutral-400 text-xs w-4">{isOpen ? '▼' : '▶'}</span>
        <FolderIcon open={isOpen} className="h-5.5 w-5.5 shrink-0" />
        <span className="truncate">{folder.name}</span>
      </div>

      <div className="flex items-center space-x-1">
        <button
          type="button"
          title={`New Note in ${folder.name}`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onCreateNote(folder.id);
          }}
          className="opacity-0 cursor-pointer group-hover:opacity-100 hover:bg-neutral-200 rounded p-0.5 transition-opacity"
        >
          <AddFileIcon className="h-5.5 w-5.5" />
        </button>

        <button
          type="button"
          title="Folder Options"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onMenuToggle();
          }}
          className={`${
            showMenu ? 'opacity-100 bg-neutral-200' : 'opacity-0 group-hover:opacity-100'
          } hover:bg-neutral-200 text-neutral-500 rounded p-0.5 text-xs transition-opacity font-bold cursor-pointer`}
        >
          •••
        </button>

        {showMenu && (
          <FolderOptionsMenu
            onClose={onMenuClose}
            onRequestRename={onRequestRename}
            onRequestDelete={onRequestDelete}
          />
        )}
      </div>
    </div>
  );
};
