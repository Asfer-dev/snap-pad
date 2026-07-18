import React, { useEffect, useRef } from 'react';

interface FolderOptionsMenuProps {
  onClose: () => void;
  onRequestRename: () => void;
  onRequestDelete: () => void;
}

export const FolderOptionsMenu: React.FC<FolderOptionsMenuProps> = ({
  onClose,
  onRequestRename,
  onRequestDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="absolute right-2 top-8 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 text-xs text-left"
    >
      <button
        type="button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onRequestRename();
        }}
        className="cursor-pointer w-full text-left px-3 py-1.5 hover:bg-neutral-50 text-neutral-700 flex items-center space-x-2"
      >
        <span>✏️</span> <span>Rename</span>
      </button>

      <button
        type="button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onRequestDelete();
        }}
        className="w-full cursor-pointer text-left px-3 py-1.5 hover:bg-red-50 text-red-600 border-t border-neutral-100 flex items-center space-x-2"
      >
        <span>🗑️</span> <span>Delete</span>
      </button>
    </div>
  );
};
