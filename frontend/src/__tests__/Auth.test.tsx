// frontend/src/__tests__/Auth.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthProvider';
import { secureFetch } from '../utils/api';

// 🛡️ Mock the universal secure API module entirely
vi.mock('../utils/api', () => ({
  secureFetch: vi.fn(),
}));

describe('Auth & Protected Routing Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const MockDashboard = () => <div>Dashboard Workspace</div>;
  const MockLogin = () => <div>Login Page</div>;

  it('redirects an unauthenticated user to /login when the network handshake fails', async () => {
    // Simulate an unauthenticated state (401 Unauthorized or 404 No Session)
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<MockLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MockDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // Assert that the component resolves loading and correctly kicks the user to login
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Workspace')).not.toBeInTheDocument();
    });
  });

  it('allows authenticated users to access protected dashboard when handshake succeeds', async () => {
    // Simulate a successful verification handshake returning the user session payload
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' },
      }),
    } as Response);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<MockLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MockDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // Wait for the async API initialization to finish and confirm content is unshielded
    await waitFor(() => {
      expect(screen.getByText('Dashboard Workspace')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});
