import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Download, 
  Play, 
  Settings2, 
  RefreshCw, 
  Save, 
  Eye, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  BarChart3,
  Copy,
  Check,
  Loader2,
  FileDown,
  Table2
} from "lucide-react";
import { Streamdown } from "streamdown";

type ModelType = "gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini" | "gpt-5" | "gpt-5-pro";

export default function ScriptWriting() {
  const [activeTab, setActiveTab] = useState("write");
  const [topic, setTopic] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt-4o");
  const [generatedScript, setGeneratedScript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coordinationPrompt, setCoordinationPrompt] = useState("");
  const [isPromptModified, setIsPromptModified] = useState(false);
  const [expandedGuides, setExpandedGuides] = useState<string[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);

  // Fetch channel export data
  const { data: channelExport, isLoading: isLoadingExport } = trpc.scriptWriting.getChannelExport.useQuery();
  
  // Fetch coordination prompt
  const { data: promptData, isLoading: isLoadingPrompt } = trpc.scriptWriting.getCoordinationPrompt.useQuery();
  
  // Fetch instruction scripts
  const { data: instructionScripts, isLoading: isLoadingScripts } = trpc.scriptWriting.getInstructionScripts.useQuery();

  // Mutations
  const generateScriptMutation = trpc.scriptWriting.generateScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      setWordCount(data.wordCount);
      setSections(data.sections);
      setIsGenerating(false);
      toast.success(`Script généré ! ${data.wordCount} mots`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const savePromptMutation = trpc.scriptWriting.saveCoordinationPrompt.useMutation({
    onSuccess: () => {
      setIsPromptModified(false);
      toast.success("Prompt de coordination sauvegardé");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetPromptMutation = trpc.scriptWriting.resetCoordinationPrompt.useMutation({
    onSuccess: (data) => {
      setCoordinationPrompt(data.prompt);
      setIsPromptModified(false);
      toast.success("Prompt réinitialisé aux valeurs par défaut");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const exportCSVMutation = trpc.scriptWriting.exportCSV.useQuery(undefined, {
    enabled: false,
  });

  // Initialize coordination prompt
  useEffect(() => {
    if (promptData?.prompt) {
      setCoordinationPrompt(promptData.prompt);
    }
  }, [promptData]);

  const handleGenerateScript = () => {
    if (!topic.trim()) {
      toast.error("Veuillez entrer un sujet pour le script");
      return;
    }
    setIsGenerating(true);
    generateScriptMutation.mutate({
      topic,
      customInstructions: customInstructions || undefined,
      model: selectedModel,
      coordinationPrompt: isPromptModified ? coordinationPrompt : undefined,
    });
  };

  const handleSavePrompt = () => {
    savePromptMutation.mutate({ content: coordinationPrompt });
  };

  const handleResetPrompt = () => {
    resetPromptMutation.mutate();
  };

  const handleExportCSV = async () => {
    try {
      const result = await exportCSVMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `channel_videos_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${result.data.totalVideos} vidéos exportées`);
      }
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopiedScript(true);
    toast.success("Script copié dans le presse-papiers");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const toggleGuide = (guide: string) => {
    setExpandedGuides(prev => 
      prev.includes(guide) ? prev.filter(g => g !== guide) : [...prev, guide]
    );
  };

  const guideLabels: Record<string, string> = {
    channel_analysis: "Analyse de Chaîne",
    title_guide: "Guide des Titres",
    description_guide: "Guide des Descriptions",
    script_analysis: "Guide des Scripts",
    thumbnail_mechanics: "Mécaniques de Miniatures",
    midjourney_prompts: "Prompts Midjourney",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Écriture de Script
            </h1>
            <p className="text-muted-foreground mt-1">
              Générez des scripts YouTube de 5000-6000 mots avec coordination automatique
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Écrire
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Coordination
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Write Tab */}
          <TabsContent value="write" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Nouveau Script
                  </CardTitle>
                  <CardDescription>
                    Entrez le sujet et les instructions pour générer votre script
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sujet du script *</label>
                    <Input
                      placeholder="Ex: Les 10 erreurs fatales des débutants en investissement"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instructions personnalisées</label>
                    <Textarea
                      placeholder="Ex: Inclure des exemples concrets, ton humoristique, cibler les 25-35 ans..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modèle IA</label>
                    <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ModelType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommandé)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rapide)</SelectItem>
                        <SelectItem value="o1">O1 (Raisonnement avancé)</SelectItem>
                        <SelectItem value="o1-mini">O1 Mini</SelectItem>
                        <SelectItem value="gpt-5">GPT-5 (Premium)</SelectItem>
                        <SelectItem value="gpt-5-pro">GPT-5 Pro (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Objectif: 5000-6000 mots</span>
                    <span>
                      {Object.keys(instructionScripts || {}).length} guides chargés
                    </span>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleGenerateScript}
                    disabled={isGenerating || !topic.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Générer le Script
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Script Généré
                      </CardTitle>
                      <CardDescription>
                        {wordCount > 0 ? `${wordCount.toLocaleString('fr-FR')} mots` : 'En attente de génération'}
                      </CardDescription>
                    </div>
                    {generatedScript && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyScript}>
                          {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {generatedScript ? (
                    <div className="space-y-4">
                      {sections.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sections.map((section, i) => (
                            <Badge key={i} variant="secondary">{section}</Badge>
                          ))}
                        </div>
                      )}
                      <ScrollArea className="h-[500px] rounded-md border p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <Streamdown>{generatedScript}</Streamdown>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>Votre script apparaîtra ici</p>
                      <p className="text-sm">Entrez un sujet et cliquez sur Générer</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Coordination Tab */}
          <TabsContent value="coordination" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Prompt de Coordination
                    </CardTitle>
                    <CardDescription>
                      Personnalisez le prompt maître qui orchestre la génération de scripts
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleResetPrompt}
                      disabled={resetPromptMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Réinitialiser
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSavePrompt}
                      disabled={!isPromptModified || savePromptMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPrompt ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={promptData?.isDefault ? "secondary" : "default"}>
                        {promptData?.isDefault ? "Prompt par défaut" : "Prompt personnalisé"}
                      </Badge>
                      {isPromptModified && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          Modifications non sauvegardées
                        </Badge>
                      )}
                    </div>
                    <Textarea
                      className="font-mono text-sm min-h-[600px]"
                      value={coordinationPrompt}
                      onChange={(e) => {
                        setCoordinationPrompt(e.target.value);
                        setIsPromptModified(true);
                      }}
                      placeholder="Chargement du prompt..."
                    />
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Tags disponibles:</strong></p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><code>{"<<<GUIDE_ANALYSE_CHAINE_CHRISTOPHE_PAULY>>>"}</code> - Analyse de chaîne</li>
                        <li><code>{"<<<GUIDE_TITRE>>>"}</code> - Guide des titres</li>
                        <li><code>{"<<<GUIDE_META_AB_TEST>>>"}</code> - Guide des scripts</li>
                        <li><code>{"<<<GUIDE_MINIATURES>>>"}</code> - Mécaniques de miniatures</li>
                        <li><code>{"<<<GUIDE_PROMPTS_MIDJOURNEY>>>"}</code> - Prompts Midjourney</li>
                        <li><code>{"{{channel_videos_data}}"}</code> - Données des vidéos de la chaîne</li>
                        <li><code>{"{{script_topic}}"}</code> - Sujet du script</li>
                        <li><code>{"{{custom_instructions}}"}</code> - Instructions personnalisées</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Guides d'Instructions
                </CardTitle>
                <CardDescription>
                  Aperçu des guides qui seront injectés dans le prompt de coordination
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingScripts ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(instructionScripts || {}).map(([key, content]) => (
                      <Collapsible 
                        key={key} 
                        open={expandedGuides.includes(key)}
                        onOpenChange={() => toggleGuide(key)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {expandedGuides.includes(key) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{guideLabels[key] || key}</span>
                          </div>
                          <Badge variant="outline">
                            {(content as string).length.toLocaleString('fr-FR')} caractères
                          </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ScrollArea className="h-64 rounded-md border m-4 p-4">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {content as string}
                            </pre>
                          </ScrollArea>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {Object.keys(instructionScripts || {}).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun guide configuré</p>
                        <p className="text-sm">Allez dans Scripts d'Instructions pour ajouter vos guides</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Channel Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistiques de la Chaîne
                  </CardTitle>
                  <CardDescription>
                    Vue d'ensemble de toutes vos vidéos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingExport ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : channelExport ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{channelExport.totalVideos}</p>
                        <p className="text-sm text-muted-foreground">Vidéos totales</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{channelExport.totalViews.toLocaleString('fr-FR')}</p>
                        <p className="text-sm text-muted-foreground">Vues totales</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{channelExport.totalLikes.toLocaleString('fr-FR')}</p>
                        <p className="text-sm text-muted-foreground">Likes totaux</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{channelExport.averageViews.toLocaleString('fr-FR')}</p>
                        <p className="text-sm text-muted-foreground">Moyenne vues/vidéo</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export des Données
                  </CardTitle>
                  <CardDescription>
                    Téléchargez les titres et descriptions de toutes vos vidéos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={!channelExport || channelExport.totalVideos === 0}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Exporter en CSV
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled={!channelExport || channelExport.totalVideos === 0}
                      >
                        <Table2 className="mr-2 h-4 w-4" />
                        Voir les vidéos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Vidéos de la chaîne ({channelExport?.totalVideos || 0})</DialogTitle>
                        <DialogDescription>
                          Liste complète de toutes vos vidéos avec leurs statistiques
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-2">
                          {channelExport?.videos.map((video, i) => (
                            <div key={video.youtubeId} className="p-3 rounded-lg border hover:bg-muted/50">
                              <div className="flex items-start gap-3">
                                <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{video.title}</p>
                                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                    <span>{video.views.toLocaleString('fr-FR')} vues</span>
                                    <span>{video.likes.toLocaleString('fr-FR')} likes</span>
                                    <span>{video.comments.toLocaleString('fr-FR')} commentaires</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>L'export CSV contient:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>ID YouTube de chaque vidéo</li>
                      <li>Titre complet</li>
                      <li>Description (500 premiers caractères)</li>
                      <li>Nombre de vues, likes et commentaires</li>
                      <li>Date de publication</li>
                      <li>Durée</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
