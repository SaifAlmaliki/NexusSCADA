'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ScanLine, Crosshair, AlertTriangle, CheckCircle2, Info, Camera, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simulated AR Data Overlays based on recognized equipment
const arData = {
  'Reactor 101': {
    status: 'RUNNING',
    temp: '85.2 °C',
    pressure: '2.1 bar',
    health: '92%',
    nextMaintenance: '15 Apr 2026',
    anomalies: 0,
    warnings: [],
  },
  'Mixer 201': {
    status: 'WARNING',
    temp: '92.5 °C',
    pressure: '1.8 bar',
    health: '65%',
    nextMaintenance: '05 Mar 2026',
    anomalies: 1,
    warnings: ['High motor casing temperature detected.'],
  }
};

export default function AROverlayPage() {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedAsset, setRecognizedAsset] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleScan = useCallback(() => {
    setIsScanning(true);
    setRecognizedAsset(null);
    
    // Simulate image recognition / QR code scanning delay
    setTimeout(() => {
      setIsScanning(false);
      // Randomly recognize one of the assets or fail
      const rand = Math.random();
      if (rand > 0.5) {
        setRecognizedAsset('Reactor 101');
      } else if (rand > 0.1) {
        setRecognizedAsset('Mixer 201');
      } else {
        setRecognizedAsset(null);
        alert("No recognizable asset found in view.");
      }
    }, 2500);
  }, []);

  const assetData = recognizedAsset ? arData[recognizedAsset as keyof typeof arData] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScanLine className="text-indigo-600" size={24} />
            AR Technician Overlay
          </h1>
          <p className="text-sm text-slate-500 mt-1">Point camera at equipment or QR code to view live telemetry and maintenance data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleCamera}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-300"
          >
            <RefreshCcw size={16} />
            Flip Camera
          </button>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Camera size={16} className={cn(isScanning && "animate-pulse")} />
            {isScanning ? 'Scanning...' : 'Scan Asset'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AR Viewfinder */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-0 relative bg-black min-h-[500px] flex items-center justify-center">
            
            {/* Webcam Feed */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="relative w-64 h-64 border-2 border-indigo-500 rounded-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500/50" size={48} />
                </div>
                <p className="text-white font-mono mt-4 animate-pulse tracking-widest uppercase text-sm">Analyzing Image...</p>
              </div>
            )}

            {/* Recognized Asset Overlay */}
            {!isScanning && recognizedAsset && assetData && (
              <div className="absolute inset-0 z-20 pointer-events-none p-6">
                {/* Bounding Box Simulation */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-emerald-500 border-dashed rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-500"></div>
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-500"></div>
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-500"></div>
                  <Crosshair className="text-emerald-500/50" size={32} />
                </div>

                {/* Floating Data Card */}
                <div className="absolute top-1/4 left-[70%] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl w-64 pointer-events-auto transform transition-all duration-500 hover:scale-105">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                    <h3 className="text-white font-bold text-lg">{recognizedAsset}</h3>
                    {assetData.status === 'RUNNING' ? (
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    ) : (
                      <AlertTriangle className="text-amber-400" size={20} />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temp:</span>
                      <span className="text-white font-mono">{assetData.temp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pressure:</span>
                      <span className="text-white font-mono">{assetData.pressure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health:</span>
                      <span className={cn("font-mono font-bold", parseInt(assetData.health) > 80 ? "text-emerald-400" : "text-amber-400")}>
                        {assetData.health}
                      </span>
                    </div>
                  </div>

                  {assetData.warnings.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700">
                      <div className="flex items-start gap-2 text-amber-400 text-xs">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <p>{assetData.warnings[0]}</p>
                      </div>
                    </div>
                  )}
                  
                  <button className="w-full mt-4 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium rounded transition-colors">
                    View Full Diagnostics
                  </button>
                </div>
              </div>
            )}

            {/* Idle State */}
            {!isScanning && !recognizedAsset && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20">
                <Crosshair className="text-white/30 mb-4" size={64} />
                <p className="text-white/70 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Point camera and tap &quot;Scan Asset&quot;</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Contextual Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="text-slate-500" size={18} />
              Asset Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recognizedAsset && assetData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{recognizedAsset}</h3>
                  <p className="text-sm text-slate-500">Chemical Synthesis Unit</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-bold",
                      assetData.status === 'RUNNING' ? "text-emerald-600" : "text-amber-600"
                    )}>{assetData.status}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Health Score</p>
                    <p className="text-sm font-bold text-slate-800">{assetData.health}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-1">Next Scheduled Maintenance</p>
                    <p className="text-sm font-bold text-slate-800">{assetData.nextMaintenance}</p>
                  </div>
                </div>

                {assetData.anomalies > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} />
                      Active Anomalies ({assetData.anomalies})
                    </h4>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                      {assetData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <button className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                    Log Maintenance Activity
                  </button>
                  <button className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    View Manuals & SOPs
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ScanLine className="text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium">No Asset Selected</p>
                <p className="text-sm text-slate-400 mt-2 max-w-[200px]">Scan an asset using the AR viewfinder to load contextual data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add custom animation for scanning line */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
