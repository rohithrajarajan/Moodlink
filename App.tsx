import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricCard from './components/MetricCard';
import LiveCharts from './components/LiveCharts';
import { analyzeFrame } from './services/geminiService';
import { HealthMetrics, Emotion, CognitiveLoad } from './types';
import {
  ANALYSIS_INTERVAL_MS,
  MAX_HISTORY_POINTS,
  HIGH_STRESS_THRESHOLD,
  INITIAL_BPM,
  COGNITIVE_RESET_BATCH_THRESHOLD
} from './constants';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [metricsHistory, setMetricsHistory] = useState<HealthMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<HealthMetrics>({
    timestamp: Date.now(),
    emotion: Emotion.Neutral,
    heartRate: INITIAL_BPM,
    stressScore: 10,
    cognitiveLoad: CognitiveLoad.Low
  });
  const [consecutiveHighStress, setConsecutiveHighStress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reasoning, setReasoning] = useState<string>("Waiting for analysis...");

  // Ref to keep track of current stress for the 'simulated' heart rate loop
  const currentStressRef = useRef(10);

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Reset logic on start
      setMetricsHistory([]);
      setConsecutiveHighStress(0);
      setReasoning("Initializing stream...");
    }
  };

  // Heart Rate Simulation Loop (Updates more frequently than Gemini)
  // This provides immediate feedback while waiting for the "Batch" analysis from Gemini
  useEffect(() => {
    if (!isActive) return;

    const bpmInterval = setInterval(() => {
      setCurrentMetrics(prev => {
        // Base HR modulation based on stress
        // Low stress (0) -> ~65-75 BPM
        // High stress (100) -> ~90-110 BPM
        const stressFactor = currentStressRef.current / 100;
        const targetBPM = 70 + (stressFactor * 30);
        
        // Add natural variability (HRV simulation)
        const variability = (Math.random() - 0.5) * (5 + (stressFactor * 10)); 
        const newBPM = Math.round(targetBPM + variability);

        const newMetric = {
          ...prev,
          timestamp: Date.now(),
          heartRate: newBPM
        };

        setMetricsHistory(history => {
          const newHistory = [...history, newMetric];
          return newHistory.slice(-MAX_HISTORY_POINTS); // Keep last N points
        });

        return newMetric;
      });
    }, 1000); // Update BPM every second

    return () => clearInterval(bpmInterval);
  }, [isActive]);


  // Handler for frame capture (triggered every ANALYSIS_INTERVAL_MS)
  const handleFrameCapture = useCallback(async (imageData: string) => {
    if (isAnalyzing) return; // Prevent overlapping requests

    setIsAnalyzing(true);
    try {
      const result = await analyzeFrame(imageData);

      // Update ref for the BPM simulation loop
      currentStressRef.current = result.stress_score;

      // Update state
      setCurrentMetrics(prev => ({
        ...prev,
        emotion: result.emotion,
        stressScore: result.stress_score,
        cognitiveLoad: result.cognitive_load
      }));

      setReasoning(result.reasoning);

      // Check for persistent high stress
      if (result.stress_score > HIGH_STRESS_THRESHOLD) {
        setConsecutiveHighStress(prev => prev + 1);
      } else {
        setConsecutiveHighStress(0);
      }

    } catch (error) {
      console.error("Analysis loop error", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);


  const getEmotionEmoji = (emotion: Emotion) => {
    switch (emotion) {
      case Emotion.Happy: return "😊";
      case Emotion.Sad: return "😢";
      case Emotion.Angry: return "😠";
      case Emotion.Surprised: return "😲";
      case Emotion.Fear: return "😨";
      case Emotion.Disgust: return "🤢";
      default: return "😐";
    }
  };

  const getCognitiveColor = (load: CognitiveLoad) => {
    switch (load) {
      case CognitiveLoad.High: return "red";
      case CognitiveLoad.Medium: return "yellow";
      default: return "green";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MoodLink</h1>
          <p className="text-gray-500">AI-Driven Mental Health Monitoring Prototype</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 text-right hidden md:block">
            Powered by<br />Google Gemini 1.5 Flash
          </div>
          <button
            onClick={toggleMonitoring}
            className={`px-6 py-3 rounded-full font-semibold shadow-lg transition-all ${
              isActive 
                ? "bg-red-500 hover:bg-red-600 text-white ring-red-200"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-indigo-200"
            } ring-4`}
          >
            {isActive ? "Stop Monitoring" : "Start Monitor"}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera & Status */}
        <div className="lg:col-span-4 space-y-6">
          <CameraFeed 
            isActive={isActive} 
            onFrameCapture={handleFrameCapture} 
            captureIntervalMs={ANALYSIS_INTERVAL_MS} 
          />
          
          {/* Cognitive Reset Alert */}
          {consecutiveHighStress >= COGNITIVE_RESET_BATCH_THRESHOLD && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm animate-bounce">
              <div className="flex items-center gap-2 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                High Cognitive Load Detected
              </div>
              <p className="mt-1 text-sm">
                Sustained high stress detected. Recommendation: Take a <b>Cognitive Reset</b>. 
                Close your eyes, breathe deeply for 30 seconds.
              </p>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Analysis Insight</h3>
            <p className="text-sm text-gray-700 italic">
              "{reasoning}"
            </p>
            <div className="mt-2 flex justify-end">
               {isAnalyzing && <span className="text-xs text-indigo-500 animate-pulse">Analyzing frame...</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Metrics Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Emotion" 
              value={currentMetrics.emotion} 
              icon={<span>{getEmotionEmoji(currentMetrics.emotion)}</span>}
            />
            <MetricCard 
              label="Heart Rate" 
              value={currentMetrics.heartRate} 
              subtext="BPM (Simulated)"
              color={currentMetrics.heartRate > 100 ? "red" : "default"}
              icon={<span className="text-red-500">♥</span>}
            />
            <MetricCard 
              label="Stress Score" 
              value={currentMetrics.stressScore} 
              subtext="/ 100"
              color={currentMetrics.stressScore > HIGH_STRESS_THRESHOLD ? "yellow" : "blue"}
            />
             <MetricCard 
              label="Cognitive Load" 
              value={currentMetrics.cognitiveLoad} 
              color={getCognitiveColor(currentMetrics.cognitiveLoad)}
            />
          </div>

          {/* Charts Area */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Live Biometrics</h2>
                <div className="flex gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> BPM
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Stress
                  </div>
                </div>
             </div>
             <LiveCharts data={metricsHistory} />
          </div>

          {/* Info Footer */}
          <div className="text-center text-xs text-gray-400 mt-8">
            <p>Prototype for academic demonstration only. Not a medical device.</p>
            <p>Heart rate is simulated based on visual stress analysis due to browser limitations.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
