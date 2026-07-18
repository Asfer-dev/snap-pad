import React from 'react';
import type { FolderNode } from '../../types';
import { Dialog } from '../custom-ui/dialog';

interface DeleteFolderDialogProps {
  folder: FolderNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  folder,
  open,
  onOpenChange,
  onDeleteFolder,
}) => {
  const handleDelete = () => {
    onDeleteFolder(folder.id);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      title="Delete folder?"
      description={`This will permanently delete "${folder.name}" and everything inside it.`}
      onOpenChange={onOpenChange}
    >
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </Dialog>
  );
};
