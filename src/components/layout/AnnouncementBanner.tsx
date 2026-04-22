import React, { useMemo, useState, useEffect } from 'react';
import { useBannerSettings } from '@/src/hooks/useBannerSettings';
import { useKPIs } from '@/src/hooks/useKPIs';
import { formatCurrency, cn } from '@/src/lib/utils';
import { generateDailyQuote } from '@/src/lib/gemini';

const Star8 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 mx-3 opacity-80">
    <path d="M12,2 L13.5,8.5 L19,6 L15.5,10.5 L22,12 L15.5,13.5 L19,18 L13.5,15.5 L12,22 L10.5,15.5 L5,18 L8.5,13.5 L2,12 L8.5,10.5 L5,6 L10.5,8.5 Z" />
  </svg>
);

export const AnnouncementBanner: React.FC = () => {
  const { settings, isLoading: isSettingsLoading } = useBannerSettings();
  const { kpis: yearKpisData, isLoading: isYearLoading } = useKPIs('year', true);
  const { kpis: monthKpisData, isLoading: isMonthLoading } = useKPIs('month', true);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  const yearKpis = yearKpisData;
  const monthKpis = monthKpisData;

  useEffect(() => {
    const today = new Date().toDateString();
    try {
      const cached = sessionStorage.getItem('altair_quote_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.text) { 
          setQuote({ text: parsed.text, author: parsed.author || '' }); 
          return; 
        }
      }
    } catch {}
    
    generateDailyQuote().then(q => {
      if (q && q.quote) {
        const text = q.quote;
        const author = q.author || 'Unknown';
        setQuote({ text, author });
        sessionStorage.setItem('altair_quote_v3', 
          JSON.stringify({ date: today, text, author }));
      }
    });
  }, []);

  const tickerItems = useMemo(() => {
    // Fallback if we really have nothing
    const fallback = ['BENVENUTO IN LEADOMANCY', 'OBIETTIVO FATTURATO AGENZIA', 'VENDITE DEL MESE'];
    
    // If we have KPIs, use them. If not, we might still be loading.
    // We want to avoid returning fallback if we are just about to get data.
    const hasData = yearKpis && monthKpis;

    const replaceTemplates = (text: string) => {
      if (!text) return '';
      if (!hasData) return text;
      return text
        .replace('{remaining}', formatCurrency(Math.max(0, (yearKpis.fatturato?.target || 0) - (yearKpis.fatturato?.value || 0))))
        .replace('{target}', formatCurrency(yearKpis.fatturato?.target || 0))
        .replace('{fatturatoCredito}', formatCurrency(yearKpis.fatturatoCredito?.value || 0));
    };

    const items = [
      settings.text1,
      settings.text2,
      settings.text3,
      settings.text4
    ]
      .filter(Boolean)
      .map(t => replaceTemplates(t).toUpperCase())
      .filter(Boolean);

    if (hasData) {
      const fatturatoTarget = yearKpis.fatturato?.target || 0;
      const fatturatoActual = yearKpis.fatturato?.value || 0;
      const fatturatoRemaining = Math.max(0, fatturatoTarget - fatturatoActual);
      const fatturatoPercent = fatturatoTarget > 0
        ? Math.round((fatturatoActual / fatturatoTarget) * 100)
        : 0;

      items.push(`OBIETTIVO FATTURATO ANNUALE ${formatCurrency(fatturatoTarget)}`.toUpperCase());
      items.push(`FATTURATO REALIZZATO ${formatCurrency(fatturatoActual)} (${fatturatoPercent}%)`.toUpperCase());
      items.push(`MANCANO AL TRAGUARDO ${formatCurrency(fatturatoRemaining)}`.toUpperCase());
      items.push(`VENDITE MESE ${monthKpis.vendite?.value || 0} / TARGET ${monthKpis.vendite?.target || 0}`.toUpperCase());
      items.push(`INCARICHI MESE ${monthKpis.incarichi?.value || 0} / TARGET ${monthKpis.incarichi?.target || 0}`.toUpperCase());
    } else {
      items.push('CARICAMENTO OBIETTIVI...');
    }
    
    if (quote) {
      const quoteText = `"${quote.text}" — ${quote.author}`;
      items.splice(Math.floor(items.length / 2), 0, quoteText);
    }

    return items.length > 0 ? items : fallback;
  }, [settings, yearKpis, monthKpis, quote, isYearLoading, isMonthLoading]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden select-none"
      style={{ 
        height: '34px',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="flex items-center h-[34px] relative">
        <div 
          className="flex items-center whitespace-nowrap animate-ticker"
          style={{ 
            animationDuration: `${settings.speed}s`
          }}
        >
          {/* Render twice for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {tickerItems.map((item, index) => {
                const isQuote = item.startsWith('"');
                return (
                  <React.Fragment key={index}>
                    <span 
                      className={cn(
                        "font-outfit text-[11px] font-semibold tracking-[0.15em]",
                        isQuote && "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse-slow"
                      )}
                    >
                      {item}
                    </span>
                    <Star8 />
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
