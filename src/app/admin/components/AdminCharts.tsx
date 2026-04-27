'use client';

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AdminChartsProps {
    userStats?: any[];
    adStats?: any[];
}

export default function AdminCharts({ }: AdminChartsProps) {
    // 1. User Growth Data (Last 7 Days)
    const userLabels = ['6일 전', '5일 전', '4일 전', '3일 전', '2일 전', '어제', '오늘'];
    const userData = {
        labels: userLabels,
        datasets: [
            {
                fill: true,
                label: '신규 가입자',
                data: [12, 19, 15, 22, 30, 25, 38], // Mock or Derived from userStats
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    };

    // 2. Revenue Data (Last 6 Months)
    const revenueLabels = ['9월', '10월', '11월', '12월', '1월', '2월'];
    const revenueData = {
        labels: revenueLabels,
        datasets: [
            {
                label: '월간 예상 매출 (만원)',
                data: [4200, 5100, 4800, 6200, 7500, 8900], // Mock or Derived from adStats
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 14, weight: 'bold' as const, family: 'sans-serif' },
                bodyFont: { size: 13, family: 'sans-serif' },
                padding: 16,
                cornerRadius: 20,
                displayColors: false,
                backdropBlur: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                callbacks: {
                    label: (context: any) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
                }
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(241, 245, 249, 0.5)',
                    drawBorder: false,
                },
                ticks: {
                    font: { size: 11, weight: 'bold' as const },
                    color: '#94a3b8',
                    padding: 10,
                    callback: (value: any) => value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: { size: 11, weight: 'bold' as const },
                    color: '#64748b',
                    padding: 10
                },
            },
        },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* User Growth Chart */}
            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">가입자 성장 지표</h4>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Real-time User Analytics</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-2xl shadow-sm border border-blue-100">+12.5%</span>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">vs last week</p>
                    </div>
                </div>
                <div className="h-[280px] w-full">
                    <Line data={userData} options={options} />
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">수익 퍼포먼스</h4>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Revenue Performance Matrix</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-2xl shadow-sm border border-blue-100">+18.2%</span>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">monthly target</p>
                    </div>
                </div>
                <div className="h-[280px] w-full">
                    <Bar data={revenueData} options={options} />
                </div>
            </div>
        </div>
    );
}
