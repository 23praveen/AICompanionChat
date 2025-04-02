var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.sqlite.ts
import express2 from "express";

// server/routes.sqlite.ts
import { createServer } from "http";

// server/auth.sqlite.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.sqlite.ts
var schema_sqlite_exports = {};
__export(schema_sqlite_exports, {
  AiModels: () => AiModels,
  chats: () => chats,
  insertChatSchema: () => insertChatSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  users: () => users
});
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
var users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date())
});
var chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date())
});
var messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  content: text("content").notNull(),
  role: text("role").notNull(),
  // 'user' or 'assistant'
  model: text("model"),
  // 'deepseek' or 'gemini'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(/* @__PURE__ */ new Date())
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true
});
var insertChatSchema = createInsertSchema(chats).pick({
  userId: true,
  title: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
  role: true,
  model: true
});
var AiModels = {
  DEEPSEEK: "deepseek",
  GEMINI: "gemini"
};

// server/db.sqlite.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import "better-sqlite3";
import path from "path";
import fs from "fs";
var dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
var dbPath = path.join(dataDir, "chatbot.db");
var sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
var db = drizzle(sqlite, { schema: schema_sqlite_exports });

// server/storage.sqlite.ts
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
var SQLiteStore = connectSqlite3(session);
var SQLiteStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new SQLiteStore({
      db: "chatbot",
      dir: "./data",
      table: "sessions"
    });
  }
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  // Chat methods
  async getChats(userId) {
    return db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.updatedAt));
  }
  async getChat(id) {
    const result = await db.select().from(chats).where(eq(chats.id, id));
    return result[0];
  }
  async createChat(chat) {
    const result = await db.insert(chats).values(chat).returning();
    return result[0];
  }
  async updateChatTitle(id, title) {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(chats).set({
      title,
      updatedAt: now
    }).where(eq(chats.id, id)).returning();
    return result[0];
  }
  async deleteChat(id) {
    await db.delete(messages).where(eq(messages.chatId, id));
    const result = await db.delete(chats).where(eq(chats.id, id)).returning();
    return result.length > 0;
  }
  // Message methods
  async getMessages(chatId) {
    return db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  }
  async createMessage(message) {
    const result = await db.insert(messages).values(message).returning();
    const now = /* @__PURE__ */ new Date();
    await db.update(chats).set({ updatedAt: now }).where(eq(chats.id, message.chatId));
    return result[0];
  }
};
var storage = new SQLiteStorage();

// server/auth.sqlite.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "ai-chat-local-secret-key";
    console.warn("Warning: Using default SESSION_SECRET. Set a proper one in production.");
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 7 days
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        // This can be either username or email
        passwordField: "password"
      },
      async (usernameOrEmail, password, done) => {
        try {
          let user = await storage.getUserByUsername(usernameOrEmail);
          if (!user) {
            user = await storage.getUserByEmail(usernameOrEmail);
          }
          if (!user || !await comparePasswords(password, user.password)) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const user = await storage.createUser({
        username: req.body.username,
        email: req.body.email,
        password: await hashPassword(req.body.password)
      });
      if (!user) {
        throw new Error("Failed to create user");
      }
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/ai.ts
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// shared/schema.ts
import { pgTable, text as text2, serial, integer as integer2, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
var users2 = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text2("username").notNull().unique(),
  password: text2("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chats2 = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").references(() => users2.id).notNull(),
  title: text2("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var messages2 = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer2("chat_id").references(() => chats2.id).notNull(),
  content: text2("content").notNull(),
  role: text2("role").notNull(),
  // 'user' or 'assistant'
  model: text2("model"),
  // 'deepseek' or 'gemini'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema2 = createInsertSchema2(users2).pick({
  username: true,
  password: true
});
var insertChatSchema2 = createInsertSchema2(chats2).pick({
  userId: true,
  title: true
});
var insertMessageSchema2 = createInsertSchema2(messages2).pick({
  chatId: true,
  content: true,
  role: true,
  model: true
});
var AiModels2 = {
  DEEPSEEK: "deepseek",
  GEMINI: "gemini"
};

// server/ai.ts
var NVIDIA_API_KEY = "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";
var deepseekClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: NVIDIA_API_KEY
});
console.log("DeepSeek client configured with API key");
var geminiClient;
var geminiModel;
function initializeGeminiClient() {
  const GOOGLE_API_KEY = "AIzaSyBBocaqzNh8F4a4u2zqihJf0ygUI-Kr3Vs";
  if (!geminiClient) {
    console.log("Initializing Gemini client with API key");
    geminiClient = new GoogleGenerativeAI(GOOGLE_API_KEY);
    geminiModel = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Gemini model initialized:", geminiModel ? "\u2713" : "\u2717");
  }
}
async function generateChatResponse(model, messages3) {
  try {
    if (model === AiModels2.GEMINI && !geminiClient) {
      initializeGeminiClient();
    }
    const lastMessage = messages3[messages3.length - 1];
    let enhancedMessages = [...messages3];
    if (lastMessage.role === "user") {
      if (model === AiModels2.DEEPSEEK) {
        enhancedMessages = [
          {
            role: "system",
            content: "You are an AI assistant that provides detailed, accurate, and helpful answers. For code examples, always use markdown code blocks with proper syntax highlighting. When analyzing problems, first write your detailed thought process surrounded by <think> tags like this: <think>Your detailed analysis here</think>. Then provide your clear direct answer immediately after. NEVER use double asterisks (**) for formatting in your responses. Instead use proper section headings and clean text formatting. This helps users understand your reasoning."
          },
          ...messages3
        ];
      } else if (model === AiModels2.GEMINI) {
        enhancedMessages.unshift({
          role: "user",
          content: "You are an AI assistant that provides detailed, accurate, and helpful answers. For code examples, always use markdown code blocks with proper syntax highlighting. Format your responses well with proper headings and paragraphs. NEVER use asterisks (*) for emphasis or formatting. Instead use proper HTML heading tags or plain text formatting."
        });
        enhancedMessages.unshift({
          role: "assistant",
          content: "I will provide detailed and well-formatted responses with proper code blocks and headings without using any asterisks (*) for emphasis or formatting."
        });
      }
    }
    if (model === AiModels2.DEEPSEEK) {
      return await generateDeepSeekResponse(enhancedMessages);
    } else if (model === AiModels2.GEMINI) {
      return await generateGeminiResponse(enhancedMessages);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error(`Error generating AI response with ${model}:`, error);
    throw error;
  }
}
async function generateDeepSeekResponse(messages3) {
  const systemMessages = messages3.filter((msg) => msg.role === "system");
  const userMessages = messages3.filter((msg) => msg.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";
  if (lastUserMessage.includes("(### Explanation:") && (lastUserMessage.includes("Input:") || lastUserMessage.includes("Output:"))) {
    const userContent = userMessages[userMessages.length - 1];
    if (userContent) {
      userContent.content = `Please analyze this code example and provide working code with proper explanations. <think>I'll think through this step by step to provide well-formatted and working code.</think>`;
    }
  }
  const completion = await deepseekClient.chat.completions.create({
    model: "deepseek-ai/deepseek-r1-distill-qwen-32b",
    messages: messages3.map((msg) => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: 0.6,
    top_p: 0.7,
    max_tokens: 4096
  });
  return completion.choices[0].message.content;
}
async function generateGeminiResponse(messages3) {
  initializeGeminiClient();
  if (!geminiModel) {
    throw new Error("Failed to initialize Gemini model");
  }
  const chat = geminiModel.startChat({
    history: formatMessagesForGemini(messages3.slice(0, -1))
  });
  const lastMessage = messages3[messages3.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}
function formatMessagesForGemini(messages3) {
  const filteredMessages = messages3.filter((msg) => msg.role !== "system");
  let formattedMessages = filteredMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
  if (formattedMessages.length > 0 && formattedMessages[0].role !== "user") {
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
async function generateAiResponse(messages3, model) {
  try {
    const formattedMessages = messages3.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    return await generateChatResponse(model, formattedMessages);
  } catch (error) {
    console.error(`Error in generateAiResponse:`, error);
    throw error;
  }
}

// server/routes.sqlite.ts
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chats3 = await storage.getChats(req.user.id);
      res.json(chats3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });
  app2.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const chatData = insertChatSchema.parse({
        userId: req.user.id,
        title: req.body.title || "New Chat"
      });
      const chat = await storage.createChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chat" });
    }
  });
  app2.delete("/api/chats/:id", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      if (chat.userId !== req.user.id) {
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
  app2.patch("/api/chats/:id/title", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "Title is required" });
      }
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      if (chat.userId !== req.user.id) {
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
  app2.get("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      if (chat.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const messages3 = await storage.getMessages(chatId);
      res.json(messages3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      if (chat.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { content, model } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }
      const userMessage = insertMessageSchema.parse({
        chatId,
        content,
        role: "user",
        model: model || AiModels.DEEPSEEK
      });
      const savedUserMessage = await storage.createMessage(userMessage);
      const messages3 = await storage.getMessages(chatId);
      const aiResponse = await generateAiResponse(messages3, model || AiModels.DEEPSEEK);
      const aiMessage = insertMessageSchema.parse({
        chatId,
        content: aiResponse,
        role: "assistant",
        model: model || AiModels.DEEPSEEK
      });
      const savedAiMessage = await storage.createMessage(aiMessage);
      if (messages3.length <= 2) {
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        await storage.updateChatTitle(chatId, title);
      }
      res.status(201).json({
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage
      });
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.sqlite.ts
import dotenv from "dotenv";
dotenv.config();
process.env.NVIDIA_API_KEY = "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";
process.env.GOOGLE_API_KEY = "AIzaSyBBocaqzNh8F4a4u2zqihJf0ygUI-Kr3Vs";
console.log("NVIDIA API Key loaded:", process.env.NVIDIA_API_KEY ? "\u2713" : "\u2717");
console.log("Google API Key loaded:", process.env.GOOGLE_API_KEY ? "\u2713" : "\u2717");
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = process.env.PORT || 3e3;
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`For local access: http://localhost:${PORT}`);
    console.log(`For external access: http://<your-ip-address>:${PORT}`);
  });
})();
