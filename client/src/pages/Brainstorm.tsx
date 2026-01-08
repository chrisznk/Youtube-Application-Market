import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Video, Sparkles, ThumbsUp, ThumbsDown, Copy, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { Streamdown } from "streamdown";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommandé)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Rapide)" },
  { value: "o1", label: "o1 (Raisonnement avancé)" },
  { value: "o1-mini", label: "o1 Mini" },
];

interface VideoIdea {
  title: string;
  summary: string;
}

interface PostProdResult {
  titles: string[];
  thumbnailIdeas: string[];
  tagsSets: string[];
  descriptions: string[];
}

export default function Brainstorm() {
  const [activeTab, setActiveTab] = useState<"pre-prod" | "post-prod">("pre-prod");
  
  // Pré-production state
  const [preProdModel, setPreProdModel] = useState<"gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini">("gpt-4o");
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  
  // Post-production state
  const [postProdModel, setPostProdModel] = useState<"gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini">("gpt-4o");
  const [transcript, setTranscript] = useState("");
  const [postProdResult, setPostProdResult] = useState<PostProdResult | null>(null);
  const [isGeneratingPostProd, setIsGeneratingPostProd] = useState(false);
  
  // Rating state
  const [preProdRating, setPreProdRating] = useState<"up" | "down" | null>(null);
  const [postProdRating, setPostProdRating] = useState<"up" | "down" | null>(null);
  
  // Copy state
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  
  // Saved ideas state
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());

  const utils = trpc.useUtils();

  // Mutations
  const generateIdeasMutation = trpc.brainstorm.generateVideoIdeas.useMutation({
    onSuccess: (result) => {
      setVideoIdeas(result.ideas);
      setIsGeneratingIdeas(false);
      toast.success("10 idées de vidéos générées !");
    },
    onError: (error) => {
      setIsGeneratingIdeas(false);
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const generatePostProdMutation = trpc.brainstorm.generatePostProduction.useMutation({
    onSuccess: (result) => {
      setPostProdResult(result);
      setIsGeneratingPostProd(false);
      toast.success("Contenu post-production généré !");
    },
    onError: (error) => {
      setIsGeneratingPostProd(false);
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const rateGenerationMutation = trpc.brainstorm.rateGeneration.useMutation({
    onSuccess: () => {
      toast.success("Notation enregistrée !");
    },
  });

  const saveIdeaMutation = trpc.savedIdeas.save.useMutation({
    onSuccess: () => {
      toast.success("Idée sauvegardée !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleSaveIdea = (idea: VideoIdea, index: number) => {
    const key = `idea-${index}`;
    if (savedIdeas.has(key)) {
      toast.info("Cette idée est déjà sauvegardée");
      return;
    }
    setSavedIdeas(prev => new Set(Array.from(prev).concat(key)));
    saveIdeaMutation.mutate({
      ideaType: "video_idea",
      title: idea.title,
      summary: idea.summary,
      source: "brainstorm_preprod",
      model: preProdModel,
    });
  };

  const handleSavePostProdItem = (type: "title" | "thumbnail" | "tags" | "description", content: string, index: number) => {
    const key = `${type}-${index}`;
    if (savedIdeas.has(key)) {
      toast.info("Cet élément est déjà sauvegardé");
      return;
    }
    setSavedIdeas(prev => new Set(Array.from(prev).concat(key)));
    saveIdeaMutation.mutate({
      ideaType: type,
      title: content,
      source: "brainstorm_postprod",
      model: postProdModel,
    });
  };

  const handleGenerateIdeas = () => {
    setIsGeneratingIdeas(true);
    setVideoIdeas([]);
    setPreProdRating(null);
    generateIdeasMutation.mutate({ model: preProdModel });
  };

  const handleGeneratePostProd = () => {
    if (!transcript.trim()) {
      toast.error("Veuillez entrer la transcription de votre vidéo");
      return;
    }
    setIsGeneratingPostProd(true);
    setPostProdResult(null);
    setPostProdRating(null);
    generatePostProdMutation.mutate({ 
      model: postProdModel,
      transcript: transcript.trim()
    });
  };

  const handleRatePreProd = (rating: "up" | "down") => {
    setPreProdRating(rating);
    rateGenerationMutation.mutate({
      type: "video_ideas",
      model: preProdModel,
      rating: rating === "up" ? 1 : -1,
    });
  };

  const handleRatePostProd = (rating: "up" | "down") => {
    setPostProdRating(rating);
    rateGenerationMutation.mutate({
      type: "post_production",
      model: postProdModel,
      rating: rating === "up" ? 1 : -1,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Brainstorm</h1>
            <p className="text-muted-foreground">
              Trouvez des idées de vidéos et générez du contenu optimisé
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pre-prod" | "post-prod")}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pre-prod" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Pré-production
            </TabsTrigger>
            <TabsTrigger value="post-prod" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Post-production
            </TabsTrigger>
          </TabsList>

          {/* Pré-production Tab */}
          <TabsContent value="pre-prod" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Trouver des idées de vidéos
                </CardTitle>
                <CardDescription>
                  L'IA analyse votre chaîne, vos scripts d'instructions et vos performances 
                  pour générer 10 idées de vidéos personnalisées avec titre et résumé.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Modèle IA</label>
                    <Select value={preProdModel} onValueChange={(v) => setPreProdModel(v as "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-6">
                    <Button 
                      onClick={handleGenerateIdeas}
                      disabled={isGeneratingIdeas}
                      size="lg"
                    >
                      {isGeneratingIdeas ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Trouver des idées de vidéos
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Résultats des idées */}
                {videoIdeas.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">10 idées de vidéos</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Cette génération était-elle utile ?</span>
                        <Button
                          variant={preProdRating === "up" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRatePreProd("up")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={preProdRating === "down" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleRatePreProd("down")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {videoIdeas.map((idea, index) => (
                        <Card key={index} className="relative">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">{index + 1}</Badge>
                                  <h4 className="font-semibold">{idea.title}</h4>
                                </div>
                                <p className="text-muted-foreground text-sm">{idea.summary}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveIdea(idea, index)}
                                  title="Sauvegarder cette idée"
                                >
                                  {savedIdeas.has(`idea-${index}`) ? (
                                    <BookmarkCheck className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Bookmark className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`${idea.title}\n\n${idea.summary}`, `idea-${index}`)}
                                >
                                  {copiedIndex === `idea-${index}` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post-production Tab */}
          <TabsContent value="post-prod" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  Générer le contenu post-production
                </CardTitle>
                <CardDescription>
                  Collez la transcription de votre vidéo pour générer automatiquement 
                  10 titres, 10 idées de miniatures, 2 sets de tags (500 caractères max) et 2 descriptions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Transcription de la vidéo</label>
                  <Textarea
                    placeholder="Collez ici la transcription complète de votre vidéo..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {transcript.length} caractères
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Modèle IA</label>
                    <Select value={postProdModel} onValueChange={(v) => setPostProdModel(v as "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-6">
                    <Button 
                      onClick={handleGeneratePostProd}
                      disabled={isGeneratingPostProd || !transcript.trim()}
                      size="lg"
                    >
                      {isGeneratingPostProd ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Générer le contenu
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Résultats post-production */}
                {postProdResult && (
                  <div className="space-y-6 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Contenu généré</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Cette génération était-elle utile ?</span>
                        <Button
                          variant={postProdRating === "up" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRatePostProd("up")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={postProdRating === "down" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleRatePostProd("down")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Titres */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge>10 Titres</Badge>
                      </h4>
                      <div className="grid gap-2">
                        {postProdResult.titles.map((title, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="flex-1">{title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(title, `title-${index}`)}
                            >
                              {copiedIndex === `title-${index}` ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Miniatures */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="secondary">10 Idées de Miniatures</Badge>
                      </h4>
                      <div className="grid gap-2">
                        {postProdResult.thumbnailIdeas.map((idea, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="flex-1 text-sm">{idea}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(idea, `thumb-${index}`)}
                            >
                              {copiedIndex === `thumb-${index}` ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="outline">2 Sets de Tags (500 car. max)</Badge>
                      </h4>
                      <div className="grid gap-3">
                        {postProdResult.tagsSets.map((tags, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">
                                  Set {index + 1} ({tags.length}/500 caractères)
                                </p>
                                <p className="text-sm">{tags}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(tags, `tags-${index}`)}
                              >
                                {copiedIndex === `tags-${index}` ? (
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

                    {/* Descriptions */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default">2 Descriptions</Badge>
                      </h4>
                      <div className="grid gap-3">
                        {postProdResult.descriptions.map((desc, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Description {index + 1}
                                  </p>
                                  <div className="text-sm whitespace-pre-wrap">{desc}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(desc, `desc-${index}`)}
                                >
                                  {copiedIndex === `desc-${index}` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
