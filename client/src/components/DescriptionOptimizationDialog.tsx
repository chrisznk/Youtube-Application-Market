import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Copy, Check, Sparkles, Star, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ModelRecommendation } from "@/components/ModelRecommendation";
import { StarRating } from "@/components/StarRating";
import { FavoritePromptSelector } from "@/components/FavoritePromptSelector";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: number;
  videoTitle: string;
  transcript: string | null;
  tags?: string;
}

export default function DescriptionOptimizationDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  transcript,
  tags,
}: DescriptionOptimizationDialogProps) {
  const [model, setModel] = useState<'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini' | 'gpt-5' | 'gpt-5-pro'>('gpt-4o');
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [metadata, setMetadata] = useState<{
    length_category: string;
    keyword_density: number;
    question_count: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [generationId, setGenerationId] = useState<number | null>(null);

  const rateGenerationMutation = trpc.openai.rateGeneration.useMutation({
    onSuccess: () => {
      toast.success("Note enregistrée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'enregistrement de la note: ${error.message}`);
    },
  });

  const generateDescriptionMutation = trpc.openai.generateDescriptionSuggestions.useMutation({
    onSuccess: (data) => {
      setDescription(data.description);
      // Les tags peuvent être une string ou un tableau
      const tagsArray = typeof data.tags === 'string' 
        ? data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : (data.tags || []);
      setGeneratedTags(tagsArray);
      setRationale(data.rationale);
      setUsedModel(model);
      setGenerationId(data.generationId);
      setMetadata({
        length_category: data.length_category,
        keyword_density: data.keyword_density,
        question_count: data.question_count,
      });
      toast.success("Description et tags générés avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
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

  const handleGenerate = () => {
    generateDescriptionMutation.mutate({
      videoId,
      videoTitle,
      transcript: transcript || "",
      tags,
      strategy: customInstructions,
      model,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success("Description copiée dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTagsToClipboard = () => {
    navigator.clipboard.writeText(generatedTags.join(', '));
    setCopiedTags(true);
    toast.success("Tags copiés dans le presse-papiers !");
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleLoadFavorite = (promptContent: string, favoriteId: number) => {
    setCustomInstructions(promptContent);
    useFavoritePromptMutation.mutate({ promptId: favoriteId });
    toast.success("👍 Prompt favori chargé !");
  };

  const handleSaveFavorite = () => {
    if (!customInstructions.trim()) {
      toast.error("Le champ d'instructions est vide");
      return;
    }
    saveFavoritePromptMutation.mutate({
      promptType: "description",
      promptContent: customInstructions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Optimisation IA - Description YouTube
          </DialogTitle>
          <DialogDescription>
            Générez une description YouTube optimisée pour : <strong>{videoTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modèle IA</Label>
            <Select value={model} onValueChange={(value: any) => setModel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommandé)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rapide)</SelectItem>
                <SelectItem value="o1">O1 (Raisonnement avancé)</SelectItem>
                <SelectItem value="o1-mini">O1 Mini</SelectItem>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-5-pro">GPT-5 Pro (Plus puissant)</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Recommandation de modèle */}
            <ModelRecommendation 
              context="description"
              currentModel={model}
              onSelectModel={(m) => setModel(m as any)}
            />
            
            {/* Indicateur de progression pour modèles lents */}
            <ProgressIndicator 
              model={model}
              isGenerating={generateDescriptionMutation.isPending}
            />
          </div>

          {/* Custom Instructions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customInstructions">Instructions personnalisées (optionnel)</Label>
              <FavoritePromptSelector
                promptType="description"
                onSelect={handleLoadFavorite}
                trigger={
                  <Button variant="outline" size="sm">
                    <Star className="mr-2 h-4 w-4" />
                    Charger un favori
                  </Button>
                }
              />
            </div>
            <Textarea
              id="customInstructions"
              placeholder="Ajoutez des instructions spécifiques pour personnaliser la génération..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
            />
            {customInstructions.trim() && (
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
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateDescriptionMutation.isPending}
            className="w-full"
          >
            {generateDescriptionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Générer une description optimisée
              </>
            )}
          </Button>

          {/* Description Result */}
          {description && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {usedModel && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Modèle utilisé: {usedModel.toUpperCase()}
                  </Badge>
                )}
                {generationId && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">Notez cette génération</span>
                    <StarRating 
                      generationId={generationId}
                      onRate={(genId, rating) => {
                        rateGenerationMutation.mutate({ generationId: genId, rating });
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description générée</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{description}</p>
                </div>
              </div>

              {/* Tags */}
              {generatedTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags générés ({generatedTags.length})</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTagsToClipboard}
                    >
                      {copiedTags ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex flex-wrap gap-2">
                      {generatedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {metadata && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {metadata.length_category}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Catégorie
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(metadata.keyword_density * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Densité mots-clés
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {metadata.question_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Questions
                    </div>
                  </div>
                </div>
              )}

              {/* Rationale */}
              <div className="space-y-2">
                <Label>Pourquoi cette description fonctionne</Label>
                <div className="p-4 border rounded-lg bg-accent/50">
                  <p className="text-sm">{rationale}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
