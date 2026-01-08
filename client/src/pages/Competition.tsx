import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink, Eye, Calendar, Bookmark, BookmarkCheck, TrendingUp } from "lucide-react";

interface CompetitorVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  viewCountText: string;
  publishedTimeText: string;
  duration: string;
  thumbnailUrl: string;
  description: string;
}

interface SearchResult {
  keyword: string;
  variations: string[];
  videos: CompetitorVideo[];
}

export default function Competition() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());

  const searchMutation = trpc.competition.search.useMutation({
    onSuccess: (result) => {
      setSearchResult(result);
      setIsSearching(false);
      toast.success(`${result.videos.length} vidéos trouvées pour "${keyword}"`);
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const saveVideoMutation = trpc.competition.saveVideo.useMutation({
    onSuccess: () => {
      toast.success("Vidéo sauvegardée !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error("Veuillez entrer un mot-clé");
      return;
    }
    setIsSearching(true);
    setSearchResult(null);
    searchMutation.mutate({ keyword: keyword.trim() });
  };

  const handleSaveVideo = (video: CompetitorVideo) => {
    if (savedVideos.has(video.videoId)) {
      toast.info("Cette vidéo est déjà sauvegardée");
      return;
    }
    setSavedVideos(prev => new Set(Array.from(prev).concat(video.videoId)));
    saveVideoMutation.mutate({
      keyword: searchResult?.keyword || keyword,
      videoId: video.videoId,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      viewCount: video.viewCount,
      publishedAt: video.publishedTimeText,
      thumbnailUrl: video.thumbnailUrl,
      description: video.description,
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Étude de Concurrence</h1>
          <p className="text-muted-foreground mt-2">
            Analysez les vidéos qui performent sur YouTube pour un mot-clé donné.
            L'outil génère automatiquement des variations de recherche pour trouver les meilleures opportunités.
          </p>
        </div>

        {/* Recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              Rechercher un mot-clé
            </CardTitle>
            <CardDescription>
              Entrez un mot-clé ou une thématique pour découvrir les vidéos qui font des vues sur ce sujet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Ex: productivité, investissement, développement personnel..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        {searchResult && (
          <div className="space-y-4">
            {/* Variations de recherche */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Variations de recherche utilisées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchResult.variations.map((variation, index) => (
                    <Badge key={index} variant="secondary">
                      {variation}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Liste des vidéos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Vidéos performantes ({searchResult.videos.length})
                </CardTitle>
                <CardDescription>
                  Vidéos triées par nombre de vues. Sauvegardez celles qui vous inspirent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResult.videos.map((video, index) => (
                    <div
                      key={video.videoId}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <a
                        href={`https://youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-40 h-24 object-cover rounded-md"
                        />
                      </a>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold hover:text-primary line-clamp-2"
                            >
                              {video.title}
                            </a>
                            <p className="text-sm text-muted-foreground mt-1">
                              {video.channelTitle}
                            </p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            #{index + 1}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatViewCount(video.viewCount)} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {video.publishedTimeText}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {video.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveVideo(video)}
                          title="Sauvegarder cette vidéo"
                        >
                          {savedVideos.has(video.videoId) ? (
                            <BookmarkCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                        <a
                          href={`https://youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
