import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { useState } from "react";

interface TestVariant {
  id: number;
  variantName: string;
  variantType: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  isControl: boolean;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  views?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  avgWatchTime?: number | null;
  engagement?: number | null;
  distributionPercent?: number | null;
}

interface TestGraphProps {
  variants: TestVariant[];
  testName: string;
}

type MetricType = "ctr" | "views" | "engagement" | "watchTime";

export default function TestGraph({ variants, testName }: TestGraphProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("ctr");

  if (!variants || variants.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Graphiques de Performance</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Aucune variante disponible pour afficher les graphiques</p>
        </div>
      </Card>
    );
  }

  // Prepare data for charts
  const chartData = variants.map((variant) => ({
    name: variant.variantName,
    ctr: variant.ctr ? parseFloat((variant.ctr * 100).toFixed(2)) : 0,
    views: variant.views || 0,
    engagement: variant.engagement ? parseFloat((variant.engagement * 100).toFixed(2)) : 0,
    watchTime: variant.avgWatchTime || 0,
    likes: variant.likeCount || 0,
    comments: variant.commentCount || 0,
    isControl: variant.isControl,
  }));

  const metrics = [
    { key: "ctr" as MetricType, label: "CTR (%)", color: "#3b82f6" },
    { key: "views" as MetricType, label: "Vues", color: "#10b981" },
    { key: "engagement" as MetricType, label: "Engagement (%)", color: "#f59e0b" },
    { key: "watchTime" as MetricType, label: "Watch Time (min)", color: "#8b5cf6" },
  ];

  const currentMetric = metrics.find((m) => m.key === selectedMetric)!;

  // Find best performing variant
  const bestVariant = chartData.reduce((best, current) => {
    return current[selectedMetric] > best[selectedMetric] ? current : best;
  }, chartData[0]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-semibold mb-2">
            {data.name}
            {data.isControl && <Badge className="ml-2" variant="outline">Contrôle</Badge>}
          </p>
          <div className="space-y-1 text-sm">
            <p>CTR: <span className="font-medium">{data.ctr}%</span></p>
            <p>Vues: <span className="font-medium">{data.views.toLocaleString()}</span></p>
            <p>Engagement: <span className="font-medium">{data.engagement}%</span></p>
            <p>Watch Time: <span className="font-medium">{data.watchTime} min</span></p>
            <p>Likes: <span className="font-medium">{data.likes}</span></p>
            <p>Commentaires: <span className="font-medium">{data.comments}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Graphiques de Performance - {testName}</h3>
        <div className="flex gap-2">
          {metrics.map((metric) => (
            <Button
              key={metric.key}
              size="sm"
              variant={selectedMetric === metric.key ? "default" : "outline"}
              onClick={() => setSelectedMetric(metric.key)}
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey={selectedMetric}
            fill={currentMetric.color}
            name={currentMetric.label}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Winner Badge */}
      {bestVariant && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800 font-medium">
                🏆 Meilleure performance ({currentMetric.label})
              </p>
              <p className="text-lg font-bold text-green-900 mt-1">
                {bestVariant.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {bestVariant[selectedMetric]}
                {selectedMetric === "ctr" || selectedMetric === "engagement" ? "%" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-semibold">Variante</th>
              <th className="text-right p-3 font-semibold">CTR</th>
              <th className="text-right p-3 font-semibold">Vues</th>
              <th className="text-right p-3 font-semibold">Engagement</th>
              <th className="text-right p-3 font-semibold">Watch Time</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((variant, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {variant.name}
                    {variant.isControl && <Badge variant="outline" className="text-xs">Contrôle</Badge>}
                  </div>
                </td>
                <td className="text-right p-3 font-medium">{variant.ctr}%</td>
                <td className="text-right p-3 font-medium">{variant.views.toLocaleString()}</td>
                <td className="text-right p-3 font-medium">{variant.engagement}%</td>
                <td className="text-right p-3 font-medium">{variant.watchTime} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Conseil:</strong> Comparez les différentes métriques pour identifier la variante 
          la plus performante. Un bon CTR ne garantit pas toujours un meilleur engagement ou watch time.
        </p>
      </div>
    </Card>
  );
}
