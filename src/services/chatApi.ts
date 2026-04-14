export const chatWithCoach = async (
  openingName: string,
  moveHistory: string[],
  currentFen: string,
  userMessage: string
): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingName, moveHistory, currentFen, userMessage }),
    });

    if (response.status === 429) {
      return "You've reached the hourly request limit. Please try again later.";
    }

    if (!response.ok) {
      return "The AI coach is unavailable right now. Please try again later.";
    }

    const data = await response.json();
    return data.reply ?? '';
  } catch {
    return "Could not reach the server. Please check your connection and try again.";
  }
};
