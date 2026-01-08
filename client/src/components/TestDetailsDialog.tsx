import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Trophy, Edit, Save, X, FileDown, FileText } from "lucide-react";
import TestGraph from "@/components/TestGraph";

interface TestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: number;
  onSuccess?: () => void;
}

interface VariantMetrics {
  id: number;
  title: string;
  thumbnailUrl: string;
  impressions: number;
  clicks: number;
  ctr: number;
  trafficShare: number; // Pourcentage de répartition
  isControl: boolean;
}

export default function TestDetailsDialog({
  open,
  onOpenChange,
  testId,
  onSuccess,
}: TestDetailsDialogProps) {
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editedMetrics, setEditedMetrics] = useState<Partial<VariantMetrics>>({});

  const { data: test, isLoading, refetch } = trpc.abTests.get.useQuery(
    { id: testId },
    { enabled: open }
  );

  const { data: variants = [] } = trpc.testVariants.listByTest.useQuery(
    { testId },
    { enabled: open }
  );

  const declareWinnerMutation = trpc.abTests.declareWinner.useMutation({
    onSuccess: () => {
      toast.success("Gagnant déclaré avec succès !");
      refetch();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const updateVariantMutation = trpc.testVariants.updateMetrics.useMutation({
    onSuccess: () => {
      toast.success("M\u00e9triques mises \u00e0 jour !");
      setEditingVariantId(null);
      setEditedMetrics({});
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const exportPDFMutation = trpc.abTests.exportPDF.useMutation({
    onSuccess: (data) => {
      // Decode base64 and trigger download
      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Rapport PDF t\u00e9l\u00e9charg\u00e9 !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const exportCSVMutation = trpc.abTests.exportCSV.useMutation({
    onSuccess: (data) => {
      // Decode base64 and trigger download
      const blob = new Blob([atob(data.csv)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Donn\u00e9es CSV t\u00e9l\u00e9charg\u00e9es !");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleExportPDF = () => {
    exportPDFMutation.mutate({ testId });
  };

  const handleExportCSV = () => {
    exportCSVMutation.mutate({ testId });
  };

  const handleDeclareWinner = (variantId: number) => {
    if (confirm("\u00cates-vous s\u00fbr de vouloir d\u00e9clarer cette variante comme gagnante ?")) {
      declareWinnerMutation.mutate({ testId, winnerId: variantId });
    }
  };

  const handleEditMetrics = (variant: any) => {
    setEditingVariantId(variant.id);
    setEditedMetrics({
      impressions: variant.impressions || 0,
      clicks: variant.clicks || 0,
      ctr: variant.ctr || 0,
      trafficShare: variant.trafficShare || 0,
    });
  };

  const handleSaveMetrics = () => {
    if (!editingVariantId) return;

    updateVariantMutation.mutate({
      variantId: editingVariantId,
      impressions: editedMetrics.impressions,
      clicks: editedMetrics.clicks,
      ctr: editedMetrics.ctr,
      trafficShare: editedMetrics.trafficShare,
    });
  };

  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!test) {
    return null;
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{test.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportPDFMutation.isPending}
              >
                {exportPDFMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                disabled={exportCSVMutation.isPending}
              >
                {exportCSVMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Export CSV
              </Button>
              {getStatusBadge(test.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du test */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type :</span>{" "}
              <span className="capitalize">{test.type}</span>
            </div>
            <div>
              <span className="font-medium">Créé le :</span>{" "}
              {new Date(test.createdAt).toLocaleDateString()}
            </div>
          </div>

          {test.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
            </div>
          )}

          {/* Graphiques de performance */}
          {variants.length > 0 && (
            <TestGraph 
              variants={variants.map((v: any) => ({
                ...v,
                variantName: v.title,
                variantType: v.variantType || 'title'
              }))}
              testName={test.name} 
            />
          )}

          {/* Variantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Variantes ({variants.length})</h3>
              {test.winnerId && (
                <Badge className="bg-yellow-500">
                  <Trophy className="w-3 h-3 mr-1" />
                  Gagnant déclaré
                </Badge>
              )}
            </div>

            {variants.map((variant: any) => {
              const isEditing = editingVariantId === variant.id;
              const isWinner = test.winnerId === variant.id;

              return (
                <Card key={variant.id} className={`p-4 ${isWinner ? "border-yellow-500 border-2" : ""}`}>
                  <div className="space-y-3">
                    {/* En-tête de la variante */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{variant.title}</h4>
                          {variant.isControl && (
                            <Badge variant="outline">Contrôle</Badge>
                          )}
                          {isWinner && (
                            <Badge className="bg-yellow-500">
                              <Trophy className="w-3 h-3 mr-1" />
                              Gagnant
                            </Badge>
                          )}
                        </div>
                        {variant.thumbnailUrl && (
                          <img
                            src={variant.thumbnailUrl}
                            alt={variant.title}
                            className="mt-2 w-48 h-27 object-cover rounded"
                          />
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!isEditing && !isWinner && test.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMetrics(variant)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleDeclareWinner(variant.id)}
                              disabled={declareWinnerMutation.isPending}
                            >
                              <Trophy className="w-4 h-4 mr-1" />
                              Déclarer gagnant
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Métriques */}
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
                        <div className="space-y-2">
                          <Label htmlFor={`impressions-${variant.id}`}>Impressions</Label>
                          <Input
                            id={`impressions-${variant.id}`}
                            type="number"
                            value={editedMetrics.impressions || 0}
                            onChange={(e) =>
                              setEditedMetrics({
                                ...editedMetrics,
                                impressions: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`clicks-${variant.id}`}>Clics</Label>
                          <Input
                            id={`clicks-${variant.id}`}
                            type="number"
                            value={editedMetrics.clicks || 0}
                            onChange={(e) =>
                              setEditedMetrics({
                                ...editedMetrics,
                                clicks: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`trafficShare-${variant.id}`}>
                            Répartition du trafic (%)
                          </Label>
                          <Input
                            id={`trafficShare-${variant.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={editedMetrics.trafficShare || 0}
                            onChange={(e) =>
                              setEditedMetrics({
                                ...editedMetrics,
                                trafficShare: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveMetrics}
                            disabled={updateVariantMutation.isPending}
                          >
                            {updateVariantMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingVariantId(null);
                              setEditedMetrics({});
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Impressions</div>
                          <div className="font-medium">{variant.impressions?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clics</div>
                          <div className="font-medium">{variant.clicks?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CTR</div>
                          <div className="font-medium">
                            {calculateCTR(variant.impressions || 0, variant.clicks || 0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Trafic</div>
                          <div className="font-medium">{variant.trafficShare || 0}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
