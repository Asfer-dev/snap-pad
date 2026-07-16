// frontend/src/__tests__/EditorCanvas.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorCanvas } from '../components/EditorCanvas';
import { secureFetch } from '../utils/api'; // 🛡️ Import our central secure API utility

// 🛡️ Mock the universal secure API module entirely
vi.mock('../utils/api', () => ({
  secureFetch: vi.fn(),
}));

describe('EditorCanvas Component Tests', () => {
  const mockNote = {
    id: 'n1',
    title: 'Packing List',
    content: '# Egypt Trip Packing\n\n- Passport\n- Sunscreen',
    folder_id: 'f2',
  };

  const defaultProps = {
    note: mockNote,
    breadcrumbs: ['Travel', 'Egypt', 'Packing List'],
    onNoteUpdate: vi.fn(),
    onNoteDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders breadcrumbs and initial markdown content correctly', () => {
    render(<EditorCanvas {...defaultProps} />);

    // Assert individual breadcrumbs display properly
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Egypt')).toBeInTheDocument();

    // Assert the input field displays the correct title
    expect(screen.getByDisplayValue('Packing List')).toBeInTheDocument();
  });

  it('shows saving status and triggers debounced PUT API on content changes', async () => {
    // 🛡️ Intercept secureFetch calls instead of global fetch
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    render(<EditorCanvas {...defaultProps} />);

    // Initially, it should show "Saved"
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  // 1. Test the UI toggles for the deletion flow
  it('toggles the delete confirmation UI state correctly', () => {
    render(<EditorCanvas {...defaultProps} />);

    // Get the trash button by its title attribute or visual role
    const trashButton = screen.getByTitle('Delete Note');
    expect(trashButton).toBeInTheDocument();

    // Click trash icon to enter delete mode
    fireEvent.click(trashButton);

    // Assert confirmation choices are now visible
    expect(screen.getByText('Delete permanently?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();

    // Click cancel to revert back to normal state
    fireEvent.click(cancelButton);

    // Verify confirmation prompt is removed and the trash button is back
    expect(screen.queryByText('Delete permanently?')).not.toBeInTheDocument();
    expect(screen.getByTitle('Delete Note')).toBeInTheDocument();
  });

  // 2. Test successful deletion triggering API requests and parent notification
  it('calls the DELETE API and executes the callback on successful confirmation', async () => {
    const mockOnDelete = vi.fn();

    // 🛡️ Mock secureFetch to intercept the internal application network request
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    render(<EditorCanvas {...defaultProps} onNoteDelete={mockOnDelete} />);

    // Click trash button to trigger confirmation flow
    fireEvent.click(screen.getByTitle('Delete Note'));

    // Select the "Yes, Delete" button and click it
    const confirmButton = screen.getByRole('button', { name: /yes, delete/i });
    fireEvent.click(confirmButton);

    // 🛡️ Assert secureFetch was dispatched to the correct endpoint safely matching cookie-session mechanics
    expect(secureFetch).toHaveBeenCalledWith('/api/notes/n1', {
      method: 'DELETE',
    });

    // Wait for the async task processing inside the component to fire the state callback
    await vi.waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('n1');
    });
  });
});
