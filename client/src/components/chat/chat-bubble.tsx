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
      <div className="max-w-3xl chat-bubble-ai bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-tr-xl rounded-tl-xl rounded-br-xl shadow-md">
        <div className="flex items-center justify-between mb-2 border-b pb-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${message.model === AiModels.DEEPSEEK ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {message.model === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
            </p>
          </div>
          {!isLoading && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(message.content);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Copy response
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center p-4">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce mx-1" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Generating response...</span>
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
  // Detect code blocks with triple backticks
  const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
  let formattedContent = content;
  const codeBlocks: { language: string; code: string }[] = [];
  
  // Extract code blocks and replace them with placeholders
  let match;
  let codeBlockIndex = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'code';
    const code = match[2];
    codeBlocks.push({ language, code });
    formattedContent = formattedContent.replace(match[0], `[CODE_BLOCK_${codeBlockIndex}]`);
    codeBlockIndex++;
  }

  // Process the content without code blocks
  const processedContent = formattedContent.split('\n\n').map((paragraph, index) => {
    // Replace code block placeholders with actual code blocks
    if (paragraph.includes('[CODE_BLOCK_')) {
      const blockIndex = parseInt(paragraph.match(/\[CODE_BLOCK_(\d+)\]/)?.[1] || '0');
      const { language, code } = codeBlocks[blockIndex];
      
      return (
        <div key={index} className="mb-4">
          <div className="relative">
            <div className="bg-gray-800 rounded-t-md px-4 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-300">{language}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }} 
                className="text-xs text-gray-300 hover:text-white"
              >
                Copy code
              </button>
            </div>
            <pre className="bg-gray-900 rounded-b-md p-4 overflow-x-auto">
              <code className="text-gray-100 text-sm whitespace-pre">{code}</code>
            </pre>
          </div>
          {paragraph.replace(`[CODE_BLOCK_${blockIndex}]`, '').trim() && (
            <p className="mt-2 text-sm">{paragraph.replace(`[CODE_BLOCK_${blockIndex}]`, '')}</p>
          )}
        </div>
      );
    }

    // Check if the paragraph is a list
    if (paragraph.includes('\n- ')) {
      const [listTitle, ...listItems] = paragraph.split('\n- ');
      return (
        <div key={index} className="mb-3">
          <p className="mb-1 font-medium">{listTitle}</p>
          <ul className="list-disc pl-5 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Check if the paragraph is a numbered list
    if (paragraph.includes('\n1. ')) {
      const [listTitle, ...listItems] = paragraph.split('\n');
      return (
        <div key={index} className="mb-3">
          <p className="mb-1 font-medium">{listTitle}</p>
          <ol className="list-decimal pl-5 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm">{item.replace(/^\d+\.\s/, '')}</li>
            ))}
          </ol>
        </div>
      );
    }
    
    // Handle DeepSeek think vs answer format (often separated by "Answer:" or "Solution:")
    if (paragraph.includes('Answer:') || paragraph.includes('Solution:')) {
      const parts = paragraph.split(/(Answer:|Solution:)/);
      return (
        <div key={index} className="mb-3">
          {parts[0] && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md mb-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Thinking:</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{parts[0].trim()}</p>
            </div>
          )}
          <div className="font-medium mb-1">{parts[1]}</div>
          <p className="text-sm">{parts[2].trim()}</p>
        </div>
      );
    }
    
    // Regular paragraph
    return <p key={index} className="mb-3 text-sm">{paragraph}</p>;
  });

  return processedContent;
}
