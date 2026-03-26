import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Calendar, 
  Target, 
  Award, 
  Clock, 
  ArrowRight,
  Star
} from "lucide-react";
import { format, isToday, parseISO, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useAuth } from "@/src/hooks/useAuth";
import { useKPIs } from "@/src/hooks/useKPIs";
import { useDailyData } from "@/src/hooks/useDailyData";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useProfiles } from "@/src/hooks/useProfiles";
import { generateDailyQuote } from "@/src/services/gemini";
import { cn, formatCurrency } from "@/src/lib/utils";
import { Link } from "react-router-dom";

const Star8Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10, flexShrink: 0, color: 'var(--text-muted)', opacity: 0.6 }}>
    <path d="M12 0 L14.1 8.5 L21.6 4.4 L16.5 11 L24 12 L16.5 13 L21.6 19.6 L14.1 15.5 L12 24 L9.9 15.5 L2.4 19.6 L7.5 13 L0 12 L7.5 11 L2.4 4.4 L9.9 8.5 Z" />
  </svg>
);

const KPICard = ({ label, kpi, isCurrency = false }: { label: string; kpi: any; isCurrency?: boolean }) => {
  if (!kpi) return null;
  
  const getProgressColor = (percent: number) => {
    if (percent < 50) return "#F5A0B0";
    if (percent < 80) return "#F5C842";
    return "#B8E0C8";
  };

  return (
    <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-outfit font-medium text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-medium",
          kpi.delta >= 0 ? "text-[var(--sage-fg)]" : "text-[var(--rose-fg)]"
        )}>
          {kpi.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta)}
        </div>
      </div>
      
      <div className="font-outfit font-semibold text-[32px] text-[var(--text-primary)] tracking-tight">
        {isCurrency ? formatCurrency(kpi.value) : kpi.value}
      </div>

      <div className="w-full h-[3px] bg-[var(--border-light)] rounded-full overflow-hidden mt-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(kpi.percent, 100)}%` }}
          className="h-full"
          style={{ backgroundColor: getProgressColor(kpi.percent) }}
        />
      </div>
    </div>
  );
};

export const PersonalDashboard: React.FC<{ isOfficeView?: boolean }> = ({ isOfficeView = false }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { kpis, isLoading: isKPIsLoading } = useKPIs(period, isOfficeView);
  const { myData, allData } = useDailyData();
  const { appointments } = useAppointments();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { profiles } = useProfiles();

  const sourceData = isOfficeView ? allData : myData;

  // Daily Quote
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const cached = sessionStorage.getItem('leadomancy_quote_today');
      
      if (cached) {
        const { date, data } = JSON.parse(cached);
        if (date === today) {
          setQuote(data);
          setIsQuoteLoading(false);
          return;
        }
      }

      const newQuote = await generateDailyQuote();
      setQuote(newQuote);
      sessionStorage.setItem('leadomancy_quote_today', JSON.stringify({ date: today, data: newQuote }));
      setIsQuoteLoading(false);
    };

    fetchQuote();
  }, []);

  // Today's Reminders & Appointments
  const todayReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const clientReminders = clienti
      .filter(c => c.reminder_date === today)
      .map(c => ({ id: c.id, title: `Richiamare ${c.nome} ${c.cognome}`, type: 'cliente' }));
    
    const notiziaReminders = notizie
      .filter(n => n.reminder_date === today)
      .map(n => ({ id: n.id, title: `Follow-up: ${n.nome || n.name}`, type: 'notizia' }));

    return [...clientReminders, ...notiziaReminders];
  }, [clienti, notizie]);

  const nextAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => parseISO(a.start_time) >= now)
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
      .slice(0, 2);
  }, [appointments]);

  // Chart Data (Last 30 days)
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayData = sourceData.find(r => r.date === date);
      return {
        date: format(new Date(date), 'dd/MM'),
        contatti: dayData?.contatti_reali || 0,
        notizie: dayData?.notizie_reali || 0
      };
    });
  }, [sourceData]);

  const formattedDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: it });
  const quoteText = isQuoteLoading ? 'CARICAMENTO...' : quote ? `${quote.quote.toUpperCase()} — ${quote.author.toUpperCase()}` : '';

  return (
    <div className="flex flex-col gap-8 pt-6 pb-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          
          {/* Left: greeting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0 }}>
              Buongiorno, {user?.nome?.split(' ')[0] || ''}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Outfit', margin: 0 }}>
              {formattedDate}
            </p>
          </div>

          {/* Right: quote */}
          <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, maxWidth: '55%' }}>
            <Star8Icon />
            <span style={{ 
              fontSize: 11, 
              fontWeight: 500, 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase', 
              color: 'var(--text-muted)', 
              fontFamily: 'Outfit',
              textAlign: 'right',
              lineHeight: 1.5
            }}>
              {quoteText}
            </span>
            <Star8Icon />
          </div>

        </div>
      </div>


      {/* OGGI Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[var(--border-light)] rounded-[14px] p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)]">
              OGGI
            </h3>
            <Link to="/activities" className="text-[11px] font-outfit font-semibold text-[var(--text-primary)] flex items-center gap-1 hover:underline">
              Vedi Calendario <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Reminders */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase">Promemoria</span>
              <div className="flex flex-col gap-3">
                {todayReminders.length > 0 ? todayReminders.map(rem => (
                  <div key={rem.id} className="flex items-center gap-3 p-3 bg-[var(--bg-subtle)] rounded-[10px]">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      rem.type === 'cliente' ? "bg-[#C8B8F5]" : "bg-[#FEF5D0]"
                    )} />
                    <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)]">{rem.title}</span>
                  </div>
                )) : (
                  <p className="text-[12px] text-[var(--text-muted)] italic">Nessun promemoria per oggi</p>
                )}
              </div>
            </div>

            {/* Next Appointments */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase">Prossimi Appuntamenti</span>
              <div className="flex flex-col gap-3">
                {nextAppointments.length > 0 ? nextAppointments.map(app => (
                  <Link key={app.id} to="/activities" className="flex flex-col gap-1 p-3 bg-[var(--bg-subtle)] rounded-[10px] hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-outfit font-bold text-black">{app.time}</span>
                      <Clock size={12} className="text-[var(--text-muted)]" />
                    </div>
                    <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)] truncate">{app.title}</span>
                    {app.cliente_id && (
                      <span className="text-[11px] font-outfit text-[var(--text-muted)]">
                        {clienti.find(c => c.id === app.cliente_id)?.nome} {clienti.find(c => c.id === app.cliente_id)?.cognome}
                      </span>
                    )}
                  </Link>
                )) : (
                  <p className="text-[12px] text-[var(--text-muted)] italic">Nessun appuntamento in programma</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] flex">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-2 rounded-full font-outfit text-[11px] font-semibold uppercase transition-all",
                  period === p ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Anno'}
              </button>
            ))}
          </div>

          <Link 
            to="/inserisci"
            className="w-full bg-[#1A1A18] text-white py-4 rounded-[14px] font-outfit font-bold text-[14px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <FileText size={18} />
            Inserisci Report
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Contatti" kpi={kpis?.contatti} />
        <KPICard label="Notizie" kpi={kpis?.notizie} />
        <KPICard label="Clienti Gestiti" kpi={kpis?.clienti} />
        <KPICard label="App. Vendita" kpi={kpis?.appuntamenti} />
        <KPICard label="Acquisizioni" kpi={kpis?.acquisizioni} />
        <KPICard label="Incarichi" kpi={kpis?.incarichi} />
        <KPICard label="Vendite" kpi={kpis?.vendite} />
        <KPICard label="Fatturato" kpi={kpis?.fatturato} isCurrency />
      </div>

      {/* Performance Chart */}
      <div className="hidden md:block bg-white border border-[var(--border-light)] rounded-[14px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)]">
            Performance (Ultimi 30 giorni)
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C8B8F5]" />
              <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Contatti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#B8E0C8]" />
              <span className="text-[11px] font-outfit font-medium text-[var(--text-muted)] uppercase">Notizie</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontFamily: 'Outfit', fill: 'var(--text-muted)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontFamily: 'Outfit', fill: 'var(--text-muted)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  fontFamily: 'Outfit'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="contatti" 
                stroke="#C8B8F5" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="notizie" 
                stroke="#B8E0C8" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Ranking */}
      {(user?.role === 'coordinatore' || user?.role === 'admin') && (
        <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-6 shadow-sm overflow-hidden">
          <h3 className="font-outfit font-bold text-[12px] uppercase tracking-widest text-[var(--text-muted)] mb-6">
            Ranking Agenti (Sede {user.sede})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-light)]">
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] w-16">Pos.</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)]">Agente</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Contatti</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Notizie</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Vendite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {profiles
                  .filter(p => p.sede === user.sede)
                  .map((p, i) => (
                    <tr key={p.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-4 font-outfit font-bold text-[14px]">
                        {i === 0 ? (
                          <div className="w-8 h-8 rounded-full bg-[#FEF5D0] text-[#5C3800] flex items-center justify-center text-[12px]">
                            #1 ★
                          </div>
                        ) : (
                          <span className="pl-3 text-[var(--text-muted)]">{i + 1}</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{p.avatar_emoji || '👤'}</span>
                          <span className="font-outfit font-medium text-[14px] text-[var(--text-primary)]">{p.full_name || `${p.nome} ${p.cognome}`}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">12</td>
                      <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">8</td>
                      <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">2</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
