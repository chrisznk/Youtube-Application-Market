/**
 * Module LLM pour TubeTest Tracker (version standalone)
 * Support OpenAI et Google Gemini
 */

import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export interface Message {
  role: Role;
  content: string | Array<TextContent | ImageContent>;
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface LLMOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: Tool[];
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  };
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Détermine quel provider LLM utiliser
 */
function getLLMProvider(): "openai" | "gemini" | null {
  if (ENV.openaiApiKey) return "openai";
  if (ENV.geminiApiKey) return "gemini";
  return null;
}

/**
 * Appelle l'API OpenAI
 */
async function callOpenAI(options: LLMOptions): Promise<LLMResponse> {
  const model = options.model || ENV.openaiModel || "gpt-4o";
  
  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
  };

  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.max_tokens !== undefined) body.max_tokens = options.max_tokens;
  if (options.tools) body.tools = options.tools;
  if (options.tool_choice) body.tool_choice = options.tool_choice;
  if (options.response_format) body.response_format = options.response_format;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Appelle l'API Google Gemini
 */
async function callGemini(options: LLMOptions): Promise<LLMResponse> {
  // Convertir le format OpenAI vers Gemini
  const model = options.model || "gemini-1.5-pro";
  
  // Mapper les messages au format Gemini
  const contents = options.messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : m.content.map(c => c.type === "text" ? c.text : "").join("") }]
    }));

  // Extraire le message système
  const systemMessage = options.messages.find(m => m.role === "system");
  const systemInstruction = systemMessage 
    ? { parts: [{ text: typeof systemMessage.content === "string" ? systemMessage.content : "" }] }
    : undefined;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 4096,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const geminiResponse = await response.json();
  
  // Convertir la réponse Gemini au format OpenAI
  return {
    id: `gemini-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "",
      },
      finish_reason: geminiResponse.candidates?.[0]?.finishReason || "stop",
    }],
    usage: {
      prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Fonction principale pour appeler le LLM
 */
export async function invokeLLM(options: LLMOptions): Promise<LLMResponse> {
  const provider = getLLMProvider();
  
  if (!provider) {
    throw new Error(
      "Aucune clé API LLM configurée. Définissez OPENAI_API_KEY ou GEMINI_API_KEY dans votre fichier .env"
    );
  }

  if (provider === "openai") {
    return callOpenAI(options);
  } else {
    return callGemini(options);
  }
}

/**
 * Vérifie si le LLM est configuré
 */
export function isLLMConfigured(): boolean {
  return getLLMProvider() !== null;
}

/**
 * Retourne le provider LLM actuel
 */
export function getCurrentLLMProvider(): string | null {
  return getLLMProvider();
}

/**
 * Liste les modèles disponibles
 */
export function getAvailableModels(): string[] {
  const provider = getLLMProvider();
  
  if (provider === "openai") {
    return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o1-mini"];
  } else if (provider === "gemini") {
    return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"];
  }
  
  return [];
}
