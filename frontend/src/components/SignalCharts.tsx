import React, { useEffect, useRef } from 'react';
import { Activity, Compass, BarChart2 } from 'lucide-react';
import { AnalysisMessage } from '../types';

interface SignalChartsProps {
  imuBufferRef: React.MutableRefObject<{
    t: number[];
    ax: number[];
    ay: number[];
    az: number[];
    gx: number[];
    gy: number[];
    gz: number[];
  }>;
  analysis: AnalysisMessage | null;
}

export const SignalCharts: React.FC<SignalChartsProps> = ({ imuBufferRef, analysis }) => {
  const accCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gyrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance continuous animation loop for Accel & Gyro
  useEffect(() => {
    let animId: number;

    const render = () => {
      const buf = imuBufferRef.current;
      const len = buf.t.length;

      // 1. Accelerometer Canvas
      const accCanvas = accCanvasRef.current;
      if (accCanvas && len > 1) {
        const ctx = accCanvas.getContext('2d');
        if (ctx) {
          const w = (accCanvas.width = accCanvas.clientWidth * window.devicePixelRatio);
          const h = (accCanvas.height = accCanvas.clientHeight * window.devicePixelRatio);

          ctx.clearRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = '#f1f5f9';
          ctx.lineWidth = 1;
          for (let y = 0.25; y < 1; y += 0.25) {
            ctx.beginPath();
            ctx.moveTo(0, y * h);
            ctx.lineTo(w, y * h);
            ctx.stroke();
          }

          // Zero line
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Range: -2g to +2g
          const scaleY = (val: number) => h / 2 - (val / 2.0) * (h / 2);

          const drawTrace = (data: number[], color: string) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.75;
            ctx.beginPath();
            for (let i = 0; i < len; i++) {
              const x = (i / (len - 1)) * w;
              const y = scaleY(data[i]);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          };

          drawTrace(buf.ax, '#4f46e5'); // ax (Indigo)
          drawTrace(buf.ay, '#7c3aed'); // ay (Violet)
          drawTrace(buf.az, '#0284c7'); // az (Sky)
        }
      }

      // 2. Gyroscope Canvas
      const gyrCanvas = gyrCanvasRef.current;
      if (gyrCanvas && len > 1) {
        const ctx = gyrCanvas.getContext('2d');
        if (ctx) {
          const w = (gyrCanvas.width = gyrCanvas.clientWidth * window.devicePixelRatio);
          const h = (gyrCanvas.height = gyrCanvas.clientHeight * window.devicePixelRatio);

          ctx.clearRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = '#f1f5f9';
          ctx.lineWidth = 1;
          for (let y = 0.25; y < 1; y += 0.25) {
            ctx.beginPath();
            ctx.moveTo(0, y * h);
            ctx.lineTo(w, y * h);
            ctx.stroke();
          }

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Range: -250 deg/s to +250 deg/s
          const scaleY = (val: number) => h / 2 - (val / 250.0) * (h / 2);

          const drawTrace = (data: number[], color: string) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.75;
            ctx.beginPath();
            for (let i = 0; i < len; i++) {
              const x = (i / (len - 1)) * w;
              const y = scaleY(data[i]);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          };

          drawTrace(buf.gx, '#059669'); // gx (Emerald)
          drawTrace(buf.gy, '#0d9488'); // gy (Teal)
          drawTrace(buf.gz, '#d97706'); // gz (Amber)
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [imuBufferRef]);

  // FFT Canvas rendering whenever analysis packet updates
  useEffect(() => {
    const fftCanvas = fftCanvasRef.current;
    if (!fftCanvas) return;
    const ctx = fftCanvas.getContext('2d');
    if (!ctx) return;

    const w = (fftCanvas.width = fftCanvas.clientWidth * window.devicePixelRatio);
    const h = (fftCanvas.height = fftCanvas.clientHeight * window.devicePixelRatio);

    ctx.clearRect(0, 0, w, h);

    if (!analysis || !analysis.f || analysis.f.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating 4-second epoch for FFT…', w / 2, h / 2);
      return;
    }

    const { f, p, dom, band } = analysis;
    const maxFreq = 20; // 0 to 20 Hz
    const maxP = Math.max(...p, 0.0001);

    // Highlight Parkinsonian band (3 to 12 Hz)
    const bandX1 = (band[0] / maxFreq) * w;
    const bandX2 = (band[1] / maxFreq) * w;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fillRect(bandX1, 0, bandX2 - bandX1, h);

    // Grid lines for frequency (every 5 Hz)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let fStep = 5; fStep <= maxFreq; fStep += 5) {
      const gx = (fStep / maxFreq) * w;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${10 * window.devicePixelRatio}px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(`${fStep}Hz`, gx, h - 6);
    }

    // Area fill under power spectrum
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let i = 0; i < f.length; i++) {
      if (f[i] > maxFreq) break;
      const x = (f[i] / maxFreq) * w;
      const y = h - (p[i] / maxP) * (h - 20) - 10;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Line curve on top
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < f.length; i++) {
      if (f[i] > maxFreq) break;
      const x = (f[i] / maxFreq) * w;
      const y = h - (p[i] / maxP) * (h - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dominant peak marker
    if (dom && dom <= maxFreq) {
      const domX = (dom / maxFreq) * w;
      ctx.strokeStyle = '#e11d48';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(domX, 0);
      ctx.lineTo(domX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#e11d48';
      ctx.font = `bold ${10 * window.devicePixelRatio}px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(`Peak: ${dom.toFixed(1)} Hz`, domX, 16 * window.devicePixelRatio);
    }
  }, [analysis]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Accelerometer Chart */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Tri-Axial Accelerometer
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-indigo-700 font-semibold">
              <span className="w-2 h-0.5 bg-indigo-600 rounded-full" /> Ax
            </span>
            <span className="flex items-center gap-1 text-purple-700 font-semibold">
              <span className="w-2 h-0.5 bg-purple-600 rounded-full" /> Ay
            </span>
            <span className="flex items-center gap-1 text-sky-700 font-semibold">
              <span className="w-2 h-0.5 bg-sky-600 rounded-full" /> Az
            </span>
            <span className="text-slate-400">±2g @ 100Hz</span>
          </div>
        </div>

        <div className="relative flex-1 h-44 bg-slate-50/60 rounded-lg overflow-hidden border border-slate-200/80">
          <canvas ref={accCanvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* 2. Gyroscope Chart */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Tri-Axial Gyroscope
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-0.5 bg-emerald-600 rounded-full" /> Gx
            </span>
            <span className="flex items-center gap-1 text-teal-700 font-semibold">
              <span className="w-2 h-0.5 bg-teal-600 rounded-full" /> Gy
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-2 h-0.5 bg-amber-600 rounded-full" /> Gz
            </span>
            <span className="text-slate-400">±250°/s</span>
          </div>
        </div>

        <div className="relative flex-1 h-44 bg-slate-50/60 rounded-lg overflow-hidden border border-slate-200/80">
          <canvas ref={gyrCanvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* 3. Frequency Spectrum (FFT) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Frequency Spectrum (FFT)
            </h3>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Hann Window · 4s Window
          </div>
        </div>

        <div className="relative flex-1 h-44 bg-slate-50/60 rounded-lg overflow-hidden border border-slate-200/80">
          <canvas ref={fftCanvasRef} className="w-full h-full block" />
        </div>
      </div>
    </div>
  );
};
