
import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512" 
            className={className}
            role="img"
            aria-label="IronLog Logo"
        >
            {/* Background Container (Squircle) */}
            <rect width="512" height="512" rx="100" fill="#09090b" />
            
            {/* Shield Outline */}
            <path 
                d="M256 460C256 460 416 380 416 200V90L256 32L96 90V200C96 380 256 460 256 460Z" 
                stroke="white" 
                strokeWidth="28" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
            />

            {/* Central Element: Modern Vertical Dumbbell */}
            {/* Handle */}
            <rect x="238" y="150" width="36" height="212" rx="4" fill="#dc2626" />
            
            {/* Top Plates */}
            <path d="M156 150 H356 A12 12 0 0 1 368 162 V190 A12 12 0 0 1 356 202 H156 A12 12 0 0 1 144 190 V162 A12 12 0 0 1 156 150 Z" fill="#dc2626"/>
            <path d="M186 120 H326 A8 8 0 0 1 334 128 V146 A4 4 0 0 1 330 150 H182 A4 4 0 0 1 178 146 V128 A8 8 0 0 1 186 120 Z" fill="#dc2626" opacity="0.8"/>

            {/* Bottom Plates */}
            <path d="M156 310 H356 A12 12 0 0 1 368 322 V350 A12 12 0 0 1 356 362 H156 A12 12 0 0 1 144 350 V322 A12 12 0 0 1 156 310 Z" fill="#dc2626"/>
            <path d="M186 392 H326 A8 8 0 0 0 334 384 V366 A4 4 0 0 0 330 362 H182 A4 4 0 0 0 178 366 V384 A8 8 0 0 0 186 392 Z" fill="#dc2626" opacity="0.8"/>

            {/* Subtle Shine/Reflections for polish */}
            <path d="M256 32 L96 90 V200 C96 250 110 300 135 340" stroke="white" strokeWidth="6" strokeOpacity="0.1" fill="none" />
        </svg>
    );
};
