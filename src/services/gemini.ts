import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const explainOpeningMove = async (openingName: string, moveHistory: string[], currentFen: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a Grandmaster chess coach. 
  The user is learning the opening: "${openingName}".
  The current move history is: ${moveHistory.join(", ")}.
  The current board state in FEN is: ${currentFen}.
  
  Please explain:
  1. The strategic idea behind the last move played.
  2. The typical plans for both sides in this position.
  3. What the user should focus on next.
  
  Keep the explanation concise, professional, and encouraging. Use Markdown for formatting.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "I'm sorry, I couldn't generate an explanation at this time. Let's keep playing!";
  }
};

export const getOpeningSuggestions = async (currentFen: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Given the chess position in FEN: ${currentFen}, suggest the top 3 most common theoretical moves and briefly explain why they are played. Return the response as a JSON array of objects with 'move' (SAN) and 'explanation' fields.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return [];
  }
};
