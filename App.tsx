
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Scene from './components/Scene';
import { AppMode } from './types';

const WISHES = [
  "Chúc bạn Giáng Sinh này bớt \"overthinking\",\nbớt \"deadline\"\nvà có thêm thật nhiều \"money\" để đi du dưa",
  "Giáng Sinh này chúc bạn\nsớm thoát kiếp làm \"cây thông\",\nđứng nhìn người ta nắm tay.\nCố lên bạn tôi!",
  "Merry Christmas!\nChúc bạn nhận được món quà mình thích,\ngặp được người mình thương\nvà luôn là phiên bản hạnh phúc nhất của chính mình",
  "All I want for Christmas is you…\nand a big bank account",
  "May your heart be light\nand your days be bright.\nGiáng Sinh rạng rỡ nhé!",
  "Giáng Sinh:\nmột chút lung linh,\nmột chút ấm áp,\nvà thật nhiều yêu thương",
  "Stay cozy and merry.\nMong bạn có một đêm Giáng Sinh\nthật trọn vẹn bên những người quan trọng nhất",
  "Giáng Sinh này mặc gì cũng được,\nmiễn là không phải mắc kẹt\nmột mình giữa phố đông",
  "Noel ngoài trời có tuyết,\ntheo đúng giả thuyết\nthì anh phải yêu em"
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GREETING);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentWish, setCurrentWish] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoTransitionTimer = useRef<number | null>(null);

  const getNextMode = (currentMode: AppMode): AppMode => {
    switch (currentMode) {
      case AppMode.GREETING: return AppMode.IMAGE;
      case AppMode.IMAGE: return AppMode.TEXT;
      case AppMode.TEXT: return AppMode.TREE;
      case AppMode.TREE: return AppMode.WISH;
      case AppMode.WISH: return AppMode.GREETING;
      default: return AppMode.GREETING;
    }
  };

  const processImageAdjustments = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return img.src;
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalLuminance = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalLuminance += (0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2]) / 255;
    }
    const avgLuminance = totalLuminance / (data.length / 4);
    const targetLuminance = 0.5;
    let gain = 1.0;
    if (avgLuminance < targetLuminance) gain = Math.min(1.8, targetLuminance / Math.max(0.1, avgLuminance));
    const factor = (259 * (20 + 255)) / (255 * (259 - 20));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] * gain - 128) + 128));
      data[i+1] = Math.min(255, Math.max(0, factor * (data[i+1] * gain - 128) + 128));
      data[i+2] = Math.min(255, Math.max(0, factor * (data[i+2] * gain - 128) + 128));
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleStateTransition = useCallback(() => {
    setMode((prevMode) => getNextMode(prevMode));
    resetAutoTransition();
  }, []);

  const resetAutoTransition = useCallback(() => {
    if (autoTransitionTimer.current) window.clearInterval(autoTransitionTimer.current);
    autoTransitionTimer.current = window.setInterval(() => {
      setMode((prevMode) => getNextMode(prevMode));
    }, 45000); 
  }, []);

  const handleExplosion = () => {
    setCurrentWish(WISHES[Math.floor(Math.random() * WISHES.length)]);
    
    setTimeout(() => {
      setMode(AppMode.WISH);
      if (autoTransitionTimer.current) window.clearInterval(autoTransitionTimer.current);
      autoTransitionTimer.current = window.setInterval(() => {
         handleStateTransition();
      }, 18000); 
    }, 1000); 
  };

  useEffect(() => {
    const handleFirstInteraction = () => { setHasInteracted(true); resetAutoTransition(); window.removeEventListener('click', handleFirstInteraction); };
    window.addEventListener('click', handleFirstInteraction);
    return () => { if (autoTransitionTimer.current) window.clearInterval(autoTransitionTimer.current); };
  }, [resetAutoTransition]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        const img = new Image(); img.src = e.target.result;
        img.onload = () => { setUploadedImage(processImageAdjustments(img)); setMode(AppMode.IMAGE); resetAutoTransition(); };
      }
    };
    reader.readAsDataURL(file);
  };

  // Logic: Hiển thị hướng dẫn ở GREETING, TEXT hoặc IMAGE (nếu đã có ảnh). Ẩn ở TREE và WISH.
  const showInstructions = mode === AppMode.GREETING || mode === AppMode.TEXT || (mode === AppMode.IMAGE && uploadedImage !== null);

  return (
    <div className="w-full h-screen bg-[#050505] relative overflow-hidden text-white font-['Montserrat']" onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f); }} onDragOver={(e) => e.preventDefault()}>
      <img 
        src="https://res.cloudinary.com/ddyxnhxz3/image/upload/v1766380159/logo_ste_gkwhv4.svg" 
        alt="STe Logo" 
        className="fixed top-6 left-6 z-[100] h-6 md:h-11 w-auto object-contain pointer-events-none select-none drop-shadow-[0_0_20px_rgba(249,206,25,0.4)]"
      />

      <Scene mode={mode} setMode={handleStateTransition} uploadedImage={uploadedImage} onExplode={handleExplosion} wishText={currentWish} />
      
      <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-1 transition-all duration-700 pointer-events-none text-center ${showInstructions ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-[11px] md:text-xs font-medium tracking-[0.1em] whitespace-nowrap text-[#f9ce19]/90 drop-shadow-md">
          Tap 👆 and Spin 👉 👈
        </p>
        <p className="text-[11px] md:text-xs font-medium tracking-[0.1em] whitespace-nowrap text-[#f9ce19]/90 drop-shadow-md">
          to see 👀 your wish ✨
        </p>
      </div>

      {mode === AppMode.IMAGE && !uploadedImage && (
        <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer hover:bg-black/30 transition-colors duration-500 p-8">
          <h2 className="text-6xl md:text-8xl font-thin tracking-widest text-white/90 mb-6 mix-blend-overlay">UPLOAD</h2>
          <p className="text-[10px] md:text-xs tracking-[0.3em] text-white/70 uppercase text-center max-w-[280px] md:max-w-md leading-relaxed">
            Choose your favorite photo
          </p>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} accept="image/*" className="hidden" />
    </div>
  );
};

export default App;
