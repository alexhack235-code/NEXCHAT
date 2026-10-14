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
      aria-label="NEXCHAT & CAMSHOT Logo"
    >
      <defs>
        <radialGradient id="compBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a1224" />
          <stop offset="100%" stopColor="#030712" />
        </radialGradient>
        
        <linearGradient id="compEmeraldCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF66" />
          <stop offset="50%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#3A82F6" />
        </linearGradient>

        <linearGradient id="compCyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient id="compLensRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00FF66" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Dark Obsidian Rounded Shield */}
      <rect width="512" height="512" rx="112" fill="url(#compBgGlow)" />
      <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

      {/* Futuristic Orbit Lines (CamShot optics) */}
      <circle cx="256" cy="220" r="110" fill="none" stroke="rgba(0, 210, 255, 0.15)" strokeWidth="2" strokeDasharray="8 6" />
      <circle cx="256" cy="220" r="130" fill="none" stroke="rgba(0, 255, 102, 0.12)" strokeWidth="1.5" />

      {/* Left Stem of Geometric 'N' */}
      <polygon points="120,310 180,310 220,130 160,130" fill="url(#compEmeraldCyan)" />
      <polygon points="120,310 160,130 140,170 120,280" fill="#00FF66" opacity="0.6" />

      {/* Right Stem of Geometric 'N' */}
      <polygon points="292,310 352,310 392,130 332,130" fill="url(#compCyanPurple)" />
      <polygon points="352,310 392,130 372,210 340,310" fill="#A855F7" opacity="0.7" />

      {/* Diagonal Connecting Fold */}
      <polygon points="175,130 230,130 335,310 280,310" fill="url(#compCyanPurple)" opacity="0.85" />

      {/* Center CAMSHOT Camera Aperture Lens (Optical Iris) */}
      <circle cx="256" cy="220" r="62" fill="#060913" stroke="url(#compLensRing)" strokeWidth="6" />
      <circle cx="256" cy="220" r="48" fill="#0c1222" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <circle cx="256" cy="220" r="32" fill="#030712" stroke="#00D2FF" strokeWidth="2" />
      <circle cx="256" cy="220" r="18" fill="url(#compEmeraldCyan)" />
      <circle cx="248" cy="212" r="6" fill="#FFFFFF" opacity="0.8" />

      {/* Modern Typography: NEXCHAT */}
      <text x="256" y="380" fontFamily="'Outfit', 'Inter', system-ui, sans-serif" fontSize="44" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="4">NEXCHAT</text>

      {/* Sub-Badge Typography: CAMSHOT */}
      <g transform="translate(256, 420)">
        <rect x="-80" y="-18" width="160" height="26" rx="13" fill="rgba(0, 210, 255, 0.12)" stroke="url(#compEmeraldCyan)" strokeWidth="1.5" />
        <text x="0" y="0" fontFamily="'Outfit', 'Inter', system-ui, sans-serif" fontSize="13" fontWeight="800" fill="#00D2FF" textAnchor="middle" letterSpacing="3" dominantBaseline="central">CAMSHOT</text>
      </g>
    </svg>
  );
};

export default NEXLogo;
