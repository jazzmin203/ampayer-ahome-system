
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Trash2, UserPlus, RefreshCw, Activity, Edit, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import PlayModal from './PlayModal';

interface Player {
    id: number;
    jersey_number?: number;
    first_name: string;
    last_name: string;
}

interface Game {
    id: string | number;
    local_team: number;
    local_team_name: string;
    visitor_team: number;
    visitor_team_name: string;
    current_inning: number;
    inning_half: string;
    actual_start_time?: string;
    actual_end_time?: string;
    home_score: number;
    away_score: number;
    outs: number;
    balls: number;
    strikes: number;
    runner_on_1b?: number;
    runner_on_2b?: number;
    runner_on_3b?: number;
    runner_on_1b_info?: Player;
    runner_on_2b_info?: Player;
    runner_on_3b_info?: Player;
    plays?: any[];
    lineups?: LineupEntry[];
    status?: string;
}

interface LineupEntry {
    id?: number;
    player: number;
    player_info?: Player;
    batting_order: number;
    field_position: string;
    team: number;
    is_active?: boolean;
    entry_inning?: number;
    exit_inning?: number;
    PA: number; AB: number; R: number; H: number;
    singles: number; doubles: number; triples: number; HR: number;
    RBI: number; BB: number; IBB: number; HBP: number;
    SO: number; SH: number; SF: number; SB: number;
    CS: number; LOB: number; TB: number;
    // Pitching
    IP_outs: number;
    pitch_H: number;
    pitch_R: number;
    pitch_ER: number;
    pitch_BB: number;
    pitch_SO: number;
    pitch_HR: number;
}

interface ScorecardProps {
    game: Game;
    onPlayRecorded: () => void;
}

export function Scorecard({ game, onPlayRecorded }: ScorecardProps) {
    const [loading, setLoading] = useState(false);
    const [teamPlayers, setTeamPlayers] = useState<{ local: Player[], visitor: Player[] } | null>(null);
    const [localLineup, setLocalLineup] = useState<LineupEntry[]>([]);
    const [visitorLineup, setVisitorLineup] = useState<LineupEntry[]>([]);

    // Modal State
    const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{
        inning: number;
        player_id: number;
        batter_name: string;
        teamSide: 'local' | 'visitor';
    } | null>(null);

    // Add Player Modal State
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    const [newPlayerTeam, setNewPlayerTeam] = useState<{ side: 'local' | 'visitor', id: number } | null>(null);
    const [newPlayerData, setNewPlayerData] = useState({ first_name: '', last_name: '', jersey_number: '' });
    const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const res = await api.get(`/games/${game.id}/lineups/`);
                setTeamPlayers({
                    local: res.data.local_team.players,
                    visitor: res.data.visitor_team.players
                });
            } catch (error) {
                console.error("Error fetching lineups", error);
            }
        };
        fetchPlayers();
    }, [game.id]);

    useEffect(() => {
        const localFromBackend = (game.lineups || []).filter(e => e.team === game.local_team);
        const visitorFromBackend = (game.lineups || []).filter(e => e.team === game.visitor_team);

        if (localFromBackend.length > 0) {
            setLocalLineup(localFromBackend);
        } else {
            setLocalLineup(prev => prev.length > 0 ? prev : Array(11).fill(null).map((_, i) => createEmptyLineup(i + 1, game.local_team)));
        }

        if (visitorFromBackend.length > 0) {
            setVisitorLineup(visitorFromBackend);
        } else {
            setVisitorLineup(prev => prev.length > 0 ? prev : Array(11).fill(null).map((_, i) => createEmptyLineup(i + 1, game.visitor_team)));
        }
    }, [game.lineups, game.local_team, game.visitor_team]);

    const createEmptyLineup = (order: number, teamId: number): LineupEntry => ({
        player: 0,
        team: teamId,
        batting_order: order,
        field_position: '',
        PA: 0, AB: 0, R: 0, H: 0,
        singles: 0, doubles: 0, triples: 0, HR: 0,
        RBI: 0, BB: 0, IBB: 0, HBP: 0,
        SO: 0, SH: 0, SF: 0, SB: 0,
        CS: 0, LOB: 0, TB: 0,
        IP_outs: 0, pitch_H: 0, pitch_R: 0, pitch_ER: 0, pitch_BB: 0, pitch_SO: 0, pitch_HR: 0
    });

    const handleStartGame = async () => {
        try {
            await api.post(`/games/${game.id}/start_game/`);
            onPlayRecorded();
        } catch (error) {
            console.error("Error starting game", error);
        }
    };

    const handleSaveLineup = async () => {
        setLoading(true);
        try {
            const combinedLineup = [
                ...localLineup.filter(e => e.player > 0),
                ...visitorLineup.filter(e => e.player > 0)
            ];
            await api.post(`/games/${game.id}/save_lineup/`, { lineup: combinedLineup });
            alert("Lineas guardadas correctamente");
            onPlayRecorded(); // Refresh game state to get the saved lineups back
        } catch (error) {
            console.error("Error saving lineup", error);
            alert("Error al guardar la alineación");
        } finally {
            setLoading(false);
        }
    };

    const handleEndGame = async () => {
        if (!confirm("¿Seguro que deseas terminar el juego?")) return;
        try {
            await api.post(`/games/${game.id}/end_game/`);
            onPlayRecorded();
        } catch (error) {
            console.error("Error ending game", error);
        }
    };

    const handleCellClick = (inning: number, playerId: number, teamSide: 'local' | 'visitor') => {
        const playerList = teamSide === 'local' ? teamPlayers?.local : teamPlayers?.visitor;
        const player = playerList?.find(p => p.id === playerId);

        if (!player) {
            alert("Por favor selecciona un jugador para este turno al bate.");
            return;
        }

        setSelectedCell({
            inning,
            player_id: playerId,
            batter_name: `${player.first_name} ${player.last_name}`,
            teamSide
        });
        setIsPlayModalOpen(true);
    };

    const handlePlaySave = async (playData: any) => {
        if (!selectedCell) return;

        setLoading(true);
        try {
            const { runner_movements, event_type, rbi, outs_recorded, is_hit } = playData;

            // Calculate resultant runner state
            let nextRunner1B: number | null = null;
            let nextRunner2B: number | null = null;
            let nextRunner3B: number | null = null;

            // Map actions to bases for history
            const getTargetBase = (action: string) => {
                if (action === 'advance_2b' || action === 'out_2b') return 2;
                if (action === 'advance_3b' || action === 'out_3b') return 3;
                if (action === 'score' || action === 'out_home') return 4;
                return null;
            };

            // Process existing runners based on selected action
            if (game.runner_on_3b) {
                const action = runner_movements.runner_3b;
                const id = game.runner_on_3b;
                if (action === 'hold') nextRunner3B = id;
            }
            if (game.runner_on_2b) {
                const action = runner_movements.runner_2b;
                const id = game.runner_on_2b;
                if (action === 'hold') nextRunner2B = id;
                else if (action && action.includes('advance_3b')) nextRunner3B = id;
            }
            if (game.runner_on_1b) {
                const action = runner_movements.runner_1b;
                const id = game.runner_on_1b;
                if (action === 'hold') nextRunner1B = id;
                else if (action && action.includes('advance_2b')) nextRunner2B = id;
                else if (action && action.includes('advance_3b')) nextRunner3B = id;
                else if (action === 'advance_error') {
                    // Default to next base if just "advance_error"
                    nextRunner2B = id;
                }
            }

            // Process batter destination
            const battingTeamSide = selectedCell.teamSide;
            const defensiveTeamSide = battingTeamSide === 'local' ? 'visitor' : 'local';
            const defensiveLineup = defensiveTeamSide === 'local' ? localLineup : visitorLineup;
            const activePitcher = defensiveLineup.find(e => e.is_active && (e.field_position === '1' || e.field_position === 'P'))?.player;
            
            if (!activePitcher) {
                alert("No hay un pitcher asignado en el lineup defensivo (Posición 1). Por favor, asigna uno antes de guardar.");
                setLoading(false);
                return;
            }
            
            const pitcherId = activePitcher;
            let batterId = selectedCell.player_id;
            if (['single', 'walk', 'hit_by_pitch'].includes(event_type)) {
                nextRunner1B = batterId;
            } else if (event_type === 'double') {
                nextRunner2B = batterId;
            } else if (event_type === 'triple') {
                nextRunner3B = batterId;
            }

            const payload = {
                inning: selectedCell.inning,
                half: selectedCell.teamSide === 'local' ? 'bottom' : 'top',
                batter: batterId,
                pitcher: pitcherId,
                event_type: event_type,
                fielders_involved: playData.fielders_involved,
                runs_scored: rbi,
                outs_recorded: outs_recorded || 0,
                is_hit: is_hit || false,
                runner_on_1b: nextRunner1B,
                runner_on_2b: nextRunner2B,
                runner_on_3b: nextRunner3B,
                // Detailed history fields for the Play record
                runner_on_1st_moved_to: getTargetBase(runner_movements.runner_1b),
                runner_on_2nd_moved_to: getTargetBase(runner_movements.runner_2b),
                runner_on_3rd_moved_to: getTargetBase(runner_movements.runner_3b),
            };

            await api.post(`/games/${game.id}/record_play/`, payload);
            onPlayRecorded();
            setIsPlayModalOpen(false);
        } catch (error) {
            console.error("Error recording play", error);
            alert("Error al registrar la jugada");
        } finally {
            setLoading(false);
        }
    };

    const updateLineupStat = async (side: 'local' | 'visitor', index: number, field: string, value: any) => {
        const teamSide = side === 'local' ? [...localLineup] : [...visitorLineup];
        const otherSide = side === 'local' ? visitorLineup : localLineup;
        const updatedEntry = { ...teamSide[index], [field]: value };

        // Duplicate check
        if (field === 'player' && value > 0) {
            const isDuplicate = teamSide.some((e, i) => e.is_active && e.player === value && i !== index);
            const isInOtherTeam = otherSide.some(e => e.is_active && e.player === value);
            
            if (isDuplicate || isInOtherTeam) {
                alert("Este jugador ya está registrado en el lineup activo de uno de los equipos.");
                return;
            }
        }

        teamSide[index] = updatedEntry;
        if (side === 'local') setLocalLineup(teamSide);
        else setVisitorLineup(teamSide);

        // Auto-save player and position changes to prevent data loss
        if ((field === 'player' || field === 'field_position') && updatedEntry.player > 0) {
            try {
                await api.post(`/games/${game.id}/save_lineup/`, { 
                    lineup: [{
                        ...updatedEntry,
                        team: teamSide === 'local' ? game.local_team : game.visitor_team
                    }] 
                });
                console.log("Lineup auto-saved");
            } catch (error) {
                console.error("Error in auto-save lineup", error);
            }
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayerTeam || !newPlayerData.first_name || !newPlayerData.last_name) {
            alert("Completa al menos el nombre y apellido");
            return;
        }

        if (!newPlayerTeam) return;

        setLoading(true);
        try {
            const payload = {
                ...newPlayerData,
                team: newPlayerTeam.id,
                jersey_number: (newPlayerData.jersey_number !== '' && newPlayerData.jersey_number !== null) 
                    ? parseInt(newPlayerData.jersey_number) 
                    : null
            };

            let newPlayer;
            if (editingPlayerId) {
                const res = await api.patch(`/players/${editingPlayerId}/`, payload);
                newPlayer = res.data;
                alert("Jugador actualizado con éxito");
            } else {
                const res = await api.post('/players/', payload);
                newPlayer = res.data;
                alert("Jugador añadido con éxito");
            }
            
            // Update local state for team players list
            setTeamPlayers(prev => {
                if (!prev) return prev;
                const side = newPlayerTeam.side;
                const existing = prev[side] || [];
                const updated = editingPlayerId 
                    ? existing.map(p => p.id === editingPlayerId ? newPlayer : p)
                    : [...existing, newPlayer];
                return { ...prev, [side]: updated };
            });
            
            setIsAddPlayerModalOpen(false);
            setNewPlayerData({ first_name: '', last_name: '', jersey_number: '' });
            setEditingPlayerId(null);
        } catch (error: any) {
            console.error("Error saving player", error);
            const serverError = error.response?.data ? JSON.stringify(error.response.data) : "Error desconocido";
            alert(`Error al guardar jugador: ${serverError}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubstitution = async (side: 'local' | 'visitor', index: number, oldPlayerId: number, preSelectedNewPlayerId?: number) => {
        const teamSide = side === 'local' ? localLineup : visitorLineup;
        const entry = teamSide[index];
        const newPlayerId = preSelectedNewPlayerId || entry.player;

        if (newPlayerId === 0 || (newPlayerId === oldPlayerId && !preSelectedNewPlayerId)) {
            alert("Selecciona un nuevo jugador para realizar la sustitución.");
            return;
        }

        const confirmSub = window.confirm(`¿Confirmas la sustitución?`);
        if (!confirmSub) return;

        try {
            await api.post(`/games/${game.id}/substitution/`, {
                incoming_player: newPlayerId,
                outgoing_player: oldPlayerId,
                team: side === 'local' ? game.local_team : game.visitor_team,
                position: entry.field_position,
                batting_order: entry.batting_order // Pass batting order to identify slot correctly
            });
            alert("Sustitución registrada.");
            onPlayRecorded(); // Refresh
        } catch (error) {
            console.error(error);
            alert("Error al registrar la sustitución.");
        }
    };

    const ScorecardCell = ({ plays, inning, onClick }: { plays: any[], inning: number, onClick: () => void }) => {
        const play = plays.find(p => p.inning === inning);
        
        const deletePlay = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!confirm("¿Seguro que deseas borrar esta jugada? Se revertirán las estadísticas.")) return;
            try {
                await api.post(`/games/${game.id}/delete_play/`, { play_id: play.id });
                onPlayRecorded();
            } catch (error) {
                console.error(error);
                alert("Error al borrar la jugada");
            }
        };

        if (!play) return <td className="p-0 border border-gray-300 text-center cursor-pointer hover:bg-blue-50 h-12 w-12 group" onClick={onClick}>
            <div className="hidden group-hover:block"><Plus size={12} className="mx-auto text-blue-300" /></div>
            <span className="group-hover:hidden">-</span>
        </td>;

        let content = '';
        let colorClass = "text-gray-400";
        let isHit = false;
        let isOut = false;
        let isBB = false;

        if (['single', 'double', 'triple', 'homerun'].includes(play.event_type)) {
            content = play.event_type === 'homerun' ? 'HR' : play.event_type === 'triple' ? '3B' : play.event_type === 'double' ? '2B' : '1B';
            colorClass = "text-green-700 font-bold";
            isHit = true;
        } else if (play.event_type === 'walk' || play.event_type === 'hit_by_pitch') {
            content = play.event_type === 'walk' ? 'BB' : 'HBP';
            colorClass = "text-blue-800 font-bold";
            isBB = true;
        } else if (play.event_type.includes('out') || play.event_type === 'strikeout') {
            content = play.fielders_involved || (play.event_type === 'strikeout' ? 'K' : 'Out');
            colorClass = "text-red-600 font-bold";
            isOut = true;
        }

        // Draw diamond based on bases reached
        const drawDiamond = () => {
            const size = 32;
            const mid = size / 2;
            const margin = 4;
            // Home: Bottom (mid, size-margin)
            // 1B: Right (size-margin, mid)
            // 2B: Top (mid, margin)
            // 3B: Left (margin, mid)

            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
                    {/* Background Diamond */}
                    <path
                        d={`M ${mid} ${size - margin} L ${size - margin} ${mid} L ${mid} ${margin} L ${margin} ${mid} Z`}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                    />

                    {/* Path reached */}
                    {isHit && (
                        <path
                            d={play.event_type === 'homerun'
                                ? `M ${mid} ${size - margin} L ${size - margin} ${mid} L ${mid} ${margin} L ${margin} ${mid} Z`
                                : play.event_type === 'triple'
                                    ? `M ${mid} ${size - margin} L ${size - margin} ${mid} L ${mid} ${margin} L ${margin} ${mid}`
                                    : play.event_type === 'double'
                                        ? `M ${mid} ${size - margin} L ${size - margin} ${mid} L ${mid} ${margin}`
                                        : `M ${mid} ${size - margin} L ${size - margin} ${mid}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    )}

                    {(isBB || play.event_type === 'error') && (
                        <path d={`M ${mid} ${size - margin} L ${size - margin} ${mid}`} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2,1" />
                    )}

                    {/* Result Text */}
                    <text x={mid} y={mid + 4} textAnchor="middle" fontSize="9" className={colorClass} style={{ fontWeight: 'bold' }}>{content}</text>

                    {/* RBI Indicators (Dots) */}
                    {play.runs_scored > 0 && (
                        <g>
                            {Array.from({ length: Math.min(4, play.runs_scored) }).map((_, i) => (
                                <circle 
                                    key={i} 
                                    cx={mid - 6 + (i * 4)} 
                                    cy={mid + 10} 
                                    r="1.5" 
                                    fill="#ef4444" 
                                />
                            ))}
                        </g>
                    )}

                    {/* Runs scored indicator (Home plate fill) */}
                    {play.runs_scored > 0 && <circle cx={mid} cy={size - margin} r="2.5" fill="#ef4444" />}
                </svg>
            );
        };

        return (
            <td className="p-0 border border-gray-300 text-center relative h-12 w-12 group">
                <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={deletePlay}
                        className="bg-red-50 text-red-500 hover:bg-red-100 rounded p-0.5 shadow-sm"
                        title="Borrar Jugada"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
                <div className="cursor-pointer h-full w-full flex items-center justify-center hover:bg-blue-50/30" onClick={onClick}>
                    {drawDiamond()}
                </div>
            </td>
        );
    };

    const renderLineup = (side: 'local' | 'visitor') => {
        const teamLineup = side === 'local' ? localLineup : visitorLineup;
        const players = side === 'local' ? teamPlayers?.local || [] : teamPlayers?.visitor || [];
        const teamName = side === 'local' ? game.local_team_name : game.visitor_team_name;

        // Group by batting order to show history
        const groupedOrder: Record<number, LineupEntry[]> = {};
        teamLineup.forEach(entry => {
            if (!groupedOrder[entry.batting_order]) groupedOrder[entry.batting_order] = [];
            groupedOrder[entry.batting_order].push(entry);
        });

        const orders = Array.from({ length: 11 }, (_, i) => i + 1);

        return (
            <div className="overflow-x-auto mt-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${side === 'local' ? 'bg-blue-600' : 'bg-orange-500'}`}></div>
                        <h4 className="font-bold text-gray-800 uppercase tracking-wider">{teamName}</h4>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                            setNewPlayerTeam({ side, id: side === 'local' ? game.local_team : game.visitor_team });
                            setIsAddPlayerModalOpen(true);
                        }}
                    >
                        <UserPlus className="h-3 w-3 mr-1" /> Alta Jugador
                    </Button>
                </div>
                <table className="w-full text-xs border-collapse border border-gray-300 min-w-[800px] shadow-sm bg-white">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold">
                            <th className="p-2 border border-gray-300 w-10">#</th>
                            <th className="p-2 border border-gray-300 text-left">Jugador / Sustituciones</th>
                            <th className="p-2 border border-gray-300 w-14">Pos</th>
                            {Array.from({ length: Math.max(9, game.current_inning) }, (_, i) => i + 1).map(i => (
                                <th key={i} className="p-2 border border-gray-300 w-12 text-center bg-blue-50/50">{i}</th>
                            ))}
                            <th className="p-2 border border-gray-300 w-10 bg-gray-100 italic">AB</th>
                            <th className="p-2 border border-gray-300 w-10 bg-gray-100 italic">R</th>
                            <th className="p-2 border border-gray-300 w-10 bg-gray-100 italic">H</th>
                            <th className="p-2 border border-gray-300 w-10 bg-gray-100 italic">RBI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            const entries = (groupedOrder[order] || []).sort((a, b) => (a.entry_inning || 1) - (b.entry_inning || 1));
                            const activeEntry = entries.find(e => e.is_active) || entries[0] || createEmptyLineup(order, side === 'local' ? game.local_team : game.visitor_team);

                            // Collect all plays for ANY player who was in this batting slot
                            const slotPlayers = entries.map(e => e.player).filter(id => id > 0);
                            const slotPlays = game.plays?.filter(p => slotPlayers.includes(p.batter)) || [];

                            return (
                                <tr key={order} className="hover:bg-blue-50/30 transition-colors border-b border-gray-200">
                                    <td className="p-2 border border-gray-300 text-center font-bold text-gray-500 bg-gray-50/50">{order}</td>
                                    <td className="p-2 border border-gray-300 min-w-[180px]">
                                        <div className="flex flex-col gap-1">
                                            {entries.map((entry, idx) => (
                                                <div key={idx} className={`flex items-center gap-2 ${!entry.is_active ? 'opacity-50 grayscale scale-95 origin-left' : ''}`}>
                                                    <select
                                                        className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer font-medium text-sm"
                                                        value={entry.player}
                                                        onChange={(e) => updateLineupStat(side, teamLineup.indexOf(entry), 'player', parseInt(e.target.value))}
                                                    >
                                                        <option value={0}>Seleccionar jugador...</option>
                                                        {players?.map(p => {
                                                            const isAlreadyInLineup = teamLineup.some(e => e.is_active && e.player === p.id && e.id !== entry.id);
                                                            return (
                                                                <option key={p.id} value={p.id} disabled={isAlreadyInLineup}>
                                                                    #{p.jersey_number} {p.first_name} {p.last_name} {isAlreadyInLineup ? '(Ya en lineup)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    {entry.is_active && (
                                                        <div className="flex items-center gap-1">
                                                            {game.status === 'in_progress' && (
                                                                <button
                                                                    onClick={() => handleSubstitution(side, teamLineup.indexOf(entry), entry.player)}
                                                                    className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-colors"
                                                                    title="Sustituir Jugador"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    const p = players?.find(x => x.id === entry.player);
                                                                    if (p) {
                                                                        setEditingPlayerId(p.id);
                                                                        setNewPlayerData({
                                                                            first_name: p.first_name,
                                                                            last_name: p.last_name,
                                                                            jersey_number: p.jersey_number?.toString() || ''
                                                                        });
                                                                        setNewPlayerTeam({ side, id: side === 'local' ? game.local_team : game.visitor_team });
                                                                        setIsAddPlayerModalOpen(true);
                                                                    }
                                                                }}
                                                                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
                                                                title="Editar Datos del Jugador"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            {game.status === 'in_progress' && (
                                                                <div className="flex items-center gap-1 border-l pl-1 ml-1 border-gray-200">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        id={`sub-check-${entry.id}`} 
                                                                        className="w-3 h-3 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            const isChecked = e.target.checked;
                                                                            const subSlot = document.getElementById(`sub-slot-${entry.id}`);
                                                                            if (subSlot) subSlot.classList.toggle('hidden', !isChecked);
                                                                        }}
                                                                    />
                                                                    <label htmlFor={`sub-check-${entry.id}`} className="text-[9px] font-bold text-orange-600 cursor-pointer uppercase">Cambio</label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {entry.exit_inning && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Out E{entry.exit_inning}</span>}
                                                    {entry.entry_inning && entry.entry_inning > 1 && <span className="text-[10px] bg-green-100 text-green-600 px-1 rounded">In E{entry.entry_inning}</span>}
                                                </div>
                                            ))}
                                            
                                            {/* Hidden Substitution Slot */}
                                            {entries.filter(e => e.is_active).map(activeEntry => (
                                                <div key={`sub-slot-container-${activeEntry.id}`} id={`sub-slot-${activeEntry.id}`} className="hidden mt-1 p-1 bg-orange-50 border border-orange-200 rounded flex flex-col gap-1">
                                                    <div className="text-[9px] font-bold text-orange-700 uppercase px-1">Nuevo Jugador:</div>
                                                    <select
                                                        className="w-full bg-white border border-orange-300 rounded px-1 py-1 text-xs"
                                                        value={0}
                                                        onChange={(e) => {
                                                            const newId = parseInt(e.target.value);
                                                            if (newId > 0) {
                                                                handleSubstitution(side, teamLineup.indexOf(activeEntry), activeEntry.player, newId);
                                                            }
                                                        }}
                                                    >
                                                        <option value={0}>Seleccionar...</option>
                                                        {players?.map(p => {
                                                            const isInLineup = teamLineup.some(e => e.is_active && e.player === p.id);
                                                            return <option key={p.id} value={p.id} disabled={isInLineup}>{p.first_name} {p.last_name} {isInLineup ? '(En juego)' : ''}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            ))}
                                            {entries.length === 0 && (
                                                <select
                                                    className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer font-medium text-sm text-gray-400"
                                                    value={0}
                                                    onChange={(e) => {
                                                        const teamId = side === 'local' ? game.local_team : game.visitor_team;
                                                        const newEntry = createEmptyLineup(order, teamId);
                                                        newEntry.player = parseInt(e.target.value);
                                                        const setter = side === 'local' ? setLocalLineup : setVisitorLineup;
                                                        setter(prev => [...prev, newEntry]);
                                                    }}
                                                >
                                                    <option value={0}>Seleccionar jugador...</option>
                                                    {players?.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            #{p.jersey_number} {p.first_name} {p.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2 border border-gray-300 text-center">
                                        <input
                                            type="text"
                                            className="w-full text-center bg-transparent border-none focus:ring-0 uppercase font-bold text-blue-700"
                                            value={activeEntry.field_position}
                                            onChange={(e) => updateLineupStat(side, teamLineup.indexOf(activeEntry), 'field_position', e.target.value)}
                                            placeholder="-"
                                        />
                                    </td>
                                    {Array.from({ length: Math.max(9, game.current_inning) }, (_, i) => i + 1).map(i => (
                                        <ScorecardCell
                                            key={i}
                                            plays={slotPlays}
                                            inning={i}
                                            onClick={() => handleCellClick(i, activeEntry.player, side)}
                                        />
                                    ))}
                                    <td className="p-2 border border-gray-300 text-center bg-gray-50/50 font-medium">{activeEntry.AB}</td>
                                    <td className="p-2 border border-gray-300 text-center bg-gray-50/50 font-medium">{activeEntry.R}</td>
                                    <td className="p-2 border border-gray-300 text-center bg-gray-50/50 font-medium">{activeEntry.H}</td>
                                    <td className="p-2 border border-gray-300 text-center bg-gray-50/50 font-medium">{activeEntry.RBI}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pitching Summary */}
                <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Pitcheo - {teamName}</h5>
                    <table className="w-full text-center text-[10px]">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-200">
                                <th className="text-left p-1">Lanzador</th>
                                <th className="p-1">IP</th>
                                <th className="p-1">H</th>
                                <th className="p-1">R</th>
                                <th className="p-1">BB</th>
                                <th className="p-1">SO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamLineup.filter(e => e.IP_outs > 0 || e.field_position === '1').map((p, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                    <td className="text-left p-1 font-medium">#{players?.find(tp => tp.id === p.player)?.jersey_number} {players?.find(tp => tp.id === p.player)?.first_name}</td>
                                    <td className="p-1">{Math.floor(p.IP_outs / 3)}.{p.IP_outs % 3}</td>
                                    <td className="p-1">{p.pitch_H || 0}</td>
                                    <td className="p-1">{p.pitch_R || 0}</td>
                                    <td className="p-1">{p.pitch_BB || 0}</td>
                                    <td className="p-1">{p.pitch_SO || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (!teamPlayers) return <div className="p-4 text-center">Cargando rosters...</div>;

    return (
        <Card className="w-full shadow-lg">
            <CardHeader className="bg-blue-900 text-white rounded-t-lg py-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Scorecard Interactivo</CardTitle>
                    <div className="space-x-2 flex">
                        <Button size="sm" onClick={handleSaveLineup} disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-8">
                            {loading ? 'Guardando...' : 'Guardar Lineup'}
                        </Button>
                        {!game.actual_start_time && (
                            <Button size="sm" onClick={handleStartGame} className="bg-green-600 hover:bg-green-700 h-8">Iniciar Juego</Button>
                        )}
                        {game.actual_start_time && !game.actual_end_time && (
                            <Button size="sm" variant="destructive" onClick={handleEndGame} className="h-8">Terminar Juego</Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {/* Line Score Table */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto shadow-inner mb-6">
                    <div className="flex items-center justify-between mb-2 ml-1">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <h5 className="text-xs font-bold text-gray-500 uppercase">Puntuación por Entradas</h5>
                        </div>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-[10px] h-6 px-2 text-blue-600 hover:bg-blue-50"
                            onClick={async () => {
                                try {
                                    await api.patch(`/games/${game.id}/`, { current_inning: game.current_inning + 1 });
                                    onPlayRecorded();
                                } catch (e) { alert("Error al agregar entrada"); }
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Agregar Entrada
                        </Button>
                    </div>
                    <table className="w-full text-center border-collapse bg-white rounded-md overflow-hidden">
                        <thead>
                            <tr className="bg-gray-800 text-white text-[10px]">
                                <th className="p-2 text-left w-32">EQUIPO</th>
                                {Array.from({ length: Math.max(9, game.current_inning) }, (_, i) => i + 1).map(i => (
                                    <th key={i} className="p-2 border-l border-gray-700">{i}</th>
                                ))}
                                <th className="p-2 border-l border-gray-700 bg-gray-700 w-10">R</th>
                                <th className="p-2 border-l border-gray-700 bg-gray-700 w-10">H</th>
                                <th className="p-2 border-l border-gray-700 bg-gray-700 w-10">E</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-bold">
                            <tr className="border-b border-gray-100">
                                <td className="p-2 text-left text-orange-600 bg-gray-50">{game.visitor_team_name}</td>
                                {Array.from({ length: Math.max(9, game.current_inning) }, (_, i) => i + 1).map(i => {
                                    const runs = game.plays?.filter(p => p.inning === i && p.half === 'top').reduce((sum, p) => sum + (p.runs_scored || 0), 0);
                                    return <td key={i} className="p-2 border-l border-gray-100">{i > game.current_inning ? '-' : runs}</td>;
                                })}
                                <td className="p-2 border-l border-gray-200 bg-orange-50 text-orange-700">{game.away_score}</td>
                                <td className="p-2 border-l border-gray-100 bg-orange-50 text-gray-600">--</td>
                                <td className="p-2 border-l border-gray-100 bg-orange-50 text-red-600">--</td>
                            </tr>
                            <tr>
                                <td className="p-2 text-left text-blue-700 bg-gray-50">{game.local_team_name}</td>
                                {Array.from({ length: Math.max(9, game.current_inning) }, (_, i) => i + 1).map(i => {
                                    const runs = game.plays?.filter(p => p.inning === i && p.half === 'bottom').reduce((sum, p) => sum + (p.runs_scored || 0), 0);
                                    const isCompleted = i < game.current_inning || (i === game.current_inning && game.inning_half === 'bottom');
                                    return <td key={i} className="p-2 border-l border-gray-100">{!isCompleted ? '-' : runs}</td>;
                                })}
                                <td className="p-2 border-l border-gray-200 bg-blue-50 text-blue-700">{game.home_score}</td>
                                <td className="p-2 border-l border-gray-100 bg-blue-50 text-gray-600">--</td>
                                <td className="p-2 border-l border-gray-100 bg-blue-50 text-red-600">--</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {renderLineup('visitor')}
                <div className="my-8 border-t border-dashed border-gray-200"></div>
                {renderLineup('local')}

                {selectedCell && (() => {
                    const battingTeamSide = selectedCell.teamSide;
                    const defensiveTeamSide = battingTeamSide === 'local' ? 'visitor' : 'local';
                    const defensiveLineup = (defensiveTeamSide === 'local' ? localLineup : visitorLineup).map(entry => ({
                        position: parseInt(entry.field_position) || 0,
                        name: entry.player_info ? `${entry.player_info.first_name} ${entry.player_info.last_name}` :
                            (teamPlayers?.local.find(p => p.id === entry.player)?.first_name ||
                                teamPlayers?.visitor.find(p => p.id === entry.player)?.first_name || '---')
                    })).filter(p => p.position > 0);

                    return (
                        <PlayModal
                            isOpen={isPlayModalOpen}
                            onClose={() => setIsPlayModalOpen(false)}
                            onSave={handlePlaySave}
                            gameContext={{
                                inning: selectedCell.inning,
                                half: selectedCell.teamSide === 'local' ? 'bottom' : 'top',
                                outs: game.outs,
                                batterName: selectedCell.batter_name,
                                runner1B: game.runner_on_1b ? { id: game.runner_on_1b, name: game.runner_on_1b_info ? `${game.runner_on_1b_info.first_name} ${game.runner_on_1b_info.last_name}` : 'Corredor 1B' } : null,
                                runner2B: game.runner_on_2b ? { id: game.runner_on_2b, name: game.runner_on_2b_info ? `${game.runner_on_2b_info.first_name} ${game.runner_on_2b_info.last_name}` : 'Corredor 2B' } : null,
                                runner3B: game.runner_on_3b ? { id: game.runner_on_3b, name: game.runner_on_3b_info ? `${game.runner_on_3b_info.first_name} ${game.runner_on_3b_info.last_name}` : 'Corredor 3B' } : null,
                                defensiveLineup: defensiveLineup,
                            }}
                        />
                    );
                })()}
                
                {/* Add Player Modal */}
                {isAddPlayerModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>{editingPlayerId ? 'Editar Jugador' : 'Registrar Nuevo Jugador'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre(s)</label>
                                    <Input 
                                        value={newPlayerData.first_name}
                                        onChange={(e) => setNewPlayerData({...newPlayerData, first_name: e.target.value})}
                                        placeholder="Ej: Juan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Apellido(s)</label>
                                    <Input 
                                        value={newPlayerData.last_name}
                                        onChange={(e) => setNewPlayerData({...newPlayerData, last_name: e.target.value})}
                                        placeholder="Ej: Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Número de Jersey (Opcional)</label>
                                    <Input 
                                        type="number"
                                        value={newPlayerData.jersey_number}
                                        onChange={(e) => setNewPlayerData({...newPlayerData, jersey_number: e.target.value})}
                                        placeholder="Ej: 10"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsAddPlayerModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleAddPlayer} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                        {loading ? 'Guardando...' : (editingPlayerId ? 'Actualizar' : 'Guardar Jugador')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
