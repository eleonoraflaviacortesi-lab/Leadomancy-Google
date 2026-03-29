import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw } from "lucide-react";
import { callGemini } from "@/src/lib/gemini";
import { cn } from "@/src/lib/utils";

interface Advice {
  icon: string;
  titolo: string;
  testo: string;
}

interface GeminiAdviceCardProps {
  notizieFreddhe: number;
  buyerSenzaContatto: number;
  pipelineValore: number;
  taskScadute: number;
  appuntamentiSettimana: number;
}

export const GeminiAdviceCard: React.FC<GeminiAdviceCardProps> = ({ 
  notizieFreddhe, 
  buyerSenzaContatto, 
  pipelineValore, 
  taskScadute, 
  appuntamentiSettimana 
}) => {
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackAdvices = useMemo(() => [
    { icon: "📈", titolo: "Focus sui Lead", testo: "Analizza i lead con budget elevato che non hanno ricevuto contatti negli ultimi 3 giorni." },
    { icon: "🏠", titolo: "Qualità Notizie", testo: "Assicurati che tutte le nuove notizie abbiano foto professionali e descrizioni emozionali." },
    { icon: "🤝", titolo: "Follow-up", testo: "Pianifica una chiamata di cortesia per i clienti che hanno visitato un immobile la scorsa settimana." }
  ], []);

  const fetchAdvice = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);

    const cacheKey = 'leadomancy_gemini_advice';
    
    if (!force) {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { date, data } = JSON.parse(cached);
          const today = new Date().toDateString();
          if (date === today && Array.isArray(data) && data.length > 0) {
            setAdvices(data);
            setIsLoading(false);
            return; // Use cached, don't call API
          }
        } catch {}
      }
    }

    try {
      const system = "Sei un coach per agenti immobiliari di lusso. Rispondi sempre in italiano in formato JSON.";
      const prompt = `Sei un coach per agenti immobiliari di lusso. Dati dell'agente:
- Notizie "fredde" (>14gg senza aggiornamento): ${notizieFreddhe}
- Buyer senza contatto da >14gg: ${buyerSenzaContatto}
- Valore pipeline attiva: €${pipelineValore}
- Task scadute: ${taskScadute}
- Appuntamenti questa settimana: ${appuntamentiSettimana}

Dai 3 consigli SPECIFICI e PRATICI in italiano. 
Ogni consiglio max 2 frasi. Sii diretto, come un coach sportivo.
Formato JSON: [{"icon":"emoji","titolo":"string","testo":"string"}]`;

      const response = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }] }],
        system,
        true
      );

      const data = JSON.parse(response);
      const adviceList = Array.isArray(data) ? data : fallbackAdvices;
      setAdvices(adviceList);
      
      // Save to cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        date: new Date().toDateString(),
        data: adviceList
      }));
    } catch (err: any) {
      console.error("Gemini Advice Error:", err);
      const msg = err?.message?.toLowerCase() || "";
      
      // If we have cached data, keep using it even if expired
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          setAdvices(data);
          return;
        } catch (e) {}
      }

      // If no cache, use fallback instead of showing error
      setAdvices(fallbackAdvices);
      
      if (err?.status === 429 || msg.includes("quota") || msg.includes("429")) {
        console.warn("Gemini Quota exceeded, using fallback advice.");
      } else if (msg.includes("high demand") || msg.includes("overloaded") || msg.includes("503")) {
        console.warn("Gemini overloaded, using fallback advice.");
      } else {
        setError("Impossibile caricare i consigli personalizzati.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [notizieFreddhe, buyerSenzaContatto, pipelineValore, taskScadute, appuntamentiSettimana, fallbackAdvices]);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  return (
    <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-5 flex flex-col gap-4 shadow-sm h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--lavender-fg)]" />
          <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            CONSIGLI GEMINI
          </h3>
        </div>
        <button 
          onClick={() => fetchAdvice(true)}
          disabled={isLoading}
          className="p-1.5 hover:bg-[var(--bg-subtle)] rounded-full transition-colors disabled:opacity-50"
          title="Rigenera"
        >
          <RefreshCw size={14} className={cn("text-[var(--text-muted)]", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-col gap-4" key="loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-24 bg-[var(--bg-subtle)] rounded" />
                    <div className="h-2 w-full bg-[var(--bg-subtle)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-4 text-center" key="error">
              <p className="text-[12px] text-[var(--rose-fg)] font-outfit">{error}</p>
              <button 
                onClick={() => fetchAdvice(true)}
                className="mt-2 text-[11px] font-semibold text-[var(--text-primary)] hover:underline"
              >
                Riprova
              </button>
            </div>
          ) : (
            <motion.div 
              className="flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="content"
            >
              {advices.map((advice, idx) => (
                <div key={idx} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center text-lg shrink-0">
                    {advice.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-outfit font-bold text-[13px] text-[var(--text-primary)] leading-tight">
                      {advice.titolo}
                    </h4>
                    <p className="font-outfit text-[12px] text-[var(--text-secondary)] leading-snug">
                      {advice.testo}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
