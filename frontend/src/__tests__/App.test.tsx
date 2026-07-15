import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App Smoke Test', () => {
  it('renders the Welcome screen with correct header text', () => {
    render(<App />);

    // Check if the "Welcome to SnapPad" heading exists in the DOM
    const heading = screen.getByRole('heading', { name: /welcome to snappad/i });
    expect(heading).toBeInTheDocument();
  });
});
