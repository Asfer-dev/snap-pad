import React, { useState } from 'react';
import { Dialog } from './custom-ui/dialog';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (folderName: string) => void | Promise<void>;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onOpenChange,
  onCreateFolder,
}) => {
  const [folderName, setFolderName] = useState('');

  const closeDialog = () => {
    setFolderName('');
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = folderName.trim();
    if (!trimmedName) return;

    await onCreateFolder(trimmedName);
    closeDialog();
  };

  return (
    <Dialog
      open={open}
      title="Create folder"
      description="Name your new folder."
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
          return;
        }

        closeDialog();
      }}
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
            onClick={closeDialog}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!folderName.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200 transition-colors cursor-pointer"
          >
            Create
          </button>
        </div>
      </form>
    </Dialog>
  );
};
