export enum Emotion {
  Happy = 'Happy',
  Neutral = 'Neutral',
  Angry = 'Angry',
  Sad = 'Sad',
  Surprised = 'Surprised',
  Fear = 'Fear',
  Disgust = 'Disgust'
}

export enum CognitiveLoad {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface HealthMetrics {
  timestamp: number;
  emotion: Emotion;
  heartRate: number; // BPM
  stressScore: number; // 0-100
  cognitiveLoad: CognitiveLoad;
}

export interface GeminiAnalysisResult {
  emotion: Emotion;
  stress_score: number;
  cognitive_load: CognitiveLoad;
  reasoning: string;
}

export interface AnalysisConfig {
  apiKey: string;
  intervalSeconds: number;
}
