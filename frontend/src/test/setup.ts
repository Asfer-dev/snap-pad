import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement('div', { ...props, 'data-testid': 'dotlottie-animation' }),
}));
