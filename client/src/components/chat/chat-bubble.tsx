import { cn } from "@/lib/utils";
import { Message, AiModels } from "@shared/schema";
import { Cpu, User } from "lucide-react";

interface ChatBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  onRegenerateResponse?: () => void;
}

export default function ChatBubble({ message, isLastMessage = false, onRegenerateResponse }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = isLastMessage && message.role === 'assistant' && !message.content;

  if (isUser) {
    return (
      <div className="flex items-start justify-end max-w-full">
        <div className="max-w-[85%] md:max-w-[75%] chat-bubble-user bg-blue-500 px-4 py-3 rounded-2xl shadow-sm">
          <p className="text-sm whitespace-pre-wrap font-normal text-white">{message.content}</p>
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
    <div className="flex flex-col w-full">
      <div className="flex items-start max-w-full">
        <div className="flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="max-w-[85%] md:max-w-[75%] chat-bubble-ai bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-2 border-b pb-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${message.model === AiModels.DEEPSEEK ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {message.model === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
              </p>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    const button = document.activeElement;
                    if (button) {
                      const originalText = button.textContent;
                      button.textContent = 'Copied!';
                      setTimeout(() => {
                        button.textContent = originalText;
                      }, 1500);
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-1 sm:mt-0 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <div className="flex space-x-2 items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin text-gray-500 dark:text-gray-400">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"></circle>
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                </svg>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                {message.model === AiModels.DEEPSEEK ? 'DeepSeek' : 'Gemini'} is working on your response. This may take a moment.
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {formatMessageContent(message.content)}
            </div>
          )}
        </div>
      </div>
      
      {/* Regenerate Response button - Only shown for the last AI message if it's not loading */}
      {isLastMessage && !isLoading && message.role === 'assistant' && (
        <div className="flex justify-center mt-2 mb-4">
          <button 
            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              // Visual feedback
              const button = document.activeElement;
              if (button) {
                button.classList.add('bg-gray-100', 'dark:bg-gray-700');
                setTimeout(() => {
                  button.classList.remove('bg-gray-100', 'dark:bg-gray-700');
                }, 200);
              }
              
              // Call the regenerate function if provided
              if (onRegenerateResponse) {
                onRegenerateResponse();
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 21h5v-5"></path>
            </svg>
            Regenerate response
          </button>
        </div>
      )}
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
                  // Show a tooltip or some visual feedback
                  const tooltip = document.createElement('div');
                  tooltip.textContent = 'Copied!';
                  tooltip.className = 'absolute right-0 -top-8 bg-gray-700 text-white text-xs px-2 py-1 rounded';
                  const codeBlock = document.activeElement?.closest('.relative');
                  if (codeBlock) {
                    codeBlock.appendChild(tooltip);
                    setTimeout(() => tooltip.remove(), 1500);
                  }
                }} 
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
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
    
    // Handle DeepSeek thinking pattern with <think> or Answer/Solution pattern
    if (paragraph.includes('</think>') || paragraph.includes('<think>') || 
        paragraph.includes('Answer:') || paragraph.includes('Solution:')) {
      
      // Try to detect think pattern first with </think>
      if (paragraph.includes('</think>')) {
        const parts = paragraph.split('</think>');
        const thinkContent = parts[0].replace('<think>', '').trim();
        const answerContent = parts[1].trim();
        
        return (
          <div key={index} className="mb-3">
            <details className="mb-2">
              <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3.8a2 2 0 0 0 1.4-.6L12 4.6a2 2 0 0 1 1.4-.6h3.8a2 2 0 0 1 2 2v2.4Z"></path>
                </svg>
                View AI thought process
              </summary>
              <div className="p-3 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                {thinkContent}
              </div>
            </details>
            <p className="text-sm text-gray-800 dark:text-gray-200">{answerContent}</p>
          </div>
        );
      } 
      // Fall back to Answer/Solution pattern
      else if (paragraph.includes('Answer:') || paragraph.includes('Solution:')) {
        const parts = paragraph.split(/(Answer:|Solution:)/);
        return (
          <div key={index} className="mb-3">
            {parts[0] && (
              <details className="mb-2">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3.8a2 2 0 0 0 1.4-.6L12 4.6a2 2 0 0 1 1.4-.6h3.8a2 2 0 0 1 2 2v2.4Z"></path>
                  </svg>
                  View AI thought process
                </summary>
                <div className="p-3 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {parts[0].trim()}
                </div>
              </details>
            )}
            <div className="font-medium mb-1">{parts[1]}</div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{parts[2].trim()}</p>
          </div>
        );
      }
    }
    
    // Regular paragraph
    return <p key={index} className="mb-3 text-sm">{paragraph}</p>;
  });

  return processedContent;
}
