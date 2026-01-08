import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

interface CompleteTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: number;
  onSuccess?: () => void;
}

interface VariantDistribution {
  id: number;
  title: string;
  thumbnailUrl: string;
  percentage: number;
}

export default function CompleteTestDialog({
  open,
  onOpenChange,
  testId,
  onSuccess,
}: CompleteTestDialogProps) {
  const [distributions, setDistributions] = useState<VariantDistribution[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);

  const { data: test } = trpc.abTests.get.useQuery(
    { id: testId },
    { enabled: open }
  );

  const { data: variants = [] } = trpc.testVariants.listByTest.useQuery(
    { testId },
    { enabled: open }
  );

  const completeTestMutation = trpc.abTests.completeTest.useMutation({
    onSuccess: () => {
      toast.success("Test terminé avec succès !");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  // Initialize distributions when variants load
  useEffect(() => {
    if (variants.length > 0) {
      const initialDistributions = variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        percentage: v.watchTimePercentage || 0,
      }));
      setDistributions(initialDistributions);
      
      // Calculate initial total
      const total = initialDistributions.reduce((sum, d) => sum + d.percentage, 0);
      setTotalPercentage(total);
    }
  }, [variants]);

  const handlePercentageChange = (variantId: number, value: string) => {
    const percentage = parseFloat(value) || 0;
    
    setDistributions(prev => {
      const updated = prev.map(d => 
        d.id === variantId ? { ...d, percentage } : d
      );
      
      // Calculate new total
      const total = updated.reduce((sum, d) => sum + d.percentage, 0);
      setTotalPercentage(total);
      
      return updated;
    });
  };

  const handleComplete = () => {
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error("La somme des pourcentages doit être égale à 100%");
      return;
    }

    // Find the variant with the highest percentage
    const winner = distributions.reduce((max, d) => 
      d.percentage > max.percentage ? d : max
    );

    completeTestMutation.mutate({
      testId,
      distributions: distributions.map(d => ({
        variantId: d.id,
        watchTimePercentage: d.percentage,
      })),
      winnerId: winner.id,
    });
  };

  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Terminer le test A/B</DialogTitle>
          <DialogDescription>
            Saisissez la répartition de la durée de visionnage pour chaque variante.
            La somme doit être égale à 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {distributions.map((variant) => (
            <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <img
                src={variant.thumbnailUrl}
                alt={variant.title}
                className="w-24 h-14 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{variant.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`percentage-${variant.id}`} className="text-sm whitespace-nowrap">
                  Watch Time
                </Label>
                <Input
                  id={`percentage-${variant.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={variant.percentage}
                  onChange={(e) => handlePercentageChange(variant.id, e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}

          {/* Total percentage indicator */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          } border`}>
            <div className="flex items-center gap-2">
              {!isValid && <AlertCircle className="w-5 h-5 text-red-500" />}
              <span className="font-medium">
                Total : {totalPercentage.toFixed(1)}%
              </span>
            </div>
            {isValid ? (
              <span className="text-green-600 text-sm">✓ Valide</span>
            ) : (
              <span className="text-red-600 text-sm">
                {totalPercentage < 100 ? `Manque ${(100 - totalPercentage).toFixed(1)}%` : `Excédent de ${(totalPercentage - 100).toFixed(1)}%`}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!isValid || completeTestMutation.isPending}
          >
            {completeTestMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Terminer le test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
