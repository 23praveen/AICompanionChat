import { users, type User, type InsertUser, chats, type Chat, type InsertChat, messages, type Message, type InsertMessage } from "@shared/schema.sqlite";
import { db, sqliteInstance } from "./db.sqlite";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
// @ts-ignore
import connectSqlite3 from "connect-sqlite3";

const SQLiteStore = connectSqlite3(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat methods
  getChats(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChatTitle(id: number, title: string): Promise<Chat | undefined>;
  deleteChat(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Session store
  sessionStore: session.Store;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new SQLiteStore({
      db: "chatbot",
      dir: "./data",
      table: "sessions"
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0];
  }
  
  // Chat methods
  async getChats(userId: number): Promise<Chat[]> {
    return db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }
  
  async getChat(id: number): Promise<Chat | undefined> {
    const result = await db.select().from(chats).where(eq(chats.id, id));
    return result[0];
  }
  
  async createChat(chat: InsertChat): Promise<Chat> {
    const result = await db
      .insert(chats)
      .values(chat)
      .returning();
    return result[0];
  }
  
  async updateChatTitle(id: number, title: string): Promise<Chat | undefined> {
    const now = new Date();
    const result = await db
      .update(chats)
      .set({ 
        title, 
        updatedAt: now
      })
      .where(eq(chats.id, id))
      .returning();
    return result[0];
  }
  
  async deleteChat(id: number): Promise<boolean> {
    // First delete all messages in this chat
    await db.delete(messages).where(eq(messages.chatId, id));
    
    // Then delete the chat
    const result = await db
      .delete(chats)
      .where(eq(chats.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Message methods
  async getMessages(chatId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update chat's updatedAt timestamp
    const now = new Date();
    await db
      .update(chats)
      .set({ updatedAt: now })
      .where(eq(chats.id, message.chatId));
    
    return result[0];
  }
}

export const storage = new SQLiteStorage();