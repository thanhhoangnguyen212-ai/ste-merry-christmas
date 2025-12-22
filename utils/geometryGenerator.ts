
import * as THREE from 'three';
import { MathUtils } from 'three';

// Constants
const PARTICLE_COUNT = 62500; 
const TEXT_CANVAS_WIDTH = 1024;
const TEXT_CANVAS_HEIGHT = 512;

export const PARTICLE_CONFIG = {
  count: PARTICLE_COUNT,
  colors: [new THREE.Color("#f9ce19"), new THREE.Color("#FFFFFF")]
};

/**
 * Helper to wrap text into multiple lines based on max width, supporting manual \n breaks
 */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const manualLines = text.split('\n');
  const finalLines: string[] = [];
  
  manualLines.forEach(line => {
    const words = line.split(' ');
    if (words.length === 0) {
      finalLines.push("");
      return;
    }
    
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        finalLines.push(currentLine);
        currentLine = word;
      }
    }
    finalLines.push(currentLine);
  });
  
  return finalLines;
};

/**
 * Generate coordinates for wish text using Outfit (Google Sans alternative)
 */
export const generateDynamicWishPositions = (text: string, count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const canvas = document.createElement('canvas');
  // Increase canvas size for better resolution and handling long strings
  canvas.width = 2000; 
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(count * 3);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  
  // Font settings: Changed to Outfit (Google Sans alternative)
  const fontSize = 80;
  ctx.font = `400 ${fontSize}px "Outfit"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Wrap text with a safe margin on the canvas
  const maxWidth = canvas.width * 0.85; 
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.3;
  const startY = (canvas.height / 2) - ((lines.length - 1) * lineHeight / 2);

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const validPoints: {x: number, y: number}[] = [];
  
  // Find valid pixel points
  const step = 2;
  let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

  for (let y = 0; y < canvas.height; y += step) { 
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index] > 50) {
        validPoints.push({ x, y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Calculate actual bounding box dimensions
  const contentWidth = maxX - minX || 1;
  const contentHeight = maxY - minY || 1;
  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;

  // We want to fit the text within a specific 3D width.
  const max3DWidth = 15.2; 
  const scale = max3DWidth / contentWidth;

  validPoints.sort((a, b) => a.x - b.x);

  for (let i = 0; i < count; i++) {
    const point = validPoints[i % validPoints.length] || { x: canvas.width/2, y: canvas.height/2 }; 
    
    // Normalize relative to content center and apply dynamic scale
    const xPos = (point.x - centerX) * scale;
    const yPos = -(point.y - centerY) * scale;
    
    data[i * 3] = xPos;
    data[i * 3 + 1] = yPos + 2.0; 
    data[i * 3 + 2] = 0; 
  }
  return data;
};

const sampleSTeLogoPositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const canvas = document.createElement('canvas');
  canvas.width = TEXT_CANVAS_WIDTH;
  canvas.height = TEXT_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(count * 3);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  
  const fontWeight = "500"; 
  const fontFamily = 'Saira'; 
  const mainFontSize = 340;
  const smallFontSize = 220;

  ctx.font = `${fontWeight} ${mainFontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic'; 

  const textS = "S";
  const textT = "T";
  const texte = "e";
  
  const widthS = ctx.measureText(textS).width;
  const widthT = ctx.measureText(textT).width;
  
  ctx.font = `${fontWeight} ${smallFontSize}px ${fontFamily}`;
  const widthe = ctx.measureText(texte).width;
  
  const totalWidth = widthS + widthT + widthe - 30; 
  const startX = (canvas.width - totalWidth) / 2;
  const baselineY = canvas.height / 2 + 100;

  ctx.font = `${fontWeight} ${mainFontSize}px ${fontFamily}`;
  ctx.fillText(textS, startX, baselineY);
  ctx.fillText(textT, startX + widthS - 15, baselineY);
  ctx.font = `${fontWeight} ${smallFontSize}px ${fontFamily}`;
  ctx.fillText(texte, startX + widthS + widthT - 25, baselineY);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const validPoints: {x: number, y: number}[] = [];
  const step = 2; 
  
  for (let y = 0; y < canvas.height; y += step) { 
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index] > 128) validPoints.push({ x, y });
    }
  }

  // Detection for mobile aspect ratio to further reduce scale if needed
  const isMobile = window.innerWidth < 768;
  // Further 20% reduction from 18.032 -> ~14.4
  const baseScaleX = 14.4;
  const baseScaleY = 7.2;

  for (let i = 0; i < count; i++) {
    const point = validPoints[i % validPoints.length] || { x: canvas.width/2, y: canvas.height/2 }; 
    const xNorm = (point.x / canvas.width) - 0.5;
    const yNorm = -((point.y / canvas.height) - 0.5);
    
    data[i * 3] = xNorm * baseScaleX; 
    data[i * 3 + 1] = yNorm * baseScaleY;
    data[i * 3 + 2] = (Math.random() - 0.5) * 1.05;
  }
  return data;
};

const sampleTextPositions = (text1: string, text2: string, count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const canvas = document.createElement('canvas');
  canvas.width = TEXT_CANVAS_WIDTH;
  canvas.height = TEXT_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(count * 3);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 160px Montserrat'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(text1, canvas.width / 2, canvas.height / 2 - 80);
  ctx.fillText(text2, canvas.width / 2, canvas.height / 2 + 80);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const validPoints: {x: number, y: number}[] = [];
  const step = 2;
  for (let y = 0; y < canvas.height; y += step) { 
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index] > 128) validPoints.push({ x, y });
    }
  }

  for (let i = 0; i < count; i++) {
    const point = validPoints[i % validPoints.length] || { x: canvas.width/2, y: canvas.height/2 }; 
    const xNorm = (point.x / canvas.width) - 0.5;
    const yNorm = -((point.y / canvas.height) - 0.5);
    
    data[i * 3] = xNorm * 15.0;
    data[i * 3 + 1] = yNorm * 7.5;
    data[i * 3 + 2] = (Math.random() - 0.5) * 1.05;
  }
  return data;
};

export const generateTreePositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const height = 15.12; 
  const maxRadius = 6.72; 
  for (let i = 0; i < count; i++) {
    const t = Math.random(); 
    const y = (height / 2) - (t * height);
    const radius = maxRadius * t;
    const angle = t * 20 * Math.PI + (Math.random() * Math.PI * 2);
    data[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * (0.3 + t * 1.8);
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * (0.3 + t * 1.8);
  }
  return data;
};

export const generateDecorationPositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const height = 15.12;
  const topRadius = 0.84; 
  const bottomRadius = 6.72; 
  for (let i = 0; i < count; i++) {
    const t = Math.random(); 
    const y = (height / 2) - (t * height);
    const r = (topRadius + (bottomRadius - topRadius) * t) + 1.0; 
    const angle = Math.random() * Math.PI * 2;
    data[i * 3] = r * Math.cos(angle);
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = r * Math.sin(angle);
  }
  return data;
};

export const generateScatterPositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const scatterRadius = 40;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = scatterRadius * (0.8 + Math.random() * 0.5);
    data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    data[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    data[i * 3 + 2] = r * Math.cos(phi);
  }
  return data;
};

export const generateTextPositions = (count: number): Float32Array => {
  return sampleTextPositions('MERRY', 'CHRISTMAS', count);
};

export const generateGreetingPositions = (count: number): Float32Array => {
  return sampleSTeLogoPositions(count);
};

export const generateImagePositionsAndColors = (img: HTMLImageElement, count: number): { positions: Float32Array, colors: Float32Array } => {
  const canvas = document.createElement('canvas');
  const w = 200;
  const h = Math.floor(w * (img.height / img.width));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) };
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const points: { x: number, y: number, r: number, g: number, b: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 128) {
        points.push({
          x, y,
          r: data[idx] / 255,
          g: data[idx + 1] / 255,
          b: data[idx + 2] / 255
        });
      }
    }
  }

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const imageScale = 10.4; // 8.0 * 1.3 = 10.4 (130%)
  for (let i = 0; i < count; i++) {
    const p = points[i % points.length] || { x: 0, y: 0, r: 1, g: 1, b: 1 };
    const xNorm = (p.x / w) - 0.5;
    const yNorm = -((p.y / h) - 0.5);
    positions[i * 3] = xNorm * imageScale;
    positions[i * 3 + 1] = yNorm * imageScale * (h / w);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;
  }
  return { positions, colors };
};

// Add missing export generateGreetingPositionsFromImage to resolve compilation error.
export const generateGreetingPositionsFromImage = (img: HTMLImageElement, count: number): Float32Array => {
  const canvas = document.createElement('canvas');
  const w = 400; 
  const h = Math.floor(w * (img.height / img.width));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(count * 3);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const points: { x: number, y: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 128) {
        points.push({ x, y });
      }
    }
  }

  const positions = new Float32Array(count * 3);
  // Further 20% reduction from 18.032 -> 14.4
  const logoScale = 14.4; 
  for (let i = 0; i < count; i++) {
    const p = points[i % points.length] || { x: w / 2, y: h / 2 };
    const xNorm = (p.x / w) - 0.5;
    const yNorm = -((p.y / h) - 0.5);
    positions[i * 3] = xNorm * logoScale;
    positions[i * 3 + 1] = yNorm * logoScale * (h / w);
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.05;
  }
  return positions;
};
