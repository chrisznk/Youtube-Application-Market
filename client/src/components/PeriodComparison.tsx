import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, ArrowRight, TrendingUp, TrendingDown, Minus, Loader2, Search } from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatGrowthRate(rate: number): string {
  const percentage = rate / 100;
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
}

function getGrowthIcon(delta: number) {
  if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (delta < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getGrowthColor(delta: number): string {
  if (delta > 0) return "text-green-500";
  if (delta < 0) return "text-red-500";
  return "text-muted-foreground";
}

// Helper to get default dates
function getDefaultDates() {
  const now = new Date();
  
  // Period 2: This week (last 7 days)
  const period2End = new Date(now);
  const period2Start = new Date(now);
  period2Start.setDate(period2Start.getDate() - 7);
  
  // Period 1: Previous week (7-14 days ago)
  const period1End = new Date(period2Start);
  const period1Start = new Date(period1End);
  period1Start.setDate(period1Start.getDate() - 7);
  
  return {
    period1Start: period1Start.toISOString().slice(0, 16),
    period1End: period1End.toISOString().slice(0, 16),
    period2Start: period2Start.toISOString().slice(0, 16),
    period2End: period2End.toISOString().slice(0, 16),
  };
}

export function PeriodComparison() {
  const defaults = getDefaultDates();
  const [period1Start, setPeriod1Start] = useState(defaults.period1Start);
  const [period1End, setPeriod1End] = useState(defaults.period1End);
  const [period2Start, setPeriod2Start] = useState(defaults.period2Start);
  const [period2End, setPeriod2End] = useState(defaults.period2End);
  const [sortBy, setSortBy] = useState<"viewDelta" | "viewGrowthRate" | "period2Views">("viewDelta");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, refetch, isFetching } = trpc.viewTracking.comparePeriods.useQuery(
    {
      period1Start,
      period1End,
      period2Start,
      period2End,
    },
    { enabled: false } // Don't auto-fetch, wait for user to click
  );

  const handleCompare = () => {
    refetch();
  };

  // Sort data
  const sortedData = data
    ? [...data].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      })
    : [];

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Calculate totals
  const totals = sortedData.reduce(
    (acc, video) => ({
      period1Views: acc.period1Views + video.period1Views,
      period2Views: acc.period2Views + video.period2Views,
      viewDelta: acc.viewDelta + video.viewDelta,
    }),
    { period1Views: 0, period2Views: 0, viewDelta: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Period selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Comparaison de périodes
          </CardTitle>
          <CardDescription>
            Comparez les performances de vos vidéos entre deux périodes personnalisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period 1 */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge variant="outline">Période 1</Badge>
                Période de référence
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p1-start">Début</Label>
                  <Input
                    id="p1-start"
                    type="datetime-local"
                    value={period1Start}
                    onChange={(e) => setPeriod1Start(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p1-end">Fin</Label>
                  <Input
                    id="p1-end"
                    type="datetime-local"
                    value={period1End}
                    onChange={(e) => setPeriod1End(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Period 2 */}
            <div className="space-y-4 p-4 rounded-lg border bg-primary/5">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge>Période 2</Badge>
                Période à comparer
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p2-start">Début</Label>
                  <Input
                    id="p2-start"
                    type="datetime-local"
                    value={period2Start}
                    onChange={(e) => setPeriod2Start(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2-end">Fin</Label>
                  <Input
                    id="p2-end"
                    type="datetime-local"
                    value={period2End}
                    onChange={(e) => setPeriod2End(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleCompare} disabled={isLoading || isFetching} size="lg">
              {(isLoading || isFetching) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Comparer les périodes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de la comparaison</CardTitle>
            <CardDescription>
              {sortedData.length} vidéo(s) analysée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Période 1</p>
                <p className="text-2xl font-bold">{formatNumber(totals.period1Views)}</p>
                <p className="text-xs text-muted-foreground">vues totales</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">Période 2</p>
                <p className="text-2xl font-bold">{formatNumber(totals.period2Views)}</p>
                <p className="text-xs text-muted-foreground">vues totales</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Différence</p>
                <p className={`text-2xl font-bold ${getGrowthColor(totals.viewDelta)}`}>
                  {totals.viewDelta >= 0 ? "+" : ""}{formatNumber(totals.viewDelta)}
                </p>
                <p className="text-xs text-muted-foreground">vues</p>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Vidéo</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("period2Views")}
                    >
                      Période 1 → Période 2
                      {sortBy === "period2Views" && (sortOrder === "desc" ? " ↓" : " ↑")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("viewDelta")}
                    >
                      Différence
                      {sortBy === "viewDelta" && (sortOrder === "desc" ? " ↓" : " ↑")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("viewGrowthRate")}
                    >
                      Variation
                      {sortBy === "viewGrowthRate" && (sortOrder === "desc" ? " ↓" : " ↑")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((video) => (
                    <TableRow key={video.videoId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {video.thumbnailUrl && (
                            <img
                              src={video.thumbnailUrl}
                              alt=""
                              className="w-16 h-9 object-cover rounded"
                            />
                          )}
                          <span className="font-medium line-clamp-2">{video.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{formatNumber(video.period1Views)}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatNumber(video.period2Views)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(video.viewDelta)}
                          <span className={getGrowthColor(video.viewDelta)}>
                            {video.viewDelta >= 0 ? "+" : ""}{formatNumber(video.viewDelta)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={video.viewDelta > 0 ? "default" : video.viewDelta < 0 ? "destructive" : "secondary"}
                        >
                          {formatGrowthRate(video.viewGrowthRate)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PeriodComparison;
