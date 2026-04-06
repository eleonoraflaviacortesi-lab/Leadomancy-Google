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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value} / {target}</span>
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

  const today = useMemo(() => new Date(), []);

  const todayAppointments = useMemo(() => {
    const local = appointments.filter(a => a.type !== 'task' && isSameDay(parseISO(a.start_time), today));
    const google = events.filter(e => isSameDay(parseISO(e.start.dateTime || e.start.date), today));
    const merged = [...local, ...google.map(e => ({ id: e.id, title: e.summary, time: format(parseISO(e.start.dateTime || e.start.date), 'HH:mm') }))];
    return merged.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, events, today]);

  const todayTasks = useMemo(() => appointments.filter(a => a.type === 'task' && isSameDay(parseISO(a.start_time), today) && !a.completed), [appointments, today]);

  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];
    todayAppointments.forEach(a => items.push({ id: a.id, priority: 'high', emoji: '📅', title: a.title, subtitle: `Oggi alle ${a.time}`, type: 'appointment', color: '#1A1A18' }));
    notizie.filter(n => n.reminder_date && new Date(n.reminder_date) < today && n.status !== 'sold' && n.status !== 'no').slice(0, 3).forEach(n => {
      const days = Math.floor((today.getTime() - new Date(n.reminder_date!).getTime()) / 86400000);
      items.push({ id: n.id, priority: 'high', emoji: '🔔', title: `Promemoria: ${n.name}`, subtitle: `Scaduto ${days === 0 ? 'oggi' : `${days} giorni fa`}`, type: 'reminder', color: '#E24B4A' });
    });
    clienti.filter(c => c.status !== 'closed_won' && c.status !== 'closed_lost').forEach(c => {
      const lastContact = c.last_contact_date || c.created_at;
      const days = Math.floor((today.getTime() - new Date(lastContact).getTime()) / 86400000);
      if (days > 14) items.push({ id: c.id, priority: days > 21 ? 'high' : 'medium', emoji: '📞', title: `Chiama ${c.nome} ${c.cognome}`, subtitle: `Nessun contatto da ${days} giorni`, type: 'call', color: days > 21 ? '#E24B4A' : '#EF9F27' });
    });
    todayTasks.forEach(t => items.push({ id: t.id, priority: 'medium', emoji: '✓', title: t.title, subtitle: 'Task di oggi', type: 'task', color: '#1D9E75' }));
    return items.sort((a, b) => a.priority === 'high' && b.priority !== 'high' ? -1 : 1);
  }, [notizie, clienti, todayAppointments, todayTasks, today]);

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
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>ALTAIR / Dashboard</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>Buongiorno, {user?.nome}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{format(today, 'EEEE d MMMM yyyy', { locale: it })}</p>
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

      {/* 2. Cosa fare adesso */}
      <div>
        <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">COSA FARE ADESSO</h3>
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {actionItems.length === 0 ? (
            <div className="px-5 py-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-[#166534] text-[13px] font-medium w-full">✓ Tutto in ordine — nessuna azione urgente oggi!</div>
          ) : actionItems.map(item => <ActionCard key={item.id} item={item} />)}
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-[var(--border-light)] rounded-[14px] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">PIPELINE ATTIVA</h3>
            <Link to="/properties" className="text-[11px] font-semibold text-[var(--text-primary)] hover:underline">Vedi tutte →</Link>
          </div>
          <div className="flex flex-col gap-1">
            {pipelineNotizie.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)] py-4 text-center">Nessuna notizia in pipeline.</p>
            ) : (
              pipelineNotizie.map(n => <PipelineRow key={n.id} n={n} />)
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white border border-[var(--border-light)] rounded-[14px] p-4 sm:p-5 shadow-sm">
          <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">I TUOI NUMERI</h3>
          <KPIProgressRow label="Contatti" value={kpiValues.contatti} target={kpiValues.contattiTarget} />
          <KPIProgressRow label="Notizie" value={kpiValues.notizie} target={kpiValues.notizieTarget} />
          <KPIProgressRow label="App. Vendita" value={kpiValues.appVendita} target={kpiValues.appVenditaTarget} />
          <KPIProgressRow label="Acquisizioni" value={kpiValues.acquisizioni} target={kpiValues.acquisizioniTarget} />
          <KPIProgressRow label="Incarichi" value={kpiValues.incarichi} target={kpiValues.incarichiTarget} />
          <p className="text-[13px] font-semibold mt-4 text-center">{avgPercent >= 80 ? "🔥 Ottimo ritmo — sei sulla strada giusta!" : avgPercent >= 50 ? "💪 Buon lavoro — spingi un po' di più!" : "⚡ Accelera — sei a metà mese!"}</p>
        </div>
      </div>

      {/* 4. Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeminiAdviceCard 
          notizieFreddhe={notizie.filter(n => Math.floor((today.getTime() - new Date(n.updated_at || n.created_at).getTime()) / 86400000) > 14).length}
          buyerSenzaContatto={clienti.filter(c => Math.floor((today.getTime() - new Date(c.last_contact_date || c.created_at).getTime()) / 86400000) > 14).length}
          pipelineValore={notizie.filter(n => n.status !== 'no' && n.status !== 'sold').reduce((sum, n) => sum + (n.prezzo_richiesto || 0), 0)}
          taskScadute={appointments.filter(a => a.type === 'task' && !a.completed && isAfter(today, parseISO(a.start_time))).length}
          appuntamentiSettimana={appointments.filter(a => a.type !== 'task' && isAfter(parseISO(a.start_time), today) && isAfter(endOfDay(new Date(today.getTime() + 7 * 86400000)), parseISO(a.start_time))).length}
        />
        <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">TREND 30 GIORNI</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--text-primary)]" /><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Contatti</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-[var(--text-muted)] border-dashed" /><span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Notizie</span></div>
            </div>
          </div>
          <div className="h-[160px] w-full -ml-2 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, fontFamily: 'Outfit' }} />
                <Line type="monotone" dataKey="contatti" stroke="#1A1A18" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="notizie" stroke="#9B9B95" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
