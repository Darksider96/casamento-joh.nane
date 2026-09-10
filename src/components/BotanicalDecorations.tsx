import React from 'react';

export const BotanicalBranchLeft = ({ className = 'w-24 h-24 text-teal-700/40' }: { className?: string }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stem */}
    <path
      d="M10 110 C 35 90, 60 60, 85 20 C 95 6, 105 4, 110 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Leaves */}
    <path
      d="M32 93 C 25 80, 20 68, 30 65 C 40 62, 42 75, 32 93 Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M48 76 C 55 62, 68 58, 67 70 C 66 80, 52 83, 48 76 Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M62 55 C 52 42, 46 32, 58 28 C 70 24, 70 38, 62 55 Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M78 35 C 85 22, 98 18, 97 30 C 96 40, 83 42, 78 35 Z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M96 16 C 102 6, 112 4, 112 14 C 111 22, 101 24, 96 16 Z"
      fill="currentColor"
      fillOpacity="0.35"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export const BotanicalBranchRight = ({ className = 'w-24 h-24 text-teal-700/40' }: { className?: string }) => (
  <div className="scale-x-[-1] inline-block">
    <BotanicalBranchLeft className={className} />
  </div>
);

export const BotanicalDivider = ({ className = 'w-full max-w-xs mx-auto text-teal-700/50' }: { className?: string }) => (
  <div className={`flex items-center justify-center space-x-3 my-4 ${className}`}>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-teal-700/20 to-teal-700/40" />
    <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5 text-teal-800/40">
      <path
        d="M20 12 C 15 7, 5 7, 2 12 C 6 15, 15 15, 20 12 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M20 12 C 25 7, 35 7, 38 12 C 34 15, 25 15, 20 12 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <circle cx="20" cy="12" r="2.5" fill="#C29B88" />
    </svg>
    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-teal-700/20 to-teal-700/40" />
  </div>
);

export const FloralCorner = ({ className = 'w-20 h-20 text-teal-700/30' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M5 95 C 5 45, 45 5, 95 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 3"
    />
    <path
      d="M15 85 C 20 65, 30 50, 48 38 C 65 26, 80 18, 85 15"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    {/* Leaves */}
    <ellipse cx="32" cy="58" rx="8" ry="4" transform="rotate(-35 32 58)" fill="currentColor" fillOpacity="0.25" />
    <ellipse cx="48" cy="45" rx="9" ry="4.5" transform="rotate(-40 48 45)" fill="#C29B88" fillOpacity="0.3" />
    <ellipse cx="64" cy="32" rx="8" ry="4" transform="rotate(-45 64 32)" fill="currentColor" fillOpacity="0.25" />
    <ellipse cx="78" cy="22" rx="6" ry="3" transform="rotate(-50 78 22)" fill="#78A083" fillOpacity="0.35" />
    <circle cx="15" cy="85" r="3" fill="#C29B88" />
    <circle cx="85" cy="15" r="3" fill="#C29B88" />
  </svg>
);
