
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';

interface Step {
    targetId: string;
    title: string;
    text: string;
    position?: 'top' | 'bottom' | 'auto';
}

interface TutorialOverlayProps {
    steps: Step[];
    onComplete: () => void;
    isActive: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, isActive }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [ready, setReady] = useState(false);

    // Reset internal state if activation changes
    useEffect(() => {
        if (!isActive) {
            setCurrentStepIndex(0);
            setRect(null);
            setReady(false);
        } else {
            // Small delay to allow UI to render/settle before measuring
            setTimeout(() => setReady(true), 400);
        }
    }, [isActive]);

    // Update rect when step changes or window resizes
    useEffect(() => {
        if (!isActive || !ready) return;

        const updateRect = () => {
            const step = steps[currentStepIndex];
            const el = document.getElementById(step.targetId);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect(r);
                // Ensure element is scrolled into view with padding
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                console.warn(`Tutorial target #${step.targetId} not found`);
                // Auto-skip if target missing
                handleNext();
            }
        };

        // Initial measure
        updateRect();
        
        // Measure again after a slight delay to account for scrolling/layout shifts
        const doubleCheck = setTimeout(updateRect, 300);

        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(doubleCheck);
        };
    }, [currentStepIndex, isActive, ready, steps]);

    if (!isActive || !ready) return null;

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const step = steps[currentStepIndex];
    const isLast = currentStepIndex === steps.length - 1;

    // --- SMART POSITIONING ENGINE ---
    const tooltipStyle: React.CSSProperties = {};
    let isPositionedAbove = false;
    
    if (rect) {
        const viewportHeight = window.innerHeight;
        const elementCenterY = rect.top + (rect.height / 2);
        
        // Decide placement based on which half of the screen the element is in
        const isInTopHalf = elementCenterY < (viewportHeight / 2);

        // Safety Margins
        const MARGIN = 20;
        const SIDE_PADDING = 24;

        if (isInTopHalf) {
            // Element is in top half -> Place Tooltip BELOW
            tooltipStyle.top = rect.bottom + MARGIN;
            tooltipStyle.left = SIDE_PADDING;
            tooltipStyle.right = SIDE_PADDING;
            // Prevent going off bottom screen
            tooltipStyle.maxHeight = `calc(100vh - ${rect.bottom + MARGIN + 20}px)`;
            isPositionedAbove = false;
        } else {
            // Element is in bottom half -> Place Tooltip ABOVE
            tooltipStyle.bottom = (viewportHeight - rect.top) + MARGIN;
            tooltipStyle.left = SIDE_PADDING;
            tooltipStyle.right = SIDE_PADDING;
            // Prevent going off top screen
            tooltipStyle.maxHeight = `calc(${rect.top - MARGIN - 20}px)`;
            isPositionedAbove = true;
        }

        // Centering constraint for larger screens (tablets/desktop)
        tooltipStyle.maxWidth = '400px';
        tooltipStyle.margin = '0 auto'; // Horizontal centering relative to left/right 0 if fixed
        if (window.innerWidth > 450) {
            tooltipStyle.left = 0;
            tooltipStyle.right = 0;
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-auto font-sans touch-none">
            {/* Backdrop Logic (The "Hole Punch" Effect) */}
            {rect && (
                <>
                    {/* Top Dim */}
                    <div className="absolute top-0 left-0 right-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ height: rect.top }} />
                    {/* Bottom Dim */}
                    <div className="absolute left-0 right-0 bottom-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.bottom }} />
                    {/* Left Dim */}
                    <div className="absolute left-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top, bottom: window.innerHeight - rect.bottom, width: rect.left }} />
                    {/* Right Dim */}
                    <div className="absolute right-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top, bottom: window.innerHeight - rect.bottom, left: rect.right }} />
                    
                    {/* Highlight Border & Glow */}
                    <div 
                        className="absolute border-2 border-white/50 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out pointer-events-none ring-4 ring-white/20"
                        style={{
                            top: rect.top - 4,
                            left: rect.left - 4,
                            width: rect.width + 8,
                            height: rect.height + 8,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)' // Fallback if 4-div method has gaps
                        }}
                    />
                </>
            )}

            {/* Tooltip Card */}
            <div 
                className={`
                    absolute bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 
                    transition-all duration-500 overflow-y-auto
                    ${isPositionedAbove ? 'animate-in slide-in-from-bottom-4 fade-in' : 'animate-in slide-in-from-top-4 fade-in'}
                `}
                style={tooltipStyle}
            >
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-xl text-zinc-900 dark:text-white tracking-tight">{step.title}</h3>
                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full shrink-0 ml-2">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-8 leading-relaxed font-medium">
                    {step.text}
                </p>

                <div className="flex justify-between items-center">
                    <button 
                        onClick={onComplete}
                        className="text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-2"
                    >
                        {t.skip || "Skip"}
                    </button>
                    <button 
                        onClick={handleNext}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-600/20 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        {isLast ? t.tutorial.finish : t.tutorial.next}
                        {!isLast && <Icon name="ArrowRight" size={16} />}
                    </button>
                </div>
                
                {/* Visual Arrow Indicator */}
                <div 
                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rotate-45 ${isPositionedAbove ? '-bottom-2 border-b border-r' : '-top-2 border-t border-l'}`}
                />
            </div>
        </div>,
        document.body
    );
};
