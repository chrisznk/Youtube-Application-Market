import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Plus, Edit, Trash2, Copy, Star, StarOff, Loader2, Tag, Hash } from "lucide-react";
import { useState } from "react";

export default function VideoTemplates() {
  const { data: templates, isLoading, refetch } = trpc.videoTemplates.list.useQuery();
  const { data: categories } = trpc.videoTemplates.getCategories.useQuery();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const createTemplate = trpc.videoTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template créé avec succès");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateTemplate = trpc.videoTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template mis à jour");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteTemplate = trpc.videoTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const duplicateTemplate = trpc.videoTemplates.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template dupliqué");
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setTitleTemplate("");
    setDescriptionTemplate("");
    setTagsInput("");
    setCategory("");
    setIsDefault(false);
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    const tags = tagsInput.split(",").map(t => t.trim()).filter(t => t);
    createTemplate.mutate({
      name,
      titleTemplate: titleTemplate || undefined,
      descriptionTemplate: descriptionTemplate || undefined,
      tagsTemplate: tags.length > 0 ? tags : undefined,
      category: category || undefined,
      isDefault,
    });
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setName(template.name);
    setTitleTemplate(template.titleTemplate || "");
    setDescriptionTemplate(template.descriptionTemplate || "");
    setTagsInput((template.tagsTemplate || []).join(", "));
    setCategory(template.category || "");
    setIsDefault(template.isDefault);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(t => t);
    updateTemplate.mutate({
      id: selectedTemplate.id,
      name,
      titleTemplate: titleTemplate || undefined,
      descriptionTemplate: descriptionTemplate || undefined,
      tagsTemplate: tags,
      category: category || undefined,
      isDefault,
    });
  };

  const handleDuplicate = (template: any) => {
    duplicateTemplate.mutate({
      id: template.id,
      newName: `${template.name} (copie)`,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Templates de Vidéos
            </h1>
            <p className="text-muted-foreground">
              Créez des templates réutilisables pour vos titres, descriptions et tags
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un template</DialogTitle>
                <DialogDescription>
                  Définissez un template réutilisable pour vos vidéos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du template *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Tutoriel Tech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ex: Tutoriels"
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories?.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Template de titre</Label>
                  <Input
                    id="title"
                    value={titleTemplate}
                    onChange={(e) => setTitleTemplate(e.target.value)}
                    placeholder="Ex: [TUTO] {sujet} - Guide Complet {année}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez {"{variable}"} pour les parties dynamiques
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Template de description</Label>
                  <Textarea
                    id="description"
                    value={descriptionTemplate}
                    onChange={(e) => setDescriptionTemplate(e.target.value)}
                    placeholder="Ex: Dans cette vidéo, je vous montre {sujet}..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Ex: tutoriel, tech, guide, français"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    Définir comme template par défaut
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={!name || createTemplate.isPending}>
                  {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className={template.isDefault ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      {template.category && (
                        <Badge variant="secondary" className="mt-1">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Supprimer ce template ?")) {
                            deleteTemplate.mutate({ id: template.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {template.titleTemplate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Titre</p>
                      <p className="text-sm truncate">{template.titleTemplate}</p>
                    </div>
                  )}
                  {template.descriptionTemplate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm line-clamp-2">{template.descriptionTemplate}</p>
                    </div>
                  )}
                  {template.tagsTemplate && template.tagsTemplate.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Tags
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.tagsTemplate.slice(0, 5).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tagsTemplate.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tagsTemplate.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Utilisé {template.usageCount} fois
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun template</h3>
              <p className="text-muted-foreground text-center mb-4">
                Créez votre premier template pour accélérer la création de vos vidéos
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le template</DialogTitle>
              <DialogDescription>
                Modifiez les détails de votre template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom du template *</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Catégorie</Label>
                  <Input
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="edit-categories"
                  />
                  <datalist id="edit-categories">
                    {categories?.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Template de titre</Label>
                <Input
                  id="edit-title"
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Template de description</Label>
                <Textarea
                  id="edit-description"
                  value={descriptionTemplate}
                  onChange={(e) => setDescriptionTemplate(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (séparés par des virgules)</Label>
                <Input
                  id="edit-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="edit-isDefault" className="cursor-pointer">
                  Définir comme template par défaut
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={!name || updateTemplate.isPending}>
                {updateTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
