# TubeTest Tracker - Version Standalone

Application de suivi et d'optimisation de vidéos YouTube avec IA.

## 🚀 Installation

### Prérequis

- **Node.js** 18+ (recommandé: 20+)
- **pnpm** (gestionnaire de paquets)
- **MySQL** 8+ ou **MariaDB** 10.5+ ou **PostgreSQL** 14+

### Étapes d'installation

1. **Cloner ou extraire le projet**
   ```bash
   cd tubetest-tracker-standalone
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp config.example.env .env
   ```
   Puis éditez le fichier `.env` avec vos propres valeurs.

4. **Créer la base de données**
   ```sql
   CREATE DATABASE tubetest_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Appliquer les migrations**
   ```bash
   pnpm db:push
   ```

6. **Lancer l'application**
   ```bash
   pnpm dev
   ```

L'application sera accessible sur `http://localhost:3000`

## ⚙️ Configuration

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion à la base de données |
| `JWT_SECRET` | Clé secrète pour les tokens d'authentification |
| `YOUTUBE_API_KEY` | Clé API YouTube Data v3 |
| `OPENAI_API_KEY` ou `GEMINI_API_KEY` | Clé API pour l'IA |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Stockage S3 |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | Envoi d'emails |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth Google |

### Page d'administration des clés API

Une fois connecté en tant qu'administrateur, accédez à `/api-keys` pour gérer toutes les clés API via l'interface graphique.

## 🔑 Obtenir les clés API

### YouTube Data API v3

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Activez "YouTube Data API v3"
4. Créez une clé API dans "Identifiants"

### OpenAI

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte et ajoutez des crédits
3. Générez une clé API dans "API Keys"

### Google Gemini (alternative gratuite)

1. Allez sur [Google AI Studio](https://aistudio.google.com/)
2. Créez une clé API

## 📁 Structure du projet

```
tubetest-tracker-standalone/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   └── lib/            # Utilitaires
├── server/                 # Backend Express + tRPC
│   ├── _core/              # Configuration et utilitaires
│   ├── routers.ts          # Routes tRPC
│   └── db.ts               # Requêtes base de données
├── drizzle/                # Schéma et migrations
├── shared/                 # Types partagés
└── config.example.env      # Template de configuration
```

## 🛠️ Commandes disponibles

```bash
# Développement
pnpm dev              # Lancer en mode développement

# Base de données
pnpm db:push          # Appliquer les migrations
pnpm db:studio        # Ouvrir Drizzle Studio

# Production
pnpm build            # Compiler pour la production
pnpm start            # Lancer en production

# Tests
pnpm test             # Lancer les tests
```

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les sessions utilisent des tokens JWT signés
- Les clés API sensibles sont masquées dans l'interface
- L'accès à la configuration est réservé aux administrateurs

## 📝 Premier compte administrateur

Au premier lancement, créez un compte avec l'email défini dans `ADMIN_EMAIL`. Ce compte sera automatiquement promu administrateur.

Ou définissez `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env` pour créer automatiquement un compte admin au démarrage.

## 🆘 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Testez les connexions via la page `/api-keys`
3. Vérifiez que toutes les variables requises sont configurées

## 📄 Licence

Propriétaire - Tous droits réservés
"# Youtube-Application-Market" 
