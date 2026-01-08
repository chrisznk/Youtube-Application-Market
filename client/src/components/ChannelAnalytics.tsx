import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Eye, Clock, TrendingUp, Users, Globe, Monitor } from "lucide-react";

export function ChannelAnalytics() {
  // Calculer les dates (30 derniers jours)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const dateParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };

  const { data: overview, isLoading: overviewLoading } = trpc.channelAnalytics.getOverview.useQuery(dateParams);
  const { data: demographics, isLoading: demographicsLoading } = trpc.channelAnalytics.getDemographics.useQuery(dateParams);
  const { data: geography, isLoading: geographyLoading } = trpc.channelAnalytics.getGeography.useQuery(dateParams);
  const { data: traffic, isLoading: trafficLoading } = trpc.channelAnalytics.getTrafficSources.useQuery(dateParams);

  if (overviewLoading || demographicsLoading || geographyLoading || trafficLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques de la chaîne (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement des données d'audience...</p>
        </CardContent>
      </Card>
    );
  }

  const hasData = overview && (overview.views > 0 || overview.watchTimeMinutes > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques de la chaîne (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune donnée d'audience disponible. Les statistiques YouTube Analytics nécessitent une synchronisation complète.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Vue d'ensemble de la chaîne (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vues totales</p>
                <p className="text-2xl font-bold">{overview.views.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps de visionnage</p>
                <p className="text-2xl font-bold">
                  {Math.round(overview.watchTimeMinutes / 60).toLocaleString()}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {overview.watchTimeMinutes.toLocaleString()} min
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abonnés gagnés</p>
                <p className="text-2xl font-bold">
                  {overview.subscribersGained > 0 ? '+' : ''}{overview.subscribersGained.toLocaleString()}
                </p>
                {overview.subscribersLost > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {overview.subscribersLost} perdus
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Données démographiques */}
      {demographics && demographics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Données démographiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demographics.slice(0, 5).map((demo: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {demo.ageGroup} • {demo.gender === 'male' ? 'Hommes' : demo.gender === 'female' ? 'Femmes' : 'Autre'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                        style={{ width: `${Math.min(demo.viewsPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {demo.viewsPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Répartition géographique */}
      {geography && geography.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Répartition géographique (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geography.slice(0, 10).map((geo: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{geo.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                        style={{ width: `${Math.min(geo.viewsPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {geo.viewsPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources de trafic */}
      {traffic && traffic.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Sources de trafic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {traffic.slice(0, 8).map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{source.trafficSource}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full"
                        style={{ width: `${Math.min(source.viewsPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {source.viewsPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
