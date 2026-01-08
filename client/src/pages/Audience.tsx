import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Globe, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF6B6B"];

export default function Audience() {
  const params = useParams();
  const videoId = parseInt(params.id || "0");

  const { data: video, isLoading: videoLoading } = trpc.videos.get.useQuery({ id: videoId });
  const { data: analytics, isLoading: analyticsLoading } = trpc.audience.getAnalytics.useQuery({ videoId });
  const { data: trafficSources, isLoading: trafficLoading } = trpc.audience.getTrafficSources.useQuery({ videoId });
  const { data: demographics, isLoading: demoLoading } = trpc.audience.getDemographics.useQuery({ videoId });
  const { data: geography, isLoading: geoLoading } = trpc.audience.getGeography.useQuery({ videoId });

  if (videoLoading || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{video.title}</h1>
        <p className="text-muted-foreground mt-2">Données d'audience et analytics avancées</p>
      </div>

      {/* Watch Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de visionnage total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : analytics ? (
              <>
                <div className="text-2xl font-bold">{formatDuration(analytics.watchTime || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Durée moyenne: {formatDuration(analytics.averageViewDuration || 0)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pourcentage de visionnage moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : analytics ? (
              <>
                <div className="text-2xl font-bold">{analytics.averageViewPercentage}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  De la durée totale de la vidéo
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(video.viewCount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {video.likeCount || 0} likes • {video.commentCount || 0} commentaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources de trafic</CardTitle>
          <CardDescription>D'où viennent vos spectateurs</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : trafficSources && trafficSources.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    dataKey="percentage"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.source}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {trafficSources.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {trafficSources.map((source: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatNumber(source.views)} vues</p>
                      <p className="text-xs text-muted-foreground">{source.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée de trafic disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Données démographiques</CardTitle>
          <CardDescription>Âge et genre de votre audience</CardDescription>
        </CardHeader>
        <CardContent>
          {demoLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : demographics && demographics.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={demographics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis label={{ value: "% des vues", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="viewsPercentage" name="Pourcentage de vues" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée démographique disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Geography */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition géographique</CardTitle>
          <CardDescription>Top 20 des pays</CardDescription>
        </CardHeader>
        <CardContent>
          {geoLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : geography && geography.length > 0 ? (
            <div className="space-y-2">
              {geography.map((country: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatNumber(country.views)} vues</p>
                    <p className="text-xs text-muted-foreground">
                      {country.percentage.toFixed(1)}% • {formatDuration(country.watchTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée géographique disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
