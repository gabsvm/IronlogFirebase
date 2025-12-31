import React from 'react';
import { 
    ChevronLeft, Trash2, Clock, Check, MoreVertical, Settings, 
    BarChart2, TrendingUp, CornerDownRight, Play, Menu, Search, 
    RefreshCw, X, Moon, Sun, SkipForward, Plus, CloudOff, 
    CheckCircle, Zap, Link, Unlink, Share2, Minus, Upload, 
    Download, Activity, Edit, Save, Layout, Dumbbell, FileText, 
    Eye, EyeOff, DownloadCloud
} from 'lucide-react';

const icons = {
    ChevronLeft, Trash2, Clock, Check, MoreVertical, Settings,
    BarChart2, TrendingUp, CornerDownRight, Play, Menu, Search,
    RefreshCw, X, Moon, Sun, SkipForward, Plus, CloudOff,
    CheckCircle, Zap, Link, Unlink, Share2, Minus, Upload,
    Download, Activity, Edit, Save, Layout, Dumbbell, FileText,
    Eye, EyeOff, DownloadCloud
};

export type IconName = keyof typeof icons;

interface IconProps {
    name: IconName;
    size?: number;
    className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => {
    const LucideIcon = icons[name];
    if (!LucideIcon) return null;
    return <LucideIcon size={size} className={className} />;
};
