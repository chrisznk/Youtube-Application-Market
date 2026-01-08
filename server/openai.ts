/**
 * OpenAI integration for A/B test optimization
 * Generates strategies and suggestions based on video transcripts and test results
 */

const OPENAI_API_KEY = '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';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenAIResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Truncate text to avoid exceeding token limits
 * Estimation: ~4 characters = 1 token
 */
function truncateText(text: string, maxTokens: number = 15000): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars) + '\n\n[... transcription tronquée pour respecter les limites de l\'API ...]';
}

/**
 * Map model names to OpenAI API model names
 */
function mapModelName(model: string): string {
  const modelMap: Record<string, string> = {
    // GPT-5 series - map to exact names from OpenAI API
    'gpt-5': 'gpt-5',
    'gpt-5-pro': 'gpt-5.2-pro',  // User selects "gpt-5-pro" but API uses "gpt-5.2-pro"
    // O1 series - use exact names from OpenAI API
    'o1': 'o1',
    'o1-mini': 'o1-mini',
    // GPT-4o series
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
  };
  return modelMap[model] || model;
}

/**
 * Check if model is an O1 model (reasoning models with different API requirements)
 */
function isO1Model(model: string): boolean {
  return model.startsWith('o1');
}

/**
 * Check if model is a GPT-5 series model (uses max_completion_tokens instead of max_tokens)
 */
function isGPT5Model(model: string): boolean {
  return model.startsWith('gpt-5') || model === 'gpt-5.2-pro';
}

/**
 * Call OpenAI Responses API (for GPT-5 Pro and other models that require it)
 */
async function callOpenAIResponses(
  messages: ChatMessage[],
  model: string = 'gpt-5-pro',
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('La clé API OpenAI n\'est pas configurée.');
  }

  try {
    // Extract system message as instructions
    const systemMessage = messages.find(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role !== 'system');
    
    // Convert messages to input format
    const input = userMessages.map(msg => msg.content).join('\n\n');
    
    const requestBody: any = {
      model,
      input,
      max_output_tokens: maxTokens,
    };
    
    // GPT-5.2 Pro doesn't support temperature parameter
    if (model !== 'gpt-5.2-pro') {
      requestBody.temperature = temperature;
    }
    
    if (systemMessage) {
      requestBody.instructions = systemMessage.content;
    }
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMsg = `Erreur API OpenAI Responses (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg += ': ' + errorData.error.message;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      throw new Error(errorMsg);
    }

    const data: any = await response.json();
    
    // Log the full response for debugging
    console.log('[OpenAI Responses API] Full response:', JSON.stringify(data, null, 2));
    
    if (!data.output_items || !Array.isArray(data.output_items) || data.output_items.length === 0) {
      console.error('[OpenAI Responses API] Invalid output_items:', data.output_items);
      throw new Error('Aucune réponse reçue de l\'API OpenAI Responses');
    }

    // Extract text from output_items
    const outputItem = data.output_items[0];
    console.log('[OpenAI Responses API] First output item:', JSON.stringify(outputItem, null, 2));
    
    if (!outputItem) {
      throw new Error('Premier élément de output_items est undefined');
    }
    
    if (outputItem.type === 'message' && outputItem.content) {
      if (!Array.isArray(outputItem.content)) {
        console.error('[OpenAI Responses API] content is not an array:', outputItem.content);
        throw new Error('Format de contenu inattendu (content n\'est pas un tableau)');
      }
      
      const textContent = outputItem.content.find((c: any) => c && c.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text.trim();
      }
      
      console.error('[OpenAI Responses API] No text content found in:', outputItem.content);
      throw new Error('Aucun contenu texte trouvé dans la réponse');
    }
    
    console.error('[OpenAI Responses API] Unexpected output item structure:', outputItem);
    throw new Error(`Format de réponse inattendu de l\'API OpenAI Responses (type: ${outputItem?.type})`)
  } catch (error) {
    console.error('Error calling OpenAI Responses API:', error);
    throw error;
  }
}

/**
 * Call OpenAI Chat API
 */
async function callOpenAIChat(
  messages: ChatMessage[],
  model: string = 'gpt-4o',
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('La clé API OpenAI n\'est pas configurée.');
  }

  try {
    // Map model name to OpenAI API name
    const apiModel = mapModelName(model);
    
    // GPT-5.2 Pro requires Responses API (only available via /v1/responses)
    if (apiModel === 'gpt-5.2-pro') {
      return callOpenAIResponses(messages, apiModel, temperature, maxTokens);
    }
    
    const isO1 = isO1Model(apiModel);
    
    // O1 models don't support temperature and max_tokens
    // They also only support 'user' and 'assistant' roles, not 'system'
    const requestBody: any = {
      model: apiModel,
      messages: isO1 ? messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      })) : messages,
    };
    
    const isGPT5 = isGPT5Model(apiModel);
    
    // Only add temperature and max_tokens for non-O1 models
    if (!isO1) {
      // GPT-5 models only support temperature = 1 (default)
      if (!isGPT5) {
        requestBody.temperature = temperature;
      }
      // GPT-5 models use max_completion_tokens instead of max_tokens
      if (isGPT5) {
        requestBody.max_completion_tokens = maxTokens;
      } else {
        requestBody.max_tokens = maxTokens;
      }
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMsg = `Erreur API OpenAI (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg += ': ' + errorData.error.message;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      throw new Error(errorMsg);
    }

    const data: OpenAIResponse = await response.json();
    
    // Log response for debugging GPT-5 issues
    console.log('[OpenAI Chat API] Model:', apiModel);
    console.log('[OpenAI Chat API] Response:', JSON.stringify(data, null, 2));
    
    if (!data.choices || data.choices.length === 0) {
      console.error('[OpenAI Chat API] No choices in response');
      throw new Error('Aucune réponse reçue de l\'API OpenAI');
    }
    
    const content = data.choices[0].message.content;
    console.log('[OpenAI Chat API] Content:', content);

    return content ? content.trim() : '';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Generate optimization strategy based on video transcript and A/B test results
 */
export async function generateStrategy(variables: {
  video_transcript: string;
  ab_test_report: string;
  current_channel_titles?: string;
  model?: string;
  userId?: number;
}): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const { getLatestCoordinationScript, replaceScriptTags } = await import('./scriptHelpers');
    const truncatedTranscript = truncateText(variables.video_transcript, 15000);
    
    // Get coordination script from database
    let userMessage = '';
    if (variables.userId) {
      const script = await getLatestCoordinationScript(variables.userId, 'strategy_generation');
      if (script) {
        userMessage = replaceScriptTags(script.content, {
          video_transcript: truncatedTranscript,
          ab_test_report: variables.ab_test_report,
          current_channel_titles: variables.current_channel_titles || ''
        });
      }
    }
    
    // Fallback to hardcoded prompt if script not found
    if (!userMessage) {
      userMessage = `Vous êtes un expert en optimisation YouTube. Analysez la transcription vidéo et le rapport de tests A/B suivants pour générer une stratégie d'optimisation détaillée.

TRANSCRIPTION DE LA VIDÉO:
${truncatedTranscript}

RAPPORT DES TESTS A/B:
${variables.ab_test_report}

Générez une stratégie d'optimisation complète qui:
1. Identifie les thèmes et angles qui fonctionnent le mieux
2. Analyse les patterns de performance dans les tests A/B
3. Recommande des directions spécifiques pour les prochains tests
4. Suggère des améliorations basées sur les données

Soyez précis et actionnable dans vos recommandations.`;
    }

    // GPT-5 models need more tokens for reasoning + output
    const model = variables.model || 'gpt-4o';
    const maxTokens = model.startsWith('gpt-5') || model.startsWith('o1') ? 16000 : 2000;
    
    const response = await callOpenAIChat(
      [{ role: 'user', content: userMessage }],
      model,
      0.7,
      maxTokens
    );

    return { success: true, data: response };
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la génération de la stratégie.',
    };
  }
}

/**
 * Generate title and thumbnail suggestions based on strategy
 */
export async function generateSuggestions(variables: {
  video_transcript: string;
  ab_test_report: string;
  strategy_summary: string;
  model?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const truncatedTranscript = truncateText(variables.video_transcript, 15000);
    
    const userMessage = `Vous êtes un expert en optimisation YouTube. Basé sur la transcription, le rapport A/B et la stratégie suivante, générez des suggestions d'optimisation.

TRANSCRIPTION:
${truncatedTranscript}

RAPPORT A/B:
${variables.ab_test_report}

STRATÉGIE:
${variables.strategy_summary}

Générez un JSON avec le format EXACT suivant (ne rien ajouter avant ou après le JSON):
{
  "video_title_suggestions": [
    {
      "rank": 1,
      "title": "Titre optimisé qui capte l'attention"
    },
    {
      "rank": 2,
      "title": "Deuxième titre alternatif"
    },
    {
      "rank": 3,
      "title": "Troisième titre alternatif"
    }
  ],
  "thumbnail_suggestions": [
    {
      "rank": 1,
      "thumbnail_title_variants": ["Texte court 1", "Texte court 2", "Texte court 3"],
      "midjourney_prompt_variants": [
        "Prompt Midjourney détaillé pour miniature 1",
        "Prompt Midjourney détaillé pour miniature 2",
        "Prompt Midjourney détaillé pour miniature 3"
      ]
    },
    {
      "rank": 2,
      "thumbnail_title_variants": ["Texte court 1", "Texte court 2", "Texte court 3"],
      "midjourney_prompt_variants": [
        "Prompt Midjourney détaillé pour miniature 1",
        "Prompt Midjourney détaillé pour miniature 2",
        "Prompt Midjourney détaillé pour miniature 3"
      ]
    }
  ]
}

IMPORTANT: Retournez UNIQUEMENT le JSON, sans texte avant ou après.`;

    // GPT-5 and O1 models need more tokens for reasoning + output
    const model = variables.model || 'gpt-4o';
    const maxTokens = model.startsWith('gpt-5') || model.startsWith('o1') ? 16000 : 4000;

    const response = await callOpenAIChat(
      [{ role: 'user', content: userMessage }],
      model,
      0.7,
      maxTokens
    );

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'La réponse de l\'IA n\'était pas un JSON valide.',
      };
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return { success: true, data: suggestions };
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la génération des suggestions.',
    };
  }
}
