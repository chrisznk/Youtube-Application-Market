import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Lightbulb, FileText, Image, Tag, AlignLeft, Trash2, Edit, Check, X, Clock, CheckCircle, Archive } from "lucide-react";

interface SavedIdea {
  id: number;
  ideaType: 'video_idea' | 'title' | 'thumbnail' | 'tags' | 'description';
  title: string;
  summary: string | null;
  source: string;
  model: string | null;
  status: 'saved' | 'in_progress' | 'completed' | 'archived';
  notes: string | null;
  createdAt: string;
}

const ideaTypeConfig = {
  video_idea: { label: "Idées de vidéos", icon: Lightbulb, color: "text-yellow-500" },
  title: { label: "Titres", icon: FileText, color: "text-blue-500" },
  thumbnail: { label: "Miniatures", icon: Image, color: "text-purple-500" },
  tags: { label: "Tags", icon: Tag, color: "text-green-500" },
  description: { label: "Descriptions", icon: AlignLeft, color: "text-orange-500" },
};

const statusConfig = {
  saved: { label: "Sauvegardé", icon: Clock, color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "En cours", icon: Clock, color: "bg-blue-100 text-blue-700" },
  completed: { label: "Terminé", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  archived: { label: "Archivé", icon: Archive, color: "bg-yellow-100 text-yellow-700" },
};

export default function SavedIdeas() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [detailDialog, setDetailDialog] = useState<SavedIdea | null>(null);

  const { data: ideas, isLoading, refetch } = trpc.savedIdeas.list.useQuery(
    selectedType === "all" && selectedStatus === "all" 
      ? undefined 
      : {
          ideaType: selectedType !== "all" ? selectedType as SavedIdea['ideaType'] : undefined,
          status: selectedStatus !== "all" ? selectedStatus as SavedIdea['status'] : undefined,
        }
  );

  const updateStatusMutation = trpc.savedIdeas.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const updateNotesMutation = trpc.savedIdeas.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes mises à jour");
      setEditingNotes(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deleteMutation = trpc.savedIdeas.delete.useMutation({
    onSuccess: () => {
      toast.success("Idée supprimée");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleStatusChange = (id: number, status: SavedIdea['status']) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleSaveNotes = (id: number) => {
    updateNotesMutation.mutate({ id, notes: notesText });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette idée ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIdeaIcon = (type: SavedIdea['ideaType']) => {
    const config = ideaTypeConfig[type];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Idées Sauvegardées</h1>
          <p className="text-muted-foreground mt-2">
            Retrouvez toutes vos idées de vidéos, titres, miniatures et descriptions sauvegardées.
          </p>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(ideaTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des idées */}
        <Card>
          <CardHeader>
            <CardTitle>
              {ideas?.length || 0} idée{(ideas?.length || 0) > 1 ? "s" : ""} sauvegardée{(ideas?.length || 0) > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ideas && ideas.length > 0 ? (
              <div className="space-y-4">
                {ideas.map((idea: SavedIdea) => (
                  <div
                    key={idea.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getIdeaIcon(idea.ideaType)}
                          <Badge variant="outline">
                            {ideaTypeConfig[idea.ideaType].label}
                          </Badge>
                          <Badge className={statusConfig[idea.status].color}>
                            {statusConfig[idea.status].label}
                          </Badge>
                          {idea.model && (
                            <Badge variant="secondary" className="text-xs">
                              {idea.model}
                            </Badge>
                          )}
                        </div>
                        <h3
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => setDetailDialog(idea)}
                        >
                          {idea.title}
                        </h3>
                        {idea.summary && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {idea.summary}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(idea.createdAt)} • Source: {idea.source.replace(/_/g, " ")}
                        </p>

                        {/* Notes */}
                        {editingNotes === idea.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              placeholder="Ajouter des notes..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(idea.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Sauvegarder
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingNotes(null)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : idea.notes ? (
                          <div
                            className="mt-2 p-2 bg-muted rounded text-sm cursor-pointer"
                            onClick={() => {
                              setEditingNotes(idea.id);
                              setNotesText(idea.notes || "");
                            }}
                          >
                            <span className="font-medium">Notes:</span> {idea.notes}
                          </div>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Select
                          value={idea.status}
                          onValueChange={(value) => handleStatusChange(idea.id, value as SavedIdea['status'])}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNotes(idea.id);
                              setNotesText(idea.notes || "");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(idea.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune idée sauvegardée</p>
                <p className="text-sm mt-1">
                  Utilisez Brainstorm ou l'Étude de Concurrence pour générer et sauvegarder des idées.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de détail */}
        <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {detailDialog && getIdeaIcon(detailDialog.ideaType)}
                {detailDialog?.title}
              </DialogTitle>
              <DialogDescription>
                {detailDialog && ideaTypeConfig[detailDialog.ideaType].label} • {detailDialog?.source.replace(/_/g, " ")}
              </DialogDescription>
            </DialogHeader>
            {detailDialog && (
              <div className="space-y-4">
                {detailDialog.summary && (
                  <div>
                    <h4 className="font-medium mb-2">Résumé</h4>
                    <p className="text-muted-foreground">{detailDialog.summary}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge className={statusConfig[detailDialog.status].color}>
                    {statusConfig[detailDialog.status].label}
                  </Badge>
                  {detailDialog.model && (
                    <Badge variant="secondary">{detailDialog.model}</Badge>
                  )}
                </div>
                {detailDialog.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-muted-foreground">{detailDialog.notes}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Créé le {formatDate(detailDialog.createdAt)}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
