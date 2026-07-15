// frontend/src/__tests__/AuthGateway.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGateway } from '../components/AuthGateway';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthGateway Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock globalThis fetch API
    globalThis.fetch = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthGateway />
      </BrowserRouter>,
    );
  };

  it('renders Sign In view by default and allows toggling to Create Account', async () => {
    renderComponent();

    // Verify initial "Sign In" elements exist
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();

    // Find and click toggle link to change to Register view
    const toggleLink = screen.getByText(/create an account/i);
    fireEvent.click(toggleLink);

    // Verify "Create Account" elements now exist
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('updates form state values on typing input', () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('user@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('shows error banner on 401 or 400 credentials mismatch', async () => {
    // Mock API failing response
    // Use vi.mocked to safely cast globalThis.fetch
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid email or password' }),
    } as Response); // Typecast the returned object to a standard Response interface

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'wrong@user.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // Wait for the error banner to render with response message
    const errorBanner = await screen.findByText(/invalid email or password/i);
    expect(errorBanner).toBeInTheDocument();
  });

  it('persists JWT token to localStorage and redirects on successful auth', async () => {
    // Mock successful login response containing our token
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'mocked-jwt-token-xyz' }),
    } as Response);

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'securepass' } });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Assert token is persisted locally
      expect(localStorage.getItem('token')).toBe('mocked-jwt-token-xyz');
      // Assert it redirects to dashboard workspace
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
