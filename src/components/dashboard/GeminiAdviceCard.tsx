import React, { useState, useEffect, useCallback } from "react";
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
  kpis: {
    contatti: number;
    vendite: number;
    notizieAttive: number;
    taskPending: number;
  };
}

export const GeminiAdviceCard: React.FC<GeminiAdviceCardProps> = ({ kpis }) => {
  const [advices, setAdvices] = useState<Advice[]>(() => {
    const cached = localStorage.getItem('gemini-advice-cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Cache for 24 hours to save quota
        if (Date.now() - timestamp < 1000 * 60 * 60 * 24) {
          return data;
        }
      } catch (e) {}
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(advices.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fallbackAdvices: Advice[] = [
    { icon: "📈", titolo: "Focus sui Lead", testo: "Analizza i lead con budget elevato che non hanno ricevuto contatti negli ultimi 3 giorni." },
    { icon: "🏠", titolo: "Qualità Notizie", testo: "Assicurati che tutte le nuove notizie abbiano foto professionali e descrizioni emozionali." },
    { icon: "🤝", titolo: "Follow-up", testo: "Pianifica una chiamata di cortesia per i clienti che hanno visitato un immobile la scorsa settimana." }
  ];

  const fetchAdvice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const system = "Sei un consulente strategico per agenti immobiliari di lusso in Italia. Rispondi sempre in italiano in formato JSON.";
      const prompt = `Analizza questi KPI dell'agente:
- Contatti: ${kpis.contatti}
- Vendite: ${kpis.vendite}
- Notizie Attive: ${kpis.notizieAttive}
- Task in sospeso: ${kpis.taskPending}

Fornisci 3 consigli brevi e azionabili per migliorare le performance.
Ritorna un array JSON di oggetti con questa struttura: [{ "icon": "emoji", "titolo": "string", "testo": "string" }].
Usa un tono professionale ed elegante.`;

      const response = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }] }],
        system,
        true
      );

      const data = JSON.parse(response);
      const adviceList = Array.isArray(data) ? data : fallbackAdvices;
      setAdvices(adviceList);
      
      // Cache the successful response
      localStorage.setItem('gemini-advice-cache', JSON.stringify({
        data: adviceList,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      console.error("Gemini Advice Error:", err);
      const msg = err?.message?.toLowerCase() || "";
      
      // If we have cached data, keep using it even if expired
      const cached = localStorage.getItem('gemini-advice-cache');
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
        // Silently use fallback, maybe log it
        console.warn("Gemini Quota exceeded, using fallback advice.");
      } else if (msg.includes("high demand") || msg.includes("overloaded") || msg.includes("503")) {
        console.warn("Gemini overloaded, using fallback advice.");
      } else {
        setError("Impossibile caricare i consigli personalizzati.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [kpis, fallbackAdvices]);

  useEffect(() => {
    // Only fetch if we don't have cached data or if explicitly requested
    if (advices.length === 0) {
      fetchAdvice();
    }
  }, [fetchAdvice, advices.length]);

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
          onClick={fetchAdvice}
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
                onClick={fetchAdvice}
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
