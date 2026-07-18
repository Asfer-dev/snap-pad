import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export const FileIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M6.5 3.5h7.6l4.4 4.5v12.5h-12V3.5Z"
      fill="#EFF6FF"
      stroke="#60A5FA"
      strokeLinejoin="round"
      strokeWidth="1.4"
    />
    <path d="M14 3.8V8h4.2" fill="#DBEAFE" stroke="#60A5FA" strokeLinejoin="round" />
    <path d="M8.8 12h6.4M8.8 15h5.2" stroke="#2563EB" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);

export const AddFileIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <FileIcon x="2" y="3" width="16" height="16" />
    <circle cx="17.5" cy="17.5" r="4.2" fill="#22C55E" stroke="#16A34A" strokeWidth="1.2" />
    <path d="M17.5 15.3v4.4M15.3 17.5h4.4" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);
