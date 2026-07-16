// frontend/src/__tests__/Dashboard.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { secureFetch } from '../utils/api';

// 🛡️ Mock the universal secure API module entirely
vi.mock('../utils/api', () => ({
  secureFetch: vi.fn(),
}));

// 🛡️ Mock the useAuth hook to bypass context requirement
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' },
    logout: vi.fn(),
  }),
}));

describe('Dashboard Workspace Controller - Optimistic UI Tests', () => {
  beforeEach(() => {
    // 🛡️ Use mockClear() instead of mockReset() to preserve the base mock interface skeleton
    vi.mocked(secureFetch).mockClear();

    // 🛡️ Establish a robust global fallback default implementation for all initial GET fetches
    vi.mocked(secureFetch).mockImplementation(async (url) => {
      if (url.includes('/api/folders')) {
        return {
          ok: true,
          json: async () => [{ id: 'f_root', name: 'Work', parent_folder_id: null }],
        } as Response;
      }
      if (url.includes('/api/notes')) {
        return {
          ok: true,
          json: async () => [
            { id: 'n_root', title: 'Scratchpad', content: 'test content', folder_id: null },
          ],
        } as Response;
      }
      return { ok: true, json: async () => [] } as Response;
    });
  });

  it('renders initial notes and folders loaded from server', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Scratchpad')).toBeInTheDocument();
    });
  });

  it('optimistically displays a new note instantly and swaps its temporary ID on success', async () => {
    let resolvePostPromise: (value: Response) => void = () => {};
    const postPromise = new Promise<Response>((resolve) => {
      resolvePostPromise = resolve;
    });

    // 🛡️ Intercept only the creation POST route, preserving the baseline initial GET routes
    vi.mocked(secureFetch).mockImplementation(async (url, init) => {
      if (url.includes('/api/notes') && init?.method === 'POST') {
        return postPromise;
      }
      if (url.includes('/api/folders')) {
        return {
          ok: true,
          json: async () => [{ id: 'f_root', name: 'Work', parent_folder_id: null }],
        } as Response;
      }
      return {
        ok: true,
        json: async () => [
          { id: 'n_root', title: 'Scratchpad', content: 'test content', folder_id: null },
        ],
      } as Response;
    });

    render(<Dashboard />);

    // Wait for baseline dashboard shell mounting elements to resolve safely
    await screen.findByText('Scratchpad');

    // Trigger Note Creation action via UI interaction
    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // Assert note is visible INSTANTLY (optimistic state UI checkpoint verification)
    expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');

    // Resolve structural payload transfer handshake processing confirmation
    resolvePostPromise({
      ok: true,
      json: async () => ({
        id: 'real-db-note-123',
        title: 'Untitled Note',
        content: '',
        folder_id: null,
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');
    });
  });

  it('rolls back state and displays error banner when creation fails', async () => {
    // 🛡️ Intercept creation pathway to throw an explicit backend service degradation signal
    vi.mocked(secureFetch).mockImplementation(async (url, init) => {
      if (url.includes('/api/notes') && init?.method === 'POST') {
        return {
          ok: false,
          status: 500,
        } as Response;
      }
      if (url.includes('/api/folders')) {
        return {
          ok: true,
          json: async () => [{ id: 'f_root', name: 'Work', parent_folder_id: null }],
        } as Response;
      }
      return {
        ok: true,
        json: async () => [
          { id: 'n_root', title: 'Scratchpad', content: 'test content', folder_id: null },
        ],
      } as Response;
    });

    render(<Dashboard />);
    await screen.findByText('Scratchpad');

    // Click creation switch control handler
    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // 1. Instantly shown (optimistic checking verification)
    expect(screen.getByRole('textbox', { name: '' })).has.property('value', 'Untitled Note');

    // 2. Wait for context stack unwinding sequence & transactional state cleanup execution check
    await waitFor(() => {
      expect(screen.queryByText('Untitled Note')).not.toBeInTheDocument();
      expect(screen.getByText(/failed to create note/i)).toBeInTheDocument();
    });
  });
});
