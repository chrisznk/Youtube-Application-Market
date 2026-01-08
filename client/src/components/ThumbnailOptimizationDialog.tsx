import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, Image, Edit2, Save, X, Star, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ModelRecommendation } from "@/components/ModelRecommendation";
import { StarRating } from "@/components/StarRating";
import { FavoritePromptSelector } from "@/components/FavoritePromptSelector";

interface ThumbnailOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: number;
  videoTitle: string;
  videoTranscript?: string | null;
}

interface ThumbnailSuggestion {
  title: string;
  description: string;
  midjourneyPrompt: string;
  rationale: string;
}

export default function ThumbnailOptimizationDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  videoTranscript,
}: ThumbnailOptimizationDialogProps) {
  const [suggestions, setSuggestions] = useState<ThumbnailSuggestion[]>([]);
  const [strategy, setStrategy] = useState("");
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [editedStrategy, setEditedStrategy] = useState("");
  const [selectedModel, setSelectedModel] = useState<'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini' | 'gpt-5' | 'gpt-5-pro'>('gpt-4o');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const generateStrategyMutation = trpc.openai.generateStrategy.useMutation({
    onSuccess: (data) => {
      setStrategy(data.strategy);
      setEditedStrategy(data.strategy);
      setIsEditingStrategy(false);
      toast.success("Stratégie générée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const generateSuggestionsMutation = trpc.openai.generateThumbnailSuggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      setGenerationId(data.generationId);
      setUsedModel(selectedModel);
      toast.success(`${data.suggestions.length} suggestions de miniatures générées !`);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const saveFavoritePromptMutation = trpc.favoritePrompts.saveFavoritePrompt.useMutation({
    onSuccess: () => {
      toast.success("✨ Prompt sauvegardé dans vos favoris !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const useFavoritePromptMutation = trpc.favoritePrompts.useFavoritePrompt.useMutation();

  const handleGenerateStrategy = () => {
    if (!videoTranscript) {
      toast.error("Aucune transcription disponible pour cette vidéo");
      return;
    }

    generateStrategyMutation.mutate({
      videoId,
      transcript: videoTranscript,
      currentTitle: videoTitle,
      model: selectedModel,
    });
  };

  const handleEditStrategy = () => {
    setIsEditingStrategy(true);
    setEditedStrategy(strategy);
  };

  const handleSaveStrategy = () => {
    setStrategy(editedStrategy);
    setIsEditingStrategy(false);
    toast.success("Stratégie mise à jour !");
  };

  const handleCancelEditStrategy = () => {
    setEditedStrategy(strategy);
    setIsEditingStrategy(false);
  };

  const handleGenerateSuggestions = () => {
    if (!videoTranscript) {
      toast.error("Aucune transcription disponible pour cette vidéo");
      return;
    }

    generateSuggestionsMutation.mutate({
      videoId,
      transcript: videoTranscript,
      strategy: strategy || undefined,
      model: selectedModel,
    });
  };

  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    toast.success("Prompt Midjourney copié !");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadFavorite = (promptContent: string, favoriteId: number) => {
    setStrategy(promptContent);
    setEditedStrategy(promptContent);
    useFavoritePromptMutation.mutate({ promptId: favoriteId });
    toast.success("👍 Prompt favori chargé !");
  };

  const handleSaveFavorite = () => {
    const contentToSave = isEditingStrategy ? editedStrategy : strategy;
    if (!contentToSave.trim()) {
      toast.error("Le champ de stratégie est vide");
      return;
    }
    saveFavoritePromptMutation.mutate({
      promptType: "thumbnail",
      promptContent: contentToSave,
    });
  };

  const handleClose = () => {
    setSuggestions([]);
    setStrategy("");
    setEditedStrategy("");
    setIsEditingStrategy(false);
    setCopiedIndex(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-500" />
            Optimisation IA - Génération de miniatures
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Titre actuel */}
          <div>
            <Label>Vidéo</Label>
            <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded">
              {videoTitle}
            </p>
          </div>

          {/* Sélection du modèle */}
          <div className="space-y-2">
            <Label htmlFor="model">Modèle d'IA</Label>
            <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Sélectionnez un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommandé)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rapide)</SelectItem>
                <SelectItem value="o1">O1 (Raisonnement avancé)</SelectItem>
                <SelectItem value="o1-mini">O1 Mini (Raisonnement rapide)</SelectItem>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-5-pro">GPT-5 Pro (Plus puissant)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              💡 GPT-4o offre le meilleur équilibre qualité/vitesse. O1 excelle pour les analyses complexes.
            </p>
          </div>

          {/* Génération de stratégie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Stratégie d'optimisation</Label>
              <div className="flex gap-2">
                <FavoritePromptSelector
                  promptType="thumbnail"
                  onSelect={handleLoadFavorite}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Star className="mr-2 h-4 w-4" />
                      Charger un favori
                    </Button>
                  }
                />
                {strategy && !isEditingStrategy && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditStrategy}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleGenerateStrategy}
                  disabled={generateStrategyMutation.isPending || !videoTranscript}
                >
                  {generateStrategyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer une stratégie
                    </>
                  )}
                </Button>
              </div>
            </div>

            {strategy && !isEditingStrategy && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950">
                <p className="text-sm whitespace-pre-wrap">{strategy}</p>
              </Card>
            )}

            {isEditingStrategy && (
              <div className="space-y-2">
                <Textarea
                  value={editedStrategy}
                  onChange={(e) => setEditedStrategy(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="Modifiez la stratégie..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditStrategy}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveStrategy}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {(strategy || editedStrategy) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveFavorite}
                disabled={saveFavoritePromptMutation.isPending}
                className="w-full"
              >
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Sauvegarder comme favori
              </Button>
            )}

            {!videoTranscript && (
              <p className="text-sm text-muted-foreground italic">
                Aucune transcription disponible. La génération de stratégie nécessite une transcription.
              </p>
            )}
          </div>

          {/* Bouton de génération */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerateSuggestions}
            disabled={generateSuggestionsMutation.isPending || !videoTranscript}
          >
            {generateSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer des suggestions de miniatures
              </>
            )}
          </Button>

          {/* Suggestions générées */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  Suggestions de miniatures ({suggestions.length})
                </Label>
                <div className="flex items-center gap-4">
                  {usedModel && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {usedModel.toUpperCase()}
                    </Badge>
                  )}
                  {generationId && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Notez cette génération</span>
                      <StarRating 
                        generationId={generationId}
                        onRate={(rating) => {
                          toast.success(`Note enregistrée: ${rating}/5`);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {suggestions.map((suggestion, index) => (
                <Card key={index} className="p-5 space-y-3 border-2 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs">
                          #{index + 1}
                        </span>
                        {suggestion.title}
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Description visuelle</Label>
                          <p className="text-sm mt-1">{suggestion.description}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Pourquoi ça fonctionne</Label>
                          <p className="text-sm mt-1 text-muted-foreground italic">{suggestion.rationale}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Prompt Midjourney</Label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyPrompt(suggestion.midjourneyPrompt, index)}
                              className="h-7 px-2"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                  <span className="text-xs">Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  <span className="text-xs">Copier</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto whitespace-pre-wrap">
                            {suggestion.midjourneyPrompt}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
