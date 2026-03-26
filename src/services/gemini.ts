import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const chatWithCoach = async (
  openingName: string,
  moveHistory: string[],
  currentFen: string,
  userMessage: string
) => {
  const model = "gemini-2.0-flash";
  const prompt = `You are a Grandmaster chess coach helping a student learn chess openings.
The student is studying: "${openingName || "an unknown opening"}".
Move history so far: ${moveHistory.length > 0 ? moveHistory.join(", ") : "No moves played yet"}.
Current board position (FEN): ${currentFen}.

Student's question: ${userMessage}

Respond as a knowledgeable, encouraging chess coach. Keep your response concise and focused. Use Markdown for formatting.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "I'm sorry, I couldn't generate a response at this time. Please try again.";
  }
};
