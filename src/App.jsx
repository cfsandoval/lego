import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import LobbyModal from './components/LobbyModal';
import LegoBoard3D from './components/LegoBoard3D';
import {
  BRICK_CATALOG,
  LEGO_COLORS,
  CORE_PHASES,
  APPLICATION_LEVELS,
  WORKSHOP_TEMPLATES,
  CONNECTION_TYPES,
} from './data/lspMethodology';
import { exportWorkshopToJSON, exportWorkshopToPDF } from './utils/reportExporter';
import {
  Blocks,
  Play,
  Pause,
  RotateCcw,
  Users,
  Crown,
  BookOpen,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Star,
  Link2,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  LogOut,
  Send,
  Zap,
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    const saved = localStorage.getItem('lsp_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [roomState, setRoomState] = useState(null);
  const [selectedBrickType, setSelectedBrickType] = useState(BRICK_CATALOG[0].id);
  const [selectedColor, setSelectedColor] = useState(LEGO_COLORS[0].hex);
  const [selectedBrickId, setSelectedBrickId] = useState(null);
  const [activeTool, setActiveTool] = useState('place'); // 'place' | 'select' | 'connect'
  const [connectionType, setConnectionType] = useState(CONNECTION_TYPES[1]);
  const [rightTab, setRightTab] = useState('stories'); // 'stories' | 'metaphors' | 'reflect' | 'facilitator'
  const [emergentAlert, setEmergentAlert] = useState(null);

  // Story form states
  const [storyTitle, setStoryTitle] = useState('');
  const [storyNarrative, setStoryNarrative] = useState('');

  // Reflection / Simple Guiding Principle form states
  const [reflectionCategory, setReflectionCategory] = useState('Principio Rector Simple');
  const [reflectionText, setReflectionText] = useState('');

  // Custom question / Custom emergent event states
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [customEmergentTitle, setCustomEmergentTitle] = useState('');
  const [customEmergentDesc, setCustomEmergentDesc] = useState('');
  const [customEmergentQuestion, setCustomEmergentQuestion] = useState('');

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!sessionUser) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || '/';
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', {
        roomCode: sessionUser.roomCode,
        participantId: sessionUser.id,
        name: sessionUser.name,
        role: sessionUser.role,
        avatarColor: sessionUser.avatarColor,
        templateId: sessionUser.templateId,
      });
    });

    socket.on('room:state', (updatedRoom) => {
      setRoomState(updatedRoom);
    });

    socket.on('timer:tick', (timerObj) => {
      setRoomState((prev) => (prev ? { ...prev, timer: timerObj } : prev));
    });

    socket.on('emergent:alert', (alertObj) => {
      setEmergentAlert(alertObj);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionUser]);

  const handleJoinRoom = ({ name, roomCode, role, avatarColor, templateId }) => {
    const existingId =
      sessionUser?.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newUser = {
      id: existingId,
      name,
      roomCode,
      role,
      avatarColor,
      templateId,
    };
    localStorage.setItem('lsp_session_user', JSON.stringify(newUser));
    setSessionUser(newUser);
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.removeItem('lsp_session_user');
    setSessionUser(null);
    setRoomState(null);
  };

  if (!sessionUser) {
    return <LobbyModal onJoinRoom={handleJoinRoom} />;
  }

  const currentTemplate =
    WORKSHOP_TEMPLATES.find((t) => t.id === (roomState?.templateId || sessionUser.templateId)) ||
    WORKSHOP_TEMPLATES[0];

  const currentStageIndex = roomState?.currentStageIndex || 0;
  const currentStage =
    currentTemplate.stages[currentStageIndex] || currentTemplate.stages[0];

  const activeQuestion =
    roomState?.customQuestion?.trim() ? roomState.customQuestion : currentStage.question;

  const corePhase = roomState?.corePhase || 'challenge';
  const levelMode = roomState?.levelMode || currentStage.level || 'individual';
  const timer = roomState?.timer || { remainingSeconds: 240, totalSeconds: 240, isRunning: false };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const participantsList = Object.values(roomState?.participants || {});
  const myParticipant = roomState?.participants?.[sessionUser.id] || sessionUser;
  const isFacilitator = sessionUser.role === 'facilitator';

  // Socket Actions
  const updateWorkshopState = (payload) => {
    socketRef.current?.emit('workshop:updateState', payload);
  };

  const handleStageChange = (newIndex) => {
    if (newIndex < 0 || newIndex >= currentTemplate.stages.length) return;
    const stage = currentTemplate.stages[newIndex];
    updateWorkshopState({
      currentStageIndex: newIndex,
      levelMode: stage.level,
      corePhase: 'challenge',
      customQuestion: '',
    });
    socketRef.current?.emit('timer:control', {
      action: 'set',
      durationSeconds: stage.recommendedSeconds || 240,
    });
  };

  const handleSaveStory = (e) => {
    e.preventDefault();
    if (!storyNarrative.trim()) return;
    socketRef.current?.emit('story:save', {
      participantId: sessionUser.id,
      participantName: sessionUser.name,
      stageIndex: currentStageIndex,
      title: storyTitle.trim() || `Modelo de ${sessionUser.name}`,
      narrative: storyNarrative.trim(),
    });
    setStoryTitle('');
    setStoryNarrative('');
  };

  const handleAddReflection = (e) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    socketRef.current?.emit('reflection:add', {
      authorName: sessionUser.name,
      category: reflectionCategory,
      text: reflectionText.trim(),
    });
    setReflectionText('');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        socketRef.current?.emit('room:importState', parsed);
      } catch (err) {
        alert('Archivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const redBricksList = (roomState?.bricks || []).filter((b) => b.isRedBrick);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* TOP HEADER BAR: Room Info, 4 Core Process Stepper, Challenge Prompt & Timer */}
      <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Brand + Room Code */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-tight">
                LSP Studio 3D
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
                SALA: {roomState?.roomCode || sessionUser.roomCode}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                <Users className="w-3 h-3 text-sky-400" />
                {participantsList.filter((p) => p.online).length} en línea
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {currentTemplate.name}
            </p>
          </div>
        </div>

        {/* 4 Core Process Interactive Stepper */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {CORE_PHASES.map((phase) => {
            const active = corePhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => updateWorkshopState({ corePhase: phase.id })}
                title={phase.description}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{phase.number}.</span>
                <span>{phase.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Timer + Ready Button + Export */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold ${
              timer.remainingSeconds <= 30 && timer.isRunning
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-amber-400'
            }`}
          >
            <span>{formatTime(timer.remainingSeconds)}</span>
            <button
              onClick={() =>
                socketRef.current?.emit('timer:control', {
                  action: timer.isRunning ? 'pause' : 'start',
                })
              }
              className="p-1 rounded hover:bg-slate-800 text-slate-200"
              title={timer.isRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro'}
            >
              {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() =>
                socketRef.current?.emit('timer:control', {
                  action: 'reset',
                  durationSeconds: currentStage.recommendedSeconds || 240,
                })
              }
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Reiniciar cronómetro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() =>
              socketRef.current?.emit('participant:toggleReady', {
                participantId: sessionUser.id,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              myParticipant?.ready
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {myParticipant?.ready ? '¡Modelo Listo!' : 'Marcar Listo'}
          </button>

          <button
            onClick={() => roomState && exportWorkshopToPDF(roomState)}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
            title="Descargar Informe Metodológico en PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Informe PDF</span>
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
            title="Cambiar de sala o rol"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ACTIVE CHALLENGE BANNER (Stage Navigation + Core Question) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStageChange(currentStageIndex - 1)}
            disabled={currentStageIndex === 0}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            title="Etapa anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
            {APPLICATION_LEVELS.find((l) => l.id === levelMode)?.code || 'Nivel LSP'}
          </span>
          <span className="text-xs font-bold text-white">{currentStage.title}</span>
          <button
            onClick={() => handleStageChange(currentStageIndex + 1)}
            disabled={currentStageIndex >= currentTemplate.stages.length - 1}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            title="Siguiente etapa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-[260px] text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium leading-snug">
            <strong className="text-amber-300">Desafío actual: </strong>
            {activeQuestion}
          </span>
        </div>
      </div>

      {/* EMERGENT EVENT ("WHAT-IF" / CISNE NEGRO / TERREMOTO) ALERT BANNER */}
      {emergentAlert && (
        <div className="bg-rose-950/95 border-b border-rose-500 px-4 py-2.5 flex items-center justify-between gap-4 z-30 animate-fadeIn">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-extrabold text-rose-200 uppercase tracking-wider mr-2">
                ⚡ Evento Emergente (Prueba de Estrés Nivel 3): {emergentAlert.title}
              </span>
              <span className="text-rose-100">{emergentAlert.description}</span>
              <span className="block text-amber-300 font-semibold mt-0.5">
                Pregunta de adaptación: {emergentAlert.impactQuestion}
              </span>
            </div>
          </div>
          <button
            onClick={() => setEmergentAlert(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-800/80 hover:bg-rose-700 text-xs text-white shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE: Left Palette | Center 3D Board | Right Methodology & Collaboration Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: 3D Brick Catalog, LEGO Colors & Connection Types */}
        <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col overflow-y-auto p-3 space-y-4 z-10">
          {/* Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Color y Simbolismo
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {LEGO_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setSelectedColor(c.hex);
                    if (selectedBrickId) {
                      socketRef.current?.emit('brick:update', {
                        brickId: selectedBrickId,
                        updates: { color: c.hex },
                      });
                    }
                  }}
                  title={`${c.name}: ${c.meaning}`}
                  className={`h-8 rounded-lg border-2 transition ${
                    selectedColor === c.hex
                      ? 'border-white scale-105 shadow-md'
                      : 'border-slate-800 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
              <strong className="text-slate-200">
                {LEGO_COLORS.find((c) => c.hex === selectedColor)?.name}:
              </strong>{' '}
              {LEGO_COLORS.find((c) => c.hex === selectedColor)?.meaning}
            </p>
          </div>

          {/* 3D Brick Shapes Catalog */}
          <div className="flex-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              2. Catálogo de Piezas 3D LSP
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BRICK_CATALOG.map((item) => {
                const isSelected = selectedBrickType === item.id && activeTool === 'place';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedBrickType(item.id);
                      setActiveTool('place');
                    }}
                    title={item.metaphorHint}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-white shadow'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: selectedColor }}
                      />
                    </div>
                    <div className="text-xs font-bold mt-1.5 leading-snug">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {item.metaphorHint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 3 Connection Kit Selector */}
          <div className="pt-2 border-t border-slate-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              3. Conectores Sistémicos (Nivel 3)
            </span>
            <div className="space-y-1.5">
              {CONNECTION_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => {
                    setConnectionType(ct);
                    setActiveTool('connect');
                  }}
                  className={`w-full p-2 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
                    activeTool === 'connect' && connectionType.id === ct.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ct.color }}
                  />
                  <div>
                    <div className="font-bold">{ct.name}</div>
                    <div className="text-[10px] text-slate-400">{ct.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Clear my bricks action */}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={() =>
                socketRef.current?.emit('brick:clearMine', {
                  participantId: sessionUser.id,
                })
              }
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar Mis Piezas
            </button>
          </div>
        </aside>

        {/* CENTER 3D INTERACTIVE BOARD */}
        <main className="flex-1 relative">
          <LegoBoard3D
            bricks={roomState?.bricks || []}
            connections={roomState?.connections || []}
            selectedBrickType={selectedBrickType}
            selectedColor={selectedColor}
            selectedBrickId={selectedBrickId}
            onSelectBrick={setSelectedBrickId}
            onAddBrick={(brick) => socketRef.current?.emit('brick:add', brick)}
            onUpdateBrick={(brickId, updates) =>
              socketRef.current?.emit('brick:update', { brickId, updates })
            }
            onDeleteBrick={(brickId) =>
              socketRef.current?.emit('brick:delete', { brickId })
            }
            onAddConnection={(conn) => socketRef.current?.emit('connection:add', conn)}
            onDeleteConnection={(connectionId) =>
              socketRef.current?.emit('connection:delete', { connectionId })
            }
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            connectionType={connectionType}
            currentParticipant={sessionUser}
            levelMode={levelMode}
            spotlightParticipantId={roomState?.spotlightParticipantId}
          />
        </main>

        {/* RIGHT SIDEBAR: Stories, Red Bricks, Reflections & Facilitator Control Panel */}
        <aside className="w-80 sm:w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col z-10">
          {/* Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950 p-1 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setRightTab('stories')}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                rightTab === 'stories'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Historias</span>
            </button>

            <button
              onClick={() => setRightTab('metaphors')}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                rightTab === 'metaphors'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Ladrillo Rojo</span>
            </button>

            <button
              onClick={() => setRightTab('reflect')}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                rightTab === 'reflect'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Reflexión</span>
            </button>

            <button
              onClick={() => setRightTab('facilitator')}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                rightTab === 'facilitator'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Facilitador</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB 1: STORIES & PARTICIPANT SPOTLIGHT (Phase 3: Share) */}
            {rightTab === 'stories' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    Participantes en la Mesa (Spotlight 3D)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Haz clic en &ldquo;Enfocar&rdquo; para dirigir la cámara 3D al modelo de quien está compartiendo su historia.
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    {participantsList.map((p) => {
                      const isSpotlight = roomState?.spotlightParticipantId === p.id;
                      const brickCount = (roomState?.bricks || []).filter(
                        (b) => b.ownerId === p.id
                      ).length;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p.avatarColor || '#38bdf8' }}
                            />
                            <div>
                              <span className="font-semibold text-white">{p.name}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                ({brickCount} pzs)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {p.ready && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                Listo
                              </span>
                            )}
                            <button
                              onClick={() =>
                                updateWorkshopState({
                                  spotlightParticipantId: isSpotlight ? null : p.id,
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                                isSpotlight
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              {isSpotlight ? 'Enfocado' : 'Enfocar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Story documentation form */}
                <form
                  onSubmit={handleSaveStory}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Documentar la Historia de tu Modelo (Fase 3)
                  </h3>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Título de tu modelo (ej: Gobernanza Policéntrica 2050)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={storyNarrative}
                    onChange={(e) => setStoryNarrative(e.target.value)}
                    placeholder="Cuenta la historia de lo que construiste: ¿Qué representan las piezas, colores y conexiones?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publicar Historia en la Mesa
                  </button>
                </form>

                {/* Published Stories Feed */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Historias Compartidas ({(roomState?.stories || []).length})
                  </h4>
                  {(roomState?.stories || []).length === 0 ? (
                    <p className="text-slate-500 italic">
                      Aún no se han registrado historias en esta etapa.
                    </p>
                  ) : (
                    (roomState?.stories || []).map((st) => (
                      <div
                        key={st.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">{st.title}</span>
                          <span className="text-[10px] text-slate-400">
                            Etapa {(st.stageIndex || 0) + 1}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-400 font-semibold">
                          Por: {st.participantName}
                        </div>
                        <p className="text-slate-200 leading-relaxed mt-1">{st.narrative}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RED BRICKS ("LADRILLOS ROJOS") & SYSTEM CONNECTIONS */}
            {rightTab === 'metaphors' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    Ladrillos Rojos (Puente Nivel 1 → Nivel 2)
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    En LEGO Serious Play, para construir un <strong>Modelo Compartido</strong> sin
                    votar ni promediar, cada participante elige su pieza más esencial (&ldquo;Ladrillo
                    Rojo&rdquo;) para integrarla en el centro de la mesa.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Piezas Esenciales Marcadas ({redBricksList.length})
                  </h4>
                  {redBricksList.length === 0 ? (
                    <p className="text-slate-500 italic">
                      Haz clic sobre cualquier pieza 3D en el tablero y pulsa &ldquo;Marcar como
                      Ladrillo Rojo&rdquo; para destacarla con un anillo dorado.
                    </p>
                  ) : (
                    redBricksList.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBrickId(b.id)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 cursor-pointer hover:border-amber-400 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">
                            ★ {b.metaphorTitle || 'Pieza Esencial sin título'}
                          </span>
                          <span className="text-[10px] text-slate-400">{b.ownerName}</span>
                        </div>
                        {b.metaphorDesc && (
                          <p className="text-[11px] text-slate-300 mt-1">{b.metaphorDesc}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Connections List */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Vínculos Sistémicos Nivel 3 ({(roomState?.connections || []).length})
                  </h4>
                  {(roomState?.connections || []).length === 0 ? (
                    <p className="text-slate-500 italic">
                      Usa la herramienta &ldquo;Conectar Sistema&rdquo; arriba a la izquierda para
                      unir dos bloques con tubos 3D.
                    </p>
                  ) : (
                    (roomState?.connections || []).map((c) => {
                      const fromB = (roomState?.bricks || []).find((b) => b.id === c.fromBrickId);
                      const toB = (roomState?.bricks || []).find((b) => b.id === c.toBrickId);
                      return (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1.5"
                              style={{ backgroundColor: c.color }}
                            />
                            <strong className="text-white">{c.label}</strong>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {fromB?.metaphorTitle || 'Pieza A'} →{' '}
                              {toB?.metaphorTitle || 'Pieza B'}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              socketRef.current?.emit('connection:delete', {
                                connectionId: c.id,
                              })
                            }
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Eliminar conexión"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: REFLECTIONS & SIMPLE GUIDING PRINCIPLES (Phase 4) */}
            {rightTab === 'reflect' && (
              <div className="space-y-4">
                <form
                  onSubmit={handleAddReflection}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    Cristalizar Principio Rector Simple (Fase 4)
                  </h3>
                  <select
                    value={reflectionCategory}
                    onChange={(e) => setReflectionCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="Principio Rector Simple">
                      Principio Rector Simple (Simple Guiding Principle)
                    </option>
                    <option value="Patrón Común Identificado">Patrón Común Identificado</option>
                    <option value="Compromiso / Acción Inmediata">
                      Compromiso / Acción Inmediata
                    </option>
                    <option value="Vulnerabilidad / Punto Ciego">
                      Vulnerabilidad / Punto Ciego
                    </option>
                  </select>
                  <textarea
                    rows={3}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Ej: 'Ante cualquier crisis territorial, priorizaremos la red comunitaria local antes de centralizar decisiones'..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
                  >
                    Registrar Aprendizaje Colectivo
                  </button>
                </form>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Acuerdos y Principios Rectores ({(roomState?.reflections || []).length})
                  </h4>
                  {(roomState?.reflections || []).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
                          {r.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{r.authorName}</span>
                      </div>
                      <p className="text-slate-200 mt-1 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: FACILITATOR CONTROLS & EMERGENT "WHAT-IF" EVENTS */}
            {rightTab === 'facilitator' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    Guía del Facilitador en esta Etapa
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{currentStage.facilitatorTip}</p>
                </div>

                {/* Custom Challenge Prompt Override */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <label className="block font-bold text-white">
                    Personalizar Pregunta Desafío en Vivo
                  </label>
                  <textarea
                    rows={2}
                    value={customQuestionInput}
                    onChange={(e) => setCustomQuestionInput(e.target.value)}
                    placeholder="Escribe una pregunta personalizada para el grupo..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateWorkshopState({ customQuestion: customQuestionInput })
                      }
                      className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg"
                    >
                      Lanzar Pregunta
                    </button>
                    <button
                      onClick={() => {
                        setCustomQuestionInput('');
                        updateWorkshopState({ customQuestion: '' });
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      Restaurar
                    </button>
                  </div>
                </div>

                {/* Emergent Events ("What-If" / Terremoto / Cisnes Negros) */}
                <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2.5">
                  <h3 className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Simulador de Eventos Emergentes (Nivel 3)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dispara un escenario imprevisto en todas las pantallas para poner a prueba la
                    resiliencia del sistema construido:
                  </p>
                  <div className="space-y-1.5">
                    {(currentTemplate.emergentPresets || []).map((ev, i) => (
                      <button
                        key={i}
                        onClick={() => socketRef.current?.emit('emergent:trigger', ev)}
                        className="w-full p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-left transition"
                      >
                        <div className="font-bold text-rose-200">⚡ {ev.title}</div>
                        <div className="text-[10px] text-rose-300/80 mt-0.5">
                          {ev.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Emergent Event */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <input
                      type="text"
                      value={customEmergentTitle}
                      onChange={(e) => setCustomEmergentTitle(e.target.value)}
                      placeholder="Título de evento personalizado..."
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <input
                      type="text"
                      value={customEmergentQuestion}
                      onChange={(e) => setCustomEmergentQuestion(e.target.value)}
                      placeholder="Pregunta de impacto para el grupo..."
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <button
                      onClick={() => {
                        if (!customEmergentTitle.trim()) return;
                        socketRef.current?.emit('emergent:trigger', {
                          title: customEmergentTitle,
                          description:
                            customEmergentDesc ||
                            'Factor disruptivo introducido por el facilitador.',
                          impactQuestion:
                            customEmergentQuestion ||
                            '¿Cómo se adapta nuestro modelo ante este cambio?',
                        });
                        setCustomEmergentTitle('');
                        setCustomEmergentQuestion('');
                      }}
                      className="w-full py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg"
                    >
                      Disparar Evento Personalizado
                    </button>
                  </div>
                </div>

                {/* Backup JSON Export / Import */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h4 className="font-bold text-slate-300">Respaldo y Exportación</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => roomState && exportWorkshopToJSON(roomState)}
                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      Guardar JSON
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      Cargar JSON
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

