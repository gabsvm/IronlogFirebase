import React from 'react';

interface SkeletonPulseProps {
    className?: string;
}

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({ className = "" }) => (
    <div className={`bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg ${className}`} />
);

export const HomeSkeleton = () => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header Skeleton */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-8 h-8 rounded-lg" />
                    <SkeletonPulse className="w-24 h-6" />
                </div>
                <SkeletonPulse className="w-8 h-8 rounded-full" />
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-hidden">
                {/* Status Card Skeleton */}
                <div className="flex flex-col items-center gap-2 py-4">
                    <SkeletonPulse className="w-32 h-6 mb-2" />
                    <div className="flex gap-2">
                        <SkeletonPulse className="w-40 h-10 rounded-full" />
                        <SkeletonPulse className="w-10 h-10 rounded-full" />
                    </div>
                </div>

                {/* Heatmap Skeleton */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-white/5">
                    <SkeletonPulse className="w-24 h-4 mb-3" />
                    <div className="flex gap-1 flex-wrap">
                        {Array(80).fill(0).map((_, i) => (
                            <SkeletonPulse key={i} className="w-2.5 h-2.5 rounded-sm" />
                        ))}
                    </div>
                </div>

                {/* Workout Cards Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <SkeletonPulse className="w-12 h-3 mb-2" />
                                    <SkeletonPulse className="w-32 h-6" />
                                </div>
                                <SkeletonPulse className="w-8 h-8 rounded-full" />
                            </div>
                            <div className="flex gap-2">
                                <SkeletonPulse className="w-16 h-5" />
                                <SkeletonPulse className="w-16 h-5" />
                                <SkeletonPulse className="w-16 h-5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Nav Skeleton */}
            <div className="h-20 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 flex justify-around items-center px-6">
                <SkeletonPulse className="w-8 h-8 rounded-full" />
                <SkeletonPulse className="w-8 h-8 rounded-full" />
                <SkeletonPulse className="w-8 h-8 rounded-full" />
            </div>
        </div>
    );
};