import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Play, Pause, CheckCircle, Trash2, Eye, ThumbsUp, MessageSquare, Sparkles, Users, ChevronDown, ChevronUp, Tag, Edit, Save, X, Upload } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import TitleThumbnailOptimizationDialog from "@/components/TitleThumbnailOptimizationDialog";
import DescriptionOptimizationDialog from "@/components/DescriptionOptimizationDialog";
import RetentionCurveChart from "@/components/RetentionCurveChart";
import TestDetailsDialog from "@/components/TestDetailsDialog";
import TestCreatorDialog from "@/components/TestCreatorDialog";
import CompleteTestDialog from "@/components/CompleteTestDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Composant pour afficher les variantes d'un test
function TestVariantsList({ testId }: { testId: number }) {
  const { data: variants, isLoading } = trpc.testVariants.listByTest.useQuery({ testId });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Chargement des variantes...</p>;
  }

  if (!variants || variants.length === 0) {
    return <p className="text-sm text-gray-500">Aucune variante pour le moment</p>;
  }

  return (
    <div className="space-y-2">
      {variants.map((variant) => (
        <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{variant.title}</span>
              {variant.isControl && <Badge variant="outline">Contrôle</Badge>}
            </div>
            {variant.title && (
              <p className="text-sm text-gray-600 mt-1">Titre: {variant.title}</p>
            )}
            {variant.thumbnailTitle && (
              <p className="text-sm text-gray-600">Texte miniature: {variant.thumbnailTitle}</p>
            )}
            {variant.watchTimePercentage !== null && (
              <p className="text-sm text-gray-600">Watch time: {variant.watchTimePercentage}%</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VideoDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/video/:id");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const videoId = params?.id ? parseInt(params.id) : 0;

  const { data: video, isLoading: videoLoading } = trpc.videos.get.useQuery(
    { id: videoId },
    { enabled: !!user && videoId > 0 }
  );

  const testsQuery = trpc.abTests.listByVideo.useQuery(
    { videoId },
    { enabled: !!user && videoId > 0 }
  );
  const { data: tests, isLoading: testsLoading } = testsQuery;

  const [showCreateTestDialog, setShowCreateTestDialog] = useState(false);
  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const [showTitleThumbnailOptimizationDialog, setShowTitleThumbnailOptimizationDialog] = useState(false);
  const [showDescriptionOptimizationDialog, setShowDescriptionOptimizationDialog] = useState(false);
  const [showTestDetailsDialog, setShowTestDetailsDialog] = useState(false);
  const [showCompleteTestDialog, setShowCompleteTestDialog] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [showFullTags, setShowFullTags] = useState(false);
  
  // États d'édition
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");

  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
  });

  const [newVariant, setNewVariant] = useState({
    variantType: "title" as "title" | "thumbnail" | "both",
    title: "",
    thumbnailTitle: "",
    isControl: false,
  });

  const createTestMutation = trpc.abTests.create.useMutation({
    onSuccess: () => {
      utils.abTests.listByVideo.invalidate({ videoId });
      toast.success("Test A/B créé avec succès !");
      setShowCreateTestDialog(false);
      setNewTest({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const updateTestStatusMutation = trpc.abTests.updateStatus.useMutation({
    onSuccess: () => {
      utils.abTests.listByVideo.invalidate({ videoId });
      toast.success("Statut du test mis à jour");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deleteTestMutation = trpc.abTests.delete.useMutation({
    onSuccess: () => {
      utils.abTests.listByVideo.invalidate({ videoId });
      toast.success("Test supprimé");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const createVariantMutation = trpc.testVariants.create.useMutation({
    onSuccess: () => {
      utils.abTests.listByVideo.invalidate({ videoId });
      toast.success("Variante créée avec succès !");
      setShowAddVariantDialog(false);
      setNewVariant({ variantType: "title", title: "", thumbnailTitle: "", isControl: false });
      setSelectedTestId(null);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const updateVideoMutation = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.videos.get.invalidate({ id: videoId });
      toast.success("Édition enregistrée avec succès !");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setIsEditingTags(false);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  if (authLoading || videoLoading || testsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vidéo non trouvée</h2>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleEditTitle = () => {
    setEditedTitle(video.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim()) {
      toast.error("Le titre ne peut pas être vide");
      return;
    }
    updateVideoMutation.mutate({ id: videoId, title: editedTitle });
  };

  const handleCancelTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleEditDescription = () => {
    setEditedDescription(video.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    updateVideoMutation.mutate({ id: videoId, description: editedDescription });
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleEditTags = () => {
    // Convertir le JSON en liste séparée par des virgules
    const tagsArray = video.tags ? JSON.parse(video.tags) : [];
    setEditedTags(tagsArray.join(", "));
    setIsEditingTags(true);
  };

  const handleSaveTags = () => {
    // Convertir la liste séparée par des virgules en JSON
    const tagsArray = editedTags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    const tagsJson = JSON.stringify(tagsArray);
    updateVideoMutation.mutate({ id: videoId, tags: tagsJson });
  };

  const handleCancelTags = () => {
    setIsEditingTags(false);
    setEditedTags("");
  };

  const handleEditTranscript = () => {
    setIsEditingTranscript(true);
    setEditedTranscript(video?.transcript || "");
  };

  const handleSaveTranscript = () => {
    if (!video) return;
    updateVideoMutation.mutate({ id: videoId, transcript: editedTranscript });
    setIsEditingTranscript(false);
  };

  const handleCancelTranscript = () => {
    setIsEditingTranscript(false);
    setEditedTranscript("");
  };

  const handleCreateTest = () => {
    if (!newTest.name) {
      toast.error("Veuillez entrer un nom pour le test");
      return;
    }
    createTestMutation.mutate({
      videoId,
      name: newTest.name,
      description: newTest.description,
    });
  };

  const handleCreateVariant = () => {
    if (!selectedTestId) return;
    
    if (newVariant.variantType === "title" && !newVariant.title) {
      toast.error("Veuillez entrer un titre");
      return;
    }
    if (newVariant.variantType === "both" && !newVariant.title) {
      toast.error("Veuillez entrer un titre");
      return;
    }

    createVariantMutation.mutate({
      testId: selectedTestId,
      name: `Variante ${Date.now()}`,
      title: newVariant.title || "Sans titre",
      thumbnailTitle: newVariant.thumbnailTitle || undefined,
      isControl: newVariant.isControl,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">En pause</Badge>;
      case "completed":
        return <Badge className="bg-gray-500">Terminé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Titre de la vidéo"
                  />
                  <Button size="sm" onClick={handleSaveTitle} disabled={updateVideoMutation.isPending}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelTitle}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
                  <Button size="sm" variant="ghost" onClick={handleEditTitle}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-gray-600">ID YouTube: {video.youtubeId}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Info */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Eye className="h-4 w-4" />
                    Vues
                  </span>
                  <span className="font-semibold">{(video.viewCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <ThumbsUp className="h-4 w-4" />
                    J'aime
                  </span>
                  <span className="font-semibold">{(video.likeCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    Commentaires
                  </span>
                  <span className="font-semibold">{(video.commentCount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Description */}
              {(video.description || isEditingDescription) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Description</h3>
                    {!isEditingDescription && (
                      <Button size="sm" variant="ghost" onClick={handleEditDescription}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={6}
                        placeholder="Description de la vidéo"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription} disabled={updateVideoMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelDescription}>
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className={showFullDescription ? "" : "line-clamp-3"}>
                        {video.description}
                      </p>
                      {video.description && video.description.length > 150 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center gap-1"
                        >
                          {showFullDescription ? (
                            <>
                              Voir moins <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Voir plus <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {(video.tags || isEditingTags) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h3>
                    {!isEditingTags && (
                      <Button size="sm" variant="ghost" onClick={handleEditTags}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isEditingTags ? (
                    <div className="space-y-2">
                      <Input
                        value={editedTags}
                        onChange={(e) => setEditedTags(e.target.value)}
                        placeholder="Tags séparés par des virgules"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveTags} disabled={updateVideoMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelTags}>
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {(showFullTags ? (video.tags || '').split(',') : (video.tags || '').split(',').slice(0, 5)).map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                      {(video.tags || '').split(',').length > 5 && (
                        <button
                          onClick={() => setShowFullTags(!showFullTags)}
                          className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center gap-1"
                        >
                          {showFullTags ? (
                            <>
                              Voir moins <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Voir plus ({(video.tags || '').split(',').length - 5} tags) <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Transcription */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Transcription</h3>
                  {!isEditingTranscript && (
                    <Button size="sm" variant="ghost" onClick={handleEditTranscript}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditingTranscript ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      rows={10}
                      placeholder="Saisissez la transcription de la vidéo..."
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTranscript} disabled={updateVideoMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelTranscript}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {video.transcript ? (
                      <>
                        <p className={showFullTranscript ? "whitespace-pre-wrap" : "line-clamp-4"}>
                          {video.transcript}
                        </p>
                        {video.transcript.length > 200 && (
                          <button
                            onClick={() => setShowFullTranscript(!showFullTranscript)}
                            className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center gap-1"
                          >
                            {showFullTranscript ? (
                              <>
                                Voir moins <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Voir plus <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">Aucune transcription disponible. Cliquez sur le bouton Éditer pour en ajouter une.</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Tests A/B */}
          <div className="lg:col-span-2 space-y-6">
            {/* Retention Curve */}
            <RetentionCurveChart 
              retentionCurve={video.retentionCurve ? JSON.parse(video.retentionCurve as any) : null}
              videoDuration={video.duration ? parseInt(video.duration) : undefined}
            />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Tests A/B</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = `/audience/${video.id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Audience
                </Button>
                <Button variant="outline" onClick={() => setShowTitleThumbnailOptimizationDialog(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimiser Titres & Miniatures avec IA
                </Button>
                <Button variant="outline" onClick={() => setShowDescriptionOptimizationDialog(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimiser Description & Tags avec IA
                </Button>
                <Button onClick={() => setShowCreateTestDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un test
                </Button>
              </div>
            </div>

            {tests && tests.length === 0 ? (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun test A/B</h3>
                <p className="text-gray-600 mb-6">Créez votre premier test pour comparer différentes variantes</p>
                <Button onClick={() => setShowCreateTestDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un test
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {tests?.map((test) => (
                  <Card key={test.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 
                            className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedTestId(test.id);
                              setShowTestDetailsDialog(true);
                            }}
                          >
                            {test.name}
                          </h3>
                          {getStatusBadge(test.status)}
                        </div>
                        {test.description && (
                          <p className="text-sm text-gray-600">{test.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {test.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestStatusMutation.mutate({ id: test.id, status: "paused" })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === "paused" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestStatusMutation.mutate({ id: test.id, status: "active" })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTestId(test.id);
                              setShowCompleteTestDialog(true);
                            }}
                            title="Terminer le test"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTestId(test.id);
                              setShowCompleteTestDialog(true);
                            }}
                            title="Modifier les résultats"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTestMutation.mutate({ id: test.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Variantes</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setShowAddVariantDialog(true);
                          }}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Ajouter une variante
                        </Button>
                      </div>
                      <TestVariantsList testId={test.id} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Test Dialog */}
      <TestCreatorDialog
        open={showCreateTestDialog}
        onOpenChange={setShowCreateTestDialog}
        videoId={videoId}
        onSuccess={() => {
          testsQuery.refetch();
        }}
      />

      {/* Add Variant Dialog */}
      <Dialog open={showAddVariantDialog} onOpenChange={setShowAddVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une variante</DialogTitle>
            <DialogDescription>Créez une nouvelle variante pour ce test</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variantType">Type de variante</Label>
              <select
                id="variantType"
                className="w-full px-3 py-2 border rounded-md"
                value={newVariant.variantType}
                onChange={(e) => setNewVariant({ ...newVariant, variantType: e.target.value as any })}
              >
                <option value="title">Titre uniquement</option>
                <option value="thumbnail">Miniature uniquement</option>
                <option value="both">Titre et miniature</option>
              </select>
            </div>
            {(newVariant.variantType === "title" || newVariant.variantType === "both") && (
              <div>
                <Label htmlFor="variantTitle">Titre</Label>
                <Input
                  id="variantTitle"
                  placeholder="Nouveau titre"
                  value={newVariant.title}
                  onChange={(e) => setNewVariant({ ...newVariant, title: e.target.value })}
                />
              </div>
            )}
            {(newVariant.variantType === "thumbnail" || newVariant.variantType === "both") && (
              <div>
                <Label htmlFor="thumbnailTitle">Texte de Miniature (optionnel)</Label>
                <Input
                  id="thumbnailTitle"
                  placeholder="Texte qui apparaîtra sur la miniature"
                  value={newVariant.thumbnailTitle}
                  onChange={(e) => setNewVariant({ ...newVariant, thumbnailTitle: e.target.value })}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isControl"
                checked={newVariant.isControl}
                onChange={(e) => setNewVariant({ ...newVariant, isControl: e.target.checked })}
              />
              <Label htmlFor="isControl">Variante de contrôle</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariantDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateVariant} disabled={createVariantMutation.isPending}>
              {createVariantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Title & Thumbnail Optimization Dialog */}
      <TitleThumbnailOptimizationDialog
        open={showTitleThumbnailOptimizationDialog}
        onOpenChange={setShowTitleThumbnailOptimizationDialog}
        videoId={videoId}
        videoTitle={video?.title || ""}
        transcript={video?.transcript || null}
      />

      {/* Description Optimization Dialog */}
      <DescriptionOptimizationDialog
        open={showDescriptionOptimizationDialog}
        onOpenChange={setShowDescriptionOptimizationDialog}
        videoId={videoId}
        videoTitle={video?.title || ""}
        transcript={video?.transcript || null}
        tags={video?.tags || ""}
      />

      {/* Test Details Dialog */}
      {selectedTestId && (
        <TestDetailsDialog
          open={showTestDetailsDialog}
          onOpenChange={setShowTestDetailsDialog}
          testId={selectedTestId}
          onSuccess={() => {
            utils.abTests.listByVideo.invalidate({ videoId });
            utils.videos.get.invalidate({ id: videoId });
          }}
        />
      )}

      {/* Complete Test Dialog */}
      {selectedTestId && (
        <CompleteTestDialog
          open={showCompleteTestDialog}
          onOpenChange={setShowCompleteTestDialog}
          testId={selectedTestId}
          onSuccess={() => {
            utils.abTests.listByVideo.invalidate({ videoId });
            utils.videos.get.invalidate({ id: videoId });
          }}
        />
      )}
    </div>
  );
}
