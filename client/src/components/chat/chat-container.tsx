import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";
import ModelSelector from "./model-selector";
import { AiModels, type AiModel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ChatContainerProps {
  chatId: number | null;
  onNewChat: () => void;
}

export default function ChatContainer({ chatId, onNewChat }: ChatContainerProps) {
  const [selectedModel, setSelectedModel] = useState<AiModel>(AiModels.DEEPSEEK);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) {
        throw new Error("No chat selected");
      }
      
      const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        model: selectedModel,
      });
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  const handleModelSelect = (model: AiModel) => {
    setSelectedModel(model);
  };
  
  // Regenerate the last response by sending the last user message again
  const handleRegenerateResponse = () => {
    if (!chatId) return;
    
    // Get the last user message from the cache
    const messagesCache = queryClient.getQueryData<any>([`/api/chats/${chatId}/messages`]);
    if (!messagesCache || !Array.isArray(messagesCache) || messagesCache.length < 2) return;
    
    // Find the last user message before the last AI response
    const userMessages = messagesCache.filter(m => m.role === 'user');
    if (userMessages.length === 0) return;
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (!lastUserMessage?.content) return;
    
    // Send the message again with the currently selected model
    sendMessageMutation.mutate(lastUserMessage.content);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* New Chat Button - Desktop only */}
      <div className="hidden md:flex justify-end border-b border-slate-200 dark:border-slate-700 p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full px-3 flex items-center"
          onClick={onNewChat}
        >
          <span className="mr-1">+</span> New chat
        </Button>
      </div>

      {/* Chat Messages */}
      <ChatMessages 
        chatId={chatId} 
        isLoadingResponse={sendMessageMutation.isPending}
        onRegenerateResponse={handleRegenerateResponse}
      />

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={sendMessageMutation.isPending}
          disabled={!chatId}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
        
        <div className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
          AI responses may produce inaccurate information. Your conversations are saved in your account.
        </div>
      </div>
    </div>
  );
}
