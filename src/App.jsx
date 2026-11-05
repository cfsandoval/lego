import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import LobbyModal from './components/LobbyModal';
import LegoBoard3D from './components/LegoBoard3D';
import { useLanguage } from './context/LanguageContext';
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
  Languages,
} from 'lucide-react';

export default function App() {
  const { language, setLanguage, t } = useLanguage();

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

  // Reflection form states
  const [reflectionCategory, setReflectionCategory] = useState(
    language === 'en' ? 'Simple Guiding Principle' : 'Principio Rector Simple'
  );
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

  const stageQuestion =
    language === 'en' && currentStage.questionEn ? currentStage.questionEn : currentStage.question;

  const activeQuestion =
    roomState?.customQuestion?.trim() ? roomState.customQuestion : stageQuestion;

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
      title: storyTitle.trim() || `${language === 'en' ? "Model by" : "Modelo de"} ${sessionUser.name}`,
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
        alert(language === 'en' ? 'Invalid JSON file.' : 'Archivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const redBricksList = (roomState?.bricks || []).filter((b) => b.isRedBrick);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* TOP HEADER BAR */}
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
                {t('roomLabel')}: {roomState?.roomCode || sessionUser.roomCode}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                <Users className="w-3 h-3 text-sky-400" />
                {participantsList.filter((p) => p.online).length} {language === 'en' ? 'online' : 'en línea'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {language === 'en' && currentTemplate.nameEn ? currentTemplate.nameEn : currentTemplate.name}
            </p>
          </div>
        </div>

        {/* 4 Core Process Interactive Stepper */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {CORE_PHASES.map((phase) => {
            const active = corePhase === phase.id;
            const pTitle = language === 'en' && phase.shortTitleEn ? phase.shortTitleEn : phase.shortTitle;
            const pDesc = language === 'en' && phase.descriptionEn ? phase.descriptionEn : phase.description;
            return (
              <button
                key={phase.id}
                onClick={() => updateWorkshopState({ corePhase: phase.id })}
                title={pDesc}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{phase.number}.</span>
                <span>{pTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Timer + Language Switcher + Ready Button + Export */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Button */}
          <div className="flex items-center bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl gap-1">
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition ${
                language === 'en' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-slate-700 text-xs">|</span>
            <button
              onClick={() => setLanguage('es')}
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition ${
                language === 'es' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              ES
            </button>
          </div>

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
              title={timer.isRunning ? t('timerPaused') : t('timerRunning')}
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
              title={t('resetTimer')}
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
            {myParticipant?.ready ? (language === 'en' ? 'Model Ready!' : '¡Modelo Listo!') : (language === 'en' ? 'Mark Ready' : 'Marcar Listo')}
          </button>

          <button
            onClick={() => roomState && exportWorkshopToPDF(roomState, language)}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
            title={t('exportPdf')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('exportPdf')}</span>
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
            title={t('leaveSession')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ACTIVE CHALLENGE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStageChange(currentStageIndex - 1)}
            disabled={currentStageIndex === 0}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            title="Previous stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
            {language === 'en'
              ? (APPLICATION_LEVELS.find((l) => l.id === levelMode)?.codeEn || 'LSP Level')
              : (APPLICATION_LEVELS.find((l) => l.id === levelMode)?.code || 'Nivel LSP')}
          </span>
          <span className="text-xs font-bold text-white">
            {language === 'en' && currentStage.titleEn ? currentStage.titleEn : currentStage.title}
          </span>
          <button
            onClick={() => handleStageChange(currentStageIndex + 1)}
            disabled={currentStageIndex >= currentTemplate.stages.length - 1}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            title="Next stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-[260px] text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium leading-snug">
            <strong className="text-amber-300">
              {language === 'en' ? 'Active Challenge:' : 'Desafío actual:'}{' '}
            </strong>
            {activeQuestion}
          </span>
        </div>
      </div>

      {/* EMERGENT EVENT ALERT BANNER */}
      {emergentAlert && (
        <div className="bg-rose-950/95 border-b border-rose-500 px-4 py-2.5 flex items-center justify-between gap-4 z-30 animate-fadeIn">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-extrabold text-rose-200 uppercase tracking-wider mr-2">
                ⚡ {t('emergentBannerTitle')}: {language === 'en' && emergentAlert.titleEn ? emergentAlert.titleEn : emergentAlert.title}
              </span>
              <span className="text-rose-100">
                {language === 'en' && emergentAlert.descriptionEn ? emergentAlert.descriptionEn : emergentAlert.description}
              </span>
              <span className="block text-amber-300 font-semibold mt-0.5">
                {language === 'en' ? 'Adaptation Question:' : 'Pregunta de adaptación:'}{' '}
                {language === 'en' && emergentAlert.impactQuestionEn ? emergentAlert.impactQuestionEn : emergentAlert.impactQuestion}
              </span>
            </div>
          </div>
          <button
            onClick={() => setEmergentAlert(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-800/80 hover:bg-rose-700 text-xs text-white shrink-0"
          >
            {t('dismissAlert')}
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col overflow-y-auto p-3 space-y-4 z-10">
          {/* Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. {t('brickPaletteTitle')}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {LEGO_COLORS.map((c) => {
                const cName = language === 'en' && c.nameEn ? c.nameEn : c.name;
                const cMeaning = language === 'en' && c.meaningEn ? c.meaningEn : c.meaning;
                return (
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
                    title={`${cName}: ${cMeaning}`}
                    className={`h-8 rounded-lg border-2 transition ${
                      selectedColor === c.hex
                        ? 'border-white scale-105 shadow-md'
                        : 'border-slate-800 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
              <strong className="text-slate-200">
                {language === 'en'
                  ? LEGO_COLORS.find((c) => c.hex === selectedColor)?.nameEn
                  : LEGO_COLORS.find((c) => c.hex === selectedColor)?.name}:
              </strong>{' '}
              {language === 'en'
                ? LEGO_COLORS.find((c) => c.hex === selectedColor)?.meaningEn
                : LEGO_COLORS.find((c) => c.hex === selectedColor)?.meaning}
            </p>
          </div>

          {/* 3D Brick Shapes Catalog */}
          <div className="flex-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              2. {t('brickCatalogTitle')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BRICK_CATALOG.map((item) => {
                const isSelected = selectedBrickType === item.id && activeTool === 'place';
                const iName = language === 'en' && item.nameEn ? item.nameEn : item.name;
                const iCategory = language === 'en' && item.categoryEn ? item.categoryEn : item.category;
                const iHint = language === 'en' && item.metaphorHintEn ? item.metaphorHintEn : item.metaphorHint;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedBrickType(item.id);
                      setActiveTool('place');
                    }}
                    title={iHint}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-white shadow'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {iCategory}
                      </span>
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: selectedColor }}
                      />
                    </div>
                    <div className="text-xs font-bold mt-1.5 leading-snug">{iName}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {iHint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 3 Connection Kit Selector */}
          <div className="pt-2 border-t border-slate-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              3. {language === 'en' ? 'Systemic Links (Level 3)' : 'Conectores Sistémicos (Nivel 3)'}
            </span>
            <div className="space-y-1.5">
              {CONNECTION_TYPES.map((ct) => {
                const ctName = language === 'en' && ct.nameEn ? ct.nameEn : ct.name;
                const ctDesc = language === 'en' && ct.descriptionEn ? ct.descriptionEn : ct.description;
                return (
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
                      <div className="font-bold">{ctName}</div>
                      <div className="text-[10px] text-slate-400">{ctDesc}</div>
                    </div>
                  </button>
                );
              })}
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
              {language === 'en' ? 'Clear My Bricks' : 'Limpiar Mis Piezas'}
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
            onAddBrick={(brick) => {
              // Optimistic local update so brick immediately shows even before socket round-trip
              setRoomState((prev) =>
                prev ? { ...prev, bricks: [...(prev.bricks || []), brick] } : prev
              );
              socketRef.current?.emit('brick:add', brick);
            }}
            onUpdateBrick={(brickId, updates) => {
              setRoomState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  bricks: (prev.bricks || []).map((b) =>
                    b.id === brickId ? { ...b, ...updates } : b
                  ),
                };
              });
              socketRef.current?.emit('brick:update', { brickId, updates });
            }}
            onDeleteBrick={(brickId) => {
              setRoomState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  bricks: (prev.bricks || []).filter((b) => b.id !== brickId),
                  connections: (prev.connections || []).filter(
                    (c) => c.fromBrickId !== brickId && c.toBrickId !== brickId
                  ),
                };
              });
              socketRef.current?.emit('brick:delete', { brickId });
            }}
            onAddConnection={(conn) => {
              setRoomState((prev) =>
                prev ? { ...prev, connections: [...(prev.connections || []), conn] } : prev
              );
              socketRef.current?.emit('connection:add', conn);
            }}
            onDeleteConnection={(connectionId) => {
              setRoomState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  connections: (prev.connections || []).filter((c) => c.id !== connectionId),
                };
              });
              socketRef.current?.emit('connection:delete', { connectionId });
            }}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            connectionType={connectionType}
            currentParticipant={sessionUser}
            levelMode={levelMode}
            spotlightParticipantId={roomState?.spotlightParticipantId}
          />
        </main>

        {/* RIGHT SIDEBAR */}
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
              <span>{language === 'en' ? 'Stories' : 'Historias'}</span>
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
              <span>{language === 'en' ? 'Red Brick' : 'Ladrillo Rojo'}</span>
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
              <span>{language === 'en' ? 'Reflect' : 'Reflexión'}</span>
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
              <span>{language === 'en' ? 'Facilitator' : 'Facilitador'}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB 1: STORIES & PARTICIPANT SPOTLIGHT */}
            {rightTab === 'stories' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    {language === 'en' ? 'Participants at the Table (Spotlight 3D)' : 'Participantes en la Mesa (Spotlight 3D)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Click "Spotlight" to focus the 3D camera on the model being shared.'
                      : 'Haz clic en "Enfocar" para dirigir la cámara 3D al modelo de quien está compartiendo su historia.'}
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
                                ({brickCount} {language === 'en' ? 'bricks' : 'pzs'})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {p.ready && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                {language === 'en' ? 'Ready' : 'Listo'}
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
                              {isSpotlight
                                ? (language === 'en' ? 'Spotlighted' : 'Enfocado')
                                : (language === 'en' ? 'Spotlight' : 'Enfocar')}
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
                    {t('storiesTitle')}
                  </h3>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder={t('myStoryTitlePlaceholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={storyNarrative}
                    onChange={(e) => setStoryNarrative(e.target.value)}
                    placeholder={t('myStoryNarrativePlaceholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('submitStoryBtn')}
                  </button>
                </form>

                {/* Published Stories Feed */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    {language === 'en' ? 'Shared Narratives' : 'Historias Compartidas'} ({(roomState?.stories || []).length})
                  </h4>
                  {(roomState?.stories || []).length === 0 ? (
                    <p className="text-slate-500 italic">
                      {t('noStoriesYet')}
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
                            {t('stageLabel')} {(st.stageIndex || 0) + 1}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-400 font-semibold">
                          {language === 'en' ? 'By' : 'Por'}: {st.participantName}
                        </div>
                        <p className="text-slate-200 leading-relaxed mt-1">{st.narrative}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RED BRICKS & SYSTEM CONNECTIONS */}
            {rightTab === 'metaphors' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {language === 'en' ? 'Red Bricks (Level 1 → Level 2 Transition)' : 'Ladrillos Rojos (Puente Nivel 1 → Nivel 2)'}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'In LEGO Serious Play, to co-create a Shared Model without voting or compromising, each participant selects their essential "Red Brick" to incorporate into the central co-constructed landscape.'
                      : 'En LEGO Serious Play, para construir un Modelo Compartido sin votar ni promediar, cada participante elige su pieza más esencial ("Ladrillo Rojo") para integrarla en el centro de la mesa.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    {language === 'en' ? 'Designated Red Bricks' : 'Piezas Esenciales Marcadas'} ({redBricksList.length})
                  </h4>
                  {redBricksList.length === 0 ? (
                    <p className="text-slate-500 italic">
                      {language === 'en'
                        ? 'Click on any brick on the 3D table and select "Designate as Core Red Brick" to highlight it with a golden ring.'
                        : 'Haz clic sobre cualquier pieza 3D en el tablero y pulsa "Marcar como Ladrillo Rojo" para destacarla con un anillo dorado.'}
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
                            ★ {b.metaphorTitle || (language === 'en' ? 'Untitled Core Brick' : 'Pieza Esencial sin título')}
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
                    {language === 'en' ? 'Systemic Links (Level 3)' : 'Vínculos Sistémicos Nivel 3'} ({(roomState?.connections || []).length})
                  </h4>
                  {(roomState?.connections || []).length === 0 ? (
                    <p className="text-slate-500 italic">
                      {language === 'en'
                        ? 'Use the "Connect" tool in the top bar to draw 3D systemic relationship tubes between elements.'
                        : 'Usa la herramienta "Conectar" arriba a la izquierda para unir dos bloques con tubos 3D.'}
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
                              {fromB?.metaphorTitle || (language === 'en' ? 'Brick A' : 'Pieza A')} →{' '}
                              {toB?.metaphorTitle || (language === 'en' ? 'Brick B' : 'Pieza B')}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              socketRef.current?.emit('connection:delete', {
                                connectionId: c.id,
                              })
                            }
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete link"
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

            {/* TAB 3: REFLECTIONS & SIMPLE GUIDING PRINCIPLES */}
            {rightTab === 'reflect' && (
              <div className="space-y-4">
                <form
                  onSubmit={handleAddReflection}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    {t('reflectionsTitle')}
                  </h3>
                  <select
                    value={reflectionCategory}
                    onChange={(e) => setReflectionCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value={t('categoryGuidingPrinciple')}>
                      {t('categoryGuidingPrinciple')}
                    </option>
                    <option value={t('categoryInsight')}>
                      {t('categoryInsight')}
                    </option>
                    <option value={t('categoryCommitment')}>
                      {t('categoryCommitment')}
                    </option>
                  </select>
                  <textarea
                    rows={3}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder={t('reflectionTextPlaceholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
                  >
                    {t('addReflectionBtn')}
                  </button>
                </form>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    {language === 'en' ? 'Formulated Principles' : 'Acuerdos y Principios Rectores'} ({(roomState?.reflections || []).length})
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

            {/* TAB 4: FACILITATOR CONTROLS */}
            {rightTab === 'facilitator' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    {language === 'en' ? 'Facilitator Guide for this Stage' : 'Guía del Facilitador en esta Etapa'}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {language === 'en' && currentStage.facilitatorTipEn
                      ? currentStage.facilitatorTipEn
                      : currentStage.facilitatorTip}
                  </p>
                </div>

                {/* Custom Challenge Prompt Override */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <label className="block font-bold text-white">
                    {t('customQuestionLabel')}
                  </label>
                  <textarea
                    rows={2}
                    value={customQuestionInput}
                    onChange={(e) => setCustomQuestionInput(e.target.value)}
                    placeholder={t('customQuestionPlaceholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateWorkshopState({ customQuestion: customQuestionInput })
                      }
                      className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg"
                    >
                      {t('updateQuestionBtn')}
                    </button>
                    <button
                      onClick={() => {
                        setCustomQuestionInput('');
                        updateWorkshopState({ customQuestion: '' });
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      {language === 'en' ? 'Reset' : 'Restaurar'}
                    </button>
                  </div>
                </div>

                {/* Emergent Events */}
                <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2.5">
                  <h3 className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    {t('triggerEmergentTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('triggerEmergentDesc')}
                  </p>
                  <div className="space-y-1.5">
                    {(currentTemplate.emergentPresets || []).map((ev, i) => (
                      <button
                        key={i}
                        onClick={() => socketRef.current?.emit('emergent:trigger', ev)}
                        className="w-full p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-left transition"
                      >
                        <div className="font-bold text-rose-200">
                          ⚡ {language === 'en' && ev.titleEn ? ev.titleEn : ev.title}
                        </div>
                        <div className="text-[10px] text-rose-300/80 mt-0.5">
                          {language === 'en' && ev.descriptionEn ? ev.descriptionEn : ev.description}
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
                      placeholder={language === 'en' ? 'Custom event title...' : 'Título de evento personalizado...'}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <input
                      type="text"
                      value={customEmergentQuestion}
                      onChange={(e) => setCustomEmergentQuestion(e.target.value)}
                      placeholder={language === 'en' ? 'Impact question for the group...' : 'Pregunta de impacto para el grupo...'}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                    <button
                      onClick={() => {
                        if (!customEmergentTitle.trim()) return;
                        socketRef.current?.emit('emergent:trigger', {
                          title: customEmergentTitle,
                          titleEn: customEmergentTitle,
                          description:
                            customEmergentDesc ||
                            (language === 'en' ? 'Disruptive factor introduced by facilitator.' : 'Factor disruptivo introducido por el facilitador.'),
                          descriptionEn: customEmergentDesc || 'Disruptive factor introduced by facilitator.',
                          impactQuestion:
                            customEmergentQuestion ||
                            (language === 'en' ? 'How does our model adapt to this sudden change?' : '¿Cómo se adapta nuestro modelo ante este cambio?'),
                          impactQuestionEn: customEmergentQuestion || 'How does our model adapt to this sudden change?',
                        });
                        setCustomEmergentTitle('');
                        setCustomEmergentQuestion('');
                      }}
                      className="w-full py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg"
                    >
                      {language === 'en' ? 'Trigger Custom Shock' : 'Disparar Evento Personalizado'}
                    </button>
                  </div>
                </div>

                {/* Backup JSON Export / Import */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h4 className="font-bold text-slate-300">
                    {language === 'en' ? 'Backup & Import' : 'Respaldo y Exportación'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => roomState && exportWorkshopToJSON(roomState)}
                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      {t('exportJson')}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      {t('importJson')}
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
