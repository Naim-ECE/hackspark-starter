const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Generate a response using Gemini LLM.
 * @param {object[]} history - Chat history [{ role: "user"|"model", parts: [{ text: "..." }] }]
 * @param {string} prompt - The new user message or system instruction
 * @returns {Promise<string>}
 */
export const generateReply = async (history, prompt) => {
  if (!GEMINI_API_KEY) {
    return "AI Assistant is not configured. (Missing GEMINI_API_KEY)";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const contents = [
    ...history,
    { role: "user", parts: [{ text: prompt }] }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ contents })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Gemini API Error:", JSON.stringify(errorData, null, 2));
    throw new Error("Failed to generate AI response");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
};

/**
 * Generate a short title for a session.
 * @param {string} firstMessage
 * @returns {Promise<string>}
 */
export const generateTitle = async (firstMessage) => {
  if (!GEMINI_API_KEY) return "New RentPi Chat";

  const prompt = `Given this first user message, reply with ONLY a short 3-5 word title for this conversation. No punctuation.\n\nMessage: ${firstMessage}`;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) return "New RentPi Chat";

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "New RentPi Chat";
  return text.trim().replace(/[.#]/g, "").slice(0, 50);
};
