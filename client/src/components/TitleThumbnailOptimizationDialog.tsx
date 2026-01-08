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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Check, Star, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ModelRecommendation } from "@/components/ModelRecommendation";
import { StarRating } from "@/components/StarRating";
import { FavoritePromptSelector } from "@/components/FavoritePromptSelector";

interface TitleThumbnailOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: number;
  videoTitle: string;
  transcript: string | null;
}

export default function TitleThumbnailOptimizationDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  transcript,
}: TitleThumbnailOptimizationDialogProps) {
  const [strategy, setStrategy] = useState("");
  const [model, setModel] = useState<'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini' | 'gpt-5' | 'gpt-5-pro'>('gpt-4o');
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<Array<{ rank: number; title: string }>>([]);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<Array<{
    rank: number;
    thumbnail_title_variants: string[];
    midjourney_prompt_variants: string[];
  }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [strategyGenerationId, setStrategyGenerationId] = useState<number | null>(null);
  const [titleRating, setTitleRating] = useState<number>(0);
  const [thumbnailRating, setThumbnailRating] = useState<number>(0);
  
  // Nano Banana image generation state
  const [imagePrompt, setImagePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [nanoBananaMode, setNanoBananaMode] = useState<'standard' | 'pro'>('standard');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const rateGenerationMutation = trpc.openai.rateGeneration.useMutation({
    onSuccess: () => {
      toast.success("Note enregistrée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'enregistrement de la note: ${error.message}`);
    },
  });

  const generateStrategyMutation = trpc.openai.generateStrategy.useMutation({
    onSuccess: (data) => {
      setStrategy(data.strategy);
      setStrategyGenerationId(data.generationId);
      toast.success("Stratégie générée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const generateSuggestionsMutation = trpc.openai.generateTitleAndThumbnailSuggestions.useMutation({
    onSuccess: (data) => {
      setTitleSuggestions(data.titleSuggestions || []);
      setThumbnailSuggestions(data.thumbnailSuggestions || []);
      setUsedModel(model);
      setGenerationId(data.generationId);
      toast.success(`Généré: ${data.titleSuggestions?.length || 0} titres et ${data.thumbnailSuggestions?.length || 0} miniatures !`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const generateImageMutation = trpc.nanoBanana.generateThumbnail.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      setIsGeneratingImage(false);
      toast.success("Image générée avec succès !");
    },
    onError: (error) => {
      setIsGeneratingImage(false);
      toast.error(error.message || "Erreur lors de la génération de l'image");
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
    // Transcription optionnelle - on continue même sans
    // Récupérer l'ID de chaîne depuis localStorage pour les titres actuels
    const channelId = localStorage.getItem('lastChannelId') || undefined;

    generateStrategyMutation.mutate({
      videoId,
      transcript: transcript || "",
      currentTitle: videoTitle,
      channelId,
      model,
    });
  };

  const handleGenerateSuggestions = () => {
    console.log('handleGenerateSuggestions called!', { videoId, transcript, videoTitle, strategy, model });
    // Récupérer l'ID de chaîne depuis localStorage pour les titres actuels
    const channelId = localStorage.getItem('lastChannelId') || undefined;
    
    generateSuggestionsMutation.mutate({
      videoId,
      transcript: transcript || "",
      currentTitle: videoTitle,
      channelId,
      strategy,
      model,
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copié dans le presse-papiers !");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadFavorite = (promptContent: string, favoriteId: number) => {
    setStrategy(promptContent);
    useFavoritePromptMutation.mutate({ promptId: favoriteId });
    toast.success("👍 Prompt favori chargé !");
  };

  const handleSaveFavorite = () => {
    if (!strategy.trim()) {
      toast.error("Le champ de stratégie est vide");
      return;
    }
    saveFavoritePromptMutation.mutate({
      promptType: "title",
      promptContent: strategy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Optimisation IA - Titres & Miniatures
          </DialogTitle>
          <DialogDescription>
            Générez des suggestions de titres et miniatures optimisés pour : <strong>{videoTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nano Banana Image Generation Section - Always Visible at Top */}
          <div className="space-y-4 border rounded-lg p-4 bg-accent/10">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Génération d'Image (Nano Banana)
            </h3>
            
            {/* Image Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Prompt de génération</Label>
              <Textarea
                id="imagePrompt"
                placeholder="Décrivez l'image que vous souhaitez générer pour votre miniature..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Reference Images Upload */}
            <div className="space-y-2">
              <Label htmlFor="referenceImages">Images de référence (optionnel)</Label>
              <input
                id="referenceImages"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setReferenceImages(files);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {referenceImages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {referenceImages.length} image(s) sélectionnée(s)
                </p>
              )}
            </div>

            {/* Nano Banana Mode Selection */}
            <div className="space-y-2">
              <Label htmlFor="nanoBananaMode">Mode Nano Banana</Label>
              <Select value={nanoBananaMode} onValueChange={(value: any) => setNanoBananaMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Imagen 4 Standard)</SelectItem>
                  <SelectItem value="pro">Pro (Imagen 4 Ultra)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Format d'image (Ratio)</Label>
              <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (YouTube Standard)</SelectItem>
                  <SelectItem value="1:1">1:1 (Carré)</SelectItem>
                  <SelectItem value="4:3">4:3 (Classique)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical/Shorts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Image Button */}
            <Button
              onClick={async () => {
                if (!imagePrompt.trim()) {
                  toast.error("Veuillez saisir un prompt de génération");
                  return;
                }
                
                setIsGeneratingImage(true);
                try {
                  // Convert reference images to base64 if any
                  const referenceImagesData: Array<{ data: string; mimeType: string }> = [];
                  
                  for (const file of referenceImages) {
                    const reader = new FileReader();
                    const base64 = await new Promise<string>((resolve, reject) => {
                      reader.onload = () => {
                        const result = reader.result as string;
                        // Remove data:image/xxx;base64, prefix
                        const base64Data = result.split(',')[1];
                        resolve(base64Data);
                      };
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    
                    referenceImagesData.push({
                      data: base64,
                      mimeType: file.type,
                    });
                  }
                  
                  // Call Nano Banana API
                  generateImageMutation.mutate({
                    prompt: imagePrompt,
                    mode: nanoBananaMode,
                    aspectRatio,
                    referenceImages: referenceImagesData.length > 0 ? referenceImagesData : undefined,
                  });
                } catch (error: any) {
                  console.error('Error preparing images:', error);
                  toast.error("Erreur lors de la préparation des images");
                  setIsGeneratingImage(false);
                }
              }}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="w-full"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer l'image
                </>
              )}
            </Button>

            {/* Generated Image Display */}
            {generatedImageUrl && (
              <div className="space-y-2">
                <Label>Image générée</Label>
                <div className="border rounded-lg p-4">
                  <img
                    src={generatedImageUrl}
                    alt="Image générée"
                    className="w-full h-auto rounded"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedImageUrl, '_blank')}
                  className="w-full"
                >
                  Télécharger l'image
                </Button>
              </div>
            )}
          </div>

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
              context="titles"
              currentModel={model}
              onSelectModel={(m) => setModel(m as any)}
            />
            
            {/* Indicateur de progression pour modèles lents */}
            <ProgressIndicator 
              model={model}
              isGenerating={generateSuggestionsMutation.isPending}
            />
          </div>

          {/* Strategy Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="strategy">Stratégie d'optimisation</Label>
              <div className="flex gap-2">
                <FavoritePromptSelector
                  promptType="title"
                  onSelect={handleLoadFavorite}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Star className="mr-2 h-4 w-4" />
                      Charger un favori
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateStrategy}
                  disabled={generateStrategyMutation.isPending}
                >
                  {generateStrategyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Générer une stratégie"
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="strategy"
              placeholder="Décrivez votre stratégie d'optimisation ou générez-en une automatiquement..."
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              rows={4}
            />
            {strategy.trim() && (
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveFavorite}
                  disabled={saveFavoritePromptMutation.isPending}
                >
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Sauvegarder comme favori
                </Button>
                {strategyGenerationId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Notez la stratégie:</span>
                    <StarRating 
                      generationId={strategyGenerationId}
                      onRate={(genId, rating) => {
                        rateGenerationMutation.mutate({ generationId: genId, rating });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={() => {
              console.log('Button clicked!');
              handleGenerateSuggestions();
            }}
            disabled={generateSuggestionsMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            {generateSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer des suggestions
              </>
            )}
          </button>

          {/* Title Suggestions */}
          {titleSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suggestions de Titres ({titleSuggestions.length})</h3>
                <div className="flex items-center gap-4">
                  {usedModel && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {usedModel.toUpperCase()}
                    </Badge>
                  )}
                  {generationId && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Notez les titres:</span>
                      <StarRating 
                        generationId={generationId}
                        initialRating={titleRating}
                        onRate={(genId, rating) => {
                          setTitleRating(rating);
                          rateGenerationMutation.mutate({ generationId: genId, rating });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {titleSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{suggestion.rank}
                          </span>
                          <h4 className="font-medium">{suggestion.title}</h4>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion.title, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnail Suggestions */}
          {thumbnailSuggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suggestions de Miniatures ({thumbnailSuggestions.length})</h3>
                {generationId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Notez les miniatures:</span>
                    <StarRating 
                      generationId={generationId}
                      initialRating={thumbnailRating}
                      onRate={(genId, rating) => {
                        setThumbnailRating(rating);
                        rateGenerationMutation.mutate({ generationId: genId, rating });
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {thumbnailSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{suggestion.rank}
                      </span>
                      <h4 className="font-medium">Miniature {suggestion.rank}</h4>
                    </div>

                    {/* Thumbnail Title Variants */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Textes de miniature :</Label>
                      <div className="flex gap-2 mt-1">
                        {suggestion.thumbnail_title_variants.map((variant, vIndex) => (
                          <div
                            key={vIndex}
                            className="flex-1 p-2 bg-accent/50 rounded text-sm font-medium text-center"
                          >
                            {variant}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Midjourney Prompts */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Prompts Midjourney :</Label>
                      <div className="space-y-2 mt-1">
                        {suggestion.midjourney_prompt_variants.map((prompt, pIndex) => (
                          <div
                            key={pIndex}
                            className="flex items-start gap-2 p-2 bg-muted rounded"
                          >
                            <code className="flex-1 text-xs">{prompt}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(prompt, index * 100 + pIndex)}
                            >
                              {copiedIndex === index * 100 + pIndex ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </DialogContent>
    </Dialog>
  );
}
