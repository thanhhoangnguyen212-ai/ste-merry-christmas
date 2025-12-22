
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
// Import to ensure global JSX augmentation from types.ts is active in this file
import '../types';

interface ChromeSpiralProps {
  visible: boolean;
  onReachTop?: () => void;
  treeStartTime?: number;
}

interface ReindeerProps {
  position: [number, number, number];
  phaseOffset?: number;
}

const Reindeer: React.FC<ReindeerProps> = ({ position, phaseOffset = 0 }) => {
  const flRef = useRef<THREE.Group>(null);
  const frRef = useRef<THREE.Group>(null);
  const blRef = useRef<THREE.Group>(null);
  const brRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const legGeo = useMemo(() => new THREE.CylinderGeometry(0.015, 0.01, 0.2, 8), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5C4033" }), []);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime * 10 + phaseOffset; 
    if (flRef.current) flRef.current.rotation.x = Math.sin(t) * 0.8;
    if (frRef.current) frRef.current.rotation.x = Math.sin(t + Math.PI) * 0.8;
    if (blRef.current) blRef.current.rotation.x = Math.sin(t + Math.PI * 0.7) * 0.8;
    if (brRef.current) brRef.current.rotation.x = Math.sin(t - Math.PI * 0.3) * 0.8;
    if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2) * 0.02;
        bodyRef.current.rotation.z = Math.cos(t) * 0.03;
    }
  });

  return (
    <group position={position}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.16, 0.16, 0.28]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.25, 0.12]} rotation={[Math.PI / 4, 0, 0]}>
           <boxGeometry args={[0.08, 0.15, 0.08]} />
           <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.35, 0.2]}>
          <boxGeometry args={[0.1, 0.12, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.35, 0.28]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <group position={[0, 0.42, 0.15]} rotation={[0.2, 0, 0]}>
          <mesh position={[0.08, 0.1, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.2]} />
            <meshStandardMaterial color="#D2B48C" />
          </mesh>
          <mesh position={[-0.08, 0.1, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.2]} />
            <meshStandardMaterial color="#D2B48C" />
          </mesh>
        </group>
      </group>
      <group ref={flRef} position={[-0.06, 0.12, 0.1]}><mesh geometry={legGeo} material={legMat} position={[0, -0.1, 0]} /></group>
      <group ref={frRef} position={[0.06, 0.12, 0.1]}><mesh geometry={legGeo} material={legMat} position={[0, -0.1, 0]} /></group>
      <group ref={blRef} position={[-0.06, 0.12, -0.1]}><mesh geometry={legGeo} material={legMat} position={[0, -0.1, 0]} /></group>
      <group ref={brRef} position={[0.06, 0.12, -0.1]}><mesh geometry={legGeo} material={legMat} position={[0, -0.1, 0]} /></group>
    </group>
  );
};

const SantaSleighModel = () => {
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(249, 206, 25, 1)');
      gradient.addColorStop(0.2, 'rgba(249, 206, 25, 0.4)');
      gradient.addColorStop(1, 'rgba(249, 206, 25, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group scale={1.5}>
      <sprite scale={[4, 4, 1]} position={[0, 0.5, 0]}>
        <spriteMaterial map={glowTexture} transparent opacity={0.075} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      <Reindeer position={[0, 0, 0.5]} phaseOffset={0} />
      <Reindeer position={[0, 0, 0.9]} phaseOffset={1} />
      <Reindeer position={[0, 0, 1.3]} phaseOffset={2} />

      <mesh position={[0, 0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.25, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.25, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      <group position={[0, 0, -0.3]}>
        <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.4, 0.25, 0.55]} />
            <meshStandardMaterial color="#f9ce19" metalness={0.7} roughness={0.2} />
        </mesh>

        <group position={[0, 0.28, -0.05]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.25, 0.28, 0.2]} />
            <meshStandardMaterial color="#D00" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#FFCC99" />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
             <coneGeometry args={[0.11, 0.22, 16]} />
             <meshStandardMaterial color="#D00" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

const ChromeSpiral: React.FC<ChromeSpiralProps> = ({ visible, onReachTop, treeStartTime }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const SANTA_APPEAR_DELAY = 0.0;
  const START_POS = useMemo(() => new THREE.Vector3(120, 60, -120), []);

  const internalStartTime = useRef(0);
  const lastVisible = useRef(false);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  const unifiedCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const height = 16.2; 
    const turns = 4.5;
    const radiusBase = 8.64; 
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
    const spiralTangentAtStart = new THREE.Vector3().subVectors(p0, p1).normalize(); 

    points.push(START_POS.clone());
    points.push(new THREE.Vector3().addVectors(p0, spiralTangentAtStart.clone().multiplyScalar(60)));
    points.push(new THREE.Vector3().addVectors(p0, spiralTangentAtStart.clone().multiplyScalar(30)));
    points.push(new THREE.Vector3().addVectors(p0, spiralTangentAtStart.clone().multiplyScalar(10)));
    points.push(...spiralPoints);
    
    return new THREE.CatmullRomCurve3(points, false, 'chordal', 0.5);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    
    if (visible && !lastVisible.current) {
        internalStartTime.current = time;
    }
    lastVisible.current = visible;

    const effectiveStartTime = treeStartTime !== undefined ? treeStartTime : internalStartTime.current;
    const elapsed = time - effectiveStartTime;
    
    if (visible) {
        const activeElapsed = elapsed - SANTA_APPEAR_DELAY;
        const totalDuration = 10.0; 
        const progress = MathUtils.clamp(activeElapsed / totalDuration, 0, 1);
        
        if (progress >= 0.99 && onReachTop) onReachTop();

        const targetScale = 1.0;
        const currentScale = groupRef.current.scale.x;
        const newScale = MathUtils.lerp(currentScale, targetScale, delta * 3);
        groupRef.current.scale.setScalar(newScale);
        groupRef.current.visible = newScale > 0.05;

        const position = unifiedCurve.getPointAt(progress);
        const tangent = unifiedCurve.getTangentAt(progress).normalize();
        
        groupRef.current.position.copy(position);

        const upVec = new THREE.Vector3(0, 1, 0);
        const rightVec = new THREE.Vector3().crossVectors(upVec, tangent).normalize();
        const orthoUpVec = new THREE.Vector3().crossVectors(tangent, rightVec).normalize();

        tempMatrix.makeBasis(rightVec, orthoUpVec, tangent);
        groupRef.current.quaternion.setFromRotationMatrix(tempMatrix);

    } else {
        groupRef.current.visible = false;
        groupRef.current.scale.setScalar(0);
    }
  });

  return (
    <group>
      <Trail
        width={1.2}
        length={12}
        color={new THREE.Color("#f9ce19")}
        attenuation={(t) => t * t}
        target={groupRef}
        decay={1.2}
        local={false}
        stride={0}
      >
        <meshBasicMaterial transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </Trail>

      <group ref={groupRef}>
        <SantaSleighModel />
      </group>
    </group>
  );
};

export default ChromeSpiral;
