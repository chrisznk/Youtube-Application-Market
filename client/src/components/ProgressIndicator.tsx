import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  model: string;
  isGenerating: boolean;
}

export function ProgressIndicator({ model, isGenerating }: ProgressIndicatorProps) {
  if (!isGenerating) return null;

  const isSlowModel = model === 'gpt-5-pro' || model === 'o1';
  
  if (!isSlowModel) return null;

  const modelName = model === 'gpt-5-pro' ? 'GPT-5 Pro' : 'O1';
  const estimatedTime = model === 'gpt-5-pro' ? '2-5 minutes' : '1-3 minutes';

  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Génération en cours avec {modelName}
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Ce modèle utilise un raisonnement approfondi. Temps estimé : {estimatedTime}
        </p>
      </div>
    </div>
  );
}
