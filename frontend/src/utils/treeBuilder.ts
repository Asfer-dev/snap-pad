// frontend/src/utils/treeBuilder.ts
import type { FolderNode, NoteNode, RawFolder, RawNote, SidebarTree } from '../types';

export function buildSidebarTree(folders: RawFolder[], notes: RawNote[]): SidebarTree {
  const folderMap: Record<string, FolderNode> = {};
  const rootFolders: FolderNode[] = [];
  const rootNotes: NoteNode[] = [];

  // 1. Build a fast hash map of folder nodes
  folders.forEach((f) => {
    folderMap[f.id] = {
      id: f.id,
      name: f.name,
      parent_folder_id: f.parent_folder_id,
      subfolders: [],
      notes: [],
    };
  });

  // 2. Link child subfolders to their parents, or assign to root list
  folders.forEach((f) => {
    const node = folderMap[f.id];
    if (f.parent_folder_id && folderMap[f.parent_folder_id]) {
      folderMap[f.parent_folder_id].subfolders.push(node);
    } else {
      rootFolders.push(node);
    }
  });

  // 3. Place notes into their respective folders, or assign to root list
  notes.forEach((n) => {
    const noteNode: NoteNode = {
      id: n.id,
      title: n.title,
      content: n.content,
      folder_id: n.folder_id,
    };

    if (n.folder_id && folderMap[n.folder_id]) {
      folderMap[n.folder_id].notes.push(noteNode);
    } else {
      rootNotes.push(noteNode);
    }
  });

  return { rootFolders, rootNotes };
}
