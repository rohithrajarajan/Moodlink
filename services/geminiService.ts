import { GoogleGenAI, Type } from "@google/genai";
import { Emotion, CognitiveLoad, GeminiAnalysisResult } from "../types";

// Schema for the structured output we want from Gemini
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    emotion: {
      type: Type.STRING,
      enum: Object.values(Emotion),
      description: "The dominant emotion detected in the facial expression.",
    },
    stress_score: {
      type: Type.INTEGER,
      description: "A score from 0 to 100 indicating visual signs of stress or tension.",
    },
    cognitive_load: {
      type: Type.STRING,
      enum: Object.values(CognitiveLoad),
      description: "Estimated cognitive load based on facial engagement and tension.",
    },
    reasoning: {
      type: Type.STRING,
      description: "Brief explanation of why these metrics were chosen based on visual cues.",
    },
  },
  required: ["emotion", "stress_score", "cognitive_load", "reasoning"],
};

export const analyzeFrame = async (base64Image: string): Promise<GeminiAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 string (remove data URL prefix if present)
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze the facial expression of the person in this image for a mental health monitoring prototype. 
            Determine their likely emotion, visual stress level (0-100), and estimated cognitive load.
            If no face is clearly visible, return Neutral, 0 stress, and Low load.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temperature for more consistent classification
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(text) as GeminiAnalysisResult;
    return data;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Return a fallback/neutral result so the app doesn't crash
    return {
      emotion: Emotion.Neutral,
      stress_score: 10,
      cognitive_load: CognitiveLoad.Low,
      reasoning: "Analysis failed or face not detected.",
    };
  }
};
