
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateJobs = async (level: number): Promise<Job[]> => {
  const ai = getAiClient();
  const prompt = `Generate 5 realistic freelance job listings for a digital marketplace. 
  Difficulty should be appropriate for experience level ${level}.
  Include a variety of categories like Programming, Design, Writing, and Data Analysis.
  The rewards should be in Indonesian Rupiah (IDR) ranging from 50,000 to 1,000,000 based on difficulty.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            reward: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
            category: { type: Type.STRING },
            status: { type: Type.STRING }
          },
          required: ['id', 'title', 'description', 'reward', 'difficulty', 'category', 'status']
        }
      }
    }
  });

  try {
    const jobs = JSON.parse(response.text);
    return jobs;
  } catch (e) {
    console.error("Failed to parse jobs", e);
    return [];
  }
};

export const evaluateJobTask = async (job: Job, submission: string): Promise<{ success: boolean; feedback: string }> => {
  const ai = getAiClient();
  const prompt = `Evaluate the following submission for the job: "${job.title}".
  Job Description: ${job.description}
  Submission: ${submission}
  
  Provide a boolean success value and a short feedback string.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        },
        required: ['success', 'feedback']
      }
    }
  });

  return JSON.parse(response.text);
};
