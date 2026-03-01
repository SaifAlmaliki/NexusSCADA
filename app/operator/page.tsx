'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ScanLine, Mic, Camera, WifiOff, Wifi, Play, Pause, Square, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { cn } from '@/components/Sidebar';
import Webcam from 'react-webcam';

// Mock data for batches
const mockBatches = [
  { id: 'b1', batchNumber: 'B-2026-001', barcode: '123456789', product: 'Industrial Lubricant XL', status: 'PENDING', targetQty: 5000 },
  { id: 'b2', batchNumber: 'B-2026-002', barcode: '987654321', product: 'Coolant Premium', status: 'IN_PROGRESS', targetQty: 2000 },
];

export default function OperatorApp() {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'scan' | 'batch' | 'inspect' | 'trace'>('scan');
  
  // Batch State
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [currentBatch, setCurrentBatch] = useState<any>(null);
  const [batchStatus, setBatchStatus] = useState<string>('PENDING');

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Camera State
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Traceability State
  const [scannedLot, setScannedLot] = useState<string>('');
  const [lotDetails, setLotDetails] = useState<any>(null);
  const [isLookingUpLot, setIsLookingUpLot] = useState(false);

  // Offline Queue
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const syncOfflineQueue = async (queue: any[]) => {
    if (queue.length === 0) return;
    
    // In a real app, send to API
    console.log('Syncing offline queue...', queue);
    setTimeout(() => {
      setOfflineQueue([]);
      alert('Offline actions synced successfully!');
    }, 1500);
  };

  // Network Status
  useEffect(() => {
    const init = () => {
      setIsOnline(navigator.onLine);
      // Load offline queue from local storage
      const savedQueue = localStorage.getItem('operatorOfflineQueue');
      if (savedQueue) {
        setOfflineQueue(JSON.parse(savedQueue));
      }
    };
    
    // Run initialization asynchronously
    setTimeout(init, 0);
    
    const handleOnline = () => {
      setIsOnline(true);
      // We need to use the latest state here, so we'll rely on another effect
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue(offlineQueue);
    }
  }, [isOnline, offlineQueue]);

  // Save queue to local storage when it changes
  useEffect(() => {
    localStorage.setItem('operatorOfflineQueue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const addToQueue = (action: string, payload: any) => {
    const newAction = { id: Date.now().toString(), action, payload, timestamp: new Date().toISOString() };
    setOfflineQueue(prev => [...prev, newAction]);
    if (isOnline) {
      // Try to sync immediately if online
      setTimeout(() => {
        setOfflineQueue(prev => prev.filter(item => item.id !== newAction.id));
      }, 500);
    }
  };

  // --- Barcode Scanning ---
  const handleSimulateScan = () => {
    // Simulate scanning a barcode
    const barcode = '123456789';
    setScannedBarcode(barcode);
    const batch = mockBatches.find(b => b.barcode === barcode);
    if (batch) {
      setCurrentBatch(batch);
      setBatchStatus(batch.status);
      setActiveTab('batch');
    } else {
      alert('Batch not found for barcode: ' + barcode);
    }
  };

  const handleSimulateLotScan = async () => {
    const lotNumber = 'A123'; // Simulate scanning Acid Lot A123
    setScannedLot(lotNumber);
    setIsLookingUpLot(true);
    
    try {
      // In a real app, this would fetch from the API
      // We'll simulate the API response for the demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLot = {
        lotNumber: 'A123',
        materialName: '98% Acid',
        type: 'RAW_MATERIAL',
        quantity: 5000,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 31536000000).toISOString(), // +1 year
        status: 'RELEASED'
      };
      
      setLotDetails(mockLot);
    } catch (error) {
      console.error('Failed to lookup lot', error);
      alert('Failed to lookup lot: ' + lotNumber);
    } finally {
      setIsLookingUpLot(false);
    }
  };

  // --- Voice Commands ---
  const toggleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setTranscript(text);
      
      if (text.includes('start batch')) {
        handleBatchAction('IN_PROGRESS');
      } else if (text.includes('stop batch') || text.includes('complete batch')) {
        handleBatchAction('COMPLETED');
      } else if (text.includes('hold batch') || text.includes('pause batch')) {
        handleBatchAction('HOLD');
      } else {
        setTimeout(() => setTranscript('Command not recognized'), 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setTranscript('Error: ' + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setTranscript(''), 3000);
    };

    recognition.start();
  };

  const handleBatchAction = (newStatus: string) => {
    if (!currentBatch) return;
    setBatchStatus(newStatus);
    addToQueue('UPDATE_BATCH_STATUS', { batchId: currentBatch.id, status: newStatus });
  };

  // --- Photo Inspection ---
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const analyzePhoto = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      // In a real app, we would send the base64 image to our API which calls Gemini
      // For this demo, we'll simulate the AI response
      setTimeout(() => {
        const isDefective = Math.random() > 0.7;
        const result = {
          isDefective,
          confidence: (Math.random() * 20 + 80).toFixed(1),
          issues: isDefective ? ['Surface scratch detected', 'Color inconsistency'] : [],
          notes: isDefective ? 'Product fails visual quality standards.' : 'Product meets visual quality standards.'
        };
        setAiResult(result);
        setIsAnalyzing(false);

        // Queue the inspection result
        addToQueue('SUBMIT_INSPECTION', { 
          batchId: currentBatch?.id, 
          isDefective: result.isDefective,
          notes: result.notes
        });
      }, 2000);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAiResult(null);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-20">
      {/* App Header */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div>
          <h1 className="font-bold text-lg">Nexus Operator</h1>
          <p className="text-xs text-slate-400">{session?.user?.name || 'Operator'}</p>
        </div>
        <div className="flex items-center gap-3">
          {offlineQueue.length > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-medium">
              <UploadCloud size={14} />
              {offlineQueue.length}
            </div>
          )}
          {isOnline ? (
            <Wifi className="text-emerald-400" size={20} />
          ) : (
            <WifiOff className="text-red-400" size={20} />
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('scan')}
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'scan' ? "bg-white shadow text-slate-800" : "text-slate-500")}
          >
            Scan
          </button>
          <button 
            onClick={() => setActiveTab('batch')}
            disabled={!currentBatch}
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'batch' ? "bg-white shadow text-slate-800" : "text-slate-500", !currentBatch && "opacity-50")}
          >
            Batch
          </button>
          <button 
            onClick={() => setActiveTab('inspect')}
            disabled={!currentBatch}
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'inspect' ? "bg-white shadow text-slate-800" : "text-slate-500", !currentBatch && "opacity-50")}
          >
            Inspect
          </button>
          <button 
            onClick={() => setActiveTab('trace')}
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'trace' ? "bg-white shadow text-slate-800" : "text-slate-500")}
          >
            Trace
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scan' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <ScanLine size={48} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Scan Batch Barcode</h2>
              <p className="text-sm text-slate-500 mb-6">Use your device camera to scan the traveler document or container barcode.</p>
              
              <button 
                onClick={handleSimulateScan}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Simulate Scan (B-2026-001)
              </button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'batch' && currentBatch && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Batch Number</p>
                    <h2 className="text-xl font-bold text-slate-800">{currentBatch.batchNumber}</h2>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    batchStatus === 'PENDING' ? "bg-slate-100 text-slate-600" :
                    batchStatus === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                    batchStatus === 'HOLD' ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {batchStatus}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Product</span>
                    <span className="font-medium text-slate-800">{currentBatch.product}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Target Qty</span>
                    <span className="font-medium text-slate-800">{currentBatch.targetQty} L</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleBatchAction('IN_PROGRESS')}
                disabled={batchStatus === 'IN_PROGRESS' || batchStatus === 'COMPLETED'}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Play className="text-emerald-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-700">Start</span>
              </button>
              <button 
                onClick={() => handleBatchAction('HOLD')}
                disabled={batchStatus !== 'IN_PROGRESS'}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Pause className="text-amber-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-700">Hold</span>
              </button>
              <button 
                onClick={() => handleBatchAction('COMPLETED')}
                disabled={batchStatus !== 'IN_PROGRESS'}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Square className="text-slate-500 mb-2" size={24} />
                <span className="text-xs font-medium text-slate-700">Finish</span>
              </button>
            </div>

            {/* Voice Command Button */}
            <Card className="border-0 shadow-sm bg-indigo-50 border border-indigo-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-indigo-900">Voice Control</p>
                  <p className="text-xs text-indigo-700 mt-1">Say &quot;Start Batch&quot;, &quot;Hold Batch&quot;</p>
                  {transcript && <p className="text-xs font-mono text-indigo-600 mt-2 bg-indigo-100 px-2 py-1 rounded inline-block">&quot;{transcript}&quot;</p>}
                </div>
                <button 
                  onClick={toggleVoiceCommand}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white"
                  )}
                >
                  <Mic size={20} />
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'inspect' && currentBatch && (
          <div className="space-y-4">
            {!capturedImage ? (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'environment' }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
                    <div className="w-full h-full border-2 border-white/50 rounded-lg"></div>
                  </div>
                  
                  <button 
                    onClick={capturePhoto}
                    className="absolute bottom-6 w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-lg active:scale-90 transition-transform flex items-center justify-center"
                  >
                    <Camera className="text-slate-800" size={24} />
                  </button>
                </div>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative aspect-[3/4] bg-black">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">AI Analyzing Image...</p>
                    </div>
                  )}

                  {!isAnalyzing && aiResult && (
                    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                      <div className="flex items-center gap-3 mb-3">
                        {aiResult.isDefective ? (
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <div>
                          <h3 className={cn("font-bold", aiResult.isDefective ? "text-red-700" : "text-emerald-700")}>
                            {aiResult.isDefective ? "Defect Detected" : "Quality Passed"}
                          </h3>
                          <p className="text-xs text-slate-500">Confidence: {aiResult.confidence}%</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-4">{aiResult.notes}</p>
                      
                      {aiResult.issues.length > 0 && (
                        <ul className="text-xs text-red-600 list-disc list-inside mb-4 bg-red-50 p-2 rounded">
                          {aiResult.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
                        </ul>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={retakePhoto}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200"
                        >
                          Retake
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab('batch');
                            retakePhoto();
                          }}
                          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {!isAnalyzing && !aiResult && (
                  <div className="p-4 flex gap-2 bg-white">
                    <button 
                      onClick={retakePhoto}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                    >
                      Retake
                    </button>
                    <button 
                      onClick={analyzePhoto}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <ScanLine size={18} />
                      Analyze with AI
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
        {activeTab === 'trace' && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <ScanLine size={32} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Scan Material Lot</h2>
                <p className="text-sm text-slate-500 mb-6">Scan a raw material barcode to verify status and expiry.</p>
                
                <button 
                  onClick={handleSimulateLotScan}
                  disabled={isLookingUpLot}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLookingUpLot ? 'Looking up...' : 'Simulate Scan (Lot A123)'}
                </button>
              </CardContent>
            </Card>

            {lotDetails && (
              <Card className="border-0 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Material Lot</p>
                      <h2 className="text-xl font-bold text-slate-800">{lotDetails.lotNumber}</h2>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      lotDetails.status === 'RELEASED' ? "bg-emerald-100 text-emerald-700" :
                      lotDetails.status === 'QUARANTINED' ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {lotDetails.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Material</span>
                      <span className="font-medium text-slate-800">{lotDetails.materialName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Quantity Available</span>
                      <span className="font-medium text-slate-800">{lotDetails.quantity} {lotDetails.unit}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Expiry Date</span>
                      <span className={cn(
                        "font-medium",
                        new Date(lotDetails.expiryDate) < new Date() ? "text-red-600" : "text-emerald-600"
                      )}>
                        {new Date(lotDetails.expiryDate).toLocaleDateString()}
                        {new Date(lotDetails.expiryDate) < new Date() && " (EXPIRED)"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button 
                      onClick={() => {
                        if (currentBatch) {
                          addToQueue('CONSUME_MATERIAL', { batchId: currentBatch.id, lotNumber: lotDetails.lotNumber });
                          alert(`Lot ${lotDetails.lotNumber} queued for consumption in Batch ${currentBatch.batchNumber}`);
                          setLotDetails(null);
                        } else {
                          alert('Please start a batch first to consume this material.');
                        }
                      }}
                      className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
                    >
                      Consume in Current Batch
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
