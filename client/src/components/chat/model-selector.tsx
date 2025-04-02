import { AiModels, type AiModel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { HelpCircle, PlusCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  selectedModel: AiModel;
  onModelSelect: (model: AiModel) => void;
  onNewChat?: () => void;
}

export default function ModelSelector({ selectedModel, onModelSelect, onNewChat }: ModelSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h2 className="text-sm font-medium mr-1">Select AI Model</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p className="text-xs">Each model has different strengths. DeepSeek is better for code and technical tasks, while Gemini is better for creative content.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-primary-600 dark:text-primary-400 px-2 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full">
            Active: {selectedModel === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
          </div>
          
          {onNewChat && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={onNewChat}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Start a new chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="flex space-x-3">
        <Button
          variant={selectedModel === AiModels.DEEPSEEK ? "default" : "outline"}
          className={`flex-1 justify-center h-14 ${
            selectedModel === AiModels.DEEPSEEK ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400" : 
              "text-slate-700 dark:text-slate-300"
          }`}
          onClick={() => onModelSelect(AiModels.DEEPSEEK)}
        >
          <div className="flex items-center justify-center">
            <span className="text-base font-medium">DeepSeek AI</span>
          </div>
        </Button>
        <Button
          variant={selectedModel === AiModels.GEMINI ? "default" : "outline"}
          className={`flex-1 justify-center h-14 ${
            selectedModel === AiModels.GEMINI ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400" : 
              "text-slate-700 dark:text-slate-300"
          }`}
          onClick={() => onModelSelect(AiModels.GEMINI)}
        >
          <div className="flex items-center justify-center">
            <span className="text-base font-medium">Gemini AI</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
