import React from 'react';

interface ZikiLogoProps {
  className?: string;
  size?: number;
}

export const ZikiLogo: React.FC<ZikiLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      {/* Top Left Sky Blue Semicircle */}
      <path
        d="M 10 18 A 26 26 0 0 0 62 18 Z"
        fill="#298bf5"
      />
      {/* Dark Navy Wedge Accent */}
      <path
        d="M 62 18 C 62 31 54 42 41 49 L 58 18 Z"
        fill="#1a115e"
      />
      {/* Main Coral/Red-Orange Diagonal */}
      <path
        d="M 58 18 L 95 18 L 10 90 L 45 90 Z"
        fill="#ff4f38"
      />
      {/* Bottom Right Golden Yellow Semicircle */}
      <path
        d="M 45 90 A 25 25 0 0 1 95 90 Z"
        fill="#ffb81c"
      />
    </svg>
  );
};
