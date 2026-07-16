// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { EditorCanvas } from '../components/EditorCanvas';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import type { RawFolder, RawNote } from '../types';
import { secureFetch } from '../utils/api';
import { buildSidebarTree } from '../utils/treeBuilder';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();

  const [folders, setFolders] = useState<RawFolder[]>([]);
  const [notes, setNotes] = useState<RawNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleNoteUpdate = (updatedNote: RawNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  const handleNoteDelete = (deletedNoteId: string) => {
    // 1. Remove deleted note from state
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== deletedNoteId));

    // 2. Deselect active note so the canvas defaults to the blank state
    if (activeNoteId === deletedNoteId) {
      setActiveNoteId(null);
    }
  };

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        // secureFetch automatically appends the base URL and injects your Authorization headers!
        const [foldersRes, notesRes] = await Promise.all([
          secureFetch('/api/folders'),
          secureFetch('/api/notes'),
        ]);

        if (!foldersRes.ok || !notesRes.ok) throw new Error('Could not fetch workspace data');

        const rawFolders: RawFolder[] = await foldersRes.json();
        const rawNotes: RawNote[] = await notesRes.json();

        setFolders(rawFolders);
        setNotes(rawNotes);
      } catch (err) {
        console.error(err);
        setErrorBanner('Failed to load your workspace data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, []);

  // Compute Recursive Sidebar Structure
  const sidebarTree = buildSidebarTree(folders, notes);

  // Derive Breadcrumbs for Active Note
  const getBreadcrumbs = (): string[] => {
    const activeNote = notes.find((n) => n.id === activeNoteId);
    if (!activeNote) return [];

    const trail: string[] = [];
    let currentFolderId = activeNote.folder_id;

    while (currentFolderId) {
      const folder = folders.find((f) => f.id === currentFolderId);
      if (folder) {
        trail.unshift(folder.name);
        currentFolderId = folder.parent_folder_id;
      } else {
        break;
      }
    }

    trail.push(activeNote.title);
    return trail;
  };

  // 1. Optimistic Note Creation
  const handleCreateNote = async (folderId: string | null) => {
    const tempId = `temp-note-${Date.now()}`;
    const newOptimisticNote: RawNote = {
      id: tempId,
      title: 'Untitled Note',
      content: '',
      folder_id: folderId,
    };

    // Keep snapshot for potential rollback
    const previousNotes = [...notes];

    // Optimistic Update: Render instantly!
    setNotes((prev) => [...prev, newOptimisticNote]);
    setActiveNoteId(tempId);
    setErrorBanner(null);

    try {
      const response = await secureFetch('/api/notes', {
        method: 'POST',

        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
          folder_id: folderId,
        }),
      });

      if (!response.ok) throw new Error('Creation rejected by server');

      const confirmedNote: RawNote = await response.json();

      // Swap out temporary ID silently with real DB ID
      setNotes((prev) => prev.map((note) => (note.id === tempId ? confirmedNote : note)));

      // Keep selected state if user is actively focused on this new note
      setActiveNoteId((prevActiveId) =>
        prevActiveId === tempId ? confirmedNote.id : prevActiveId,
      );
    } catch (err) {
      console.error(err);
      // Rollback!
      setNotes(previousNotes);
      if (activeNoteId === tempId) {
        setActiveNoteId(null);
      }
      setErrorBanner('Failed to create note. Rolled back state.');
    }
  };

  // 2. Optimistic Folder Creation
  const handleCreateFolder = async () => {
    const folderName = window.prompt('Enter folder name:');
    if (!folderName) return;

    const tempId = `temp-folder-${Date.now()}`;
    const newOptimisticFolder: RawFolder = {
      id: tempId,
      name: folderName,
      parent_folder_id: null,
    };

    const previousFolders = [...folders];

    // Optimistic Update: Render instantly!
    setFolders((prev) => [...prev, newOptimisticFolder]);
    setErrorBanner(null);

    try {
      const response = await secureFetch('/api/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: folderName,
          parent_folder_id: null,
        }),
      });

      if (!response.ok) throw new Error('Creation rejected by server');

      const confirmedFolder: RawFolder = await response.json();

      // Swap IDs
      setFolders((prev) => prev.map((folder) => (folder.id === tempId ? confirmedFolder : folder)));
    } catch (err) {
      console.error(err);
      // Rollback
      setFolders(previousFolders);
      setErrorBanner('Failed to create folder. Rolled back state.');
    }
  };

  // 3. Optimistic Folder Deletion (Recursive Cleanup)
  const handleDeleteFolder = async (folderId: string) => {
    // Helper to recursively collect all child folder IDs down the tree
    const getAllChildFolderIds = (id: string, currentFolders: RawFolder[]): string[] => {
      const children = currentFolders.filter((f) => f.parent_folder_id === id);
      return [id, ...children.flatMap((c) => getAllChildFolderIds(c.id, currentFolders))];
    };

    // 1. Snapshot prior states for complete safety rollback coverage
    const previousFolders = [...folders];
    const previousNotes = [...notes];
    const previousActiveNoteId = activeNoteId;

    // 2. Identify all targets destined for eviction
    const folderIdsToDelete = getAllChildFolderIds(folderId, folders);

    // 3. Optimistically purge state targets synchronously
    setFolders((prev) => prev.filter((f) => !folderIdsToDelete.includes(f.id)));
    setNotes((prevNotes) => {
      const filteredNotes = prevNotes.filter(
        (n) => !n.folder_id || !folderIdsToDelete.includes(n.folder_id),
      );

      // Clear active note view layer instantly if it lived inside the targeted directory tree
      const currentActiveStillExists = filteredNotes.some((n) => n.id === previousActiveNoteId);
      if (!currentActiveStillExists) {
        setActiveNoteId(null);
      }
      return filteredNotes;
    });
    setErrorBanner(null);

    try {
      const response = await secureFetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Server rejected folder deletion request');
      // Success: State is already accurately tracking structural modifications
    } catch (err) {
      console.error(err);
      // Rollback absolute integrity matching previous structural state snapshots
      setFolders(previousFolders);
      setNotes(previousNotes);
      setActiveNoteId(previousActiveNoteId);
      setErrorBanner('Failed to delete folder directory. Workspace state restored.');
    }
  };

  // 4. Optimistic Folder Renaming
  const handleRenameFolder = async (folderId: string, newFolderName: string) => {
    const currentFolder = folders.find((f) => f.id === folderId);
    if (!currentFolder) return;

    if (
      !newFolderName ||
      newFolderName.trim() === '' ||
      newFolderName.trim() === currentFolder.name
    )
      return;

    const previousFolders = [...folders];

    // Optimistically modify structural context array references natively
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newFolderName.trim() } : f)),
    );
    setErrorBanner(null);

    try {
      const response = await secureFetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!response.ok)
        throw new Error('Server rejected folder rename transaction tracking changes');
    } catch (err) {
      console.error(err);
      // Fallback rollback processing implementation execution
      setFolders(previousFolders);
      setErrorBanner('Failed to save folder name modification. Rolled back state safely.');
    }
  };
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <span className="text-sm text-neutral-400 font-medium animate-pulse">
          Loading SnapPad Workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      {/* Error / Rollback Alert Toast Banner */}
      {errorBanner && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-md text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span>⚠ {errorBanner}</span>
          <button
            onClick={() => setErrorBanner(null)}
            className="hover:bg-red-100 p-0.5 rounded text-red-400 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        tree={sidebarTree}
        activeNoteId={activeNoteId}
        userName="Asfer"
        onNoteSelect={(id) => setActiveNoteId(id)}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onSignOut={logout}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
      />

      {/* Main Workspace Surface */}
      {/* Inside your Parent Component (e.g. Dashboard.tsx) */}
      {activeNote ? (
        <EditorCanvas
          key={activeNote.id} // 👈 Crucial: Changing this key forces React to discard the old canvas state and cleanly recreate it with the new note's values
          note={activeNote}
          breadcrumbs={getBreadcrumbs()}
          onNoteUpdate={handleNoteUpdate}
          onNoteDelete={handleNoteDelete}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm bg-white">
          Select a note to begin editing.
        </div>
      )}
    </div>
  );
};
