import { AiModels, type AiModel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  selectedModel: AiModel;
  onModelSelect: (model: AiModel) => void;
}

export default function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
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
        <div className="text-xs font-medium text-primary-600 dark:text-primary-400 px-2 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full">
          Active: {selectedModel === AiModels.DEEPSEEK ? 'DeepSeek AI' : 'Gemini AI'}
        </div>
      </div>
      <div className="flex space-x-3">
        <Button
          variant={selectedModel === AiModels.DEEPSEEK ? "default" : "outline"}
          className={`flex-1 justify-center h-14 ${
            selectedModel === AiModels.DEEPSEEK ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50" : 
              ""
          }`}
          onClick={() => onModelSelect(AiModels.DEEPSEEK)}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-base font-medium">DeepSeek AI</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200">
              NVIDIA API
            </span>
          </div>
        </Button>
        <Button
          variant={selectedModel === AiModels.GEMINI ? "default" : "outline"}
          className={`flex-1 justify-center h-14 ${
            selectedModel === AiModels.GEMINI ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50" : 
              ""
          }`}
          onClick={() => onModelSelect(AiModels.GEMINI)}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-base font-medium">Gemini AI</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              Google API
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
