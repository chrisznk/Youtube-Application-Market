import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import ViewEvolutionChart from "@/components/ViewEvolutionChart";
import AlertsManager from "@/components/AlertsManager";
import PeriodComparison from "@/components/PeriodComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ThumbsUp,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

type TimePeriod = "latest" | "1h" | "2h" | "24h" | "48h" | "1week" | "2weeks" | "1month";
type SortField = "title" | "viewDelta" | "viewGrowthRate" | "likeDelta" | "likeGrowthRate" | "commentDelta" | "commentGrowthRate";
type SortDirection = "asc" | "desc";

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

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("fr-FR");
}

function formatGrowthRate(rate: number): string {
  const percentage = rate / 100;
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
}

function DeltaCell({ value }: { value: number }) {
  const isPositive = value >= 0;
  const displayValue = (isPositive ? "+" : "") + formatNumber(value);
  return (
    <span className={isPositive ? "text-green-600" : "text-red-600"}>
      {displayValue}
    </span>
  );
}

function GrowthRateCell({ rate }: { rate: number }) {
  const isPositive = rate >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
      <Icon className="h-3 w-3" />
      {formatGrowthRate(rate)}
    </span>
  );
}

function SortableHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  const Icon = isActive ? (currentDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => onSort(field)}
    >
      {label}
      <Icon className={`ml-2 h-4 w-4 ${isActive ? "opacity-100" : "opacity-50"}`} />
    </Button>
  );
}

export default function ViewTrends() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [sortField, setSortField] = useState<SortField>("viewDelta");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const utils = trpc.useUtils();

  const { data: allStats, isLoading } = trpc.viewTracking.getAllStats.useQuery(
    { period },
    { enabled: !!user, refetchOnWindowFocus: false }
  );

  const { data: hasRecorded } = trpc.viewTracking.hasRecordedToday.useQuery(
    undefined,
    { enabled: !!user }
  );

  const recordStatsMutation = trpc.viewTracking.recordStats.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.recorded} stats enregistrées`);
        utils.viewTracking.getAllStats.invalidate();
        utils.viewTracking.hasRecordedToday.invalidate();
      } else {
        toast.info(result.message);
      }
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedStats = useMemo(() => {
    if (!allStats) return [];
    return [...allStats].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "viewDelta":
          aValue = a.viewDelta;
          bValue = b.viewDelta;
          break;
        case "viewGrowthRate":
          aValue = a.viewGrowthRate;
          bValue = b.viewGrowthRate;
          break;
        case "likeDelta":
          aValue = a.likeDelta;
          bValue = b.likeDelta;
          break;
        case "likeGrowthRate":
          aValue = a.likeGrowthRate;
          bValue = b.likeGrowthRate;
          break;
        case "commentDelta":
          aValue = a.commentDelta;
          bValue = b.commentDelta;
          break;
        case "commentGrowthRate":
          aValue = a.commentGrowthRate;
          bValue = b.commentGrowthRate;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  }, [allStats, sortField, sortDirection]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Analyse des Vues</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
            <TabsTrigger value="charts">Évolution</TabsTrigger>
            <TabsTrigger value="compare">Comparaison</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="flex items-center justify-end gap-2">
              <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(periodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!hasRecorded && (
                <Button variant="outline" onClick={() => recordStatsMutation.mutate()} disabled={recordStatsMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${recordStatsMutation.isPending ? "animate-spin" : ""}`} />
                  Enregistrer
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Statistiques détaillées - {periodLabels[period]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      Les statistiques seront collectées automatiquement toutes les heures.
                    </p>
                    {!hasRecorded && (
                      <Button onClick={() => recordStatsMutation.mutate()} disabled={recordStatsMutation.isPending}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${recordStatsMutation.isPending ? "animate-spin" : ""}`} />
                        Enregistrer maintenant
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            <SortableHeader label="Vidéo" field="title" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <SortableHeader label="Vues" field="viewDelta" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                            </div>
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="% Vues" field="viewGrowthRate" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              <SortableHeader label="Likes" field="likeDelta" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                            </div>
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="% Likes" field="likeGrowthRate" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <SortableHeader label="Comm." field="commentDelta" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                            </div>
                          </TableHead>
                          <TableHead>
                            <SortableHeader label="% Comm." field="commentGrowthRate" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedStats.map((video) => (
                          <TableRow key={video.videoId}>
                            <TableCell>
                              <Link href={`/video/${video.videoId}`}>
                                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                                  <div className="w-16 h-9 rounded overflow-hidden flex-shrink-0 bg-muted">
                                    {video.thumbnailUrl ? (
                                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Eye className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-medium truncate max-w-[200px]">{video.title}</span>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell><DeltaCell value={video.viewDelta} /></TableCell>
                            <TableCell><GrowthRateCell rate={video.viewGrowthRate} /></TableCell>
                            <TableCell><DeltaCell value={video.likeDelta} /></TableCell>
                            <TableCell><GrowthRateCell rate={video.likeGrowthRate} /></TableCell>
                            <TableCell><DeltaCell value={video.commentDelta} /></TableCell>
                            <TableCell><GrowthRateCell rate={video.commentGrowthRate} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <ViewEvolutionChart />
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-6">
            <PeriodComparison />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <AlertsManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
