import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface ViewEvolutionChartProps {
  videoId?: number;
  className?: string;
}

const periodOptions = [
  { value: "24", label: "24 heures" },
  { value: "48", label: "48 heures" },
  { value: "168", label: "1 semaine" },
  { value: "336", label: "2 semaines" },
  { value: "720", label: "1 mois" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ViewEvolutionChart({ videoId, className }: ViewEvolutionChartProps) {
  const [hours, setHours] = useState("168");
  const [metric, setMetric] = useState<"views" | "likes" | "comments">("views");

  // Fetch data based on whether we're showing a single video or all videos
  const { data: videoHistory, isLoading: videoLoading } = trpc.viewTracking.getVideoHistory.useQuery(
    { videoId: videoId!, hours: parseInt(hours) },
    { enabled: !!videoId }
  );

  const { data: aggregatedHistory, isLoading: aggregatedLoading } = trpc.viewTracking.getAggregatedHistory.useQuery(
    { hours: parseInt(hours) },
    { enabled: !videoId }
  );

  const isLoading = videoId ? videoLoading : aggregatedLoading;
  const rawData = videoId ? videoHistory : aggregatedHistory;

  // Transform data for the chart
  const chartData = rawData?.map((point) => ({
    timestamp: formatDate(point.timestamp),
    rawTimestamp: new Date(point.timestamp).getTime(),
    views: videoId ? (point as any).viewCount : (point as any).totalViews,
    likes: videoId ? (point as any).likeCount : (point as any).totalLikes,
    comments: videoId ? (point as any).commentCount : (point as any).totalComments,
  })) || [];

  // Calculate min/max for better Y axis
  const values = chartData.map((d) => d[metric]);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 100);
  const padding = (maxValue - minValue) * 0.1;

  const metricConfig = {
    views: { color: "#3b82f6", label: "Vues", icon: Eye },
    likes: { color: "#22c55e", label: "Likes", icon: ThumbsUp },
    comments: { color: "#f59e0b", label: "Commentaires", icon: MessageSquare },
  };

  const MetricIcon = metricConfig[metric].icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Évolution {videoId ? "de la vidéo" : "globale"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as typeof metric)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="views" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Vues
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Commentaires
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <MetricIcon className="h-12 w-12 mb-2 opacity-50" />
            <p>Pas assez de données pour afficher le graphique</p>
            <p className="text-sm">Les données seront collectées automatiquement toutes les heures</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConfig[metric].color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metricConfig[metric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
                domain={[minValue - padding, maxValue + padding]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatNumber(value), metricConfig[metric].label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={metricConfig[metric].color}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Début</p>
              <p className="font-semibold">{formatNumber(chartData[0]?.[metric] || 0)}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Fin</p>
              <p className="font-semibold">{formatNumber(chartData[chartData.length - 1]?.[metric] || 0)}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Variation</p>
              <p className={`font-semibold ${
                (chartData[chartData.length - 1]?.[metric] || 0) - (chartData[0]?.[metric] || 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}>
                {formatNumber((chartData[chartData.length - 1]?.[metric] || 0) - (chartData[0]?.[metric] || 0))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ViewEvolutionChart;
