import React, { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    // General
    appName: 'LSP Virtual Studio 3D',
    methodologyBadge: 'LEGO® SERIOUS PLAY® METHODOLOGY',
    roleFacilitator: 'Facilitator',
    roleParticipant: 'Participant',
    english: 'English',
    spanish: 'Español',

    // Lobby
    lobbyTagline: 'Real-time 3D multiplayer platform for territorial foresight, strategic foresight, team alignment, and complex systems simulation.',
    lobbyFeature1Title: 'Complete 4-Step Core Process',
    lobbyFeature1Desc: 'Challenge, Construction, Storytelling, and Reflection with Simple Guiding Principles.',
    lobbyFeature2Title: 'Identity & Landscape Kits 3D',
    lobbyFeature2Desc: 'Standard bricks, metaphorical shapes, minifigures, connections, and emergent scenarios.',
    lobbyFeature3Title: 'Multiplayer Collaboration',
    lobbyFeature3Desc: 'Shared board, synchronized timer, spotlight mode, and PDF documentation.',
    lobbyEnterTitle: 'Enter the 3D Studio',
    lobbyEnterSubtitle: 'Configure your profile and session to start',
    yourName: 'Your Name or Alias',
    yourNamePlaceholder: 'e.g. John Doe, Lead Strategist...',
    roomCode: 'Room Code',
    roomCodePlaceholder: 'e.g. ONU2026, TEAM-Q1...',
    selectRole: 'Select Role in Workshop',
    facilitatorRoleDesc: 'Full control of timer, stages, challenges, and spotlight',
    participantRoleDesc: 'Construct models, share metaphors, stories, and reflections',
    avatarColor: 'Avatar & Identity Color',
    workshopTemplate: 'Workshop Template & Methodology',
    joinStudioBtn: 'Join 3D Studio',
    joinStudioDesc: 'By entering you agree to follow the 100% participation and constructive dialogue LSP principles.',

    // Top Navigation / Header
    roomLabel: 'ROOM',
    stageLabel: 'Stage',
    timerRunning: 'Timer active',
    timerPaused: 'Timer paused',
    resetTimer: 'Reset to default time',
    syncTimerTip: 'All participants see this synchronized timer',
    exportPdf: 'PDF Report',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    leaveSession: 'Leave Session',
    participantCount: 'participants',
    facilitatorControls: 'Facilitator Tools',

    // Core phases
    phaseChallenge: '1. Challenge',
    phaseBuild: '2. Build',
    phaseShare: '3. Share',
    phaseReflect: '4. Reflect',

    // Level modes
    levelSkills: 'Level 0: Skills Building',
    levelIndividual: 'Level 1: Individual Models',
    levelShared: 'Level 2: Shared Model',
    levelLandscape: 'Level 3: Landscape & System',

    // 3D Canvas Tools
    toolPlace: 'Place Brick',
    toolSelect: 'Inspect / Edit',
    toolConnect: 'Connect (Landscape)',
    clickToPlace: 'Click on grid or on top of a brick to place',
    clickToSelect: 'Click on any brick to edit its metaphor or move it',
    clickToConnect: 'Click on first brick, then second brick to create a link',
    brickCatalogTitle: '3D Brick Catalog',
    brickPaletteTitle: 'Color & Emotional Meaning',
    brickPlacedCount: 'Total Bricks Placed',
    clearBoard: 'Clear Board',
    deleteSelectedBrick: 'Delete Selected Brick',
    selectedBrickInfo: 'Selected Brick',
    metaphorTitleLabel: 'Metaphorical Meaning (Title)',
    metaphorDescLabel: 'Detailed Narrative / Context',
    isRedBrickLabel: 'Mark as Red Brick (Essential / Non-negotiable)',
    saveBrickInfo: 'Update Brick Metaphor',
    connectionTypeLabel: 'Connection Type',

    // Right Sidebar Tabs
    tabStories: 'Stories & Metaphors',
    tabReflect: 'Reflect & Guiding Principles',
    tabFacilitator: 'Facilitator Guide',
    tabParticipants: 'Participants',

    // Stories Tab
    storiesTitle: 'Model Narratives (100% Voice)',
    storiesSubtitle: 'Document the meaning behind each participant’s construction.',
    myStoryTitlePlaceholder: 'Title of your model or metaphor...',
    myStoryNarrativePlaceholder: 'Explain the story of your build: What do the shapes and colors represent? Why are they arranged this way?',
    submitStoryBtn: 'Publish My Narrative',
    noStoriesYet: 'No stories recorded yet for this stage. Be the first to share!',

    // Reflections Tab
    reflectionsTitle: 'Reflections & Simple Guiding Principles',
    reflectionsSubtitle: 'Synthesize shared insights to guide strategic decisions under pressure.',
    categoryGuidingPrinciple: 'Simple Guiding Principle (SGP)',
    categoryInsight: 'Key Insight / Discovery',
    categoryCommitment: 'Strategic Commitment',
    reflectionTextPlaceholder: 'Formulate a clear principle: e.g. "Whenever crisis occurs, consult the community before reallocating critical resources"...',
    addReflectionBtn: 'Add to System Memory',
    noReflectionsYet: 'No principles or reflections recorded yet.',

    // Facilitator Tab
    facilitatorTitle: 'Facilitator Dashboard',
    facilitatorSubtitle: 'Guide the workshop through the 4 core steps and trigger emergent events.',
    currentStageTitle: 'Current Stage',
    customQuestionLabel: 'Override Question for this Stage',
    customQuestionPlaceholder: 'Type a custom question or leave empty to use template default...',
    updateQuestionBtn: 'Update Question for Room',
    triggerEmergentTitle: 'Trigger Emergent "What-If" Shock',
    triggerEmergentDesc: 'Simulate unexpected crises or external shocks to test systemic resilience.',
    triggerBtn: 'Trigger Event',
    customEventTitle: 'Custom Emergent Shock',

    // Emergent Alert Modal / Banner
    emergentBannerTitle: 'EMERGENT EVENT / "WHAT-IF" SIMULATION ACTIVATED',
    dismissAlert: 'Acknowledge Event',

    // 3D Viewport Controls Hint
    viewportControlsHint: 'Left click: Rotate 3D | Right click / Shift: Pan | Scroll: Zoom',
    groundModeLabel: 'Working in Zone:',
    zoneIndividual: 'Individual Zone',
    zoneShared: 'Shared Central Table',
    zoneLandscape: 'Systemic Landscape',

    // PDF Report
    pdfReportTitle: 'METHODOLOGICAL REPORT — LEGO® SERIOUS PLAY® VIRTUAL 3D',
    pdfRoomCode: 'Room Code',
    pdfDate: 'Date',
    pdfParticipants: 'Participants',
    pdfTotalBricks: '3D Bricks',
    pdfGuidingPrinciplesHeader: 'Simple Guiding Principles (SGP) & Shared Conclusions',
    pdfStoriesHeader: 'Model Narratives & Metaphors by Participant',
    pdfBricksHeader: '3D Metaphorical Catalog of Models on Table',
  },
  es: {
    // General
    appName: 'LSP Virtual Studio 3D',
    methodologyBadge: 'METODOLOGÍA LEGO® SERIOUS PLAY®',
    roleFacilitator: 'Facilitador',
    roleParticipant: 'Participante',
    english: 'English',
    spanish: 'Español',

    // Lobby
    lobbyTagline: 'Plataforma interactiva multijugador en tiempo real para talleres de prospectiva territorial, visión 2050, estrategia de equipos y simulación de sistemas complejos.',
    lobbyFeature1Title: 'Core Process Completo de 4 Pasos',
    lobbyFeature1Desc: 'Desafío, Construcción, Narrativa (Storytelling) y Reflexión con Principios Rectores.',
    lobbyFeature2Title: 'Kits Identity & Landscape 3D',
    lobbyFeature2Desc: 'Piezas estándar, formas metafóricas, minifiguras, conectores y escenarios emergentes.',
    lobbyFeature3Title: 'Colaboración Multijugador',
    lobbyFeature3Desc: 'Mesa compartida, temporizador sincronizado, modo foco y documentación PDF.',
    lobbyEnterTitle: 'Ingresar al Estudio 3D',
    lobbyEnterSubtitle: 'Configura tu perfil y sesión para comenzar',
    yourName: 'Tu Nombre o Alias',
    yourNamePlaceholder: 'Ej. Juan Pérez, Estratega Líder...',
    roomCode: 'Código de Sala',
    roomCodePlaceholder: 'Ej. ONU2026, EQUIPO-Q1...',
    selectRole: 'Selecciona tu Rol en el Taller',
    facilitatorRoleDesc: 'Control total de temporizador, etapas, desafíos y foco',
    participantRoleDesc: 'Construir modelos, compartir metáforas, historias y reflexiones',
    avatarColor: 'Color de Avatar e Identidad',
    workshopTemplate: 'Plantilla de Taller y Metodología',
    joinStudioBtn: 'Entrar al Estudio 3D',
    joinStudioDesc: 'Al ingresar aceptas seguir las normas LSP de 100% participación y respeto constructivo.',

    // Top Navigation / Header
    roomLabel: 'SALA',
    stageLabel: 'Etapa',
    timerRunning: 'Temporizador activo',
    timerPaused: 'Temporizador pausado',
    resetTimer: 'Reiniciar a tiempo estándar',
    syncTimerTip: 'Todos los participantes ven este cronómetro sincronizado',
    exportPdf: 'Informe PDF',
    exportJson: 'Exportar JSON',
    importJson: 'Importar JSON',
    leaveSession: 'Salir de la Sala',
    participantCount: 'participantes',
    facilitatorControls: 'Panel Facilitador',

    // Core phases
    phaseChallenge: '1. Desafío',
    phaseBuild: '2. Construir',
    phaseShare: '3. Compartir',
    phaseReflect: '4. Reflexionar',

    // Level modes
    levelSkills: 'Nivel 0: Calentamiento',
    levelIndividual: 'Nivel 1: Modelos Individuales',
    levelShared: 'Nivel 2: Modelo Compartido',
    levelLandscape: 'Nivel 3: Paisaje y Sistema',

    // 3D Canvas Tools
    toolPlace: 'Colocar Pieza',
    toolSelect: 'Inspeccionar / Editar',
    toolConnect: 'Conectar (Paisaje)',
    clickToPlace: 'Haz clic en la grilla o sobre otra pieza para colocar',
    clickToSelect: 'Haz clic en una pieza para editar su significado o moverla',
    clickToConnect: 'Haz clic en la primera pieza y luego en la segunda para conectarlas',
    brickCatalogTitle: 'Catálogo de Piezas 3D',
    brickPaletteTitle: 'Color y Significado Emocional',
    brickPlacedCount: 'Piezas Colocadas',
    clearBoard: 'Limpiar Mesa',
    deleteSelectedBrick: 'Eliminar Pieza Seleccionada',
    selectedBrickInfo: 'Pieza Seleccionada',
    metaphorTitleLabel: 'Significado Metafórico (Título)',
    metaphorDescLabel: 'Narrativa Detallada / Contexto',
    isRedBrickLabel: 'Marcar como Ladrillo Rojo (Esencial / Innegociable)',
    saveBrickInfo: 'Guardar Metáfora de la Pieza',
    connectionTypeLabel: 'Tipo de Conexión',

    // Right Sidebar Tabs
    tabStories: 'Historias y Metáforas',
    tabReflect: 'Reflexión y Principios',
    tabFacilitator: 'Guía del Facilitador',
    tabParticipants: 'Participantes',

    // Stories Tab
    storiesTitle: 'Historias del Modelo (100% de Voz)',
    storiesSubtitle: 'Registra el significado detrás de la construcción de cada participante.',
    myStoryTitlePlaceholder: 'Título de tu modelo o metáfora...',
    myStoryNarrativePlaceholder: 'Explica la historia de tu construcción: ¿Qué representan las formas y colores? ¿Por qué están dispuestos de este modo?',
    submitStoryBtn: 'Publicar Mi Historia',
    noStoriesYet: 'Aún no hay historias registradas en esta etapa. ¡Sé el primero en compartir!',

    // Reflections Tab
    reflectionsTitle: 'Reflexiones y Principios Rectores Simples',
    reflectionsSubtitle: 'Sintetiza aprendizajes compartidos para guiar decisiones estratégicas bajo presión.',
    categoryGuidingPrinciple: 'Principio Rector Simple',
    categoryInsight: 'Aprendizaje Clave / Hallazgo',
    categoryCommitment: 'Compromiso Estratégico',
    reflectionTextPlaceholder: 'Formula un principio claro: ej. "Ante una crisis, consultar primero con la comunidad antes de reasignar recursos críticos"...',
    addReflectionBtn: 'Agregar a la Memoria del Taller',
    noReflectionsYet: 'Aún no se han formulado principios o reflexiones.',

    // Facilitator Tab
    facilitatorTitle: 'Panel del Facilitador',
    facilitatorSubtitle: 'Guía el taller a través de los 4 pasos centrales y simula eventos emergentes.',
    currentStageTitle: 'Etapa Actual',
    customQuestionLabel: 'Personalizar Pregunta Orientadora de la Etapa',
    customQuestionPlaceholder: 'Escribe una pregunta personalizada o deja vacío para usar la predeterminada...',
    updateQuestionBtn: 'Actualizar Pregunta en la Sala',
    triggerEmergentTitle: 'Lanzar Evento Emergente (Simulación "What-If")',
    triggerEmergentDesc: 'Simula eventos disruptivos o crisis externas para poner a prueba la resiliencia del sistema.',
    triggerBtn: 'Activar Evento',
    customEventTitle: 'Evento Disruptivo Personalizado',

    // Emergent Alert Modal / Banner
    emergentBannerTitle: 'EVENTO EMERGENTE / SIMULACIÓN "WHAT-IF" ACTIVADA',
    dismissAlert: 'Entendido / Continuar',

    // 3D Viewport Controls Hint
    viewportControlsHint: 'Clic izquierdo: Rotar 3D | Clic derecho / Shift: Mover cámara | Rueda: Zoom',
    groundModeLabel: 'Trabajando en Zona:',
    zoneIndividual: 'Zona Individual',
    zoneShared: 'Mesa Central Compartida',
    zoneLandscape: 'Paisaje Sistémico',

    // PDF Report
    pdfReportTitle: 'INFORME METODOLÓGICO — LEGO® SERIOUS PLAY® VIRTUAL 3D',
    pdfRoomCode: 'Código de Sala',
    pdfDate: 'Fecha',
    pdfParticipants: 'Participantes',
    pdfTotalBricks: 'Piezas 3D',
    pdfGuidingPrinciplesHeader: 'Principios Rectores Simples y Conclusiones Compartidas',
    pdfStoriesHeader: 'Historias y Metáforas de los Modelos por Participante',
    pdfBricksHeader: 'Inventario Metafórico 3D de Modelos en Mesa',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('lsp_language') || 'en'; // English by default
  });

  useEffect(() => {
    localStorage.setItem('lsp_language', language);
  }, [language]);

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

