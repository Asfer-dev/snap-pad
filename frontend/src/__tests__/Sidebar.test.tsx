// frontend/src/__tests__/Sidebar.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '../components/Sidebar';
import type { SidebarTree } from '../types';

// 🛡️ Create a trackable spy function for our auth context logout call
const mockLogout = vi.fn();

// 🛡️ Mock the AuthContext hook completely so the Sidebar can read the user session state
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' },
    logout: mockLogout,
  }),
}));

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
    onDeleteFolder: vi.fn(), // 👈 New prop dependency tracking injection
    onDeleteNote: vi.fn(),
    onRenameFolder: vi.fn(), // 👈 New prop dependency tracking injection
  };

  it('renders root notes and root folders, but hides nested folder contents by default', () => {
    render(<Sidebar {...defaultProps} onSignOut={mockLogout} />);

    // Root elements should be visible
    expect(screen.getByText('Quick Idea')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();

    // Nested elements should NOT be visible initially
    expect(screen.queryByText('Packing List')).not.toBeInTheDocument();
    expect(screen.queryByText('Egypt Trip')).not.toBeInTheDocument();
  });

  it('expands a folder on click and reveals its subfolders and notes', () => {
    render(<Sidebar {...defaultProps} onSignOut={mockLogout} />);

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
    render(<Sidebar {...defaultProps} onNoteSelect={onNoteSelectMock} onSignOut={mockLogout} />);

    const rootNote = screen.getByText('Quick Idea');
    fireEvent.click(rootNote);

    expect(onNoteSelectMock).toHaveBeenCalledWith('n_root');
  });

  it('opens a delete dialog from a root note row and cancels without deleting', () => {
    const onDeleteNoteMock = vi.fn();

    render(<Sidebar {...defaultProps} onDeleteNote={onDeleteNoteMock} onSignOut={mockLogout} />);

    fireEvent.click(screen.getByTitle('Delete Quick Idea'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete note?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete "Quick Idea"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onDeleteNoteMock).not.toHaveBeenCalled();
  });

  it('confirms note deletion from the sidebar dialog', async () => {
    const onDeleteNoteMock = vi.fn();

    render(<Sidebar {...defaultProps} onDeleteNote={onDeleteNoteMock} onSignOut={mockLogout} />);

    fireEvent.click(screen.getByTitle('Delete Quick Idea'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onDeleteNoteMock).toHaveBeenCalledWith('n_root');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls action callbacks when header buttons or context sign-out is clicked', () => {
    const onCreateNoteMock = vi.fn();

    render(
      <Sidebar
        onSignOut={mockLogout}
        {...defaultProps}
        onCreateNote={onCreateNoteMock}
      />,
    );

    // Use strict regex match to target only the global button
    fireEvent.click(screen.getByTitle(/^new note$/i));
    expect(onCreateNoteMock).toHaveBeenCalledWith(null);

    // Trigger logout via the simulated UI click action
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    // 🛡️ Assert that our central hook's function was called rather than a leaky prop callback
    expect(mockLogout).toHaveBeenCalled();
  });

  it('opens the create folder dialog and cancels without creating', () => {
    const onCreateFolderMock = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        onCreateFolder={onCreateFolderMock}
        onSignOut={mockLogout}
      />,
    );

    fireEvent.click(screen.getByTitle(/^new folder$/i));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create folder')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onCreateFolderMock).not.toHaveBeenCalled();
  });

  it('creates a folder from the dialog name field', async () => {
    const onCreateFolderMock = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        onCreateFolder={onCreateFolderMock}
        onSignOut={mockLogout}
      />,
    );

    fireEvent.click(screen.getByTitle(/^new folder$/i));
    fireEvent.change(screen.getByPlaceholderText('Folder name'), {
      target: { value: 'Ideas' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(onCreateFolderMock).toHaveBeenCalledWith('Ideas');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a rename folder dialog and calls onRenameFolder upon confirmation', async () => {
    const onRenameFolderMock = vi.fn();

    render(
      <Sidebar {...defaultProps} onRenameFolder={onRenameFolderMock} onSignOut={mockLogout} />,
    );

    const optionsButton = screen.getByTitle('Folder Options');
    fireEvent.click(optionsButton);

    const renameActionItem = screen.getByText('Rename');
    fireEvent.click(renameActionItem);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Rename folder')).toBeInTheDocument();

    const folderNameInput = screen.getByDisplayValue('Travel');
    fireEvent.change(folderNameInput, { target: { value: 'Vacation Trips' } });
    fireEvent.click(screen.getByRole('button', { name: /^rename$/i }));

    await waitFor(() => {
      expect(onRenameFolderMock).toHaveBeenCalledWith('f1', 'Vacation Trips');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a delete folder dialog and cancels without deleting', () => {
    const onDeleteFolderMock = vi.fn();

    render(
      <Sidebar {...defaultProps} onDeleteFolder={onDeleteFolderMock} onSignOut={mockLogout} />,
    );

    const optionsButton = screen.getByTitle('Folder Options');
    fireEvent.click(optionsButton);

    const deleteActionItem = screen.getByText('Delete');
    fireEvent.click(deleteActionItem);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete folder?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete "Travel"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onDeleteFolderMock).not.toHaveBeenCalled();
  });

  it('confirms folder deletion from the delete folder dialog', async () => {
    const onDeleteFolderMock = vi.fn();

    render(
      <Sidebar {...defaultProps} onDeleteFolder={onDeleteFolderMock} onSignOut={mockLogout} />,
    );

    fireEvent.click(screen.getByTitle('Folder Options'));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(onDeleteFolderMock).toHaveBeenCalledWith('f1');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
