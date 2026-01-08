import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FavoritePromptSelectorProps {
  promptType: 'strategy' | 'title' | 'thumbnail' | 'description';
  onSelect: (promptContent: string, favoriteId: number) => void;
  trigger?: React.ReactNode;
}

export function FavoritePromptSelector({
  promptType,
  onSelect,
  trigger,
}: FavoritePromptSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: prompts, isLoading } = trpc.favoritePrompts.listFavoritePrompts.useQuery(
    { promptType },
    { enabled: open }
  );

  const useMutation = trpc.favoritePrompts.useFavoritePrompt.useMutation();

  const handleSelect = (prompt: any) => {
    onSelect(prompt.promptContent, prompt.id);
    useMutation.mutate({ promptId: prompt.id });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Charger un favori
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompts Favoris</DialogTitle>
          <DialogDescription>
            Sélectionnez un prompt favori pour le charger dans le champ
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !prompts || prompts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun prompt favori disponible
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt: any) => (
              <Card
                key={prompt.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelect(prompt)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Prompt favori
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      Utilisé {prompt.usageCount} fois
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Dernière utilisation: {new Date(prompt.lastUsedAt).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="whitespace-pre-wrap text-xs font-mono line-clamp-3">
                      {prompt.promptContent}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
