import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Youtube, BarChart3, TestTube2 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded-lg" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
            <Youtube className="h-4 w-4" />
            Optimisez vos vidéos YouTube
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Testez, Analysez, Optimisez
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            TubeTest Tracker vous permet de réaliser des tests A/B sur vos titres et miniatures YouTube, 
            et d'analyser les performances de vos vidéos en temps réel.
          </p>

          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Commencer gratuitement
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Youtube className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Synchronisation YouTube</h3>
            <p className="text-gray-600">
              Importez automatiquement vos vidéos depuis votre chaîne YouTube et suivez leurs statistiques.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TestTube2 className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Tests A/B</h3>
            <p className="text-gray-600">
              Créez des variantes de titres et miniatures pour découvrir ce qui fonctionne le mieux.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Analyses détaillées</h3>
            <p className="text-gray-600">
              Visualisez les performances de vos vidéos avec des graphiques et statistiques précises.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2025 {APP_TITLE}. Optimisez vos vidéos YouTube avec des tests A/B.</p>
        </div>
      </footer>
    </div>
  );
}
