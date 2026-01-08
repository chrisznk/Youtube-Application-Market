/**
 * Configuration centralisée pour TubeTest Tracker (version standalone)
 * Toutes les variables d'environnement sont lues ici
 */

export const ENV = {
  // Application
  appTitle: process.env.APP_TITLE ?? "TubeTest Tracker",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  port: parseInt(process.env.PORT ?? "3000", 10),
  isProduction: process.env.NODE_ENV === "production",
  
  // Base de données
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Authentification
  cookieSecret: process.env.JWT_SECRET ?? "",
  authMode: process.env.AUTH_MODE ?? "local", // "local" ou "oauth"
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  
  // OpenAI / LLM
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  
  // Gemini (alternative)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  
  // YouTube
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  youtubeClientId: process.env.YOUTUBE_CLIENT_ID ?? "",
  youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
  
  // S3 Storage
  s3Region: process.env.S3_REGION ?? "eu-west-1",
  s3Bucket: process.env.S3_BUCKET ?? "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "", // Pour MinIO ou autres
  
  // Email (SMTP)
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "",
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  
  // Compatibilité avec l'ancien code (à supprimer progressivement)
  appId: process.env.VITE_APP_ID ?? "standalone",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

/**
 * Vérifie que les variables d'environnement essentielles sont configurées
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ENV.databaseUrl) {
    errors.push("DATABASE_URL n'est pas configuré");
  }
  
  if (!ENV.cookieSecret) {
    errors.push("JWT_SECRET n'est pas configuré");
  }
  
  if (!ENV.openaiApiKey && !ENV.geminiApiKey) {
    errors.push("Aucune clé API LLM configurée (OPENAI_API_KEY ou GEMINI_API_KEY)");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
