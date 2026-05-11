/**
 * STEP 1: INSTALL THE SDK
 * Run: npm install @google/genai
 */
import { GoogleGenAI } from "@google/genai";

/**
 * STEP 2: API KEY SETUP
 * In a standard project (Vite or Next.js): 
 * 1. Create a .env file
 * 2. Add: GEMINI_API_KEY=your_key_here
 * 
 * In AI Studio: The key is automatically available in process.env.GEMINI_API_KEY
 */
const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

/**
 * STEP 3: THE MODEL
 * 'gemini-1.5-flash' is the best choice for the Free Tier:
 * It's extremely fast and has a high rate limit (15 requests per minute).
 */
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { 
    temperature: 0.7, // Creativity level
  }
});

/**
 * Implementation: Text to Tags
 */
export async function getTagsForText(text: string): Promise<string[]> {
  if (!text) return [];

  const prompt = `Review the following text and provide exactly 5 descriptive tags (single words or short phrases) that summarize its content. Return ONLY a comma-separated list.
  
  Text: "${text}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tagsText = response.text();
    
    // Clean up the response and split by comma
    return tagsText.split(',').map(tag => tag.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
