import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import fileConfig from './firebaseConfig.json';

const FIREBASE_CONFIG_STORAGE_KEY = 'lsp_firebase_sdk_config_v1';

export function getEffectiveFirebaseConfig() {
  let stored = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }

  return {
    apiKey:
      stored.apiKey ||
      import.meta.env.VITE_FIREBASE_API_KEY ||
      fileConfig.apiKey ||
      '',
    authDomain:
      stored.authDomain ||
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      fileConfig.authDomain ||
      'legos-a6a1d.firebaseapp.com',
    projectId:
      stored.projectId ||
      import.meta.env.VITE_FIREBASE_PROJECT_ID ||
      fileConfig.projectId ||
      'legos-a6a1d',
    storageBucket:
      stored.storageBucket ||
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
      fileConfig.storageBucket ||
      'legos-a6a1d.firebasestorage.app',
    messagingSenderId:
      stored.messagingSenderId ||
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      fileConfig.messagingSenderId ||
      '',
    appId:
      stored.appId ||
      import.meta.env.VITE_FIREBASE_APP_ID ||
      fileConfig.appId ||
      '',
  };
}

export function saveCustomFirebaseConfig(configObj) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(configObj));
  }
  return initializeFirebaseServices();
}

export function isFirebaseConfigured() {
  const cfg = getEffectiveFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let app = null;
let db = null;

export function initializeFirebaseServices() {
  try {
    const cfg = getEffectiveFirebaseConfig();
    if (cfg.apiKey && cfg.projectId) {
      app = getApps().length ? getApp() : initializeApp(cfg);
      db = getFirestore(app);
      return { app, db, configured: true };
    }
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
  return { app, db, configured: false };
}

initializeFirebaseServices();

export { app, db };

// Remove any undefined values recursively so Firestore setDoc never rejects an object
function stripUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ===============================================================
// Cloud Firestore Helpers (System Templates & Workshop Rooms/Results)
// ===============================================================

export function subscribeToTemplatesFirestore(onTemplates, onError) {
  if (!db) return () => {};
  const tplRef = doc(db, 'system_config', 'templates');
  return onSnapshot(
    tplRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.templates) && data.templates.length > 0) {
          onTemplates(data.templates);
        }
      }
    },
    (err) => {
      console.error('Firestore templates subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveTemplatesToFirestore(templates, updatedBy = 'Usuario') {
  if (!db || !Array.isArray(templates)) return false;
  const tplRef = doc(db, 'system_config', 'templates');
  const payload = stripUndefined({
    templates: templates.slice(0, 50),
    updatedAt: new Date().toISOString(),
    updatedBy: String(updatedBy || 'Usuario').slice(0, 120),
  });
  await setDoc(tplRef, payload);
  return true;
}

export function sanitizeRoomForFirestore(roomCode, roomData) {
  const code = (roomCode || roomData?.roomCode || 'TEST1').toUpperCase().trim();
  const rawTimer = roomData?.timer || {};
  const clean = {
    roomCode: code,
    templateId: String(roomData?.templateId || 'prospectiva-2050').slice(0, 80),
    createdAt: String(roomData?.createdAt || new Date().toISOString()).slice(0, 40),
    updatedAt: new Date().toISOString(),
    currentStageIndex: Number(roomData?.currentStageIndex || 0),
    corePhase: ['challenge', 'build', 'share', 'reflect'].includes(roomData?.corePhase)
      ? roomData.corePhase
      : 'challenge',
    levelMode: ['skills', 'individual', 'shared', 'landscape'].includes(roomData?.levelMode)
      ? roomData.levelMode
      : 'individual',
    customQuestion: String(roomData?.customQuestion || '').slice(0, 1000),
    timer: {
      remainingSeconds: Number(rawTimer.remainingSeconds ?? 240),
      totalSeconds: Number(rawTimer.totalSeconds ?? 240),
      isRunning: Boolean(rawTimer.isRunning),
      lastUpdated: Number(rawTimer.lastUpdated || Date.now()),
    },
    spotlightParticipantId: roomData?.spotlightParticipantId
      ? String(roomData.spotlightParticipantId).slice(0, 120)
      : null,
    participants: roomData?.participants || {},
    bricks: Array.isArray(roomData?.bricks) ? roomData.bricks.slice(0, 500) : [],
    connections: Array.isArray(roomData?.connections) ? roomData.connections.slice(0, 500) : [],
    stories: Array.isArray(roomData?.stories) ? roomData.stories.slice(0, 300) : [],
    reflections: Array.isArray(roomData?.reflections) ? roomData.reflections.slice(0, 300) : [],
    emergentEvents: Array.isArray(roomData?.emergentEvents)
      ? roomData.emergentEvents.slice(0, 100)
      : [],
  };
  return stripUndefined(clean);
}

export async function getOrCreateRoomInFirestore(roomCode, initialRoomData) {
  if (!db) return null;
  const code = (roomCode || 'TEST1').toUpperCase().trim();
  const roomRef = doc(db, 'rooms', code);
  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    return snap.data();
  }
  const cleanRoom = sanitizeRoomForFirestore(code, initialRoomData);
  await setDoc(roomRef, cleanRoom);
  return cleanRoom;
}

export async function saveRoomToFirestore(roomCode, roomData) {
  if (!db || !roomCode) return false;
  const code = roomCode.toUpperCase().trim();
  const roomRef = doc(db, 'rooms', code);
  const cleanRoom = sanitizeRoomForFirestore(code, roomData);
  await setDoc(roomRef, cleanRoom);
  return true;
}

export function subscribeToRoomFirestore(roomCode, onRoomData, onError) {
  if (!db || !roomCode) return () => {};
  const code = roomCode.toUpperCase().trim();
  const roomRef = doc(db, 'rooms', code);
  return onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onRoomData(snap.data());
      }
    },
    (err) => {
      console.error('Firestore room subscription error:', err);
      if (onError) onError(err);
    }
  );
}
