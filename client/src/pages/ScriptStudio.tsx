import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { 
  PenTool, 
  User, 
  BookOpen, 
  History, 
  Plus, 
  Trash2, 
  Star, 
  Sparkles, 
  AlertCircle, 
  Check, 
  X, 
  Edit3,
  Copy,
  Download,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  FileText,
  Lightbulb,
  Settings,
  RefreshCw,
  Upload,
  BarChart3,
  TrendingUp,
  Layout,
  BookTemplate,
  Mic,
  Swords,
  Search,
  PartyPopper,
  Clock,
  RotateCcw,
  GitCompare,
  Save,
  GitBranch,
  GitMerge,
  Archive,
  Play,
  Heart,
  Keyboard
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommandé)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Rapide)" },
  { value: "o1", label: "O1 (Raisonnement)" },
  { value: "o1-mini", label: "O1 Mini" },
  { value: "gpt-5", label: "GPT-5 (Premium)" },
  { value: "gpt-5-pro", label: "GPT-5 Pro (Ultra)" },
];

const CORRECTION_CATEGORIES = [
  { value: "structure", label: "Structure", color: "bg-blue-500" },
  { value: "tone", label: "Ton & Style", color: "bg-purple-500" },
  { value: "length", label: "Longueur", color: "bg-orange-500" },
  { value: "transitions", label: "Transitions", color: "bg-green-500" },
  { value: "examples", label: "Exemples", color: "bg-yellow-500" },
  { value: "engagement", label: "Engagement", color: "bg-pink-500" },
  { value: "cta", label: "Call-to-Action", color: "bg-red-500" },
  { value: "other", label: "Autre", color: "bg-gray-500" },
];

export default function ScriptStudio() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("write");
  
  // Write tab state
  const [topic, setTopic] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>();
  const [generatedScript, setGeneratedScript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);
  
  // Profile dialog state
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileMetaPrompt, setProfileMetaPrompt] = useState("");
  
  // Correction dialog state
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [correctionProblem, setCorrectionProblem] = useState("");
  const [correctionSuggestion, setCorrectionSuggestion] = useState("");
  const [correctionCategory, setCorrectionCategory] = useState("other");
  const [isGeneratingCorrection, setIsGeneratingCorrection] = useState(false);

  // Queries
  const { data: profiles, refetch: refetchProfiles } = trpc.scriptStudio.getProfiles.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: defaultProfile } = trpc.scriptStudio.getDefaultProfile.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: corrections, refetch: refetchCorrections } = trpc.scriptStudio.getCorrections.useQuery(
    { activeOnly: false },
    { enabled: !!user }
  );
  
  const { data: history, refetch: refetchHistory } = trpc.scriptStudio.getHistory.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );
  
  const { data: defaultMetaPrompt } = trpc.scriptStudio.getDefaultMetaPrompt.useQuery();
  
  const { data: templates } = trpc.scriptStudio.getTemplates.useQuery();
  
  const { data: learningStats, refetch: refetchStats } = trpc.scriptStudio.getLearningStats.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const generateScriptMutation = trpc.scriptStudio.generateScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      setWordCount(data.wordCount);
      setCurrentHistoryId(data.historyId);
      refetchHistory();
      toast.success(`Script généré ! ${data.wordCount} mots, ${data.correctionsApplied} corrections appliquées`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const createProfileMutation = trpc.scriptStudio.createProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      setShowProfileDialog(false);
      resetProfileForm();
      toast.success("Profil créé !");
    },
  });

  const updateProfileMutation = trpc.scriptStudio.updateProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      setShowProfileDialog(false);
      resetProfileForm();
      toast.success("Profil mis à jour !");
    },
  });

  const deleteProfileMutation = trpc.scriptStudio.deleteProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      toast.success("Profil supprimé !");
    },
  });

  const setDefaultProfileMutation = trpc.scriptStudio.setDefaultProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      toast.success("Profil par défaut mis à jour !");
    },
  });

  const addCorrectionMutation = trpc.scriptStudio.addCorrection.useMutation({
    onSuccess: () => {
      refetchCorrections();
      setShowCorrectionDialog(false);
      resetCorrectionForm();
      toast.success("Correction ajoutée au carnet !");
    },
  });

  const generateCorrectionMutation = trpc.scriptStudio.generateCorrectionFromFeedback.useMutation({
    onSuccess: (data) => {
      setCorrectionSuggestion(data.correction);
      setCorrectionCategory(data.category);
      setIsGeneratingCorrection(false);
    },
    onError: () => {
      setIsGeneratingCorrection(false);
      toast.error("Erreur lors de la génération de la correction");
    },
  });

  const toggleCorrectionMutation = trpc.scriptStudio.toggleCorrection.useMutation({
    onSuccess: () => refetchCorrections(),
  });

  const deleteCorrectionMutation = trpc.scriptStudio.deleteCorrection.useMutation({
    onSuccess: () => {
      refetchCorrections();
      toast.success("Correction supprimée !");
    },
  });

  const rateScriptMutation = trpc.scriptStudio.rateScript.useMutation({
    onSuccess: () => {
      refetchHistory();
      toast.success("Évaluation enregistrée !");
    },
  });

  const createFromTemplateMutation = trpc.scriptStudio.createFromTemplate.useMutation({
    onSuccess: () => {
      refetchProfiles();
      toast.success("Profil créé à partir du template !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const { data: exportData, refetch: refetchExport } = trpc.scriptStudio.exportData.useQuery(undefined, {
    enabled: false,
  });

  const importDataMutation = trpc.scriptStudio.importData.useMutation({
    onSuccess: (data) => {
      refetchProfiles();
      refetchCorrections();
      toast.success(`Import réussi ! ${data.profilesImported} profils et ${data.correctionsImported} corrections importés`);
    },
    onError: (error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });

  // Versioning state
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [selectedVersionProfileId, setSelectedVersionProfileId] = useState<number | null>(null);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareVersionId1, setCompareVersionId1] = useState<number | null>(null);
  const [compareVersionId2, setCompareVersionId2] = useState<number | null>(null);

  // Versioning queries
  const { data: profileVersions, refetch: refetchVersions } = trpc.scriptStudio.getProfileVersions.useQuery(
    { profileId: selectedVersionProfileId! },
    { enabled: !!selectedVersionProfileId }
  );

  const { data: comparisonData } = trpc.scriptStudio.compareProfileVersions.useQuery(
    {
      profileId: selectedVersionProfileId!,
      versionId1: compareVersionId1!,
      versionId2: compareVersionId2!,
    },
    { enabled: !!selectedVersionProfileId && !!compareVersionId1 && !!compareVersionId2 }
  );

  // Versioning mutations
  const saveVersionMutation = trpc.scriptStudio.saveProfileVersion.useMutation({
    onSuccess: (data) => {
      refetchVersions();
      toast.success(`Version ${data.version} sauvegardée !`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const restoreVersionMutation = trpc.scriptStudio.restoreProfileVersion.useMutation({
    onSuccess: () => {
      refetchProfiles();
      refetchVersions();
      toast.success("Profil restauré avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Branches state
  const [showBranchesDialog, setShowBranchesDialog] = useState(false);
  const [selectedBranchProfileId, setSelectedBranchProfileId] = useState<number | null>(null);
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchDescription, setNewBranchDescription] = useState("");
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [showEditBranchDialog, setShowEditBranchDialog] = useState(false);
  const [editBranchMetaPrompt, setEditBranchMetaPrompt] = useState("");

  // Branches queries
  const { data: branches, refetch: refetchBranches } = trpc.scriptStudio.getBranches.useQuery(
    { profileId: selectedBranchProfileId! },
    { enabled: !!selectedBranchProfileId }
  );

  // Branches mutations
  const createBranchMutation = trpc.scriptStudio.createBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      setShowCreateBranchDialog(false);
      setNewBranchName("");
      setNewBranchDescription("");
      toast.success("Branche créée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateBranchMutation = trpc.scriptStudio.updateBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      setShowEditBranchDialog(false);
      setEditingBranch(null);
      toast.success("Branche mise à jour !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const mergeBranchMutation = trpc.scriptStudio.mergeBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      refetchProfiles();
      toast.success("Branche fusionnée avec succès !");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const abandonBranchMutation = trpc.scriptStudio.abandonBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      toast.success("Branche abandonnée");
    },
  });

  const deleteBranchMutation = trpc.scriptStudio.deleteBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      toast.success("Branche supprimée");
    },
  });

  const reactivateBranchMutation = trpc.scriptStudio.reactivateBranch.useMutation({
    onSuccess: () => {
      refetchBranches();
      toast.success("Branche réactivée");
    },
  });

  // Diff & Favorites state
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [diffVersionId1, setDiffVersionId1] = useState<number | null>(null);
  const [diffVersionId2, setDiffVersionId2] = useState<number | null>(null);

  // Diff query
  const { data: versionDiff, isLoading: isDiffLoading } = trpc.scriptStudio.getVersionDiff.useQuery(
    {
      profileId: selectedVersionProfileId!,
      versionId1: diffVersionId1!,
      versionId2: diffVersionId2!,
    },
    { enabled: !!selectedVersionProfileId && !!diffVersionId1 && !!diffVersionId2 && showDiffDialog }
  );

  // Favorites query
  const { data: favoriteVersions, refetch: refetchFavorites } = trpc.scriptStudio.getFavoriteVersions.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Favorites mutation
  const toggleFavoriteMutation = trpc.scriptStudio.toggleVersionFavorite.useMutation({
    onSuccess: (data) => {
      refetchVersions();
      refetchFavorites();
      toast.success(data.isFavorite ? "Version ajoutée aux favoris" : "Version retirée des favoris");
    },
  });

  // Keyboard shortcuts
  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Only in profiles tab and when editing
    if (activeTab !== "profiles") return;
    
    // Ctrl+S: Save version
    if (e.ctrlKey && e.key === "s" && editingProfile) {
      e.preventDefault();
      saveVersionMutation.mutate({
        profileId: editingProfile.id,
        changeDescription: "Sauvegarde rapide (Ctrl+S)",
      });
    }
  }, [activeTab, editingProfile, saveVersionMutation]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Effects
  useEffect(() => {
    if (defaultProfile && !selectedProfileId) {
      setSelectedProfileId(defaultProfile.id);
    }
  }, [defaultProfile, selectedProfileId]);

  // Helpers
  const resetProfileForm = () => {
    setEditingProfile(null);
    setProfileName("");
    setProfileDescription("");
    setProfileMetaPrompt(defaultMetaPrompt?.metaPrompt || "");
  };

  const resetCorrectionForm = () => {
    setCorrectionProblem("");
    setCorrectionSuggestion("");
    setCorrectionCategory("other");
  };

  const handleGenerateScript = () => {
    if (!topic.trim()) {
      toast.error("Veuillez entrer un sujet pour le script");
      return;
    }
    
    generateScriptMutation.mutate({
      topic,
      model: selectedModel as any,
      customInstructions: customInstructions || undefined,
      profileId: selectedProfileId,
    });
  };

  const handleSaveProfile = () => {
    if (!profileName.trim() || !profileMetaPrompt.trim()) {
      toast.error("Nom et méta-prompt requis");
      return;
    }

    if (editingProfile) {
      updateProfileMutation.mutate({
        profileId: editingProfile.id,
        name: profileName,
        description: profileDescription || undefined,
        metaPrompt: profileMetaPrompt,
      });
    } else {
      createProfileMutation.mutate({
        name: profileName,
        description: profileDescription || undefined,
        metaPrompt: profileMetaPrompt,
      });
    }
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setProfileDescription(profile.description || "");
    setProfileMetaPrompt(profile.metaPrompt);
    setShowProfileDialog(true);
  };

  const handleGenerateCorrection = () => {
    if (!correctionProblem.trim()) {
      toast.error("Décrivez le problème");
      return;
    }
    setIsGeneratingCorrection(true);
    generateCorrectionMutation.mutate({ problem: correctionProblem });
  };

  const handleAddCorrection = () => {
    if (!correctionProblem.trim() || !correctionSuggestion.trim()) {
      toast.error("Problème et correction requis");
      return;
    }
    addCorrectionMutation.mutate({
      problem: correctionProblem,
      correction: correctionSuggestion,
      category: correctionCategory as any,
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    toast.success("Script copié !");
  };

  const handleExportData = async () => {
    const result = await refetchExport();
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `script-studio-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé !");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.profiles || !data.corrections) {
          toast.error("Format de fichier invalide");
          return;
        }
        importDataMutation.mutate({ data, replaceExisting: false });
      } catch (error) {
        toast.error("Erreur de lecture du fichier JSON");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleDownloadScript = () => {
    const blob = new Blob([generatedScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${topic.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCorrections = corrections?.filter(c => c.isActive) || [];

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <PenTool className="h-8 w-8 text-primary" />
              Script Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Générez des scripts YouTube de 5000-6000 mots avec votre style personnel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              {profiles?.length || 0} profils
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {activeCorrections.length} corrections actives
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="write" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Écrire
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-2">
              <User className="h-4 w-4" />
              Profils
            </TabsTrigger>
            <TabsTrigger value="corrections" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Corrections
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <Swords className="h-4 w-4" />
              Comparer
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Layout className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Write Tab */}
          <TabsContent value="write" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Nouveau Script
                  </CardTitle>
                  <CardDescription>
                    Entrez le sujet et les instructions pour générer votre script
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Sujet du script *</Label>
                    <Input
                      id="topic"
                      placeholder="Ex: Les 10 erreurs fatales des débutants en investissement"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions personnalisées</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Ex: Inclure des exemples concrets, ton humoristique, cibler les 25-35 ans..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Profil de style</Label>
                      <Select
                        value={selectedProfileId?.toString()}
                        onValueChange={(v) => setSelectedProfileId(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un profil" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles?.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id.toString()}>
                              {profile.name} {profile.isDefault && "(Par défaut)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Modèle IA</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Objectif: 5000-6000 mots</span>
                    <span>{activeCorrections.length} corrections seront appliquées</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerateScript}
                    disabled={generateScriptMutation.isPending || !topic.trim()}
                  >
                    {generateScriptMutation.isPending ? (
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

              {/* Right: Generated Script */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Script Généré
                      </CardTitle>
                      <CardDescription>
                        {wordCount > 0 ? `${wordCount.toLocaleString('fr-FR')} mots` : "En attente de génération"}
                      </CardDescription>
                    </div>
                    {generatedScript && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyScript}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Signaler un problème</DialogTitle>
                              <DialogDescription>
                                Décrivez ce qui ne va pas et une correction sera ajoutée à votre carnet
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Problème identifié</Label>
                                <Textarea
                                  placeholder="Ex: Les transitions sont trop longues et répétitives"
                                  value={correctionProblem}
                                  onChange={(e) => setCorrectionProblem(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <Button
                                variant="outline"
                                onClick={handleGenerateCorrection}
                                disabled={isGeneratingCorrection || !correctionProblem.trim()}
                              >
                                {isGeneratingCorrection ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Lightbulb className="mr-2 h-4 w-4" />
                                )}
                                Générer une correction
                              </Button>
                              {correctionSuggestion && (
                                <div className="space-y-2">
                                  <Label>Correction suggérée</Label>
                                  <Textarea
                                    value={correctionSuggestion}
                                    onChange={(e) => setCorrectionSuggestion(e.target.value)}
                                    rows={3}
                                  />
                                  <Select value={correctionCategory} onValueChange={setCorrectionCategory}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CORRECTION_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                          {cat.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddCorrection} disabled={!correctionSuggestion.trim()}>
                                Ajouter au carnet
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedScript ? (
                    <div className="prose prose-sm max-w-none max-h-[600px] overflow-y-auto">
                      <Streamdown>{generatedScript}</Streamdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>Votre script apparaîtra ici</p>
                      <p className="text-sm">Entrez un sujet et cliquez sur Générer</p>
                    </div>
                  )}
                </CardContent>
                {generatedScript && currentHistoryId && (
                  <div className="px-6 pb-4 flex items-center justify-center gap-4 border-t pt-4">
                    <span className="text-sm text-muted-foreground">Évaluer ce script:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rateScriptMutation.mutate({ historyId: currentHistoryId, rating: "1" })}
                    >
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rateScriptMutation.mutate({ historyId: currentHistoryId, rating: "0" })}
                    >
                      <Minus className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rateScriptMutation.mutate({ historyId: currentHistoryId, rating: "-1" })}
                    >
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Mes Profils de Style</h2>
                <p className="text-muted-foreground">
                  Créez des méta-prompts personnalisés pour différents types de vidéos
                </p>
              </div>
              <Dialog open={showProfileDialog} onOpenChange={(open) => {
                setShowProfileDialog(open);
                if (!open) resetProfileForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetProfileForm();
                    setShowProfileDialog(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProfile ? "Modifier le profil" : "Nouveau profil de style"}
                    </DialogTitle>
                    <DialogDescription>
                      Définissez votre style d'écriture personnel pour ce type de vidéo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom du profil *</Label>
                        <Input
                          placeholder="Ex: Vidéo éducative"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Ex: Pour les tutoriels et formations"
                          value={profileDescription}
                          onChange={(e) => setProfileDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Méta-Prompt (vos instructions de style) *</Label>
                      <Textarea
                        placeholder="Décrivez votre style d'écriture, ton, structure préférée..."
                        value={profileMetaPrompt}
                        onChange={(e) => setProfileMetaPrompt(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {profileMetaPrompt.length} caractères
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      {editingProfile ? "Mettre à jour" : "Créer le profil"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles?.map((profile) => (
                <Card key={profile.id} className={profile.isDefault ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {profile.name}
                          {profile.isDefault && (
                            <Badge variant="default" className="text-xs">Par défaut</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{profile.description || "Aucune description"}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProfile(profile)} title="Modifier">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVersionProfileId(profile.id);
                            setShowVersionsDialog(true);
                          }}
                          title="Historique des versions"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => saveVersionMutation.mutate({ profileId: profile.id, changeDescription: "Sauvegarde manuelle" })}
                          title="Sauvegarder une version"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBranchProfileId(profile.id);
                            setShowBranchesDialog(true);
                          }}
                          title="Gérer les branches"
                        >
                          <GitBranch className="h-4 w-4" />
                        </Button>
                        {!profile.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProfileMutation.mutate({ profileId: profile.id })}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-3">
                      <p>{profile.metaPrompt.slice(0, 150)}...</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Utilisé {profile.usageCount || 0} fois</span>
                      {!profile.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultProfileMutation.mutate({ profileId: profile.id })}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Définir par défaut
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Corrections Tab */}
          <TabsContent value="corrections" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Carnet de Corrections</h2>
                <p className="text-muted-foreground">
                  Règles durables appliquées automatiquement à toutes les générations
                </p>
              </div>
              <Dialog open={showCorrectionDialog} onOpenChange={(open) => {
                setShowCorrectionDialog(open);
                if (!open) resetCorrectionForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Correction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une correction</DialogTitle>
                    <DialogDescription>
                      Décrivez un problème récurrent et la règle pour le corriger
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Problème identifié *</Label>
                      <Textarea
                        placeholder="Ex: Les transitions sont trop longues et répétitives"
                        value={correctionProblem}
                        onChange={(e) => setCorrectionProblem(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerateCorrection}
                      disabled={isGeneratingCorrection || !correctionProblem.trim()}
                    >
                      {isGeneratingCorrection ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lightbulb className="mr-2 h-4 w-4" />
                      )}
                      Générer une correction avec l'IA
                    </Button>
                    <div className="space-y-2">
                      <Label>Règle corrective *</Label>
                      <Textarea
                        placeholder="Ex: Limiter les transitions à une phrase maximum"
                        value={correctionSuggestion}
                        onChange={(e) => setCorrectionSuggestion(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={correctionCategory} onValueChange={setCorrectionCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORRECTION_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddCorrection} disabled={!correctionProblem.trim() || !correctionSuggestion.trim()}>
                      Ajouter au carnet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {corrections?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune correction enregistrée</p>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez des corrections pour améliorer vos futurs scripts
                    </p>
                  </CardContent>
                </Card>
              ) : (
                corrections?.map((correction) => {
                  const category = CORRECTION_CATEGORIES.find(c => c.value === correction.category);
                  return (
                    <Card key={correction.id} className={!correction.isActive ? "opacity-50" : ""}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={category?.color}>{category?.label}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Appliqué {correction.appliedCount || 0} fois
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1">Problème: {correction.problem}</p>
                            <p className="text-sm text-muted-foreground">Correction: {correction.correction}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={correction.isActive}
                              onCheckedChange={() => toggleCorrectionMutation.mutate({ correctionId: correction.id })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCorrectionMutation.mutate({ correctionId: correction.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Historique des Scripts</h2>
                <p className="text-muted-foreground">
                  Retrouvez tous vos scripts générés
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchHistory()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>

            <div className="space-y-3">
              {history?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun script généré</p>
                    <p className="text-sm text-muted-foreground">
                      Vos scripts apparaîtront ici après génération
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {history?.map((entry) => (
                    <AccordionItem key={entry.id} value={entry.id.toString()} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {entry.rating === 1 && <ThumbsUp className="h-4 w-4 text-green-500" />}
                              {entry.rating === -1 && <ThumbsDown className="h-4 w-4 text-red-500" />}
                              {entry.rating === 0 && <Minus className="h-4 w-4 text-gray-500" />}
                            </div>
                            <span className="font-medium">{entry.topic.slice(0, 60)}...</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="outline">{entry.wordCount || 0} mots</Badge>
                            <span>{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4">
                          <div className="flex gap-2 mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(entry.generatedScript);
                                toast.success("Script copié !");
                              }}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTopic(entry.topic);
                                setCustomInstructions(entry.customInstructions || "");
                                setActiveTab("write");
                                toast.info("Sujet chargé dans l'éditeur");
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Régénérer
                            </Button>
                          </div>
                          <div className="prose prose-sm max-w-none max-h-96 overflow-y-auto bg-muted/50 rounded-lg p-4">
                            <Streamdown>{entry.generatedScript}</Streamdown>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Templates de Profils</h2>
                <p className="text-muted-foreground">
                  Profils pré-configurés que vous pouvez dupliquer et personnaliser
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter mes données
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Importer
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((template) => {
                const icons: Record<string, React.ReactNode> = {
                  educatif: <BookOpen className="h-6 w-6 text-blue-500" />,
                  storytelling: <Mic className="h-6 w-6 text-purple-500" />,
                  polemique: <Swords className="h-6 w-6 text-red-500" />,
                  investigation: <Search className="h-6 w-6 text-amber-500" />,
                  divertissement: <PartyPopper className="h-6 w-6 text-green-500" />,
                };
                return (
                  <Card key={template.key} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {icons[template.key] || <FileText className="h-6 w-6" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {template.preview}
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => createFromTemplateMutation.mutate({ templateKey: template.key as any })}
                        disabled={createFromTemplateMutation.isPending}
                      >
                        {createFromTemplateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Utiliser ce template
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export / Import
                </CardTitle>
                <CardDescription>
                  Sauvegardez ou restaurez vos profils et corrections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Exporter</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Téléchargez tous vos profils et corrections en JSON
                    </p>
                    <Button variant="outline" className="w-full" onClick={handleExportData}>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger l'export
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Importer</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Restaurez vos données depuis un fichier JSON
                    </p>
                    <label className="w-full">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Choisir un fichier
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <ComparisonTab
              profiles={profiles || []}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </TabsContent>

          {/* Assistant Tab */}
          <TabsContent value="assistant" className="space-y-4">
            <AssistantTab refetchCorrections={refetchCorrections} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Statistiques d'Apprentissage</h2>
                <p className="text-muted-foreground">
                  Analysez l'évolution de vos scripts et corrections
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchStats()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Scripts Générés</CardDescription>
                  <CardTitle className="text-3xl">{learningStats?.totalScriptsGenerated || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mots Moyens</CardDescription>
                  <CardTitle className="text-3xl">{learningStats?.averageWordCount?.toLocaleString() || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Note Moyenne</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    {learningStats?.averageRating !== undefined ? (
                      <>
                        {learningStats.averageRating > 0 ? (
                          <ThumbsUp className="h-6 w-6 text-green-500" />
                        ) : learningStats.averageRating < 0 ? (
                          <ThumbsDown className="h-6 w-6 text-red-500" />
                        ) : (
                          <Minus className="h-6 w-6 text-gray-500" />
                        )}
                        {(learningStats.averageRating * 100).toFixed(0)}%
                      </>
                    ) : "N/A"}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Corrections Actives</CardDescription>
                  <CardTitle className="text-3xl">{activeCorrections.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Rating Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribution des Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ThumbsUp className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Positif</span>
                          <span>{learningStats?.ratingDistribution?.positive || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${learningStats?.totalScriptsGenerated ? ((learningStats.ratingDistribution?.positive || 0) / learningStats.totalScriptsGenerated) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Minus className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Neutre</span>
                          <span>{learningStats?.ratingDistribution?.neutral || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-500"
                            style={{
                              width: `${learningStats?.totalScriptsGenerated ? ((learningStats.ratingDistribution?.neutral || 0) / learningStats.totalScriptsGenerated) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ThumbsDown className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Négatif</span>
                          <span>{learningStats?.ratingDistribution?.negative || 0}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${learningStats?.totalScriptsGenerated ? ((learningStats.ratingDistribution?.negative || 0) / learningStats.totalScriptsGenerated) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Utilisation des Profils</CardTitle>
                </CardHeader>
                <CardContent>
                  {learningStats?.profileUsage?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucune donnée</p>
                  ) : (
                    <div className="space-y-3">
                      {learningStats?.profileUsage?.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between">
                          <span className="font-medium">{profile.name}</span>
                          <Badge variant="outline">{profile.usageCount} utilisations</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Corrections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Corrections les Plus Appliquées</CardTitle>
                <CardDescription>Les règles qui ont le plus impacté vos scripts</CardDescription>
              </CardHeader>
              <CardContent>
                {learningStats?.topCorrections?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucune correction enregistrée</p>
                ) : (
                  <div className="space-y-3">
                    {learningStats?.topCorrections?.slice(0, 5).map((correction, index) => {
                      const category = CORRECTION_CATEGORIES.find(c => c.value === correction.category);
                      return (
                        <div key={correction.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={category?.color}>{category?.label}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Appliqué {correction.appliedCount} fois
                              </span>
                            </div>
                            <p className="text-sm">{correction.correction}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par Catégorie</CardTitle>
                <CardDescription>Types de corrections les plus fréquents</CardDescription>
              </CardHeader>
              <CardContent>
                {learningStats?.categoryBreakdown?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Aucune donnée</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {learningStats?.categoryBreakdown?.map((cat) => {
                      const category = CORRECTION_CATEGORIES.find(c => c.value === cat.category);
                      return (
                        <div key={cat.category} className="text-center p-3 border rounded-lg">
                          <Badge className={`${category?.color} mb-2`}>{category?.label}</Badge>
                          <p className="text-2xl font-bold">{cat.count}</p>
                          <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Versions Dialog */}
      <VersionsDialog
        open={showVersionsDialog}
        onOpenChange={(open) => {
          setShowVersionsDialog(open);
          if (!open) setSelectedVersionProfileId(null);
        }}
        profileId={selectedVersionProfileId}
        profileName={profiles?.find(p => p.id === selectedVersionProfileId)?.name}
      />

      {/* Branches Dialog */}
      <BranchesDialog
        open={showBranchesDialog}
        onOpenChange={(open) => {
          setShowBranchesDialog(open);
          if (!open) setSelectedBranchProfileId(null);
        }}
        profileId={selectedBranchProfileId}
        profileName={profiles?.find(p => p.id === selectedBranchProfileId)?.name}
        branches={branches}
        refetchBranches={refetchBranches}
        createBranchMutation={createBranchMutation}
        updateBranchMutation={updateBranchMutation}
        mergeBranchMutation={mergeBranchMutation}
        abandonBranchMutation={abandonBranchMutation}
        deleteBranchMutation={deleteBranchMutation}
        reactivateBranchMutation={reactivateBranchMutation}
      />
    </DashboardLayout>
  );
}

// ============ Comparison Tab Component ============

function ComparisonTab({
  profiles,
  selectedModel,
  setSelectedModel,
}: {
  profiles: any[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}) {
  const [comparisonTopic, setComparisonTopic] = useState("");
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");

  const generateComparisonMutation = trpc.scriptStudio.generateComparison.useMutation({
    onSuccess: (data) => {
      setComparisonResults(data);
      toast.success(`${data.length} scripts générés pour comparaison !`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleProfile = (profileId: number) => {
    if (selectedProfileIds.includes(profileId)) {
      setSelectedProfileIds(selectedProfileIds.filter(id => id !== profileId));
    } else if (selectedProfileIds.length < 4) {
      setSelectedProfileIds([...selectedProfileIds, profileId]);
    } else {
      toast.error("Maximum 4 profils pour la comparaison");
    }
  };

  const handleGenerateComparison = () => {
    if (!comparisonTopic.trim()) {
      toast.error("Entrez un sujet pour la comparaison");
      return;
    }
    if (selectedProfileIds.length < 2) {
      toast.error("Sélectionnez au moins 2 profils");
      return;
    }
    generateComparisonMutation.mutate({
      topic: comparisonTopic,
      profileIds: selectedProfileIds,
      model: selectedModel as any,
      customInstructions: customInstructions || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Mode Comparaison
        </h2>
        <p className="text-muted-foreground">
          Générez le même script avec différents profils pour comparer les styles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sujet du script</Label>
            <Input
              value={comparisonTopic}
              onChange={(e) => setComparisonTopic(e.target.value)}
              placeholder="Ex: Les dangers de l'intelligence artificielle"
            />
          </div>

          <div>
            <Label>Instructions complémentaires (optionnel)</Label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Instructions spécifiques pour ce script..."
              rows={2}
            />
          </div>

          <div>
            <Label>Modèle IA</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sélectionnez 2 à 4 profils à comparer</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {profiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant={selectedProfileIds.includes(profile.id) ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => toggleProfile(profile.id)}
                >
                  {selectedProfileIds.includes(profile.id) && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {profile.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedProfileIds.length}/4 profils sélectionnés
            </p>
          </div>

          <Button
            onClick={handleGenerateComparison}
            disabled={generateComparisonMutation.isPending || selectedProfileIds.length < 2}
            className="w-full"
          >
            {generateComparisonMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération en cours...</>
            ) : (
              <><Swords className="mr-2 h-4 w-4" /> Comparer les {selectedProfileIds.length} profils</>
            )}
          </Button>
        </CardContent>
      </Card>

      {comparisonResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Résultats de la comparaison</h3>
          <div className="grid grid-cols-1 gap-4">
            {comparisonResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.profileName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.wordCount} mots</Badge>
                      <Badge variant="secondary">{Math.round(result.generationTime / 1000)}s</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto bg-muted/50 p-4 rounded-lg">
                    <Streamdown>{`${result.script.slice(0, 2000)}...`}</Streamdown>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result.script);
                        toast.success("Script copié !");
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Assistant Tab Component ============

function AssistantTab({ refetchCorrections }: { refetchCorrections: () => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedCorrections, setSelectedCorrections] = useState<number[]>([]);

  const { data: analysisData, refetch: analyzeScripts, isFetching } = trpc.scriptStudio.analyzeNegativeScripts.useQuery(
    undefined,
    { enabled: false }
  );

  const applyCorrectionsMutation = trpc.scriptStudio.applySuggestedCorrections.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.applied} corrections appliquées !`);
      refetchCorrections();
      setSelectedCorrections([]);
      setAnalysis(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeScripts();
    setAnalysis(result.data);
    setIsAnalyzing(false);
  };

  const toggleCorrection = (index: number) => {
    if (selectedCorrections.includes(index)) {
      setSelectedCorrections(selectedCorrections.filter(i => i !== index));
    } else {
      setSelectedCorrections([...selectedCorrections, index]);
    }
  };

  const handleApplySelected = () => {
    if (!analysis?.suggestedCorrections || selectedCorrections.length === 0) return;
    
    const correctionsToApply = selectedCorrections.map(index => analysis.suggestedCorrections[index]);
    applyCorrectionsMutation.mutate({ corrections: correctionsToApply });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Assistant IA
        </h2>
        <p className="text-muted-foreground">
          Analysez vos scripts notés négativement et obtenez des suggestions de corrections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analyse des Scripts Négatifs</CardTitle>
          <CardDescription>
            L'IA analyse vos scripts mal notés pour identifier les problèmes récurrents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isFetching}
            className="w-full"
          >
            {isAnalyzing || isFetching ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours...</>
            ) : (
              <><Search className="mr-2 h-4 w-4" /> Analyser mes scripts négatifs</>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Overall Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback Général</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.overallFeedback}</p>
            </CardContent>
          </Card>

          {/* Problems Identified */}
          {analysis.problems?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Problèmes Identifiés</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.problems.map((problem: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggested Corrections */}
          {analysis.suggestedCorrections?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Corrections Suggérées</CardTitle>
                    <CardDescription>
                      Sélectionnez les corrections à ajouter à votre carnet
                    </CardDescription>
                  </div>
                  {selectedCorrections.length > 0 && (
                    <Button onClick={handleApplySelected} disabled={applyCorrectionsMutation.isPending}>
                      {applyCorrectionsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Appliquer {selectedCorrections.length} correction(s)
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.suggestedCorrections.map((correction: any, index: number) => {
                    const category = CORRECTION_CATEGORIES.find(c => c.value === correction.category);
                    const isSelected = selectedCorrections.includes(index);
                    return (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleCorrection(index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={category?.color}>{category?.label}</Badge>
                            </div>
                            <p className="font-medium mb-1">Problème: {correction.problem}</p>
                            <p className="text-sm text-muted-foreground">Correction: {correction.correction}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.suggestedCorrections?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PartyPopper className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Aucune nouvelle correction suggérée !</p>
                <p className="text-muted-foreground text-center">
                  Vos corrections actuelles couvrent déjà les problèmes identifiés,
                  ou il n'y a pas assez de scripts négatifs pour l'analyse.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}


// ============ Versions Dialog Component ============

function VersionsDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: number | null;
  profileName?: string;
}) {
  const [showCompare, setShowCompare] = useState(false);
  const [compareId1, setCompareId1] = useState<number | null>(null);
  const [compareId2, setCompareId2] = useState<number | null>(null);

  const { data: versions, isLoading } = trpc.scriptStudio.getProfileVersions.useQuery(
    { profileId: profileId! },
    { enabled: !!profileId && open }
  );

  const { data: comparisonData } = trpc.scriptStudio.compareProfileVersions.useQuery(
    {
      profileId: profileId!,
      versionId1: compareId1!,
      versionId2: compareId2!,
    },
    { enabled: !!profileId && !!compareId1 && !!compareId2 && showCompare }
  );

  const restoreVersionMutation = trpc.scriptStudio.restoreProfileVersion.useMutation({
    onSuccess: () => {
      toast.success("Profil restauré avec succès !");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleFavoriteMutation = trpc.scriptStudio.toggleVersionFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(data.isFavorite ? "Version ajoutée aux favoris" : "Version retirée des favoris");
    },
  });

  const handleRestore = (versionId: number) => {
    if (!profileId) return;
    if (confirm("Êtes-vous sûr de vouloir restaurer cette version ? La version actuelle sera sauvegardée automatiquement.")) {
      restoreVersionMutation.mutate({ profileId, versionId });
    }
  };

  const handleCompare = (v1: number, v2: number) => {
    setCompareId1(v1);
    setCompareId2(v2);
    setShowCompare(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des versions - {profileName || "Profil"}
          </DialogTitle>
          <DialogDescription>
            Consultez l'historique des modifications et restaurez une version précédente si nécessaire
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : versions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune version sauvegardée</p>
            <p className="text-sm text-muted-foreground">
              Cliquez sur l'icône de sauvegarde pour créer une version
            </p>
          </div>
        ) : showCompare && comparisonData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Comparaison des versions</h3>
              <Button variant="outline" size="sm" onClick={() => setShowCompare(false)}>
                <X className="mr-2 h-4 w-4" />
                Fermer la comparaison
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Version {comparisonData.version1?.version} - {formatDate(comparisonData.version1?.createdAt!)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                    {comparisonData.version1?.content}
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Version {comparisonData.version2?.version} - {formatDate(comparisonData.version2?.createdAt!)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                    {comparisonData.version2?.content}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {versions?.map((version, index) => (
              <Card key={version.id} className={index === 0 ? "border-primary" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary">Plus récente</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      {version.changeDescription && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.changeDescription}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {version.content.length} caractères
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavoriteMutation.mutate({ versionId: version.id })}
                        title={version.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`h-4 w-4 ${version.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                      {index < (versions?.length || 0) - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompare(version.id, versions[index + 1].id)}
                        >
                          <GitCompare className="mr-2 h-4 w-4" />
                          Comparer
                        </Button>
                      )}
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoreVersionMutation.isPending}
                        >
                          {restoreVersionMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Restaurer
                        </Button>
                      )}
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="content" className="border-none">
                      <AccordionTrigger className="py-2 text-sm">
                        Voir le contenu
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                          {version.content}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


// ============ Branches Dialog Component ============

function BranchesDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
  branches,
  refetchBranches,
  createBranchMutation,
  updateBranchMutation,
  mergeBranchMutation,
  abandonBranchMutation,
  deleteBranchMutation,
  reactivateBranchMutation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: number | null;
  profileName?: string;
  branches: any[] | undefined;
  refetchBranches: () => void;
  createBranchMutation: any;
  updateBranchMutation: any;
  mergeBranchMutation: any;
  abandonBranchMutation: any;
  deleteBranchMutation: any;
  reactivateBranchMutation: any;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchDescription, setNewBranchDescription] = useState("");
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editMetaPrompt, setEditMetaPrompt] = useState("");

  const handleCreateBranch = () => {
    if (!profileId || !newBranchName.trim()) return;
    createBranchMutation.mutate({
      profileId,
      name: newBranchName,
      description: newBranchDescription || undefined,
    });
    setShowCreateDialog(false);
    setNewBranchName("");
    setNewBranchDescription("");
  };

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setEditMetaPrompt(branch.metaPrompt);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingBranch) return;
    updateBranchMutation.mutate({
      branchId: editingBranch.id,
      metaPrompt: editMetaPrompt,
    });
    setShowEditDialog(false);
    setEditingBranch(null);
  };

  const handleMerge = (branchId: number, branchName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir fusionner la branche "${branchName}" dans le profil principal ? Cette action est irréversible.`)) {
      mergeBranchMutation.mutate({ branchId });
    }
  };

  const handleAbandon = (branchId: number) => {
    abandonBranchMutation.mutate({ branchId });
  };

  const handleDelete = (branchId: number, branchName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la branche "${branchName}" ?`)) {
      deleteBranchMutation.mutate({ branchId });
    }
  };

  const handleReactivate = (branchId: number) => {
    reactivateBranchMutation.mutate({ branchId });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "merged":
        return <Badge className="bg-blue-500">Fusionnée</Badge>;
      case "abandoned":
        return <Badge className="bg-gray-500">Abandonnée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const activeBranches = branches?.filter(b => b.status === "active") || [];
  const mergedBranches = branches?.filter(b => b.status === "merged") || [];
  const abandonedBranches = branches?.filter(b => b.status === "abandoned") || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branches expérimentales - {profileName || "Profil"}
            </DialogTitle>
            <DialogDescription>
              Créez des variantes expérimentales de votre profil sans affecter l'original
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle branche
            </Button>
          </div>

          {/* Active Branches */}
          {activeBranches.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-green-500" />
                Branches actives ({activeBranches.length})
              </h3>
              {activeBranches.map((branch) => (
                <Card key={branch.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{branch.name}</span>
                          {getStatusBadge(branch.status)}
                        </div>
                        {branch.description && (
                          <p className="text-sm text-muted-foreground mb-2">{branch.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Créée le {formatDate(branch.createdAt)} • {branch.metaPrompt.length} caractères
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBranch(branch)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Éditer
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMerge(branch.id, branch.name)}
                          disabled={mergeBranchMutation.isPending}
                        >
                          <GitMerge className="mr-2 h-4 w-4" />
                          Fusionner
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAbandon(branch.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="content" className="border-none">
                        <AccordionTrigger className="py-2 text-sm">
                          Voir le méta-prompt
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                            {branch.metaPrompt}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Merged Branches */}
          {mergedBranches.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                <GitMerge className="h-4 w-4 text-blue-500" />
                Branches fusionnées ({mergedBranches.length})
              </h3>
              {mergedBranches.map((branch) => (
                <Card key={branch.id} className="opacity-75">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{branch.name}</span>
                          {getStatusBadge(branch.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fusionnée le {branch.mergedAt ? formatDate(branch.mergedAt) : "N/A"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(branch.id, branch.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Abandoned Branches */}
          {abandonedBranches.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                <Archive className="h-4 w-4 text-gray-500" />
                Branches abandonnées ({abandonedBranches.length})
              </h3>
              {abandonedBranches.map((branch) => (
                <Card key={branch.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{branch.name}</span>
                          {getStatusBadge(branch.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Créée le {formatDate(branch.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(branch.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Réactiver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(branch.id, branch.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {branches?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucune branche créée pour ce profil.
                <br />
                Créez une branche pour expérimenter sans affecter l'original.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Branch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle branche expérimentale</DialogTitle>
            <DialogDescription>
              Créez une copie du profil pour expérimenter des modifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la branche *</Label>
              <Input
                placeholder="Ex: Test ton plus formel"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Textarea
                placeholder="Ex: Tester un style plus académique pour les vidéos éducatives"
                value={newBranchDescription}
                onChange={(e) => setNewBranchDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim() || createBranchMutation.isPending}
            >
              {createBranchMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer la branche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la branche: {editingBranch?.name}</DialogTitle>
            <DialogDescription>
              Modifiez le méta-prompt de cette branche expérimentale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Méta-prompt</Label>
              <Textarea
                value={editMetaPrompt}
                onChange={(e) => setEditMetaPrompt(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateBranchMutation.isPending}
            >
              {updateBranchMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


// ============ Visual Diff Dialog Component ============

function DiffDialog({
  open,
  onOpenChange,
  profileId,
  versions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: number | null;
  versions: any[];
}) {
  const [selectedV1, setSelectedV1] = useState<number | null>(null);
  const [selectedV2, setSelectedV2] = useState<number | null>(null);

  const { data: diffData, isLoading } = trpc.scriptStudio.getVersionDiff.useQuery(
    {
      profileId: profileId!,
      versionId1: selectedV1!,
      versionId2: selectedV2!,
    },
    { enabled: !!profileId && !!selectedV1 && !!selectedV2 }
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Diff Visuel entre Versions
          </DialogTitle>
          <DialogDescription>
            Comparez deux versions pour voir les changements (vert = ajouté, rouge = supprimé)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Version 1 (ancienne)</Label>
            <Select 
              value={selectedV1?.toString() || ""} 
              onValueChange={(v) => setSelectedV1(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une version" />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    v{v.version} - {formatDate(v.createdAt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Version 2 (nouvelle)</Label>
            <Select 
              value={selectedV2?.toString() || ""} 
              onValueChange={(v) => setSelectedV2(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une version" />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    v{v.version} - {formatDate(v.createdAt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {diffData && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                +{diffData.stats.added} lignes ajoutées
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                -{diffData.stats.removed} lignes supprimées
              </Badge>
              <Badge variant="outline">
                {diffData.stats.unchanged} lignes inchangées
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 border-b font-mono text-xs">
                Diff
              </div>
              <div className="max-h-96 overflow-y-auto font-mono text-sm">
                {diffData.lines.map((line, index) => (
                  <div
                    key={index}
                    className={`px-4 py-1 ${
                      line.type === "added"
                        ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300"
                        : line.type === "removed"
                        ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-background"
                    }`}
                  >
                    <span className="inline-block w-6 text-muted-foreground mr-2">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.content || " "}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!diffData && selectedV1 && selectedV2 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Impossible de générer le diff</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
