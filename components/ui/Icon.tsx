
import React from 'react';
import { 
    ChevronLeft, Trash2, Clock, Check, MoreVertical, Settings, 
    BarChart2, TrendingUp, CornerDownRight, Play, Menu, Search, 
    RefreshCw, X, Moon, Sun, SkipForward, Plus, CloudOff, 
    CheckCircle, Zap, Link, Unlink, Share2, Minus, Upload, 
    Download, Activity, Edit, Save, Layout, Dumbbell, FileText, 
    Eye, EyeOff, DownloadCloud, GripVertical
} from 'lucide-react';

const icons = {
    ChevronLeft, Trash2, Clock, Check, MoreVertical, Settings,
    BarChart2, TrendingUp, CornerDownRight, Play, Menu, Search,
    RefreshCw, X, Moon, Sun, SkipForward, Plus, CloudOff,
    CheckCircle, Zap, Link, Unlink, Share2, Minus, Upload,
    Download, Activity, Edit, Save, Layout, Dumbbell, FileText,
    Eye, EyeOff, DownloadCloud, GripVertical
};

export type IconName = keyof typeof icons;

// Extend standard SVG props to allow onClick, style, etc.
// Explicitly add strokeWidth and fill to satisfy specific TS errors seen in build
interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number | string;
    strokeWidth?: number | string;
    fill?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...props }) => {
    const LucideIcon = icons[name];
    if (!LucideIcon) return null;
    
    // Spread ...props to pass strokeWidth, fill, onClick, etc. to the Lucide icon
    return <LucideIcon size={size as number} className={className} {...(props as any)} />;
};
