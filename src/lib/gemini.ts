import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Cliente, Notizia } from "@/src/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

export async function searchPropertiesOnline(
  clienteProfile: string
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API Key missing');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Use Google Search Grounding to actually search the web
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ 
      role: 'user', 
      parts: [{ text: clienteProfile }] 
    }],
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Sei un consulente immobiliare. 
Cerca su cortesiluxuryrealestate.com le proprietà reali disponibili.
Usa Google Search per trovare proprietà REALI con URL REALI dal sito.
Non inventare mai URL o proprietà che non esistono sul sito.
Rispondi SOLO con un array JSON valido.`,
    },
  });
  
  return response.text || '';
}

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

Fornisci un'analisi MOLTO BREVE in formato markdown con queste sezioni esatte:
## 🎯 Profilo (max 2 righe)
## ⏱️ Urgenza (max 1 riga)
## 💡 Consigli pratici (3 punti brevi)
## ⚠️ Possibili obiezioni (max 2 righe)`;

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
  const prompt = "Generate a short, soulful daily quote (max 15 words) in the style of Insight Timer. Focus on inner growth, mindfulness, and spiritual evolution. Language: English. Respond strictly in JSON format: {\"quote\": \"...\", \"author\": \"...\"}.";
  try {
    const response = await callGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      "You are a spiritual guide and mindfulness teacher.",
      true
    );
    return JSON.parse(response);
  } catch (error) {
    console.error("Gemini generateDailyQuote error:", error);
    return { quote: "The quieter you become, the more you are able to hear.", author: "Rumi" };
  }
}

/**
 * Chat generica con contesto per l'assistente CRM.
 */
export async function chatWithContext(
  messages: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>,
  systemContext?: string
): Promise<string> {
  const baseSystem = "Sei l'assistente AI di ALTAIR, un CRM per il real estate di lusso in Italia. Sei professionale, elegante e proattivo.";
  const fullSystem = systemContext ? `${baseSystem}\n\nContesto aggiuntivo:\n${systemContext}` : baseSystem;
  
  return callGemini(messages, fullSystem);
}

export async function analyzeNotizia(notizia: {
  name: string;
  zona?: string | null;
  type?: string | null;
  prezzo_richiesto?: number | null;
  valore?: number | null;
  notes?: string | null;
  rating?: number | null;
  is_online?: boolean;
}): Promise<string> {

  const datiDisponibili = [
    notizia.name && `Nome: ${notizia.name}`,
    notizia.zona && `Zona: ${notizia.zona}`,
    notizia.type && `Tipo: ${notizia.type}`,
    notizia.prezzo_richiesto && `Prezzo richiesto: €${notizia.prezzo_richiesto.toLocaleString('it-IT')}`,
    notizia.valore && `Valore stimato: €${notizia.valore.toLocaleString('it-IT')}`,
    notizia.rating && `Rating interno: ${notizia.rating}/5`,
    notizia.is_online !== undefined && `Pubblicata online: ${notizia.is_online ? 'Sì' : 'No'}`,
    notizia.notes && `Note agente: ${notizia.notes.replace(/<[^>]+>/g, ' ').trim().slice(0, 400)}`,
  ].filter(Boolean).join('\n');

  const prompt = `Sei un agente immobiliare di lusso. Analizza questa proprietà in modo conciso.

Dati:
- Nome: ${notizia.name || 'N/D'}
- Zona: ${notizia.zona || 'N/D'}
- Tipo: ${notizia.type || 'N/D'}
- Prezzo richiesto: ${notizia.prezzo_richiesto ? '€' + notizia.prezzo_richiesto.toLocaleString('it-IT') : 'N/D'}
- Valore stimato: ${notizia.valore ? '€' + notizia.valore.toLocaleString('it-IT') : 'N/D'}
- Rating: ${notizia.rating ? notizia.rating + '/5' : 'N/D'}
- Note: ${notizia.notes ? notizia.notes.replace(/<[^>]+>/g, ' ').trim().slice(0, 300) : 'nessuna'}

Rispondi con massimo 4 frasi brevi e dirette in italiano. 
NON usare asterischi, markdown, bullet points o simboli.
NON usare termini inglesi.
Scrivi come un professionista che parla a un collega.
Valuta: potenziale commerciale, rapporto prezzo/valore, e una cosa concreta da fare.`;

  const systemInstruction = `Sei un assistente per agenti immobiliari. 
Il tuo unico compito è commentare i dati che ti vengono forniti.
Non hai accesso a internet. Non conosci questa proprietà.
Non aggiungere MAI informazioni esterne ai dati ricevuti.
Se i dati sono pochi, scrivi meno. Non riempire con supposizioni.`;

  try {
    return await callGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction
    );
  } catch (error: any) {
    console.error('[analyzeNotizia] Error:', error);
    return 'Analisi non disponibile. Riprova tra qualche istante.';
  }
}
