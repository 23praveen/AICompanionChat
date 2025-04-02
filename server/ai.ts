import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiModels, type AiModel } from "@shared/schema";

// Initialize the NVIDIA-hosted DeepSeek API client
const deepseekClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});

// Initialize the Google Gemini AI client
let geminiClient: GoogleGenerativeAI;
let geminiModel: any;

function initializeGeminiClient() {
  if (!geminiClient && process.env.GOOGLE_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    geminiModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
  }
}

export async function generateChatResponse(model: AiModel, messages: { role: string; content: string }[]) {
  try {
    // Check if we have the required API keys
    const hasNvidiaKey = !!process.env.NVIDIA_API_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_API_KEY;

    // Validate model availability based on API keys
    if (model === AiModels.DEEPSEEK && !hasNvidiaKey) {
      throw new Error("NVIDIA_API_KEY is not set for DeepSeek model");
    } else if (model === AiModels.GEMINI && !hasGoogleKey) {
      throw new Error("GOOGLE_API_KEY is not set for Gemini model");
    }

    // Generate response based on model
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
  // This check is redundant since we already check in generateChatResponse,
  // but keeping it for extra safety
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
  // This check is redundant since we already check in generateChatResponse,
  // but keeping it for extra safety
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  // Initialize Gemini client if not already done
  initializeGeminiClient();

  if (!geminiModel) {
    throw new Error("Failed to initialize Gemini model");
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
