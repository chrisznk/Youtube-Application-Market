import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TestsTermines() {
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

  const completedTests = allTests
    ?.filter((t: any) => t.winnerId)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) || [];

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
          <Trophy className="w-8 h-8 text-yellow-600" />
          Tests Terminés avec Gagnant ({completedTests.length})
        </h1>
      </div>

      {completedTests.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>Aucun test terminé avec gagnant pour le moment</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedTests.map((test: any) => (
            <Card
              key={test.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-yellow-50"
              onClick={() => setLocation(`/video/${test.videoId}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-lg">{test.videoTitle || test.name}</p>
                  <p className="text-sm text-gray-600">
                    Terminé le {new Date(test.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge className="bg-yellow-500">
                  <Trophy className="w-3 h-3 mr-1" />
                  Gagnant déclaré
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
