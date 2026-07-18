import React, { useEffect, useState } from 'react';
import type { FolderNode } from '../../types';
import { Dialog } from '../custom-ui/dialog';

interface RenameFolderDialogProps {
  folder: FolderNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export const RenameFolderDialog: React.FC<RenameFolderDialogProps> = ({
  folder,
  open,
  onOpenChange,
  onRenameFolder,
}) => {
  const [folderName, setFolderName] = useState(folder.name);

  useEffect(() => {
    if (open) {
      setFolderName(folder.name);
    }
  }, [folder.name, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = folderName.trim();
    if (!trimmedName || trimmedName === folder.name) {
      onOpenChange(false);
      return;
    }

    onRenameFolder(folder.id, trimmedName);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      title="Rename folder"
      description={`Update the name for "${folder.name}".`}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          autoFocus
          placeholder="Folder name"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!folderName.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200 transition-colors cursor-pointer"
          >
            Rename
          </button>
        </div>
      </form>
    </Dialog>
  );
};
