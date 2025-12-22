
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

export enum AppMode {
  GREETING = 'GREETING',
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  WISH = 'WISH',
}

export interface ParticleData {
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  type: 'sphere' | 'cube';
}

export interface TargetPositions {
  tree: Float32Array;
  scatter: Float32Array;
  text: Float32Array;
}

/**
 * Global augmentation for React Three Fiber intrinsic elements.
 * 
 * We augment the 'react' module's JSX namespace. This is the most reliable way 
 * in React 18+ to ensure that Three.js elements (like <mesh>, <group>, etc.) 
 * are added to the existing IntrinsicElements without shadowing or removing 
 * standard HTML elements (like <div>, <p>, etc.).
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Also augment the global JSX namespace as a fallback for some configurations
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
