import React from 'react';

interface NEXLogoProps {
  className?: string;
  size?: number;
}

export const NEXLogo: React.FC<NEXLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      width={size} 
      height={size}
      className={className}
      aria-label="NEXCHAT Logo"
    >
      <defs>
        <linearGradient id="purpleHexComponent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
        <linearGradient id="glowBorderComponent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="nGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>

      {/* Background Hexagon */}
      <polygon 
        points="256,36 446,146 446,366 256,476 66,366 66,146" 
        fill="url(#purpleHexComponent)" 
        stroke="url(#glowBorderComponent)" 
        strokeWidth="12" 
        strokeLinejoin="round"
      />

      {/* High-Tech Inner Rim */}
      <polygon 
        points="256,56 428,155 428,357 256,456 84,357 84,155" 
        fill="none" 
        stroke="#A855F7" 
        strokeWidth="2" 
        strokeOpacity="0.4" 
        strokeLinejoin="round"
      />

      {/* Bold Geometric 'N' Symbol */}
      <path 
        d="M 166,144 L 216,144 L 216,280 L 298,144 L 348,144 L 348,368 L 298,368 L 298,230 L 216,368 L 166,368 Z" 
        fill="url(#nGradComponent)" 
      />
    </svg>
  );
};

export default NEXLogo;
