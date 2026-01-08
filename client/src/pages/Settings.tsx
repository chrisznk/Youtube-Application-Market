import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Settings as SettingsIcon, Palette, Bell, Database, FlaskConical, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Paramètres sauvegardés");
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde: " + error.message);
    },
  });

  // Local state for form
  const [theme, setTheme] = useState("system");
  const [backupFrequency, setBackupFrequency] = useState("weekly");
  const [abTestCtrThreshold, setAbTestCtrThreshold] = useState(5);
  const [abTestViewsThreshold, setAbTestViewsThreshold] = useState(1000);
  const [notifyNewVideos, setNotifyNewVideos] = useState(true);
  const [notifyABTestThreshold, setNotifyABTestThreshold] = useState(true);
  const [notifyBackupComplete, setNotifyBackupComplete] = useState(true);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setBackupFrequency(settings.backupFrequency);
      setAbTestCtrThreshold(settings.abTestCtrThreshold);
      setAbTestViewsThreshold(settings.abTestViewsThreshold);
      setNotifyNewVideos(settings.notifyNewVideos);
      setNotifyABTestThreshold(settings.notifyABTestThreshold);
      setNotifyBackupComplete(settings.notifyBackupComplete);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      theme: theme as "light" | "dark" | "system",
      backupFrequency: backupFrequency as "daily" | "weekly" | "monthly",
      abTestCtrThreshold,
      abTestViewsThreshold,
      notifyNewVideos,
      notifyABTestThreshold,
      notifyBackupComplete,
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
              <SettingsIcon className="h-6 w-6" />
              Paramètres
            </h1>
            <p className="text-muted-foreground">
              Configurez vos préférences et personnalisez votre expérience
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Sélectionner un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le thème "Système" suit les préférences de votre appareil
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gérez les notifications que vous recevez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nouvelles vidéos</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifier lors de la synchronisation de nouvelles vidéos
                  </p>
                </div>
                <Switch
                  checked={notifyNewVideos}
                  onCheckedChange={setNotifyNewVideos}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Seuils A/B atteints</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifier quand un test A/B atteint les seuils définis
                  </p>
                </div>
                <Switch
                  checked={notifyABTestThreshold}
                  onCheckedChange={setNotifyABTestThreshold}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup terminé</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifier quand un backup automatique est terminé
                  </p>
                </div>
                <Switch
                  checked={notifyBackupComplete}
                  onCheckedChange={setNotifyBackupComplete}
                />
              </div>
            </CardContent>
          </Card>

          {/* Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sauvegarde automatique
              </CardTitle>
              <CardDescription>
                Configurez la fréquence des sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Fréquence de backup</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Sélectionner une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les backups incluent vos profils, corrections et historique
                </p>
              </div>
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Tests A/B
              </CardTitle>
              <CardDescription>
                Définissez les seuils de performance pour les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ctr-threshold">Seuil de CTR (%)</Label>
                <Input
                  id="ctr-threshold"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={abTestCtrThreshold}
                  onChange={(e) => setAbTestCtrThreshold(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Notification si une variante dépasse ce taux de clics
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="views-threshold">Seuil de vues</Label>
                <Input
                  id="views-threshold"
                  type="number"
                  min={0}
                  step={100}
                  value={abTestViewsThreshold}
                  onChange={(e) => setAbTestViewsThreshold(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Notification si une variante atteint ce nombre de vues
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
