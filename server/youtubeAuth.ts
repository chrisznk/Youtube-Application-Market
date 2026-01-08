import { google, Auth } from 'googleapis';
import * as db from './db';

type OAuth2Client = Auth.OAuth2Client;

const YOUTUBE_CLIENT_ID = "1001135783524-uc08clq6b79t30u9bh3e075aob0p7n6r.apps.googleusercontent.com";
const YOUTUBE_CLIENT_SECRET = "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";
// URL de redirection fixe qui doit correspondre à celle configurée dans Google Cloud Console
const REDIRECT_URI = "https://3000-iubvmisf0l2opkazd8b7w-85ffd521.manusvm.computer/youtube/callback";

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl', // Nécessaire pour télécharger les transcriptions
];

export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl(userId: number): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: String(userId), // Pour identifier l'utilisateur après le callback
  });
}

export async function handleCallback(code: string, userId: number): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('[YouTube OAuth] No access token received');
      return false;
    }

    // Récupérer les informations de la chaîne YouTube
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    let channelId = '';
    let channelTitle = '';
    
    try {
      const channelsResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
      });

      if (channelsResponse.data.items && channelsResponse.data.items.length > 0) {
        const channel = channelsResponse.data.items[0];
        channelId = channel.id || '';
        channelTitle = channel.snippet?.title || '';
      }
    } catch (error) {
      console.error('[YouTube OAuth] Error fetching channel info:', error);
    }

    // Calculer la date d'expiration du token
    const tokenExpiry = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // 1 heure par défaut

    // Stocker les tokens et infos de chaîne en base de données
    await db.upsertYouTubeConfig({
      userId,
      channelId: channelId || 'unknown',
      channelTitle,
      apiKey: '', // Pas utilisé pour OAuth, mais requis par le schéma
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry,
      autoSyncEnabled: true,
    });
    
    console.log(`[YouTube OAuth] Tokens saved for user ${userId}, channel: ${channelTitle}`);
    return true;
  } catch (error) {
    console.error('[YouTube OAuth] Error handling callback:', error);
    return false;
  }
}

export async function getStoredTokens(userId: number): Promise<any | null> {
  const config = await db.getYouTubeConfig(userId);
  
  if (!config || !config.accessToken) {
    return null;
  }

  return {
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expiry_date: config.tokenExpiry ? new Date(config.tokenExpiry).getTime() : null,
  };
}

export async function hasYouTubeAuth(userId: number): Promise<boolean> {
  const config = await db.getYouTubeConfig(userId);
  return !!(config && config.accessToken);
}

export async function getAccessToken(userId: number): Promise<string | null> {
  const tokens = await getStoredTokens(userId);
  if (!tokens) return null;
  
  // Vérifier si le token est expiré et le rafraîchir si nécessaire
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  try {
    const { token } = await oauth2Client.getAccessToken();
    
    // Si le token a été rafraîchi, mettre à jour en base de données
    if (token && token !== tokens.access_token) {
      const newTokens = oauth2Client.credentials;
      const tokenExpiry = newTokens.expiry_date 
        ? new Date(newTokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await db.updateYouTubeTokens(userId, {
        accessToken: newTokens.access_token || tokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refresh_token,
        tokenExpiry,
      });
    }
    
    return token || null;
  } catch (error) {
    console.error("[Auth] Error getting access token:", error);
    return null;
  }
}

export async function getAuthenticatedYouTubeService(userId: number) {
  const tokens = await getStoredTokens(userId);
  
  if (!tokens) {
    throw new Error('No YouTube authentication found for this user');
  }
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  return google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
}

export async function getAuthenticatedAnalyticsService(userId: number) {
  const tokens = await getStoredTokens(userId);
  
  if (!tokens) {
    throw new Error('No YouTube authentication found for this user');
  }
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  
  return google.youtubeAnalytics({
    version: 'v2',
    auth: oauth2Client,
  });
}

export async function revokeYouTubeAuth(userId: number): Promise<boolean> {
  try {
    await db.deleteYouTubeConfig(userId);
    return true;
  } catch (error) {
    console.error('[YouTube OAuth] Error revoking auth:', error);
    return false;
  }
}
