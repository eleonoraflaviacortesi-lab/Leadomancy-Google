import { Cliente, Notizia } from "@/src/types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

async function callGemini(
  messages: GeminiMessage[],
  systemInstruction?: string,
  jsonMode?: boolean
): Promise<string> {
  const body: any = {
    contents: messages,
  };

  if (systemInstruction) {
    body.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (jsonMode) {
    body.generationConfig = {
      response_mime_type: "application/json"
    };
  }

  const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && retryCount < 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(retryCount + 1);
    }

    return response;
  };

  const response = await fetchWithRetry();
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API call failed');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text === undefined) {
    throw new Error('No content returned from Gemini');
  }

  return text;
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

  return callGemini([{ role: 'user', parts: [{ text: prompt }] }], system);
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
 * Genera una breve citazione motivazionale giornaliera in inglese.
 */
export async function generateDailyQuote(): Promise<string> {
  const prompt = "Generate a short motivational quote in English for a real estate professional. Format: 'quote — Author'. Max 15 words total. No other text.";
  return callGemini([{ role: 'user', parts: [{ text: prompt }] }]);
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
