import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiModels, type AiModel } from "@shared/schema";

// Initialize the NVIDIA-hosted DeepSeek API client
const deepseekClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});

// Initialize the Google Gemini AI client
const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const geminiModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateChatResponse(model: AiModel, messages: { role: string; content: string }[]) {
  try {
    if (model === AiModels.DEEPSEEK) {
      return await generateDeepSeekResponse(messages);
    } else if (model === AiModels.GEMINI) {
      return await generateGeminiResponse(messages);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error(`Error generating AI response with ${model}:`, error);
    throw error;
  }
}

async function generateDeepSeekResponse(messages: { role: string; content: string }[]) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  const completion = await deepseekClient.chat.completions.create({
    model: "deepseek-ai/deepseek-r1-distill-qwen-32b",
    messages: messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    })),
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0].message.content;
}

async function generateGeminiResponse(messages: { role: string; content: string }[]) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  // Convert messages to Gemini format
  const chat = geminiModel.startChat({
    history: formatMessagesForGemini(messages.slice(0, -1)),
  });

  const lastMessage = messages[messages.length - 1];
  
  // Generate response with the latest message
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

function formatMessagesForGemini(messages: { role: string; content: string }[]) {
  return messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
}
