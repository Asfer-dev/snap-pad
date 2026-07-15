// frontend/src/__tests__/AuthGateway.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGateway } from '../components/AuthGateway';
import { AuthProvider } from '../context/AuthProvider';

// Mock useNavigate so we can assert redirection calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthGateway Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  // Helper helper to render the component with all required React Context Providers
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
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
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

  it('persists JWT token to localStorage and redirects on successful auth', async () => {
    const mockUser = { id: 'usr-1', name: 'Asfer', email: 'asfer@example.com' };
    const mockToken = 'mocked-jwt-token';

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: mockToken,
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
      // Assert storage persistence (both token and parsed user info)
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toContain('asfer@example.com');

      // Assert navigation to dashboard occurred
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
