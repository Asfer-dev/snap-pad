import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export const SnapPadIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <rect width="24" height="24" rx="7" fill="#E0F2FE" />
    <path
      d="M13.4 3.8 6.8 13h4.7l-.9 7.2 6.6-9.4h-4.8l1-7Z"
      fill="#2563EB"
      stroke="#1D4ED8"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <path d="M8.4 12.1 13.4 3.8l-.8 6.9h4.3" stroke="#93C5FD" strokeLinecap="round" />
  </svg>
);
