import { cn } from "@/lib/utils";
import { Message, AiModels } from "@shared/schema";
import { Cpu, User } from "lucide-react";

interface ChatBubbleProps {
  message: Message;
  isLastMessage?: boolean;
}

export default function ChatBubble({ message, isLastMessage = false }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = isLastMessage && message.role === 'assistant' && !message.content;

  if (isUser) {
    return (
      <div className="flex items-start justify-end">
        <div className="max-w-lg chat-bubble-user bg-primary-500 text-white px-4 py-2 rounded-tl-xl rounded-tr-xl rounded-bl-xl shadow">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="ml-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mr-2">
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
          <Cpu className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <div className="max-w-lg chat-bubble-ai bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-tr-xl rounded-tl-xl rounded-br-xl shadow">
        <div className="flex items-center mb-1">
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
            {message.model === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        ) : (
          <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {formatMessageContent(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessageContent(content: string) {
  // Split by double newlines to identify paragraphs
  return content.split('\n\n').map((paragraph, index) => {
    // Check if the paragraph is a list
    if (paragraph.includes('\n- ')) {
      const [listTitle, ...listItems] = paragraph.split('\n- ');
      return (
        <div key={index} className="mb-2">
          <p>{listTitle}</p>
          <ul className="list-disc pl-5 mt-1">
            {listItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Check if the paragraph is a numbered list
    if (paragraph.includes('\n1. ')) {
      const [listTitle, ...listItems] = paragraph.split('\n');
      return (
        <div key={index} className="mb-2">
          <p>{listTitle}</p>
          <ol className="list-decimal pl-5 mt-1">
            {listItems.map((item, idx) => (
              <li key={idx}>{item.replace(/^\d+\.\s/, '')}</li>
            ))}
          </ol>
        </div>
      );
    }
    
    // Regular paragraph
    return <p key={index} className="mb-2">{paragraph}</p>;
  });
}
