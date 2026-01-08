import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SyncSettings() {
  const [channelId, setChannelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const { data: config, isLoading: configLoading, refetch: refetchConfig } = trpc.sync.getConfig.useQuery();
  const { data: syncLogs, isLoading: logsLoading, refetch: refetchLogs } = trpc.sync.getSyncLogs.useQuery({ limit: 10 });
  
  const saveConfigMutation = trpc.sync.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration sauvegardée !");
      refetchConfig();
      setChannelId("");
      setApiKey("");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const syncNowMutation = trpc.sync.syncNow.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Synchronisation terminée ! ${data.imported} importées, ${data.updated} mises à jour`
      );
      refetchLogs();
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation : ${error.message}`);
    },
  });

  const handleSaveConfig = () => {
    if (!channelId || !apiKey) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    saveConfigMutation.mutate({ channelId, apiKey, autoSyncEnabled });
  };

  const handleSyncNow = () => {
    if (!config) {
      toast.error("Veuillez d'abord configurer votre chaîne YouTube");
      return;
    }
    syncNowMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Succès</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Partiel</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échec</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Synchronisation YouTube</h1>
        <p className="text-muted-foreground mt-2">
          Configurez la synchronisation automatique de vos vidéos YouTube
        </p>
      </div>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration YouTube</CardTitle>
          <CardDescription>
            Entrez votre Channel ID et votre API Key YouTube pour activer la synchronisation automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-medium text-green-900 dark:text-green-100">✅ Configuration active</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Channel ID: {config.channelId}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Synchronisation automatique: {config.autoSyncEnabled ? "Activée" : "Désactivée"}
                </p>
                {config.lastSyncAt && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Dernière synchronisation: {new Date(config.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleSyncNow}
                disabled={syncNowMutation.isPending}
                className="w-full"
              >
                {syncNowMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Synchroniser maintenant
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="channelId">Channel ID YouTube</Label>
                <Input
                  id="channelId"
                  placeholder="UCxxxxxxxxxxxxxxxxxx"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Trouvez votre Channel ID dans les paramètres avancés de YouTube Studio
                </p>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key YouTube</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Créez une API Key dans Google Cloud Console
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSync">Synchronisation automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Synchroniser automatiquement chaque jour à 3h du matin
                  </p>
                </div>
                <Switch
                  id="autoSync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
                className="w-full"
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder la configuration"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des synchronisations</CardTitle>
          <CardDescription>
            Les 10 dernières synchronisations effectuées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : syncLogs && syncLogs.length > 0 ? (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(log.startedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.videosImported} importées • {log.videosUpdated} mises à jour
                      </p>
                      {log.errors && (
                        <p className="text-xs text-red-500 mt-1">{log.errors}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune synchronisation effectuée pour le moment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comment obtenir vos identifiants ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Channel ID</h3>
            <p className="text-sm text-muted-foreground">
              Allez dans YouTube Studio → Paramètres → Canal → Paramètres avancés
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">2. API Key</h3>
            <p className="text-sm text-muted-foreground">
              Allez dans Google Cloud Console → APIs & Services → Credentials → Create Credentials → API Key
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Activez l'API "YouTube Data API v3" dans votre projet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
