import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TestsActifs() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: allTests, isLoading } = trpc.abTests.listAll.useQuery();

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeTests = allTests?.filter((t: any) => t.status === "active") || [];

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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Play className="w-8 h-8 text-green-600" />
          Tests Actifs ({activeTests.length})
        </h1>
      </div>

      {activeTests.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>Aucun test actif pour le moment</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeTests.map((test: any) => (
            <Card
              key={test.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/video/${test.videoId}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-lg">{test.videoTitle || test.name}</p>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
