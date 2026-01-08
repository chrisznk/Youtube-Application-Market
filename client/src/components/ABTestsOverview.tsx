import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Trophy, Play, Pause, CheckCircle, ChevronRight, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ABTestsOverview() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<string>("all");
  
  // Fetch all tests for the user
  const { data: allTests, isLoading } = trpc.abTests.listAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!allTests || allTests.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <p>Aucun test A/B créé pour le moment</p>
        <p className="text-sm mt-2">Créez votre premier test depuis la page d'une vidéo</p>
      </Card>
    );
  }

  // Filter tests by period
  const filterByPeriod = (tests: any[]) => {
    if (period === "all") return tests;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return tests;
    }
    
    return tests.filter((t: any) => new Date(t.createdAt) >= startDate);
  };

  const filteredTests = filterByPeriod(allTests);
  const activeTests = filteredTests.filter((t: any) => t.status === "active");
  const completedTests = filteredTests.filter((t: any) => t.status === "completed");
  const pausedTests = filteredTests.filter((t: any) => t.status === "paused");

  const recentWinners = allTests
    .filter((t: any) => t.winnerId)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="w-4 h-4 text-green-600" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Actif", className: "bg-green-500" },
      paused: { label: "En pause", className: "bg-yellow-500" },
      completed: { label: "Terminé", className: "bg-blue-500" },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Vue d'ensemble des Tests A/B</h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold">{filteredTests.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tests Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeTests.length}</p>
            </div>
            <Play className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tests Terminés</p>
              <p className="text-2xl font-bold text-blue-600">{completedTests.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tests Lancés</p>
              <p className="text-2xl font-bold text-purple-600">
                {activeTests.length + pausedTests.length}
              </p>
            </div>
            <Play className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Active Tests */}
      {activeTests.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            Tests Actifs ({activeTests.length})
          </h3>
          <div className="space-y-3">
            {activeTests.slice(0, 5).map((test: any) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setLocation(`/video/${test.videoId}`)}
              >
                <div className="flex-1">
                  <p className="font-medium">{test.videoTitle || test.name}</p>
                  <p className="text-sm text-gray-600">
                    Créé le {new Date(test.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {test.type}
                  </Badge>
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
          {activeTests.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setLocation("/tests-actifs")}
                className="w-full"
              >
                Afficher plus
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Recent Winners */}
      {recentWinners.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Variantes Gagnantes Récentes
          </h3>
          <div className="space-y-3">
            {recentWinners.map((test: any) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                onClick={() => setLocation(`/video/${test.videoId}`)}
              >
                <div className="flex-1">
                  <p className="font-medium">{test.videoTitle || test.name}</p>
                  <p className="text-sm text-gray-600">
                    Terminé le {new Date(test.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge className="bg-yellow-500">
                  <Trophy className="w-3 h-3 mr-1" />
                  Gagnant déclaré
                </Badge>
              </div>
            ))}
          </div>
          {recentWinners.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setLocation("/tests-termines")}
                className="w-full"
              >
                Afficher plus
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}


    </div>
  );
}
