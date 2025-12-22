
import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { AppMode } from '../types';
import { generateTreePositions, generateScatterPositions, generateTextPositions, generateGreetingPositions, generateGreetingPositionsFromImage, generateImagePositionsAndColors, generateDynamicWishPositions, PARTICLE_CONFIG } from '../utils/geometryGenerator';

interface InstancedParticlesProps {
  mode: AppMode;
  uploadedImageUrl?: string | null;
  treeStartTime?: number;
  isExploding?: boolean;
  wishText?: string | null;
}

const STE_LOGO_URL = "https://res.cloudinary.com/ddyxnhxz3/image/upload/v1766380809/logo_ste_1_qeggwn.svg";

const InstancedParticles: React.FC<InstancedParticlesProps> = ({ mode, uploadedImageUrl, treeStartTime, isExploding = false, wishText = null }) => {
  const meshRefs = [
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null)
  ];
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const PARTICLE_COUNT_INTERNAL = PARTICLE_CONFIG.count;
  const shapeCount = 5;
  const countPerShape = Math.floor(PARTICLE_COUNT_INTERNAL / shapeCount);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometries = useMemo(() => [
    new THREE.SphereGeometry(1, 6, 6),
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.CylinderGeometry(1, 1, 1, 3),
    new THREE.CylinderGeometry(1, 1, 1, 5),
    new THREE.CylinderGeometry(1, 1, 1, 6)
  ], []);

  const unifiedSantaCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const startPos = new THREE.Vector3(120, 60, -120);
    const height = 15.12; 
    const turns = 4.5;
    const radiusBase = 6.72; 
    const radiusTop = 0.12; 
    const spiralPointCount = 200; 

    const spiralPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= spiralPointCount; i++) {
      const t = i / spiralPointCount;
      const angle = t * turns * Math.PI * 2;
      const y = -height / 2 + t * height;
      const r = MathUtils.lerp(radiusBase, radiusTop, t);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      spiralPoints.push(new THREE.Vector3(x, y, z));
    }

    const p0 = spiralPoints[0];
    const p1 = spiralPoints[1];
    // Fix: THREE.SubVectors does not exist; use new THREE.Vector3().subVectors(p0, p1) instead to calculate direction.
    const spiralTangentAtStart = new THREE.Vector3().subVectors(p0, p1).normalize();
    points.push(startPos.clone());
    points.push(new THREE.Vector3().addVectors(p0, spiralTangentAtStart.clone().multiplyScalar(40)));
    points.push(...spiralPoints);
    return new THREE.CatmullRomCurve3(points, false, 'chordal', 0.5);
  }, []);

  const [positions, setPositions] = useState<Record<string, Float32Array>>({});
  const [wishPositions, setWishPositions] = useState<Float32Array | null>(null);
  const [imageData, setImageData] = useState<{ positions: Float32Array, colors: Float32Array } | null>(null);

  const currentPositions = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT_INTERNAL * 3));
  const currentColors = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT_INTERNAL * 3));
  const velocities = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT_INTERNAL * 3));
  const activationStatus = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT_INTERNAL));

  const particleAttributes = useMemo(() => {
    const scales = new Float32Array(PARTICLE_COUNT_INTERNAL);
    const colors = new Float32Array(PARTICLE_COUNT_INTERNAL * 3);
    const phases = new Float32Array(PARTICLE_COUNT_INTERNAL); 
    const offsets = new Float32Array(PARTICLE_COUNT_INTERNAL * 3);
    const inertia = new Float32Array(PARTICLE_COUNT_INTERNAL);
    
    for (let i = 0; i < PARTICLE_COUNT_INTERNAL; i++) {
      scales[i] = 0.0067 + Math.random() * 0.02;
      phases[i] = Math.random();
      offsets[i * 3] = Math.random() - 0.5;
      offsets[i * 3 + 1] = Math.random() - 0.5;
      offsets[i * 3 + 2] = Math.random() - 0.5;
      inertia[i] = 0.4 + Math.random() * 1.2;

      const rand = Math.random();
      const color = rand < 0.7 ? PARTICLE_CONFIG.colors[0] : PARTICLE_CONFIG.colors[1];
      color.toArray(colors, i * 3);
    }
    return { scales, colors, phases, offsets, inertia };
  }, [PARTICLE_COUNT_INTERNAL]);

  useEffect(() => {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = STE_LOGO_URL;
    logoImg.onload = () => {
      const greetingPosFromImg = generateGreetingPositionsFromImage(logoImg, PARTICLE_COUNT_INTERNAL);
      setPositions(prev => ({
        ...prev,
        [AppMode.GREETING]: greetingPosFromImg
      }));
    };
  }, [PARTICLE_COUNT_INTERNAL]);

  useEffect(() => {
    const generate = () => {
      setPositions(prev => ({
        ...prev,
        [AppMode.TREE]: generateTreePositions(PARTICLE_COUNT_INTERNAL),
        [AppMode.SCATTER]: generateScatterPositions(PARTICLE_COUNT_INTERNAL),
        [AppMode.TEXT]: generateTextPositions(PARTICLE_COUNT_INTERNAL),
        ...(prev[AppMode.GREETING] ? {} : { [AppMode.GREETING]: generateGreetingPositions(PARTICLE_COUNT_INTERNAL) })
      }));
    };
    generate();
    if (document.fonts) document.fonts.ready.then(generate);
  }, [PARTICLE_COUNT_INTERNAL]);

  useEffect(() => {
    if (wishText) {
      setWishPositions(generateDynamicWishPositions(wishText, PARTICLE_COUNT_INTERNAL));
    } else {
      setWishPositions(null);
    }
  }, [wishText, PARTICLE_COUNT_INTERNAL]);

  useEffect(() => {
    if (uploadedImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = uploadedImageUrl;
      img.onload = () => setImageData(generateImagePositionsAndColors(img, PARTICLE_COUNT_INTERNAL));
    } else {
      setImageData(null);
    }
  }, [uploadedImageUrl, PARTICLE_COUNT_INTERNAL]);

  const treePos = positions[AppMode.TREE];
  useEffect(() => {
    if (!treePos) return;
    currentPositions.current.set(treePos);
    currentColors.current.set(particleAttributes.colors);
    velocities.current.fill(0);
  }, [treePos, particleAttributes.colors]);

  const lastMode = useRef<AppMode>(mode);
  const transitionTime = useRef<number>(0);
  const explosionTriggered = useRef(false);
  const explosionStartTime = useRef(0);
  const goldColor = useMemo(() => new THREE.Color("#f9ce19"), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    if (lastMode.current !== mode) {
        lastMode.current = mode;
        transitionTime.current = time;
        if (mode !== AppMode.WISH) {
           explosionTriggered.current = false;
           explosionStartTime.current = 0;
        }
    }

    if (isExploding && !explosionTriggered.current) {
      explosionTriggered.current = true;
      explosionStartTime.current = time;
      for (let i = 0; i < PARTICLE_COUNT_INTERNAL; i++) {
        const rx = (Math.random() - 0.5) * 2;
        const ry = (Math.random() - 0.5) * 2;
        const rz = (Math.random() - 0.5) * 2;
        const dist = Math.sqrt(rx*rx + ry*ry + rz*rz) || 1;
        const force = (80 + Math.random() * 120) * particleAttributes.inertia[i];
        velocities.current[i * 3] = (rx / dist) * force;
        velocities.current[i * 3 + 1] = (ry / dist) * force + 20; 
        velocities.current[i * 3 + 2] = (rz / dist) * force;
      }
    }

    const effectiveStartTime = treeStartTime !== undefined ? treeStartTime : transitionTime.current;
    const elapsedSinceTreeStart = mode === AppMode.TREE ? time - effectiveStartTime : 0;
    const santaProgress = MathUtils.clamp((elapsedSinceTreeStart - 0.0) / 10.0, 0, 1);
    const lightPos = (mode === AppMode.TREE && santaProgress > 0 && santaProgress < 1.0) ? unifiedSantaCurve.getPointAt(santaProgress) : null;

    for (let i = 0; i < PARTICLE_COUNT_INTERNAL; i++) {
      const meshIdx = i % shapeCount;
      const instanceIdx = Math.floor(i / shapeCount);
      const mesh = meshRefs[meshIdx].current;
      if (!mesh) continue;

      let cx = currentPositions.current[i * 3], cy = currentPositions.current[i * 3 + 1], cz = currentPositions.current[i * 3 + 2];
      const pPhase = particleAttributes.phases[i] * Math.PI * 2;
      
      const jitterAmount = 0.05;
      const oscX = Math.sin(time * 2.5 + pPhase) * jitterAmount;
      const oscY = Math.cos(time * 2.2 + pPhase) * jitterAmount;
      const oscZ = Math.sin(time * 2.8 + pPhase) * jitterAmount;
      const twinkle = Math.sin(time * 4.0 + pPhase) * 0.4 + 0.8;

      let scaleFactor = 1.0, brightnessBoost = 1.0;

      if (mode === AppMode.WISH && wishPositions) {
        const tx = wishPositions[i * 3] + oscX;
        const ty = wishPositions[i * 3 + 1] + oscY;
        const tz = wishPositions[i * 3 + 2] + oscZ;
        const wishElapsed = time - transitionTime.current;
        const delayX = (tx + 11.25) / 22.5; 
        const staggeredProgress = MathUtils.clamp((wishElapsed - delayX * 1.5) / 2.5, 0, 1);
        scaleFactor = staggeredProgress * 0.54;
        brightnessBoost = twinkle * staggeredProgress;
        cx = tx; cy = ty; cz = tz;
      } else if (explosionTriggered.current) {
        cx += velocities.current[i * 3] * delta; 
        cy += velocities.current[i * 3 + 1] * delta; 
        cz += velocities.current[i * 3 + 2] * delta;
        velocities.current[i * 3] *= 0.95; 
        velocities.current[i * 3 + 1] -= delta * 9.8; 
        velocities.current[i * 3 + 1] *= 0.95; 
        velocities.current[i * 3 + 2] *= 0.95;
        const explosionAge = time - explosionStartTime.current;
        scaleFactor = Math.max(0, 1 - (explosionAge / 1.5));
        brightnessBoost = 1.0 + Math.max(0, 1 - (explosionAge / 0.8)) * 5.0;
        if (scaleFactor < 0.1) brightnessBoost *= (scaleFactor / 0.1);
      } else {
        let tx = 0, ty = 0, tz = 0;
        let modeBrightness = 1.0;
        let modeScale = 1.0;

        if (mode === AppMode.IMAGE && imageData) {
          tx = imageData.positions[i * 3] + oscX; ty = imageData.positions[i * 3 + 1] + oscY; tz = imageData.positions[i * 3 + 2] + oscZ;
          modeBrightness = 1.24; // 30% boost: 1.0 + (0.8 * 0.3)
          modeScale = 1.075;      // 30% increase: 1.0 + (0.25 * 0.3)
        } else if (mode === AppMode.TREE) {
          const t = particleAttributes.phases[i];
          const radius = 0.84 + (6.72 - 0.84) * t;
          const angle = t * 20 * Math.PI + pPhase;
          tx = Math.cos(angle) * radius + particleAttributes.offsets[i * 3] * (0.3 + t * 1.8) + oscX;
          ty = (7.56 - (t * 15.12)) + particleAttributes.offsets[i * 3 + 1] * (0.3 + t * 1.8) + oscY;
          tz = Math.sin(angle) * radius + particleAttributes.offsets[i * 3 + 2] * (0.3 + t * 1.8) + oscZ;
        } else if (mode === AppMode.TEXT || mode === AppMode.GREETING) {
          const posKey = mode === AppMode.TEXT ? AppMode.TEXT : AppMode.GREETING;
          const posArr = positions[posKey];
          if (posArr) { tx = posArr[i * 3] + oscX; ty = posArr[i * 3 + 1] + oscY; tz = posArr[i * 3 + 2] + oscZ; }
        } else {
          const scatterArr = positions[AppMode.SCATTER];
          if (scatterArr) { tx = scatterArr[i * 3] + oscX * 2; ty = scatterArr[i * 3 + 1] * 2; tz = scatterArr[i * 3 + 2] + oscZ * 2; }
        }
        const lerpSpd = delta * 1.5 * (0.8 + particleAttributes.inertia[i] * 0.5);
        cx += (tx - cx) * lerpSpd; cy += (ty - cy) * lerpSpd; cz += (tz - cz) * lerpSpd;
        brightnessBoost = (1.0 + (activationStatus.current[i] * 1.25)) * twinkle * modeBrightness;
        scaleFactor = modeScale;
      }

      currentPositions.current[i * 3] = cx; currentPositions.current[i * 3 + 1] = cy; currentPositions.current[i * 3 + 2] = cz;

      if (mode === AppMode.TREE) {
        if (lightPos) {
          const dSq = (cx - lightPos.x)**2 + (cy - lightPos.y)**2 + (cz - lightPos.z)**2;
          if (dSq < 9.0) activationStatus.current[i] = 1.0;
        }
        if (isExploding) activationStatus.current[i] = 1.0;
      } else {
        if (activationStatus.current[i] > 0) activationStatus.current[i] = Math.max(0, activationStatus.current[i] - delta * 0.65);
      }

      let tr, tg, tb;
      if (mode === AppMode.GREETING || mode === AppMode.WISH) {
        tr = goldColor.r; tg = goldColor.g; tb = goldColor.b;
      } else if ((mode === AppMode.IMAGE || mode === AppMode.TEXT || mode === AppMode.TREE) && imageData) {
        tr = imageData.colors[i * 3]; tg = imageData.colors[i * 3 + 1]; tb = imageData.colors[i * 3 + 2];
      } else {
        tr = particleAttributes.colors[i * 3]; tg = particleAttributes.colors[i * 3 + 1]; tb = particleAttributes.colors[i * 3 + 2];
      }

      let cr = currentColors.current[i * 3], cg = currentColors.current[i * 3 + 1], cb = currentColors.current[i * 3 + 2];
      const colorSpd = mode === AppMode.IMAGE ? 5.0 : 2.0;
      cr += (tr - cr) * delta * colorSpd; cg += (tg - cg) * delta * colorSpd; cb += (tb - cb) * delta * colorSpd;
      currentColors.current[i * 3] = cr; currentColors.current[i * 3 + 1] = cg; currentColors.current[i * 3 + 2] = cb;

      const particleColor = new THREE.Color(cr, cg, cb);
      if (activationStatus.current[i] > 0 && mode !== AppMode.WISH) particleColor.lerp(goldColor, activationStatus.current[i] * 0.8);
      
      dummy.position.set(cx, cy, cz);
      dummy.scale.setScalar(particleAttributes.scales[i] * scaleFactor);
      dummy.updateMatrix();
      mesh.setMatrixAt(instanceIdx, dummy.matrix);
      mesh.setColorAt(instanceIdx, particleColor.multiplyScalar(brightnessBoost));
    }
    meshRefs.forEach(ref => { 
      if (ref.current) { 
        ref.current.frustumCulled = false; 
        ref.current.instanceMatrix.needsUpdate = true; 
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true; 
      } 
    });
  });

  return (
    <>
      <meshStandardMaterial ref={matRef} roughness={0.4} metalness={0.9} envMapIntensity={3.0} emissiveIntensity={14.0} toneMapped={true} />
      {geometries.map((geo, idx) => (
        <instancedMesh key={idx} ref={meshRefs[idx]} args={[geo, undefined, countPerShape]} castShadow receiveShadow frustumCulled={false}>
          <primitive object={matRef.current || new THREE.MeshStandardMaterial()} attach="material" />
        </instancedMesh>
      ))}
    </>
  );
};

export default InstancedParticles;
