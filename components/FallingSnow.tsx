
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
// Import to ensure global JSX augmentation from types.ts is active in this file
import '../types';

interface FallingSnowProps {
  count?: number;
}

const FallingSnow: React.FC<FallingSnowProps> = ({ count = 2000 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const snowflakeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.strokeStyle = '#f9cd80';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#f9cd80';
      ctx.shadowBlur = 2;
      
      ctx.translate(32, 32);
      
      for(let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -26);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(-8, -18);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(8, -18);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(-5, -24);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(5, -24);
          ctx.stroke();
          
          ctx.rotate(Math.PI / 3);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = true;
    return texture;
  }, []);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const range = 60;
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * range;
      pos[i * 3 + 1] = (Math.random() - 0.5) * range;
      pos[i * 3 + 2] = (Math.random() - 0.5) * range;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = 0.002 + Math.random() * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const currentPositions = positionsAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      currentPositions[i * 3 + 1] -= velocities[i * 3 + 1];
      const windX = Math.sin(time * 0.3 + i * 0.01) * 0.005;
      const windZ = Math.cos(time * 0.2 + i * 0.01) * 0.005;

      currentPositions[i * 3] += velocities[i * 3] + windX;
      currentPositions[i * 3 + 2] += velocities[i * 3 + 2] + windZ;

      if (currentPositions[i * 3 + 1] < -30) {
        currentPositions[i * 3 + 1] = 30;
        currentPositions[i * 3] = (Math.random() - 0.5) * 60;
        currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    
    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        map={snowflakeTexture}
        color="#f9cd80"
        transparent
        opacity={0.9}
        alphaTest={0.01}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default FallingSnow;
