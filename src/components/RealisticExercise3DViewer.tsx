import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Compass, RotateCw, ZoomIn, ZoomOut, 
  Flame, Maximize2, Activity, Sparkles 
} from 'lucide-react';
import { 
  ExerciseTutorial, 
  MotionPatternType, 
  MuscleGroupKey, 
  getExerciseBiomechanics 
} from '../lib/exerciseDatabase';
import { useTranslation } from '../lib/i18n';

interface RealisticExercise3DViewerProps {
  tutorial: ExerciseTutorial;
  repPhase: number; // 0.0 (lockout/setup) -> 1.0 (deep stretch/bottom)
  isPlaying: boolean;
  showGuides: boolean;
  showAngles: boolean;
  showGlow: boolean;
  phaseTitle?: string;
  phaseCue?: string;
  breathCue?: string;
  isEccentric?: boolean;
  onScrub?: (phase: number) => void;
}

export function RealisticExercise3DViewer({
  tutorial,
  repPhase,
  isPlaying,
  showGuides,
  showAngles,
  showGlow,
  phaseTitle,
  phaseCue,
  breathCue,
}: RealisticExercise3DViewerProps) {
  const { t, isRTL } = useTranslation();
  const biomechanics = useMemo(() => getExerciseBiomechanics(tutorial), [tutorial]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera preset view angles
  type CameraViewPreset = 'isometric' | 'side' | 'front' | 'back' | 'top';
  const [currentView, setCurrentView] = useState<CameraViewPreset>('isometric');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visualMode, setVisualMode] = useState<'titanium' | 'hologram'>('titanium');

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const isBench = biomechanics.pattern === 'bench_press' || biomechanics.pattern === 'incline_press';

  // Camera Orbit angles & distance state - calibrated for close-up athletic hero framing
  const orbitState = useRef({
    theta: isBench ? Math.PI / 3.4 : Math.PI / 3.8,      // 3/4 dynamic perspective
    phi: isBench ? Math.PI / 2.7 : Math.PI / 2.5,        // natural elevation
    targetTheta: isBench ? Math.PI / 3.4 : Math.PI / 3.8,
    targetPhi: isBench ? Math.PI / 2.7 : Math.PI / 2.5,
    radius: isBench ? 2.65 : 3.05,                       // close-up hero framing (athlete fills 75-80% screen)
    targetRadius: isBench ? 2.65 : 3.05,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    touchDistStart: 0
  });

  // Skeletal Rig Reference Container
  const rigRef = useRef<ReturnType<typeof buildHierarchicalBiomechanicalMannequin> | null>(null);

  // Track isPlaying and on-demand render request
  const isPlayingRef = useRef(isPlaying);
  const requestRenderRef = useRef<() => void>(() => {});
  const requestRender = useCallback(() => {
    requestRenderRef.current();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) requestRender();
  }, [isPlaying, requestRender]);

  // Set camera view preset
  const setCameraPreset = useCallback((preset: CameraViewPreset) => {
    setCurrentView(preset);
    const orbit = orbitState.current;
    const isBenchPattern = biomechanics.pattern === 'bench_press' || biomechanics.pattern === 'incline_press';

    if (preset === 'front') {
      orbit.targetTheta = 0;
      orbit.targetPhi = isBenchPattern ? Math.PI / 2.8 : Math.PI / 2.35;
      orbit.targetRadius = isBenchPattern ? 2.5 : 2.85;
    } else if (preset === 'side') {
      orbit.targetTheta = Math.PI / 2;
      orbit.targetPhi = isBenchPattern ? Math.PI / 2.6 : Math.PI / 2.4;
      orbit.targetRadius = isBenchPattern ? 2.6 : 2.95;
    } else if (preset === 'isometric') {
      orbit.targetTheta = isBenchPattern ? Math.PI / 3.4 : Math.PI / 3.8;
      orbit.targetPhi = isBenchPattern ? Math.PI / 2.7 : Math.PI / 2.5;
      orbit.targetRadius = isBenchPattern ? 2.65 : 3.05;
    } else if (preset === 'back') {
      orbit.targetTheta = Math.PI;
      orbit.targetPhi = Math.PI / 2.45;
      orbit.targetRadius = 2.95;
    } else if (preset === 'top') {
      orbit.targetTheta = 0;
      orbit.targetPhi = 0.25;
      orbit.targetRadius = 3.2;
    }
    requestRender();
  }, [biomechanics.pattern, requestRender]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.045);

    // 2. Camera setup - tight athletic focal length
    const camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 40);
    cameraRef.current = camera;
    camera.position.set(2.2, 1.8, 2.4);

    // 3. Renderer with antialiasing, shadow maps & ACES tonemapping
    const isMobileDevice = typeof window !== 'undefined' && ('ontouchstart' in window || window.innerWidth < 768);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobileDevice, 
      alpha: false,
      powerPreference: isMobileDevice ? 'default' : 'high-performance' 
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobileDevice;
    if (!isMobileDevice) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting Rig (High-contrast athletic illumination)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.3);
    scene.add(ambientLight);

    // Key front-top light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3.6, 5.2, 3.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    // Rim/Backlight (cyan athletic edge separation)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    rimLight.position.set(-3.2, 3.6, -3.6);
    scene.add(rimLight);

    // Warm Side Fill Light
    const fillLight = new THREE.DirectionalLight(0xf59e0b, 1.1);
    fillLight.position.set(-3.6, 1.6, 2.6);
    scene.add(fillLight);

    // Subtle upward ground bounce light
    const bounceLight = new THREE.DirectionalLight(0x0ea5e9, 0.45);
    bounceLight.position.set(0, -2, 0);
    scene.add(bounceLight);

    // 5. Studio Biomechanics Platform Floor
    const floorRadius = 4.2;
    const floorGeo = new THREE.CircleGeometry(floorRadius, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.85,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Raised Circular Lifting Podium
    const podiumGeo = new THREE.CylinderGeometry(2.1, 2.15, 0.035, 48);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x0c1322,
      roughness: 0.65,
      metalness: 0.35
    });
    const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
    podiumMesh.position.y = 0.0175;
    podiumMesh.receiveShadow = true;
    scene.add(podiumMesh);

    // Glowing Cyan Perimeter LED Ring
    const ledRingGeo = new THREE.RingGeometry(2.08, 2.12, 48);
    const ledRingMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide
    });
    const ledRingMesh = new THREE.Mesh(ledRingGeo, ledRingMat);
    ledRingMesh.rotation.x = -Math.PI / 2;
    ledRingMesh.position.y = 0.036;
    scene.add(ledRingMesh);

    // Polar Grid helper over the platform
    const gridHelper = new THREE.PolarGridHelper(2.0, 4, 8, 32, 0x1e293b, 0x131d2e);
    gridHelper.position.y = 0.037;
    scene.add(gridHelper);

    // Soft contact shadow under the athlete
    const contactShadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.38)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = 0.038;
    scene.add(contactShadowMesh);

    // 6. Build Hierarchical Biomechanical Mannequin & Gym Equipment
    const rig = buildHierarchicalBiomechanicalMannequin(scene);
    rigRef.current = rig;

    // 7. Touch and Mouse Interaction with On-Demand Rendering
    let isSleeping = false;
    let isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const requestRenderInternal = () => {
      if (!isDocumentVisible) return;
      if (isSleeping) {
        isSleeping = false;
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };
    requestRenderRef.current = requestRenderInternal;

    const onVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) {
        requestRenderInternal();
      } else {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
        isSleeping = true;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      orbitState.current.isDragging = true;
      requestRenderInternal();
      if ('touches' in e) {
        if (e.touches.length === 1) {
          orbitState.current.prevMouseX = e.touches[0].clientX;
          orbitState.current.prevMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          orbitState.current.touchDistStart = Math.hypot(dx, dy);
        }
      } else {
        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!orbitState.current.isDragging) return;
      const orbit = orbitState.current;

      if ('touches' in e) {
        if (e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - orbit.prevMouseX;
          const deltaY = e.touches[0].clientY - orbit.prevMouseY;
          orbit.prevMouseX = e.touches[0].clientX;
          orbit.prevMouseY = e.touches[0].clientY;

          orbit.targetTheta -= deltaX * 0.012;
          orbit.targetPhi = Math.max(0.12, Math.min(Math.PI / 2.05, orbit.targetPhi - deltaY * 0.01));
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const factor = orbit.touchDistStart / (dist || 1);
          orbit.targetRadius = Math.max(1.5, Math.min(5.0, orbit.targetRadius * factor));
          orbit.touchDistStart = dist;
        }
      } else {
        const deltaX = e.clientX - orbit.prevMouseX;
        const deltaY = e.clientY - orbit.prevMouseY;
        orbit.prevMouseX = e.clientX;
        orbit.prevMouseY = e.clientY;

        orbit.targetTheta -= deltaX * 0.01;
        orbit.targetPhi = Math.max(0.12, Math.min(Math.PI / 2.05, orbit.targetPhi - deltaY * 0.008));
      }
      requestRenderInternal();
    };

    const onPointerUp = () => {
      orbitState.current.isDragging = false;
      requestRenderInternal();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const orbit = orbitState.current;
      const zoomStep = e.deltaY * 0.003;
      orbit.targetRadius = Math.max(1.5, Math.min(5.0, orbit.targetRadius + zoomStep));
      requestRenderInternal();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElem.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      requestRenderInternal();
    });
    resizeObserver.observe(container);

    // 9. On-Demand Render Loop (Sleeps when idle to preserve GPU and battery)
    const renderLoop = (_time: number) => {
      if (!isDocumentVisible) {
        isSleeping = true;
        animFrameIdRef.current = null;
        return;
      }

      const orbit = orbitState.current;
      const dTheta = orbit.targetTheta - orbit.theta;
      const dPhi = orbit.targetPhi - orbit.phi;
      const dRadius = orbit.targetRadius - orbit.radius;

      orbit.theta += dTheta * 0.12;
      orbit.phi += dPhi * 0.12;
      orbit.radius += dRadius * 0.12;

      const cx = orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
      const cy = orbit.radius * Math.cos(orbit.phi);
      const cz = orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);

      const isBenchPattern = biomechanics.pattern === 'bench_press' || biomechanics.pattern === 'incline_press';
      const lookY = isBenchPattern ? 0.62 : 1.0;
      const lookZ = isBenchPattern ? -0.15 : 0;
      camera.position.set(cx, cy + (isBenchPattern ? 0.35 : 0), cz);
      camera.lookAt(0, lookY, lookZ);

      renderer.render(scene, camera);

      const isCameraMoving = Math.abs(dTheta) > 0.0004 || Math.abs(dPhi) > 0.0004 || Math.abs(dRadius) > 0.0004;
      const shouldKeepLoop = orbit.isDragging || isCameraMoving || isPlayingRef.current;

      if (shouldKeepLoop) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      } else {
        isSleeping = true;
        animFrameIdRef.current = null;
      }
    };
    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();

      domElem.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      domElem.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);

      // Deep GPU VRAM buffer cleanup
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      scene.clear();
    };
  }, [biomechanics.pattern, isBench]);

  // Synchronize Pose, Kinematics, Equipment & Dynamic Heatmap on every repPhase / tutorial change
  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;

    updateBiomechanicalPose({
      rig,
      pattern: biomechanics.pattern,
      repPhase,
      primaryMuscle: biomechanics.primaryMuscle,
      secondaryMuscles: biomechanics.secondaryMuscles,
      showGlow,
      showGuides,
      visualMode
    });
    requestRender();
  }, [repPhase, biomechanics, showGlow, showGuides, visualMode, requestRender]);

  // Compute live estimated joint angle based on exercise pattern
  const currentJointAngle = useMemo(() => {
    switch (biomechanics.pattern) {
      case 'bench_press':
      case 'incline_press':
        return Math.round(165 - repPhase * 80); // Elbows 165° -> 85°
      case 'squat':
        return Math.round(175 - repPhase * 90); // Knee 175° -> 85°
      case 'deadlift':
        return Math.round(175 - repPhase * 85); // Hips 175° -> 90°
      case 'overhead_press':
        return Math.round(85 + (1 - repPhase) * 85); // Elbows 85° -> 170°
      case 'bicep_curl':
        return Math.round(165 - (1 - repPhase) * 115); // Elbows 165° -> 50°
      case 'tricep_extension':
        return Math.round(65 + (1 - repPhase) * 105); // Elbows 65° -> 170°
      case 'lateral_raise':
        return Math.round(20 + (1 - repPhase) * 75); // Arm abduction 20° -> 95°
      case 'pull_down':
      case 'row':
        return Math.round(170 - repPhase * 100); // Pull angle 170° -> 70°
      default:
        return Math.round(160 - repPhase * 70);
    }
  }, [biomechanics.pattern, repPhase]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isFullscreen ? '480px' : '340px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(70, 217, 255, 0.35)',
      backgroundColor: '#060913',
      boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.92), 0 12px 40px -8px rgba(0, 0, 0, 0.75)',
      transition: 'height 0.25s ease'
    }}>
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: 'grab',
          touchAction: 'none'
        }} 
      />

      {/* Top Floating Overlay: Camera Preset Angles */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: isRTL ? undefined : '10px',
        right: isRTL ? '10px' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: 'rgba(8, 14, 28, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        padding: '0.25rem',
        borderRadius: '10px',
        zIndex: 5
      }}>
        {([
          { id: 'isometric', label: t('view3D') },
          { id: 'side', label: t('viewSide') },
          { id: 'front', label: t('viewFront') },
          { id: 'back', label: t('viewBack') },
          { id: 'top', label: isRTL ? 'رأسي' : 'Top' }
        ] as const).map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setCameraPreset(view.id)}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '7px',
              border: currentView === view.id ? '1px solid rgba(70, 217, 255, 0.6)' : '1px solid transparent',
              background: currentView === view.id ? 'rgba(70, 217, 255, 0.24)' : 'transparent',
              color: currentView === view.id ? '#46d9ff' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: currentView === view.id ? 800 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Top Right Floating Controls (Zoom, Reset, Theme, Fullscreen) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: isRTL ? undefined : '10px',
        left: isRTL ? '10px' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        zIndex: 5
      }}>
        {/* Style Mode Switcher: Titanium vs Cyber Hologram */}
        <button
          type="button"
          onClick={() => setVisualMode(prev => prev === 'titanium' ? 'hologram' : 'titanium')}
          style={{
            padding: '0.35rem 0.55rem',
            borderRadius: '8px',
            background: visualMode === 'hologram' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: visualMode === 'hologram' ? '1px solid rgba(6, 182, 212, 0.6)' : '1px solid rgba(255, 255, 255, 0.14)',
            color: visualMode === 'hologram' ? '#22d3ee' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
          title={isRTL ? 'تغيير خامة المجسم' : 'Toggle Visual Theme'}
        >
          <Sparkles size={13} />
          <span>{visualMode === 'hologram' ? (isRTL ? 'سايبر' : 'Cyber') : (isRTL ? 'تيتانيوم' : 'Titanium')}</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('isometric')}
          style={{
            padding: '0.35rem',
            borderRadius: '8px',
            background: 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={t('resetView')}
        >
          <RotateCw size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            orbitState.current.targetRadius = Math.max(1.5, orbitState.current.targetRadius - 0.4);
          }}
          style={{
            padding: '0.35rem',
            borderRadius: '8px',
            background: 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            orbitState.current.targetRadius = Math.min(5.0, orbitState.current.targetRadius + 0.4);
          }}
          style={{
            padding: '0.35rem',
            borderRadius: '8px',
            background: 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            padding: '0.35rem',
            borderRadius: '8px',
            background: 'rgba(8, 14, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: isFullscreen ? '#46d9ff' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Size"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Live 60 FPS Status Badge */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: '48px',
          left: isRTL ? undefined : '10px',
          right: isRTL ? '10px' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.22rem 0.55rem',
          borderRadius: '7px',
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          color: '#10b981',
          fontSize: '0.68rem',
          fontWeight: 800,
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>60 FPS Live 3D</span>
        </div>
      )}

      {/* Live Phase & Breathing Prompt Badge */}
      {phaseTitle && (
        <div style={{
          position: 'absolute',
          top: isPlaying ? '78px' : '48px',
          left: isRTL ? undefined : '10px',
          right: isRTL ? '10px' : undefined,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(8, 14, 28, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(70, 217, 255, 0.35)',
          maxWidth: '220px',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8' }}>
            {phaseTitle}
          </span>
          {phaseCue && (
            <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.75)' }}>
              {phaseCue}
            </span>
          )}
          {breathCue && (
            <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 600 }}>
              {breathCue}
            </span>
          )}
        </div>
      )}

      {/* Joint Angle Readout */}
      {showAngles && (
        <div style={{
          position: 'absolute',
          bottom: '36px',
          left: isRTL ? undefined : '10px',
          right: isRTL ? '10px' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(8, 14, 28, 0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          fontSize: '0.72rem',
          color: '#f59e0b',
          fontWeight: 800,
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <Activity size={13} />
          <span>{isRTL ? `زاوية المفصل: ${currentJointAngle}°` : `Joint Angle: ${currentJointAngle}°`}</span>
        </div>
      )}

      {/* Bottom Floating Hint: 360° Interaction prompt */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.22rem 0.75rem',
        borderRadius: '999px',
        background: 'rgba(5, 9, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 5
      }}>
        <Compass size={13} style={{ color: '#46d9ff' }} />
        <span>{t('orbitControlsHint')}</span>
      </div>

      {/* Muscle Heatmap Active Badge */}
      {showGlow && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: isRTL ? undefined : '10px',
          left: isRTL ? '10px' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.22rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.22)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          fontSize: '0.7rem',
          color: '#ff6b6b',
          fontWeight: 800,
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <Flame size={13} />
          <span>{isRTL ? 'توهج الانقباض 3D' : '3D Muscle Heatmap'}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3D Hierarchical Athletic Biomechanical Mannequin (Kinematic Skeletal Tree)
// ============================================================================

function buildHierarchicalBiomechanicalMannequin(scene: THREE.Scene) {
  // Main Athlete Container in World Space
  const athleteGroup = new THREE.Group();
  scene.add(athleteGroup);

  // Materials Definition: Sleek athletic titanium finish
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate-600 titanium
    roughness: 0.32,
    metalness: 0.45
  });

  const muscleHighlightMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Slate-500 highlighting muscle bellies
    roughness: 0.28,
    metalness: 0.5
  });

  const shortsMaterial = new THREE.MeshStandardMaterial({
    color: 0x090d16, // Dark compression fabric
    roughness: 0.75,
    metalness: 0.12
  });

  const shortsTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan athletic racing stripe
    emissive: 0x06b6d4,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.7
  });

  const jointMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Brushed titanium pivot collar
    roughness: 0.22,
    metalness: 0.85
  });

  const visorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Aerodynamic athletic cyber visor
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.95
  });

  const shoeSoleMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Clean athletic white sole
    roughness: 0.35,
    metalness: 0.2
  });

  const shoeUpperMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark obsidian upper
    roughness: 0.65,
    metalness: 0.3
  });

  const shoeAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan trainer accent
    roughness: 0.3,
    metalness: 0.6
  });

  const muscleMeshes = new Map<MuscleGroupKey, THREE.Mesh[]>();
  const registerMuscleMesh = (key: MuscleGroupKey, mesh: THREE.Mesh) => {
    mesh.material = (mesh.material as THREE.Material).clone();
    if (!muscleMeshes.has(key)) {
      muscleMeshes.set(key, []);
    }
    muscleMeshes.get(key)!.push(mesh);
  };

  // --------------------------------------------------------------------------
  // HIERARCHY ROOT: Pelvis Node (Root of the entire skeleton)
  // --------------------------------------------------------------------------
  const pelvisNode = new THREE.Group();
  pelvisNode.position.set(0, 0.95, 0); // Default standing pelvis height
  athleteGroup.add(pelvisNode);

  // Pelvis mesh (Compression shorts)
  const pelvisMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.15, 0.17, 24),
    shortsMaterial
  );
  pelvisMesh.castShadow = true;
  pelvisNode.add(pelvisMesh);

  // Shorts side stripes
  const leftShortsStripe = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.05), shortsTrimMaterial);
  leftShortsStripe.position.set(-0.175, 0, 0);
  pelvisNode.add(leftShortsStripe);

  const rightShortsStripe = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.05), shortsTrimMaterial);
  rightShortsStripe.position.set(0.175, 0, 0);
  pelvisNode.add(rightShortsStripe);

  // Gluteus Maximus (Left & Right sculpted muscular contours)
  const gluteGeo = new THREE.SphereGeometry(0.125, 20, 16);
  gluteGeo.scale(0.95, 1.25, 1.2);
  const leftGlute = new THREE.Mesh(gluteGeo, muscleHighlightMaterial);
  leftGlute.position.set(-0.09, -0.02, -0.08);
  leftGlute.castShadow = true;
  pelvisNode.add(leftGlute);
  registerMuscleMesh('glutes', leftGlute);

  const rightGlute = new THREE.Mesh(gluteGeo, muscleHighlightMaterial);
  rightGlute.position.set(0.09, -0.02, -0.08);
  rightGlute.castShadow = true;
  pelvisNode.add(rightGlute);
  registerMuscleMesh('glutes', rightGlute);

  // --------------------------------------------------------------------------
  // SPINE & ABDOMEN (Child of Pelvis)
  // --------------------------------------------------------------------------
  const spineNode = new THREE.Group();
  spineNode.position.set(0, 0.10, 0); // Positioned above pelvis center
  pelvisNode.add(spineNode);

  // Lumbar core
  const spineMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.19, 20),
    bodyMaterial
  );
  spineMesh.position.set(0, 0.095, 0);
  spineMesh.castShadow = true;
  spineNode.add(spineMesh);
  registerMuscleMesh('lowerBack', spineMesh);

  // Erector Spinae (Lower back spinal muscle columns)
  const erectorGeo = new THREE.CapsuleGeometry(0.042, 0.13, 10, 14);
  const leftErector = new THREE.Mesh(erectorGeo, muscleHighlightMaterial);
  leftErector.position.set(-0.055, 0.095, -0.07);
  spineNode.add(leftErector);
  registerMuscleMesh('lowerBack', leftErector);

  const rightErector = new THREE.Mesh(erectorGeo, muscleHighlightMaterial);
  rightErector.position.set(0.055, 0.095, -0.07);
  spineNode.add(rightErector);
  registerMuscleMesh('lowerBack', rightErector);

  // 6-Pack Rectus Abdominis
  const absPads: THREE.Mesh[] = [];
  for (let r = 0; r < 3; r++) {
    const padGeo = new THREE.BoxGeometry(0.065, 0.046, 0.032);
    const leftPad = new THREE.Mesh(padGeo, muscleHighlightMaterial);
    leftPad.position.set(-0.046, 0.04 + r * 0.055, 0.11);
    leftPad.castShadow = true;
    spineNode.add(leftPad);
    registerMuscleMesh('abs', leftPad);
    absPads.push(leftPad);

    const rightPad = new THREE.Mesh(padGeo, muscleHighlightMaterial);
    rightPad.position.set(0.046, 0.04 + r * 0.055, 0.11);
    rightPad.castShadow = true;
    spineNode.add(rightPad);
    registerMuscleMesh('abs', rightPad);
    absPads.push(rightPad);
  }

  // External Obliques
  const obliqueGeo = new THREE.CapsuleGeometry(0.038, 0.14, 10, 12);
  const leftOblique = new THREE.Mesh(obliqueGeo, bodyMaterial);
  leftOblique.position.set(-0.135, 0.09, 0.02);
  spineNode.add(leftOblique);
  registerMuscleMesh('abs', leftOblique);

  const rightOblique = new THREE.Mesh(obliqueGeo, bodyMaterial);
  rightOblique.position.set(0.135, 0.09, 0.02);
  spineNode.add(rightOblique);
  registerMuscleMesh('abs', rightOblique);

  // --------------------------------------------------------------------------
  // THORAX / CHEST / UPPER BACK (Child of Spine)
  // --------------------------------------------------------------------------
  const thoraxNode = new THREE.Group();
  thoraxNode.position.set(0, 0.20, 0); // Positioned atop lumbar spine
  spineNode.add(thoraxNode);

  const thoraxMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.17, 0.24, 24).scale(1.18, 1, 0.88),
    bodyMaterial
  );
  thoraxMesh.position.set(0, 0.12, 0);
  thoraxMesh.castShadow = true;
  thoraxNode.add(thoraxMesh);

  // Sculpted Pectoralis Major Plates (Left & Right)
  const pecGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.065, 18).rotateZ(Math.PI / 2).scale(0.85, 1.25, 1.0);
  const leftPec = new THREE.Mesh(pecGeo, muscleHighlightMaterial);
  leftPec.position.set(-0.085, 0.14, 0.115);
  leftPec.castShadow = true;
  thoraxNode.add(leftPec);
  registerMuscleMesh('chest', leftPec);

  const rightPec = new THREE.Mesh(pecGeo, muscleHighlightMaterial);
  rightPec.position.set(0.085, 0.14, 0.115);
  rightPec.castShadow = true;
  thoraxNode.add(rightPec);
  registerMuscleMesh('chest', rightPec);

  // Latissimus Dorsi (Lats - V-taper wings)
  const latGeo = new THREE.BoxGeometry(0.09, 0.22, 0.11);
  const leftLat = new THREE.Mesh(latGeo, muscleHighlightMaterial);
  leftLat.position.set(-0.18, 0.09, -0.03);
  leftLat.castShadow = true;
  thoraxNode.add(leftLat);
  registerMuscleMesh('lats', leftLat);

  const rightLat = new THREE.Mesh(latGeo, muscleHighlightMaterial);
  rightLat.position.set(0.18, 0.09, -0.03);
  rightLat.castShadow = true;
  thoraxNode.add(rightLat);
  registerMuscleMesh('lats', rightLat);

  // Trapezius (Traps - Diamond upper back plate)
  const trapGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.18, 16).scale(1.2, 1, 0.6);
  const trapMesh = new THREE.Mesh(trapGeo, muscleHighlightMaterial);
  trapMesh.position.set(0, 0.17, -0.06);
  trapMesh.castShadow = true;
  thoraxNode.add(trapMesh);
  registerMuscleMesh('traps', trapMesh);

  // --------------------------------------------------------------------------
  // NECK & HEAD (Child of Thorax)
  // --------------------------------------------------------------------------
  const neckNode = new THREE.Group();
  neckNode.position.set(0, 0.24, 0);
  thoraxNode.add(neckNode);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.082, 0.11, 18),
    bodyMaterial
  );
  neckMesh.position.set(0, 0.055, 0);
  neckMesh.castShadow = true;
  neckNode.add(neckMesh);

  const headNode = new THREE.Group();
  headNode.position.set(0, 0.12, 0);
  neckNode.add(headNode);

  const craniumMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.112, 22, 18).scale(0.9, 1.1, 1.02),
    bodyMaterial
  );
  craniumMesh.castShadow = true;
  headNode.add(craniumMesh);

  // Sculpted athletic jaw & chin
  const jawMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.075, 0.08, 6).rotateY(Math.PI / 6),
    bodyMaterial
  );
  jawMesh.position.set(0, -0.065, 0.04);
  jawMesh.castShadow = true;
  headNode.add(jawMesh);

  // Futuristic Reflective Cyber Visor
  const visorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.125, 0.035, 0.06),
    visorMaterial
  );
  visorMesh.position.set(0, 0.015, 0.085);
  headNode.add(visorMesh);

  // --------------------------------------------------------------------------
  // UPPER LIMBS (Hierarchical Arm Chains: Shoulder -> Elbow -> Forearm -> Hand)
  // --------------------------------------------------------------------------
  const createArmChain = (isLeft: boolean) => {
    const side = isLeft ? -1 : 1;

    // Shoulder Joint Node (Child of Thorax)
    const shoulderNode = new THREE.Group();
    shoulderNode.position.set(side * 0.23, 0.20, 0);
    thoraxNode.add(shoulderNode);

    // 3-Head Deltoid Cap
    const deltCap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), muscleHighlightMaterial);
    deltCap.castShadow = true;
    shoulderNode.add(deltCap);
    registerMuscleMesh('shoulders', deltCap);

    const deltAnt = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), muscleHighlightMaterial);
    deltAnt.position.set(0, -0.02, 0.045);
    shoulderNode.add(deltAnt);
    registerMuscleMesh('shoulders', deltAnt);

    const deltPost = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), muscleHighlightMaterial);
    deltPost.position.set(0, -0.02, -0.045);
    shoulderNode.add(deltPost);
    registerMuscleMesh('shoulders', deltPost);

    const shoulderRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 10, 20), jointMaterial);
    shoulderRing.rotation.x = Math.PI / 2;
    shoulderNode.add(shoulderRing);

    // Upper Arm Node (Humerus)
    const upperArmNode = new THREE.Group();
    shoulderNode.add(upperArmNode);

    const upperArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.055, 0.28, 16),
      bodyMaterial
    );
    upperArmMesh.position.set(0, -0.14, 0);
    upperArmMesh.castShadow = true;
    upperArmNode.add(upperArmMesh);
    registerMuscleMesh('biceps', upperArmMesh);
    registerMuscleMesh('triceps', upperArmMesh);

    // Biceps Peak Belly (Anterior)
    const bicepBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 14, 12).scale(0.85, 1.35, 0.95),
      muscleHighlightMaterial
    );
    bicepBelly.position.set(0, -0.13, 0.04);
    bicepBelly.castShadow = true;
    upperArmNode.add(bicepBelly);
    registerMuscleMesh('biceps', bicepBelly);

    // Triceps Horseshoe Belly (Posterior)
    const tricepBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 14, 12).scale(0.9, 1.45, 0.95),
      muscleHighlightMaterial
    );
    tricepBelly.position.set(0, -0.13, -0.04);
    tricepBelly.castShadow = true;
    upperArmNode.add(tricepBelly);
    registerMuscleMesh('triceps', tricepBelly);

    // Elbow Joint Node (Positioned at bottom of upper arm: y = -0.28)
    const elbowJoint = new THREE.Group();
    elbowJoint.position.set(0, -0.28, 0);
    upperArmNode.add(elbowJoint);

    const elbowRing = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 14), jointMaterial);
    elbowRing.castShadow = true;
    elbowJoint.add(elbowRing);

    // Forearm Node (Child of Elbow Joint)
    const forearmNode = new THREE.Group();
    elbowJoint.add(forearmNode);

    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.042, 0.27, 16),
      bodyMaterial
    );
    forearmMesh.position.set(0, -0.135, 0);
    forearmMesh.castShadow = true;
    forearmNode.add(forearmMesh);

    // Brachioradialis muscle bulge
    const brachioMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 10).scale(0.8, 1.3, 0.85),
      muscleHighlightMaterial
    );
    brachioMesh.position.set(side * -0.02, -0.09, 0.03);
    forearmNode.add(brachioMesh);

    // Wrist Joint & Articulated Gripping Hand (Positioned at y = -0.27)
    const handJoint = new THREE.Group();
    handJoint.position.set(0, -0.27, 0);
    forearmNode.add(handJoint);

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.048), jointMaterial);
    palm.position.set(0, -0.03, 0);
    palm.castShadow = true;
    handJoint.add(palm);

    // Fingers curled naturally around bar
    const fingers = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.062, 12).rotateZ(Math.PI / 2),
      bodyMaterial
    );
    fingers.position.set(0, -0.045, 0.024);
    fingers.castShadow = true;
    handJoint.add(fingers);

    // Opposable thumb
    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.014, 0.035, 8, 10),
      bodyMaterial
    );
    thumb.position.set(side * 0.03, -0.02, 0.02);
    thumb.rotation.z = side * -Math.PI / 4;
    handJoint.add(thumb);

    return {
      shoulderNode,
      upperArmNode,
      bicepBelly,
      tricepBelly,
      elbowJoint,
      forearmNode,
      handJoint
    };
  };

  const leftArm = createArmChain(true);
  const rightArm = createArmChain(false);

  // --------------------------------------------------------------------------
  // LOWER LIMBS (Hierarchical Leg Chains: Hip -> Thigh -> Knee -> Shin -> Foot)
  // --------------------------------------------------------------------------
  const createLegChain = (isLeft: boolean) => {
    const side = isLeft ? -1 : 1;

    // Hip Joint Node (Child of Pelvis)
    const hipNode = new THREE.Group();
    hipNode.position.set(side * 0.13, -0.06, 0);
    pelvisNode.add(hipNode);

    // Thigh Node (Femur)
    const thighNode = new THREE.Group();
    hipNode.add(thighNode);

    const thighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.078, 0.42, 18),
      bodyMaterial
    );
    thighMesh.position.set(0, -0.21, 0);
    thighMesh.castShadow = true;
    thighNode.add(thighMesh);
    registerMuscleMesh('quads', thighMesh);
    registerMuscleMesh('hamstrings', thighMesh);

    // Vastus Medialis (Teardrop muscle above inner knee)
    const teardrop = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 10).scale(0.8, 1.2, 0.9),
      muscleHighlightMaterial
    );
    teardrop.position.set(side * -0.04, -0.34, 0.03);
    teardrop.castShadow = true;
    thighNode.add(teardrop);
    registerMuscleMesh('quads', teardrop);

    // Knee Joint Node (Positioned at bottom of thigh: y = -0.42)
    const kneeJoint = new THREE.Group();
    kneeJoint.position.set(0, -0.42, 0);
    thighNode.add(kneeJoint);

    const kneeCore = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 14), jointMaterial);
    kneeJoint.add(kneeCore);

    const patella = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.02, 14).rotateX(Math.PI / 2),
      bodyMaterial
    );
    patella.position.set(0, 0, 0.06);
    kneeJoint.add(patella);

    // Shin Node (Tibia & Calves - Child of Knee Joint)
    const shinNode = new THREE.Group();
    kneeJoint.add(shinNode);

    const shinMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.048, 0.42, 18),
      bodyMaterial
    );
    shinMesh.position.set(0, -0.21, 0);
    shinMesh.castShadow = true;
    shinNode.add(shinMesh);
    registerMuscleMesh('calves', shinMesh);

    // Gastrocnemius dual calf belly (Posterior bulge)
    const calfBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 12).scale(0.85, 1.5, 1.1),
      muscleHighlightMaterial
    );
    calfBelly.position.set(0, -0.17, -0.045);
    calfBelly.castShadow = true;
    shinNode.add(calfBelly);
    registerMuscleMesh('calves', calfBelly);

    // Ankle Joint & Sneaker (Positioned at y = -0.42)
    const ankleJoint = new THREE.Group();
    ankleJoint.position.set(0, -0.42, 0);
    shinNode.add(ankleJoint);

    const sneaker = new THREE.Group();
    ankleJoint.add(sneaker);

    // Outsole (flat lifting tread)
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.23), shoeSoleMaterial);
    sole.position.set(0, -0.0125, 0.04);
    sole.castShadow = true;
    sole.receiveShadow = true;
    sneaker.add(sole);

    // Midsole & Upper
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.055, 0.2), shoeUpperMaterial);
    upper.position.set(0, 0.025, 0.035);
    upper.castShadow = true;
    sneaker.add(upper);

    // Heel counter
    const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.048, 0.06, 12), shoeUpperMaterial);
    heel.position.set(0, 0.035, -0.045);
    sneaker.add(heel);

    // Accent racing stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.015, 0.12), shoeAccentMaterial);
    stripe.position.set(0, 0.025, 0.02);
    sneaker.add(stripe);

    return {
      hipNode,
      thighNode,
      kneeJoint,
      shinNode,
      ankleJoint,
      sneaker
    };
  };

  const leftLeg = createLegChain(true);
  const rightLeg = createLegChain(false);

  // --------------------------------------------------------------------------
  // EQUIPMENT: Olympic Barbell, Hex Dumbbells, Bench & Cable Bar
  // --------------------------------------------------------------------------
  const equipmentGroup = new THREE.Group();
  scene.add(equipmentGroup);

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.08
  });

  const knurlMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.35
  });

  // Olympic Barbell
  const barbellGroup = new THREE.Group();
  equipmentGroup.add(barbellGroup);

  const barMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 1.95, 20).rotateZ(Math.PI / 2),
    chromeMat
  );
  barMesh.castShadow = true;
  barbellGroup.add(barMesh);

  [-0.42, -0.22, 0.22, 0.42].forEach(pos => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.02, 14).rotateZ(Math.PI / 2), knurlMat);
    ring.position.x = pos;
    barbellGroup.add(ring);
  });

  const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.25 });
  const redRingMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.65 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });

  const plateGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.045, 32).rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.232, 0.232, 0.018, 32).rotateZ(Math.PI / 2);
  const collarGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.025, 18).rotateZ(Math.PI / 2);

  // Left Bumper Plate
  const leftPlate = new THREE.Mesh(plateGeo, plateMat);
  leftPlate.position.x = -0.74;
  leftPlate.castShadow = true;
  barbellGroup.add(leftPlate);
  const leftRim = new THREE.Mesh(rimGeo, redRingMat);
  leftRim.position.x = -0.74;
  barbellGroup.add(leftRim);
  const leftCollar = new THREE.Mesh(collarGeo, collarMat);
  leftCollar.position.x = -0.69;
  barbellGroup.add(leftCollar);

  // Right Bumper Plate
  const rightPlate = new THREE.Mesh(plateGeo, plateMat);
  rightPlate.position.x = 0.74;
  rightPlate.castShadow = true;
  barbellGroup.add(rightPlate);
  const rightRim = new THREE.Mesh(rimGeo, redRingMat);
  rightRim.position.x = 0.74;
  barbellGroup.add(rightRim);
  const rightCollar = new THREE.Mesh(collarGeo, collarMat);
  rightCollar.position.x = 0.69;
  barbellGroup.add(rightCollar);

  // Hex Dumbbells
  const dumbbellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.5 });
  const dbHeadGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.045, 6).rotateZ(Math.PI / 2);
  const dbBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 16).rotateZ(Math.PI / 2);

  const createHexDumbbell = () => {
    const db = new THREE.Group();
    const handle = new THREE.Mesh(dbBarGeo, chromeMat);
    handle.castShadow = true;
    db.add(handle);
    const h1 = new THREE.Mesh(dbHeadGeo, dumbbellMat);
    h1.position.x = -0.095;
    h1.castShadow = true;
    db.add(h1);
    const h2 = new THREE.Mesh(dbHeadGeo, dumbbellMat);
    h2.position.x = 0.095;
    h2.castShadow = true;
    db.add(h2);
    return db;
  };

  const leftDumbbell = createHexDumbbell();
  equipmentGroup.add(leftDumbbell);

  const rightDumbbell = createHexDumbbell();
  equipmentGroup.add(rightDumbbell);

  // Commercial Gym Bench
  const benchGroup = new THREE.Group();
  equipmentGroup.add(benchGroup);

  const leatherPadMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.42, metalness: 0.15 });
  const steelFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.8 });

  const benchPad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.065, 1.28), leatherPadMat);
  benchPad.position.set(0, 0.45, -0.05);
  benchPad.castShadow = true;
  benchPad.receiveShadow = true;
  benchGroup.add(benchPad);

  const headPad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.25), leatherPadMat);
  headPad.position.set(0, 0.45, -0.72);
  headPad.castShadow = true;
  benchGroup.add(headPad);

  const legFront = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 14), steelFrameMat);
  legFront.position.set(0, 0.225, 0.45);
  legFront.castShadow = true;
  benchGroup.add(legFront);

  const legRear = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 14), steelFrameMat);
  legRear.position.set(0, 0.225, -0.55);
  legRear.castShadow = true;
  benchGroup.add(legRear);

  const postGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.98, 16);
  const leftPost = new THREE.Mesh(postGeo, steelFrameMat);
  leftPost.position.set(-0.48, 0.49, -0.45);
  leftPost.castShadow = true;
  benchGroup.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, steelFrameMat);
  rightPost.position.set(0.48, 0.49, -0.45);
  rightPost.castShadow = true;
  benchGroup.add(rightPost);

  const jHookGeo = new THREE.BoxGeometry(0.06, 0.04, 0.08);
  const leftHook = new THREE.Mesh(jHookGeo, chromeMat);
  leftHook.position.set(-0.48, 0.84, -0.42);
  benchGroup.add(leftHook);

  const rightHook = new THREE.Mesh(jHookGeo, chromeMat);
  rightHook.position.set(0.48, 0.84, -0.42);
  benchGroup.add(rightHook);

  // Lat Pulldown Bar
  const cablePulldownBar = new THREE.Group();
  equipmentGroup.add(cablePulldownBar);
  const latBarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.38, 18).rotateZ(Math.PI / 2), chromeMat);
  latBarMesh.castShadow = true;
  cablePulldownBar.add(latBarMesh);

  const cableLineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  const cableLine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.2, 8), cableLineMat);
  cableLine.position.set(0, 0.6, 0);
  cablePulldownBar.add(cableLine);

  // Laser Trajectory Guide Line
  const trajectoryGroup = new THREE.Group();
  scene.add(trajectoryGroup);

  return {
    athleteGroup,
    pelvisNode,
    spineNode,
    thoraxNode,
    neckNode,
    headNode,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    equipmentGroup,
    barbellGroup,
    leftDumbbell,
    rightDumbbell,
    benchGroup,
    cablePulldownBar,
    trajectoryGroup,
    muscleMeshes
  };
}

// ============================================================================
// Biomechanical Kinematics Engine with Sound Physical Movement Logic
// ============================================================================

interface PoseUpdateParams {
  rig: NonNullable<ReturnType<typeof buildHierarchicalBiomechanicalMannequin>>;
  pattern: MotionPatternType;
  repPhase: number; // 0 (lockout/setup) -> 1 (stretch/deepest)
  primaryMuscle: MuscleGroupKey;
  secondaryMuscles: MuscleGroupKey[];
  showGlow: boolean;
  showGuides: boolean;
  visualMode: 'titanium' | 'hologram';
}

function updateBiomechanicalPose({
  rig,
  pattern,
  repPhase,
  primaryMuscle,
  secondaryMuscles,
  showGlow,
  showGuides,
  visualMode
}: PoseUpdateParams) {
  const {
    athleteGroup,
    pelvisNode,
    spineNode,
    thoraxNode,
    neckNode,
    headNode,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    barbellGroup,
    leftDumbbell,
    rightDumbbell,
    benchGroup,
    cablePulldownBar,
    muscleMeshes
  } = rig;

  // Equipment Visibility Defaults
  barbellGroup.visible = false;
  leftDumbbell.visible = false;
  rightDumbbell.visible = false;
  benchGroup.visible = false;
  cablePulldownBar.visible = false;

  // Trajectory Laser Line tracking
  let barPathX = 0;
  let barPathBottomY = 0.55;
  let barPathTopY = 0.95;
  let barPathZ = 0;

  // Reset all joint nodes to neutral anatomical rest pose
  athleteGroup.position.set(0, 0, 0);
  athleteGroup.rotation.set(0, 0, 0);

  pelvisNode.position.set(0, 0.95, 0);
  pelvisNode.rotation.set(0, 0, 0);

  spineNode.rotation.set(0, 0, 0);
  thoraxNode.rotation.set(0, 0, 0);
  neckNode.rotation.set(0, 0, 0);
  headNode.rotation.set(0, 0, 0);

  leftArm.shoulderNode.rotation.set(0, 0, 0);
  leftArm.upperArmNode.rotation.set(0, 0, 0);
  leftArm.elbowJoint.rotation.set(0, 0, 0);
  leftArm.forearmNode.rotation.set(0, 0, 0);
  leftArm.handJoint.rotation.set(0, 0, 0);

  rightArm.shoulderNode.rotation.set(0, 0, 0);
  rightArm.upperArmNode.rotation.set(0, 0, 0);
  rightArm.elbowJoint.rotation.set(0, 0, 0);
  rightArm.forearmNode.rotation.set(0, 0, 0);
  rightArm.handJoint.rotation.set(0, 0, 0);

  leftLeg.hipNode.rotation.set(0, 0, 0);
  leftLeg.thighNode.rotation.set(0, 0, 0);
  leftLeg.kneeJoint.rotation.set(0, 0, 0);
  leftLeg.shinNode.rotation.set(0, 0, 0);
  leftLeg.ankleJoint.rotation.set(0, 0, 0);

  rightLeg.hipNode.rotation.set(0, 0, 0);
  rightLeg.thighNode.rotation.set(0, 0, 0);
  rightLeg.kneeJoint.rotation.set(0, 0, 0);
  rightLeg.shinNode.rotation.set(0, 0, 0);
  rightLeg.ankleJoint.rotation.set(0, 0, 0);

  benchGroup.rotation.set(0, 0, 0);
  barbellGroup.rotation.set(0, 0, 0);

  // --------------------------------------------------------------------------
  // 1. BENCH PRESS & INCLINE PRESS
  // --------------------------------------------------------------------------
  if (pattern === 'bench_press' || pattern === 'incline_press') {
    const isIncline = pattern === 'incline_press';
    benchGroup.visible = true;
    barbellGroup.visible = true;

    const inclineAngle = isIncline ? -0.42 : 0;
    benchGroup.rotation.x = inclineAngle;

    // Athlete lies supine on bench pad:
    // Rotate athlete back 90 degrees so chest faces up (+Y)
    athleteGroup.position.set(0, 0.48, -0.05);
    athleteGroup.rotation.x = -Math.PI / 2 + inclineAngle;

    pelvisNode.position.set(0, 0.22, 0);

    // Legs planted firmly on the floor beside the bench
    leftLeg.hipNode.rotation.x = Math.PI / 2.3;
    leftLeg.kneeJoint.rotation.x = -Math.PI / 2.2;
    leftLeg.ankleJoint.rotation.x = 0.15;

    rightLeg.hipNode.rotation.x = Math.PI / 2.3;
    rightLeg.kneeJoint.rotation.x = -Math.PI / 2.2;
    rightLeg.ankleJoint.rotation.x = 0.15;

    // Press motion: repPhase 0 = Lockout at top, 1 = Bar on chest
    const press = (1 - repPhase);
    const armAbduct = 0.45 + repPhase * 0.35;
    const elbowFlex = repPhase * 1.45;

    // Shoulder abduction & tuck
    leftArm.shoulderNode.rotation.set(elbowFlex * 0.7, -0.3, -armAbduct);
    leftArm.elbowJoint.rotation.x = elbowFlex;

    rightArm.shoulderNode.rotation.set(elbowFlex * 0.7, 0.3, armAbduct);
    rightArm.elbowJoint.rotation.x = elbowFlex;

    // Barbell vertical path directly over sternum
    const barY = 0.58 + press * 0.34;
    const barZ = -0.22;
    barbellGroup.position.set(0, barY, barZ);
    barbellGroup.rotation.x = inclineAngle;

    barPathX = 0;
    barPathBottomY = 0.58;
    barPathTopY = 0.92;
    barPathZ = barZ;

  // --------------------------------------------------------------------------
  // 2. SQUAT
  // --------------------------------------------------------------------------
  } else if (pattern === 'squat') {
    barbellGroup.visible = true;

    // Squat Depth (0 = standing tall, 1 = deep parallel squat)
    const depth = repPhase;
    const hipAngle = depth * 1.55;    // Hip hinge forward
    const kneeAngle = depth * 1.95;   // Knee bend forward
    const ankleAngle = depth * 0.45;  // Dorsiflexion
    const torsoLean = depth * 0.65;   // Torso counter-balance lean

    // Drop pelvis naturally while feet remain grounded at y = 0
    const dropY = depth * 0.42;
    const hipBack = depth * 0.22;
    pelvisNode.position.set(0, 0.95 - dropY, -hipBack);
    pelvisNode.rotation.x = torsoLean;

    // Head stays neutral looking ahead
    headNode.rotation.x = -torsoLean * 0.7;

    // Left and Right Legs in synchronized squat kinematics
    leftLeg.hipNode.rotation.x = hipAngle;
    leftLeg.kneeJoint.rotation.x = -kneeAngle;
    leftLeg.ankleJoint.rotation.x = ankleAngle;

    rightLeg.hipNode.rotation.x = hipAngle;
    rightLeg.kneeJoint.rotation.x = -kneeAngle;
    rightLeg.ankleJoint.rotation.x = ankleAngle;

    // Arms hold the barbell on upper traps
    leftArm.shoulderNode.rotation.set(1.2, -0.3, -0.7);
    leftArm.elbowJoint.rotation.x = 2.1;

    rightArm.shoulderNode.rotation.set(1.2, 0.3, 0.7);
    rightArm.elbowJoint.rotation.x = 2.1;

    // Barbell rests on rear deltoids/traps
    const barY = 1.48 - dropY * 0.95;
    const barZ = -hipBack + Math.sin(torsoLean) * 0.12;
    barbellGroup.position.set(0, barY, barZ);

    barPathX = 0;
    barPathBottomY = 1.05;
    barPathTopY = 1.48;
    barPathZ = 0.0;

  // --------------------------------------------------------------------------
  // 3. DEADLIFT
  // --------------------------------------------------------------------------
  } else if (pattern === 'deadlift') {
    barbellGroup.visible = true;

    // Deadlift: 0 = standing lockout, 1 = hip hinge down to floor
    const hinge = repPhase;
    const hipAngle = hinge * 1.35;
    const kneeAngle = hinge * 0.65;
    const torsoAngle = hinge * 1.15;

    const dropY = hinge * 0.36;
    const hipBack = hinge * 0.24;
    pelvisNode.position.set(0, 0.95 - dropY, -hipBack);
    pelvisNode.rotation.x = torsoAngle;

    headNode.rotation.x = -torsoAngle * 0.6; // Eyes forward

    leftLeg.hipNode.rotation.x = hipAngle;
    leftLeg.kneeJoint.rotation.x = -kneeAngle;
    leftLeg.ankleJoint.rotation.x = hinge * 0.15;

    rightLeg.hipNode.rotation.x = hipAngle;
    rightLeg.kneeJoint.rotation.x = -kneeAngle;
    rightLeg.ankleJoint.rotation.x = hinge * 0.15;

    // Arms hang straight down gripping the bar
    leftArm.shoulderNode.rotation.set(-torsoAngle * 0.85, 0, -0.15);
    leftArm.elbowJoint.rotation.x = 0.1;

    rightArm.shoulderNode.rotation.set(-torsoAngle * 0.85, 0, 0.15);
    rightArm.elbowJoint.rotation.x = 0.1;

    // Barbell travels vertically along the shins
    const barY = 0.78 - hinge * 0.52;
    const barZ = 0.14;
    barbellGroup.position.set(0, barY, barZ);

    barPathX = 0;
    barPathBottomY = 0.26;
    barPathTopY = 0.78;
    barPathZ = barZ;

  // --------------------------------------------------------------------------
  // 4. BENT-OVER ROW
  // --------------------------------------------------------------------------
  } else if (pattern === 'row') {
    barbellGroup.visible = true;

    // Torso hinged forward at ~45°
    const hingeTorso = 0.75;
    pelvisNode.position.set(0, 0.88, -0.16);
    pelvisNode.rotation.x = hingeTorso;
    headNode.rotation.x = -hingeTorso * 0.6;

    leftLeg.hipNode.rotation.x = 0.85;
    leftLeg.kneeJoint.rotation.x = -0.45;
    rightLeg.hipNode.rotation.x = 0.85;
    rightLeg.kneeJoint.rotation.x = -0.45;

    // Row pull motion (0 = fully pulled to waist, 1 = arms extended)
    const pull = (1 - repPhase);
    const elbowFlex = pull * 1.55;
    const shoulderBack = pull * 0.65;

    leftArm.shoulderNode.rotation.set(-hingeTorso + shoulderBack, 0, -0.2);
    leftArm.elbowJoint.rotation.x = elbowFlex;

    rightArm.shoulderNode.rotation.set(-hingeTorso + shoulderBack, 0, 0.2);
    rightArm.elbowJoint.rotation.x = elbowFlex;

    const barY = 0.62 + pull * 0.32;
    const barZ = 0.18 - pull * 0.08;
    barbellGroup.position.set(0, barY, barZ);

    barPathX = 0;
    barPathBottomY = 0.62;
    barPathTopY = 0.94;
    barPathZ = 0.14;

  // --------------------------------------------------------------------------
  // 5. OVERHEAD PRESS
  // --------------------------------------------------------------------------
  } else if (pattern === 'overhead_press') {
    barbellGroup.visible = true;

    // repPhase 0 = Lockout overhead, 1 = Bar at clavicle
    const press = (1 - repPhase);
    const shoulderAngle = 1.35 + press * 1.45;
    const elbowFlex = (1 - press) * 1.85;

    leftArm.shoulderNode.rotation.set(shoulderAngle, 0, -0.2);
    leftArm.elbowJoint.rotation.x = elbowFlex;

    rightArm.shoulderNode.rotation.set(shoulderAngle, 0, 0.2);
    rightArm.elbowJoint.rotation.x = elbowFlex;

    const barY = 1.32 + press * 0.65;
    const barZ = press > 0.6 ? 0.04 : 0.16;
    barbellGroup.position.set(0, barY, barZ);

    barPathX = 0;
    barPathBottomY = 1.32;
    barPathTopY = 1.97;
    barPathZ = 0.08;

  // --------------------------------------------------------------------------
  // 6. BICEP CURL
  // --------------------------------------------------------------------------
  } else if (pattern === 'bicep_curl') {
    leftDumbbell.visible = true;
    rightDumbbell.visible = true;

    // repPhase 0 = Lockout at bottom, 1 = Curled to chest
    const curl = (1 - repPhase);
    const curlAngle = 0.15 + curl * 2.2;

    // Upper arm pinned at side
    leftArm.shoulderNode.rotation.set(0.1, 0, -0.08);
    leftArm.elbowJoint.rotation.x = curlAngle;

    rightArm.shoulderNode.rotation.set(0.1, 0, 0.08);
    rightArm.elbowJoint.rotation.x = curlAngle;

    // Dumbbell positions tracking hands
    const handY = 0.85 + Math.sin(curlAngle) * 0.26;
    const handZ = 0.05 + Math.cos(curlAngle) * -0.15 + (1 - Math.cos(curlAngle)) * 0.15;
    leftDumbbell.position.set(-0.28, handY, handZ);
    rightDumbbell.position.set(0.28, handY, handZ);

    barPathX = -0.28;
    barPathBottomY = 0.77;
    barPathTopY = 1.33;
    barPathZ = 0.12;

  // --------------------------------------------------------------------------
  // 7. TRICEP EXTENSION
  // --------------------------------------------------------------------------
  } else if (pattern === 'tricep_extension') {
    leftDumbbell.visible = true;
    rightDumbbell.visible = true;

    // Overhead Extension: Upper arms raised high, forearms extend
    const ext = (1 - repPhase); // 1 = full lockout overhead, 0 = deep stretch behind neck
    const extFlex = (1 - ext) * 2.1;

    leftArm.shoulderNode.rotation.set(2.85, 0, -0.15);
    leftArm.elbowJoint.rotation.x = -extFlex;

    rightArm.shoulderNode.rotation.set(2.85, 0, 0.15);
    rightArm.elbowJoint.rotation.x = -extFlex;

    const handY = 1.60 + ext * 0.35;
    const handZ = -0.15 + ext * 0.18;
    leftDumbbell.position.set(-0.20, handY, handZ);
    rightDumbbell.position.set(0.20, handY, handZ);

    barPathX = 0.2;
    barPathBottomY = 1.48;
    barPathTopY = 1.98;
    barPathZ = 0.05;

  // --------------------------------------------------------------------------
  // 8. LATERAL RAISE
  // --------------------------------------------------------------------------
  } else if (pattern === 'lateral_raise') {
    leftDumbbell.visible = true;
    rightDumbbell.visible = true;

    const raise = (1 - repPhase);
    const raiseAngle = 0.15 + raise * 1.35;

    leftArm.shoulderNode.rotation.set(0.15, 0, -raiseAngle);
    leftArm.elbowJoint.rotation.x = 0.2;

    rightArm.shoulderNode.rotation.set(0.15, 0, raiseAngle);
    rightArm.elbowJoint.rotation.x = 0.2;

    const handX = 0.24 + Math.sin(raiseAngle) * 0.52;
    const handY = 1.35 - Math.cos(raiseAngle) * 0.52;
    leftDumbbell.position.set(-handX, handY, 0.05);
    rightDumbbell.position.set(handX, handY, 0.05);

    barPathX = 0.55;
    barPathBottomY = 0.85;
    barPathTopY = 1.35;
    barPathZ = 0.05;

  // --------------------------------------------------------------------------
  // 9. LAT PULLDOWN
  // --------------------------------------------------------------------------
  } else if (pattern === 'pull_down') {
    cablePulldownBar.visible = true;

    // Seated posture
    pelvisNode.position.set(0, 0.55, 0);
    pelvisNode.rotation.x = -0.18; // Slight lean back

    leftLeg.hipNode.rotation.x = 1.45;
    leftLeg.kneeJoint.rotation.x = -1.45;
    rightLeg.hipNode.rotation.x = 1.45;
    rightLeg.kneeJoint.rotation.x = -1.45;

    const pull = repPhase; // 0 = arms extended up, 1 = bar pulled to chest
    const shoulderAngle = 2.7 - pull * 1.25;
    const elbowFlex = pull * 1.75;

    leftArm.shoulderNode.rotation.set(shoulderAngle, 0, -0.65);
    leftArm.elbowJoint.rotation.x = elbowFlex;

    rightArm.shoulderNode.rotation.set(shoulderAngle, 0, 0.65);
    rightArm.elbowJoint.rotation.x = elbowFlex;

    const barY = 1.95 - pull * 0.65;
    cablePulldownBar.position.set(0, barY, 0.08);

    barPathX = 0;
    barPathBottomY = 1.3;
    barPathTopY = 1.95;
    barPathZ = 0.08;

  // --------------------------------------------------------------------------
  // 10. CALF RAISE & DEFAULT ATHLETIC STANCE
  // --------------------------------------------------------------------------
  } else if (pattern === 'calf_raise') {
    barbellGroup.visible = true;

    const raise = (1 - repPhase) * 0.12;
    pelvisNode.position.set(0, 0.95 + raise, 0);
    leftLeg.ankleJoint.rotation.x = (1 - repPhase) * 0.45;
    rightLeg.ankleJoint.rotation.x = (1 - repPhase) * 0.45;

    leftArm.shoulderNode.rotation.set(1.2, -0.3, -0.7);
    leftArm.elbowJoint.rotation.x = 2.1;
    rightArm.shoulderNode.rotation.set(1.2, 0.3, 0.7);
    rightArm.elbowJoint.rotation.x = 2.1;

    barbellGroup.position.set(0, 1.48 + raise, 0);

    barPathX = 0;
    barPathBottomY = 1.48;
    barPathTopY = 1.60;
    barPathZ = 0.0;

  } else {
    // Default athletic ready posture
    leftArm.shoulderNode.rotation.set(0.12, 0, -0.15);
    leftArm.elbowJoint.rotation.x = 0.35;
    rightArm.shoulderNode.rotation.set(0.12, 0, 0.15);
    rightArm.elbowJoint.rotation.x = 0.35;
  }

  // --------------------------------------------------------------------------
  // Laser Trajectory Guide
  // --------------------------------------------------------------------------
  rig.trajectoryGroup.visible = showGuides;
  if (showGuides) {
    rig.trajectoryGroup.clear();

    const laserMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.06,
      gapSize: 0.03
    });

    const pts = [
      new THREE.Vector3(barPathX, barPathBottomY, barPathZ),
      new THREE.Vector3(barPathX, barPathTopY, barPathZ)
    ];

    const laserGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(laserGeo, laserMat);
    line.computeLineDistances();
    rig.trajectoryGroup.add(line);

    const topBead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    topBead.position.set(barPathX, barPathTopY, barPathZ);
    rig.trajectoryGroup.add(topBead);

    const bottomBead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    bottomBead.position.set(barPathX, barPathBottomY, barPathZ);
    rig.trajectoryGroup.add(bottomBead);
  }

  // --------------------------------------------------------------------------
  // Dynamic Muscle Heatmap Glow Shader / Materials
  // --------------------------------------------------------------------------
  const baseTitaniumColor = new THREE.Color(visualMode === 'hologram' ? 0x0f2942 : 0x475569);
  const baseHologramGlow = new THREE.Color(0x0284c7);
  const primaryGlowColor = new THREE.Color(0xff2222); // Vibrant fiery crimson neon
  const secondaryGlowColor = new THREE.Color(0x00d2ff); // Electric cyan synergist

  // Pulsing contraction tension
  const tension = 0.35 + Math.sin(repPhase * Math.PI) * 0.65;

  muscleMeshes.forEach((meshes, groupKey) => {
    const isPrimary = groupKey === primaryMuscle;
    const isSecondary = secondaryMuscles.includes(groupKey);

    meshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      if (showGlow && isPrimary) {
        mat.color.copy(primaryGlowColor);
        mat.emissive.copy(primaryGlowColor);
        mat.emissiveIntensity = 0.6 + tension * 1.6;
      } else if (showGlow && isSecondary) {
        mat.color.copy(secondaryGlowColor);
        mat.emissive.copy(secondaryGlowColor);
        mat.emissiveIntensity = 0.35 + tension * 0.85;
      } else if (visualMode === 'hologram') {
        mat.color.copy(baseTitaniumColor);
        mat.emissive.copy(baseHologramGlow);
        mat.emissiveIntensity = 0.22;
      } else {
        mat.color.copy(baseTitaniumColor);
        mat.emissive.setRGB(0, 0, 0);
        mat.emissiveIntensity = 0;
      }
    });
  });
}
