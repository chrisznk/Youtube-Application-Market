import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, Download, Edit2, Save, X, Star } from "lucide-react";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ModelRecommendation } from "@/components/ModelRecommendation";
import { StarRating } from "@/components/StarRating";
import { FavoritePromptSelector } from "@/components/FavoritePromptSelector";

interface OptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: number;
  videoTitle: string;
  videoTranscript?: string | null;
}

interface Suggestion {
  title: string;
  reason: string;
}

export default function OptimizationDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  videoTranscript,
}: OptimizationDialogProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [strategy, setStrategy] = useState("");
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [editedStrategy, setEditedStrategy] = useState("");
  const [selectedModel, setSelectedModel] = useState<'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini' | 'gpt-5' | 'gpt-5-pro'>('gpt-4o');
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);

  const rateGenerationMutation = trpc.openai.rateGeneration.useMutation({
    onSuccess: () => {
      toast.success("Merci pour votre notation !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleRateGeneration = (generationId: number, rating: number) => {
    rateGenerationMutation.mutate({ generationId, rating });
  };

  const saveFavoritePromptMutation = trpc.openai.saveFavoritePrompt.useMutation({
    onSuccess: () => {
      toast.success("Prompt sauvegardé dans les favoris !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleSaveFavoritePrompt = () => {
    if (!customPrompt.trim()) {
      toast.error("Le prompt est vide");
      return;
    }
    saveFavoritePromptMutation.mutate({
      promptType: 'title',
      promptContent: customPrompt,
    });
  };

  const generateStrategyMutation = trpc.openai.generateStrategy.useMutation({
    onSuccess: (data) => {
      setStrategy(data.strategy);
      setEditedStrategy(data.strategy);
      setUsedModel(selectedModel);
      setGenerationId(data.generationId);
      setIsEditingStrategy(false);
      toast.success("Stratégie générée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const exportReportQuery = trpc.openai.exportABTestReport.useQuery(
    { videoId, videoTitle },
    { enabled: false }
  );

  const generateSuggestionsMutation = trpc.openai.generateSuggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      toast.success(`${data.suggestions.length} suggestions générées !`);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

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

  const handleExportReport = async () => {
    try {
      const result = await exportReportQuery.refetch();
      if (result.data?.report) {
        const blob = new Blob([result.data.report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-ab-testing-${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Rapport exporté avec succès !");
      }
    } catch (error) {
      toast.error("Erreur lors de l'export du rapport");
    }
  };

  const handleGenerateSuggestions = () => {
    if (!videoTranscript) {
      toast.error("Aucune transcription disponible pour cette vidéo");
      return;
    }

    generateSuggestionsMutation.mutate({
      videoId,
      transcript: videoTranscript,
      currentTitle: videoTitle,
      strategy: strategy || undefined,
      customPrompt: customPrompt || undefined,
      model: selectedModel,
    });
  };

  const handleCopyTitle = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    toast.success("Titre copié !");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClose = () => {
    setCustomPrompt("");
    setSuggestions([]);
    setStrategy("");
    setEditedStrategy("");
    setIsEditingStrategy(false);
    setCopiedIndex(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Optimisation IA - Génération de titres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Titre actuel */}
          <div>
            <Label>Titre actuel</Label>
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
            
            {/* Recommandation de modèle */}
            <ModelRecommendation 
              context="strategy"
              currentModel={selectedModel}
              onSelectModel={(model) => setSelectedModel(model as any)}
            />
          </div>

          {/* Bouton d'export de rapport */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              disabled={exportReportQuery.isFetching}
            >
              {exportReportQuery.isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter rapport A/B Testing
                </>
              )}
            </Button>
          </div>

          {/* Génération de stratégie */}
          <div className="space-y-3">
            {/* Indicateur de progression pour modèles lents */}
            <ProgressIndicator 
              model={selectedModel}
              isGenerating={generateStrategyMutation.isPending}
            />
            
            <div className="flex items-center justify-between">
              <Label>Stratégie d'optimisation</Label>
              <div className="flex gap-2">
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
                {usedModel && (
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Modèle utilisé: {usedModel.toUpperCase()}
                    </Badge>
                    {generationId && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">Notez cette génération</span>
                        <StarRating 
                          generationId={generationId}
                          onRate={handleRateGeneration}
                        />
                      </div>
                    )}
                  </div>
                )}
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

            {!videoTranscript && (
              <p className="text-sm text-muted-foreground italic">
                Aucune transcription disponible. La génération de stratégie nécessite une transcription.
              </p>
            )}
          </div>

          {/* Prompt personnalisé */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customPrompt">Instructions personnalisées (optionnel)</Label>
              <div className="flex gap-2">
                <FavoritePromptSelector
                  promptType="title"
                  onSelect={(content) => setCustomPrompt(content)}
                />
                {customPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveFavoritePrompt}
                    disabled={saveFavoritePromptMutation.isPending}
                  >
                    {saveFavoritePromptMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Sauvegarder comme favori
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              id="customPrompt"
              placeholder="Ex: Créer des titres qui mettent l'accent sur l'aspect émotionnel, utiliser des chiffres, éviter les clickbaits..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
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
                Générer des suggestions de titres
              </>
            )}
          </Button>

          {/* Suggestions générées */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Suggestions générées</Label>
                <Badge variant="outline">{suggestions.length} titres</Badge>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge className="mt-0.5">{index + 1}</Badge>
                          <p className="font-medium text-sm leading-relaxed">
                            {suggestion.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-8">
                          💡 {suggestion.reason}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyTitle(suggestion.title, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Astuce :</strong> Utilisez ces suggestions comme base pour créer des tests A/B.
                  Testez 2-3 variantes pour identifier le titre le plus performant !
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
