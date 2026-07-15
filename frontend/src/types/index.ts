// frontend/src/types/index.ts

// The raw flat rows returned by our backend database / API endpoints
export interface RawFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface RawNote {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
}

// Our nested frontend tree structures
export interface NoteNode {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
}

export interface FolderNode {
  id: string;
  name: string;
  parent_folder_id: string | null;
  subfolders: FolderNode[];
  notes: NoteNode[];
}

export interface SidebarTree {
  rootFolders: FolderNode[];
  rootNotes: NoteNode[];
}
