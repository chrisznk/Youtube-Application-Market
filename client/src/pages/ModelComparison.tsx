import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp, Zap, Star, Crown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ModelCategoryStats {
  model: string;
  totalGenerations: number;
  avgRating: number;
  ratedCount: number;
  // Notes par catégorie
  titleRating: number;
  titleRatedCount: number;
  thumbnailRating: number;
  thumbnailRatedCount: number;
  descriptionRating: number;
  descriptionRatedCount: number;
}

export default function ModelComparison() {
  const { data: stats, isLoading, refetch } = trpc.openai.getAiGenerationStats.useQuery();

  const resetRatingsMutation = trpc.openai.resetGenerationRatings.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} notations réinitialisées`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleResetRatings = (type: 'title' | 'thumbnail' | 'description' | 'strategy' | 'all') => {
    const labels: Record<string, string> = {
      title: 'Titres',
      thumbnail: 'Miniatures',
      description: 'Descriptions/Tags',
      strategy: 'Stratégies',
      all: 'toutes les catégories',
    };
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser les notations pour ${labels[type]} ?`)) {
      resetRatingsMutation.mutate({ generationType: type });
    }
  };

  // Group stats by model with category-specific ratings
  const modelStats = stats?.reduce((acc, stat) => {
    const model = stat.model;
    if (!acc[model]) {
      acc[model] = {
        model,
        totalGenerations: 0,
        avgRating: 0,
        ratedCount: 0,
        titleRating: 0,
        titleRatedCount: 0,
        thumbnailRating: 0,
        thumbnailRatedCount: 0,
        descriptionRating: 0,
        descriptionRatedCount: 0,
      };
    }
    
    acc[model].totalGenerations += Number(stat.totalGenerations);
    
    const rating = Number(stat.avgUserRating || 0);
    const ratedCount = Number(stat.ratedCount || 0);
    
    // Aggregate overall rating
    if (ratedCount > 0) {
      acc[model].avgRating += rating * ratedCount;
      acc[model].ratedCount += ratedCount;
    }
    
    // Category-specific ratings based on generationType
    const genType = stat.generationType?.toLowerCase() || '';
    
    if (genType.includes('title') || genType.includes('titre')) {
      if (ratedCount > 0) {
        acc[model].titleRating += rating * ratedCount;
        acc[model].titleRatedCount += ratedCount;
      }
    }
    
    if (genType.includes('thumbnail') || genType.includes('miniature')) {
      if (ratedCount > 0) {
        acc[model].thumbnailRating += rating * ratedCount;
        acc[model].thumbnailRatedCount += ratedCount;
      }
    }
    
    if (genType.includes('description') || genType.includes('tag')) {
      if (ratedCount > 0) {
        acc[model].descriptionRating += rating * ratedCount;
        acc[model].descriptionRatedCount += ratedCount;
      }
    }
    
    return acc;
  }, {} as Record<string, ModelCategoryStats>);

  // Calculate final averages
  const modelStatsArray = Object.values(modelStats || {}).map((stat) => {
    return {
      ...stat,
      avgRating: stat.ratedCount > 0 ? stat.avgRating / stat.ratedCount : 0,
      titleRating: stat.titleRatedCount > 0 ? stat.titleRating / stat.titleRatedCount : 0,
      thumbnailRating: stat.thumbnailRatedCount > 0 ? stat.thumbnailRating / stat.thumbnailRatedCount : 0,
      descriptionRating: stat.descriptionRatedCount > 0 ? stat.descriptionRating / stat.descriptionRatedCount : 0,
    };
  });

  // Sort by average rating (best first), then by total generations
  modelStatsArray.sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.totalGenerations - a.totalGenerations;
  });

  // Find best model for each category
  const bestOverall = modelStatsArray.find(s => s.ratedCount > 0)?.model || null;
  const bestTitle = [...modelStatsArray].sort((a, b) => b.titleRating - a.titleRating).find(s => s.titleRatedCount > 0)?.model || null;
  const bestThumbnail = [...modelStatsArray].sort((a, b) => b.thumbnailRating - a.thumbnailRating).find(s => s.thumbnailRatedCount > 0)?.model || null;
  const bestDescription = [...modelStatsArray].sort((a, b) => b.descriptionRating - a.descriptionRating).find(s => s.descriptionRatedCount > 0)?.model || null;

  const getModelBadgeColor = (model: string) => {
    if (model.includes('gpt-5')) return 'bg-purple-500';
    if (model.includes('o1')) return 'bg-blue-500';
    if (model.includes('gpt-4o-mini')) return 'bg-green-500';
    if (model.includes('gpt-4o')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const renderRating = (rating: number, count: number, isBest: boolean = false) => {
    if (count === 0) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <div className="flex items-center gap-1">
        {isBest && <Crown className="w-3 h-3 text-yellow-500" />}
        <span className={`font-medium ${isBest ? 'text-yellow-600' : ''}`}>
          {rating.toFixed(1)}
        </span>
        <Star className={`w-3 h-3 ${isBest ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500'}`} />
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comparaison des Modèles IA</h1>
            <p className="text-muted-foreground mt-2">
              Analysez les performances de chaque modèle pour optimiser vos choix
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => handleResetRatings('title')} variant="outline" size="sm">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Titres
            </Button>
            <Button onClick={() => handleResetRatings('thumbnail')} variant="outline" size="sm">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Miniatures
            </Button>
            <Button onClick={() => handleResetRatings('description')} variant="outline" size="sm">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Desc/Tags
            </Button>
            <Button onClick={() => handleResetRatings('all')} variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Tout
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : modelStatsArray.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée disponible pour le moment.</p>
                <p className="text-sm mt-2">
                  Commencez à utiliser les fonctionnalités de génération IA pour voir les statistiques.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Générations</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {modelStatsArray.reduce((sum, stat) => sum + stat.totalGenerations, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meilleur pour Titres</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {bestTitle ? (
                      <Badge className={`${getModelBadgeColor(bestTitle)} text-white`}>
                        {bestTitle.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Pas encore noté</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meilleur pour Miniatures</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {bestThumbnail ? (
                      <Badge className={`${getModelBadgeColor(bestThumbnail)} text-white`}>
                        {bestThumbnail.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Pas encore noté</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meilleur pour Desc/Tags</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {bestDescription ? (
                      <Badge className={`${getModelBadgeColor(bestDescription)} text-white`}>
                        {bestDescription.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Pas encore noté</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Comparaison Détaillée</CardTitle>
                <CardDescription>
                  Notes moyennes par catégorie pour chaque modèle IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modèle</TableHead>
                      <TableHead className="text-right">Générations</TableHead>
                      <TableHead className="text-right">Note Globale</TableHead>
                      <TableHead className="text-right">Titres</TableHead>
                      <TableHead className="text-right">Miniatures</TableHead>
                      <TableHead className="text-right">Desc/Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelStatsArray.map((stat, index) => (
                      <TableRow key={stat.model} className={index === 0 && stat.ratedCount > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && stat.ratedCount > 0 && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            <Badge className={`${getModelBadgeColor(stat.model)} text-white`}>
                              {stat.model.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">{stat.totalGenerations}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {renderRating(stat.avgRating, stat.ratedCount, stat.model === bestOverall)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderRating(stat.titleRating, stat.titleRatedCount, stat.model === bestTitle)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderRating(stat.thumbnailRating, stat.thumbnailRatedCount, stat.model === bestThumbnail)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderRating(stat.descriptionRating, stat.descriptionRatedCount, stat.model === bestDescription)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span>Meilleur modèle pour cette catégorie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>Note moyenne (nombre de notes)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
