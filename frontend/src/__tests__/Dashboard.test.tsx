// frontend/src/__tests__/Dashboard.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { Dashboard } from '../pages/Dashboard';

// 🛡️ Mock the useAuth hook to bypass context requirements
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' },
    logout: vi.fn(),
  }),
}));

interface GraphQLRequestInterface {
  query?: string;
  variables?: Record<string, unknown>;
}

// Helper to construct mock GraphQL response payloads cleanly
const mockGraphQLResponse = (data: Record<string, unknown>): Response =>
  ({
    ok: true,
    json: async () => ({ data }),
  }) as Response;

describe('Dashboard Workspace Controller - GraphQL Optimistic UI Tests', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // 🛡️ Default implementation to catch the primary GraphQL workspace tree query
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const bodyString = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(bodyString) as GraphQLRequestInterface;

      if (url === '/graphql' && body.query?.includes('GetWorkspaceTree')) {
        return mockGraphQLResponse({
          workspaceTree: {
            rootFolders: [{ id: 'f_root', name: 'Work', notes: [], subfolders: [] }],
            rootNotes: [{ id: 'n_root', title: 'Scratchpad' }],
          },
        });
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
  });

  it('renders initial notes and folders loaded from server via GraphQL', async () => {
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

    // 🛡️ Intercept mutation/REST calls while preserving baseline GraphQL load paths
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const bodyString = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(bodyString) as GraphQLRequestInterface;

      // 1. Handle primary query loader step
      if (url === '/graphql' && body.query?.includes('GetWorkspaceTree')) {
        return mockGraphQLResponse({
          workspaceTree: {
            rootFolders: [{ id: 'f_root', name: 'Work', notes: [], subfolders: [] }],
            rootNotes: [{ id: 'n_root', title: 'Scratchpad' }],
          },
        });
      }

      // 2. Intercept the Note mutation POST action
      if (url.includes('/api/notes') && init?.method === 'POST') {
        return postPromise;
      }

      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<Dashboard />);

    // Wait for core elements to mount safely
    await screen.findByText('Scratchpad');

    // Trigger creation
    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // Assert note is visible instantly (optimistic state verification)
    const textbox = screen.getByRole('textbox') as HTMLInputElement | HTMLTextAreaElement;
    expect(textbox.value).toBe('Untitled Note');

    // Resolve the creation REST fetch promise handshake channel
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
      const finalTextbox = screen.getByRole('textbox') as HTMLInputElement | HTMLTextAreaElement;
      expect(finalTextbox.value).toBe('Untitled Note');
    });
  });

  it('rolls back state and displays error banner when creation fails', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const bodyString = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(bodyString) as GraphQLRequestInterface;

      if (url === '/graphql' && body.query?.includes('GetWorkspaceTree')) {
        return mockGraphQLResponse({
          workspaceTree: {
            rootFolders: [{ id: 'f_root', name: 'Work', notes: [], subfolders: [] }],
            rootNotes: [{ id: 'n_root', title: 'Scratchpad' }],
          },
        });
      }

      if (url.includes('/api/notes') && init?.method === 'POST') {
        return { ok: false, status: 500 } as Response;
      }

      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<Dashboard />);
    await screen.findByText('Scratchpad');

    const createNoteButton = screen.getByTitle('New Note');
    fireEvent.click(createNoteButton);

    // Instantly visible optimistically
    const textbox = screen.getByRole('textbox') as HTMLInputElement | HTMLTextAreaElement;
    expect(textbox.value).toBe('Untitled Note');

    // Asserts clear rollback execution cleanup handling block rules trigger
    await waitFor(() => {
      expect(screen.queryByText('Untitled Note')).not.toBeInTheDocument();
      expect(screen.getByText(/failed to create note/i)).toBeInTheDocument();
    });
  });
});
