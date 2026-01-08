import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function YouTubeCallback() {
  const [, setLocation] = useLocation();
  const handleCallbackMutation = trpc.youtube.handleCallback.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Authentification YouTube réussie !");
        setLocation("/dashboard");
      } else {
        toast.error("Erreur lors de l'authentification YouTube");
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
      setLocation("/dashboard");
    },
  });

  useEffect(() => {
    // Récupérer le code d'autorisation et le state depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      toast.error(`Erreur d'authentification : ${error}`);
      setLocation("/dashboard");
      return;
    }

    if (code && state) {
      handleCallbackMutation.mutate({ code, state });
    } else {
      toast.error("Code d'autorisation ou state manquant");
      setLocation("/dashboard");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentification YouTube en cours...
        </h2>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous finalisons votre connexion.
        </p>
      </div>
    </div>
  );
}
