
import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

// Explicitly mapping specific icons that might have naming collisions or preference
// Otherwise we fallback to the dynamic lookup from the namespace
const ALIASES: Record<string, string> = {
    Bot: 'Cpu',           // Fallback if Bot doesn't exist
    BrainCircuit: 'Activity', 
    Sparkles: 'Star',
    Square: 'Square',     // Ensure Square maps to Square
    Pause: 'Pause'
};

export type IconName = keyof typeof LucideIcons | keyof typeof ALIASES;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: string; // Relaxed type to prevent TS errors on dynamic names
    size?: number | string;
    strokeWidth?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...props }) => {
    
    const LucideIcon = useMemo(() => {
        // 1. Check direct match in namespace
        let comp = (LucideIcons as any)[name];
        
        // 2. Check aliases if direct match fails
        if (!comp && ALIASES[name]) {
            comp = (LucideIcons as any)[ALIASES[name]];
        }

        // 3. Case-insensitive fallback (e.g., 'chevronLeft' vs 'ChevronLeft')
        if (!comp) {
            const lowerName = name.toLowerCase();
            const key = Object.keys(LucideIcons).find(k => k.toLowerCase() === lowerName);
            if (key) comp = (LucideIcons as any)[key];
        }

        return comp;
    }, [name]);

    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found in Lucide library.`);
        // Render a placeholder box so layout doesn't collapse
        return <div style={{ width: size, height: size, background: 'currentColor', opacity: 0.2, borderRadius: 4 }} className={className} />;
    }

    return <LucideIcon size={size as number} className={className} {...(props as any)} />;
};
