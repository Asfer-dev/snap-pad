// frontend/src/__tests__/Auth.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthProvider'; // 👈 FIX: Import from the correct file!

describe('Auth & Protected Routing Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const MockDashboard = () => <div>Dashboard Workspace</div>;
  const MockLogin = () => <div>Login Page</div>;

  it('redirects an unauthenticated user to /login', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Workspace')).not.toBeInTheDocument();
    });
  });

  it('allows authenticated users with a token to access protected dashboard', async () => {
    // Set both token and user so parsing doesn't throw an error during initialization
    localStorage.setItem('token', 'mocked-valid-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' }),
    );

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

    // Wait for the useEffect initialization to finish (resolves loading -> renders workspace)
    await waitFor(() => {
      expect(screen.getByText('Dashboard Workspace')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});
