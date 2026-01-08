import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Youtube, Trash2, RefreshCw, Eye, ThumbsUp, MessageSquare, Settings, Search, FileText } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ViewTrendsDashboard } from "@/components/ViewTrendsDashboard";
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: videosData, isLoading: videosLoading } = trpc.videos.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Tri et filtrage des vidéos
  const videos = useMemo(() => {
    if (!videosData) return [];
    
    // Filtrer par recherche
    let filtered = videosData;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = videosData.filter(video => 
        video.title.toLowerCase().includes(query)
      );
    }
    
    // Trier par date de publication (plus récente en premier)
    return [...filtered].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [videosData, searchQuery]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [newVideo, setNewVideo] = useState({
    youtubeId: "",
    title: "",
    description: "",
  });

  const [channelId, setChannelId] = useState(() => {
    // Charger le dernier ID de chaîne depuis localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastChannelId') || '';
    }
    return '';
  });
  const [syncPeriod, setSyncPeriod] = useState<number | undefined>(14); // 14 jours par défaut
  const [showOAuthSyncDialog, setShowOAuthSyncDialog] = useState(false);

  const { data: youtubeAuthStatus } = trpc.youtube.checkAuth.useQuery();
  const { data: youtubeConfig } = trpc.sync.getConfig.useQuery(undefined, {
    enabled: !!user && !!youtubeAuthStatus?.authenticated,
  });
  // Récupérer les infos de synchronisation par ID de chaîne
  const { data: channelSyncInfo } = trpc.sync.getChannelSyncInfo.useQuery(undefined, {
    enabled: !!user,
  });
  const getAuthUrlQuery = trpc.youtube.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  const syncMyVideosMutation = trpc.youtube.syncMyVideos.useMutation({
    onSuccess: (result) => {
      utils.videos.list.invalidate();
      if (result.success) {
        toast.success(`Synchronisation réussie ! ${result.videosAdded} vidéos ajoutées, ${result.videosUpdated} mises à jour.`);
      } else {
        toast.error(result.errors?.[0] || "Erreur lors de la synchronisation");
      }
      setShowOAuthSyncDialog(false);
      setSyncPeriod(14);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate();
      toast.success("Vidéo ajoutée avec succès !");
      setShowAddDialog(false);
      setNewVideo({ youtubeId: "", title: "", description: "" });
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const syncMutation = trpc.videos.syncFromYouTube.useMutation({
    onSuccess: (result) => {
      utils.videos.list.invalidate();
      utils.sync.getChannelSyncInfo.invalidate(); // Rafraîchir les infos de la chaîne
      if (result.success) {
        toast.success(`Synchronisation réussie ! ${result.videosAdded} vidéos ajoutées, ${result.videosUpdated} mises à jour.`);
      } else {
        toast.error("Erreur lors de la synchronisation");
      }
      setShowSyncDialog(false);
      // Ne pas effacer l'ID de chaîne pour le garder mémorisé
      setSyncPeriod(14);
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deleteAllMutation = trpc.videos.deleteAll.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate();
      toast.success("Toutes les vidéos ont été supprimées");
      setShowDeleteAllDialog(false);
      setDeleteConfirmText("");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deleteVideoMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate();
      toast.success("Vidéo supprimée");
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Déconnexion réussie");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la déconnexion : ${error.message}`);
    },
  });

  if (authLoading || videosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAddVideo = () => {
    if (!newVideo.youtubeId || !newVideo.title) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createVideoMutation.mutate(newVideo);
  };

  const handleSync = () => {
    if (!channelId.trim()) {
      toast.error("Veuillez entrer un ID de chaîne");
      return;
    }
    // Sauvegarder l'ID de chaîne dans localStorage pour le pré-remplir la prochaine fois
    localStorage.setItem('lastChannelId', channelId.trim());
    syncMutation.mutate({ 
      channelId: channelId.trim(),
      periodDays: syncPeriod // undefined = tout récupérer
    });
  };

  const handleDeleteAll = () => {
    if (deleteConfirmText !== "SUPPRIMER TOUT") {
      toast.error("Veuillez taper 'SUPPRIMER TOUT' pour confirmer");
      return;
    }
    deleteAllMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Gérez vos vidéos YouTube et tests A/B</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Actions */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une vidéo
          </Button>
          <Button variant="outline" onClick={() => setShowSyncDialog(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync par ID de chaîne
          </Button>
          {videos && videos.length > 0 && (
            <Button variant="destructive" onClick={() => setShowDeleteAllDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer toutes les vidéos
            </Button>
          )}
        </div>

        {/* Channel Sync Info Card */}
        {channelSyncInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                Chaîne YouTube synchronisée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom de la chaîne</p>
                  <p className="font-medium">{channelSyncInfo.channelTitle || 'Non disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre de vidéos</p>
                  <p className="font-medium">{videos?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dernière synchronisation</p>
                  <p className="font-medium">
                    {channelSyncInfo.lastSyncAt 
                      ? new Date(channelSyncInfo.lastSyncAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Jamais'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Trends Dashboard */}
        {videosData && videosData.length > 0 && (
          <div className="mb-6">
            <ViewTrendsDashboard />
          </div>
        )}

        {/* Search Bar */}
        {videosData && videosData.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une vidéo par titre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {videos && videos.length === 0 ? (
          <div className="text-center py-20">
            <Youtube className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo</h3>
            <p className="text-gray-600 mb-6">Commencez par ajouter une vidéo ou synchroniser votre chaîne YouTube</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une vidéo
              </Button>
              <Button variant="outline" onClick={() => setShowSyncDialog(true)}>
                <Youtube className="mr-2 h-4 w-4" />
                Synchroniser YouTube
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos?.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative group cursor-pointer" onClick={() => setLocation(`/video/${video.id}`)}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 cursor-pointer hover:text-red-600" onClick={() => setLocation(`/video/${video.id}`)}>
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {(video.viewCount || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {(video.likeCount || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {(video.commentCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setLocation(`/video/${video.id}`)}>
                      Détails
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteVideoMutation.mutate({ id: video.id })}
                      disabled={deleteVideoMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Video Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une vidéo</DialogTitle>
            <DialogDescription>Ajoutez manuellement une vidéo YouTube</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtubeId">ID de la vidéo YouTube *</Label>
              <Input
                id="youtubeId"
                placeholder="dQw4w9WgXcQ"
                value={newVideo.youtubeId}
                onChange={(e) => setNewVideo({ ...newVideo, youtubeId: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Titre de la vidéo"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la vidéo"
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAddVideo} disabled={createVideoMutation.isPending}>
              {createVideoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Synchroniser YouTube</DialogTitle>
            <DialogDescription>Importez vos vidéos depuis votre chaîne YouTube</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channelId">ID de la chaîne YouTube</Label>
              <Input
                id="channelId"
                placeholder="UCxxxxxxxxxxxxxxxxxxxxx"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Vous pouvez trouver l'ID de votre chaîne dans les paramètres YouTube
              </p>
            </div>
            <div>
              <Label htmlFor="syncPeriod">Période de synchronisation</Label>
              <select
                id="syncPeriod"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={syncPeriod === undefined ? "all" : syncPeriod}
                onChange={(e) => {
                  const value = e.target.value;
                  setSyncPeriod(value === "all" ? undefined : parseInt(value));
                }}
              >
                <option value="7">Dernière semaine</option>
                <option value="14">2 dernières semaines (par défaut)</option>
                <option value="30">Dernier mois</option>
                <option value="90">3 derniers mois</option>
                <option value="180">6 derniers mois</option>
                <option value="365">Dernière année</option>
                <option value="all">Depuis toujours</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choisissez la période pour limiter le nombre de vidéos importées
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Annuler</Button>
            <Button onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Synchroniser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OAuth2 Sync Dialog */}
      <Dialog open={showOAuthSyncDialog} onOpenChange={setShowOAuthSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Synchroniser mes vidéos YouTube</DialogTitle>
            <DialogDescription>
              Importez automatiquement vos vidéos depuis votre chaîne YouTube connectée
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="oauthSyncPeriod">Période de synchronisation</Label>
              <select
                id="oauthSyncPeriod"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={syncPeriod === undefined ? "all" : syncPeriod}
                onChange={(e) => {
                  const value = e.target.value;
                  setSyncPeriod(value === "all" ? undefined : parseInt(value));
                }}
              >
                <option value="7">Dernière semaine</option>
                <option value="14">2 dernières semaines (par défaut)</option>
                <option value="30">Dernier mois</option>
                <option value="90">3 derniers mois</option>
                <option value="180">6 derniers mois</option>
                <option value="365">Dernière année</option>
                <option value="all">Depuis toujours</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choisissez la période pour limiter le nombre de vidéos importées
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Info :</strong> Cette synchronisation récupère les statistiques complètes (likes, commentaires, transcriptions) directement depuis votre compte YouTube.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOAuthSyncDialog(false)}>Annuler</Button>
            <Button onClick={() => syncMyVideosMutation.mutate({ periodDays: syncPeriod })} disabled={syncMyVideosMutation.isPending}>
              {syncMyVideosMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Synchroniser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Supprimer toutes les vidéos</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos vidéos, tests A/B, variantes et statistiques seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Seront supprimés :</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Toutes les vidéos ({videos?.length || 0})</li>
                <li>• Tous les tests A/B associés</li>
                <li>• Toutes les variantes de tests</li>
                <li>• Toutes les statistiques historiques</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="confirmText">Tapez "SUPPRIMER TOUT" pour confirmer</Label>
              <Input
                id="confirmText"
                placeholder="SUPPRIMER TOUT"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteAllDialog(false);
              setDeleteConfirmText("");
            }}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAll}
              disabled={deleteConfirmText !== "SUPPRIMER TOUT" || deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer tout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
