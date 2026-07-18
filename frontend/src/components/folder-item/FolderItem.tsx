import React, { useState } from 'react';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { FolderNoteRow } from './FolderNoteRow';
import { FolderRow } from './FolderRow';
import { RenameFolderDialog } from './RenameFolderDialog';
import type { FolderItemProps } from '../../types/index';

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  activeNoteId,
  onNoteSelect,
  onCreateNote,
  onDeleteFolder,
  onRequestDeleteNote,
  onRenameFolder,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCreateNote = (folderId: string) => {
    setIsOpen(true);
    onCreateNote(folderId);
  };

  const handleRequestRename = () => {
    setShowMenu(false);
    setIsRenameDialogOpen(true);
  };

  const handleRequestDelete = () => {
    setShowMenu(false);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="select-none">
      <FolderRow
        folder={folder}
        depth={depth}
        isOpen={isOpen}
        showMenu={showMenu}
        onToggleOpen={() => setIsOpen((current) => !current)}
        onCreateNote={handleCreateNote}
        onMenuToggle={() => setShowMenu((current) => !current)}
        onMenuClose={() => setShowMenu(false)}
        onRequestRename={handleRequestRename}
        onRequestDelete={handleRequestDelete}
      />

      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {folder.subfolders.map((subfolder) => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              activeNoteId={activeNoteId}
              onNoteSelect={onNoteSelect}
              onCreateNote={onCreateNote}
              onDeleteFolder={onDeleteFolder}
              onRequestDeleteNote={onRequestDeleteNote}
              onRenameFolder={onRenameFolder}
              depth={depth + 1}
            />
          ))}

          {folder.notes.map((note) => (
            <FolderNoteRow
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              depth={depth + 1}
              onNoteSelect={onNoteSelect}
              onRequestDeleteNote={onRequestDeleteNote}
            />
          ))}
        </div>
      )}

      <RenameFolderDialog
        folder={folder}
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onRenameFolder={onRenameFolder}
      />
      <DeleteFolderDialog
        folder={folder}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteFolder={onDeleteFolder}
      />
    </div>
  );
};
