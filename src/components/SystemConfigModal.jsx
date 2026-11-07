import React, { useState, useRef } from 'react';
import {
  DEFAULT_WORKSHOP_TEMPLATES,
  APPLICATION_LEVELS,
} from '../data/lspMethodology';
import {
  getEffectiveFirebaseConfig,
  saveCustomFirebaseConfig,
  isFirebaseConfigured,
} from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import {
  Settings,
  X,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Save,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  Layers,
  Zap,
  Globe,
  CheckCircle2,
  FileText,
  Database,
  ShieldCheck,
} from 'lucide-react';

export default function SystemConfigModal({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  onResetTemplates,
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [draftTemplates, setDraftTemplates] = useState(() =>
    JSON.parse(JSON.stringify(templates && templates.length ? templates : DEFAULT_WORKSHOP_TEMPLATES))
  );
  const [selectedId, setSelectedId] = useState(
    () => (templates && templates[0]?.id) || DEFAULT_WORKSHOP_TEMPLATES[0].id
  );
  const [activeSection, setActiveSection] = useState('general'); // 'general' | 'stages' | 'emergent' | 'firebase'
  const [savedNotice, setSavedNotice] = useState(false);
  const [fbConfig, setFbConfig] = useState(() => getEffectiveFirebaseConfig());
  const [rawSnippet, setRawSnippet] = useState('');
  const [fbSavedNotice, setFbSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleParseFirebaseSnippet = (text) => {
    setRawSnippet(text);
    const extractField = (key) => {
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
      const match = text.match(regex);
      return match ? match[1] : null;
    };
    const nextCfg = { ...fbConfig };
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach((k) => {
      const val = extractField(k);
      if (val) nextCfg[k] = val;
    });
    setFbConfig(nextCfg);
  };

  const handleSaveFirebaseSettings = () => {
    saveCustomFirebaseConfig(fbConfig);
    setFbSavedNotice(true);
    setTimeout(() => {
      setFbSavedNotice(false);
    }, 2500);
  };

  const currentTplIndex = draftTemplates.findIndex((t) => t.id === selectedId);
  const currentTpl =
    currentTplIndex !== -1 ? draftTemplates[currentTplIndex] : draftTemplates[0];

  const updateCurrentTemplate = (updater) => {
    setDraftTemplates((prev) =>
      prev.map((tpl) => {
        if (tpl.id !== currentTpl.id) return tpl;
        return typeof updater === 'function' ? updater(tpl) : { ...tpl, ...updater };
      })
    );
  };

  const handleAddTemplate = () => {
    const newId = `custom-tpl-${Date.now().toString().slice(-5)}`;
    const newTpl = {
      id: newId,
      name: 'Nueva Plantilla de Taller LSP',
      nameEn: 'New LSP Workshop Template',
      badge: 'Personalizado',
      badgeEn: 'Custom',
      summary: 'Descripción en español del propósito y alcance metodológico del taller.',
      summaryEn: 'English summary of the workshop purpose and methodological scope.',
      stages: [
        {
          level: 'skills',
          title: 'Etapa 0: Calentamiento — Construcción de Habilidades',
          titleEn: 'Stage 0: Warm-up — Skills Building',
          question: 'Construye un modelo con 5 piezas que represente tu expectativa para esta sesión.',
          questionEn: 'Build a 5-brick model representing your expectation for this session.',
          recommendedSeconds: 180,
          facilitatorTip: 'Recuerda que cada participante comparte el significado de su modelo.',
          facilitatorTipEn: 'Remind everyone that each builder shares the meaning of their model.',
        },
        {
          level: 'individual',
          title: 'Etapa 1: Modelo Individual',
          titleEn: 'Stage 1: Individual Model',
          question: 'Construye tu perspectiva individual frente al desafío central e identifica tu Ladrillo Rojo.',
          questionEn: 'Build your individual perspective on the core challenge and mark your Red Brick.',
          recommendedSeconds: 300,
          facilitatorTip: 'El foco está en el modelo físico 3D, no en la persona.',
          facilitatorTipEn: 'Focus remains on the 3D model, never on the person.',
        },
        {
          level: 'shared',
          title: 'Etapa 2: Modelo Compartido',
          titleEn: 'Stage 2: Shared Model',
          question: 'Integren en el centro de la mesa los Ladrillos Rojos de todos en un modelo compartido consensuado.',
          questionEn: 'Co-build in the center a shared model integrating everyone\'s Red Bricks.',
          recommendedSeconds: 360,
          facilitatorTip: 'Evitar votaciones; todos deben verse representados en el modelo común.',
          facilitatorTipEn: 'Avoid voting; every participant must see their core meaning represented.',
        },
        {
          level: 'landscape',
          title: 'Etapa 3: Paisaje, Conexiones y Principios Rectores',
          titleEn: 'Stage 3: Landscape, Connections & Guiding Principles',
          question: 'Conecta los modelos en el paisaje, simula un choque emergente y formula 3 Principios Rectores Simples.',
          questionEn: 'Connect models across the landscape, test an emergent event, and formulate 3 Simple Guiding Principles.',
          recommendedSeconds: 360,
          facilitatorTip: 'Documenta las conclusiones para el informe PDF final.',
          facilitatorTipEn: 'Document key insights for the final PDF report.',
        },
      ],
      emergentPresets: [
        {
          title: 'Evento Disruptivo de Prueba',
          titleEn: 'Sample Disruptive Shock',
          description: 'Un cambio repentino en el entorno pone a prueba la adaptabilidad del sistema construido.',
          descriptionEn: 'A sudden environmental shift tests the adaptability of the constructed system.',
          impactQuestion: '¿Qué pieza o conexión del modelo absorbe el impacto y cuál debe transformarse?',
          impactQuestionEn: 'Which brick or connection absorbs the shock, and which must transform?',
        },
      ],
    };
    setDraftTemplates((prev) => [...prev, newTpl]);
    setSelectedId(newId);
    setActiveSection('general');
  };

  const handleDuplicateTemplate = () => {
    if (!currentTpl) return;
    const copyId = `${currentTpl.id}-copy-${Date.now().toString().slice(-4)}`;
    const copyTpl = JSON.parse(JSON.stringify(currentTpl));
    copyTpl.id = copyId;
    copyTpl.name = `${currentTpl.name} (Copia)`;
    copyTpl.nameEn = `${currentTpl.nameEn || currentTpl.name} (Copy)`;
    setDraftTemplates((prev) => [...prev, copyTpl]);
    setSelectedId(copyId);
  };

  const handleDeleteTemplate = () => {
    if (draftTemplates.length <= 1) {
      alert(
        isEn
          ? 'At least one workshop template must remain in the system.'
          : 'Debe existir al menos una plantilla en el sistema.'
      );
      return;
    }
    const confirmMsg = isEn
      ? `Delete template "${currentTpl.nameEn || currentTpl.name}"?`
      : `¿Eliminar la plantilla "${currentTpl.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    const remaining = draftTemplates.filter((t) => t.id !== currentTpl.id);
    setDraftTemplates(remaining);
    setSelectedId(remaining[0].id);
  };

  const handleResetAllDefaults = () => {
    const confirmMsg = isEn
      ? 'Restore all default templates? Custom changes will be replaced by factory defaults.'
      : '¿Restaurar todas las plantillas originales de fábrica? Se reemplazarán las ediciones personalizadas.';
    if (!window.confirm(confirmMsg)) return;

    const defaults = JSON.parse(JSON.stringify(DEFAULT_WORKSHOP_TEMPLATES));
    setDraftTemplates(defaults);
    setSelectedId(defaults[0].id);
    if (onResetTemplates) {
      onResetTemplates(defaults);
    }
  };

  // Stage handlers
  const handleStageField = (stageIdx, field, value) => {
    updateCurrentTemplate((tpl) => {
      const stages = [...(tpl.stages || [])];
      stages[stageIdx] = { ...stages[stageIdx], [field]: value };
      return { ...tpl, stages };
    });
  };

  const handleAddStage = () => {
    updateCurrentTemplate((tpl) => {
      const nextNum = (tpl.stages || []).length;
      const newStage = {
        level: 'individual',
        title: `Etapa ${nextNum}: Nueva Etapa`,
        titleEn: `Stage ${nextNum}: New Stage`,
        question: 'Escribe aquí el desafío o pregunta de construcción en español...',
        questionEn: 'Write the building challenge prompt in English here...',
        recommendedSeconds: 300,
        facilitatorTip: 'Consejo de facilitación en español.',
        facilitatorTipEn: 'Facilitation tip in English.',
      };
      return { ...tpl, stages: [...(tpl.stages || []), newStage] };
    });
  };

  const handleMoveStage = (idx, direction) => {
    updateCurrentTemplate((tpl) => {
      const stages = [...(tpl.stages || [])];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= stages.length) return tpl;
      const temp = stages[idx];
      stages[idx] = stages[targetIdx];
      stages[targetIdx] = temp;
      return { ...tpl, stages };
    });
  };

  const handleRemoveStage = (idx) => {
    if ((currentTpl.stages || []).length <= 1) {
      alert(
        isEn
          ? 'A template must have at least 1 stage.'
          : 'La plantilla debe tener al menos 1 etapa.'
      );
      return;
    }
    updateCurrentTemplate((tpl) => ({
      ...tpl,
      stages: tpl.stages.filter((_, i) => i !== idx),
    }));
  };

  // Emergent Presets handlers
  const handleEmergentField = (evIdx, field, value) => {
    updateCurrentTemplate((tpl) => {
      const list = [...(tpl.emergentPresets || [])];
      list[evIdx] = { ...list[evIdx], [field]: value };
      return { ...tpl, emergentPresets: list };
    });
  };

  const handleAddEmergent = () => {
    updateCurrentTemplate((tpl) => {
      const newEv = {
        title: 'Nuevo Evento Emergente (ES)',
        titleEn: 'New Emergent Event (EN)',
        description: 'Descripción del choque o cambio inesperado en el escenario.',
        descriptionEn: 'Description of the unexpected shock or scenario shift.',
        impactQuestion: '¿Cómo responde y se adapta nuestro modelo ante este evento?',
        impactQuestionEn: 'How does our model respond and adapt to this event?',
      };
      return { ...tpl, emergentPresets: [...(tpl.emergentPresets || []), newEv] };
    });
  };

  const handleRemoveEmergent = (evIdx) => {
    updateCurrentTemplate((tpl) => ({
      ...tpl,
      emergentPresets: (tpl.emergentPresets || []).filter((_, i) => i !== evIdx),
    }));
  };

  // Export & Import Templates JSON
  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(draftTemplates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LSP_Templates_Config_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].id || !parsed[0].stages) {
          throw new Error('Invalid format');
        }
        setDraftTemplates(parsed);
        setSelectedId(parsed[0].id);
      } catch (err) {
        alert(
          isEn
            ? 'Invalid templates JSON file.'
            : 'Archivo JSON de plantillas inválido.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAll = () => {
    onSaveTemplates(draftTemplates);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* TOP MODAL HEADER */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                {isEn
                  ? 'System Configuration — Bilingual Templates & Firebase Backend'
                  : 'Configuración del Sistema — Plantillas Bilingües y Backend Firebase'}
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                  ES / EN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Customize workshop templates in Spanish & English and manage Firebase (legos-a6a1d) persistence.'
                  : 'Personaliza plantillas de taller en Español e Inglés y gestiona la persistencia en Firebase (legos-a6a1d).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportTemplates}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title={isEn ? 'Export templates JSON' : 'Exportar plantillas JSON'}
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{isEn ? 'Export JSON' : 'Exportar JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title={isEn ? 'Import templates JSON' : 'Importar plantillas JSON'}
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isEn ? 'Import JSON' : 'Importar JSON'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportTemplates}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleResetAllDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 hover:border-rose-500/40 transition"
              title={isEn ? 'Restore factory defaults' : 'Restaurar valores de fábrica'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isEn ? 'Restore Defaults' : 'Restaurar Originales'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: LEFT SIDEBAR (TEMPLATE LIST) + RIGHT EDITOR */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left column: Templates list */}
          <div className="w-full lg:w-80 bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isEn ? 'Templates' : 'Plantillas'} ({draftTemplates.length})
              </span>
              <button
                type="button"
                onClick={handleAddTemplate}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {isEn ? 'New Template' : 'Nueva'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
              {draftTemplates.map((tpl) => {
                const isSelected = tpl.id === currentTpl?.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedId(tpl.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-800/95 border-amber-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-white leading-snug">
                        {isEn && tpl.nameEn ? tpl.nameEn : tpl.name}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-amber-300 font-semibold shrink-0">
                        {isEn && tpl.badgeEn ? tpl.badgeEn : tpl.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      ES: {tpl.name} | EN: {tpl.nameEn}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{(tpl.stages || []).length} {isEn ? 'stages' : 'etapas'}</span>
                      <span>•</span>
                      <span>{(tpl.emergentPresets || []).length} {isEn ? 'events' : 'eventos'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Selected Template Bilingual Editor */}
          {currentTpl && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
              {/* Sub-navigation bar for current template */}
              <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveSection('general')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      activeSection === 'general'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {isEn ? '1. General Info (ES/EN)' : '1. Información General (ES/EN)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('stages')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      activeSection === 'stages'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isEn
                      ? `2. Stages & Challenges (${(currentTpl.stages || []).length})`
                      : `2. Etapas y Desafíos (${(currentTpl.stages || []).length})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('emergent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      activeSection === 'emergent'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isEn
                      ? `3. Emergent Events (${(currentTpl.emergentPresets || []).length})`
                      : `3. Eventos Emergentes (${(currentTpl.emergentPresets || []).length})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('firebase')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      activeSection === 'firebase'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'text-emerald-400 hover:text-white'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    {isEn ? '4. Firebase (legos-a6a1d)' : '4. Firebase (legos-a6a1d)'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateTemplate}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    {isEn ? 'Duplicate' : 'Duplicar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTemplate}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    {isEn ? 'Delete' : 'Eliminar'}
                  </button>
                </div>
              </div>

              {/* Editor Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* SECTION 1: GENERAL METADATA (SPANISH & ENGLISH) */}
                {activeSection === 'general' && (
                  <div className="space-y-5">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isEn ? 'Unique Template ID' : 'Identificador Único de Plantilla (ID)'}
                      </label>
                      <input
                        type="text"
                        value={currentTpl.id}
                        disabled
                        className="w-full sm:w-80 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 opacity-80 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Spanish Column */}
                      <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                          <Globe className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-extrabold text-amber-300">
                            Versión en Español (ES)
                          </h3>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Nombre de la Plantilla (Español)
                          </label>
                          <input
                            type="text"
                            value={currentTpl.name || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ name: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Etiqueta / Categoría Corta (Badge ES)
                          </label>
                          <input
                            type="text"
                            value={currentTpl.badge || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ badge: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Resumen / Propósito Metodológico (Español)
                          </label>
                          <textarea
                            rows={4}
                            value={currentTpl.summary || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ summary: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* English Column */}
                      <div className="bg-slate-950/90 border border-sky-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                          <Globe className="w-4 h-4 text-sky-400" />
                          <h3 className="text-sm font-extrabold text-sky-300">
                            English Version (EN)
                          </h3>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Template Name (English)
                          </label>
                          <input
                            type="text"
                            value={currentTpl.nameEn || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ nameEn: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Short Category Badge (Badge EN)
                          </label>
                          <input
                            type="text"
                            value={currentTpl.badgeEn || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ badgeEn: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Methodological Summary & Scope (English)
                          </label>
                          <textarea
                            rows={4}
                            value={currentTpl.summaryEn || ''}
                            onChange={(e) =>
                              updateCurrentTemplate({ summaryEn: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-sky-400 focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: STAGES EDITOR (SPANISH & ENGLISH) */}
                {activeSection === 'stages' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {isEn
                            ? 'Progressive Workshop Stages (LSP Levels)'
                            : 'Etapas Progresivas del Taller (Niveles LSP)'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {isEn
                            ? 'Configure each stage level, timer duration, and prompts in both Spanish and English.'
                            : 'Configura el nivel de cada etapa, tiempo del cronómetro y preguntas tanto en Español como en Inglés.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStage}
                        className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <Plus className="w-4 h-4" />
                        {isEn ? 'Add Stage' : 'Agregar Etapa'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(currentTpl.stages || []).map((st, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4"
                        >
                          {/* Stage top controls */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs flex items-center justify-center">
                                #{idx + 1}
                              </span>

                              <div>
                                <label className="block text-[10px] uppercase text-slate-400 font-bold">
                                  {isEn ? 'LSP Application Level' : 'Nivel de Aplicación LSP'}
                                </label>
                                <select
                                  value={st.level || 'individual'}
                                  onChange={(e) =>
                                    handleStageField(idx, 'level', e.target.value)
                                  }
                                  className="mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                                >
                                  {APPLICATION_LEVELS.map((lvl) => (
                                    <option key={lvl.id} value={lvl.id}>
                                      {isEn ? `${lvl.codeEn} — ${lvl.nameEn}` : `${lvl.code} — ${lvl.name}`}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase text-slate-400 font-bold">
                                  {isEn ? 'Timer (Seconds)' : 'Tiempo (Segundos)'}
                                </label>
                                <input
                                  type="number"
                                  min={30}
                                  max={3600}
                                  step={30}
                                  value={st.recommendedSeconds || 240}
                                  onChange={(e) =>
                                    handleStageField(
                                      idx,
                                      'recommendedSeconds',
                                      Number(e.target.value) || 240
                                    )
                                  }
                                  className="mt-0.5 w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleMoveStage(idx, -1)}
                                disabled={idx === 0}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                                title={isEn ? 'Move up' : 'Subir etapa'}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStage(idx, 1)}
                                disabled={idx === currentTpl.stages.length - 1}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                                title={isEn ? 'Move down' : 'Bajar etapa'}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveStage(idx)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 ml-1"
                                title={isEn ? 'Remove stage' : 'Eliminar etapa'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Bilingual fields grid for this stage */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Español */}
                            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-amber-500/20">
                              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                                Español (ES)
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Título de la Etapa (ES)
                                </label>
                                <input
                                  type="text"
                                  value={st.title || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'title', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Pregunta / Desafío de Construcción (ES)
                                </label>
                                <textarea
                                  rows={3}
                                  value={st.question || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'question', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Consejo para el Facilitador (ES)
                                </label>
                                <input
                                  type="text"
                                  value={st.facilitatorTip || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'facilitatorTip', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* English */}
                            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-sky-500/20">
                              <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                                English (EN)
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Stage Title (EN)
                                </label>
                                <input
                                  type="text"
                                  value={st.titleEn || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'titleEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Building Challenge Question (EN)
                                </label>
                                <textarea
                                  rows={3}
                                  value={st.questionEn || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'questionEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Facilitator Tip (EN)
                                </label>
                                <input
                                  type="text"
                                  value={st.facilitatorTipEn || ''}
                                  onChange={(e) =>
                                    handleStageField(idx, 'facilitatorTipEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-sky-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 3: EMERGENT EVENTS ("WHAT-IF" SHOCKS) */}
                {activeSection === 'emergent' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {isEn
                            ? 'Emergent "What-If" Simulation Events (Level 3 / AT6)'
                            : 'Eventos Emergentes y Simulaciones "What-If" (Nivel 3 / AT6)'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {isEn
                            ? 'Pre-configured disruptive scenarios that facilitators can trigger to stress-test the 3D landscape.'
                            : 'Escenarios disruptivos preconfigurados que el facilitador puede lanzar para poner a prueba el paisaje 3D.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEmergent}
                        className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <Plus className="w-4 h-4" />
                        {isEn ? 'Add Emergent Event' : 'Agregar Evento Emergente'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(currentTpl.emergentPresets || []).map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          className="bg-slate-950/90 border border-rose-500/30 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                              <Zap className="w-4 h-4" />
                              {isEn ? `Emergent Event #${evIdx + 1}` : `Evento Emergente #${evIdx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmergent(evIdx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Español */}
                            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-amber-500/20">
                              <div className="text-[11px] font-bold text-amber-300 uppercase">
                                Español (ES)
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Título del Evento (ES)
                                </label>
                                <input
                                  type="text"
                                  value={ev.title || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'title', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Descripción de la Crisis / Disrupción (ES)
                                </label>
                                <textarea
                                  rows={2}
                                  value={ev.description || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'description', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Pregunta de Impacto Sistémico (ES)
                                </label>
                                <input
                                  type="text"
                                  value={ev.impactQuestion || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'impactQuestion', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* English */}
                            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-sky-500/20">
                              <div className="text-[11px] font-bold text-sky-300 uppercase">
                                English (EN)
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Event Title (EN)
                                </label>
                                <input
                                  type="text"
                                  value={ev.titleEn || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'titleEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Disruption / Crisis Description (EN)
                                </label>
                                <textarea
                                  rows={2}
                                  value={ev.descriptionEn || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'descriptionEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Systemic Impact Question (EN)
                                </label>
                                <input
                                  type="text"
                                  value={ev.impactQuestionEn || ''}
                                  onChange={(e) =>
                                    handleEmergentField(evIdx, 'impactQuestionEn', e.target.value)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 4: FIREBASE BACKEND CONFIGURATION (legos-a6a1d) */}
                {activeSection === 'firebase' && (
                  <div className="space-y-5">
                    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <Database className="w-5 h-5 text-emerald-400" />
                          <div>
                            <h3 className="text-sm font-extrabold text-white">
                              {isEn
                                ? 'Firebase Cloud Backend & Authentication (Project: legos-a6a1d)'
                                : 'Backend en la Nube Firebase y Autenticación (Proyecto: legos-a6a1d)'}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {isEn
                                ? 'Email/Password Authentication + Cloud Firestore real-time database persistence.'
                                : 'Autenticación con Correo/Contraseña + Persistencia en tiempo real en Cloud Firestore.'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            isFirebaseConfigured()
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {isFirebaseConfigured()
                            ? isEn
                              ? 'Firebase Active'
                              : 'Firebase Conectado'
                            : isEn
                              ? 'Pending Web App API Key'
                              : 'Pendiente API Key Web App'}
                        </span>
                      </div>

                      {/* Quick paste snippet box */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                        <label className="block text-xs font-bold text-amber-300">
                          {isEn
                            ? 'Quick Paste: Paste your firebaseConfig object from Firebase Console (Project Settings → Web App)'
                            : 'Pegado Rápido: Pega aquí el bloque firebaseConfig desde la Consola de Firebase (Configuración del Proyecto → App Web)'}
                        </label>
                        <textarea
                          rows={3}
                          value={rawSnippet}
                          onChange={(e) => handleParseFirebaseSnippet(e.target.value)}
                          placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "legos-a6a1d",\n  appId: "1:..."\n};`}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:border-emerald-400 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Project ID
                          </label>
                          <input
                            type="text"
                            value={fbConfig.projectId || 'legos-a6a1d'}
                            onChange={(e) =>
                              setFbConfig({ ...fbConfig, projectId: e.target.value.trim() })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Web API Key (`apiKey`)
                          </label>
                          <input
                            type="text"
                            value={fbConfig.apiKey || ''}
                            onChange={(e) =>
                              setFbConfig({ ...fbConfig, apiKey: e.target.value.trim() })
                            }
                            placeholder="AIzaSy..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Auth Domain (`authDomain`)
                          </label>
                          <input
                            type="text"
                            value={fbConfig.authDomain || 'legos-a6a1d.firebaseapp.com'}
                            onChange={(e) =>
                              setFbConfig({ ...fbConfig, authDomain: e.target.value.trim() })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            App ID (`appId`)
                          </label>
                          <input
                            type="text"
                            value={fbConfig.appId || ''}
                            onChange={(e) =>
                              setFbConfig({ ...fbConfig, appId: e.target.value.trim() })
                            }
                            placeholder="1:...:web:..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Storage Bucket (`storageBucket`)
                          </label>
                          <input
                            type="text"
                            value={fbConfig.storageBucket || 'legos-a6a1d.firebasestorage.app'}
                            onChange={(e) =>
                              setFbConfig({ ...fbConfig, storageBucket: e.target.value.trim() })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Messaging Sender ID (`messagingSenderId`)
                          </label>
                          <input
                            type="text"
                            value={fbConfig.messagingSenderId || ''}
                            onChange={(e) =>
                              setFbConfig({
                                ...fbConfig,
                                messagingSenderId: e.target.value.trim(),
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {fbSavedNotice
                            ? isEn
                              ? 'Firebase configuration saved and initialized!'
                              : '¡Configuración de Firebase guardada e inicializada!'
                            : isEn
                              ? 'Firestore Collections: /users/{uid}, /rooms/{roomCode}, /system_config/templates'
                              : 'Colecciones Firestore: /users/{uid}, /rooms/{roomCode}, /system_config/templates'}
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveFirebaseSettings}
                          className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition"
                        >
                          <Save className="w-4 h-4" />
                          {isEn
                            ? 'Save & Connect Firebase (legos-a6a1d)'
                            : 'Guardar y Conectar Firebase (legos-a6a1d)'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM FOOTER: SAVE & APPLY */}
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  {savedNotice ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isEn
                        ? 'Changes saved to Firestore & applied in Spanish & English!'
                        : '¡Cambios guardados en Firestore y aplicados en Español e Inglés!'}
                    </span>
                  ) : (
                    <span>
                      {isEn
                        ? 'Changes are saved to Cloud Firestore (legos-a6a1d) & synchronized with active sessions.'
                        : 'Los cambios se guardan en Cloud Firestore (legos-a6a1d) y se sincronizan con las sesiones activas.'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    {isEn ? 'Close' : 'Cerrar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Save className="w-4 h-4" />
                    {isEn ? 'Save Templates Configuration' : 'Guardar Configuración de Plantillas'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
