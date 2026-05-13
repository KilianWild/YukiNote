import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { task, aiRequestData, existingInquiries } = await request.json();
    const prompt = `
      Task: "${task}" 
      Existing inquiries (reuse these before creating new ones): ${JSON.stringify(existingInquiries)}
      Notes to process: "${JSON.stringify(aiRequestData)}"`;

    // ---< Check token count first >---
    /*const countResult = await ai.models.countTokens({
      model: "gemini-2.5-flash",
      contents: prompt,
    });*/

    console.log("prompt", prompt);

    //console.log("Tokens in prompt:", countResult.totalTokens);

    // ---< Limit token Count >---
    //if (countResult.totalTokens > 7000) {
    //  return Response.json({ error: "Prompt is too long!" }, { status: 400 });
    //}
    const response = await ai.models.generateContent({
      //model: "gemini-2.5-flash",
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],

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
              title: {
                type: "string",
                description:
                  "The original title of the note. If its empty, keep it empty",
              },

              text: {
                type: "string",
                description: `The original content of the note.
                   DO NOT CHANGE THE WORDS OR SENTENCES BY MEANING - but correct only spelling issues and/or insert/change words that are GRAMMAR RELEVANT ONLY`,
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
              /*
              existingInquiries: {
                type: "array",
                description:
                  "Array of inquiries that are already present with the notes. Prioritize one of these existing inquiries before creating a new one. Dont have a too narrow view on that, and prioritize making a new reference to the center node referenceId = ('')",
                items: { type: "string" },
              },*/
              inquiry: {
                type: "string",
                description: `The broad theme. YOU MUST REUSE THE SAME THEME NAME for notes that share a similar core philosophy.
                  Prioritize grouping: If multiple notes relate to 'Life and Purpose', force them into that single theme even if they touch on different nuances.`,
              },
              discrepancyRefs: {
                type: "array",
                description:
                  "Array of _id strings that this note contradicts, challenges, or negates. Return[] if none exist. Focus most on notes within the same inquiry and only secondary globally",
                items: { type: "string" },
              },
              referenceId: {
                type: "string",
                description: `The _id of the parent node. 
                  0. Is LOGIC ACTIVE?
                     - If the "text" object is empty, but tags and shortDescr is filled, then that means this note has been processed and referenced already.
                     - In that case: Dont rereference!
                  1. THEME IDENTIFICATION: 
                     - Determine if the note belongs to an existing 'inquiry' theme or requires a new one.
                     - If no compatible theme exists, assign a string calles ('center') to create a new independent Center Node.

                  2. CENTER NODE ASSIGNMENT (THEME ROOT):
                     - If this note is the primary foundation of an inquiry, assign string calles ('center').
                     - A Center Node (empty string) can have a MAXIMUM of 6 direct children.

                  3. HIERARCHICAL MAPPING:
                     - If the relevant Center Node already has 6 direct children, you MUST NOT link to the Center Node.
                     - Instead, link the note to an existing child node within that same theme to maintain a branching tree structure.

                  4. EXCLUSION/NEW THEME:
                     - If a note is unrelated to all existing themes, treat it as a new topic and assign string calles ('center') to start a new independent root node.`,
              },
              referenceTitle: {
                type: "string",
                description:
                  "title of the parent note the referenceId points to",
              },
              directQuestion: {
                type: "boolean",
                description:
                  "True only if the note contains directly in the note formulated questions that have not been answered within it.",
              },
              inquiryOpen: {
                type: "boolean",
                description: ` Automatically true if directQuestion == true
                  Also True if the note poses a new question AND REQUIRES further exploration to be able stand as it is. False if it provides an answer or is a factual statement.
                  IMPORTANT: Don't overuse that. Only use it if the note is meaningfull, but has partial information where it is visibly only partial, to help complete a thought, not to lead towards evey note being ULTIMATELY coherent and complete. 
                  So words of uncertainty within the note as well as facts already knwon missing in the note would trigger that e.g.`,
              },

              referenceReasoning: {
                type: "string",
                description:
                  "A brief justification for the chosen referenceId. If reasoning shows the selected referenceId was wrong => adjust referenceId string",
              },
              inquiryOpenReasoning: {
                type: "string",
                description:
                  "A brief justification for the chosen inquiryOpen state. If reasoning shows the selected status was wrong => adjust inquiryOpen state",
              },
            },
            required: [
              "_id",
              "title",
              "text",
              "tags",
              "shortDescr",
              "inquiry",
              "discrepancyRefs",
              "referenceId",
              "directQuestion",
              "inquiryOpen",
              "referenceReasoning",
              "inquiryOpenReasoning",
            ],
          },
        },
      },
    });

    console.log(
      "Usage Metadata:",
      JSON.stringify(response.usageMetadata, null, 2),
    );

    // ---< check for finish reason >---
    const candidate = response.candidates[0];
    if (candidate.finishReason === "MAX_TOKENS") {
      console.warn(
        "Warning: The response was truncated because it reached the token limit.",
      );
    } else if (candidate.finishReason === "STOP") {
      console.log("Response completed normally.");
    }

    return Response.json(
      { result: response.text, finishReason: candidate.finishReason },
      { status: 200 },
    );
  } catch (error) {
    console.error("--- FULL GEMINI ERROR ---");
    console.error(JSON.stringify(error, null, 2));
    if (error.status == 429)
      return Response.json(
        {
          error: "Too many requests",
        },
        { status: error.status },
      );
    else
      return Response.json(
        {
          error: "Failed to process task",
          details: error.message || "Unknown error",
        },
        { status: error.status },
      );
  }
}
