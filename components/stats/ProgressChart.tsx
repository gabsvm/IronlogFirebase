
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, ScriptableContext } from 'chart.js/auto';
import { Log } from '../../types';
import { formatDate } from '../../utils';
import { useApp } from '../../context/AppContext';

interface ProgressChartProps {
    exerciseId: string;
    logs: Log[];
    metric: '1rm' | 'volume';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ exerciseId, logs, metric }) => {
    const { lang, theme } = useApp();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Process Data
    const chartData = useMemo(() => {
        const dataPoints: { date: number, value: number, weight: number, reps: number }[] = [];

        // Sort logs chronologically
        const sortedLogs = [...logs].sort((a, b) => a.endTime - b.endTime);

        sortedLogs.forEach(log => {
            if (log.skipped) return;
            const ex = (log.exercises || []).find(e => e.id === exerciseId);
            if (!ex) return;

            let bestValue = 0;
            let bestSetDetails = { w: 0, r: 0 };

            if (metric === '1rm') {
                // Epley Formula: 1RM = Weight * (1 + Reps/30)
                (ex.sets || []).forEach(s => {
                    if (s.completed && s.weight && s.reps) {
                        const w = Number(s.weight);
                        const r = Number(s.reps);
                        const est1rm = w * (1 + r / 30);
                        if (est1rm > bestValue) {
                            bestValue = est1rm;
                            bestSetDetails = { w, r };
                        }
                    }
                });
            } else {
                // Total Volume Calculation
                bestValue = (ex.sets || []).reduce((acc, s) => {
                    if (s.completed && s.weight && s.reps) {
                        return acc + (Number(s.weight) * Number(s.reps));
                    }
                    return acc;
                }, 0);
            }

            if (bestValue > 0) {
                dataPoints.push({
                    date: log.endTime,
                    value: Math.round(bestValue),
                    weight: bestSetDetails.w,
                    reps: bestSetDetails.r
                });
            }
        });

        return dataPoints;
    }, [logs, exerciseId, metric]);

    const data = {
        labels: chartData.map(d => formatDate(d.date, lang)),
        datasets: [
            {
                label: metric === '1rm' ? 'Est. 1RM (kg)' : 'Volume (kg)',
                data: chartData.map(d => d.value),
                borderColor: '#dc2626',
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.4)'); // Red top
                    gradient.addColorStop(1, 'rgba(220, 38, 38, 0.0)'); // Transparent bottom
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#dc2626',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4, // Smooth curves
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: isDark ? '#18181b' : '#fff',
                titleColor: isDark ? '#fff' : '#18181b',
                bodyColor: isDark ? '#a1a1aa' : '#52525b',
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (item) => {
                        const point = chartData[item.dataIndex];
                        if (metric === '1rm') {
                             return `Est. 1RM: ${item.formattedValue}kg (${point.weight}x${point.reps})`;
                        }
                        return `Volume: ${item.formattedValue}kg`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: isDark ? '#52525b' : '#a1a1aa',
                    font: {
                        size: 10,
                        family: 'Inter'
                    },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 5
                },
                border: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: isDark ? '#27272a' : '#f4f4f5',
                },
                ticks: {
                    color: isDark ? '#52525b' : '#a1a1aa',
                    font: {
                        size: 10,
                        family: 'Inter'
                    }
                },
                border: {
                    display: false
                },
                beginAtZero: false // Better dynamics for 1RM
            }
        }
    };

    if (chartData.length < 2) {
        return (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/[0.02]">
                <p className="text-sm font-bold text-zinc-400 mb-1">Not enough data</p>
                <p className="text-xs text-zinc-500">Complete at least 2 workouts with this exercise to see progress.</p>
            </div>
        );
    }

    return (
        <div className="h-60 w-full">
            <Line data={data} options={options} />
        </div>
    );
};
