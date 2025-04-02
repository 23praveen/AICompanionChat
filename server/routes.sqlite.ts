import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.sqlite";
import { storage } from "./storage.sqlite";
import { insertChatSchema, insertMessageSchema, AiModels, type AiModel } from "@shared/schema.sqlite";
import { generateAiResponse } from "./ai";

// Middleware to check if the user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Get all chats for the authenticated user
  app.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chats = await storage.getChats(req.user!.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });
  
  // Create a new chat
  app.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chatData = insertChatSchema.parse({
        userId: req.user!.id,
        title: req.body.title || "New Chat",
      });
      
      const chat = await storage.createChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chat" });
    }
  });
  
  // Delete a chat
  app.delete("/api/chats/:id", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify this chat belongs to the user
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteChat(chatId);
      if (success) {
        res.status(200).json({ message: "Chat deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete chat" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });
  
  // Update chat title
  app.patch("/api/chats/:id/title", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Verify this chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify this chat belongs to the user
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedChat = await storage.updateChatTitle(chatId, title);
      if (updatedChat) {
        res.status(200).json(updatedChat);
      } else {
        res.status(500).json({ message: "Failed to update chat title" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update chat title" });
    }
  });
  
  // Get all messages for a chat
  app.get("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify this chat belongs to the user
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  // Create a new message in a chat
  app.post("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Verify this chat belongs to the user
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { content, model } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Create user message
      const userMessage = insertMessageSchema.parse({
        chatId,
        content,
        role: "user",
        model: model as AiModel || AiModels.DEEPSEEK,
      });
      
      const savedUserMessage = await storage.createMessage(userMessage);
      
      // Get all messages for context
      const messages = await storage.getMessages(chatId);
      
      // Generate AI response
      const aiResponse = await generateAiResponse(messages, model as AiModel || AiModels.DEEPSEEK);
      
      // Create AI message
      const aiMessage = insertMessageSchema.parse({
        chatId,
        content: aiResponse,
        role: "assistant",
        model: model as AiModel || AiModels.DEEPSEEK,
      });
      
      const savedAiMessage = await storage.createMessage(aiMessage);
      
      // Create a title based on the first user message
      if (messages.length <= 2) {
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        await storage.updateChatTitle(chatId, title);
      }
      
      res.status(201).json({
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage,
      });
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}