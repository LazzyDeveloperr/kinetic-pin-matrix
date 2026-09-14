import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ColorTheme, MatrixConfig } from '../types.ts';
import { getTheme } from '../utils/themes.ts';
import { createStudioEnvironmentMap } from '../utils/studioEnv.ts';
import { soundEngine } from '../utils/audio.ts';

interface PinMatrixCanvasProps {
  config: MatrixConfig;
  onBallMove?: (x: number, z: number, speed: number) => void;
  onStatsUpdate?: (fps: number, pinCount: number) => void;
  cameraView: 'video' | 'top' | 'isometric' | 'side';
}

interface Shockwave {
  x: number;
  z: number;
  startTime: number;
  amplitude: number;
  speed: number;
  wavelength: number;
}

// Pre-computed cosine curve LUT for the depression crater profile
const CRATER_LUT_SIZE = 512;
const CRATER_LUT = new Float32Array(CRATER_LUT_SIZE);
for (let i = 0; i < CRATER_LUT_SIZE; i++) {
  const u = i / (CRATER_LUT_SIZE - 1); // 0 to 1
  const curve = Math.cos(u * (Math.PI * 0.5));
  CRATER_LUT[i] = Math.pow(curve, 1.85);
}

// Pre-computed Color LUT (256 RGB float entries = 768 floats)
const COLOR_LUT_SIZE = 256;
const colorLUT = new Float32Array(COLOR_LUT_SIZE * 3);

function buildColorLUT(theme: ColorTheme) {
  const cSurf = new THREE.Color(theme.surfaceColor);
  const cRim = new THREE.Color(theme.rimColor);
  const cMid = new THREE.Color(theme.midColor);
  const cDeep = new THREE.Color(theme.deepColor);
  const tempC = new THREE.Color();

  for (let i = 0; i < COLOR_LUT_SIZE; i++) {
    const ratio = i / (COLOR_LUT_SIZE - 1);
    if (ratio <= 0.02) {
      tempC.copy(cSurf);
    } else if (ratio < 0.28) {
      tempC.copy(cSurf).lerp(cRim, ratio / 0.28);
    } else if (ratio < 0.68) {
      tempC.copy(cRim).lerp(cMid, (ratio - 0.28) / 0.4);
    } else {
      tempC.copy(cMid).lerp(cDeep, (ratio - 0.68) / 0.32);
    }
    const idx = i * 3;
    colorLUT[idx] = tempC.r;
    colorLUT[idx + 1] = tempC.g;
    colorLUT[idx + 2] = tempC.b;
  }
}

export const PinMatrixCanvas: React.FC<PinMatrixCanvasProps> = ({
  config,
  onBallMove,
  onStatsUpdate,
  cameraView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;

  // Shockwaves queue
  const shockwavesRef = useRef<Shockwave[]>([]);

  // Function to add a shockwave
  const triggerShockwave = (x: number, z: number) => {
    shockwavesRef.current.push({
      x,
      z,
      startTime: performance.now(),
      amplitude: configRef.current.maxDepression * 0.8,
      speed: 12,
      wavelength: 2.2,
    });
    soundEngine.playPinClick(1.2);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    let currentThemeId = configRef.current.themeId;
    let currentTheme = getTheme(currentThemeId);
    scene.background = new THREE.Color(currentTheme.backgroundColor);
    buildColorLUT(currentTheme);

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 200);

    const setCameraPreset = (view: string) => {
      if (view === 'video') {
        camera.position.set(0, 22, 22);
        camera.lookAt(0, -1.2, 0);
      } else if (view === 'top') {
        camera.position.set(0, 32, 0.01);
        camera.lookAt(0, 0, 0);
      } else if (view === 'isometric') {
        camera.position.set(20, 22, 20);
        camera.lookAt(0, -1.0, 0);
      } else if (view === 'side') {
        camera.position.set(0, 10, 28);
        camera.lookAt(0, -1.5, 0);
      }
    };
    setCameraPreset(cameraView);

    // 2. High-performance WebGL Renderer with optimized DPR & shadow buffer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap DPR at 1.75 to preserve 60-120 FPS on 3x retina displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map for metallic ball
    const envTexture = createStudioEnvironmentMap(renderer);
    scene.environment = envTexture;

    // 4. Studio Lighting (1024x1024 shadow map instead of 2048 for 4x faster shadow rendering)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd1d5db, 0.45);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainKeyLight.position.set(16, 28, 18);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.camera.near = 5;
    mainKeyLight.shadow.camera.far = 80;
    const shadowD = 22;
    mainKeyLight.shadow.camera.left = -shadowD;
    mainKeyLight.shadow.camera.right = shadowD;
    mainKeyLight.shadow.camera.top = shadowD;
    mainKeyLight.shadow.camera.bottom = -shadowD;
    mainKeyLight.shadow.bias = -0.0002;
    mainKeyLight.shadow.radius = 2.0;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.8);
    fillLight.position.set(-18, 18, -14);
    scene.add(fillLight);

    // 5. Build Pin Matrix with Hexagonal Packing
    const rows = configRef.current.gridRows;
    const cols = configRef.current.gridCols;
    const totalPins = rows * cols;
    const cylRadius = configRef.current.cylinderRadius;
    const cylHeight = configRef.current.cylinderHeight;

    const dx = cylRadius * 2 * configRef.current.spacingFactor;
    const dz = dx * (Math.sqrt(3) / 2);
    const halfWidth = ((cols - 1) * dx) / 2;
    const halfHeight = ((rows - 1) * dz) / 2;

    // 18 segments is smooth while saving 31% vertices over 26
    const pinGeometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 18);
    const pinMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.08,
    });

    const instancedPins = new THREE.InstancedMesh(pinGeometry, pinMaterial, totalPins);
    instancedPins.castShadow = true;
    instancedPins.receiveShadow = true;
    scene.add(instancedPins);

    // Pin position & state arrays
    const pinRestX = new Float32Array(totalPins);
    const pinRestZ = new Float32Array(totalPins);
    const pinCurrentY = new Float32Array(totalPins);
    const pinVelocities = new Float32Array(totalPins);

    const baseY = -cylHeight / 2;
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color(currentTheme.surfaceColor);

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2 === 0 ? 0 : 0.5) * dx;
      const pz = r * dz - halfHeight;

      for (let c = 0; c < cols; c++) {
        const px = c * dx + rowOffset - halfWidth;
        pinRestX[idx] = px;
        pinRestZ[idx] = pz;
        pinCurrentY[idx] = 0;
        pinVelocities[idx] = 0;

        dummy.position.set(px, baseY, pz);
        dummy.updateMatrix();
        instancedPins.setMatrixAt(idx, dummy.matrix);
        instancedPins.setColorAt(idx, tempColor);
        idx++;
      }
    }
    instancedPins.instanceMatrix.needsUpdate = true;
    if (instancedPins.instanceColor) instancedPins.instanceColor.needsUpdate = true;

    // Direct access to underlying TypedArrays for zero-allocation updates
    const matrixArray = instancedPins.instanceMatrix.array as Float32Array;
    const colorArray = instancedPins.instanceColor!.array as Float32Array;

    // 6. Metallic Rolling Sphere (36x36 segments is optimal)
    const ballRadius = configRef.current.ballRadius;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 36, 36);
    const ballMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.98,
      roughness: 0.08,
      color: 0xffffff,
      envMapIntensity: 2.0,
    });

    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);

    // 7. Ball State & Physics
    let ballX = 0;
    let ballZ = 0;
    let ballY = 0;
    let ballVx = 0;
    let ballVz = 0;
    let isDragging = false;
    let autoRollTime = 0;

    const boundX = halfWidth - ballRadius * 1.4;
    const boundZ = halfHeight - ballRadius * 1.4;

    // 8. Interaction Handling via Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersect = new THREE.Vector3();

    let lastPointerTime = performance.now();

    // Subtle parallax tilt for camera
    let targetCamX = 0;
    let targetCamZ = 22;

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
        const distToBall = Math.hypot(planeIntersect.x - ballX, planeIntersect.z - ballZ);

        if (distToBall < ballRadius * 2.2) {
          isDragging = true;
          ballVx = 0;
          ballVz = 0;
          lastPointerTime = performance.now();
        } else {
          if (e.shiftKey || e.button === 2) {
            triggerShockwave(planeIntersect.x, planeIntersect.z);
          } else {
            const dx = planeIntersect.x - ballX;
            const dz = planeIntersect.z - ballZ;
            const len = Math.hypot(dx, dz);
            if (len > 0.1) {
              const impulse = Math.min(len * 3.5, 14);
              ballVx = (dx / len) * impulse;
              ballVz = (dz / len) * impulse;
              soundEngine.playPinClick(0.8);
            }
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDragging && cameraView === 'video') {
        targetCamX = mouse.x * 2.5;
        targetCamZ = 22 + mouse.y * 1.5;
      }

      if (isDragging) {
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
          const now = performance.now();
          const dt = Math.max((now - lastPointerTime) / 1000, 0.001);

          const clampedX = Math.max(-boundX, Math.min(boundX, planeIntersect.x));
          const clampedZ = Math.max(-boundZ, Math.min(boundZ, planeIntersect.z));

          ballVx = ((clampedX - ballX) / dt) * 0.45;
          ballVz = ((clampedZ - ballZ) / dt) * 0.45;

          ballX = clampedX;
          ballZ = clampedZ;
          lastPointerTime = now;
        }
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        isDragging = false;
        const speed = Math.hypot(ballVx, ballVz);
        if (speed > 25) {
          ballVx = (ballVx / speed) * 25;
          ballVz = (ballVz / speed) * 25;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(floorPlane, planeIntersect)) {
        triggerShockwave(planeIntersect.x, planeIntersect.z);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('contextmenu', handleContextMenu);

    const updateThemeMaterials = (theme: ColorTheme) => {
      scene.background = new THREE.Color(theme.backgroundColor);
      if (theme.ballMaterial === 'gold') {
        ballMaterial.color.set(0xffd700);
        ballMaterial.roughness = 0.12;
        ballMaterial.metalness = 0.95;
      } else if (theme.ballMaterial === 'matte-white') {
        ballMaterial.color.set(0xf8fafc);
        ballMaterial.roughness = 0.22;
        ballMaterial.metalness = 0.05;
      } else {
        ballMaterial.color.set(0xffffff);
        ballMaterial.roughness = 0.08;
        ballMaterial.metalness = 0.98;
      }
    };
    updateThemeMaterials(currentTheme);

    // FPS counter tracking
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // 9. Main Animation & Physics Loop
    let animationId: number;
    let lastTime = performance.now();
    const rollAxis = new THREE.Vector3();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Track FPS and update direct DOM elements for 0 React re-renders
      frameCount++;
      if (now - lastFpsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        const fpsEl = document.getElementById('live-fps-value');
        if (fpsEl) fpsEl.textContent = `${fps}`;
        onStatsUpdate?.(fps, totalPins);
        frameCount = 0;
        lastFpsTime = now;
      }

      const cfg = configRef.current;

      // Check if theme changed
      if (cfg.themeId !== currentThemeId) {
        currentThemeId = cfg.themeId;
        currentTheme = getTheme(currentThemeId);
        buildColorLUT(currentTheme);
        updateThemeMaterials(currentTheme);
      }

      // Sound update
      soundEngine.setMuted(!cfg.soundEnabled);

      // Auto-Roll or Physics Update
      if (cfg.autoRoll && !isDragging) {
        autoRollTime += dt * cfg.autoRollSpeed;
        const ampX = boundX * 0.72;
        const ampZ = boundZ * 0.65;

        let targetX = 0;
        let targetZ = 0;

        if (cfg.autoRollPattern === 'figure8') {
          targetX = Math.sin(autoRollTime * 0.9) * ampX;
          targetZ = Math.sin(autoRollTime * 1.8) * ampZ * 0.75;
        } else if (cfg.autoRollPattern === 'circle') {
          targetX = Math.cos(autoRollTime * 0.8) * ampX * 0.8;
          targetZ = Math.sin(autoRollTime * 0.8) * ampZ * 0.8;
        } else if (cfg.autoRollPattern === 'spiral') {
          const r = (0.35 + 0.45 * Math.sin(autoRollTime * 0.25)) * ampX;
          targetX = Math.cos(autoRollTime * 1.0) * r;
          targetZ = Math.sin(autoRollTime * 1.0) * r * (ampZ / ampX);
        } else {
          targetX = Math.sin(autoRollTime * 0.9) * ampX;
          targetZ = Math.cos(autoRollTime * 0.6) * ampZ;
        }

        const invDt = 1 / Math.max(dt, 0.001);
        ballVx = (targetX - ballX) * invDt;
        ballVz = (targetZ - ballZ) * invDt;
        ballX = targetX;
        ballZ = targetZ;
      } else if (!isDragging) {
        ballX += ballVx * dt;
        ballZ += ballVz * dt;

        const frictionFactor = Math.pow(cfg.friction, dt * 60);
        ballVx *= frictionFactor;
        ballVz *= frictionFactor;

        if (ballX > boundX) {
          ballX = boundX;
          ballVx = -ballVx * 0.65;
          soundEngine.playPinClick(Math.abs(ballVx));
        } else if (ballX < -boundX) {
          ballX = -boundX;
          ballVx = -ballVx * 0.65;
          soundEngine.playPinClick(Math.abs(ballVx));
        }

        if (ballZ > boundZ) {
          ballZ = boundZ;
          ballVz = -ballVz * 0.65;
          soundEngine.playPinClick(Math.abs(ballVz));
        } else if (ballZ < -boundZ) {
          ballZ = -boundZ;
          ballVz = -ballVz * 0.65;
          soundEngine.playPinClick(Math.abs(ballVz));
        }
      }

      // Ball rolling rotation physics
      const speed = Math.hypot(ballVx, ballVz);
      if (speed > 0.001) {
        const rollAngle = (speed * dt) / ballRadius;
        rollAxis.set(ballVz / speed, 0, -ballVx / speed);
        ballMesh.rotateOnWorldAxis(rollAxis, rollAngle);
      }

      soundEngine.updateRollingSound(speed);
      onBallMove?.(ballX, ballZ, speed);

      // Ball Y sits nestled into the depression crater
      ballY = -cfg.maxDepression * 0.78 + ballRadius * 0.42;
      ballMesh.position.set(ballX, ballY, ballZ);

      // Camera smooth parallax in video view
      if (cameraView === 'video') {
        camera.position.x += (targetCamX - camera.position.x) * 0.04;
        camera.position.z += (targetCamZ - camera.position.z) * 0.04;
        camera.lookAt(0, -1.2, 0);
      }

      // 10. High-Performance Pin Matrix & Depression Updates
      const maxDep = cfg.maxDepression;
      const invMaxDep = 1 / maxDep;
      const craterR = cfg.craterRadius;
      const craterRSq = craterR * craterR;
      const invCraterR = 1 / craterR;
      const activeBoundingDist = craterR + 1.5;
      const springK = cfg.springStiffness;
      const dampFactor = Math.pow(cfg.springDamping, dt * 60);

      // Filter active shockwaves
      const activeShockwaves = shockwavesRef.current.filter((sw) => {
        const age = (now - sw.startTime) * 0.001;
        return age < 2.0;
      });
      shockwavesRef.current = activeShockwaves;
      const hasShockwaves = activeShockwaves.length > 0;

      const lutFactor = (CRATER_LUT_SIZE - 1) * invCraterR;

      // Iterate through pins with spatial bounds culling
      for (let i = 0; i < totalPins; i++) {
        const px = pinRestX[i];
        const pz = pinRestZ[i];
        const diffX = px - ballX;
        const diffZ = pz - ballZ;

        // Fast spatial bounding box rejection for resting pins
        const isOutsideBallArea =
          diffX > activeBoundingDist ||
          diffX < -activeBoundingDist ||
          diffZ > activeBoundingDist ||
          diffZ < -activeBoundingDist;

        if (isOutsideBallArea && !hasShockwaves) {
          if (pinCurrentY[i] === 0 && pinVelocities[i] === 0) {
            // Already completely at rest, zero computation needed!
            continue;
          }
        }

        let targetDepression = 0;

        if (!isOutsideBallArea) {
          const distSq = diffX * diffX + diffZ * diffZ;
          if (distSq < craterRSq) {
            const dist = Math.sqrt(distSq);
            const lutIdx = (dist * lutFactor) | 0;
            targetDepression = maxDep * CRATER_LUT[lutIdx];
          }
        }

        // Add shockwaves if present
        if (hasShockwaves) {
          for (let s = 0; s < activeShockwaves.length; s++) {
            const sw = activeShockwaves[s];
            const age = (now - sw.startTime) * 0.001;
            const currentRadius = age * sw.speed;
            const swDist = Math.hypot(px - sw.x, pz - sw.z);
            const diff = Math.abs(swDist - currentRadius);

            if (diff < sw.wavelength) {
              const wavePhase = (diff / sw.wavelength) * Math.PI;
              const waveAmp = sw.amplitude * Math.exp(-age * 2.2) * Math.cos(wavePhase);
              targetDepression += waveAmp;
            }
          }
        }

        // Spring physics
        const targetY = -targetDepression;
        const currentY = pinCurrentY[i];
        const force = (targetY - currentY) * springK;
        let vel = (pinVelocities[i] + force * dt) * dampFactor;
        let newY = currentY + vel * dt;

        // Snapping resting pins to exact 0 to allow bounding rejection next frame
        if (targetDepression === 0 && Math.abs(newY) < 0.0006 && Math.abs(vel) < 0.001) {
          newY = 0;
          vel = 0;
        }

        pinVelocities[i] = vel;
        pinCurrentY[i] = newY;

        // Direct typed array write for translation Y
        matrixArray[(i << 4) + 13] = baseY + newY;

        // Direct typed array write for Color from LUT
        const depthRatio = Math.min(Math.max(-newY * invMaxDep, 0), 1);
        const lutColorIdx = ((depthRatio * 255) | 0) * 3;
        const i3 = i * 3;
        colorArray[i3] = colorLUT[lutColorIdx];
        colorArray[i3 + 1] = colorLUT[lutColorIdx + 1];
        colorArray[i3 + 2] = colorLUT[lutColorIdx + 2];
      }

      // Signal GPU buffer updates
      instancedPins.instanceMatrix.needsUpdate = true;
      if (instancedPins.instanceColor) instancedPins.instanceColor.needsUpdate = true;

      // Render the frame
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('contextmenu', handleContextMenu);
      renderer.dispose();
      pinGeometry.dispose();
      pinMaterial.dispose();
      ballGeometry.dispose();
      ballMaterial.dispose();
      envTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraView]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" id="canvas-wrapper">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        id="pin-matrix-three-container"
      />
    </div>
  );
};
