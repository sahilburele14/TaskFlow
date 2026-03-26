// src/services/geminiService.ts

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("API Key must be set");
}

// Generic Gemini API call
async function generateText(prompt: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Gemini API request failed: " + response.statusText);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

// Existing helper
export async function getTaskTips(task: string, description?: string) {
  return generateText(`Give me tips for the task: ${task}. Description: ${description || ""}`);
}

// 🔥 New helper for AI Assistant
export async function generateTasksFromPrompt(prompt: string) {
  return generateText(`Generate a list of tasks based on this prompt: ${prompt}`);
}
