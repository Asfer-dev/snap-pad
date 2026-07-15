// frontend/src/__tests__/Sidebar.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '../components/Sidebar';
import type { SidebarTree } from '../types';

describe('Sidebar Component UI Tests', () => {
  const mockTree: SidebarTree = {
    rootFolders: [
      {
        id: 'f1',
        name: 'Travel',
        parent_folder_id: null,
        notes: [{ id: 'n1', title: 'Packing List', content: 'test content', folder_id: 'f1' }],
        subfolders: [
          {
            id: 'f2',
            name: 'Egypt Trip',
            parent_folder_id: 'f1',
            notes: [],
            subfolders: [],
          },
        ],
      },
    ],
    rootNotes: [
      { id: 'n_root', title: 'Quick Idea', content: 'just a scratchpad note', folder_id: null },
    ],
  };

  const defaultProps = {
    tree: mockTree,
    activeNoteId: null,
    userName: 'Asfer',
    onNoteSelect: vi.fn(),
    onCreateNote: vi.fn(),
    onCreateFolder: vi.fn(),
    onSignOut: vi.fn(),
  };

  it('renders root notes and root folders, but hides nested folder contents by default', () => {
    render(<Sidebar {...defaultProps} />);

    // Root elements should be visible
    expect(screen.getByText('Quick Idea')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();

    // Nested elements should NOT be visible initially
    expect(screen.queryByText('Packing List')).not.toBeInTheDocument();
    expect(screen.queryByText('Egypt Trip')).not.toBeInTheDocument();
  });

  it('expands a folder on click and reveals its subfolders and notes', () => {
    render(<Sidebar {...defaultProps} />);

    const folderHeader = screen.getByText('Travel');

    // Expand the folder
    fireEvent.click(folderHeader);

    // Nested note and subfolder should now be visible
    expect(screen.getByText('Packing List')).toBeInTheDocument();
    expect(screen.getByText('Egypt Trip')).toBeInTheDocument();

    // Collapse the folder
    fireEvent.click(folderHeader);

    // Nested elements should be hidden again
    expect(screen.queryByText('Packing List')).not.toBeInTheDocument();
    expect(screen.queryByText('Egypt Trip')).not.toBeInTheDocument();
  });

  it('calls onNoteSelect when a note is clicked', () => {
    const onNoteSelectMock = vi.fn();
    render(<Sidebar {...defaultProps} onNoteSelect={onNoteSelectMock} />);

    const rootNote = screen.getByText('Quick Idea');
    fireEvent.click(rootNote);

    expect(onNoteSelectMock).toHaveBeenCalledWith('n_root');
  });

  it('calls action callbacks when header buttons or sign-out is clicked', () => {
    const onCreateNoteMock = vi.fn();
    const onCreateFolderMock = vi.fn();
    const onSignOutMock = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        onCreateNote={onCreateNoteMock}
        onCreateFolder={onCreateFolderMock}
        onSignOut={onSignOutMock}
      />,
    );

    // Use strict regex match (^ for start, $ for end) to target only the global button
    fireEvent.click(screen.getByTitle(/^new note$/i));
    expect(onCreateNoteMock).toHaveBeenCalledWith(null);

    // Do the same for the folder button to prevent any future collisions
    fireEvent.click(screen.getByTitle(/^new folder$/i));
    expect(onCreateFolderMock).toHaveBeenCalled();

    // Trigger logout
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onSignOutMock).toHaveBeenCalled();
  });
});
