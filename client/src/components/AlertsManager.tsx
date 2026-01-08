import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Eye, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const alertTypeOptions = [
  { value: "growth", label: "Croissance", icon: TrendingUp, color: "text-green-500" },
  { value: "decline", label: "Décroissance", icon: TrendingDown, color: "text-red-500" },
  { value: "views", label: "Nombre de vues", icon: Eye, color: "text-blue-500" },
];

const periodOptions = [
  { value: "1h", label: "1 heure" },
  { value: "2h", label: "2 heures" },
  { value: "24h", label: "24 heures" },
  { value: "48h", label: "48 heures" },
  { value: "1week", label: "1 semaine" },
];

function formatThreshold(alertType: string, threshold: number): string {
  if (alertType === "views") {
    return threshold >= 1000 ? `${(threshold / 1000).toFixed(1)}K vues` : `${threshold} vues`;
  }
  return `${(threshold / 100).toFixed(2)}%`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertsManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: "",
    alertType: "growth" as "growth" | "decline" | "views",
    threshold: 1000, // 10% for growth/decline, 1000 for views
    period: "1h",
  });

  const utils = trpc.useUtils();
  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.list.useQuery();
  const { data: history, isLoading: historyLoading } = trpc.alerts.getHistory.useQuery({ limit: 20 });

  const createMutation = trpc.alerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alerte créée avec succès");
      setIsCreateOpen(false);
      setNewAlert({ name: "", alertType: "growth", threshold: 1000, period: "1h" });
      utils.alerts.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = trpc.alerts.update.useMutation({
    onSuccess: () => {
      toast.success("Alerte mise à jour");
      utils.alerts.list.invalidate();
    },
  });

  const deleteMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alerte supprimée");
      utils.alerts.list.invalidate();
    },
  });

  const checkNowMutation = trpc.alerts.checkNow.useMutation({
    onSuccess: (result) => {
      if (result.triggered.length > 0) {
        toast.warning(`${result.triggered.length} alerte(s) déclenchée(s)!`, {
          description: result.triggered.map(t => t.videoTitle).join(", "),
        });
      } else {
        toast.success("Aucune alerte déclenchée");
      }
      utils.alerts.getHistory.invalidate();
    },
  });

  const handleCreate = () => {
    if (!newAlert.name.trim()) {
      toast.error("Veuillez entrer un nom pour l'alerte");
      return;
    }
    createMutation.mutate({
      name: newAlert.name,
      alertType: newAlert.alertType,
      threshold: newAlert.threshold,
      period: newAlert.period as "1h" | "2h" | "24h" | "48h" | "1week",
    });
  };

  const handleToggle = (id: number, enabled: boolean) => {
    updateMutation.mutate({ id, enabled: !enabled });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette alerte ?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alertes de seuil
          </h2>
          <p className="text-muted-foreground">
            Recevez des notifications quand vos vidéos atteignent certains seuils
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => checkNowMutation.mutate()}
            disabled={checkNowMutation.isPending}
          >
            {checkNowMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Vérifier maintenant
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle alerte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle alerte</DialogTitle>
                <DialogDescription>
                  Configurez les conditions pour déclencher une notification
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'alerte</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Vidéo virale"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type d'alerte</Label>
                  <Select
                    value={newAlert.alertType}
                    onValueChange={(v) => setNewAlert({ ...newAlert, alertType: v as typeof newAlert.alertType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className={`h-4 w-4 ${opt.color}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">
                    Seuil {newAlert.alertType === "views" ? "(nombre de vues)" : "(pourcentage)"}
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    value={newAlert.alertType === "views" ? newAlert.threshold : newAlert.threshold / 100}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setNewAlert({
                        ...newAlert,
                        threshold: newAlert.alertType === "views" ? val : val * 100,
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newAlert.alertType === "growth" && "Alerte si la croissance dépasse ce pourcentage"}
                    {newAlert.alertType === "decline" && "Alerte si la décroissance dépasse ce pourcentage (en négatif)"}
                    {newAlert.alertType === "views" && "Alerte si le nombre de vues gagnées dépasse ce seuil"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Période de comparaison</Label>
                  <Select
                    value={newAlert.period}
                    onValueChange={(v) => setNewAlert({ ...newAlert, period: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader>
          <CardTitle>Mes alertes</CardTitle>
          <CardDescription>
            {alerts?.length || 0} alerte(s) configurée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : alerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune alerte configurée</p>
              <p className="text-sm">Créez votre première alerte pour être notifié</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Déclenchements</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert) => {
                  const typeConfig = alertTypeOptions.find((t) => t.value === alert.alertType);
                  const TypeIcon = typeConfig?.icon || Bell;
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TypeIcon className={`h-4 w-4 ${typeConfig?.color}`} />
                          {typeConfig?.label}
                        </div>
                      </TableCell>
                      <TableCell>{formatThreshold(alert.alertType, alert.threshold)}</TableCell>
                      <TableCell>
                        {periodOptions.find((p) => p.value === alert.period)?.label}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{alert.triggerCount || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={alert.enabled}
                          onCheckedChange={() => handleToggle(alert.id, alert.enabled)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alert history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des alertes</CardTitle>
          <CardDescription>Dernières alertes déclenchées</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune alerte déclenchée récemment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vidéo</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>Valeur réelle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((entry) => {
                  const typeConfig = alertTypeOptions.find((t) => t.value === entry.alertType);
                  const TypeIcon = typeConfig?.icon || Bell;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {entry.videoTitle}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TypeIcon className={`h-4 w-4 ${typeConfig?.color}`} />
                          {typeConfig?.label}
                        </div>
                      </TableCell>
                      <TableCell>{formatThreshold(entry.alertType, entry.threshold)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatThreshold(entry.alertType, entry.actualValue)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertsManager;
