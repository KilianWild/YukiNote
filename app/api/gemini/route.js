import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { task, data } = await request.json();
    const prompt = `Task: "${task}" - Data to process: "${JSON.stringify(data)}"`;

    // ---< Check token count first >---
    const countResult = await ai.models.countTokens({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("Tokens in prompt:", countResult.totalTokens);

    // ---< Limit token Count >---
    if (countResult.totalTokens > 5000) {
      return Response.json({ error: "Prompt is too long!" }, { status: 400 });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: "array",
          description:
            "A structured list of notes organized into a tree via referenceLink.",
          items: {
            type: "object",
            properties: {
              _id: {
                type: "string",
                description: "A unique identifier for this note.",
              },
              text: {
                type: "string",
                description: "The original content of the note.",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Exactly 5 descriptive tags for categorization.",
              },
              shortDescr: {
                type: "string",
                description:
                  "Max 25 words summarizing the core essence, specifically identifying conflicts, opposites, or open questions.",
              },
              inquiry: {
                type: "string",
                description:
                  "The specific theme or question this note addresses.",
              },
              descrapancyRefs: {
                type: "array",
                description:
                  "Array of _id strings that this note contradicts, challenges, or negates. Return[] if none exist.",
                items: { type: "string" },
              },
              referenceLink: {
                type: "string",
                description: `The _id of the parent node. 
                  LOGIC RULES:
                  1. Use an empty string '' only for the absolute Center Node of the inquiry.
                  2. Max 6 direct children allowed for the Center Node.
                  3. If the Center Node has 6 children, link this note to an existing child node instead.
                  4. If a note is unrelated to the existing theme, assign it a new independent root (empty string).`,
              },
              inquiryopen: {
                type: "boolean",
                description:
                  "True if the note poses a new question or requires further exploration. False if it provides an answer or is a factual statement.",
              },
              reasoning: {
                type: "string",
                description:
                  "A brief justification for the chosen referenceLink and the determined inquiryopen status.",
              },
            },
            required: [
              "_id",
              "text",
              "tags",
              "shortDescr",
              "inquiry",
              "descrapancyRefs",
              "referenceLink",
              "inquiryopen",
              "reasoning",
            ],
          },
        },
      },
    });

    // ---< check for finish reason >---
    const candidate = response.candidates[0];
    if (candidate.finishReason === "MAX_TOKENS") {
      console.warn(
        "Warning: The response was truncated because it reached the token limit.",
      );
    } else if (candidate.finishReason === "COMPLETE") {
      console.log("Response completed normally.");
    }

    return Response.json(
      { result: response.text, finishReason: candidate.finishReason },
      { status: 200 },
    );
  } catch (error) {
    console.error("--- FULL GEMINI ERROR ---");
    console.error(JSON.stringify(error, null, 2));

    return Response.json(
      {
        error: "Failed to process task",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
