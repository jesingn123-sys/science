
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastScanTime = useRef<number>(0);
  const [error, setError] = useState<string>('');
  
  // Continuous scanning state
  const isScanningRef = useRef(true);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Downscale for performance
      const scale = 0.5; 
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      }) : null;

      // Cooldown logic: Don't scan the same thing immediately within 2.5 seconds
      const now = Date.now();
      const inCooldown = (now - lastScanTime.current) < 2500;

      if (code && code.data && code.data.trim().length > 0 && !inCooldown) {
        lastScanTime.current = now;
        onScan(code.data);
      }
    }
    requestAnimationFrame(scanFrame);
  }, [onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    isScanningRef.current = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 }, 
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); 
          videoRef.current.play();
          requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera blocked or not available. Please allow camera permissions in your browser.");
      }
    };

    startCamera();

    return () => {
      isScanningRef.current = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanFrame]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={onClose}
          className="p-3 bg-white text-black rounded-full shadow-lg font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
          Stop & Dashboard
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-white font-mono p-6 text-center max-w-sm mx-auto">
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <p className="mb-2 text-xl font-bold">📷 Camera Access Denied</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={onClose} className="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold">
              Close Scanner
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover" 
              style={{ transform: 'scaleX(1)' }} 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Dark Overlay with Transparent Window */}
            <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none">
               <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-72 h-72 border-2 border-white/50 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                     {/* Corners */}
                     <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                     <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                     <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                     <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-xl"></div>
                     
                     {/* Scanning Line Animation */}
                     <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-white/90 font-mono text-sm mt-8 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    Live Scanning Active...
                  </p>
               </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
