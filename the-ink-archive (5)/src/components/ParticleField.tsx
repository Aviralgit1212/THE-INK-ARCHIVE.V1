/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Sparkles, Camera, CameraOff, ChevronRight } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number | null;
  targetY: number | null;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  alpha: number;
  baseAlpha?: number;
  color: { r: number; g: number; b: number };
  angle: number;
  speed: number;
  z: number; // 3D depth coordinate for parallax and cinematic focus (0.3 to 2.5)
  startX?: number;
  startY?: number;
  startVx?: number;
  startVy?: number;
  startColorR?: number;
  startColorG?: number;
  startColorB?: number;
  startAlpha?: number;
}

export default function ParticleField() {
  const { routerState, transitionPhase, navigateTo } = useLibrary();
  const currentRoute = routerState.currentRoute;
  const collection = routerState.routeParams.collection;

  const currentRouteRef = useRef(currentRoute);
  const collectionRef = useRef(collection);
  const transitionPhaseRef = useRef(transitionPhase);

  currentRouteRef.current = currentRoute;
  collectionRef.current = collection;
  transitionPhaseRef.current = transitionPhase;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Interactive state
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [fistProgress, setFistProgress] = useState(0); // 0 to 1
  
  // Particle System Mode: 'ambient' | 'compress' | 'title' | 'dissolve'
  const [systemMode, setSystemMode] = useState<'ambient' | 'compress' | 'title' | 'dissolve'>('ambient');
  
  const localModeRef = useRef<'ambient' | 'compress' | 'title' | 'dissolve'>('ambient');
  const progressFistRef = useRef<number>(0);
  const titleTimerRef = useRef<number>(0);
  const dissolveTimerRef = useRef<number>(0);
  const entryMethodRef = useRef<'gesture' | 'button'>('gesture');
  const compressStartRef = useRef<number | null>(null);
  const titleStartRef = useRef<number | null>(null);
  const dissolveStartRef = useRef<number | null>(null);

  const triggerTitleSequence = (method: 'gesture' | 'button') => {
    entryMethodRef.current = method;
    localModeRef.current = 'title';
    setSystemMode('title');
    titleTimerRef.current = 0;
    dissolveTimerRef.current = 0;
    titleStartRef.current = Date.now();
    dissolveStartRef.current = null;
    
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const tPoints = titlePointsRef.current;
    const scale = Math.min(screenW * 0.85, 800);
    
    particlesRef.current.forEach((p, idx) => {
      if (tPoints.length > 0) {
        const ptIdx = idx % tPoints.length;
        p.targetX = screenW / 2 + tPoints[ptIdx].x * scale;
        p.targetY = screenH / 2 + tPoints[ptIdx].y * (scale * 0.3);
      }
      p.startX = p.x;
      p.startY = p.y;
      p.startVx = p.vx;
      p.startVy = p.vy;
      p.startColorR = p.color.r;
      p.startColorG = p.color.g;
      p.startColorB = p.color.b;
      p.startAlpha = p.alpha;
    });
  };
  
  // Mouse position ref
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, isDown: false });
  // Hand tracking coordinate ref (normalized 0 to 1)
  const handRef = useRef({ x: 0.5, y: 0.5, isFist: false, rotation: 0, scale: 1, active: false });
  // Attractor movement history for velocity/inertia transfer
  const attractorPrevRef = useRef({ x: 0, y: 0, initialized: false });
  const attractorVelRef = useRef({ x: 0, y: 0 });
  
  const particlesRef = useRef<Particle[]>([]);
  const titlePointsRef = useRef<{ x: number; y: number }[]>([]);
  
  // Cinematic Dolly Camera state
  const cameraRef = useRef({
    x: 0,
    y: 0,
    z: 1.0, // zoom/FOV scale
    angle: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 1.0,
    targetAngle: 0,
  });

  // Ambient lighting parameters (Rim lighting, Bloom & Fog intensity shifts)
  const lightingRef = useRef({
    ambientIntensity: 0.15,
    fogDensity: 0.4,
    bloomGlow: 20,
    lightIntensityTimer: 0,
  });

  // Initial quote delay
  const [quoteVisible, setQuoteVisible] = useState(false);

  useEffect(() => {
    setQuoteVisible(true);
  }, []);

  // Set up mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target && (e.target as HTMLElement).closest('button, select, input, video, a, .webcam-preview, svg, path, select-none')) {
        return;
      }
      mouseRef.current.isDown = true;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target && (e.target as HTMLElement).closest('button, select, input, video, a, .webcam-preview, svg, path, select-none')) {
        return;
      }
      mouseRef.current.isDown = true;
      if (e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
      }
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // MediaPipe hand tracking Setup
  useEffect(() => {
    if (!isWebcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      handRef.current.active = false;
      setHandDetected(false);
      return;
    }

    setIsCameraLoading(true);
    let activeStream: MediaStream | null = null;

    const setupCameraAndTracking = async () => {
      try {
        if (!(window as any).Hands) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
        activeStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const HandsClass = (window as any).Hands;
        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setHandDetected(true);
            const landmarks = results.multiHandLandmarks[0];
            const center = landmarks[9];
            handRef.current.x = 1 - center.x; // Flip horizontally
            handRef.current.y = center.y;
            handRef.current.active = true;

            const indexCurled = landmarks[8].y > landmarks[6].y;
            const middleCurled = landmarks[12].y > landmarks[10].y;
            const ringCurled = landmarks[16].y > landmarks[14].y;
            const pinkyCurled = landmarks[20].y > landmarks[18].y;

            const isFist = indexCurled && middleCurled && ringCurled && pinkyCurled;
            handRef.current.isFist = isFist;

            const wrist = landmarks[0];
            const angle = Math.atan2(center.y - wrist.y, center.x - wrist.x);
            handRef.current.rotation = angle;

            const p5 = landmarks[5];
            const p17 = landmarks[17];
            const dist = Math.hypot(p5.x - p17.x, p5.y - p17.y);
            handRef.current.scale = dist * 5;
          } else {
            setHandDetected(false);
            handRef.current.active = false;
          }
        });

        const cameraUtils = (window as any).Camera;
        if (cameraUtils && videoRef.current) {
          const camera = new cameraUtils(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && isWebcamActive) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240
          });
          camera.start();
        }

        setIsCameraLoading(false);
      } catch (err) {
        console.error("Camera access or hand tracking setup failed:", err);
        setIsCameraLoading(false);
        setIsWebcamActive(false);
        setCameraError("Camera blocked. Try opening the app in a new tab!");
      }
    };

    setupCameraAndTracking();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isWebcamActive]);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Generate particles & offscreen text coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateTitlePoints();
    };

    const generateTitlePoints = () => {
      const offscreen = document.createElement('canvas');
      const oCtx = offscreen.getContext('2d');
      if (!oCtx) return;

      offscreen.width = 1000;
      offscreen.height = 250;

      oCtx.fillStyle = '#000000';
      oCtx.fillRect(0, 0, offscreen.width, offscreen.height);
      
      oCtx.fillStyle = '#ffffff';
      oCtx.font = 'bold 72px "Space Grotesk", sans-serif';
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillText('THE INK ARCHIVE', offscreen.width / 2, offscreen.height / 2);

      const imgData = oCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const points: { x: number; y: number }[] = [];
      const step = 4;

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const idx = (y * offscreen.width + x) * 4;
          if (imgData.data[idx] > 128) {
            points.push({
              x: (x - offscreen.width / 2) / offscreen.width,
              y: (y - offscreen.height / 2) / offscreen.height
            });
          }
        }
      }
      titlePointsRef.current = points;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize 6000 layered particles with depth (z index)
    const particleCount = 6000;
    const tempParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const alphaVal = Math.random() * 0.5 + 0.15;
      
      tempParticles.push({
        x,
        y,
        originX: x,
        originY: y,
        targetX: null,
        targetY: null,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        size: Math.random() * 1.6 + 0.4,
        baseSize: Math.random() * 1.6 + 0.4,
        alpha: alphaVal,
        baseAlpha: alphaVal,
        color: { r: 6, g: 182, b: 212 },
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.003,
        z: Math.random() * 2.2 + 0.3, // Depth coordinate: Foreground (> 1.8), Midground (1.0-1.8), Background (< 1.0)
      });
    }
    particlesRef.current = tempParticles;

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Main cinematic render and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const scrollOffset = window.scrollY || 0;

      const activeRoute = currentRouteRef.current;
      const activeCollection = collectionRef.current;
      const activeTransitionPhase = transitionPhaseRef.current;

      let localMode = localModeRef.current;
      let progressFist = progressFistRef.current;
      let titleTimer = titleTimerRef.current;
      let dissolveTimer = dissolveTimerRef.current;

      // Reset overlay back to ambient if route changes from landing
      if (activeRoute !== '/' && localMode !== 'ambient') {
        localMode = 'ambient';
        localModeRef.current = 'ambient';
        setSystemMode('ambient');
        progressFist = 0;
        setFistProgress(0);
        compressStartRef.current = null;
      }

      // Slow dynamic shifts in ambient light intensity (Cinematic lighting)
      const lighting = lightingRef.current;
      lighting.lightIntensityTimer += 0.003;
      lighting.ambientIntensity = 0.15 + Math.sin(lighting.lightIntensityTimer) * 0.05; // slowly breaths

      // Render dark void background with soft trailing
      ctx.fillStyle = `rgba(6, 6, 8, ${0.12 + Math.cos(lighting.lightIntensityTimer) * 0.03})`;
      ctx.fillRect(0, 0, screenW, screenH);

      const mouse = mouseRef.current;
      const hand = handRef.current;

      // Smooth inputs with inertia
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Handle Entrance Sequence inputs (click hold or webcam fist)
      const isInputActive = mouse.isDown || (hand.active && hand.isFist);
      const isCompressedPressed = (activeRoute === '/') && isInputActive;

      if (localMode === 'ambient') {
        if (isCompressedPressed) {
          localMode = 'compress';
          setSystemMode('compress');
          compressStartRef.current = Date.now();
        }
      } else if (localMode === 'compress') {
        if (!isInputActive) {
          localMode = 'ambient';
          setSystemMode('ambient');
          progressFist = 0;
          setFistProgress(0);
          compressStartRef.current = null;
        } else {
          if (compressStartRef.current === null) {
            compressStartRef.current = Date.now();
          }
          const elapsed = Date.now() - compressStartRef.current;
          progressFist = Math.min(elapsed / 5000, 1.0); // Exactly 5.0 seconds total holding time
          setFistProgress(progressFist);
          
          if (progressFist >= 1.0) {
            triggerTitleSequence('gesture');
            localMode = 'title';
            titleTimer = 0;
            compressStartRef.current = null;
          }
        }
      } else if (localMode === 'title') {
        if (titleStartRef.current === null) {
          titleStartRef.current = Date.now();
        }
        const elapsed = Date.now() - titleStartRef.current;
        titleTimer = Math.round(elapsed / (1000 / 60)); // Simulate frame counts for rendering progress
        
        // Exactly 1.0 seconds stable hold for "THE INK ARCHIVE" title
        if (elapsed > 1000) {
          localMode = 'dissolve';
          setSystemMode('dissolve');
          dissolveTimer = 0;
          dissolveStartRef.current = Date.now();
          particlesRef.current.forEach(p => {
            p.targetX = null;
            p.targetY = null;
            
            // Gentle natural dispersal velocity
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2.2 + 0.4;
            p.vx = Math.cos(angle) * spd;
            p.vy = Math.sin(angle) * spd;
            
            p.startX = p.x;
            p.startY = p.y;
            p.startColorR = p.color.r;
            p.startColorG = p.color.g;
            p.startColorB = p.color.b;
            p.startAlpha = p.alpha;
          });
        }
      } else if (localMode === 'dissolve') {
        if (dissolveStartRef.current === null) {
          dissolveStartRef.current = Date.now();
        }
        const elapsed = Date.now() - dissolveStartRef.current;
        dissolveTimer = Math.round(elapsed / (1000 / 60)); // Simulate frame count for rendering progress
        
        // Exactly 2.0 seconds dissolve transition (Total title + dissolve = 3.0 seconds load time to page)
        if (elapsed > 2000) {
          navigateTo('/library');
          localMode = 'ambient';
          setSystemMode('ambient');
          progressFist = 0;
          setFistProgress(0);
          titleTimer = 0;
          dissolveTimer = 0;
          titleStartRef.current = null;
          dissolveStartRef.current = null;
        }
      }

      // Interactive Attractor coordinates
      const attractorX = hand.active ? hand.x * screenW : (mouse.x !== -1000 ? mouse.x : screenW / 2);
      const attractorY = hand.active ? hand.y * screenH : (mouse.y !== -1000 ? mouse.y : screenH / 2);

      // Track attractor velocity for fluid wind and vortex effects
      if (!attractorPrevRef.current.initialized) {
        attractorPrevRef.current.x = attractorX;
        attractorPrevRef.current.y = attractorY;
        attractorPrevRef.current.initialized = true;
      }

      const rawAttractorVx = attractorX - attractorPrevRef.current.x;
      const rawAttractorVy = attractorY - attractorPrevRef.current.y;
      attractorVelRef.current.x += (rawAttractorVx - attractorVelRef.current.x) * 0.15;
      attractorVelRef.current.y += (rawAttractorVy - attractorVelRef.current.y) * 0.15;

      attractorPrevRef.current.x = attractorX;
      attractorPrevRef.current.y = attractorY;

      // Camera dolly target computation based on active Route Chamber
      const cam = cameraRef.current;
      let targetColor = { r: 6, g: 182, b: 212 }; // Default: cyan ink
      let speedMultiplier = 1.0;
      let noiseMultiplier = 1.0;

      if (activeRoute === '/') {
        targetColor = { r: 6, g: 182, b: 212 }; // Cyan
        if (localMode === 'dissolve') {
          cam.targetX = 0;
          cam.targetY = 0;
          cam.targetZ = 3.5;
          cam.targetAngle = 0.04;
          speedMultiplier = 2.2;
        } else {
          cam.targetX = 0;
          cam.targetY = 0;
          cam.targetZ = 1.0;
          cam.targetAngle = 0;
          speedMultiplier = 1.0;
        }
      } else if (activeRoute === '/library') {
        targetColor = { r: 139, g: 92, b: 246 }; // Elegant Royal Violet
        cam.targetX = -80;
        cam.targetY = 40;
        cam.targetZ = 1.15; // Slow forward drift
        cam.targetAngle = -0.015;
      } else if (activeRoute === '/library/[collection]') {
        // Adapt atmospheres per chamber as specified
        if (activeCollection === 'poems') {
          // quiet and emotional: soft deep rose / violet
          targetColor = { r: 236, g: 72, b: 153 };
          speedMultiplier = 0.55;
          noiseMultiplier = 0.6;
          cam.targetX = 120;
          cam.targetY = -60;
          cam.targetZ = 1.25;
          cam.targetAngle = 0.02;
        } else if (activeCollection === 'stories') {
          // mysterious: dim amber-gold, high camera inertia
          targetColor = { r: 217, g: 119, b: 6 };
          speedMultiplier = 1.1;
          noiseMultiplier = 1.4;
          cam.targetX = -180;
          cam.targetY = 100;
          cam.targetZ = 0.9;
          cam.targetAngle = -0.04;
        } else if (activeCollection === 'philosophy') {
          // vast and cosmic: cyan-blue, cosmic deep drift
          targetColor = { r: 37, g: 99, b: 235 };
          speedMultiplier = 1.5;
          noiseMultiplier = 1.8;
          cam.targetX = 40;
          cam.targetY = 130;
          cam.targetZ = 1.55;
          cam.targetAngle = 0.05;
        } else if (activeCollection === 'journal') {
          // intimate and personal: warm amber candlelight glow
          targetColor = { r: 245, g: 158, b: 11 };
          speedMultiplier = 0.65;
          noiseMultiplier = 0.75;
          cam.targetX = 0;
          cam.targetY = -120;
          cam.targetZ = 1.35;
          cam.targetAngle = -0.008;
        } else if (activeCollection === 'essays') {
          // clean and intellectual: slate/monochromatic blue, structured
          targetColor = { r: 148, g: 163, b: 184 };
          speedMultiplier = 0.6;
          noiseMultiplier = 0.35;
          cam.targetX = -100;
          cam.targetY = -40;
          cam.targetZ = 1.05;
          cam.targetAngle = 0;
        }
      } else if (activeRoute.startsWith('/read')) {
        // Reading focus mode: slow down, dim particles, camera pulls back to clear center
        targetColor = { r: 51, g: 65, b: 85 };
        speedMultiplier = 0.2;
        noiseMultiplier = 0.25;
        cam.targetX = 0;
        cam.targetY = 180;
        cam.targetZ = 0.75;
        cam.targetAngle = 0;
      } else if (activeRoute === '/archive') {
        // Chronology mode: vertical falling stardust
        targetColor = { r: 109, g: 40, b: 217 };
        speedMultiplier = 0.85;
        cam.targetX = 70;
        cam.targetY = -30;
        cam.targetZ = 1.2;
        cam.targetAngle = 0.008;
      } else {
        targetColor = { r: 71, g: 85, b: 105 };
      }

      // Modulate parameters during Phased Transition Mathematics
      if (activeTransitionPhase === 'phase1') {
        speedMultiplier *= 2.8;
        noiseMultiplier *= 2.4;
        cam.targetZ += 0.25;
        cam.targetAngle += 0.08;
      } else if (activeTransitionPhase === 'phase2') {
        speedMultiplier *= 4.2;
        noiseMultiplier *= 3.2;
        cam.targetZ = 2.0; // Deep traveling dolly zoom
        cam.targetAngle -= 0.12;
      } else if (activeTransitionPhase === 'phase3') {
        speedMultiplier *= 0.45;
        noiseMultiplier *= 0.45;
      }

      // Easing camera dolly coordinates with critical damping physics
      cam.x += (cam.targetX - cam.x) * 0.035;
      cam.y += (cam.targetY - cam.y) * 0.035;
      cam.z += (cam.targetZ - cam.z) * 0.035;
      cam.angle += (cam.targetAngle - cam.angle) * 0.035;

      // Compute extremely subtle breathing cycles for the dolly observer
      const breathingX = Math.sin(lighting.lightIntensityTimer * 1.2) * 14;
      const breathingY = Math.cos(lighting.lightIntensityTimer * 1.5) * 14;
      const breathingAngle = Math.sin(lighting.lightIntensityTimer * 0.8) * 0.004;

      // Update and Draw Particles
      const particles = particlesRef.current;

      particles.forEach((p, idx) => {
        if (localMode === 'ambient') {
          // Brownian motion & multi-layered Perlin wave noise
          const timeVal = Date.now() * 0.0005 * speedMultiplier;
          const noiseScale = 0.005;
          const noiseX = Math.sin(p.x * noiseScale + timeVal) * Math.cos(p.y * noiseScale - timeVal) * 0.12 * noiseMultiplier;
          const noiseY = Math.cos(p.x * noiseScale - timeVal) * Math.sin(p.y * noiseScale + timeVal) * 0.12 * noiseMultiplier;
          p.vx += noiseX;
          p.vy += noiseY;

          // Pull towards hand/mouse attractor with gravitational drop-off
          const dx = attractorX - p.x;
          const dy = attractorY - p.y;
          const dist = Math.hypot(dx, dy);

          const pullForce = 0.015 * Math.min(dist * 0.03, 5);
          p.vx += (dx / (dist + 1)) * pullForce;
          p.vy += (dy / (dist + 1)) * pullForce;

          // Fluid momentum wind transfer from the cursor movement
          const motionInfluence = 1 / (1 + dist * 0.002);
          p.vx += attractorVelRef.current.x * motionInfluence * 0.22;
          p.vy += attractorVelRef.current.y * motionInfluence * 0.22;

          // Swirling vortex physics around attractor, scaled by depth
          if (dist > 12) {
            const swirlDir = hand.active ? (hand.rotation || 0.3) : 0.32;
            const swirlStrength = 0.05 * (1 / (1 + dist * 0.0012)) * (1 / p.z);
            p.vx += (-dy / dist) * swirlDir * swirlStrength;
            p.vy += (dx / dist) * swirlDir * swirlStrength;
          }

          // Damping/friction for critically settled inertia
          p.vx *= 0.95;
          p.vy *= 0.95;

          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Edge wrapping
          const margin = 35;
          if (p.x < -margin) p.x = screenW + margin;
          if (p.x > screenW + margin) p.x = -margin;
          if (p.y < -margin) p.y = screenH + margin;
          if (p.y > screenH + margin) p.y = -margin;

          // Blend particle colors to current chamber theme
          p.color.r += (targetColor.r - p.color.r) * 0.08;
          p.color.g += (targetColor.g - p.color.g) * 0.08;
          p.color.b += (targetColor.b - p.color.b) * 0.08;
          p.size = p.baseSize;

        } else if (localMode === 'compress') {
          // Compress tight like gravitational sinkhole
          const dx = attractorX - p.x;
          const dy = attractorY - p.y;
          const dist = Math.hypot(dx, dy);
          const pull = 0.06 + progressFist * 0.16;
          p.vx += (dx / Math.max(dist, 10)) * pull;
          p.vy += (dy / Math.max(dist, 10)) * pull;

          const angle = Math.atan2(dy, dx) + Math.PI / 2 + 0.12;
          p.vx += Math.cos(angle) * (1.2 + progressFist * 4.5);
          p.vy += Math.sin(angle) * (1.2 + progressFist * 4.5);

          p.vx *= 0.86;
          p.vy *= 0.86;

          p.x += p.vx;
          p.y += p.vy;

          const fireR = 245; 
          const fireG = 158 - (1 - progressFist) * 55;
          const fireB = 11 + (1 - progressFist) * 160;
          p.color.r += (fireR - p.color.r) * 0.12;
          p.color.g += (fireG - p.color.g) * 0.12;
          p.color.b += (fireB - p.color.b) * 0.12;
          p.size = p.baseSize * (1 + progressFist * 1.8);

        } else if (localMode === 'title') {
          const progress = Math.min(titleTimer / 90, 1);
          // Cubic ease-out curve for cinematic smooth landing
          const t = 1 - Math.pow(1 - progress, 3);

          if (p.targetX !== null && p.targetY !== null && p.startX !== undefined && p.startY !== undefined) {
            p.x = p.startX + (p.targetX - p.startX) * t;
            p.y = p.startY + (p.targetY - p.startY) * t;
            p.vx = (p.startVx || 0) * (1 - t);
            p.vy = (p.startVy || 0) * (1 - t);
          }

          // Transition color to elegant metallic gold
          const goldR = 224;
          const goldG = 176;
          const goldB = 45;

          const startR = p.startColorR !== undefined ? p.startColorR : p.color.r;
          const startG = p.startColorG !== undefined ? p.startColorG : p.color.g;
          const startB = p.startColorB !== undefined ? p.startColorB : p.color.b;

          p.color.r = startR + (goldR - startR) * t;
          p.color.g = startG + (goldG - startG) * t;
          p.color.b = startB + (goldB - startB) * t;

          // Stable gold shimmering highlight (extremely subtle elegant gold shimmer, but NO spatial movement!)
          const shim = Math.sin(p.x * 0.15 + Date.now() * 0.003);
          if (progress >= 1.0) {
            p.color.r = goldR + shim * 15;
            p.color.g = goldG + shim * 10;
            p.color.b = goldB + shim * 5;
          }

          // Slightly enrich particle sizes for stable lettering text density
          p.size = p.baseSize * (1 + 0.25 * t);

          // 95% of particles fade to 0 opacity during the title phase
          const isDisappearing = (idx % 20 !== 0);
          if (isDisappearing) {
            const startAlpha = p.startAlpha !== undefined ? p.startAlpha : p.alpha;
            p.alpha = startAlpha * (1 - t);
          } else {
            // The remaining 5% of particles drift gracefully as stardust around edges of target shape
            const startAlpha = p.startAlpha !== undefined ? p.startAlpha : p.alpha;
            p.alpha = startAlpha + (0.8 - startAlpha) * t;

            if (progress >= 1.0 && p.targetX !== null && p.targetY !== null) {
              const driftTime = Date.now() * 0.001 + idx;
              p.x = p.targetX + Math.sin(driftTime) * 10;
              p.y = p.targetY + Math.cos(driftTime) * 8;
              
              p.color.r = goldR + Math.sin(driftTime * 2) * 20;
              p.color.g = goldG + Math.cos(driftTime * 2) * 15;
              p.color.b = goldB;
            }
          }

        } else if (localMode === 'dissolve') {
          const tDissolve = Math.min(dissolveTimer / 120, 1);

          // Add elegant Brownian wind noise to physical movement during dissolution
          const timeVal = Date.now() * 0.0005 * speedMultiplier;
          const noiseScale = 0.005;
          const noiseX = Math.sin(p.x * noiseScale + timeVal) * Math.cos(p.y * noiseScale - timeVal) * 0.12 * noiseMultiplier;
          const noiseY = Math.cos(p.x * noiseScale - timeVal) * Math.sin(p.y * noiseScale + timeVal) * 0.12 * noiseMultiplier;
          p.vx += noiseX;
          p.vy += noiseY;

          // Apply gentle physics damping
          p.vx *= 0.96;
          p.vy *= 0.96;

          // Push particles outwards horizontally to part like a curtain
          const dxFromCenter = p.x - screenW / 2;
          p.vx += Math.sign(dxFromCenter || 1) * 0.35 * tDissolve;

          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Edge wrapping
          const margin = 35;
          if (p.x < -margin) p.x = screenW + margin;
          if (p.x > screenW + margin) p.x = -margin;
          if (p.y < -margin) p.y = screenH + margin;
          if (p.y > screenH + margin) p.y = -margin;

          // Smoothly blend color from gold back to active targetColor (cyan)
          const goldR = 224;
          const goldG = 176;
          const goldB = 45;

          p.color.r = goldR + (targetColor.r - goldR) * tDissolve;
          p.color.g = goldG + (targetColor.g - goldG) * tDissolve;
          p.color.b = goldB + (targetColor.b - goldB) * tDissolve;

          // Smoothly restore size to baseSize
          p.size = p.baseSize * (1.25 - 0.25 * tDissolve);

          // Smoothly restore alpha to its original base value
          const startAlpha = p.startAlpha !== undefined ? p.startAlpha : 0.95;
          const origAlpha = p.baseAlpha !== undefined ? p.baseAlpha : 0.3;
          p.alpha = startAlpha + (origAlpha - startAlpha) * tDissolve;
        }

        // Apply Dolly Camera projection coordinates (3D Spatial Parallax)
        // Foreground particles slide faster creating 3D parallax layers
        const depthFactor = 1 / p.z;
        const camScaledX = cam.x + breathingX;
        // Include Scroll Choreography! Scrolling moves the dolly camera vertically
        const camScaledY = cam.y + breathingY - (scrollOffset * 0.38);

        // Apply camera translate + parallax offset
        const projX = p.x + camScaledX * (1 - p.z);
        const projY = p.y + camScaledY * (1 - p.z);

        // Apply camera rotational corrections and zoom scale (cam.z)
        const rx = (projX - screenW / 2) * cam.z;
        const ry = (projY - screenH / 2) * cam.z;
        const currentRot = cam.angle + breathingAngle;
        const finalX = screenW / 2 + (rx * Math.cos(currentRot) - ry * Math.sin(currentRot));
        const finalY = screenH / 2 + (rx * Math.sin(currentRot) + ry * Math.cos(currentRot));

        // Skip drawing if outside screen boundaries to optimize draw calls
        if (finalX < -60 || finalX > screenW + 60 || finalY < -60 || finalY > screenH + 60) {
          return;
        }

        // Draw particle with customized size and soft glow based on its depth layer
        ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.alpha * (p.z > 1.8 ? 0.7 : 1)})`;
        ctx.beginPath();
        
        // Deep foreground elements are larger and styled with subtle cinematic blur/glow
        if (p.z > 1.9) {
          ctx.arc(finalX, finalY, p.size * 2.2, 0, Math.PI * 2);
          ctx.shadowColor = `rgb(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)})`;
          ctx.shadowBlur = 12;
        } else {
          ctx.arc(finalX, finalY, p.size * p.z, 0, Math.PI * 2);
          ctx.shadowBlur = 0; // Disable shadow for far particles for ultra performance
        }
        ctx.fill();
      });

      // Reset shadow blur to not affect future draws
      ctx.shadowBlur = 0;

      localModeRef.current = localMode;
      progressFistRef.current = progressFist;
      titleTimerRef.current = titleTimer;
      dissolveTimerRef.current = dissolveTimer;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentRoute, collection, transitionPhase]);

  const handleToggleWebcam = () => {
    setCameraError(null);
    setIsWebcamActive(prev => !prev);
  };

  return (
    <div id="particle-field-container" className="absolute inset-0 w-full h-full overflow-hidden select-none">
      {/* 3D WebGL/2D Canvas Rendering Context */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full z-0 pointer-events-none" />

      {/* Hidden Webcam for Gestures */}
      <video
        ref={videoRef}
        className="hidden"
        width="320"
        height="240"
        playsInline
        muted
      />

      {/* Entrance Experience UI Overlay: Render ONLY on Homepage '/' */}
      {currentRoute === '/' && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between items-center px-6 py-12 bg-black/30 backdrop-blur-[1px]">
          {/* Header Branding */}
          <div className="w-full max-w-6xl flex justify-between items-center relative">
            <div className="flex items-center gap-2 font-display font-semibold tracking-[0.25em] text-[10px] uppercase text-ink-accent-cyan animate-pulse">
              <Sparkles className="w-4 h-4 text-ink-accent-cyan" />
              THE INK ARCHIVE
            </div>
            
            <div className="flex flex-col items-end gap-2 relative">
              <button
                id="webcam-toggle-btn"
                onClick={handleToggleWebcam}
                className={`flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase border rounded-full px-5 py-2.5 transition-all cursor-pointer ${
                  isWebcamActive 
                    ? 'bg-ink-accent-cyan/15 border-ink-accent-cyan text-ink-accent-cyan glow-card-cyan' 
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                {isCameraLoading ? (
                  <span className="w-2.5 h-2.5 border-2 border-ink-accent-cyan border-t-transparent rounded-full animate-spin"></span>
                ) : isWebcamActive ? (
                  <Camera className="w-3.5 h-3.5" />
                ) : (
                  <CameraOff className="w-3.5 h-3.5" />
                )}
                {isWebcamActive ? 'Gestures: ACTIVE' : 'Enable Webcam Gestures'}
              </button>

              {cameraError && (
                <div className="absolute top-12 right-0 max-w-xs bg-red-950/90 border border-red-500/40 text-red-200 text-[9px] font-mono uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-lg backdrop-blur-md animate-pulse text-right z-30 whitespace-nowrap">
                  ⚠️ {cameraError}
                </div>
              )}
            </div>
          </div>

          {/* Center Immersive Quote or State Displays */}
          <div className="flex flex-col items-center justify-center text-center max-w-3xl my-auto select-none">
            {systemMode === 'ambient' && (
              <div className={`transition-all duration-1000 transform ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                {/* Letters physically arriving typography */}
                <p className="font-serif italic text-2xl md:text-3xl text-slate-200 leading-relaxed font-light px-4 pl-[51px]">
                  {'"The library is a cathedral where lonely minds talk to each other across centuries."'.split('').map((char, index) => (
                    <span 
                      key={index} 
                      className="char-arrival"
                      style={{ animationDelay: `${index * 0.015}s` }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </p>
                <div className="h-[1px] w-28 bg-gradient-to-r from-transparent via-ink-accent-cyan/30 to-transparent mx-auto my-8" />
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">
                  An Immersive Literary Journey
                </p>
              </div>
            )}

            {systemMode === 'compress' && (
              <div className="space-y-4">
                <h2 className="font-display uppercase tracking-[0.25em] text-sm text-ink-amber glow-text-purple">
                  CONVENTING COHERENCE
                </h2>
                <p className="text-slate-400 font-serif italic text-xs">
                  Condensing the stardust ink... hold to enter.
                </p>
                
                {/* Circular critically damped loader */}
                <div className="mt-8 flex justify-center items-center">
                  <div className="relative w-18 h-18 rounded-full border border-slate-900 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-ink-amber transition-all duration-100 ease-out glow-card-cyan"
                      style={{ clipPath: `inset(${(1 - fistProgress) * 100}% 0px 0px 0px)` }}
                    />
                    <span className="text-xs font-mono text-ink-amber">{Math.round(fistProgress * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {(systemMode === 'title' || systemMode === 'dissolve') && (
              <div 
                className="space-y-3 transition-opacity duration-300 ease-out"
                style={{ 
                  opacity: systemMode === 'dissolve' 
                    ? Math.max(0, 1 - dissolveTimerRef.current / 45)
                    : Math.max(0, Math.min(1, titleTimerRef.current / 30))
                }}
              >
                <h1 className="font-display font-bold text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#fce085] via-[#e0b02d] to-[#9a7b1c] tracking-[0.25em] drop-shadow-[0_0_15px_rgba(224,176,45,0.25)] select-none">
                  THE INK ARCHIVE
                </h1>
                <p className="text-[10px] font-mono tracking-[0.35em] text-slate-500 uppercase">
                  Entering Chamber I
                </p>
              </div>
            )}
          </div>

          {/* Footer guides and skip triggers */}
          <div className="w-full max-w-xl flex flex-col items-center gap-6 text-center">
            {isWebcamActive && handDetected && (
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-accent-cyan bg-ink-accent-cyan/10 border border-ink-accent-cyan/25 px-5 py-2.5 rounded-lg animate-pulse">
                ✋ Hand presence detected. Close your hand to compress ink and enter.
              </div>
            )}

            {isWebcamActive && !handDetected && !isCameraLoading && (
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-950/50 border border-slate-900/60 px-5 py-2.5 rounded-lg">
                ⌛ Align your hand in camera view to interact.
              </div>
            )}

            {!isWebcamActive && (
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                💡 Drag cursor to shift the wind. <span className="text-ink-accent-cyan">Hold left-click</span> to crystallize the ink.
              </p>
            )}

            <div className="flex gap-4 items-center mt-2">
              {systemMode === 'ambient' && (
                <button
                  id="manual-enter-btn"
                  onClick={() => triggerTitleSequence('button')}
                  className="flex items-center gap-2 group font-display text-[10px] uppercase tracking-[0.25em] text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/80 px-8 py-3.5 rounded-full cursor-pointer transition-all shadow-lg"
                >
                  Enter the Archive
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Small Floating Webcam Preview (PIP) */}
      {isWebcamActive && !isCameraLoading && (
        <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full border border-slate-800 bg-ink-black/90 overflow-hidden glow-card-cyan z-20 flex items-center justify-center">
          <video
            ref={(el) => {
              if (el && videoRef.current) {
                el.srcObject = videoRef.current.srcObject;
                el.play().catch(() => {});
              }
            }}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          {handDetected && (
            <div className="absolute inset-0 border-2 border-ink-accent-cyan rounded-full animate-ping pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
}
