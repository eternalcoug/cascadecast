import React from 'react';

interface CascadeCastIconProps {
  className?: string;
  size?: number;
}

export const CascadeCastIcon: React.FC<CascadeCastIconProps> = ({ 
  className = "h-8 w-8", 
  size = 32 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient Definitions */}
      <defs>
        {/* Sun Gradient */}
        <radialGradient id="sunGradient" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        
        {/* Cloud Gradient */}
        <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        
        {/* Cloud Shadow */}
        <linearGradient id="cloudShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        
        {/* Raindrop Gradient */}
        <linearGradient id="raindropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        
        {/* Drop Shadow Filter */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.2"/>
        </filter>
      </defs>
      
      {/* Sun Rays (behind cloud) */}
      <g opacity="0.8">
        <path d="M45 12 L47 8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M52 15 L56 13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M55 22 L59 22" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M52 29 L56 31" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M38 15 L34 13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M35 22 L31 22" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Sun (behind cloud) */}
      <circle 
        cx="45" 
        cy="22" 
        r="8" 
        fill="url(#sunGradient)"
        filter="url(#dropShadow)"
        opacity="0.9"
      />
      
      {/* Main Cloud Shape */}
      <path
        d="M16 32 C16 28, 19 25, 23 25 C24 21, 28 18, 33 18 C38 18, 42 21, 43 25 C47 25, 50 28, 50 32 C50 36, 47 39, 43 39 L23 39 C19 39, 16 36, 16 32 Z"
        fill="url(#cloudGradient)"
        stroke="url(#cloudShadow)"
        strokeWidth="0.5"
        filter="url(#dropShadow)"
      />
      
      {/* Cloud Highlight */}
      <ellipse
        cx="35"
        cy="28"
        rx="12"
        ry="6"
        fill="#FFFFFF"
        opacity="0.4"
      />
      
      {/* Raindrops */}
      <g opacity="0.9">
        {/* Large Raindrops */}
        <ellipse cx="25" cy="46" rx="1.5" ry="3" fill="url(#raindropGradient)" />
        <ellipse cx="33" cy="48" rx="1.5" ry="3" fill="url(#raindropGradient)" />
        <ellipse cx="41" cy="46" rx="1.5" ry="3" fill="url(#raindropGradient)" />
        
        {/* Medium Raindrops */}
        <ellipse cx="29" cy="52" rx="1" ry="2" fill="url(#raindropGradient)" opacity="0.8" />
        <ellipse cx="37" cy="54" rx="1" ry="2" fill="url(#raindropGradient)" opacity="0.8" />
        
        {/* Small Raindrops */}
        <ellipse cx="22" cy="54" rx="0.8" ry="1.5" fill="url(#raindropGradient)" opacity="0.6" />
        <ellipse cx="44" cy="52" rx="0.8" ry="1.5" fill="url(#raindropGradient)" opacity="0.6" />
        <ellipse cx="31" cy="58" rx="0.8" ry="1.5" fill="url(#raindropGradient)" opacity="0.6" />
        <ellipse cx="39" cy="60" rx="0.8" ry="1.5" fill="url(#raindropGradient)" opacity="0.6" />
      </g>
      
      {/* Subtle Cascade Effect Lines */}
      <g opacity="0.3" stroke="#3B82F6" strokeWidth="0.5" strokeLinecap="round">
        <path d="M26 44 Q28 50 30 56" />
        <path d="M34 46 Q36 52 38 58" />
        <path d="M42 44 Q44 50 46 56" />
      </g>
    </svg>
  );
};