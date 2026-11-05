import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Default rooms store
let rooms = {};
try {
  if (fs.existsSync(ROOMS_FILE)) {
    rooms = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf-8'));
  }
} catch (err) {
  console.error('Error loading rooms.json:', err);
}

function saveRooms() {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving rooms.json:', err);
  }
}

function createInitialRoom(roomCode, templateId = 'prospectiva-2050', facilitatorName = 'Facilitador') {
  return {
    roomCode,
    templateId,
    createdAt: new Date().toISOString(),
    currentStageIndex: 0,
    corePhase: 'challenge', // 'challenge' | 'build' | 'share' | 'reflect'
    levelMode: 'individual', // 'skills' | 'individual' | 'shared' | 'landscape'
    customQuestion: '',
    timer: {
      remainingSeconds: 240,
      totalSeconds: 240,
      isRunning: false,
      lastUpdated: Date.now(),
    },
    spotlightParticipantId: null,
    participants: {}, // participantId -> { id, name, role, avatarColor, online, ready, zoneIndex }
    bricks: [], // { id, type, color, x, y, z, rotation, ownerId, ownerName, metaphorTitle, metaphorDesc, isRedBrick, createdAt }
    connections: [], // { id, fromBrickId, toBrickId, type, label, color, ownerId }
    stories: [], // { id, participantId, participantName, stageIndex, title, narrative, keyMetaphors, redBricks, GuidingPrinciple, timestamp }
    reflections: [], // { id, authorName, text, category, timestamp }
    emergentEvents: [], // { id, title, description, impactQuestion, active, timestamp }
  };
}

// Create a default demo room so users can jump straight in if they want
if (!rooms['ONU2026']) {
  rooms['ONU2026'] = createInitialRoom('ONU2026', 'prospectiva-2050', 'Facilitador Principal');
  // Seed a sample starter brick in the demo room
  rooms['ONU2026'].bricks = [
    {
      id: 'seed-brick-1',
      type: 'brick-2x4',
      color: '#E3000B',
      x: -4,
      y: 0,
      z: -4,
      rotation: 0,
      ownerId: 'demo-facilitator',
      ownerName: 'Facilitador',
      metaphorTitle: 'Base Institucional Sólida',
      metaphorDesc: 'Representa la articulación territorial y gobernanza participativa.',
      isRedBrick: false,
      createdAt: Date.now(),
    },
    {
      id: 'seed-brick-2',
      type: 'tower-2x2',
      color: '#FFD500',
      x: -4,
      y: 1.2,
      z: -4,
      rotation: 0,
      ownerId: 'demo-facilitator',
      ownerName: 'Facilitador',
      metaphorTitle: 'Faro de Innovación 2050',
      metaphorDesc: 'Visión compartida hacia la sostenibilidad y resiliencia.',
      isRedBrick: true,
      createdAt: Date.now(),
    },
    {
      id: 'seed-brick-3',
      type: 'minifig',
      color: '#0055BF',
      x: 4,
      y: 0,
      z: -4,
      rotation: 0,
      ownerId: 'demo-facilitator',
      ownerName: 'Facilitador',
      metaphorTitle: 'Ciudadanía Activa',
      metaphorDesc: 'Actores clave en el centro de las decisiones estratégicas.',
      isRedBrick: false,
      createdAt: Date.now(),
    }
  ];
  rooms['ONU2026'].connections = [
    {
      id: 'seed-conn-1',
      fromBrickId: 'seed-brick-2',
      toBrickId: 'seed-brick-3',
      type: 'flexible',
      label: 'Participación vinculante',
      color: '#10B981',
      ownerId: 'demo-facilitator',
    }
  ];
  saveRooms();
}

// Timer interval loop
setInterval(() => {
  let changed = false;
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
    if (room.timer && room.timer.isRunning && room.timer.remainingSeconds > 0) {
      room.timer.remainingSeconds = Math.max(0, room.timer.remainingSeconds - 1);
      if (room.timer.remainingSeconds === 0) {
        room.timer.isRunning = false;
      }
      io.to(code).emit('timer:tick', room.timer);
      changed = true;
    }
  }
}, 1000);

// REST Endpoints
app.get('/api/rooms', (req, res) => {
  const list = Object.values(rooms).map((r) => ({
    roomCode: r.roomCode,
    templateId: r.templateId,
    participantCount: Object.keys(r.participants || {}).length,
    brickCount: (r.bricks || []).length,
    createdAt: r.createdAt,
  }));
  res.json(list);
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!rooms[code]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }
  res.json(rooms[code]);
});

io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentParticipantId = null;

  socket.on('room:join', ({ roomCode, participantId, name, role, avatarColor, templateId }) => {
    const code = (roomCode || 'ONU2026').toUpperCase().trim();
    currentRoomCode = code;
    currentParticipantId = participantId;

    if (!rooms[code]) {
      rooms[code] = createInitialRoom(code, templateId || 'prospectiva-2050', name);
    } else if (templateId && role === 'facilitator' && Object.keys(rooms[code].participants).length === 0) {
      rooms[code].templateId = templateId;
    }

    const room = rooms[code];
    const existingCount = Object.keys(room.participants).length;
    const existingParticipant = room.participants[participantId];

    room.participants[participantId] = {
      id: participantId,
      socketId: socket.id,
      name: name || 'Participante',
      role: role || 'participant',
      avatarColor: avatarColor || '#3B82F6',
      online: true,
      ready: existingParticipant ? existingParticipant.ready : false,
      zoneIndex: existingParticipant?.zoneIndex !== undefined ? existingParticipant.zoneIndex : existingCount,
    };

    socket.join(code);
    saveRooms();

    io.to(code).emit('room:state', room);
  });

  // Update methodology stage / phase / level
  socket.on('workshop:updateState', ({ currentStageIndex, corePhase, levelMode, customQuestion, templateId, spotlightParticipantId }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (currentStageIndex !== undefined) room.currentStageIndex = currentStageIndex;
    if (corePhase !== undefined) room.corePhase = corePhase;
    if (levelMode !== undefined) room.levelMode = levelMode;
    if (customQuestion !== undefined) room.customQuestion = customQuestion;
    if (templateId !== undefined) room.templateId = templateId;
    if (spotlightParticipantId !== undefined) room.spotlightParticipantId = spotlightParticipantId;

    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Timer controls
  socket.on('timer:control', ({ action, durationSeconds }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (action === 'start') {
      room.timer.isRunning = true;
    } else if (action === 'pause') {
      room.timer.isRunning = false;
    } else if (action === 'reset') {
      room.timer.isRunning = false;
      room.timer.remainingSeconds = durationSeconds || room.timer.totalSeconds || 240;
      if (durationSeconds) room.timer.totalSeconds = durationSeconds;
    } else if (action === 'set') {
      room.timer.totalSeconds = durationSeconds;
      room.timer.remainingSeconds = durationSeconds;
      room.timer.isRunning = false;
    }

    saveRooms();
    io.to(currentRoomCode).emit('timer:tick', room.timer);
  });

  // Add or update a 3D LEGO Brick
  socket.on('brick:add', (brick) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.bricks.push({
      ...brick,
      createdAt: Date.now(),
    });
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  socket.on('brick:update', ({ brickId, updates }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    const idx = room.bricks.findIndex((b) => b.id === brickId);
    if (idx !== -1) {
      room.bricks[idx] = { ...room.bricks[idx], ...updates };
      saveRooms();
      io.to(currentRoomCode).emit('room:state', room);
    }
  });

  socket.on('brick:delete', ({ brickId }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.bricks = room.bricks.filter((b) => b.id !== brickId);
    room.connections = room.connections.filter(
      (c) => c.fromBrickId !== brickId && c.toBrickId !== brickId
    );
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  socket.on('brick:clearMine', ({ participantId }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    const myBrickIds = new Set(
      room.bricks.filter((b) => b.ownerId === participantId).map((b) => b.id)
    );
    room.bricks = room.bricks.filter((b) => b.ownerId !== participantId);
    room.connections = room.connections.filter(
      (c) => !myBrickIds.has(c.fromBrickId) && !myBrickIds.has(c.toBrickId)
    );
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  socket.on('brick:clearAll', () => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.bricks = [];
    room.connections = [];
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Load a pre-built preset or imported model
  socket.on('room:importState', (importedData) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    if (importedData.bricks) room.bricks = importedData.bricks;
    if (importedData.connections) room.connections = importedData.connections;
    if (importedData.stories) room.stories = importedData.stories;
    if (importedData.reflections) room.reflections = importedData.reflections;
    if (importedData.emergentEvents) room.emergentEvents = importedData.emergentEvents;
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Connections between bricks (Level 3 Systems / Landscape)
  socket.on('connection:add', (connection) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.connections.push(connection);
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  socket.on('connection:delete', ({ connectionId }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.connections = room.connections.filter((c) => c.id !== connectionId);
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Participant Ready status
  socket.on('participant:toggleReady', ({ participantId }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    if (room.participants[participantId]) {
      room.participants[participantId].ready = !room.participants[participantId].ready;
      saveRooms();
      io.to(currentRoomCode).emit('room:state', room);
    }
  });

  // Stories (Phase 3: Share)
  socket.on('story:save', (story) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    const existingIndex = room.stories.findIndex(
      (s) => s.participantId === story.participantId && s.stageIndex === story.stageIndex
    );
    if (existingIndex !== -1) {
      room.stories[existingIndex] = { ...story, timestamp: new Date().toISOString() };
    } else {
      room.stories.push({ ...story, id: `story-${Date.now()}`, timestamp: new Date().toISOString() });
    }
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Reflections & Simple Guiding Principles (Phase 4: Reflect)
  socket.on('reflection:add', (reflection) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.reflections.push({
      ...reflection,
      id: `refl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
  });

  // Emergent Events ("What-If" / Cisnes Negros / Terremoto / Crisis simulation in Level 3)
  socket.on('emergent:trigger', (eventObj) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.emergentEvents.unshift({
      ...eventObj,
      id: `emg-${Date.now()}`,
      active: true,
      timestamp: new Date().toISOString(),
    });
    saveRooms();
    io.to(currentRoomCode).emit('room:state', room);
    io.to(currentRoomCode).emit('emergent:alert', room.emergentEvents[0]);
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && rooms[currentRoomCode] && currentParticipantId) {
      const room = rooms[currentRoomCode];
      if (room.participants[currentParticipantId]) {
        room.participants[currentParticipantId].online = false;
        saveRooms();
        io.to(currentRoomCode).emit('room:state', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor LEGO Serious Play Multijugador activo en http://localhost:${PORT}`);
});

