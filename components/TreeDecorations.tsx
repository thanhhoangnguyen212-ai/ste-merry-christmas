
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppMode } from '../types';
import { generateTreePositions, generateScatterPositions, generateTextPositions, generateDecorationPositions } from '../utils/geometryGenerator';

interface DecorationGroupProps {
  mode: AppMode;
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  colors: THREE.Color[];
  scaleFactor: number;
}

const DecorationGroup: React.FC<DecorationGroupProps> = ({ mode, count, geometry, material, colors, scaleFactor }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Reuse geometry generators to match the tree/scatter/text shapes
  const positions = useMemo(() => ({
    // Use the specific decoration generator for tree mode to put them on the surface
    [AppMode.TREE]: generateDecorationPositions(count),
    [AppMode.SCATTER]: generateScatterPositions(count),
    [AppMode.TEXT]: generateTextPositions(count),
  }), [count]);

  const currentPositions = useRef(new Float32Array(count * 3));
  
  const attributes = useMemo(() => {
    const scales = new Float32Array(count);
    const instanceColors = new Float32Array(count * 3);
    const rotationSpeeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // Random scale variation
        scales[i] = scaleFactor * (0.8 + Math.random() * 0.4);
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        color.toArray(instanceColors, i * 3);

        // Random rotation speeds for tumbling effect
        rotationSpeeds[i * 3] = (Math.random() - 0.5) * 1.5;
        rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return { scales, instanceColors, rotationSpeeds };
  }, [count, colors, scaleFactor]);

  // Initialization
  useEffect(() => {
     if (meshRef.current) {
         currentPositions.current.set(positions[AppMode.TREE]);
         for (let i=0; i < count; i++) {
             dummy.position.set(
                 positions[AppMode.TREE][i*3],
                 positions[AppMode.TREE][i*3+1],
                 positions[AppMode.TREE][i*3+2]
             );
             dummy.scale.setScalar(attributes.scales[i]);
             dummy.updateMatrix();
             meshRef.current.setMatrixAt(i, dummy.matrix);
             meshRef.current.setColorAt(i, new THREE.Color().fromArray(attributes.instanceColors, i*3));
         }
         meshRef.current.instanceMatrix.needsUpdate = true;
         if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
     }
  }, [count, positions, attributes, dummy]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Animation transitions
    // Increased by 1.5x (0.8 -> 1.2, 0.6 -> 0.9)
    const speedMult = mode === AppMode.TEXT ? 1.2 : 0.9;
    const lerpFactor = Math.min(delta * speedMult, 1);
    
    for (let i = 0; i < count; i++) {
        // Interpolate position
        let cx = currentPositions.current[i*3];
        let cy = currentPositions.current[i*3+1];
        let cz = currentPositions.current[i*3+2];
        
        const tx = positions[mode][i*3];
        const ty = positions[mode][i*3+1];
        const tz = positions[mode][i*3+2];
        
        cx += (tx - cx) * lerpFactor;
        cy += (ty - cy) * lerpFactor;
        cz += (tz - cz) * lerpFactor;
        
        currentPositions.current[i*3] = cx;
        currentPositions.current[i*3+1] = cy;
        currentPositions.current[i*3+2] = cz;

        dummy.position.set(cx, cy, cz);
        
        // Continuous rotation
        dummy.rotation.x += attributes.rotationSpeeds[i*3] * delta;
        dummy.rotation.y += attributes.rotationSpeeds[i*3+1] * delta;
        dummy.rotation.z += attributes.rotationSpeeds[i*3+2] * delta;
        
        dummy.scale.setScalar(attributes.scales[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
  );
};

const TreeDecorations: React.FC<{ mode: AppMode }> = ({ mode }) => {
    // Geometries
    const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    // Cylinder for candy sticks
    const cylinderGeo = useMemo(() => new THREE.CylinderGeometry(0.25, 0.25, 1.5, 12), []);

    // Procedural Wrapping Paper Texture
    const giftTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Fill Background (Slightly darker to allow highlights)
            ctx.fillStyle = '#D0D0D0'; 
            ctx.fillRect(0, 0, 512, 512);

            // Draw Stripes Pattern
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 40;
            
            // Diagonal stripes
            for (let i = -512; i < 1024; i += 80) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 512, 512);
                ctx.stroke();
            }

            // Add subtle noise for paper texture
            const imageData = ctx.getImageData(0, 0, 512, 512);
            const data = imageData.data;
            for(let j = 0; j < data.length; j += 4) {
                const noise = (Math.random() - 0.5) * 15;
                // Add noise to RGB channels
                data[j] = Math.min(255, Math.max(0, data[j] + noise));
                data[j+1] = Math.min(255, Math.max(0, data[j+1] + noise));
                data[j+2] = Math.min(255, Math.max(0, data[j+2] + noise));
            }
            ctx.putImageData(imageData, 0, 0);
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        // Repeat texture so it looks correct on the box faces
        tex.repeat.set(1, 1); 
        return tex;
    }, []);

    // Materials - Using Standard for PBR look
    // Shiny for Baubles
    const shinyMat = useMemo(() => new THREE.MeshStandardMaterial({ 
        roughness: 0.1, 
        metalness: 0.9,
        envMapIntensity: 1 
    }), []);
    
    // Matte/Satin for Candy
    const satinMat = useMemo(() => new THREE.MeshStandardMaterial({ 
        roughness: 0.4, 
        metalness: 0.3 
    }), []);
    
    // Textured Material specifically for Gifts
    const giftMat = useMemo(() => new THREE.MeshStandardMaterial({
        roughness: 0.5,
        metalness: 0.1,
        map: giftTexture,
    }), [giftTexture]);
    
    // Colors - STRICT RED, GOLD, WHITE PALETTE
    const baubleColors = useMemo(() => [
        new THREE.Color("#FF0000"), // Red
        new THREE.Color("#FFD700"), // Gold
        new THREE.Color("#FFFFFF"), // White
        new THREE.Color("#8B0000"), // Dark Red
    ], []);
    
    const giftColors = useMemo(() => [
        new THREE.Color("#FF0000"), // Red
        new THREE.Color("#FFD700"), // Gold
        new THREE.Color("#FFFFFF"), // White
        new THREE.Color("#B22222"), // Firebrick Red
        new THREE.Color("#F0E68C"), // Khaki/Light Gold
    ], []);
    
    const candyColors = useMemo(() => [
        new THREE.Color("#FF0000"), // Red
        new THREE.Color("#FFFFFF"), // White
        new THREE.Color("#FF4500"), // Orange-Red
    ], []);

    return (
        <group>
            {/* Baubles - Reduced to 100 */}
            <DecorationGroup 
                mode={mode} 
                count={100} 
                geometry={sphereGeo} 
                material={shinyMat} 
                colors={baubleColors} 
                scaleFactor={0.15} 
            />
            {/* Gifts - Reduced to 100 - Using New Gift Material */}
            <DecorationGroup 
                mode={mode} 
                count={100} 
                geometry={boxGeo} 
                material={giftMat} 
                colors={giftColors} 
                scaleFactor={0.15} 
            />
            {/* Candy Sticks - Reduced to 75 */}
            <DecorationGroup 
                mode={mode} 
                count={75} 
                geometry={cylinderGeo} 
                material={satinMat} 
                colors={candyColors} 
                scaleFactor={0.12} 
            />
        </group>
    )
}

export default TreeDecorations;
