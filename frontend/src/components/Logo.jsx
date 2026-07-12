import React from 'react';

export default function Logo({ size = 32 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Asset square structure (hollow) */}
      <rect 
        x="5" 
        y="5" 
        width="14" 
        height="14" 
        rx="4.5" 
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        filter="url(#logoGlow)"
      />
      {/* Flow square structure (filled overlap) */}
      <rect 
        x="13" 
        y="13" 
        width="14" 
        height="14" 
        rx="4.5" 
        fill="url(#logoGradient)" 
        fillOpacity="0.9"
        filter="url(#logoGlow)"
      />
      {/* Connecting flow-line arrow */}
      <path 
        d="M10 12C12 12 13 14 15 14L20 14" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <circle cx="20" cy="14" r="1.5" fill="#ffffff" />
    </svg>
  );
}
