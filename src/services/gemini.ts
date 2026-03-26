import { GoogleGenAI } from "@google/genai";
import { Cliente } from "@/src/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeCliente(cliente: Cliente): Promise<string> {
  const prompt = `
    Analizza questo potenziale acquirente di immobili di lusso in Italia e fornisci un profilo sintetico e strategico.
    
    Dati Cliente:
    - Nome: ${cliente.nome} ${cliente.cognome}
    - Paese: ${cliente.paese}
    - Budget: ${cliente.budget_max} €
    - Regioni di interesse: ${cliente.regioni?.join(', ')}
    - Tipologie cercate: ${cliente.tipologia?.join(', ')}
    - Stile preferito: ${cliente.stile}
    - Contesto: ${cliente.contesto?.join(', ')}
    - Caratteristiche: ${cliente.camere} camere, ${cliente.bagni} bagni, ${cliente.dimensione_min}-${cliente.dimensione_max} mq
    - Uso: ${cliente.uso}
    - Note: ${cliente.descrizione}
    
    Fornisci l'analisi in italiano con questo formato:
    ## Profilo Psicografico
    (Chi è questo cliente? Quali sono le sue motivazioni profonde?)
    
    ## Analisi del Budget
    (Il budget è coerente con le richieste e le zone?)
    
    ## Strategia di Vendita
    (Quali immobili proporre? Come approcciare la comunicazione?)
    
    ## Punti di Attenzione
    (Eventuali criticità o segnali da monitorare)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Impossibile generare l'analisi al momento.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Errore durante l'analisi AI.";
  }
}

export async function generateDailyQuote(): Promise<{ quote: string; author: string }> {
  const prompt = "Genera una citazione breve (massimo 15 parole) sulla crescita personale, nello stile di Insight Timer (autori come Paulo Coelho, Seneca, Einstein, ecc.). Rispondi esclusivamente in formato JSON: {\"quote\": \"...\", \"author\": \"...\"}. Lingua: italiano.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{"quote": "La casa è dove risiede l\'anima.", "author": "Anonimo"}');
  } catch (error) {
    console.error("Gemini quote error:", error);
    return { quote: "L'eccellenza non è un atto, ma un'abitudine.", author: "Aristotele" };
  }
}
