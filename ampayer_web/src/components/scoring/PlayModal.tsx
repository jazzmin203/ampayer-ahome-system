
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { XCircle, Eraser } from 'lucide-react';

interface DefensivePlayer {
    position: number;
    name: string;
}

interface PlayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (playData: any) => void;
    gameContext: {
        inning: number;
        half: string;
        outs: number;
        batterName: string;
        runner1B?: { id: number, name: string } | null;
        runner2B?: { id: number, name: string } | null;
        runner3B?: { id: number, name: string } | null;
        defensiveLineup?: DefensivePlayer[];
    };
}

const PLAY_TYPES = [
    { value: 'single', label: 'Sencillo (1B)', type: 'hit', outs: 0 },
    { value: 'double', label: 'Doble (2B)', type: 'hit', outs: 0 },
    { value: 'triple', label: 'Triple (3B)', type: 'hit', outs: 0 },
    { value: 'homerun', label: 'Home Run (HR)', type: 'hit', outs: 0 },
    { value: 'walk', label: 'Base por Bolas (BB)', type: 'walk', outs: 0 },
    { value: 'strikeout', label: 'Ponche (K)', type: 'out', outs: 1 },
    { value: 'fly_out', label: 'Elevado (Fly Out)', type: 'out', outs: 1 },
    { value: 'ground_out', label: 'Rola (Ground Out)', type: 'out', outs: 1 },
    { value: 'line_out', label: 'Línea (Line Out)', type: 'out', outs: 1 },
    { value: 'error', label: 'Error (E)', type: 'error', outs: 0 },
    { value: 'fielders_choice', label: 'Fielder\'s Choice (FC)', type: 'out', outs: 1 },
    { value: 'sacrifice_fly', label: 'Sacrificio (SF)', type: 'out', outs: 1 },
    { value: 'hit_by_pitch', label: 'Golpeado (HBP)', type: 'walk', outs: 0 },
];

const POSITIONS = [
    { id: 1, label: '1', name: 'Pitcher', top: '75%', left: '50%' },
    { id: 2, label: '2', name: 'Catcher', top: '88%', left: '50%' },
    { id: 3, label: '3', name: '1ra Base', top: '65%', left: '72%' },
    { id: 4, label: '4', name: '2da Base', top: '48%', left: '62%' },
    { id: 5, label: '5', name: '3ra Base', top: '65%', left: '28%' },
    { id: 6, label: '6', name: 'Shortstop', top: '48%', left: '38%' },
    { id: 7, label: '7', name: 'Left Field', top: '25%', left: '20%' },
    { id: 8, label: '8', name: 'Center Field', top: '15%', left: '50%' },
    { id: 9, label: '9', name: 'Right Field', top: '25%', left: '80%' },
];

export default function PlayModal({ isOpen, onClose, onSave, gameContext }: PlayModalProps) {
    const [playType, setPlayType] = useState<string>('');
    const [fieldersInvolved, setFieldersInvolved] = useState<string>('');
    const [rbi, setRbi] = useState<number>(0);

    // Runner outcomes
    const [runner1BAction, setRunner1BAction] = useState<string>('hold');
    const [runner2BAction, setRunner2BAction] = useState<string>('hold');
    const [runner3BAction, setRunner3BAction] = useState<string>('hold');

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPlayType('');
            setFieldersInvolved('');
            setRbi(0);
            setRunner1BAction('hold');
            setRunner2BAction('hold');
            setRunner3BAction('hold');
        }
    }, [isOpen]);

    // Auto-calculate runner defaults based on play type
    useEffect(() => {
        if (!playType) return;

        const type = PLAY_TYPES.find(p => p.value === playType)?.type;

        if (type === 'hit') {
            if (playType === 'homerun') {
                setRunner1BAction(gameContext.runner1B ? 'score' : 'none');
                setRunner2BAction(gameContext.runner2B ? 'score' : 'none');
                setRunner3BAction(gameContext.runner3B ? 'score' : 'none');
                setRbi((gameContext.runner1B ? 1 : 0) + (gameContext.runner2B ? 1 : 0) + (gameContext.runner3B ? 1 : 0) + 1);
            }
        } else if (type === 'walk') {
            if (gameContext.runner1B) setRunner1BAction('advance_2b');
            if (gameContext.runner1B && gameContext.runner2B) setRunner2BAction('advance_3b');
            if (gameContext.runner1B && gameContext.runner2B && gameContext.runner3B) setRunner3BAction('score');
        }
    }, [playType, gameContext]);

    const handleSave = () => {
        const selectedType = PLAY_TYPES.find(p => p.value === playType);
        let outsFromRunners = 0;
        if (runner1BAction.includes('out')) outsFromRunners++;
        if (runner2BAction.includes('out')) outsFromRunners++;
        if (runner3BAction.includes('out')) outsFromRunners++;

        const playData = {
            event_type: playType,
            fielders_involved: fieldersInvolved,
            rbi: rbi,
            outs_recorded: (selectedType?.outs || 0) + outsFromRunners,
            is_hit: selectedType?.type === 'hit',
            runner_movements: {
                runner_1b: gameContext.runner1B ? runner1BAction : null,
                runner_2b: gameContext.runner2B ? runner2BAction : null,
                runner_3b: gameContext.runner3B ? runner3BAction : null,
            }
        };
        onSave(playData);
        onClose();
    };

    const handlePositionClick = (posId: number) => {
        setFieldersInvolved(prev => prev ? `${prev}-${posId}` : `${posId}`);
    };

    const getPlayerForPosition = (posId: number) => {
        return gameContext.defensiveLineup?.find(p => p.position === posId)?.name || '---';
    };

    const renderRunnerOption = (runnerName: string, base: string, actionState: string, setAction: (val: string) => void) => (
        <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right col-span-1 text-[10px] font-medium leading-tight">Corredor en {base}<br /><span className="text-blue-600 font-bold">{runnerName}</span></label>
            <div className="col-span-3">
                <select
                    value={actionState}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-[11px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="hold">Se queda (Hold)</option>
                    <option value="advance_2b">Avanza a 2da</option>
                    <option value="advance_3b">Avanza a 3ra</option>
                    <option value="score">Anota carrera</option>
                    <option value="advance_error">Avanza por Error (E)</option>
                    <option value="advance_pb_wp">Avanza por PB/WP</option>
                    <option value="out_2b">Out en 2da</option>
                    <option value="out_3b">Out en 3ra</option>
                    <option value="out_home">Out en Home</option>
                </select>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Registrar Jugada - ${gameContext.batterName}`}
        >
            <div className="grid gap-4 py-2 max-h-[85vh] overflow-y-auto px-1 scrollbar-hide">
                {/* Play Type Selection */}
                <div className="grid grid-cols-2 gap-1.5">
                    {PLAY_TYPES.map((type) => (
                        <Button
                            key={type.value}
                            variant={playType === type.value ? 'default' : 'outline'}
                            className={`justify-start text-[10px] h-7 px-2 font-semibold transition-all ${playType === type.value ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50'}`}
                            onClick={() => setPlayType(type.value)}
                        >
                            {type.label}
                        </Button>
                    ))}
                </div>

                <hr className="my-0.5" />

                {/* Visual Field Selector */}
                <div className="space-y-2 p-2 bg-slate-900 rounded-xl border-2 border-slate-800 shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-2">Defensiva</span>
                        <div className="flex items-center gap-2 pr-1">
                            <span className="text-xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                                {fieldersInvolved || '---'}
                            </span>
                            {fieldersInvolved && (
                                <button onClick={() => setFieldersInvolved('')} className="text-white/60 hover:text-white transition-colors">
                                    <Eraser size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-white/10 group">
                        {/* Background Field Image */}
                        <img
                            src="/images/baseball_field.png"
                            alt="Baseball Field"
                            className="w-full h-full object-cover brightness-75 transition-all duration-700 group-hover:brightness-90"
                        />

                        {/* Overlay Gradient for better visibility */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

                        {/* Interactive Position Nodes */}
                        {POSITIONS.map((pos) => (
                            <div
                                key={pos.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-transform duration-300 hover:scale-110"
                                style={{ top: pos.top, left: pos.left }}
                            >
                                <button
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-lg transition-all
                                        ${fieldersInvolved.split('-').includes(pos.id.toString())
                                            ? 'bg-blue-600 border-white text-white ring-4 ring-blue-500/50 scale-110'
                                            : 'bg-white/90 border-slate-800 text-slate-900 hover:bg-blue-500 hover:text-white hover:border-white shadow-blue-900/40'}`}
                                    onClick={() => handlePositionClick(pos.id)}
                                >
                                    {pos.label}
                                </button>
                                <div className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20 max-w-[80px]">
                                    <p className="text-[8px] text-white font-medium truncate text-center leading-none uppercase tracking-tighter shadow-sm">
                                        {getPlayerForPosition(pos.id)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 items-center px-1">
                    {/* RBI Manual Override */}
                    <div className="flex-1 flex items-center gap-3 bg-blue-50 p-2 rounded-lg border border-blue-100 shadow-inner">
                        <label htmlFor="rbi" className="text-[11px] font-black text-blue-900 uppercase">RBI</label>
                        <Input
                            id="rbi"
                            type="number"
                            value={rbi}
                            onChange={(e) => setRbi(parseInt(e.target.value) || 0)}
                            className="w-14 h-8 text-center font-bold text-lg bg-white border-blue-200 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Runners Management */}
                {(gameContext.runner1B || gameContext.runner2B || gameContext.runner3B) && (
                    <div className="space-y-1.5 border-t-2 border-slate-100 pt-2 bg-slate-50/50 p-2 rounded-lg">
                        <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest pl-1 mb-1">Invasores de Bases</h4>
                        <div className="space-y-1.5">
                            {gameContext.runner3B && renderRunnerOption(gameContext.runner3B.name, '3ra', runner3BAction, setRunner3BAction)}
                            {gameContext.runner2B && renderRunnerOption(gameContext.runner2B.name, '2da', runner2BAction, setRunner2BAction)}
                            {gameContext.runner1B && renderRunnerOption(gameContext.runner1B.name, '1ra', runner1BAction, setRunner1BAction)}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 px-1">
                <Button variant="outline" onClick={onClose} className="h-10 text-xs font-bold uppercase tracking-widest hover:bg-slate-50">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!playType}
                    className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white h-10 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-700/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                >
                    Guardar Jugada
                </Button>
            </div>
        </Modal>
    );
}
