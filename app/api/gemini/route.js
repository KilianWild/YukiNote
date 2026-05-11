import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { task, quote1, quote2 } = await request.json();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Task: "${task}" - Data to process: "${quote1}" / "${quote2}"`,
    });

    console.log("Tokens in prompt:", count.totalTokens);

    return Response.json({ result: response.text }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
