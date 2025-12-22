
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MathUtils } from 'three';
import InstancedParticles from './InstancedParticles';
import Star from './Star';
import FallingSnow from './FallingSnow';
import ChromeSpiral from './ChromeSpiral';
import Ground from './Ground';
import TextHighlight from './TextHighlight';
import { AppMode } from '../types';

interface SceneProps {
  mode: AppMode;
  setMode: () => void;
  uploadedImage: string | null;
  onExplode?: () => void;
  wishText?: string | null;
}

const CameraRig = ({ isInteracting }: { isInteracting: React.MutableRefObject<boolean> }) => {
  const defaultPos = useMemo(() => new THREE.Vector3(0, 5, 30), []);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 2, 0), []);
  const lastInteractionTime = useRef(0);

  useFrame((state) => {
    const controls = state.controls as any;
    if (!controls) return;
    const t = state.clock.elapsedTime;
    if (isInteracting.current) {
      lastInteractionTime.current = t;
    } else {
      const idleTime = t - lastInteractionTime.current;
      if (idleTime > 5) {
        const accelerationDuration = 2.0; 
        const timeInHomingMode = idleTime - 5;
        const accelerationAlpha = Math.min(timeInHomingMode / accelerationDuration, 1);
        const returnSpeed = accelerationAlpha * 0.005;
        state.camera.position.lerp(defaultPos, returnSpeed);
        const targetOscX = Math.sin(t * 0.2) * 0.05;
        const targetOscY = Math.cos(t * 0.15) * 0.03;
        const tempTarget = defaultTarget.clone().add(new THREE.Vector3(targetOscX, targetOscY, 0));
        controls.target.lerp(tempTarget, returnSpeed * 1.5);
        controls.update();
      }
    }
  });
  return null;
};

const RotatingGroup: React.FC<{ children: React.ReactNode; active: boolean }> = ({ children, active }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current && !active) {
        groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2.0);
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

const Scene: React.FC<SceneProps> = ({ mode, setMode, uploadedImage, onExplode, wishText }) => {
  const interactionRef = useRef<{ startX: number; startY: number; startTime: number }>({ startX: 0, startY: 0, startTime: 0 });
  const isInteracting = useRef(false);
  const [hasReachedStar, setHasReachedStar] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  useEffect(() => {
    if (mode === AppMode.TREE) {
      setHasReachedStar(false);
      setIsExploding(false);
    }
  }, [mode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    interactionRef.current = { startX: e.clientX, startY: e.clientY, startTime: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const deltaX = Math.abs(e.clientX - interactionRef.current.startX);
    const deltaY = Math.abs(e.clientY - interactionRef.current.startY);
    const deltaTime = Date.now() - interactionRef.current.startTime;
    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) setMode();
  };

  const handleReachTop = () => {
    setHasReachedStar(true);
    setIsExploding(true);
    if (onExplode) onExplode();
    setTimeout(() => setIsExploding(false), 3000);
  };

  const isRotating = mode === AppMode.TREE;
  const isImageMode = mode === AppMode.IMAGE;

  return (
    <Canvas
      dpr={[1, 2]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="cursor-pointer"
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <PerspectiveCamera makeDefault position={[0, 5, 30]} fov={50} />
      <CameraRig isInteracting={isInteracting} />
      <color attach="background" args={['#050505']} />
      
      <ambientLight intensity={isImageMode ? 1.1 : 0.8} color={isImageMode ? "#FFFFFF" : "#FFE4B5"} />
      <pointLight position={[10, 15, 10]} intensity={isImageMode ? 3.45 : 3.0} color="#FFD700" castShadow />
      
      {mode === AppMode.WISH && (
        <pointLight position={[0, 2, 0]} intensity={isExploding ? 100 : 0} color="#FFD700" distance={60} />
      )}

      <FallingSnow count={3000} />
      <Environment background={false}>
        <mesh scale={100}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#FFDAB9" side={THREE.BackSide} />
        </mesh>
      </Environment>
      
      <Ground />

      <RotatingGroup active={isRotating}>
        <InstancedParticles mode={mode} uploadedImageUrl={uploadedImage} isExploding={isExploding} wishText={wishText} />
        <ChromeSpiral visible={mode === AppMode.TREE && !hasReachedStar} onReachTop={handleReachTop} />
        <Star visible={mode === AppMode.TREE && !hasReachedStar} />
        <TextHighlight mode={mode} />
      </RotatingGroup>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.9} 
          mipmapBlur 
          intensity={isExploding ? 2.8 : (isImageMode ? 1.0 : 0.84)} 
          radius={0.75} 
        />
      </EffectComposer>

      <OrbitControls 
        makeDefault enablePan={false} enableZoom={true} minDistance={10} maxDistance={60} enableDamping dampingFactor={0.05} target={[0, 2, 0]}
        onStart={() => { isInteracting.current = true; }}
        onEnd={() => { isInteracting.current = false; }}
      />
    </Canvas>
  );
};

export default Scene;
