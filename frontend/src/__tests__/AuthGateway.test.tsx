// frontend/src/__tests__/AuthGateway.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGateway } from '../components/AuthGateway';
import { AuthProvider } from '../context/AuthProvider';
import { secureFetch } from '../utils/api';

// Mock useNavigate so we can assert redirection calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 🛡️ Mock the universal secure API module entirely
vi.mock('../utils/api', () => ({
  secureFetch: vi.fn(),
}));

describe('AuthGateway Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.restoreAllMocks();

    // 🛡️ Intercept global fetch safely
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Intercept credentials mismatch scenario
      if (url.includes('/api/auth/login')) {
        // Parse the body to check for wrong credentials scenario if needed,
        // or mock the failure explicitly for this test case block:
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: 'Invalid credentials' }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ user: { name: 'Asfer' } }),
      } as Response;
    });

    // By default, assume the user is unauthenticated during the initial handshake mount
    vi.mocked(secureFetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'No active session' }),
    } as Response);
  });

  // Helper to render the component with all required React Context Providers
  const renderWithProviders = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <AuthGateway />
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  it('renders Sign In view by default and allows toggling to Create Account', async () => {
    renderWithProviders();

    // Check default state is Sign In
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();

    // Toggle mode
    const toggleButton = screen.getByText(/don't have an account\?/i);
    fireEvent.click(toggleButton);

    // Assert change to Create Account
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('updates form state values on typing input', () => {
    renderWithProviders();

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'asfer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepassword' } });

    expect(emailInput.value).toBe('asfer@example.com');
    expect(passwordInput.value).toBe('securepassword');
  });

  it('shows error banner on 401 or 400 credentials mismatch', async () => {
    // 🛡️ Mock the form submission endpoint response
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }), // matches typical backend key structure
    } as Response);

    renderWithProviders();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard on successful auth without leaking credentials to storage', async () => {
    const mockUser = { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' };

    // 🛡️ Mock submission endpoint (no token returned in body, cookie handles it implicitly)
    vi.mocked(secureFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
      }),
    } as Response);

    renderWithProviders();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'asfer@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // 🛡️ Assert storage persistence is gone
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();

      // Assert navigation to dashboard occurred
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // 🛡️ New Test: Ensure logged-in users get kicked out of the login screen
  it('redirects an already authenticated user straight away from the gateway page', async () => {
    // Reset standard mock to simulate a user who already has a valid cookie sitting in the browser
    vi.mocked(secureFetch).mockReset();
    vi.mocked(secureFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' },
      }),
    } as Response);

    renderWithProviders();

    // The core initialization should complete, and your component's internal logic
    // or your alternative routing layout (like the PublicRoute guardian) will push them out.
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
