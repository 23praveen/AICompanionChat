import { AiModels, type AiModel } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ModelSelectorProps {
  selectedModel: AiModel;
  onModelSelect: (model: AiModel) => void;
}

export default function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">Select AI Model</h2>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Current: <span className="font-medium text-primary-600 dark:text-primary-400">
            {selectedModel === AiModels.DEEPSEEK ? 'DeepSeek' : 'Gemini'}
          </span>
        </div>
      </div>
      <div className="flex space-x-3">
        <Button
          variant={selectedModel === AiModels.DEEPSEEK ? "default" : "outline"}
          className={`flex-1 justify-center ${
            selectedModel === AiModels.DEEPSEEK ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50" : 
              ""
          }`}
          onClick={() => onModelSelect(AiModels.DEEPSEEK)}
        >
          <div className="flex items-center justify-center">
            <span className="mr-2">DeepSeek</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200">
              NVIDIA
            </span>
          </div>
        </Button>
        <Button
          variant={selectedModel === AiModels.GEMINI ? "default" : "outline"}
          className={`flex-1 justify-center ${
            selectedModel === AiModels.GEMINI ? 
              "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50" : 
              ""
          }`}
          onClick={() => onModelSelect(AiModels.GEMINI)}
        >
          <div className="flex items-center justify-center">
            <span className="mr-2">Gemini</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              Google
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
