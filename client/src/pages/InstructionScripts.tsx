import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Clock, GitBranch, Brain, Loader2, Sparkles, ArrowRight, Check, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type ScriptType = 
  | "channel_analysis"
  | "title_guide"
  | "description_guide"
  | "script_analysis"
  | "thumbnail_mechanics"
  | "midjourney_prompts";

type CoordinationScriptType =
  | "strategy_generation"
  | "title_and_thumbnail_generation"
  | "description_generation";

// Scripts qui peuvent être entraînés automatiquement
const TRAINABLE_SCRIPTS: ScriptType[] = ["title_guide", "thumbnail_mechanics", "midjourney_prompts"];

const SCRIPT_TYPES: { value: ScriptType; label: string; description: string }[] = [
  {
    value: "channel_analysis",
    label: "Analyse Chaîne YouTube",
    description: "Guide d'analyse stratégique pour le choix de thèmes performants",
  },
  {
    value: "title_guide",
    label: "Guide Titre",
    description: "Méthode pour créer des titres optimisés et accrocheurs",
  },
  {
    value: "description_guide",
    label: "Guide Description & Tags",
    description: "Optimisation des descriptions et tags pour le référencement",
  },
  {
    value: "script_analysis",
    label: "Analyse Scripts Piliers",
    description: "Analyse des scripts vidéo et piliers thématiques",
  },
  {
    value: "thumbnail_mechanics",
    label: "Mécaniques Miniatures",
    description: "Techniques pour créer des miniatures percutantes",
  },
  {
    value: "midjourney_prompts",
    label: "Prompts Midjourney",
    description: "Guide de création de prompts pour génération d'images",
  },
];

const COORDINATION_SCRIPT_TYPES: { value: CoordinationScriptType; label: string; description: string }[] = [
  {
    value: "strategy_generation",
    label: "Stratégie Titre & Miniature",
    description: "Génère une stratégie d'optimisation basée sur l'analyse de la vidéo et des tests A/B",
  },
  {
    value: "title_and_thumbnail_generation",
    label: "Génération Titre & Miniature",
    description: "Génère 10 suggestions de titres et 10 suggestions de miniatures optimisées",
  },
  {
    value: "description_generation",
    label: "Génération Description & Tags",
    description: "Génère une description YouTube optimisée avec tags pertinents",
  },
];

export default function InstructionScripts() {
  const [selectedType, setSelectedType] = useState<ScriptType>("channel_analysis");
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  
  // États pour l'entraînement
  const [showTrainDialog, setShowTrainDialog] = useState(false);
  const [trainModel, setTrainModel] = useState<'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o1-mini' | 'gpt-5' | 'gpt-5-pro'>('gpt-4o');
  const [trainChannelId, setTrainChannelId] = useState(() => localStorage.getItem('lastChannelId') || '');
  
  // États pour la prévisualisation des différences
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const [trainedContent, setTrainedContent] = useState("");

  const { data: scripts, refetch } = trpc.instructionScripts.list.useQuery({
    scriptType: selectedType,
  });

  const createMutation = trpc.instructionScripts.create.useMutation({
    onSuccess: () => {
      toast.success("Nouvelle version publiée !");
      setIsCreating(false);
      setNewContent("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const trainMutation = trpc.instructionScripts.trainScript.useMutation({
    onSuccess: (data) => {
      toast.success("Script entraîné avec succès !");
      setOriginalContent(scripts?.[0]?.content || "");
      setTrainedContent(data.trainedContent);
      setShowTrainDialog(false);
      setShowDiffDialog(true);
    },
    onError: (error) => {
      toast.error(`Erreur d'entraînement: ${error.message}`);
    },
  });

  const setActiveMutation = trpc.instructionScripts.setActiveVersion.useMutation({
    onSuccess: () => {
      toast.success("Version active mise à jour !");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handlePublish = () => {
    if (!newContent.trim()) {
      toast.error("Le contenu ne peut pas être vide");
      return;
    }

    createMutation.mutate({
      scriptType: selectedType,
      content: newContent,
    });
  };

  const handleTrain = () => {
    const currentContent = scripts?.[0]?.content;
    if (!currentContent) {
      toast.error("Aucun script à entraîner. Publiez d'abord une version.");
      return;
    }

    // Vérifier que le type est bien entraînable
    if (!TRAINABLE_SCRIPTS.includes(selectedType)) {
      toast.error("Ce type de script ne peut pas être entraîné.");
      return;
    }

    trainMutation.mutate({
      scriptType: selectedType as "title_guide" | "thumbnail_mechanics" | "midjourney_prompts",
      model: trainModel,
      channelId: trainChannelId || undefined,
    });
  };

  const handleAcceptTraining = () => {
    // Publier le contenu entraîné comme nouvelle version avec le modèle utilisé
    createMutation.mutate({
      scriptType: selectedType,
      content: trainedContent,
      trainedBy: trainModel,
    });
    setShowDiffDialog(false);
    setTrainedContent("");
    setOriginalContent("");
  };

  const handleRejectTraining = () => {
    setShowDiffDialog(false);
    setTrainedContent("");
    setOriginalContent("");
    toast.info("Entraînement annulé");
  };

  const selectedTypeInfo = SCRIPT_TYPES.find((t) => t.value === selectedType);
  const isTrainable = TRAINABLE_SCRIPTS.includes(selectedType);

  // Fonction pour calculer les différences simples
  const computeDiff = (original: string, trained: string) => {
    const originalLines = original.split('\n');
    const trainedLines = trained.split('\n');
    
    const diff: { type: 'same' | 'added' | 'removed'; content: string }[] = [];
    
    // Algorithme simple de diff ligne par ligne
    let i = 0, j = 0;
    while (i < originalLines.length || j < trainedLines.length) {
      if (i >= originalLines.length) {
        diff.push({ type: 'added', content: trainedLines[j] });
        j++;
      } else if (j >= trainedLines.length) {
        diff.push({ type: 'removed', content: originalLines[i] });
        i++;
      } else if (originalLines[i] === trainedLines[j]) {
        diff.push({ type: 'same', content: originalLines[i] });
        i++;
        j++;
      } else {
        // Chercher si la ligne originale existe plus loin dans trained
        const foundInTrained = trainedLines.slice(j + 1, j + 5).indexOf(originalLines[i]);
        const foundInOriginal = originalLines.slice(i + 1, i + 5).indexOf(trainedLines[j]);
        
        if (foundInTrained !== -1 && (foundInOriginal === -1 || foundInTrained <= foundInOriginal)) {
          // La ligne trained[j] est une addition
          diff.push({ type: 'added', content: trainedLines[j] });
          j++;
        } else if (foundInOriginal !== -1) {
          // La ligne original[i] a été supprimée
          diff.push({ type: 'removed', content: originalLines[i] });
          i++;
        } else {
          // Modification: suppression + addition
          diff.push({ type: 'removed', content: originalLines[i] });
          diff.push({ type: 'added', content: trainedLines[j] });
          i++;
          j++;
        }
      }
    }
    
    return diff;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scripts d'Instructions</h1>
          <p className="text-muted-foreground">
            Gérez les scripts d'instructions versionnés pour alimenter les prompts IA
          </p>
        </div>

        {/* Script Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {SCRIPT_TYPES.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all ${
                selectedType === type.value
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedType(type.value)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {type.label}
                  {TRAINABLE_SCRIPTS.includes(type.value) && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      Entraînable
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Selected Script Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>{selectedTypeInfo?.label}</CardTitle>
                <CardDescription>{selectedTypeInfo?.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                {isTrainable && scripts && scripts.length > 0 && (
                  <Button
                    onClick={() => setShowTrainDialog(true)}
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Entraîner le modèle
                  </Button>
                )}
                <Button
                  onClick={() => setIsCreating(!isCreating)}
                  variant={isCreating ? "outline" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreating ? "Annuler" : "Publier nouvelle version"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isCreating && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-3">Nouvelle Version</h3>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Collez le contenu du script ici..."
                  className="min-h-[200px] font-mono text-sm mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handlePublish}
                    disabled={createMutation.isPending || !newContent.trim()}
                  >
                    {createMutation.isPending ? "Publication..." : "Publier"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Version History */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">
                Historique des Versions ({scripts?.length || 0})
              </h3>

              {!scripts || scripts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune version disponible pour ce script.</p>
                  <p className="text-sm mt-2">
                    Cliquez sur "Publier nouvelle version" pour commencer.
                  </p>
                </div>
              ) : (
                scripts.map((script, index) => (
                  <Card key={script.id} className={script.isActive ? "border-green-500 border-2" : index === 0 ? "border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Version {script.version}
                          {script.isActive && (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                              <Check className="h-3 w-3 mr-1" />
                              Version active
                            </Badge>
                          )}
                          {index === 0 && !script.isActive && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Dernière
                            </span>
                          )}
                          {script.trainedBy && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Entraîné par {script.trainedBy}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {!script.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveMutation.mutate({
                                scriptType: selectedType,
                                version: script.version,
                              })}
                              disabled={setActiveMutation.isPending}
                            >
                              {setActiveMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Utiliser cette version
                            </Button>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(script.createdAt).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
                          {script.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scripts de Coordination */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              <div>
                <CardTitle>Scripts de Coordination</CardTitle>
                <CardDescription>
                  Scripts qui combinent les scripts d'instructions avec des balises dynamiques pour générer du contenu optimisé.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CoordinationScriptsSection />
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'entraînement */}
      <Dialog open={showTrainDialog} onOpenChange={setShowTrainDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Entraîner le modèle
            </DialogTitle>
            <DialogDescription>
              L'IA va analyser tous vos A/B tests et les titres actuels de votre chaîne pour mettre à jour le script avec les nouveaux patterns gagnants.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modèle d'IA</Label>
              <Select value={trainModel} onValueChange={(v) => setTrainModel(v as typeof trainModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Recommandé)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rapide)</SelectItem>
                  <SelectItem value="o1">O1 (Raisonnement avancé)</SelectItem>
                  <SelectItem value="o1-mini">O1 Mini</SelectItem>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="gpt-5-pro">GPT-5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ID de chaîne YouTube (optionnel)</Label>
              <Input
                value={trainChannelId}
                onChange={(e) => setTrainChannelId(e.target.value)}
                placeholder="UCxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Si fourni, les titres actuels de la chaîne seront analysés pour détecter les tendances.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrainDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleTrain} 
              disabled={trainMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {trainMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entraînement en cours...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Lancer l'entraînement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de prévisualisation des différences */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Prévisualisation des modifications
            </DialogTitle>
            <DialogDescription>
              Comparez la version actuelle avec la version entraînée. Les lignes vertes sont des ajouts, les rouges des suppressions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Version actuelle</Badge>
                <p className="text-xs text-muted-foreground">{originalContent.length} caractères</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700">Version entraînée</Badge>
                <p className="text-xs text-muted-foreground">{trainedContent.length} caractères</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm max-h-[400px] overflow-y-auto">
              {computeDiff(originalContent, trainedContent).map((line, idx) => (
                <div
                  key={idx}
                  className={`py-0.5 px-2 rounded ${
                    line.type === 'added' 
                      ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
                      : line.type === 'removed'
                      ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
                      : ''
                  }`}
                >
                  <span className="mr-2 opacity-50">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.content || '\u00A0'}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleRejectTraining}>
              <X className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button 
              onClick={handleAcceptTraining}
              className="bg-green-600 hover:bg-green-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accepter et publier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Composant pour gérer les scripts de coordination
function CoordinationScriptsSection() {
  const [editingScript, setEditingScript] = useState<CoordinationScriptType | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState<CoordinationScriptType | null>(null);

  const strategyScriptQuery = trpc.coordinationScripts.get.useQuery({
    scriptType: "strategy_generation",
  });

  const titleThumbnailScriptQuery = trpc.coordinationScripts.get.useQuery({
    scriptType: "title_and_thumbnail_generation",
  });

  const descriptionScriptQuery = trpc.coordinationScripts.get.useQuery({
    scriptType: "description_generation",
  });

  const upsertMutation = trpc.coordinationScripts.upsert.useMutation({
    onSuccess: () => {
      toast.success("Script de coordination enregistré");
      setEditingScript(null);
      strategyScriptQuery.refetch();
      titleThumbnailScriptQuery.refetch();
      descriptionScriptQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleEdit = (scriptType: CoordinationScriptType, currentContent: string) => {
    setEditingScript(scriptType);
    setEditedContent(currentContent);
  };

  const handleSave = (scriptType: CoordinationScriptType) => {
    upsertMutation.mutate({
      scriptType,
      content: editedContent,
    });
  };

  const handleCancel = () => {
    setEditingScript(null);
    setEditedContent("");
  };

  const renderScriptCard = (
    scriptType: CoordinationScriptType,
    query: typeof strategyScriptQuery,
    info: { label: string; description: string }
  ) => {
    const isEditing = editingScript === scriptType;
    const showHistory = showVersionHistory === scriptType;

    return (
      <Card key={scriptType}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{info.label}</CardTitle>
              <CardDescription className="mt-1">{info.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVersionHistory(showHistory ? null : scriptType)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {showHistory ? "Masquer" : "Historique"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(scriptType, query.data?.content || "")}
                  >
                    Éditer
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Saisissez le script de coordination avec balises {{video_transcript}}, {{ab_test_report}}, {{guide_*}}..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(scriptType)}
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg">
              {query.isLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : query.data?.content ? (
                <pre className="text-sm whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                  {query.data.content}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun script de coordination défini. Cliquez sur "Éditer" pour en créer un.
                </p>
              )}
            </div>
          )}

          {showHistory && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-3">Historique des Versions</h4>
              <p className="text-sm text-muted-foreground">
                Fonctionnalité en cours de développement. Les versions précédentes seront bientôt disponibles.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {COORDINATION_SCRIPT_TYPES.map((type) => {
        let query;
        if (type.value === "strategy_generation") query = strategyScriptQuery;
        else if (type.value === "title_and_thumbnail_generation") query = titleThumbnailScriptQuery;
        else query = descriptionScriptQuery;

        return renderScriptCard(type.value, query, type);
      })}

      {/* Balises disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balises Disponibles</CardTitle>
          <CardDescription>
            Utilisez ces balises dans vos scripts de coordination pour injecter dynamiquement le contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <code className="bg-muted px-2 py-1 rounded">{"{{video_transcript}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{ab_test_report}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{strategy_summary}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{current_channel_titles}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_channel_analysis}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_title}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_description}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_script_analysis}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_thumbnail_mechanics}}"}</code>
            <code className="bg-muted px-2 py-1 rounded">{"{{guide_midjourney_prompts}}"}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
