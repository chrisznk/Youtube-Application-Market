import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type TimePeriod = "latest" | "1h" | "2h" | "24h" | "48h" | "1week" | "2weeks" | "1month";

const periodLabels: Record<TimePeriod, string> = {
  "latest": "Dernière actualisation",
  "1h": "1 heure",
  "2h": "2 heures",
  "24h": "24 heures",
  "48h": "48 heures",
  "1week": "1 semaine",
  "2weeks": "2 semaines",
  "1month": "1 mois",
};

interface VideoTrendStats {
  videoId: number;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  currentViews: number;
  currentLikes: number;
  currentComments: number;
  currentPeriodViews: number;
  currentPeriodLikes: number;
  currentPeriodComments: number;
  previousPeriodViews: number;
  previousPeriodLikes: number;
  previousPeriodComments: number;
  viewDelta: number;
  likeDelta: number;
  commentDelta: number;
  viewGrowthRate: number;
  likeGrowthRate: number;
  commentGrowthRate: number;
  currentPeriodStart: string | null;
  previousPeriodStart: string | null;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString("fr-FR");
}

function formatGrowthRate(rate: number): string {
  const percentage = rate / 100;
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
}

function VideoCard({
  video,
  metric,
}: {
  video: VideoTrendStats;
  metric: "views" | "growth";
}) {
  // For "views", show currentPeriodViews (vues gagnées pendant la période actuelle)
  // For "growth", show viewDelta (différence avec la période précédente)
  const displayValue = metric === "views" ? video.currentPeriodViews : video.viewDelta;
  const isPositive = displayValue >= 0;

  return (
    <Link href={`/video/${video.videoId}`}>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="w-16 h-9 rounded overflow-hidden flex-shrink-0 bg-muted">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{video.title}</p>
          <p
            className={`text-xs ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {metric === "views"
              ? `+${formatNumber(video.currentPeriodViews)} vues`
              : formatGrowthRate(video.viewGrowthRate)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({
  title,
  icon: Icon,
  iconColor,
  videos,
  metric,
  isLoading,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  videos: VideoTrendStats[];
  metric: "views" | "growth";
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-16 h-9 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée disponible
          </p>
        ) : (
          <div className="space-y-1">
            {videos.map((video) => (
              <VideoCard key={video.videoId} video={video} metric={metric} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ViewTrendsDashboard() {
  const [period, setPeriod] = useState<TimePeriod>("24h");
  const utils = trpc.useUtils();

  const { data: topVideos, isLoading, refetch: refetchTopVideos } = trpc.viewTracking.getTopVideos.useQuery(
    { period, limit: 5 },
    { refetchOnWindowFocus: false }
  );

  const { data: lastSnapshotTime, refetch: refetchLastSnapshot } = trpc.viewTracking.getLastSnapshotTime.useQuery();

  const recordStatsMutation = trpc.viewTracking.recordStats.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.recorded} stats enregistrées`);
        utils.viewTracking.getTopVideos.invalidate();
        utils.viewTracking.getLastSnapshotTime.invalidate();
        utils.viewTracking.getAllStats.invalidate();
      }
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Format the last snapshot time
  const formatLastSnapshot = (date: Date | string | null) => {
    if (!date) return "Jamais";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Évolution des Vues</h2>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as TimePeriod)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Dernière MAJ: {formatLastSnapshot(lastSnapshotTime)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recordStatsMutation.mutate()}
              disabled={recordStatsMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${
                  recordStatsMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Actualiser
            </Button>
          </div>
          <Link href="/view-trends">
            <Button variant="outline" size="sm">
              Voir plus
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CategoryCard
          title="Haut Score"
          icon={Eye}
          iconColor="text-blue-500"
          videos={topVideos?.topViewers || []}
          metric="views"
          isLoading={isLoading}
        />
        <CategoryCard
          title="Croissance"
          icon={TrendingUp}
          iconColor="text-green-500"
          videos={topVideos?.topGrowing || []}
          metric="growth"
          isLoading={isLoading}
        />
        <CategoryCard
          title="Décroissance"
          icon={TrendingDown}
          iconColor="text-red-500"
          videos={topVideos?.topDeclining || []}
          metric="growth"
          isLoading={isLoading}
        />
        <CategoryCard
          title="Bas Score"
          icon={EyeOff}
          iconColor="text-gray-500"
          videos={topVideos?.lowestViewers || []}
          metric="views"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default ViewTrendsDashboard;
