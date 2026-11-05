import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BRICK_CATALOG } from '../data/lspMethodology';
import {
  RotateCw,
  Trash2,
  Star,
  Link2,
  Eye,
  Compass,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Tag,
  MoveUp,
  MoveDown,
} from 'lucide-react';

// Helper to build authentic-looking 3D LEGO geometry for each catalog item
function createLegoBrickMesh(brickData, isSelected, isConnectSource) {
  const catalogItem = BRICK_CATALOG.find((c) => c.id === brickData.type) || BRICK_CATALOG[0];
  const group = new THREE.Group();

  const w = catalogItem.width;
  const d = catalogItem.depth;
  const h = catalogItem.height;
  const baseColor = new THREE.Color(brickData.color || '#E3000B');

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.25,
    metalness: 0.08,
  });

  if (catalogItem.shape === 'minifig') {
    // Legs
    const legsGeo = new THREE.BoxGeometry(1.2, 1.0, 0.8);
    const legsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.y = 0.5;
    legs.castShadow = true;
    legs.receiveShadow = true;
    group.add(legs);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(1.35, 1.05, 0.85);
    const torso = new THREE.Mesh(torsoGeo, material);
    torso.position.y = 1.52;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Head (Yellow classic or contrasting)
    const headGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.65, 20);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffd500, roughness: 0.25 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.38;
    head.castShadow = true;
    group.add(head);

    // Top stud on head
    const studGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16);
    const stud = new THREE.Mesh(studGeo, headMat);
    stud.position.y = 2.78;
    group.add(stud);
  } else if (catalogItem.shape === 'cylinder') {
    const cylGeo = new THREE.CylinderGeometry(w * 0.48, w * 0.48, h, 24);
    const cyl = new THREE.Mesh(cylGeo, material);
    cyl.position.y = h / 2;
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    group.add(cyl);

    const studGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16);
    const stud = new THREE.Mesh(studGeo, material);
    stud.position.y = h + 0.1;
    group.add(stud);
  } else if (catalogItem.shape === 'tree') {
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.45;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage tiers
    const foliageGeo1 = new THREE.ConeGeometry(1.1, 1.2, 8);
    const foliage1 = new THREE.Mesh(foliageGeo1, material);
    foliage1.position.y = 1.3;
    foliage1.castShadow = true;
    group.add(foliage1);

    const foliageGeo2 = new THREE.ConeGeometry(0.85, 1.0, 8);
    const foliage2 = new THREE.Mesh(foliageGeo2, material);
    foliage2.position.y = 2.0;
    foliage2.castShadow = true;
    group.add(foliage2);
  } else if (catalogItem.shape === 'flag') {
    // Base
    const baseGeo = new THREE.BoxGeometry(0.95, 0.4, 0.95);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = 0.2;
    group.add(base);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.3, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.35;
    group.add(pole);

    // Flag banner
    const flagGeo = new THREE.BoxGeometry(1.1, 0.7, 0.12);
    const flag = new THREE.Mesh(flagGeo, material);
    flag.position.set(0.55, 2.1, 0);
    flag.castShadow = true;
    group.add(flag);
  } else if (catalogItem.shape === 'gear') {
    const gearGeo = new THREE.CylinderGeometry(0.95, 0.95, h, 12);
    const gear = new THREE.Mesh(gearGeo, material);
    gear.position.y = h / 2;
    gear.castShadow = true;
    group.add(gear);

    for (let i = 0; i < 8; i++) {
      const toothGeo = new THREE.BoxGeometry(0.32, h * 0.9, 0.32);
      const tooth = new THREE.Mesh(toothGeo, material);
      const angle = (i / 8) * Math.PI * 2;
      tooth.position.set(Math.cos(angle) * 0.98, h / 2, Math.sin(angle) * 0.98);
      tooth.rotation.y = -angle;
      group.add(tooth);
    }
  } else {
    // Standard box / plate / tower / arch / slope
    const bodyGeo = new THREE.BoxGeometry(w - 0.06, h, d - 0.06);
    const body = new THREE.Mesh(bodyGeo, material);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Add classic LEGO studs on top
    const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16);
    for (let ix = 0; ix < w; ix++) {
      for (let iz = 0; iz < d; iz++) {
        const stud = new THREE.Mesh(studGeo, material);
        const sx = -w / 2 + 0.5 + ix;
        const sz = -d / 2 + 0.5 + iz;
        stud.position.set(sx, h + 0.11, sz);
        stud.castShadow = true;
        group.add(stud);
      }
    }
  }

  // Red Brick ("Ladrillo Rojo" / Essential Core Piece) Golden Crown Halo
  if (brickData.isRedBrick) {
    const ringGeo = new THREE.TorusGeometry(Math.max(w, d) * 0.65, 0.08, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = h + 0.45;
    group.add(ring);
  }

  // Selection or Connect Source highlight outline
  if (isSelected || isConnectSource) {
    const outlineGeo = new THREE.BoxGeometry(w + 0.22, h + 0.35, d + 0.22);
    const outlineMat = new THREE.MeshBasicMaterial({
      color: isConnectSource ? 0x10b981 : 0x38bdf8,
      wireframe: true,
    });
    const outline = new THREE.Mesh(outlineGeo, outlineMat);
    outline.position.y = h / 2 + 0.1;
    group.add(outline);
  }

  group.position.set(brickData.x || 0, brickData.y || 0, brickData.z || 0);
  group.rotation.y = ((brickData.rotation || 0) * Math.PI) / 180;
  group.userData = { brickId: brickData.id, brickData };

  return group;
}

export default function LegoBoard3D({
  bricks = [],
  connections = [],
  selectedBrickType,
  selectedColor,
  selectedBrickId,
  onSelectBrick,
  onAddBrick,
  onUpdateBrick,
  onDeleteBrick,
  onAddConnection,
  onDeleteConnection,
  activeTool, // 'place' | 'select' | 'connect'
  setActiveTool,
  connectionType,
  currentParticipant,
  levelMode,
  spotlightParticipantId,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const brickMeshesRef = useRef({});
  const connectionMeshesRef = useRef([]);
  const ghostMeshRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const groundPlaneRef = useRef(null);

  // Camera spherical coordinates for smooth intuitive orbit without external dependencies
  const camStateRef = useRef({
    radius: 26,
    theta: Math.PI / 4,
    phi: Math.PI / 3.1,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    dragButton: 0,
    lastX: 0,
    lastY: 0,
    movedDistance: 0,
  });

  const [placementRotation, setPlacementRotation] = useState(0);
  const [connectSourceId, setConnectSourceId] = useState(null);
  const [connectionLabelInput, setConnectionLabelInput] = useState('');
  const [metaphorTitle, setMetaphorTitle] = useState('');
  const [metaphorDesc, setMetaphorDesc] = useState('');
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0, z: 0 });

  const selectedBrick = bricks.find((b) => b.id === selectedBrickId) || null;

  // Sync local metaphor inputs when selected brick changes
  useEffect(() => {
    if (selectedBrick) {
      setMetaphorTitle(selectedBrick.metaphorTitle || '');
      setMetaphorDesc(selectedBrick.metaphorDesc || '');
    } else {
      setMetaphorTitle('');
      setMetaphorDesc('');
    }
  }, [selectedBrickId, selectedBrick?.metaphorTitle, selectedBrick?.metaphorDesc]);

  // Focus camera on Spotlight Participant's models if spotlight changes
  useEffect(() => {
    if (!spotlightParticipantId) {
      camStateRef.current.target.set(0, 0, 0);
      updateCameraPosition();
      return;
    }
    const ownedBricks = bricks.filter((b) => b.ownerId === spotlightParticipantId);
    if (ownedBricks.length > 0) {
      const avgX = ownedBricks.reduce((acc, b) => acc + b.x, 0) / ownedBricks.length;
      const avgZ = ownedBricks.reduce((acc, b) => acc + b.z, 0) / ownedBricks.length;
      camStateRef.current.target.set(avgX, 1, avgZ);
      camStateRef.current.radius = 16;
      updateCameraPosition();
    }
  }, [spotlightParticipantId]);

  function updateCameraPosition() {
    const cam = cameraRef.current;
    if (!cam) return;
    const { radius, theta, phi, target } = camStateRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.cos(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.sin(theta);
    cam.position.set(x, y, z);
    cam.lookAt(target);
  }

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight.position.set(18, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    fillLight.position.set(-16, 12, -14);
    scene.add(fillLight);

    // Baseplate Table (28x28 LEGO studs board)
    const boardSize = 28;
    const baseGeo = new THREE.BoxGeometry(boardSize, 0.5, boardSize);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.25;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    groundPlaneRef.current = baseMesh;

    // Grid Helper
    const grid = new THREE.GridHelper(boardSize, boardSize, 0x475569, 0x334155);
    grid.position.y = 0.01;
    scene.add(grid);

    // Center Shared Model Zone Ring (Level 2 & Level 3 visual guide)
    const sharedZoneGeo = new THREE.RingGeometry(4.8, 5.05, 48);
    const sharedZoneMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const sharedZoneRing = new THREE.Mesh(sharedZoneGeo, sharedZoneMat);
    sharedZoneRing.rotation.x = Math.PI / 2;
    sharedZoneRing.position.y = 0.02;
    scene.add(sharedZoneRing);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Re-render bricks and connections whenever state changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old brick meshes
    Object.values(brickMeshesRef.current).forEach((mesh) => scene.remove(mesh));
    brickMeshesRef.current = {};

    // Add current bricks
    bricks.forEach((b) => {
      const isSelected = b.id === selectedBrickId;
      const isConnectSource = b.id === connectSourceId;
      const mesh = createLegoBrickMesh(b, isSelected, isConnectSource);
      scene.add(mesh);
      brickMeshesRef.current[b.id] = mesh;
    });

    // Remove old connection meshes
    connectionMeshesRef.current.forEach((m) => scene.remove(m));
    connectionMeshesRef.current = [];

    // Add 3D tubes/curves between connected bricks (Level 3 Landscape)
    connections.forEach((conn) => {
      const fromBrick = bricks.find((b) => b.id === conn.fromBrickId);
      const toBrick = bricks.find((b) => b.id === conn.toBrickId);
      if (!fromBrick || !toBrick) return;

      const start = new THREE.Vector3(fromBrick.x, (fromBrick.y || 0) + 1.0, fromBrick.z);
      const end = new THREE.Vector3(toBrick.x, (toBrick.y || 0) + 1.0, toBrick.z);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += conn.type === 'flexible' ? 2.2 : 0.6;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(conn.color || '#10B981'),
        emissive: new THREE.Color(conn.color || '#10B981'),
        emissiveIntensity: 0.35,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
      connectionMeshesRef.current.push(tubeMesh);
    });
  }, [bricks, connections, selectedBrickId, connectSourceId]);

  // Ghost preview mesh when in 'place' mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (ghostMeshRef.current) {
      scene.remove(ghostMeshRef.current);
      ghostMeshRef.current = null;
    }

    if (activeTool === 'place') {
      const ghostBrick = {
        id: 'ghost',
        type: selectedBrickType,
        color: selectedColor,
        x: hoverCoords.x,
        y: hoverCoords.y,
        z: hoverCoords.z,
        rotation: placementRotation,
      };
      const mesh = createLegoBrickMesh(ghostBrick, false, false);
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.55;
        }
      });
      scene.add(mesh);
      ghostMeshRef.current = mesh;
    }
  }, [activeTool, selectedBrickType, selectedColor, placementRotation, hoverCoords]);

  // Compute raycast intersection with existing bricks or baseplate
  function getRaycastHit(clientX, clientY) {
    const container = mountRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return null;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const brickObjects = Object.values(brickMeshesRef.current);
    const brickHits = raycasterRef.current.intersectObjects(brickObjects, true);

    if (brickHits.length > 0) {
      let obj = brickHits[0].object;
      while (obj && !obj.userData?.brickId && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData?.brickId) {
        const hitBrick = obj.userData.brickData;
        const catalogItem = BRICK_CATALOG.find((c) => c.id === hitBrick.type) || BRICK_CATALOG[0];
        const snapX = Math.round(brickHits[0].point.x);
        const snapZ = Math.round(brickHits[0].point.z);
        const topY = Number(((hitBrick.y || 0) + catalogItem.height).toFixed(2));
        return {
          type: 'brick',
          brickId: obj.userData.brickId,
          brickData: hitBrick,
          placeX: Math.max(-12, Math.min(12, snapX)),
          placeY: topY,
          placeZ: Math.max(-12, Math.min(12, snapZ)),
        };
      }
    }

    if (groundPlaneRef.current) {
      const groundHits = raycasterRef.current.intersectObject(groundPlaneRef.current);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        return {
          type: 'ground',
          placeX: Math.max(-12, Math.min(12, Math.round(pt.x))),
          placeY: 0,
          placeZ: Math.max(-12, Math.min(12, Math.round(pt.z))),
        };
      }
    }

    return null;
  }

  const handleMouseDown = (e) => {
    camStateRef.current.isDragging = true;
    camStateRef.current.dragButton = e.button;
    camStateRef.current.lastX = e.clientX;
    camStateRef.current.lastY = e.clientY;
    camStateRef.current.movedDistance = 0;
  };

  const handleMouseMove = (e) => {
    if (camStateRef.current.isDragging) {
      const dx = e.clientX - camStateRef.current.lastX;
      const dy = e.clientY - camStateRef.current.lastY;
      camStateRef.current.lastX = e.clientX;
      camStateRef.current.lastY = e.clientY;
      camStateRef.current.movedDistance += Math.abs(dx) + Math.abs(dy);

      if (camStateRef.current.dragButton === 2 || e.shiftKey) {
        // Pan camera target
        const panSpeed = 0.03;
        camStateRef.current.target.x -= dx * panSpeed;
        camStateRef.current.target.z -= dy * panSpeed;
      } else {
        // Orbit camera
        camStateRef.current.theta += dx * 0.008;
        camStateRef.current.phi = Math.max(
          0.25,
          Math.min(Math.PI / 2.15, camStateRef.current.phi - dy * 0.008)
        );
      }
      updateCameraPosition();
      return;
    }

    if (activeTool === 'place') {
      const hit = getRaycastHit(e.clientX, e.clientY);
      if (hit) {
        setHoverCoords({ x: hit.placeX, y: hit.placeY, z: hit.placeZ });
      }
    }
  };

  const handleMouseUp = (e) => {
    const wasClick = camStateRef.current.movedDistance < 6 && e.button === 0;
    camStateRef.current.isDragging = false;

    if (!wasClick) return;

    const hit = getRaycastHit(e.clientX, e.clientY);
    if (!hit) {
      onSelectBrick(null);
      return;
    }

    if (activeTool === 'place') {
      const newBrick = {
        id: `brick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: selectedBrickType,
        color: selectedColor,
        x: hit.placeX,
        y: hit.placeY,
        z: hit.placeZ,
        rotation: placementRotation,
        ownerId: currentParticipant.id,
        ownerName: currentParticipant.name,
        metaphorTitle: '',
        metaphorDesc: '',
        isRedBrick: false,
      };
      onAddBrick(newBrick);
      onSelectBrick(newBrick.id);
    } else if (activeTool === 'select') {
      if (hit.type === 'brick') {
        onSelectBrick(hit.brickId);
      } else {
        onSelectBrick(null);
      }
    } else if (activeTool === 'connect') {
      if (hit.type === 'brick') {
        if (!connectSourceId) {
          setConnectSourceId(hit.brickId);
        } else if (connectSourceId !== hit.brickId) {
          onAddConnection({
            id: `conn-${Date.now()}`,
            fromBrickId: connectSourceId,
            toBrickId: hit.brickId,
            type: connectionType.id,
            color: connectionType.color,
            label: connectionLabelInput || connectionType.name,
            ownerId: currentParticipant.id,
          });
          setConnectSourceId(null);
          setConnectionLabelInput('');
        } else {
          setConnectSourceId(null);
        }
      }
    }
  };

  const handleWheel = (e) => {
    camStateRef.current.radius = Math.max(
      8,
      Math.min(52, camStateRef.current.radius + e.deltaY * 0.02)
    );
    updateCameraPosition();
  };

  const handleSaveMetaphor = () => {
    if (!selectedBrick) return;
    onUpdateBrick(selectedBrick.id, {
      metaphorTitle,
      metaphorDesc,
    });
  };

  const handleToggleRedBrick = () => {
    if (!selectedBrick) return;
    onUpdateBrick(selectedBrick.id, {
      isRedBrick: !selectedBrick.isRedBrick,
    });
  };

  const handleRotateSelected = () => {
    if (selectedBrick) {
      const nextRot = ((selectedBrick.rotation || 0) + 90) % 360;
      onUpdateBrick(selectedBrick.id, { rotation: nextRot });
    } else {
      setPlacementRotation((prev) => (prev + 90) % 360);
    }
  };

  const handleNudgeSelected = (dx, dy, dz) => {
    if (!selectedBrick) return;
    onUpdateBrick(selectedBrick.id, {
      x: Math.max(-12, Math.min(12, (selectedBrick.x || 0) + dx)),
      y: Math.max(0, Number(((selectedBrick.y || 0) + dy).toFixed(2))),
      z: Math.max(-12, Math.min(12, (selectedBrick.z || 0) + dz)),
    });
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Three.js Canvas Mount */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-crosshair"
      />

      {/* Top-Left Camera & Tool Quick Bar */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-xl">
        <button
          onClick={() => setActiveTool('place')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeTool === 'place'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Construir Pieza
        </button>

        <button
          onClick={() => {
            setActiveTool('select');
            setConnectSourceId(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeTool === 'select'
              ? 'bg-sky-400 text-slate-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Seleccionar / Metáfora
        </button>

        <button
          onClick={() => {
            setActiveTool('connect');
            setConnectSourceId(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeTool === 'connect'
              ? 'bg-emerald-400 text-slate-950 shadow'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Conectar Sistema (Nivel 3)
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={handleRotateSelected}
          title="Rotar 90°"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-1"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          Rotar ({selectedBrick ? selectedBrick.rotation || 0 : placementRotation}°)
        </button>

        <button
          onClick={() => {
            camStateRef.current.target.set(0, 0, 0);
            camStateRef.current.radius = 26;
            camStateRef.current.theta = Math.PI / 4;
            camStateRef.current.phi = Math.PI / 3.1;
            updateCameraPosition();
          }}
          title="Centrar vista en la mesa"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          Vista Mesa
        </button>

        <button
          onClick={() => {
            camStateRef.current.radius = Math.max(8, camStateRef.current.radius - 4);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
          title="Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            camStateRef.current.radius = Math.min(50, camStateRef.current.radius + 4);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
          title="Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Connect Tool Banner */}
      {activeTool === 'connect' && (
        <div className="absolute top-16 left-3 bg-emerald-950/90 border border-emerald-500/60 text-emerald-100 px-3.5 py-2 rounded-xl text-xs flex items-center gap-3 shadow-lg">
          <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold">
              {connectSourceId
                ? 'Paso 2: Haz clic en la pieza de destino para crear el vínculo'
                : 'Paso 1: Haz clic en la primera pieza de origen'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={connectionLabelInput}
                onChange={(e) => setConnectionLabelInput(e.target.value)}
                placeholder="Etiqueta del vínculo (ej. Gobernanza, Flujo de recursos)..."
                className="bg-slate-900/90 border border-emerald-600/50 rounded px-2 py-0.5 text-xs text-white w-64"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Metaphor tags rendered over 3D bricks count & legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 flex items-center gap-4">
        <span>
          <strong>Clic Izquierdo:</strong> Colocar / Seleccionar pieza
        </span>
        <span>
          <strong>Arrastrar:</strong> Orbitar cámara 3D
        </span>
        <span>
          <strong>Clic Derecho + Arrastrar:</strong> Desplazar mesa
        </span>
        <span className="text-amber-300 font-medium">
          Círculo Dorado Central = Zona de Modelo Compartido (Nivel 2/3)
        </span>
      </div>

      {/* Selected Brick Metaphor & Inspector Card */}
      {selectedBrick && (
        <div className="absolute top-3 right-3 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">
                Inspector de Metáfora LSP
              </span>
              <h4 className="font-bold text-sm text-white">
                {BRICK_CATALOG.find((c) => c.id === selectedBrick.type)?.name || 'Pieza LEGO'}
              </h4>
              <p className="text-[11px] text-slate-400">
                Autor: <span className="text-slate-200 font-medium">{selectedBrick.ownerName}</span>
              </p>
            </div>
            <button
              onClick={() => onSelectBrick(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              Cerrar
            </button>
          </div>

          {/* Metaphor Title & Story */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombre de la Metáfora (¿Qué representa esta pieza?)
              </label>
              <input
                type="text"
                value={metaphorTitle}
                onChange={(e) => setMetaphorTitle(e.target.value)}
                onBlur={handleSaveMetaphor}
                placeholder="Ej: Puente de confianza interinstitucional"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Significado en tu historia
              </label>
              <textarea
                rows={2}
                value={metaphorDesc}
                onChange={(e) => setMetaphorDesc(e.target.value)}
                onBlur={handleSaveMetaphor}
                placeholder="Explica por qué elegiste este color/altura y qué rol cumple..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSaveMetaphor}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-1.5 rounded-lg transition"
            >
              Guardar Metáfora en la Pieza
            </button>
          </div>

          {/* Red Brick Toggle (Essential for Level 1 -> Level 2 Transition) */}
          <div className="pt-1 border-t border-slate-800">
            <button
              onClick={handleToggleRedBrick}
              className={`w-full py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                selectedBrick.isRedBrick
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Star className={`w-4 h-4 ${selectedBrick.isRedBrick ? 'fill-slate-950' : ''}`} />
              {selectedBrick.isRedBrick
                ? 'Marcado como "Ladrillo Rojo" Esencial'
                : 'Marcar como "Ladrillo Rojo" (Esencial)'}
            </button>
          </div>

          {/* Fine Position & Rotation Controls */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNudgeSelected(-1, 0, 0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Mover X-"
              >
                ←
              </button>
              <button
                onClick={() => handleNudgeSelected(1, 0, 0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Mover X+"
              >
                →
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0, -1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Mover Z-"
              >
                ↑
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0, 1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Mover Z+"
              >
                ↓
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0.4, 0)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Subir altura"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNudgeSelected(0, -0.4, 0)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Bajar altura"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                onDeleteBrick(selectedBrick.id);
                onSelectBrick(null);
              }}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 rounded-lg flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

