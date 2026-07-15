// frontend/src/utils/__tests__/treeBuilder.test.ts
import { describe, expect, it } from 'vitest';
import { buildSidebarTree } from '../treeBuilder';

describe('buildSidebarTree Algorithm', () => {
  it('handles empty input arrays gracefully', () => {
    const result = buildSidebarTree([], []);
    expect(result).toEqual({
      rootFolders: [],
      rootNotes: [],
    });
  });

  it('handles root-level notes with no folders', () => {
    const mockNotes = [
      { id: 'n1', title: 'Root Note 1', content: 'test', folder_id: null },
      { id: 'n2', title: 'Root Note 2', content: 'test', folder_id: null },
    ];

    const result = buildSidebarTree([], mockNotes);

    expect(result.rootFolders).toHaveLength(0);
    expect(result.rootNotes).toHaveLength(2);
    expect(result.rootNotes[0].id).toBe('n1');
  });

  it('handles simple single-level folder nesting with notes', () => {
    const mockFolders = [
      { id: 'f1', name: 'Work', parent_folder_id: null },
      { id: 'f2', name: 'Personal', parent_folder_id: null },
    ];
    const mockNotes = [
      { id: 'n1', title: 'Project Specs', content: 'test', folder_id: 'f1' },
      { id: 'n2', title: 'Shopping List', content: 'test', folder_id: 'f2' },
    ];

    const result = buildSidebarTree(mockFolders, mockNotes);

    expect(result.rootFolders).toHaveLength(2);
    expect(result.rootNotes).toHaveLength(0);

    const workFolder = result.rootFolders.find((f) => f.id === 'f1');
    expect(workFolder).toBeDefined();
    expect(workFolder?.notes).toHaveLength(1);
    expect(workFolder?.notes[0].title).toBe('Project Specs');
  });

  it('handles deeply nested folders (3+ levels) and correctly distributes notes', () => {
    const mockFolders = [
      { id: 'f1', name: 'Travel', parent_folder_id: null }, // Level 1
      { id: 'f2', name: 'Egypt Trip', parent_folder_id: 'f1' }, // Level 2
      { id: 'f3', name: 'Packing Subfolder', parent_folder_id: 'f2' }, // Level 3
    ];

    const mockNotes = [
      { id: 'n1', title: 'General Travel Ideas', content: 'test', folder_id: 'f1' },
      { id: 'n2', title: 'Pyramids Itinerary', content: 'test', folder_id: 'f2' },
      { id: 'n3', title: 'Scuba gear Checklist', content: 'test', folder_id: 'f3' },
      { id: 'n_root', title: 'Floating thoughts', content: 'test', folder_id: null },
    ];

    const result = buildSidebarTree(mockFolders, mockNotes);

    // Assert Root Nodes
    expect(result.rootNotes).toHaveLength(1);
    expect(result.rootNotes[0].id).toBe('n_root');
    expect(result.rootFolders).toHaveLength(1);

    // Assert Level 1
    const travelFolder = result.rootFolders[0];
    expect(travelFolder.id).toBe('f1');
    expect(travelFolder.notes).toHaveLength(1);
    expect(travelFolder.notes[0].id).toBe('n1');
    expect(travelFolder.subfolders).toHaveLength(1);

    // Assert Level 2
    const egyptFolder = travelFolder.subfolders[0];
    expect(egyptFolder.id).toBe('f2');
    expect(egyptFolder.notes).toHaveLength(1);
    expect(egyptFolder.notes[0].id).toBe('n2');
    expect(egyptFolder.subfolders).toHaveLength(1);

    // Assert Level 3
    const packingFolder = egyptFolder.subfolders[0];
    expect(packingFolder.id).toBe('f3');
    expect(packingFolder.notes).toHaveLength(1);
    expect(packingFolder.notes[0].id).toBe('n3');
    expect(packingFolder.subfolders).toHaveLength(0);
  });
});
