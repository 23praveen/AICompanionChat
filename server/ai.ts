import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiModels, type AiModel } from "@shared/schema";

// Initialize the NVIDIA-hosted DeepSeek API client with API key directly
const NVIDIA_API_KEY = "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";
const deepseekClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: NVIDIA_API_KEY,
});

// Log the configuration to verify
console.log("DeepSeek client configured with API key");

// Initialize the Google Gemini AI client
let geminiClient: GoogleGenerativeAI;
let geminiModel: any;

function initializeGeminiClient() {
  const GOOGLE_API_KEY = "AIzaSyBBocaqzNh8F4a4u2zqihJf0ygUI-Kr3Vs";
  if (!geminiClient) {
    console.log("Initializing Gemini client with API key");
    geminiClient = new GoogleGenerativeAI(GOOGLE_API_KEY);
    geminiModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Gemini model initialized:", geminiModel ? "✓" : "✗");
  }
}

export async function generateChatResponse(model: AiModel, messages: { role: string; content: string }[]) {
  try {
    // Initialize Gemini client if needed
    if (model === AiModels.GEMINI && !geminiClient) {
      initializeGeminiClient();
    }

    // Format the prompt to get better responses
    const lastMessage = messages[messages.length - 1];
    let enhancedMessages = [...messages];
    
    // If this is a user message, add instructions to improve response quality
    if (lastMessage.role === 'user') {
      if (model === AiModels.DEEPSEEK) {
        // Add system instruction for DeepSeek to provide better responses with thinking in a collapsible section
        enhancedMessages = [
          { 
            role: 'system', 
            content: 'You are an AI assistant that provides detailed, accurate, and helpful answers. For code examples, always use markdown code blocks with proper syntax highlighting. When analyzing problems, first write your detailed thought process surrounded by <think> tags like this: <think>Your detailed analysis here</think>. Then provide your clear direct answer immediately after. NEVER use double asterisks (**) for formatting in your responses. Instead use proper section headings and clean text formatting. This helps users understand your reasoning.'
          },
          ...messages
        ];
      } else if (model === AiModels.GEMINI) {
        // Add system instruction for Gemini to provide better responses without markdown
        enhancedMessages.unshift({
          role: 'user',
          content: 'You are an AI assistant that provides detailed, accurate, and helpful answers. For code examples, always use markdown code blocks with proper syntax highlighting. Format your responses well with proper headings and paragraphs. NEVER use asterisks (*) for emphasis or formatting. Instead use proper HTML heading tags or plain text formatting.'
        });
        enhancedMessages.unshift({
          role: 'assistant',
          content: 'I will provide detailed and well-formatted responses with proper code blocks and headings without using any asterisks (*) for emphasis or formatting.'
        });
      }
    }

    // Generate response based on model
    if (model === AiModels.DEEPSEEK) {
      return await generateDeepSeekResponse(enhancedMessages);
    } else if (model === AiModels.GEMINI) {
      return await generateGeminiResponse(enhancedMessages);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error(`Error generating AI response with ${model}:`, error);
    throw error;
  }
}

async function generateDeepSeekResponse(messages: { role: string; content: string }[]) {
  // Using hardcoded API key from the client initialization
  // Process user code example request for proper formatting
  const systemMessages = messages.filter(msg => msg.role === "system");
  const userMessages = messages.filter(msg => msg.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
  
  // Check if this might be a code example request with the input from user
  if (lastUserMessage.includes("(### Explanation:") && 
      (lastUserMessage.includes("Input:") || lastUserMessage.includes("Output:"))) {
    // This is likely a code addition request, let's wrap this in think tags
    const userContent = userMessages[userMessages.length - 1];
    if (userContent) {
      userContent.content = `Please analyze this code example and provide working code with proper explanations. <think>I'll think through this step by step to provide well-formatted and working code.</think>`;
    }
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
  // Filter out system messages and ensure proper ordering
  const filteredMessages = messages.filter(msg => msg.role !== "system");
  
  // Gemini requires the first message to be from "user"
  let formattedMessages = filteredMessages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
  
  // If the first message is not from a user, we need to fix the sequence
  if (formattedMessages.length > 0 && formattedMessages[0].role !== "user") {
    // Start with a user message
    formattedMessages = [
      {
        role: "user", 
        parts: [{ text: "Hello, assist me with my questions." }]
      },
      ...formattedMessages
    ];
  }
  
  return formattedMessages;
}

// This function is used in routes.sqlite.ts to generate AI responses
// It adapts the existing generateChatResponse function to match the expected interface
export async function generateAiResponse(messages: { chatId: number; content: string; role: string; createdAt: Date }[], model: AiModel) {
  try {
    // Convert the message format to what generateChatResponse expects
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call the existing function with the formatted messages
    return await generateChatResponse(model, formattedMessages);
  } catch (error) {
    console.error(`Error in generateAiResponse:`, error);
    throw error;
  }
}
