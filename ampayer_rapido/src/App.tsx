import React, { useState, useRef } from 'react';
import { 
  Calendar, MapPin, Users, ShieldAlert, CheckCircle2, 
  User, UserCheck, Smartphone, FileSpreadsheet, Image as ImageIcon,
  Upload, Loader2, Trash2, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import './index.css';

type Game = {
  id: string;
  date: string;
  time: string;
  teamA: string;
  teamB: string;
  field: string;
  category?: string;
  umpireMain?: string;
  umpireBases?: string;
  scorer?: string;
};

const UMPIRES = ["Juan Perez", "Carlos Lopez", "Mario Garcia", "Pedro Sanchez", "Luis Hernandez"];
const SCORERS = ["Ana Martinez", "Maria Rodriguez", "Laura Torres"];

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugText, setDebugText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const processRawText = (text: string) => {
    setDebugText(text); // For troubleshooting
    const newGames: Game[] = [];
    
    // Normalize text
    let cleanText = text
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/p\.m\./gi, 'PM')
      .replace(/a\.m\./gi, 'AM');

    const lines = cleanText.split('\n').filter(l => l.trim().length > 5);
    
    let currentDate = "Hoy";
    // Try to find a date in the header
    const dateMatch = cleanText.match(/(Lunes|Martes|Miercoles|Jueves|Viernes|Sabado|Domingo)\s+\d{1,2}\s+de\s+(.+)\s+del\s+\d{4}/i);
    if (dateMatch) currentDate = dateMatch[0];

    lines.forEach((line, index) => {
      // PATTERN 1: TEAM VS TEAM (with optional time/field)
      // Example: "Yankees vs Dodgers, 07:00 PM, Campo 1"
      const vsMatch = line.match(/(.+)\s+vs\s+(.+)/i);
      if (vsMatch) {
        const teamA = vsMatch[1].trim();
        const rest = vsMatch[2].trim();
        
        // Further split rest if it has commas (time, field)
        const parts = rest.split(/[,|]/);
        const teamB = parts[0].trim();
        const timeField = parts.slice(1).join(' ');
        
        newGames.push({
          id: Date.now().toString() + index + Math.random(),
          date: currentDate,
          time: timeField.match(/\d{1,2}:\d{2}\s?(PM|AM)/i)?.[0] || "Por definir",
          teamA: teamA.toUpperCase().replace(/^[^a-zA-Z]+/, ''),
          teamB: teamB.toUpperCase(),
          field: timeField.replace(/\d{1,2}:\d{2}\s?(PM|AM)/i, '').trim() || "Campo #1",
          umpireMain: "",
          scorer: ""
        });
        return;
      }

      // PATTERN 2: TEAM [TIME] TEAM (Common in poster layouts)
      // Example: "LA REZAGA SOFTBOL 07:00 PM YANKEES LM"
      const timeMatch = line.match(/(.+?)\s+(\d{1,2}:\d{2}\s?(?:PM|AM))\s+(.+)/i);
      if (timeMatch) {
        const before = timeMatch[1].trim();
        const time = timeMatch[2].trim();
        const after = timeMatch[3].trim();
        
        // Strategy: Team A is usually at the start, Team B is usually at the end. 
        // Location might be in the middle with the time.
        const teamA = before.split(/polideportivo|unidad|campo/i)[0].trim();
        const field = before.replace(teamA, '').trim() || "Campo #1";
        const teamB = after.split(/LMSA|Jornada/i)[0].trim();

        newGames.push({
          id: Date.now().toString() + index + Math.random(),
          date: currentDate,
          time: time,
          teamA: teamA.toUpperCase().replace(/^[^a-zA-Z]+/, ''),
          teamB: teamB.toUpperCase(),
          field: field || "Por definir",
          umpireMain: "",
          scorer: ""
        });
      }
    });

    if (newGames.length > 0) {
      setGames(prev => [...prev, ...newGames]);
      setPasteText("");
      setDebugText("");
    } else {
      // If no games found, maybe it's a multi-line format
      alert("No detecté juegos. Intenta copiar el texto de forma más clara o revisa el formato.");
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_txt(ws);
      processRawText(data);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'spa');
      processRawText(text);
    } catch (err) {
      console.error(err);
      alert("Error procesando imagen");
    }
    setLoading(false);
  };

  const shareToWhatsApp = () => {
    if (games.length === 0) return;
    let text = "*ROL DE JUEGOS Y ASIGNACIONES*\n\n";
    games.forEach(g => {
      text += `⚾ *${g.teamA} vs ${g.teamB}*\n`;
      text += `📅 ${g.date} ⏰ ${g.time} 🏟️ ${g.field}\n`;
      text += `👨‍⚖️ Home: ${g.umpireMain || '❌ PENDIENTE'}\n`;
      text += `👨‍⚖️ Bases: ${g.umpireBases || 'Opcional'}\n`;
      text += `📝 Anotador: ${g.scorer || '❌ PENDIENTE'}\n\n`;
    });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1><ShieldAlert className="text-primary" /> Ampayer Fast-Schedule</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          <button onClick={() => setGames([])} className="btn btn-sm" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5'}}>
            <Trash2 size={16} /> Limpiar
          </button>
          <button onClick={shareToWhatsApp} className="btn btn-accent btn-sm">
            <Smartphone size={18} /> WhatsApp
          </button>
        </div>
      </header>

      <aside>
        <div className="glass-card">
          <h2 className="card-title"><Upload size={20} /> Captura Inteligente</h2>
          <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '1rem'}}>
            He mejorado el motor para detectar formatos de póster y tablas.
          </p>
          
          <textarea 
            className="smart-paste-area" 
            placeholder="Pega texto de WhatsApp aquí..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          ></textarea>
          
          <button onClick={() => processRawText(pasteText)} className="btn btn-primary" disabled={loading || !pasteText}>
            {loading ? <Loader2 className="animate-spin" /> : "Procesar"}
          </button>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1rem'}}>
            <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} style={{display: 'none'}} onChange={handleExcelUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)'}}>
              <FileSpreadsheet size={16} /> Excel
            </button>

            <input type="file" accept="image/*" ref={imageInputRef} style={{display: 'none'}} onChange={handleImageUpload} />
            <button onClick={() => imageInputRef.current?.click()} className="btn btn-sm" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)'}}>
              <ImageIcon size={16} /> Foto / Póster
            </button>
          </div>

          {loading && (
            <div style={{marginTop: '1.5rem', textAlign: 'center', color: '#60a5fa'}}>
              <Loader2 className="animate-spin" style={{margin: '0 auto 0.5rem'}} />
              <p style={{fontSize: '0.85rem', fontWeight: 600}}>IA ANALIZANDO IMAGEN...</p>
              <p style={{fontSize: '0.7rem', opacity: 0.7}}>Esto puede tardar 10-15 segundos</p>
            </div>
          )}

          {debugText && !loading && (
            <div style={{marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'}}>
              <p style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}><Info size={10} /> Texto extraído (Debug):</p>
              <div style={{fontSize: '0.6rem', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', opacity: 0.5}}>
                {debugText}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main>
        <div className="games-grid">
          {games.length === 0 ? (
            <div className="empty-state">
              <Upload size={48} style={{margin: '0 auto 1rem', opacity: 0.3}} />
              <h3>Listo para programar</h3>
              <p>Sube una foto del rol o pega el texto.</p>
              <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                 <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>✓ Soporta Pósters</div>
                 <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>✓ Soporta Tablas</div>
                 <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>✓ Soporta WhatsApp</div>
              </div>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className={`game-card ${(!game.umpireMain || !game.scorer) ? 'missing-umpire' : ''}`}>
                <div className="game-header">
                  <div className="game-date">
                    <Calendar size={14} /> {game.date} <span style={{color: '#f59e0b', fontWeight: 700}}>{game.time}</span>
                  </div>
                  <button onClick={() => setGames(games.filter(g => g.id !== game.id))} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}>
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="game-teams">
                  <div style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{game.teamA}</div>
                  <span className="team-vs">VS</span>
                  <div style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{game.teamB}</div>
                </div>

                <div className="game-assignments">
                  <div className="assignment-row">
                    <MapPin size={16} className="assignment-icon" />
                    <input 
                      className="assignment-select" 
                      value={game.field} 
                      onChange={(e) => setGames(games.map(g => g.id === game.id ? {...g, field: e.target.value} : g))}
                      placeholder="Campo"
                    />
                  </div>
                  
                  <div className="assignment-row">
                    <User size={16} className="assignment-icon" />
                    <select 
                      className={`assignment-select ${!game.umpireMain ? 'unassigned' : ''}`}
                      value={game.umpireMain || ""}
                      onChange={(e) => setGames(games.map(g => g.id === game.id ? {...g, umpireMain: e.target.value} : g))}
                    >
                      <option value="">Ampayer Home (FALTA)</option>
                      {UMPIRES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div className="assignment-row">
                    <Users size={16} className="assignment-icon" />
                    <select 
                      className={`assignment-select ${!game.scorer ? 'unassigned' : ''}`}
                      value={game.scorer || ""}
                      onChange={(e) => setGames(games.map(g => g.id === game.id ? {...g, scorer: e.target.value} : g))}
                    >
                      <option value="">Anotador (FALTA)</option>
                      {SCORERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <span className={`status-badge ${(!game.umpireMain || !game.scorer) ? 'status-incomplete' : 'status-complete'}`}>
                     {(!game.umpireMain || !game.scorer) ? 'Pendiente' : 'Listo'}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
