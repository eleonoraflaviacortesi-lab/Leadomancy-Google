import React, { useState, useMemo, useEffect } from "react";
import { format, isSameDay, parseISO, isAfter, endOfDay, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { useAuth } from "@/src/hooks/useAuth";
import { useKPIs } from "@/src/hooks/useKPIs";
import { useDailyData } from "@/src/hooks/useDailyData";
import { useTodayReportStatus } from "@/src/hooks/useTodayReportStatus";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useCategoryColors } from "@/src/hooks/useCategoryColors";
import { useEventOverrides } from "@/src/hooks/useEventOverrides";
import { cn, formatCurrency } from "@/src/lib/utils";
import { GeminiAdviceCard } from "./GeminiAdviceCard";

interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  emoji: string;
  title: string;
  subtitle: string;
  type: 'appointment' | 'reminder' | 'call' | 'task';
  color: string;
}

const ActionCard = ({ item }: { item: ActionItem }) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    padding: '14px 16px',
    borderLeft: `3px solid ${item.color}`,
    border: `1px solid var(--border-light)`,
    minWidth: 220,
    maxWidth: 260,
    cursor: 'pointer',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 18 }}>{item.emoji}</span>
      <span style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: item.color,
        background: `${item.color}15`, padding: '2px 7px', borderRadius: 999
      }}>
        {item.priority === 'high' ? 'Urgente' : 'Da fare'}
      </span>
    </div>
    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', 
      margin: '0 0 4px', lineHeight: 1.3 }}>
      {item.title}
    </p>
    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
      {item.subtitle}
    </p>
  </div>
);

const PipelineRow = ({ n }: { n: any }) => {
  const days = Math.floor((Date.now() - new Date(n.updated_at || n.created_at).getTime()) / 86400000);
  const temp = days < 7 ? { label: 'Attiva', color: '#1D9E75' } : days < 14 ? { label: 'Tiepida', color: '#EF9F27' } : { label: 'Fredda', color: '#E24B4A' };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-subtle)] px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("w-2 h-2 rounded-full shrink-0", temp.color === '#1D9E75' ? "bg-[var(--sage-fg)]" : temp.color === '#EF9F27' ? "bg-[var(--amber-fg)]" : "bg-[var(--rose-fg)]")} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-outfit font-medium text-[14px] text-[var(--text-primary)] truncate">{n.name}</span>
          <span className="font-outfit text-[11px] text-[var(--text-muted)] uppercase tracking-wider">{n.zona}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-outfit font-semibold text-[12px]" style={{ color: temp.color }}>{temp.label}</span>
        <span className="font-outfit font-semibold text-[14px] text-[var(--text-primary)]">{formatCurrency(n.prezzo_richiesto || 0)}</span>
      </div>
    </div>
  );
};

const KPIProgressRow = ({ label, value, target }: { label: string, value: number, target: number }) => {
  const percent = (value / target) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{value} / {target}</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--bg-subtle)' }}>
        <div style={{ 
          height: '100%', borderRadius: 999,
          width: `${Math.min(percent, 100)}%`,
          background: percent >= 80 ? '#1D9E75' : percent >= 50 ? '#EF9F27' : '#E24B4A',
          transition: 'width 800ms ease'
        }} />
      </div>
    </div>
  );
};

export const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { kpis } = useKPIs(period);
  const { myData } = useDailyData();
  const { hasReportedToday } = useTodayReportStatus();
  const { appointments } = useAppointments();
  const { events } = useGoogleCalendar();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { colors } = useCategoryColors();
  const { overrides } = useEventOverrides();

  const today = useMemo(() => new Date(), []);

  const todayAppointments = useMemo(() => {
    const local = appointments.filter(a => a.type !== 'task' && isSameDay(parseISO(a.start_time), today));
    const google = events.filter(e => isSameDay(parseISO(e.start.dateTime || e.start.date), today));
    const merged = [
      ...local.map(a => {
        const override = overrides[a.id];
        return { 
          id: a.id, 
          title: a.title, 
          time: format(parseISO(a.start_time), 'HH:mm'),
          color: override?.card_color !== undefined ? override.card_color : (
            a.card_color || (
              a.cliente_id ? colors.cliente_reminder :
              a.notizia_id ? colors.notizia_reminder :
              colors.appointment
            )
          )
        };
      }), 
      ...google.map(e => {
        const override = overrides[e.id];
        return { 
          id: e.id, 
          title: e.summary, 
          time: format(parseISO(e.start.dateTime || e.start.date), 'HH:mm'),
          color: override?.card_color || e.calendarColor || '#1a73e8'
        };
      })
    ];
    return merged.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, events, today, colors, overrides]);

  const todayTasks = useMemo(() => appointments.filter(a => a.type === 'task' && isSameDay(parseISO(a.start_time), today) && !a.completed), [appointments, today]);

  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];
    todayAppointments.forEach(a => items.push({ id: a.id, priority: 'high', emoji: '📅', title: a.title, subtitle: `Oggi alle ${a.time}`, type: 'appointment', color: colors.appointment }));
    notizie.filter(n => n.reminder_date && new Date(n.reminder_date) < today && n.status !== 'sold' && n.status !== 'no').slice(0, 3).forEach(n => {
      const days = Math.floor((today.getTime() - new Date(n.reminder_date!).getTime()) / 86400000);
      items.push({ id: n.id, priority: 'high', emoji: '🔔', title: `Promemoria: ${n.name}`, subtitle: `Scaduto ${days === 0 ? 'oggi' : `${days} giorni fa`}`, type: 'reminder', color: colors.notizia_reminder });
    });
    clienti.filter(c => c.status !== 'closed_won' && c.status !== 'closed_lost').forEach(c => {
      const lastContact = c.last_contact_date || c.created_at;
      const days = Math.floor((today.getTime() - new Date(lastContact).getTime()) / 86400000);
      if (days > 14) items.push({ id: c.id, priority: days > 21 ? 'high' : 'medium', emoji: '📞', title: `Chiama ${c.nome} ${c.cognome}`, subtitle: `Nessun contatto da ${days} giorni`, type: 'call', color: colors.cliente_reminder });
    });
    todayTasks.forEach(t => items.push({ id: t.id, priority: 'medium', emoji: '✓', title: t.title, subtitle: 'Task di oggi', type: 'task', color: colors.task }));
    return items.sort((a, b) => a.priority === 'high' && b.priority !== 'high' ? -1 : 1);
  }, [notizie, clienti, todayAppointments, todayTasks, today, colors]);

  const pipelineNotizie = useMemo(() => notizie.filter(n => n.status !== 'no' && n.status !== 'sold').sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime()).slice(0, 6), [notizie]);

  const chartData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayData = myData.find(r => r.date === dateStr);
    return { date: format(d, 'dd/MM'), contatti: dayData?.contatti_reali || 0, notizie: dayData?.notizie_reali || 0 };
  }), [myData]);

  const kpiValues = useMemo(() => ({
    contatti: kpis?.contatti?.value || 0, contattiTarget: kpis?.contatti?.target || 100,
    notizie: kpis?.notizie?.value || 0, notizieTarget: kpis?.notizie?.target || 10,
    appVendita: kpis?.appuntamenti?.value || 0, appVenditaTarget: kpis?.appuntamenti?.target || 20,
    acquisizioni: kpis?.acquisizioni?.value || 0, acquisizioniTarget: kpis?.acquisizioni?.target || 5,
    incarichi: kpis?.incarichi?.value || 0, incarichiTarget: kpis?.incarichi?.target || 5,
  }), [kpis]);

  const avgPercent = (kpiValues.contatti / kpiValues.contattiTarget + kpiValues.notizie / kpiValues.notizieTarget + kpiValues.appVendita / kpiValues.appVenditaTarget + kpiValues.acquisizioni / kpiValues.acquisizioniTarget + kpiValues.incarichi / kpiValues.incarichiTarget) / 5 * 100;

  return (
    <div className="flex flex-col gap-8 pb-10 w-full font-outfit">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1 mt-8">
            ALTAIR / Dashboard
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0">
            Buongiorno, {user?.nome}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] capitalize mt-1">
            {format(today, 'EEEE d MMMM yyyy', { locale: it })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="bg-white p-1 rounded-full border border-[var(--border-light)] flex shadow-sm overflow-x-auto hide-scrollbar">
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("flex-1 sm:flex-none px-4 py-1.5 rounded-full font-semibold text-[11px] uppercase transition-all whitespace-nowrap", period === p ? "bg-[var(--text-primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}>
                {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Anno'}
              </button>
            ))}
          </div>
          {!hasReportedToday && (
            <div className="flex items-center gap-2 bg-[#FEF9C3] rounded-[10px] px-3.5 py-2 border border-[#FDE047] justify-center">
              <span className="text-[16px]">⚠️</span>
              <span className="text-[12px] font-medium text-[#854D0E] font-outfit">
                Non hai ancora inserito il report di oggi
              </span>
              <Link to="/inserisci" className="text-[11px] font-bold text-[#854D0E] font-outfit underline ml-1 whitespace-nowrap">
                Inserisci ora →
              </Link>
            </div>
          )}

          {hasReportedToday && (
            <div className="flex items-center gap-2 bg-[#F0FDF4] rounded-[10px] px-3.5 py-2 border border-[#BBF7D0] justify-center">
              <span className="text-[16px]">✅</span>
              <span className="text-[12px] font-medium text-[#166534] font-outfit">
                Report di oggi inserito
              </span>
            </div>
          )}
          <Link to="/inserisci" className="w-full sm:w-auto bg-[var(--text-primary)] text-white px-5 py-2.5 sm:py-2 rounded-full font-semibold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap">
            <FileText size={14} /> Inserisci Ciclo
          </Link>
        </div>
      </div>

      {/* ROW 1: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* COL 1: Calendario di oggi */}
        <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 shadow-sm">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
            Calendario di Oggi
          </h3>
          {todayAppointments.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)] py-4 text-center">
              Nessun appuntamento oggi
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {todayAppointments.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-[10px]" style={{ backgroundColor: `${a.color}10` }}>
                  <span className="text-[10px] font-bold w-9 flex-shrink-0" style={{ color: a.color }}>
                    {a.time}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                    {a.title}
                  </span>
                </div>
              ))}
              {todayAppointments.length > 4 && (
                <p className="text-[10px] text-[var(--text-muted)] text-center mt-0.5">
                  +{todayAppointments.length - 4} altri
                </p>
              )}
            </div>
          )}
        </div>

        {/* COL 2: Progress Incarichi vs Obiettivo */}
        <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 shadow-sm">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
            I Tuoi Numeri
          </h3>
          <KPIProgressRow label="Contatti" value={kpiValues.contatti} target={kpiValues.contattiTarget} />
          <KPIProgressRow label="Notizie" value={kpiValues.notizie} target={kpiValues.notizieTarget} />
          <KPIProgressRow label="App. Vendita" value={kpiValues.appVendita} target={kpiValues.appVenditaTarget} />
          <KPIProgressRow label="Incarichi" value={kpiValues.incarichi} target={kpiValues.incarichiTarget} />
        </div>

        {/* COL 3: Progress Contatti + Notizie con grafico */}
        <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Trend 30 Giorni
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Contatti</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full border border-dashed border-[var(--text-muted)]" />
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Notizie</span>
              </div>
            </div>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 10, fontFamily: 'Outfit' }} />
                <Line type="monotone" dataKey="contatti" stroke="#1A1A18" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="notizie" stroke="#9B9B95" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 2: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* COL 1: Consigli Gemini */}
        <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 shadow-sm">
          <GeminiAdviceCard
            notizieFreddhe={notizie.filter(n => Math.floor((today.getTime() - new Date(n.updated_at || n.created_at).getTime()) / 86400000) > 14).length}
            buyerSenzaContatto={clienti.filter(c => Math.floor((today.getTime() - new Date(c.last_contact_date || c.created_at).getTime()) / 86400000) > 14).length}
            pipelineValore={notizie.filter(n => n.status !== 'no' && n.status !== 'sold').reduce((sum, n) => sum + (n.prezzo_richiesto || 0), 0)}
            taskScadute={appointments.filter(a => a.type === 'task' && !a.completed && isAfter(today, parseISO(a.start_time))).length}
            appuntamentiSettimana={appointments.filter(a => a.type !== 'task' && isAfter(parseISO(a.start_time), today) && isAfter(endOfDay(new Date(today.getTime() + 7 * 86400000)), parseISO(a.start_time))).length}
            notizieList={notizie.filter(n => Math.floor((today.getTime() - new Date(n.updated_at || n.created_at).getTime()) / 86400000) > 14).slice(0, 3).map(n => n.name)}
            buyerList={clienti.filter(c => Math.floor((today.getTime() - new Date(c.last_contact_date || c.created_at).getTime()) / 86400000) > 14).slice(0, 3).map(c => `${c.nome} ${c.cognome}`)}
          />
        </div>

        {/* COL 2: Volume a Credito — dark card */}
        <div className="bg-[#1A1A18] rounded-[20px] p-4 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
            Volume a Credito
          </span>
          <div className="mt-6">
            <p className="text-[32px] font-bold text-white leading-none mb-1">
              {formatCurrency(kpis?.fatturatoCredito?.value || 0)}
            </p>
            <p className="text-[10px] text-white/40">
              fatturato maturato non ancora incassato
            </p>
          </div>
        </div>

        {/* COL 3: Volume Generato — dark card */}
        <div className="bg-[#1A1A18] rounded-[20px] p-4 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
            Volume Generato
          </span>
          <div className="mt-6">
            <p className="text-[32px] font-bold text-white leading-none mb-1">
              {formatCurrency(kpis?.fatturato?.value || 0)}
            </p>
            <p className="text-[10px] text-white/40">
              fatturato realizzato nel periodo
            </p>
          </div>
        </div>

        {/* COL 4: Complimenti Gemini — use GeminiAdviceCard or a simple card */}
        <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-4 shadow-sm flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            ✦ Il tuo momento
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed flex-1">
            {avgPercent >= 80
              ? "🔥 Ottimo ritmo! Sei sulla strada giusta — continua così."
              : avgPercent >= 50
              ? "💪 Buon lavoro! Con un piccolo sprint in più raggiungi il target."
              : "⚡ Sei a metà — accelera! Ogni contatto in più conta."}
          </p>
          <div className="mt-auto">
            <div className="h-1 rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(avgPercent, 100)}%`,
                  background: avgPercent >= 80 ? '#1D9E75' : avgPercent >= 50 ? '#EF9F27' : '#E24B4A'
                }}
              />
            </div>
            <p className="text-[9px] text-[var(--text-muted)] mt-1 text-right">
              {Math.round(avgPercent)}% degli obiettivi raggiunti
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
