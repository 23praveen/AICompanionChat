import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import ChatBubble from "./chat-bubble";
import { Zap } from "lucide-react";

interface ChatMessagesProps {
  chatId: number | null;
  isLoadingResponse: boolean;
}

export default function ChatMessages({ chatId, isLoadingResponse }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    data: messages,
    isLoading, 
  } = useQuery<Message[]>({
    queryKey: chatId ? [`/api/chats/${chatId}/messages`] : null,
    enabled: !!chatId,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoadingResponse]);

  // If no chat is selected
  if (!chatId) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={containerRef}>
        <div className="flex justify-center mb-6">
          <div className="max-w-md text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Zap className="h-12 w-12 mx-auto mb-4 text-primary-500" />
            <h3 className="text-lg font-medium mb-2">Welcome to AI Chat!</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Create a new chat to get started with our AI assistants.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If loading messages
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={containerRef}>
        <div className="flex justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-3/4 ml-auto"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2 ml-auto"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no messages
  if (messages && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={containerRef}>
        <div className="flex justify-center mb-6">
          <div className="max-w-md text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Zap className="h-12 w-12 mx-auto mb-4 text-primary-500" />
            <h3 className="text-lg font-medium mb-2">Welcome to AI Chat!</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Choose an AI model and send your first message to get started.</p>
            <div className="flex justify-center space-x-2 text-sm">
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded">DeepSeek AI</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded">Gemini AI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={containerRef}>
      {/* Display messages */}
      {messages && messages.map((message, index) => (
        <ChatBubble 
          key={message.id} 
          message={message} 
          isLastMessage={index === messages.length - 1 && isLoadingResponse}
        />
      ))}
      
      {/* Loading indicator for new response */}
      {isLoadingResponse && messages && messages[messages.length - 1]?.role === 'user' && (
        <ChatBubble 
          message={{
            id: -1,
            chatId: chatId,
            content: '',
            role: 'assistant',
            model: messages[messages.length - 1]?.model || 'deepseek',
            createdAt: new Date().toISOString(),
          }}
          isLastMessage={true}
        />
      )}
    </div>
  );
}
