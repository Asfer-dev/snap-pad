import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export const FolderIcon = ({ open = false, ...props }: IconProps & { open?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M3.4 7.2c0-1.1.9-2 2-2h4.1l1.8 2h7.3c1.1 0 2 .9 2 2v1.1H3.4V7.2Z"
      fill={open ? '#FBBF24' : '#FCD34D'}
      stroke="#D97706"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <path
      d="M3.2 9.3h17.6l-1.4 8.5c-.2 1-1 1.7-2 1.7H6.5c-1 0-1.8-.7-2-1.7L3.2 9.3Z"
      fill={open ? '#F59E0B' : '#FBBF24'}
      stroke="#D97706"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <path d="M5.7 11h12.6" stroke="#FDE68A" strokeLinecap="round" strokeWidth="1.2" />
  </svg>
);

export const AddFolderIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <FolderIcon x="1" y="3" width="17" height="17" />
    <circle cx="17.5" cy="17.5" r="4.2" fill="#22C55E" stroke="#16A34A" strokeWidth="1.2" />
    <path d="M17.5 15.3v4.4M15.3 17.5h4.4" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);
