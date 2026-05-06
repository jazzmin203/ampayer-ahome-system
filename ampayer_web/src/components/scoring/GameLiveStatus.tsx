'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { RefreshCcw } from 'lucide-react';

interface GameLiveStatusProps {
    initialBalls?: number;
    initialStrikes?: number;
    initialOuts?: number;
}

export default function GameLiveStatus({ initialBalls = 0, initialStrikes = 0, initialOuts = 0 }: GameLiveStatusProps) {
    const [balls, setBalls] = useState(initialBalls);
    const [strikes, setStrikes] = useState(initialStrikes);
    const [outs, setOuts] = useState(initialOuts);
    const [runners, setRunners] = useState({ 1: false, 2: false, 3: false });

    const toggleBase = (base: 1 | 2 | 3) => {
        setRunners(prev => ({ ...prev, [base]: !prev[base] }));
    };

    const cycleBall = () => {
        setBalls(prev => (prev + 1) > 3 ? 0 : prev + 1);
    };

    const cycleStrike = () => {
        setStrikes(prev => (prev + 1) > 2 ? 0 : prev + 1);
    };

    const cycleOut = () => {
        setOuts(prev => (prev + 1) > 2 ? 0 : prev + 1);
    };

    const resetCount = () => {
        setBalls(0);
        setStrikes(0);
    };

    const resetInning = () => {
        setBalls(0);
        setStrikes(0);
        setOuts(0);
        setRunners({ 1: false, 2: false, 3: false });
    };

    // Helper for visual diamond base
    const Base = ({ active, onClick, className }: { active?: boolean, onClick?: () => void, className?: string }) => (
        <div
            onClick={onClick}
            className={`w-6 h-6 transform rotate-45 border-2 absolute cursor-pointer transition-all shadow-sm z-10 
            ${active ? 'bg-yellow-400 border-yellow-600 scale-110' : 'bg-white border-gray-300 hover:border-gray-400'} ${className}`}
        />
    );

    return (
        <Card className="w-full shadow-sm bg-white overflow-hidden border border-gray-100">
            <CardContent className="p-4">
                <div className="flex flex-row items-center justify-between gap-4">

                    {/* DIAMOND VISUAL */}
                    <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center bg-green-50 rounded-lg">
                        {/* Dirt Area */}
                        <div className="relative w-16 h-16 bg-amber-100/50 border border-amber-200 transform rotate-45">
                            {/* 2nd Base (Top corner of rotated square) */}
                            <Base active={runners[2]} onClick={() => toggleBase(2)} className="-top-3 -left-3" />

                            {/* 1st Base (Right corner) */}
                            <Base active={runners[1]} onClick={() => toggleBase(1)} className="-top-3 -right-3" />

                            {/* 3rd Base (Left corner) */}
                            <Base active={runners[3]} onClick={() => toggleBase(3)} className="-bottom-3 -left-3" />

                            {/* Home Plate (Bottom corner) */}
                            <div className="w-6 h-6 bg-white border-2 border-gray-300 absolute -bottom-3 -right-3 rotate-0 flex items-center justify-center text-[10px] font-bold text-gray-400 select-none z-10 shadow-sm" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
                            </div>
                        </div>
                    </div>

                    {/* COUNTER */}
                    <div className="flex flex-col gap-3 flex-1">
                        <div className="flex justify-around gap-2 text-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex flex-col items-center cursor-pointer select-none" onClick={cycleBall}>
                                <span className="text-2xl font-black text-blue-600 leading-none">{balls}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">BOLA</span>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div className="flex flex-col items-center cursor-pointer select-none" onClick={cycleStrike}>
                                <span className="text-2xl font-black text-red-600 leading-none">{strikes}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">STRIKE</span>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div className="flex flex-col items-center cursor-pointer select-none" onClick={cycleOut}>
                                <span className="text-2xl font-black text-gray-800 leading-none">{outs}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">OUT</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <button onClick={resetCount} className="text-[10px] font-medium text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 py-1.5 px-2 rounded border border-gray-200 flex items-center justify-center transition-colors">
                                <RefreshCcw className="w-3 h-3 mr-1.5" /> Reset Cuenta
                            </button>
                            <button onClick={resetInning} className="text-[10px] font-medium text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 py-1.5 px-2 rounded border border-gray-200 flex items-center justify-center transition-colors">
                                <RefreshCcw className="w-3 h-3 mr-1.5" /> Reset Entrada
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
