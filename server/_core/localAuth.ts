/**
 * Système d'authentification locale pour TubeTest Tracker (version standalone)
 * Remplace l'authentification Manus OAuth
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d"; // Token valide 7 jours

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifie un mot de passe
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Génère un token JWT
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    ENV.cookieSecret,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || null,
      role: decoded.role || "user"
    };
  } catch {
    return null;
  }
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function registerUser(
  email: string, 
  password: string, 
  name?: string
): Promise<RegisterResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Base de données non disponible" };
  }

  // Vérifier si l'email existe déjà
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "Cet email est déjà utilisé" };
  }

  // Hasher le mot de passe
  const passwordHash = await hashPassword(password);

  // Créer l'utilisateur
  const isFirstUser = (await db.select().from(users).limit(1)).length === 0;
  
  await db.insert(users).values({
    openId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    name: name || null,
    loginMethod: "local",
    role: isFirstUser ? "admin" : "user", // Premier utilisateur = admin
    passwordHash,
    lastSignedIn: new Date()
  });

  // Récupérer l'utilisateur créé
  const [newUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email!,
      name: newUser.name,
      role: newUser.role
    }
  };
}

/**
 * Connexion d'un utilisateur
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Base de données non disponible" };
  }

  // Trouver l'utilisateur
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { success: false, error: "Email ou mot de passe incorrect" };
  }

  // Vérifier le mot de passe
  if (!user.passwordHash) {
    return { success: false, error: "Ce compte utilise une autre méthode de connexion" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Email ou mot de passe incorrect" };
  }

  // Mettre à jour la date de dernière connexion
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  const authUser: AuthUser = {
    id: user.id,
    email: user.email!,
    name: user.name,
    role: user.role
  };

  return {
    success: true,
    user: authUser,
    token: generateToken(authUser)
  };
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id: number): Promise<AuthUser | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    name: user.name,
    role: user.role
  };
}

/**
 * Change le mot de passe d'un utilisateur
 */
export async function changePassword(
  userId: number, 
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Base de données non disponible" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Crée le compte admin initial si nécessaire
 */
export async function ensureAdminExists(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Vérifier si un admin existe
  const admins = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (admins.length === 0 && ENV.adminEmail && ENV.adminPassword) {
    console.log("[Auth] Création du compte administrateur initial...");
    await registerUser(ENV.adminEmail, ENV.adminPassword, "Administrateur");
    console.log(`[Auth] Compte admin créé: ${ENV.adminEmail}`);
  }
}
