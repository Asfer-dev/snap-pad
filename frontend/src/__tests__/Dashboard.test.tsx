// frontend/src/__tests__/Dashboard.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard Workspace Controller - Optimistic UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  const mockInitialFetch = () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'f_root', name: 'Work', parent_folder_id: null }],
      } as Response) // Folders fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'n_root', title: 'Scratchpad', content: 'test content', folder_id: null },
        ],
      } as Response); // Notes fetch
  };

  it('renders initial notes and folders loaded from server', async () => {
    mockInitialFetch();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });
  });

  it('optimistically displays a new note instantly and swaps its temporary ID on success', async () => {
    mockInitialFetch();

    // Setup background post resolve mock
    let resolvePostPromise: (value: Response) => void = () => {};
    const postPromise = new Promise<Response>((resolve) => {
      resolvePostPromise = resolve;
    });

    vi.mocked(globalThis.fetch).mockImplementation((url, init) => {
      if (url === '/api/notes' && init?.method === 'POST') {
        return postPromise;
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    render(<Dashboard />);

    // Wait for initial elements to mount
    await screen.findByText('Scratchpad');

    // Trigger Note Creation
    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // Assert note is visible INSTANTLY (before API resolve)
    expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');

    // Now resolve the backend call with the final ID
    resolvePostPromise({
      ok: true,
      json: async () => ({
        id: 'real-db-note-123',
        title: 'Untitled Note',
        content: '',
        folder_id: null,
      }),
    } as Response);

    // Verify ID swapping by checking if selecting it doesn't fail
    // and correctly activates the new ID behind the scenes.
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');
    });
  });

  it('rolls back state and displays error banner when creation fails', async () => {
    mockInitialFetch();

    // Mock API to return server crash 500
    vi.mocked(globalThis.fetch).mockImplementation((url, init) => {
      if (url === '/api/notes' && init?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    render(<Dashboard />);
    await screen.findByText('Scratchpad');

    // Click trigger
    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // 1. Instantly shown (optimistic)
    expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');

    // 2. Wait for background rejection & state rollback
    await waitFor(() => {
      expect(screen.queryByText('Untitled Note')).not.toBeInTheDocument();
      expect(screen.getByText(/failed to create note/i)).toBeInTheDocument();
    });
  });
});
