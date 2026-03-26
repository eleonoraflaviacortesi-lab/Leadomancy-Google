import React, { useMemo } from 'react';
import { useBannerSettings } from '@/src/hooks/useBannerSettings';
import { useKPIs } from '@/src/hooks/useKPIs';
import { formatCurrency } from '@/src/lib/utils';

const Star8 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 mx-3 opacity-80">
    <path d="M12 0 L14.1 8.5 L21.6 4.4 L16.5 11 L24 12 L16.5 13 L21.6 19.6 L14.1 15.5 L12 24 L9.9 15.5 L2.4 19.6 L7.5 13 L0 12 L7.5 11 L2.4 4.4 L9.9 8.5 Z" />
  </svg>
);

export const AnnouncementBanner: React.FC = () => {
  const { settings, isLoading: isSettingsLoading } = useBannerSettings();
  const { kpis: yearKpis, isLoading: isYearLoading } = useKPIs('year', true);
  const { kpis: monthKpis, isLoading: isMonthLoading } = useKPIs('month', true);

  const tickerItems = useMemo(() => {
    // Default fallback texts if KPI data is not ready
    const fallbackTexts = ['BENVENUTO IN LEADOMANCY', 'OBIETTIVO FATTURATO AGENZIA', 'VENDITE DEL MESE'];
    
    if (!yearKpis || !monthKpis) return fallbackTexts;

    const replaceTemplates = (text: string) => {
      if (!text) return '';
      return text
        .replace('{remaining}', formatCurrency(Math.max(0, (yearKpis.fatturato?.target || 0) - (yearKpis.fatturatoCredito?.value || 0))))
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
      .map(replaceTemplates)
      .filter(Boolean);

    // Append extra items
    items.push(`VENDITE ${monthKpis.vendite?.value || 0}/${monthKpis.vendite?.target || 0}`);
    items.push(`INCARICHI MESE ${monthKpis.incarichi?.value || 0}/${monthKpis.incarichi?.target || 0}`);

    return items.length > 0 ? items : fallbackTexts;
  }, [settings, yearKpis, monthKpis]);

  console.log("Banner rendering, texts:", tickerItems);

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
              {tickerItems.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="font-outfit text-[11px] font-semibold uppercase tracking-[0.15em]">
                    {item}
                  </span>
                  <Star8 />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
