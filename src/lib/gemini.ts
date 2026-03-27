import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Cliente, Notizia } from "@/src/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export async function callGemini(
  messages: GeminiMessage[],
  systemInstruction?: string,
  jsonMode?: boolean
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is missing. Please configure GEMINI_API_KEY in the Secrets panel.');
  }
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const fetchWithRetry = async (retryCount = 0): Promise<string> => {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: jsonMode ? "application/json" : "text/plain",
        },
      });

      const text = response.text;
      if (text === undefined) {
        throw new Error('No content returned from Gemini');
      }
      return text;
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || "";
      const isRetryable = 
        errorMessage.includes("high demand") || 
        errorMessage.includes("429") || 
        errorMessage.includes("503") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("deadline exceeded") ||
        errorMessage.includes("service unavailable");

      if (isRetryable && retryCount < 3) {
        // For 429 (Quota Exceeded), we might want a slightly longer delay
        const isQuotaExceeded = errorMessage.includes("429") || errorMessage.includes("quota");
        const baseDelay = isQuotaExceeded ? 5000 : 2000;
        
        // Exponential backoff: 5s/10s/20s for quota, 2s/4s/8s for others + jitter
        const delay = Math.pow(2, retryCount) * baseDelay + Math.random() * 1000;
        
        console.warn(`Gemini ${isQuotaExceeded ? 'quota exceeded' : 'high demand'}, retrying in ${Math.round(delay)}ms... (Attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retryCount + 1);
      }
      
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        const quotaError = new Error("Quota API Gemini esaurita. Riprova più tardi o domani.");
        (quotaError as any).status = 429;
        throw quotaError;
      }

      console.error("Gemini API Error after retries:", error);
      throw error;
    }
  };

  return fetchWithRetry();
}

/**
 * Analizza un cliente per fornire un profilo dettagliato e consigli all'agente.
 */
export async function analyzeCliente(cliente: Cliente): Promise<string> {
  const system = "Sei un consulente immobiliare di lusso specializzato nel mercato italiano premium. Rispondi sempre in italiano.";
  const prompt = `Analizza questo potenziale acquirente di immobili di lusso:
Nome: ${cliente.nome} ${cliente.cognome}
Budget: ${cliente.budget_max ? cliente.budget_max + ' EUR' : 'Non specificato'}
Regioni: ${cliente.regioni.join(', ')}
Tipologia: ${cliente.tipologia.join(', ')}
Stile: ${cliente.stile}
Uso: ${cliente.uso}
Tempo ricerca: ${cliente.tempo_ricerca}
Mutuo: ${cliente.mutuo ? 'Sì' : 'No'}
Descrizione: ${cliente.descrizione}

Fornisci un'analisi in formato markdown con queste sezioni esatte:
## 🎯 Profilo
## ⏱️ Urgenza
## 💡 Consigli per l'agente
## ⚠️ Possibili obiezioni`;

  try {
    return await callGemini([{ role: 'user', parts: [{ text: prompt }] }], system);
  } catch (error: any) {
    console.error("Gemini analyzeCliente error:", error);
    return `## 🎯 Profilo\nAnalisi non disponibile (Quota AI esaurita).\n\n## ⏱️ Urgenza\nMedia\n\n## 💡 Consigli per l'agente\nContatta il cliente per approfondire le sue necessità.\n\n## ⚠️ Possibili obiezioni\nBudget da verificare.`;
  }
}

/**
 * Trova le migliori notizie (immobili) per un determinato cliente.
 */
export async function matchNotizie(
  cliente: Cliente,
  notizie: Notizia[]
): Promise<Array<{ id: string; score: number; reason: string }>> {
  const prompt = `Agisci come un esperto di matching immobiliare. 
Confronta questo cliente con la lista di immobili (notizie) fornita.
Cliente: ${JSON.stringify({
    budget: cliente.budget_max,
    regioni: cliente.regioni,
    tipologia: cliente.tipologia,
    stile: cliente.stile,
    uso: cliente.uso
  })}

Immobili: ${JSON.stringify(notizie.map(n => ({
    id: n.id,
    name: n.name,
    zona: n.zona,
    type: n.type,
    prezzo: n.prezzo_richiesto,
    valore: n.valore
  })))}

Ritorna un array JSON di oggetti {id, score, reason} ordinati per score decrescente (score da 0 a 100).
Ritorna SOLO il JSON.`;

  const responseText = await callGemini(
    [{ role: 'user', parts: [{ text: prompt }] }],
    "Sei un assistente AI esperto in real estate matching.",
    true
  );

  try {
    const results = JSON.parse(responseText);
    return Array.isArray(results) ? results : [];
  } catch (e) {
    console.error('Failed to parse Gemini match results', e);
    return [];
  }
}

/**
 * Genera una breve citazione motivazionale giornaliera in italiano.
 */
export async function generateDailyQuote(): Promise<{ quote: string; author: string }> {
  const prompt = "Genera una citazione breve (massimo 15 parole) sulla crescita personale o il successo nel real estate. Rispondi esclusivamente in formato JSON: {\"quote\": \"...\", \"author\": \"...\"}. Lingua: italiano.";
  try {
    const response = await callGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      "Sei un assistente AI che genera citazioni ispiratrici.",
      true
    );
    return JSON.parse(response);
  } catch (error) {
    console.error("Gemini generateDailyQuote error:", error);
    return { quote: "L'eccellenza non è un atto, ma un'abitudine.", author: "Aristotele" };
  }
}

/**
 * Chat generica con contesto per l'assistente CRM.
 */
export async function chatWithContext(
  messages: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>,
  systemContext?: string
): Promise<string> {
  const baseSystem = "Sei l'assistente AI di Leadomancy, un CRM per il real estate di lusso in Italia. Sei professionale, elegante e proattivo.";
  const fullSystem = systemContext ? `${baseSystem}\n\nContesto aggiuntivo:\n${systemContext}` : baseSystem;
  
  return callGemini(messages, fullSystem);
}
