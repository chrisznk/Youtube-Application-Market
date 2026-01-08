import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { X, Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Variant {
  id: string;
  title: string;
  thumbnailTitle: string;
  thumbnailPrompt: string;
  isControl: boolean;
}

interface TestCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: number;
  onSuccess?: () => void;
}

export default function TestCreatorDialog({
  open,
  onOpenChange,
  videoId,
  onSuccess,
}: TestCreatorDialogProps) {

  const [testType, setTestType] = useState<"text" | "thumbnail" | "both">("both");
  const [variants, setVariants] = useState<Variant[]>([
    { id: "1", title: "", thumbnailTitle: "", thumbnailPrompt: "", isControl: true },
    { id: "2", title: "", thumbnailTitle: "", thumbnailPrompt: "", isControl: false },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const createTestMutation = trpc.abTests.create.useMutation();

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now().toString(),
        title: "",
        thumbnailTitle: "",
        thumbnailPrompt: "",
        isControl: false,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 2) {
      toast.error("Un test A/B doit avoir au moins 2 variantes");
      return;
    }
    setVariants(variants.filter((v) => v.id !== id));
  };



  const handleCreate = async () => {
    // Vérifier que toutes les variantes ont les champs requis
    for (const variant of variants) {
      if (testType === "text" || testType === "both") {
        if (!variant.title.trim()) {
          toast.error("Tous les titres doivent être remplis");
          return;
        }
      }
    }

    setIsCreating(true);

    try {
      // Préparer les variantes sans upload de fichiers
      const variantsData = variants.map((variant) => ({
        title: variant.title || "Sans titre",
        thumbnailTitle: variant.thumbnailTitle,
        thumbnailPrompt: variant.thumbnailPrompt,
        isControl: variant.isControl,
      }));

      // Créer le test avec toutes les variantes
      await createTestMutation.mutateAsync({
        videoId,
        name: `Test ${new Date().toLocaleDateString('fr-FR')}`,
        variantType: testType,
        variants: variantsData,
      });

      toast.success("Test A/B créé avec succès !");
      
      // Reset form
      setTestType("both");
      setVariants([
        { id: "1", title: "", thumbnailTitle: "", thumbnailPrompt: "", isControl: true },
        { id: "2", title: "", thumbnailTitle: "", thumbnailPrompt: "", isControl: false },
      ]);
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Erreur lors de la création du test");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un test A/B</DialogTitle>
          <DialogDescription>
            Créez un nouveau test pour comparer différentes variantes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type de test */}
          <div className="space-y-2">
            <Label>Type de test</Label>
            <RadioGroup value={testType} onValueChange={(value: any) => setTestType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="font-normal cursor-pointer">
                  Titres uniquement
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thumbnail" id="thumbnail" />
                <Label htmlFor="thumbnail" className="font-normal cursor-pointer">
                  Miniatures uniquement
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer">
                  Titres et Miniatures
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Variantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variantes ({variants.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariant}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une variante
              </Button>
            </div>

            {variants.map((variant, index) => (
              <Card key={variant.id} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Variante {index + 1}
                    {variant.isControl && (
                      <span className="ml-2 text-xs text-muted-foreground">(Contrôle)</span>
                    )}
                  </h4>
                  {variants.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariant(variant.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Titre */}
                {(testType === "text" || testType === "both") && (
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      placeholder="Entrez le titre de la variante"
                      value={variant.title}
                      onChange={(e) =>
                        setVariants(
                          variants.map((v) =>
                            v.id === variant.id ? { ...v, title: e.target.value } : v
                          )
                        )
                      }
                    />
                  </div>
                )}

                {/* Miniature */}
                {(testType === "thumbnail" || testType === "both") && (
                  <>
                    <div className="space-y-2">
                      <Label>Texte de Miniature (optionnel)</Label>
                      <Input
                        placeholder="Texte qui apparaîtra sur la miniature"
                        value={variant.thumbnailTitle}
                        onChange={(e) =>
                          setVariants(
                            variants.map((v) =>
                              v.id === variant.id ? { ...v, thumbnailTitle: e.target.value } : v
                            )
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prompt de génération (optionnel)</Label>
                      <Textarea
                        placeholder="Décrivez comment cette miniature a été créée (ex: prompt Midjourney, DALL-E...)"
                        value={variant.thumbnailPrompt}
                        onChange={(e) =>
                          setVariants(
                            variants.map((v) =>
                              v.id === variant.id ? { ...v, thumbnailPrompt: e.target.value } : v
                            )
                          )
                        }
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le test"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
