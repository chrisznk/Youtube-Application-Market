import { Lightbulb, Crown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

interface ModelRecommendationProps {
  context: 'strategy' | 'titles' | 'thumbnails' | 'description';
  currentModel: string;
  onSelectModel: (model: string) => void;
}

const fallbackRecommendations = {
  strategy: {
    model: 'gpt-4o',
    reason: 'Modèle par défaut - Notez vos générations pour obtenir des recommandations personnalisées',
  },
  titles: {
    model: 'gpt-4o',
    reason: 'Modèle par défaut - Notez vos générations pour obtenir des recommandations personnalisées',
  },
  thumbnails: {
    model: 'gpt-4o',
    reason: 'Modèle par défaut - Notez vos générations pour obtenir des recommandations personnalisées',
  },
  description: {
    model: 'gpt-4o',
    reason: 'Modèle par défaut - Notez vos générations pour obtenir des recommandations personnalisées',
  }
};

export function ModelRecommendation({ context, currentModel, onSelectModel }: ModelRecommendationProps) {
  const { data: bestModels, isLoading } = trpc.openai.getBestModelByCategory.useQuery();
  
  // Determine the recommended model based on context and user ratings
  const getRecommendedModel = () => {
    if (!bestModels) {
      return fallbackRecommendations[context].model;
    }
    
    switch (context) {
      case 'strategy':
        return bestModels.bestOverall || 'gpt-4o';
      case 'titles':
        return bestModels.bestTitle || 'gpt-4o';
      case 'thumbnails':
        return bestModels.bestThumbnail || 'gpt-4o';
      case 'description':
        return bestModels.bestDescription || 'gpt-4o';
      default:
        return 'gpt-4o';
    }
  };
  
  const recommendedModel = getRecommendedModel();
  const isBasedOnRatings = bestModels && (
    (context === 'strategy' && bestModels.bestOverall) ||
    (context === 'titles' && bestModels.bestTitle) ||
    (context === 'thumbnails' && bestModels.bestThumbnail) ||
    (context === 'description' && bestModels.bestDescription)
  );
  
  // Don't show if already using recommended model
  if (currentModel === recommendedModel) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement des recommandations...</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
      {isBasedOnRatings ? (
        <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          Modèle recommandé : {recommendedModel.toUpperCase()}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          {isBasedOnRatings 
            ? `Basé sur vos meilleures notes pour cette catégorie`
            : fallbackRecommendations[context].reason
          }
        </p>
        {isBasedOnRatings && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Voir la page "Comparaison des Modèles" pour plus de détails
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSelectModel(recommendedModel)}
        className="flex-shrink-0 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
      >
        Utiliser
      </Button>
    </div>
  );
}
