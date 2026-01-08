import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, TrendingUp, Star, Download, Upload, Plus, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type PromptType = 'strategy' | 'title' | 'thumbnail' | 'description';

const promptTypeLabels: Record<PromptType, string> = {
  strategy: 'Stratégie',
  title: 'Titres',
  thumbnail: 'Miniatures',
  description: 'Descriptions',
};

export default function FavoritePrompts() {
  const [activeTab, setActiveTab] = useState<PromptType>('strategy');
  const [newCategory, setNewCategory] = useState("");
  const [editingCategories, setEditingCategories] = useState<number | null>(null);
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  
  const { data: prompts, isLoading, refetch } = trpc.openai.listFavoritePrompts.useQuery({
    promptType: activeTab,
  });

  const deleteMutation = trpc.openai.deleteFavoritePrompt.useMutation({
    onSuccess: () => {
      toast.success("Favori supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const rateMutation = trpc.openai.rateFavoritePrompt.useMutation({
    onSuccess: () => {
      toast.success("Note enregistrée");
      refetch();
    },
  });

  const updateCategoriesMutation = trpc.openai.updatePromptCategories.useMutation({
    onSuccess: () => {
      toast.success("Catégories mises à jour");
      setEditingCategories(null);
      refetch();
    },
  });

  const exportMutation = trpc.openai.exportFavoritePrompts.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.openai.importFavoritePrompts.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} prompts importés, ${data.skipped} ignorés`);
      refetch();
    },
  });

  const resetRatingsMutation = trpc.openai.resetRatings.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} notations réinitialisées`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleResetRatings = (type: 'strategy' | 'title' | 'thumbnail' | 'description' | 'all') => {
    const label = type === 'all' ? 'toutes les catégories' : promptTypeLabels[type as PromptType];
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser les notations pour ${label} ?`)) {
      resetRatingsMutation.mutate({ promptType: type });
    }
  };

  const handleDelete = (promptId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce favori ?")) {
      deleteMutation.mutate({ promptId });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Prompt copié dans le presse-papiers");
  };

  const handleRate = (promptId: number, rating: number) => {
    rateMutation.mutate({ promptId, rating });
  };

  const handleExport = async () => {
    const result = await exportMutation.refetch();
    if (result.data) {
      const dataStr = JSON.stringify(result.data.prompts, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `favorite-prompts-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Bibliothèque exportée");
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!Array.isArray(data)) {
          toast.error("Format de fichier invalide");
          return;
        }
        
        importMutation.mutate({ prompts: data, overwrite: false });
      } catch (error) {
        toast.error("Erreur lors de la lecture du fichier");
      }
    };
    input.click();
  };

  const startEditCategories = (promptId: number, categories: string | null) => {
    setEditingCategories(promptId);
    setTempCategories(categories ? JSON.parse(categories) : []);
    setNewCategory("");
  };

  const addCategory = () => {
    if (newCategory.trim() && !tempCategories.includes(newCategory.trim())) {
      setTempCategories([...tempCategories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setTempCategories(tempCategories.filter(c => c !== category));
  };

  const saveCategories = (promptId: number) => {
    updateCategoriesMutation.mutate({ promptId, categories: tempCategories });
  };

  const renderStars = (promptId: number, currentRating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(promptId, star)}
            className="hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prompts Favoris</h1>
            <p className="text-muted-foreground">
              Gérez vos prompts favoris pour les réutiliser facilement dans vos générations IA
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={handleImport} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button onClick={() => handleResetRatings('all')} variant="outline" className="text-orange-600 hover:text-orange-700">
              <Star className="w-4 h-4 mr-2" />
              Reset toutes les notes
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PromptType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strategy">Stratégie</TabsTrigger>
            <TabsTrigger value="title">Titres</TabsTrigger>
            <TabsTrigger value="thumbnail">Miniatures</TabsTrigger>
            <TabsTrigger value="description">Descriptions</TabsTrigger>
          </TabsList>

          {(['strategy', 'title', 'thumbnail', 'description'] as PromptType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : !prompts || prompts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucun prompt favori pour {promptTypeLabels[type].toLowerCase()}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {prompts.map((prompt: any) => {
                    const categories = prompt.categories ? JSON.parse(prompt.categories) : [];
                    const isEditing = editingCategories === prompt.id;
                    
                    return (
                      <Card key={prompt.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                  {promptTypeLabels[type]}
                                </CardTitle>
                                {renderStars(prompt.id, prompt.rating || 0)}
                              </div>
                              
                              <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                                <span className="flex items-center">
                                  <TrendingUp className="inline w-4 h-4 mr-1" />
                                  Utilisé {prompt.usageCount} fois
                                </span>
                                {prompt.lastUsedAt && (
                                  <span>
                                    Dernière utilisation: {new Date(prompt.lastUsedAt).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </CardDescription>

                              {/* Categories */}
                              <div className="space-y-2">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Nouvelle catégorie..."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                                        className="flex-1"
                                      />
                                      <Button onClick={addCategory} size="sm">
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {tempCategories.map((cat) => (
                                        <Badge key={cat} variant="secondary" className="gap-1">
                                          {cat}
                                          <button onClick={() => removeCategory(cat)}>
                                            <X className="w-3 h-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={() => saveCategories(prompt.id)} size="sm">
                                        Enregistrer
                                      </Button>
                                      <Button 
                                        onClick={() => setEditingCategories(null)} 
                                        size="sm" 
                                        variant="outline"
                                      >
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {categories.map((cat: string) => (
                                      <Badge key={cat} variant="secondary">
                                        {cat}
                                      </Badge>
                                    ))}
                                    <Button
                                      onClick={() => startEditCategories(prompt.id, prompt.categories)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs"
                                    >
                                      {categories.length > 0 ? 'Modifier' : 'Ajouter des catégories'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCopy(prompt.promptContent)}
                                size="sm"
                                variant="outline"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(prompt.id)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">{prompt.promptContent}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
