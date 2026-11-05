import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BRICK_CATALOG } from '../data/lspMethodology';
import { useLanguage } from '../context/LanguageContext';
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

    // Head
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

    const studGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const stud = new THREE.Mesh(studGeo, material);
    stud.position.y = h + 0.1;
    group.add(stud);
  } else if (catalogItem.shape === 'arch') {
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const main = new THREE.Mesh(mainGeo, material);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Studs on arch
    for (let ix = -w / 2 + 0.5; ix < w / 2; ix += 1) {
      for (let iz = -d / 2 + 0.5; iz < d / 2; iz += 1) {
        const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const stud = new THREE.Mesh(studGeo, material);
        stud.position.set(ix, h + 0.1, iz);
        stud.castShadow = true;
        group.add(stud);
      }
    }
  } else if (catalogItem.shape === 'slope') {
    const geom = new THREE.ConeGeometry(w * 0.7, h, 4);
    geom.rotateY(Math.PI / 4);
    const slope = new THREE.Mesh(geom, material);
    slope.position.y = h / 2;
    slope.castShadow = true;
    group.add(slope);
  } else if (catalogItem.shape === 'tree') {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.4;
    group.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(0.95);
    const foliage = new THREE.Mesh(foliageGeo, material);
    foliage.position.y = 1.6;
    foliage.castShadow = true;
    group.add(foliage);
  } else if (catalogItem.shape === 'flag') {
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.2;
    group.add(pole);

    const flagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const flag = new THREE.Mesh(flagGeo, material);
    flag.position.set(0.4, 2.0, 0);
    group.add(flag);
  } else if (catalogItem.shape === 'gear') {
    const gearGeo = new THREE.CylinderGeometry(w * 0.55, w * 0.55, h, 12);
    const gear = new THREE.Mesh(gearGeo, material);
    gear.position.y = h / 2;
    gear.castShadow = true;
    group.add(gear);
  } else {
    // Default box-like brick or plate with standard LEGO studs
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const body = new THREE.Mesh(bodyGeo, material);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const studRadius = 0.32;
    const studHeight = 0.22;
    const studGeo = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 16);

    for (let ix = -w / 2 + 0.5; ix < w / 2; ix += 1) {
      for (let iz = -d / 2 + 0.5; iz < d / 2; iz += 1) {
        const stud = new THREE.Mesh(studGeo, material);
        stud.position.set(ix, h + studHeight / 2, iz);
        stud.castShadow = true;
        group.add(stud);
      }
    }
  }

  // Red Brick golden halo indicator
  if (brickData.isRedBrick) {
    const starGeo = new THREE.RingGeometry(0.9, 1.15, 32);
    starGeo.rotateX(-Math.PI / 2);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = h + 0.35;
    group.add(star);
  }

  // Selection outline / highlight
  if (isSelected) {
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const wireGeo = new THREE.BoxGeometry(size.x + 0.15, size.y + 0.15, size.z + 0.15);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.copy(center);
    group.add(wire);
  }

  // Connecting source pulse highlight
  if (isConnectSource) {
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    group.add(ring);
  }

  group.position.set(brickData.x || 0, brickData.y || 0, brickData.z || 0);
  group.rotation.y = ((brickData.rotation || 0) * Math.PI) / 180;
  group.userData = { brickId: brickData.id };

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
  activeTool,
  setActiveTool,
  connectionType,
  currentParticipant,
  levelMode,
  spotlightParticipantId,
}) {
  const { language, t } = useLanguage();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const bricksGroupRef = useRef(null);
  const connectionsGroupRef = useRef(null);
  const ghostMeshRef = useRef(null);
  const planeRef = useRef(null);

  // Inspector card states
  const [metaphorTitle, setMetaphorTitle] = useState('');
  const [metaphorDesc, setMetaphorDesc] = useState('');
  const [placementRotation, setPlacementRotation] = useState(0);

  // Connecting state (Pick brick 1 -> Pick brick 2)
  const [connectSourceId, setConnectSourceId] = useState(null);
  const [connectionLabelInput, setConnectionLabelInput] = useState('');

  // Hover coordinate for placement
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0, z: 0 });

  const selectedBrick = bricks.find((b) => b.id === selectedBrickId);

  useEffect(() => {
    if (selectedBrick) {
      setMetaphorTitle(selectedBrick.metaphorTitle || '');
      setMetaphorDesc(selectedBrick.metaphorDesc || '');
    } else {
      setMetaphorTitle('');
      setMetaphorDesc('');
    }
  }, [selectedBrickId, selectedBrick]);

  // Camera Orbit controls state
  const camStateRef = useRef({
    radius: 26,
    theta: Math.PI / 4,
    phi: Math.PI / 3.1,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    dragButton: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    movedDistance: 0,
  });

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const s = camStateRef.current;
    const x = s.target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = s.target.y + s.radius * Math.cos(s.phi);
    const z = s.target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
    cameraRef.current.position.set(x, Math.max(1, y), z);
    cameraRef.current.lookAt(s.target);
  };

  // Setup Three.js scene once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light + Studio key and rim lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ed, 1.4);
    dirLight.position.set(18, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-20, 15, -15);
    scene.add(fillLight);

    // Ground Table Grid & Board
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    planeRef.current = ground;

    // Center Gold Circle (Shared Model Zone - Level 2 / 3)
    const centerCircleGeo = new THREE.RingGeometry(0.1, 5.0, 48);
    centerCircleGeo.rotateX(-Math.PI / 2);
    const centerCircleMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const centerCircle = new THREE.Mesh(centerCircleGeo, centerCircleMat);
    centerCircle.position.y = 0.01;
    scene.add(centerCircle);

    // Grid Helper
    const grid = new THREE.GridHelper(36, 36, 0xf59e0b, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);

    // Dynamic Bricks group
    const bricksGroup = new THREE.Group();
    scene.add(bricksGroup);
    bricksGroupRef.current = bricksGroup;

    // Connections group (tubes)
    const connectionsGroup = new THREE.Group();
    scene.add(connectionsGroup);
    connectionsGroupRef.current = connectionsGroup;

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Spotlight Camera on participant change
  useEffect(() => {
    if (!spotlightParticipantId || !cameraRef.current) return;
    const participantBricks = bricks.filter((b) => b.ownerId === spotlightParticipantId);
    if (participantBricks.length > 0) {
      let avgX = 0;
      let avgZ = 0;
      participantBricks.forEach((b) => {
        avgX += b.x;
        avgZ += b.z;
      });
      avgX /= participantBricks.length;
      avgZ /= participantBricks.length;

      camStateRef.current.target.set(avgX, 0, avgZ);
      camStateRef.current.radius = 16;
      updateCameraPosition();
    }
  }, [spotlightParticipantId, bricks]);

  // Re-render Bricks in Scene
  useEffect(() => {
    if (!bricksGroupRef.current) return;
    const group = bricksGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    bricks.forEach((b) => {
      const isSelected = b.id === selectedBrickId;
      const isConnectSource = b.id === connectSourceId;
      const mesh = createLegoBrickMesh(b, isSelected, isConnectSource);
      group.add(mesh);
    });
  }, [bricks, selectedBrickId, connectSourceId]);

  // Re-render Connections in Scene (3D tubes)
  useEffect(() => {
    if (!connectionsGroupRef.current) return;
    const group = connectionsGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    connections.forEach((conn) => {
      const fromB = bricks.find((b) => b.id === conn.fromBrickId);
      const toB = bricks.find((b) => b.id === conn.toBrickId);
      if (!fromB || !toB) return;

      const p1 = new THREE.Vector3(fromB.x, (fromB.y || 0) + 0.8, fromB.z);
      const p2 = new THREE.Vector3(toB.x, (toB.y || 0) + 0.8, toB.z);
      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 1.2, 0));

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(conn.color || '#10B981'),
        roughness: 0.3,
        metalness: 0.2,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tubeMesh);
    });
  }, [connections, bricks]);

  // Ghost preview mesh when in 'place' mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (ghostMeshRef.current) {
      scene.remove(ghostMeshRef.current);
      ghostMeshRef.current = null;
    }

    if (activeTool === 'place' && hoverCoords) {
      const ghostBrick = {
        id: 'ghost',
        type: selectedBrickType || 'brick-2x4',
        color: selectedColor || '#E3000B',
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

  // Raycaster helper
  function getRaycastHit(clientX, clientY) {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // 1. Check bricks first
    if (bricksGroupRef.current) {
      const brickHits = raycaster.intersectObjects(bricksGroupRef.current.children, true);
      if (brickHits.length > 0) {
        let root = brickHits[0].object;
        while (root.parent && root.parent !== bricksGroupRef.current) {
          root = root.parent;
        }
        const bId = root.userData?.brickId;
        const hitBrick = bricks.find((b) => b.id === bId);
        const catalogItem =
          BRICK_CATALOG.find((c) => c.id === hitBrick?.type) || BRICK_CATALOG[0];
        const hitPt = brickHits[0].point;
        const topY = hitBrick
          ? Number(((hitBrick.y || 0) + catalogItem.height).toFixed(2))
          : Number((hitPt.y + 0.1).toFixed(2));
        return {
          type: 'brick',
          brickId: bId,
          point: hitPt,
          placeX: Math.max(-12, Math.min(12, Math.round(hitPt.x))),
          placeY: topY,
          placeZ: Math.max(-12, Math.min(12, Math.round(hitPt.z))),
        };
      }
    }

    // 2. Check plane
    if (planeRef.current) {
      const planeHits = raycaster.intersectObject(planeRef.current);
      if (planeHits.length > 0) {
        const pt = planeHits[0].point;
        return {
          type: 'plane',
          point: pt,
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
    camStateRef.current.startX = e.clientX;
    camStateRef.current.startY = e.clientY;
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
        const panSpeed = 0.03;
        camStateRef.current.target.x -= dx * panSpeed;
        camStateRef.current.target.z -= dy * panSpeed;
      } else {
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
    // Determine if this was a stationary click vs a camera drag
    const totalDist = Math.hypot(
      e.clientX - camStateRef.current.startX,
      e.clientY - camStateRef.current.startY
    );
    const wasClick = (totalDist < 10 || camStateRef.current.movedDistance < 10) && e.button === 0;
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
        type: selectedBrickType || 'brick-2x4',
        color: selectedColor || '#E3000B',
        x: hit.placeX,
        y: hit.placeY,
        z: hit.placeZ,
        rotation: placementRotation,
        ownerId: currentParticipant?.id || `user-${Date.now()}`,
        ownerName: currentParticipant?.name || 'Participant',
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
          const newConn = {
            id: `conn-${Date.now()}`,
            fromBrickId: connectSourceId,
            toBrickId: hit.brickId,
            type: connectionType?.id || 'standard',
            label:
              connectionLabelInput.trim() ||
              (language === 'en' && connectionType?.nameEn ? connectionType.nameEn : connectionType?.name || 'Connection'),
            color: connectionType?.color || '#10B981',
            ownerId: currentParticipant?.id || `user-${Date.now()}`,
          };
          onAddConnection(newConn);
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

  const selectedCatalogItem = BRICK_CATALOG.find((c) => c.id === selectedBrick?.type);

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
          {t('toolPlace')}
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
          {t('toolSelect')}
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
          {t('toolConnect')}
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={handleRotateSelected}
          title="Rotate 90°"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-1"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          {language === 'en' ? 'Rotate' : 'Rotar'} ({selectedBrick ? selectedBrick.rotation || 0 : placementRotation}°)
        </button>

        <button
          onClick={() => {
            camStateRef.current.target.set(0, 0, 0);
            camStateRef.current.radius = 26;
            camStateRef.current.theta = Math.PI / 4;
            camStateRef.current.phi = Math.PI / 3.1;
            updateCameraPosition();
          }}
          title={language === 'en' ? 'Center camera on table' : 'Centrar vista en la mesa'}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          {language === 'en' ? 'Reset View' : 'Vista Mesa'}
        </button>

        <button
          onClick={() => {
            camStateRef.current.radius = Math.max(8, camStateRef.current.radius - 4);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
          title={language === 'en' ? 'Zoom In' : 'Acercar'}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            camStateRef.current.radius = Math.min(50, camStateRef.current.radius + 4);
            updateCameraPosition();
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
          title={language === 'en' ? 'Zoom Out' : 'Alejar'}
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
                ? (language === 'en' ? 'Step 2: Click on the target brick to complete connection' : 'Paso 2: Haz clic en la pieza de destino para crear el vínculo')
                : (language === 'en' ? 'Step 1: Click on the first brick to begin connection' : 'Paso 1: Haz clic en la primera pieza de origen')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={connectionLabelInput}
                onChange={(e) => setConnectionLabelInput(e.target.value)}
                placeholder={language === 'en' ? 'Connection label (e.g. Governance, Trust)...' : 'Etiqueta del vínculo (ej. Gobernanza, Confianza)...'}
                className="bg-slate-900/90 border border-emerald-600/50 rounded px-2 py-0.5 text-xs text-white w-64"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating viewport legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 flex items-center gap-4">
        <span>{t('viewportControlsHint')}</span>
        <span className="text-amber-300 font-medium">
          {language === 'en' ? 'Central Golden Ring = Shared Model Zone' : 'Círculo Dorado Central = Zona de Modelo Compartido'}
        </span>
      </div>

      {/* Selected Brick Metaphor & Inspector Card */}
      {selectedBrick && (
        <div className="absolute top-3 right-3 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">
                {language === 'en' ? 'LSP Metaphor Inspector' : 'Inspector de Metáfora LSP'}
              </span>
              <h4 className="font-bold text-sm text-white">
                {language === 'en' && selectedCatalogItem?.nameEn
                  ? selectedCatalogItem.nameEn
                  : selectedCatalogItem?.name || 'LEGO Brick'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === 'en' ? 'Author' : 'Autor'}:{' '}
                <span className="text-slate-200 font-medium">{selectedBrick.ownerName}</span>
              </p>
            </div>
            <button
              onClick={() => onSelectBrick(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              {language === 'en' ? 'Close' : 'Cerrar'}
            </button>
          </div>

          {/* Metaphor Title & Story */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {t('metaphorTitleLabel')}
              </label>
              <input
                type="text"
                value={metaphorTitle}
                onChange={(e) => setMetaphorTitle(e.target.value)}
                onBlur={handleSaveMetaphor}
                placeholder={language === 'en' ? 'e.g. Bridge of Inter-agency Trust' : 'Ej: Puente de confianza interinstitucional'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {t('metaphorDescLabel')}
              </label>
              <textarea
                rows={2}
                value={metaphorDesc}
                onChange={(e) => setMetaphorDesc(e.target.value)}
                onBlur={handleSaveMetaphor}
                placeholder={language === 'en' ? 'Why this shape/color? What role does it play?' : 'Explica por qué elegiste este color/altura y qué rol cumple...'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSaveMetaphor}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-1.5 rounded-lg transition"
            >
              {t('saveBrickInfo')}
            </button>
          </div>

          {/* Red Brick Toggle */}
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
                ? (language === 'en' ? 'Marked as Core "Red Brick"' : 'Marcado como "Ladrillo Rojo" Esencial')
                : (language === 'en' ? 'Designate as Core "Red Brick"' : 'Marcar como "Ladrillo Rojo" (Esencial)')}
            </button>
          </div>

          {/* Fine Position & Rotation Controls */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNudgeSelected(-1, 0, 0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Move X-"
              >
                ←
              </button>
              <button
                onClick={() => handleNudgeSelected(1, 0, 0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Move X+"
              >
                →
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0, -1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Move Z-"
              >
                ↑
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0, 1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Move Z+"
              >
                ↓
              </button>
              <button
                onClick={() => handleNudgeSelected(0, 0.4, 0)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Elevation Up"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNudgeSelected(0, -0.4, 0)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
                title="Elevation Down"
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
              {language === 'en' ? 'Delete' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
