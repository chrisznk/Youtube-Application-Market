import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Search, 
  TrendingUp, 
  Twitter, 
  MessageCircle, 
  Video, 
  Newspaper, 
  Globe,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ThumbsUp,
  Eye,
  MessageSquare,
  Share2,
  Hash,
  Sparkles
} from "lucide-react";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommandé)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Rapide)" },
  { value: "o1", label: "o1 (Raisonnement avancé)" },
  { value: "o1-mini", label: "o1 Mini" },
];

const SOURCES = [
  { id: "google_trends", label: "Google Trends", icon: Globe, color: "bg-blue-500" },
  { id: "news", label: "Actualités", icon: Newspaper, color: "bg-red-500" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "bg-sky-500" },
  { id: "reddit", label: "Reddit", icon: MessageCircle, color: "bg-orange-500" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "bg-pink-500" },
] as const;

type SourceId = typeof SOURCES[number]["id"];

interface TrendItem {
  source: string;
  title: string;
  description?: string;
  url?: string;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    score?: number;
  };
  hashtags?: string[];
  publishedAt?: string;
  author?: string;
  thumbnail?: string;
}

interface TrendSearchResult {
  source: string;
  trends: TrendItem[];
  error?: string;
}

export default function TrendsExplorer() {
  const [keyword, setKeyword] = useState("");
  const [selectedSources, setSelectedSources] = useState<SourceId[]>(["google_trends", "news"]);
  const [model, setModel] = useState<"gpt-4o" | "gpt-4o-mini" | "o1" | "o1-mini">("gpt-4o");
  const [results, setResults] = useState<TrendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedTrends, setSavedTrends] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("all");

  const searchMutation = trpc.trends.searchAll.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsSearching(false);
      const totalTrends = data.reduce((acc, r) => acc + r.trends.length, 0);
      toast.success(`${totalTrends} tendances trouvées !`);
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const saveIdeaMutation = trpc.savedIdeas.save.useMutation({
    onSuccess: () => {
      toast.success("Tendance sauvegardée !");
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
    if (selectedSources.length === 0) {
      toast.error("Veuillez sélectionner au moins une source");
      return;
    }
    setIsSearching(true);
    setResults([]);
    searchMutation.mutate({
      keyword: keyword.trim(),
      sources: selectedSources,
      model,
    });
  };

  const toggleSource = (sourceId: SourceId) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSaveTrend = (trend: TrendItem, index: number) => {
    const key = `${trend.source}-${index}`;
    if (savedTrends.has(key)) {
      toast.info("Cette tendance est déjà sauvegardée");
      return;
    }
    setSavedTrends(prev => new Set(Array.from(prev).concat(key)));
    saveIdeaMutation.mutate({
      ideaType: "video_idea",
      title: trend.title,
      summary: trend.description || "",
      source: "brainstorm_preprod",
      model,
    });
  };

  const getSourceIcon = (source: string) => {
    const sourceConfig = SOURCES.find(s => s.id === source);
    if (!sourceConfig) return Globe;
    return sourceConfig.icon;
  };

  const getSourceColor = (source: string) => {
    const sourceConfig = SOURCES.find(s => s.id === source);
    return sourceConfig?.color || "bg-gray-500";
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const allTrends = results.flatMap(r => r.trends);
  const filteredTrends = activeTab === "all" 
    ? allTrends 
    : results.find(r => r.source === activeTab)?.trends || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Explorateur de Tendances</h1>
            <p className="text-muted-foreground">
              Découvrez les sujets populaires sur Google, Twitter, Reddit, TikTok et les actualités
            </p>
          </div>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher des tendances
            </CardTitle>
            <CardDescription>
              Entrez un mot-clé et sélectionnez les sources pour découvrir les sujets populaires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Keyword Input */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Mot-clé</label>
                <Input
                  placeholder="Ex: intelligence artificielle, crypto, santé..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Modèle IA</label>
                <Select value={model} onValueChange={(v) => setModel(v as typeof model)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sources Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Sources de données</label>
              <div className="flex flex-wrap gap-3">
                {SOURCES.map((source) => {
                  const Icon = source.icon;
                  const isSelected = selectedSources.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? `${source.color} text-white border-transparent` 
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{source.label}</span>
                      {isSelected && <Checkbox checked className="h-4 w-4 border-white data-[state=checked]:bg-white data-[state=checked]:text-current" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !keyword.trim() || selectedSources.length === 0}
              size="lg"
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Rechercher les tendances
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résultats ({allTrends.length} tendances)</span>
                <div className="flex gap-2">
                  {results.map(r => (
                    <Badge 
                      key={r.source} 
                      variant={r.error ? "destructive" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {(() => {
                        const Icon = getSourceIcon(r.source);
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {r.trends.length}
                    </Badge>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    Tout ({allTrends.length})
                  </TabsTrigger>
                  {results.map(r => {
                    const Icon = getSourceIcon(r.source);
                    return (
                      <TabsTrigger key={r.source} value={r.source} className="flex items-center gap-1">
                        <Icon className="h-4 w-4" />
                        {r.trends.length}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <div className="grid gap-4">
                  {filteredTrends.map((trend, index) => {
                    const Icon = getSourceIcon(trend.source);
                    const key = `${trend.source}-${index}`;
                    const isSaved = savedTrends.has(key);
                    
                    return (
                      <Card key={key} className="relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSourceColor(trend.source)}`} />
                        <CardContent className="pt-4 pl-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Icon className="h-3 w-3" />
                                  {trend.source === "google_trends" ? "Google" : 
                                   trend.source === "news" ? "Actualités" :
                                   trend.source.charAt(0).toUpperCase() + trend.source.slice(1)}
                                </Badge>
                                {trend.author && (
                                  <span className="text-sm text-muted-foreground">
                                    par {trend.author}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-lg">{trend.title}</h3>
                              
                              {trend.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {trend.description}
                                </p>
                              )}
                              
                              {/* Engagement metrics */}
                              {trend.engagement && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {trend.engagement.views !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-4 w-4" />
                                      {formatNumber(trend.engagement.views)}
                                    </span>
                                  )}
                                  {trend.engagement.likes !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp className="h-4 w-4" />
                                      {formatNumber(trend.engagement.likes)}
                                    </span>
                                  )}
                                  {trend.engagement.comments !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-4 w-4" />
                                      {formatNumber(trend.engagement.comments)}
                                    </span>
                                  )}
                                  {trend.engagement.shares !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Share2 className="h-4 w-4" />
                                      {formatNumber(trend.engagement.shares)}
                                    </span>
                                  )}
                                  {trend.engagement.score !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="h-4 w-4" />
                                      Score: {trend.engagement.score}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Hashtags */}
                              {trend.hashtags && trend.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {trend.hashtags.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      <Hash className="h-3 w-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant={isSaved ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handleSaveTrend(trend, index)}
                                disabled={isSaved}
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="h-4 w-4" />
                                ) : (
                                  <Bookmark className="h-4 w-4" />
                                )}
                              </Button>
                              {trend.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(trend.url, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isSearching && results.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Découvrez les tendances</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Entrez un mot-clé et sélectionnez vos sources préférées pour découvrir 
                les sujets populaires et trouver des idées de vidéos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
