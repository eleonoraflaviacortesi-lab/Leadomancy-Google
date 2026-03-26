import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Save, 
  Loader2,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useDailyData } from "@/src/hooks/useDailyData";
import { useKPIs } from "@/src/hooks/useKPIs";
import { getSheetData, appendRow, updateRow, SHEETS, findRowIndex } from "@/src/lib/googleSheets";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isSameWeek } from "date-fns";
import { it } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn, formatCurrency } from "@/src/lib/utils";
import { PersonalDashboard } from "../dashboard/PersonalDashboard";

type SubTab = 'UFFICIO' | 'RIUNIONI' | 'ANALISI';

interface Meeting {
  id: string;
  sede: string;
  week_start: string;
  content: string;
  created_at: string;
  updated_at: string;
  _rowIndex?: number;
}

export const UfficioPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SubTab>('UFFICIO');
  const isAdmin = user?.role === 'admin' || user?.role === 'coordinatore';

  // RIUNIONI State
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [meetingContent, setMeetingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(false);

  // ANALISI State
  const { allData } = useDailyData();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    if (activeTab === 'RIUNIONI') {
      fetchMeeting();
    }
  }, [activeTab, weekKey]);

  const fetchMeeting = async () => {
    if (!user?.sede) return;
    setIsLoadingMeeting(true);
    try {
      const meetings = await getSheetData<Meeting>(SHEETS.meetings);
      const found = meetings.find(m => m.sede === user.sede && m.week_start === weekKey);
      setMeeting(found || null);
      setMeetingContent(found?.content || "");
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setIsLoadingMeeting(false);
    }
  };

  const handleSaveMeeting = async () => {
    if (!user?.sede || !isAdmin) return;
    setIsSaving(true);
    try {
      if (meeting) {
        const rowIndex = await findRowIndex(SHEETS.meetings, meeting.id);
        if (rowIndex) {
          await updateRow(SHEETS.meetings, rowIndex, {
            content: meetingContent,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        const newMeeting = {
          id: crypto.randomUUID(),
          sede: user.sede,
          week_start: weekKey,
          content: meetingContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await appendRow(SHEETS.meetings, newMeeting);
      }
      await fetchMeeting();
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving meeting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ANALISI Data
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(format(d, 'yyyy-MM'));
    }

    return months.map(m => {
      const monthData = allData.filter(d => d.date.startsWith(m) && (isAdmin ? true : d.user_id === user?.user_id));
      return {
        month: format(parseISO(`${m}-01`), 'MMM', { locale: it }),
        Contatti: monthData.reduce((sum, d) => sum + (d.contatti_reali || 0), 0),
        Notizie: monthData.reduce((sum, d) => sum + (d.notizie_reali || 0), 0),
        Vendite: monthData.reduce((sum, d) => sum + (d.vendite_numero || 0), 0),
      };
    });
  }, [allData, user, isAdmin]);

  return (
    <div className="flex flex-col gap-8 pt-6 pb-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-outfit text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Leadomancy / Gestione
        </span>
        <h1 className="font-outfit font-semibold text-[28px] tracking-tight text-[var(--text-primary)]">
          Ufficio {user?.sede}
        </h1>
      </div>

      {/* Sub-tabs */}
      <div className="bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-light)] flex w-fit">
        {(['UFFICIO', 'RIUNIONI', 'ANALISI'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-full font-outfit text-[12px] font-bold uppercase transition-all",
              activeTab === tab ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'UFFICIO' && (
          <motion.div
            key="ufficio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PersonalDashboard isOfficeView={true} />
          </motion.div>
        )}

        {activeTab === 'RIUNIONI' && (
          <motion.div
            key="riunioni"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-[var(--border-light)] rounded-[20px] p-8 shadow-sm"
          >
            <div className="flex flex-col gap-8">
              {/* Week Navigator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    className="p-2 rounded-full hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-outfit font-bold text-[16px]">
                      Settimana {format(weekStart, 'd')} - {format(weekEnd, 'd MMMM yyyy', { locale: it })}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      {isSameWeek(new Date(), currentWeek, { weekStartsOn: 1 }) ? "Settimana Corrente" : "Archivio Riunioni"}
                    </span>
                  </div>
                  <button 
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="p-2 rounded-full hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {isAdmin && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-black text-white px-5 py-2.5 rounded-full font-outfit text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-black/80 transition-all"
                  >
                    {meeting ? <Edit2 size={14} /> : <Plus size={14} />}
                    {meeting ? "Modifica" : "Nuova Riunione"}
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="min-h-[400px] relative">
                {isLoadingMeeting ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : isEditing ? (
                  <div className="flex flex-col gap-4">
                    <textarea
                      value={meetingContent}
                      onChange={(e) => setMeetingContent(e.target.value)}
                      placeholder="Scrivi qui i punti della riunione, obiettivi della settimana e note..."
                      className="w-full min-h-[400px] bg-[var(--bg-subtle)] border-0 rounded-[14px] p-6 font-outfit text-[14px] leading-relaxed outline-none focus:ring-1 focus:ring-black/10 resize-none"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 rounded-full font-outfit text-[12px] font-bold uppercase text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-all"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleSaveMeeting}
                        disabled={isSaving}
                        className="bg-black text-white px-8 py-2.5 rounded-full font-outfit text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Salva Riunione
                      </button>
                    </div>
                  </div>
                ) : meeting ? (
                  <div className="whitespace-pre-line font-outfit text-[15px] leading-relaxed text-[var(--text-primary)] bg-[var(--bg-subtle)] p-8 rounded-[14px]">
                    {meeting.content}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--border-light)] rounded-[14px]">
                    <Calendar size={48} className="text-[var(--border-medium)] mb-4" />
                    <p className="font-outfit text-[14px] text-[var(--text-muted)]">Nessun verbale per questa settimana</p>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 text-black font-outfit font-bold text-[13px] underline underline-offset-4"
                      >
                        Crea ora
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ANALISI' && (
          <motion.div
            key="analisi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <h3 className="font-outfit font-bold text-[18px]">Trend di Produzione</h3>
                  <p className="text-[13px] text-[var(--text-muted)]">Andamento degli ultimi 6 mesi</p>
                </div>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[var(--bg-subtle)] border-0 rounded-full px-4 py-2 text-[12px] font-bold font-outfit outline-none"
                >
                  <option value={format(new Date(), 'yyyy-MM')}>Mese Corrente</option>
                  {/* More options could be added here */}
                </select>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontFamily: 'Outfit', fill: 'var(--text-muted)' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontFamily: 'Outfit', fill: 'var(--text-muted)' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontFamily: 'Outfit',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontFamily: 'Outfit' }}
                    />
                    <Bar dataKey="Contatti" fill="#1A1A18" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Notizie" fill="#A8A29E" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Vendite" fill="#F5C842" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Extra Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#166534]">
                  <TrendingUp size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Conversione</span>
                  <span className="text-[20px] font-bold font-outfit">12.5%</span>
                </div>
              </div>
              <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FEFCE8] flex items-center justify-center text-[#854D0E]">
                  <Target size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Obiettivo Sede</span>
                  <span className="text-[20px] font-bold font-outfit">84%</span>
                </div>
              </div>
              <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#5B21B6]">
                  <Award size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Top Agent</span>
                  <span className="text-[20px] font-bold font-outfit">M. Rossi</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Edit2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);
