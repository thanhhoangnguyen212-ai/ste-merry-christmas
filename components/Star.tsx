
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
// Import to ensure global JSX augmentation from types.ts is active in this file
import '../types';

const Star: React.FC<{ visible: boolean }> = ({ visible }) => {
  const ref = useRef<THREE.Group>(null);

  const { starGeometry, edgesGeometry } = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.05; 
    const innerRadius = 0.525; 

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.22, 
      bevelEnabled: true,
      bevelThickness: 0.3, 
      bevelSize: 0.22,     
      bevelSegments: 4,    
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    const edges = new THREE.EdgesGeometry(geo, 15);

    return { starGeometry: geo, edgesGeometry: edges };
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
      const targetScale = 1.0;
      const scale = visible ? 
        MathUtils.lerp(ref.current.scale.x, targetScale, delta * 1.2) : 
        MathUtils.lerp(ref.current.scale.x, 0, delta * 3.0);
        
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={ref} position={[0, 8.4, 0]}> 
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
          color="#f9ce19"          
          emissive="#f9ce19"       
          emissiveIntensity={14.7}  
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}       
        />
      </mesh>

      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={[40, 28, 4]} toneMapped={false} linewidth={2} />
      </lineSegments>

      <pointLight color="#f9ce19" intensity={7.35} distance={15} decay={2} />
    </group>
  );
};

export default Star;
