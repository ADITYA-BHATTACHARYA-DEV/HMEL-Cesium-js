'use client';

import 'cesium/Build/Cesium/Widgets/widgets.css';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const DigitalTwin = dynamic(() => import('@/components/DigitalTwin'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        <p className="text-cyan-400 font-mono tracking-widest text-sm animate-pulse">INIT_GEOSPATIAL_CORE</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black select-none">
      
      {/* --- TOP LEFT: IDENTITY & TELEMETRY --- */}
      <div className="absolute top-6 left-6 z-20 space-y-4 w-72">
        <div className="bg-slate-950/80 backdrop-blur-md border-l-4 border-cyan-500 p-4 shadow-2xl">
          <h1 className="text-white text-lg font-black italic tracking-tighter uppercase flex items-center gap-2">
            Digital Twin <span className="text-cyan-500 font-normal not-italic text-xs border border-cyan-500/30 px-1">CARACAS_V1</span>
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
              <p className="text-xs text-green-400 font-mono">● OPERATIONAL</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Latency</p>
              <p className="text-xs text-white font-mono">24ms</p>
            </div>
          </div>
        </div>

        {/* Local Analysis: Real-time Sensors */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-4 rounded-br-xl">
          <p className="text-[10px] font-bold text-cyan-500 mb-3 tracking-widest uppercase">Env Analysis</p>
          <div className="space-y-4">
            <SensorBar label="Air Quality (AQI)" value={42} color="bg-green-500" />
            <SensorBar label="Traffic Flow" value={88} color="bg-red-500" />
            <SensorBar label="Energy Load" value={65} color="bg-cyan-500" />
          </div>
        </div>
      </div>

      {/* --- TOP RIGHT: CHRONOS & WEATHER --- */}
      <div className="absolute top-6 right-6 z-20 text-right space-y-4">
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl">
          <p className="text-3xl font-mono text-white font-light tracking-tighter">{time}</p>
          <p className="text-[10px] text-slate-500 font-mono uppercase">14 FEB 2026 | VZ_TIMEZONE</p>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-4 justify-end">
          <div className="text-right">
            <p className="text-xs text-slate-400">Temp</p>
            <p className="text-lg text-white font-bold">28°C</p>
          </div>
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            ☀️
          </div>
        </div>
      </div>

      {/* --- BOTTOM RIGHT: COMMAND PALETTE --- */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 items-end">
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-4 rounded-xl mb-2 w-64">
           <p className="text-[10px] font-bold text-slate-500 mb-3 tracking-widest uppercase">Data Layers</p>
           <div className="grid grid-cols-2 gap-2">
              <LayerButton label="3D Buildings" active />
              <LayerButton label="Terrain" />
              <LayerButton label="Heatmap" />
              <LayerButton label="Cables" />
           </div>
        </div>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 pointer-events-auto">
          Export Analysis (.JSON)
        </button>
      </div>

      {/* --- BOTTOM LEFT: SYSTEM LOGS --- */}
      <div className="absolute bottom-6 left-6 z-20 w-80">
        <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400">LOCAL_CONSOLE_STDOUT</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="p-4 h-32 font-mono text-[10px] space-y-1 overflow-hidden opacity-80">
            <p className="text-blue-400">[INFO] Syncing with Sentinel-2 Satellite...</p>
            <p className="text-slate-400">[DATA] Fetching building heights for Caracas...</p>
            <p className="text-slate-400">[PROC] Interpolating 482 points...</p>
            <p className="text-green-400">[SUCCESS] Mesh optimized. Rendering active.</p>
            <p className="text-cyan-400 animate-pulse underline">&gt; Listening for user interaction...</p>
          </div>
        </div>
      </div>

      <DigitalTwin />
    </main>
  );
}

// --- SUBCOMPONENTS FOR CLEANER CODE ---

function SensorBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-1 uppercase tracking-tighter">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function LayerButton({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <div className={`px-2 py-2 rounded border text-[9px] text-center cursor-pointer transition-all ${
      active 
      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
    }`}>
      {label}
    </div>
  );
}