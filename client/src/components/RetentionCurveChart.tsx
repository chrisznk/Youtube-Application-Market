import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface RetentionPoint {
  elapsedVideoTimeRatio: number;
  audienceWatchRatio: number;
}

interface RetentionCurveChartProps {
  retentionCurve: RetentionPoint[] | null;
  videoDuration?: number;
}

export default function RetentionCurveChart({ retentionCurve, videoDuration }: RetentionCurveChartProps) {
  if (!retentionCurve || retentionCurve.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Courbe de Rétention</h3>
        <div className="text-center py-12 text-gray-500">
          <p>Aucune donnée de rétention disponible</p>
          <p className="text-sm mt-2">
            Connectez votre compte YouTube pour accéder aux statistiques de rétention
          </p>
        </div>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData = retentionCurve.map((point) => ({
    time: Math.round(point.elapsedVideoTimeRatio * 100),
    retention: Math.round(point.audienceWatchRatio * 100),
    timeLabel: `${Math.round(point.elapsedVideoTimeRatio * 100)}%`,
  }));

  // Find critical drop points (where retention drops more than 10%)
  const dropPoints: number[] = [];
  for (let i = 1; i < chartData.length; i++) {
    const drop = chartData[i - 1].retention - chartData[i].retention;
    if (drop > 10) {
      dropPoints.push(chartData[i].time);
    }
  }

  // Calculate average retention
  const avgRetention = chartData.reduce((sum, point) => sum + point.retention, 0) / chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.timeLabel} de la vidéo</p>
          <p className="text-sm text-gray-600">
            Rétention: <span className="font-medium text-blue-600">{data.retention}%</span>
          </p>
          {videoDuration && (
            <p className="text-xs text-gray-500 mt-1">
              ~{Math.round((data.time / 100) * videoDuration)}s
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Courbe de Rétention</h3>
        <div className="text-sm text-gray-600">
          Rétention moyenne: <span className="font-semibold text-blue-600">{Math.round(avgRetention)}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            label={{ value: "Progression de la vidéo (%)", position: "insideBottom", offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: "Rétention (%)", angle: -90, position: "insideLeft" }}
            stroke="#6b7280"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference line for average retention */}
          <ReferenceLine
            y={avgRetention}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            label={{ value: "Moyenne", position: "right", fill: "#3b82f6", fontSize: 12 }}
          />

          {/* Mark critical drop points */}
          {dropPoints.map((point, index) => (
            <ReferenceLine
              key={index}
              x={point}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "⚠", position: "top", fill: "#ef4444" }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="retention"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>

      {dropPoints.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>⚠ {dropPoints.length} chute(s) importante(s) détectée(s)</strong> - 
            Les spectateurs décrochent à ces moments clés
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-gray-600">Début</p>
          <p className="font-semibold text-lg">{chartData[0]?.retention || 0}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-gray-600">Milieu</p>
          <p className="font-semibold text-lg">
            {chartData[Math.floor(chartData.length / 2)]?.retention || 0}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-gray-600">Fin</p>
          <p className="font-semibold text-lg">
            {chartData[chartData.length - 1]?.retention || 0}%
          </p>
        </div>
      </div>
    </Card>
  );
}
