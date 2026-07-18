// frontend/src/__tests__/EditorCanvas.test.tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorCanvas } from '../components/EditorCanvas';

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

  it('shows the initial saved status', () => {
    render(<EditorCanvas {...defaultProps} />);

    // Initially, it should show "Saved"
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('does not render note deletion controls in the editor header', () => {
    render(<EditorCanvas {...defaultProps} />);

    expect(screen.queryByTitle('Delete Note')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete permanently?')).not.toBeInTheDocument();
  });
});
