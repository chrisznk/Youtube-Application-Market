import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  Database, 
  Key, 
  Cloud, 
  Youtube, 
  Bot,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  category: "database" | "auth" | "llm" | "youtube" | "storage" | "email";
  required: boolean;
  sensitive: boolean;
}

const API_KEYS_CONFIG: ApiKeyConfig[] = [
  // Base de données
  {
    key: "DATABASE_URL",
    label: "URL de la base de données",
    description: "URL de connexion MySQL/PostgreSQL (ex: mysql://user:pass@host:3306/db)",
    placeholder: "mysql://root:password@localhost:3306/tubetest_tracker",
    category: "database",
    required: true,
    sensitive: true
  },
  
  // Authentification
  {
    key: "JWT_SECRET",
    label: "Clé secrète JWT",
    description: "Clé pour signer les tokens d'authentification (32+ caractères)",
    placeholder: "votre_cle_secrete_jwt_tres_longue",
    category: "auth",
    required: true,
    sensitive: true
  },
  
  // LLM
  {
    key: "OPENAI_API_KEY",
    label: "Clé API OpenAI",
    description: "Clé pour accéder à l'API OpenAI (GPT-4, etc.)",
    placeholder: "sk-...",
    category: "llm",
    required: false,
    sensitive: true
  },
  {
    key: "OPENAI_MODEL",
    label: "Modèle OpenAI par défaut",
    description: "Modèle à utiliser (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)",
    placeholder: "gpt-4o",
    category: "llm",
    required: false,
    sensitive: false
  },
  {
    key: "GEMINI_API_KEY",
    label: "Clé API Google Gemini",
    description: "Alternative à OpenAI - Clé API Gemini",
    placeholder: "AIza...",
    category: "llm",
    required: false,
    sensitive: true
  },
  
  // YouTube
  {
    key: "YOUTUBE_API_KEY",
    label: "Clé API YouTube Data v3",
    description: "Pour récupérer les vidéos et statistiques YouTube",
    placeholder: "AIza...",
    category: "youtube",
    required: true,
    sensitive: true
  },
  {
    key: "YOUTUBE_CLIENT_ID",
    label: "Client ID YouTube OAuth",
    description: "Pour les fonctionnalités avancées (Analytics, etc.)",
    placeholder: "xxxxx.apps.googleusercontent.com",
    category: "youtube",
    required: false,
    sensitive: false
  },
  {
    key: "YOUTUBE_CLIENT_SECRET",
    label: "Client Secret YouTube OAuth",
    description: "Secret associé au Client ID YouTube",
    placeholder: "GOCSPX-...",
    category: "youtube",
    required: false,
    sensitive: true
  },
  
  // Stockage S3
  {
    key: "S3_BUCKET",
    label: "Nom du bucket S3",
    description: "Bucket pour stocker les fichiers uploadés",
    placeholder: "tubetest-tracker-uploads",
    category: "storage",
    required: false,
    sensitive: false
  },
  {
    key: "S3_REGION",
    label: "Région AWS",
    description: "Région du bucket S3 (ex: eu-west-1)",
    placeholder: "eu-west-1",
    category: "storage",
    required: false,
    sensitive: false
  },
  {
    key: "AWS_ACCESS_KEY_ID",
    label: "AWS Access Key ID",
    description: "Identifiant d'accès AWS",
    placeholder: "AKIA...",
    category: "storage",
    required: false,
    sensitive: true
  },
  {
    key: "AWS_SECRET_ACCESS_KEY",
    label: "AWS Secret Access Key",
    description: "Clé secrète AWS",
    placeholder: "...",
    category: "storage",
    required: false,
    sensitive: true
  },
  {
    key: "S3_ENDPOINT",
    label: "Endpoint S3 personnalisé",
    description: "Pour MinIO ou autres services S3-compatibles (optionnel)",
    placeholder: "http://localhost:9000",
    category: "storage",
    required: false,
    sensitive: false
  },
  
  // Email
  {
    key: "SMTP_HOST",
    label: "Serveur SMTP",
    description: "Serveur pour l'envoi d'emails",
    placeholder: "smtp.gmail.com",
    category: "email",
    required: false,
    sensitive: false
  },
  {
    key: "SMTP_PORT",
    label: "Port SMTP",
    description: "Port du serveur SMTP (587 pour TLS)",
    placeholder: "587",
    category: "email",
    required: false,
    sensitive: false
  },
  {
    key: "SMTP_USER",
    label: "Utilisateur SMTP",
    description: "Email ou identifiant SMTP",
    placeholder: "votre_email@gmail.com",
    category: "email",
    required: false,
    sensitive: false
  },
  {
    key: "SMTP_PASSWORD",
    label: "Mot de passe SMTP",
    description: "Mot de passe ou clé d'application",
    placeholder: "...",
    category: "email",
    required: false,
    sensitive: true
  },
];

const CATEGORY_ICONS = {
  database: Database,
  auth: Key,
  llm: Bot,
  youtube: Youtube,
  storage: Cloud,
  email: Mail,
};

const CATEGORY_LABELS = {
  database: "Base de données",
  auth: "Authentification",
  llm: "Intelligence Artificielle",
  youtube: "YouTube",
  storage: "Stockage S3",
  email: "Email",
};

export default function ApiKeys() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Charger les valeurs actuelles
  const { data: currentConfig, refetch } = trpc.config.getAll.useQuery();
  const updateConfigMutation = trpc.config.update.useMutation();
  const testConnectionMutation = trpc.config.testConnection.useMutation();

  useEffect(() => {
    if (currentConfig) {
      setValues(currentConfig);
    }
  }, [currentConfig]);

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfigMutation.mutateAsync(values);
      toast.success("Configuration sauvegardée avec succès");
      refetch();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (category: string) => {
    setTesting(category);
    try {
      const result = await testConnectionMutation.mutateAsync({ category });
      if (result.success) {
        toast.success(result.message || "Connexion réussie");
      } else {
        toast.error(result.message || "Échec de la connexion");
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const getConfigStatus = (key: string): "configured" | "missing" | "optional" => {
    const config = API_KEYS_CONFIG.find(c => c.key === key);
    const value = values[key];
    
    if (value && value.length > 0) return "configured";
    if (config?.required) return "missing";
    return "optional";
  };

  const renderKeyInput = (config: ApiKeyConfig) => {
    const status = getConfigStatus(config.key);
    const isVisible = visibleKeys.has(config.key);
    const value = values[config.key] || "";

    return (
      <div key={config.key} className="space-y-2 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor={config.key} className="font-medium">
              {config.label}
            </Label>
            {config.required && (
              <Badge variant="destructive" className="text-xs">Requis</Badge>
            )}
            {status === "configured" && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {status === "missing" && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">{config.description}</p>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={config.key}
              type={config.sensitive && !isVisible ? "password" : "text"}
              value={value}
              onChange={(e) => handleChange(config.key, e.target.value)}
              placeholder={config.placeholder}
              className="pr-10"
            />
            {config.sensitive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => toggleVisibility(config.key)}
              >
                {isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const categories = ["database", "auth", "llm", "youtube", "storage", "email"] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuration des Clés API</h1>
            <p className="text-muted-foreground mt-1">
              Gérez toutes les clés API et configurations de l'application
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Les modifications seront sauvegardées dans le fichier <code>.env</code> à la racine du projet.
            Redémarrez le serveur après avoir modifié les clés pour appliquer les changements.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="database" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const keysInCategory = API_KEYS_CONFIG.filter(c => c.category === category);
              const configuredCount = keysInCategory.filter(c => getConfigStatus(c.key) === "configured").length;
              const requiredCount = keysInCategory.filter(c => c.required).length;
              const missingRequired = keysInCategory.filter(c => c.required && getConfigStatus(c.key) === "missing").length;
              
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{CATEGORY_LABELS[category]}</span>
                  {missingRequired > 0 ? (
                    <Badge variant="destructive" className="ml-1">{missingRequired}</Badge>
                  ) : configuredCount > 0 ? (
                    <Badge variant="secondary" className="ml-1">{configuredCount}/{keysInCategory.length}</Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const keysInCategory = API_KEYS_CONFIG.filter(c => c.category === category);
            
            return (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestConnection(category)}
                        disabled={testing === category}
                      >
                        {testing === category ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Tester la connexion
                      </Button>
                    </div>
                    <CardDescription>
                      Configurez les paramètres de {CATEGORY_LABELS[category].toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {keysInCategory.map(renderKeyInput)}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Résumé de la configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé de la configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                const keysInCategory = API_KEYS_CONFIG.filter(c => c.category === category);
                const configuredCount = keysInCategory.filter(c => getConfigStatus(c.key) === "configured").length;
                const requiredMissing = keysInCategory.filter(c => c.required && getConfigStatus(c.key) === "missing").length;
                
                let statusColor = "bg-gray-100 text-gray-600";
                if (requiredMissing > 0) {
                  statusColor = "bg-red-100 text-red-600";
                } else if (configuredCount === keysInCategory.length) {
                  statusColor = "bg-green-100 text-green-600";
                } else if (configuredCount > 0) {
                  statusColor = "bg-yellow-100 text-yellow-600";
                }
                
                return (
                  <div key={category} className={`p-4 rounded-lg ${statusColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{CATEGORY_LABELS[category]}</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {configuredCount}/{keysInCategory.length}
                    </div>
                    <div className="text-xs">
                      {requiredMissing > 0 
                        ? `${requiredMissing} requis manquant(s)`
                        : configuredCount === keysInCategory.length 
                          ? "Complet"
                          : "Partiel"
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
