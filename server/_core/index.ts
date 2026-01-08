import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // YouTube Webhook endpoint
  app.get("/api/webhook/youtube", async (req, res) => {
    // Vérification du challenge YouTube (PubSubHubbub)
    const challenge = req.query["hub.challenge"] as string;
    if (challenge) {
      const { verifyWebhookChallenge } = await import("../webhooks/youtubeWebhook");
      res.status(200).send(verifyWebhookChallenge(challenge));
      return;
    }
    res.status(400).send("Missing challenge");
  });
  
  app.post("/api/webhook/youtube", express.text({ type: "application/atom+xml" }), async (req, res) => {
    try {
      const { parseYouTubeNotification, handleYouTubeNotification } = await import("../webhooks/youtubeWebhook");
      
      const notification = await parseYouTubeNotification(req.body);
      if (notification) {
        // Traiter la notification de manière asynchrone
        handleYouTubeNotification(notification).catch(console.error);
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("[Webhook] Error processing notification:", error);
      res.status(500).send("Error");
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialiser les tâches cron pour la synchronisation automatique
    import("../sync/cronJobs").then(({ initializeCronJobs }) => {
      initializeCronJobs();
    }).catch(console.error);
  });
}

startServer().catch(console.error);
