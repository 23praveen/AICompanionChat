import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertChatSchema, insertMessageSchema, AiModels, type AiModel } from "@shared/schema";
import { generateChatResponse } from "./ai";
import { z } from "zod";

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

  // Chat routes
  app.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chats = await storage.getChats(req.user!.id);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chatData = insertChatSchema.parse({
        userId: req.user!.id,
        title: req.body.title || "New Chat",
      });
      
      const newChat = await storage.createChat(chatData);
      res.status(201).json(newChat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.delete("/api/chats/:id", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat belongs to the user
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteChat(chatId);
      if (success) {
        res.status(200).json({ message: "Chat deleted successfully" });
      } else {
        res.status(404).json({ message: "Chat not found" });
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

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
      
      // Verify this chat belongs to the user
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedChat = await storage.updateChatTitle(chatId, title);
      if (updatedChat) {
        res.status(200).json(updatedChat);
      } else {
        res.status(404).json({ message: "Chat not found" });
      }
    } catch (error) {
      console.error("Error updating chat title:", error);
      res.status(500).json({ message: "Failed to update chat title" });
    }
  });

  // Message routes
  app.get("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat belongs to the user
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      // Verify this chat belongs to the user
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      if (chat.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { content, model } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!model || !Object.values(AiModels).includes(model)) {
        return res.status(400).json({ message: "Valid model is required" });
      }
      
      // Create user message
      const userMessage = insertMessageSchema.parse({
        chatId,
        content,
        role: "user",
      });
      
      const savedUserMessage = await storage.createMessage(userMessage);
      
      // Get all previous messages for context
      const allMessages = await storage.getMessages(chatId);
      
      // Prepare messages for AI model
      const aiMessages = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Generate AI response
      const aiResponse = await generateChatResponse(model as AiModel, aiMessages);
      
      // Create AI message
      const aiMessage = insertMessageSchema.parse({
        chatId,
        content: aiResponse || "I'm sorry, I couldn't generate a response.",
        role: "assistant",
        model,
      });
      
      const savedAiMessage = await storage.createMessage(aiMessage);
      
      // If this is the first message in the chat, update the chat title
      if (allMessages.length <= 1) {
        // Create a title based on the first user message
        let title = content;
        if (title.length > 50) {
          title = title.substring(0, 50) + "...";
        }
        await storage.updateChatTitle(chatId, title);
      }
      
      res.status(201).json({
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
