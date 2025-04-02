import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ChevronDown } from "lucide-react";
import { AiModels, type AiModel } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedModel?: AiModel;
  onModelSelect?: (model: AiModel) => void;
}

export default function ChatInput({ 
  onSendMessage, 
  isLoading, 
  disabled = false,
  selectedModel = AiModels.DEEPSEEK,
  onModelSelect
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleModelChange = (value: string) => {
    if (onModelSelect && (value === AiModels.DEEPSEEK || value === AiModels.GEMINI)) {
      onModelSelect(value as AiModel);
    }
  };

  return (
    <div className="space-y-1">
      <div className="mb-2">
        {onModelSelect && (
          <div className="flex justify-center">
            <div className="inline-flex shadow-sm rounded-md border border-slate-200 dark:border-slate-700">
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="h-8 text-xs font-medium border-0 focus:ring-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex items-center">
                    <div 
                      className={`w-2 h-2 rounded-full mr-2 ${selectedModel === AiModels.DEEPSEEK ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    ></div>
                    {selectedModel === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AiModels.DEEPSEEK} className="text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                      DeepSeek AI
                    </div>
                  </SelectItem>
                  <SelectItem value={AiModels.GEMINI} className="text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      Gemini AI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      <form className="flex items-end space-x-2" onSubmit={handleSubmit}>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Send a message..."
            className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-3 px-4 text-slate-900 dark:text-slate-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
          />
        </div>
        <Button
          type="submit"
          className="flex-shrink-0 p-3 h-auto rounded-full"
          disabled={!message.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      
      {isLoading && (
        <div className="text-center">
          <p className="text-xs text-primary-500 dark:text-primary-400 animate-pulse">
            Generating response...
          </p>
        </div>
      )}
    </div>
  );
}
