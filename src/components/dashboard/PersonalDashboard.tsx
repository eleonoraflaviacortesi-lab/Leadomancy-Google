import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  ArrowRight,
  Circle,
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  Award,
  GripVertical,
  Layout as LayoutIcon,
  X
} from "lucide-react";
import { format } from "date-fns";
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
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/src/hooks/useAuth";
import { useKPIs } from "@/src/hooks/useKPIs";
import { useDailyData } from "@/src/hooks/useDailyData";
import { useAppointments } from "@/src/hooks/useAppointments";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useProfiles } from "@/src/hooks/useProfiles";
import { cn, formatCurrency } from "@/src/lib/utils";
import { Link } from "react-router-dom";
import { KPICard } from "./KPICard";
import { GeminiAdviceCard } from "./GeminiAdviceCard";

type WidgetId = 
  | 'oggi' | 'pipeline' | 'upcoming' | 'trend' | 'gemini'
  | 'kpi-contatti' | 'kpi-notizie' | 'kpi-clienti' | 'kpi-appuntamenti' 
  | 'kpi-acquisizioni' | 'kpi-incarichi' | 'kpi-vendite' | 'kpi-fatturato';

interface DashboardLayout {
  main: WidgetId[];
  side: WidgetId[];
}

const LAYOUT_VERSION = 'v7';

const DEFAULT_LAYOUT: DashboardLayout = {
  main: [
    'oggi', 
    'kpi-contatti', 'kpi-notizie', 'kpi-clienti', 'kpi-appuntamenti',
    'kpi-acquisizioni', 'kpi-incarichi', 'kpi-vendite', 'kpi-fatturato',
    'pipeline'
  ],
  side: ['gemini', 'upcoming', 'trend']
};

export const PersonalDashboard: React.FC<{ isOfficeView?: boolean }> = ({ isOfficeView = false }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    const saved = localStorage.getItem('leadomancy-dashboard-layout');
    const savedVersion = localStorage.getItem('leadomancy-dashboard-layout-version');
    
    if (saved && savedVersion === LAYOUT_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_LAYOUT, ...parsed };
      } catch (e) {
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  const { kpis } = useKPIs(period, isOfficeView);
  const { myData, allData } = useDailyData();
  const { appointments } = useAppointments();
  const { notizie } = useNotizie();
  const { profiles } = useProfiles();

  const sourceData = isOfficeView ? allData : myData;

  // Save layout
  useEffect(() => {
    localStorage.setItem('leadomancy-dashboard-layout', JSON.stringify(layout));
    localStorage.setItem('leadomancy-dashboard-layout-version', LAYOUT_VERSION);
  }, [layout]);

  // Today's Items
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayAppointments = useMemo(() => appointments
    .filter(a => a.type !== 'task' && a.start_time.startsWith(todayStr))
    .sort((a, b) => a.start_time.localeCompare(b.start_time)), [appointments, todayStr]);

  const todayTasks = useMemo(() => appointments
    .filter(a => a.type === 'task' && a.start_time.startsWith(todayStr) && !a.completed)
    .sort((a, b) => a.start_time.localeCompare(b.start_time)), [appointments, todayStr]);

  const upcomingAppointments = useMemo(() => appointments
    .filter(a => a.type !== 'task' && a.start_time >= todayStr && !a.start_time.startsWith(todayStr))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 3), [appointments, todayStr]);

  // Pipeline Data: Top 5 active notizie by price
  const pipelineNotizie = useMemo(() => notizie
    .filter(n => n.status !== 'no' && n.status !== 'sold')
    .sort((a, b) => (b.prezzo_richiesto || 0) - (a.prezzo_richiesto || 0))
    .slice(0, 5), [notizie]);

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

  // Gemini KPI Data
  const geminiKPIs = useMemo(() => ({
    contatti: kpis?.contatti?.value || 0,
    vendite: kpis?.vendite?.value || 0,
    notizieAttive: notizie.filter(n => n.status !== 'no' && n.status !== 'sold').length,
    taskPending: appointments.filter(a => a.type === 'task' && !a.completed).length
  }), [kpis, notizie, appointments]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId as keyof DashboardLayout;
    const destCol = destination.droppableId as keyof DashboardLayout;

    // Create a deep copy of the layout to avoid direct state mutation
    const newLayout: DashboardLayout = {
      main: [...(layout.main || [])],
      side: [...(layout.side || [])]
    };

    const [movedItem] = newLayout[sourceCol].splice(source.index, 1);
    newLayout[destCol].splice(destination.index, 0, movedItem);

    setLayout(newLayout);
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'kpi-contatti':
        return <KPICard label="Contatti" value={kpis?.contatti?.value || 0} delta={kpis?.contatti?.delta || 0} percent={kpis?.contatti?.percent || 0} />;
      case 'kpi-notizie':
        return <KPICard label="Notizie" value={kpis?.notizie?.value || 0} delta={kpis?.notizie?.delta || 0} percent={kpis?.notizie?.percent || 0} />;
      case 'kpi-clienti':
        return <KPICard label="Clienti Gestiti" value={kpis?.clienti?.value || 0} delta={kpis?.clienti?.delta || 0} percent={kpis?.clienti?.percent || 0} />;
      case 'kpi-appuntamenti':
        return <KPICard label="App. Vendita" value={kpis?.appuntamenti?.value || 0} delta={kpis?.appuntamenti?.delta || 0} percent={kpis?.appuntamenti?.percent || 0} />;
      case 'kpi-acquisizioni':
        return <KPICard label="Acquisizioni" value={kpis?.acquisizioni?.value || 0} delta={kpis?.acquisizioni?.delta || 0} percent={kpis?.acquisizioni?.percent || 0} />;
      case 'kpi-incarichi':
        return <KPICard label="Incarichi" value={kpis?.incarichi?.value || 0} delta={kpis?.incarichi?.delta || 0} percent={kpis?.incarichi?.percent || 0} />;
      case 'kpi-vendite':
        return <KPICard label="Vendite" value={kpis?.vendite?.value || 0} delta={kpis?.vendite?.delta || 0} percent={kpis?.vendite?.percent || 0} />;
      case 'kpi-fatturato':
        return <KPICard label="Fatturato" value={kpis?.fatturato?.value || 0} delta={kpis?.fatturato?.delta || 0} percent={kpis?.fatturato?.percent || 0} isCurrency />;
      case 'oggi':
        return (
          <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-6 shadow-sm flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                OGGI
              </h3>
              <Link to="/calendar" className="text-[11px] font-outfit font-semibold text-[var(--text-primary)] flex items-center gap-1 hover:underline">
                Vedi Calendario <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-[var(--lavender-fg)]" />
                  <span className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase">APPUNTAMENTI</span>
                </div>
                <div className="flex flex-col gap-3">
                  {todayAppointments.length === 0 
                    ? <p className="text-[12px] text-[var(--text-muted)] italic">Nessun appuntamento oggi</p>
                    : todayAppointments.map(a => (
                      <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] font-outfit mt-0.5">
                          {a.start_time.slice(11,16)}
                        </span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)] truncate">
                            {a.title}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-outfit truncate">
                            {a.location || 'Sede'}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--sage-fg)]" />
                  <span className="text-[11px] font-outfit font-semibold text-[var(--text-muted)] uppercase">TASK PENDING</span>
                </div>
                <div className="flex flex-col gap-3">
                  {todayTasks.length === 0
                    ? <p className="text-[12px] text-[var(--text-muted)] italic">Nessuna task per oggi</p>
                    : todayTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
                        <Circle size={10} className="text-[var(--sage-fg)] shrink-0" />
                        <span className="text-[13px] font-outfit text-[var(--text-primary)] truncate">
                          {t.title}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            <Link 
              to="/inserisci"
              className="mt-auto w-full bg-[var(--text-primary)] text-white py-2 rounded-[10px] font-outfit font-medium text-[12px] uppercase tracking-[0.08em] flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <FileText size={16} />
              Inserisci Report
            </Link>
          </div>
        );
      case 'pipeline':
        return (
          <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-6 shadow-sm flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                PIPELINE
              </h3>
              <Link to="/notizie" className="text-[11px] font-outfit font-semibold text-[var(--text-primary)] flex items-center gap-1 hover:underline">
                Vedi Tutte <ArrowRight size={12} />
              </Link>
            </div>

            <div className="flex flex-col gap-1">
              {pipelineNotizie.length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)] italic py-4 text-center">Nessuna notizia attiva in pipeline</p>
              ) : (
                pipelineNotizie.map((n) => (
                  <div key={n.id} className="flex items-center justify-between py-3 border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-subtle)] px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        (n.status !== 'no' && n.status !== 'sold') ? "bg-[var(--sage-fg)]" : "bg-[var(--amber-fg)]"
                      )} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-outfit font-medium text-[14px] text-[var(--text-primary)] truncate">
                          {n.name}
                        </span>
                        <span className="font-outfit text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                          {n.zona} • {n.type}
                        </span>
                      </div>
                    </div>
                    <div className="font-outfit font-semibold text-[14px] text-[var(--text-primary)] shrink-0">
                      {formatCurrency(n.prezzo_richiesto || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'upcoming':
        return (
          <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-5 shadow-sm flex flex-col gap-4 h-full">
            <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
              PROSSIMI GIORNI
            </h3>
            <div className="flex flex-col gap-3">
              {upcomingAppointments.length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)] italic">Nessun appuntamento futuro</p>
              ) : (
                upcomingAppointments.map(a => (
                  <div key={a.id} className="flex flex-col gap-1 p-3 bg-[var(--bg-subtle)] rounded-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                        {format(parseISO(a.start_time), 'd MMM', { locale: it })} • {a.start_time.slice(11,16)}
                      </span>
                    </div>
                    <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)] truncate">
                      {a.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'trend':
        return (
          <div className="bg-white border border-[var(--border-light)] rounded-[14px] p-5 shadow-sm flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                TREND
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--lavender-fg)]" />
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Contatti</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--sage-fg)]" />
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Notizie</span>
                </div>
              </div>
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontFamily: 'Outfit'
                    }} 
                  />
                  <Line type="monotone" dataKey="contatti" stroke="var(--lavender-fg)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="notizie" stroke="var(--sage-fg)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'gemini':
        return <GeminiAdviceCard kpis={geminiKPIs} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-10 w-full">
      {/* Header Section */}
      <div className="flex flex-col">
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, marginTop: 6 }}>
          Leadomancy / Dashboard
        </p>
        <div className="flex items-center justify-between mt-[-16px]">
          <div className="flex flex-col">
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 0 }}>
              Buongiorno, {user?.full_name?.split(' ')[0] || user?.nome?.split(' ')[0] || ''}
            </h1>
            <p className="font-outfit text-[13px] text-[var(--text-secondary)] capitalize mb-0">
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-4">
          {isEditMode && (
            <div className="pt-[4px]">
              <button
                onClick={() => setLayout(DEFAULT_LAYOUT)}
                className="px-4 py-2 rounded-full font-outfit text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                Reset Layout
              </button>
            </div>
          )}
          {!isEditMode && <div className="pt-[4px]">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-outfit text-[12px] font-bold uppercase tracking-wider transition-all shadow-sm",
                isEditMode 
                  ? "bg-[var(--rose-bg)] text-[var(--rose-fg)] border border-[var(--rose)]" 
                  : "bg-white text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--bg-subtle)]"
              )}
            >
              {isEditMode ? <X size={14} /> : <LayoutIcon size={14} />}
              {isEditMode ? 'Chiudi' : 'Personalizza'}
            </button>
          </div>}
          {isEditMode && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-outfit text-[12px] font-bold uppercase tracking-wider transition-all shadow-sm",
                isEditMode 
                  ? "bg-[var(--rose-bg)] text-[var(--rose-fg)] border border-[var(--rose)]" 
                  : "bg-white text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--bg-subtle)]"
              )}
            >
              {isEditMode ? <X size={14} /> : <LayoutIcon size={14} />}
              {isEditMode ? 'Chiudi' : 'Personalizza'}
            </button>
          )}

          <div className="bg-white p-1 rounded-full border border-[var(--border-light)] flex shadow-sm">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full font-outfit text-[11px] font-semibold uppercase transition-all",
                  period === p ? "bg-[var(--text-primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Anno'}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Main Grid with Drag and Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-[-12px]">
          {/* Side Column (1/3) - Now on the Left */}
          <Droppable droppableId="side">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col gap-6 min-h-[200px] transition-colors rounded-xl",
                  isEditMode && snapshot.isDraggingOver && "bg-black/5"
                )}
              >
                {layout.side.map((id, index) => (
                  <Draggable key={id} draggableId={id} index={index} isDragDisabled={!isEditMode}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative group",
                          snapshot.isDragging && "z-50"
                        )}
                      >
                        {isEditMode && (
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1 bg-white border border-[var(--border-light)] rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical size={14} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                        {renderWidget(id)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Main Column (2/3) - Now on the Right */}
          <Droppable droppableId="main">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px] transition-colors rounded-xl content-start",
                  isEditMode && snapshot.isDraggingOver && "bg-black/5"
                )}
              >
                {layout.main.map((id, index) => (
                  <Draggable key={id} draggableId={id} index={index} isDragDisabled={!isEditMode}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative group",
                          snapshot.isDragging && "z-50",
                          id.startsWith('kpi-') ? "col-span-1" : "col-span-1 md:col-span-2"
                        )}
                      >
                        {isEditMode && (
                          <div 
                            {...provided.dragHandleProps}
                            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1 bg-white border border-[var(--border-light)] rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical size={14} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                        {renderWidget(id)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
};

const parseISO = (s: string) => new Date(s);

