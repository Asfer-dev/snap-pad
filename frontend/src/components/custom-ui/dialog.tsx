import React, { useEffect } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  description,
  children,
  onOpenChange,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 id="dialog-title" className="text-base font-semibold text-neutral-900">
            {title}
          </h2>
          {description && (
            <p id="dialog-description" className="text-sm leading-5 text-neutral-500">
              {description}
            </p>
          )}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};
