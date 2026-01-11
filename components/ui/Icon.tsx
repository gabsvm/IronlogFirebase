
import React, { useMemo } from 'react';
// Import ONLY used icons to allow Tree Shaking (Drastic bundle size reduction)
import {
    Cpu, Activity, Star, Square, Pause, Menu, Layout, FileText, BarChart2, Edit, Plus, Check, 
    SkipForward, ArrowRight, TrendingUp, RefreshCw, Settings, DownloadCloud, Minus, Dumbbell, 
    ChevronLeft, Eye, Link, Unlink, Sun, Moon, Info, Download, Upload, CloudOff, Clock, Search, 
    GripVertical, MoreVertical, ExternalLink, VideoOff, Layers, Zap, Calendar, Home, User, LogOut,
    Trash2, X, CornerDownRight, Share2, AlertTriangle, Play, ChevronRight, Bot
} from 'lucide-react';

// Static Map of icons used in the app
const ICON_MAP: Record<string, React.ElementType> = {
    Bot, Cpu, Activity, Star, Square, Pause, Menu, Layout, FileText, BarChart2, Edit, Plus, Check,
    SkipForward, ArrowRight, TrendingUp, RefreshCw, Settings, DownloadCloud, Minus, Dumbbell,
    ChevronLeft, Eye, Link, Unlink, Sun, Moon, Info, Download, Upload, CloudOff, Clock, Search,
    GripVertical, MoreVertical, ExternalLink, VideoOff, Layers, Zap, Calendar, Home, User, LogOut,
    Trash2, X, CornerDownRight, Share2, AlertTriangle, Play, ChevronRight,
    // Aliases for backward compatibility or logical mapping
    BrainCircuit: Activity,
    Sparkles: Star,
    Running: Activity 
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    strokeWidth?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...props }) => {
    
    const LucideIcon = useMemo(() => {
        // Direct lookup is O(1) and safe
        const icon = ICON_MAP[name];
        
        // Fallback for case-insensitive matches (less performant but robust)
        if (!icon) {
            const lowerName = name.toLowerCase();
            const key = Object.keys(ICON_MAP).find(k => k.toLowerCase() === lowerName);
            if (key) return ICON_MAP[key];
        }
        
        return icon;
    }, [name]);

    if (!LucideIcon) {
        // Development warning only
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Icon "${name}" not found in static map. Add it to Icon.tsx to fix.`);
        }
        // Graceful fallback to avoid crash layout shifts
        return <div style={{ width: size, height: size, background: 'currentColor', opacity: 0.1, borderRadius: 4 }} className={className} />;
    }

    return <LucideIcon size={size as number} className={className} {...(props as any)} />;
};
