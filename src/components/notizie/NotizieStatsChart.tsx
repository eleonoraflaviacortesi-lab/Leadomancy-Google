import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  LineChart, Line, Legend
} from "recharts";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUSES, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUS_COLORS, TIPO_OPTIONS } from "./notizieConfig";
import { cn } from "@/src/lib/utils";
import { format, subMonths, startOfMonth, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";

interface NotizieStatsChartProps {
  isOpen: boolean;
  onClose: () => void;
  notizie: Notizia[];
}

export const NotizieStatsChart: React.FC<NotizieStatsChartProps> = ({ isOpen, onClose, notizie }) => {
  const statusData = useMemo(() => {
    return NOTIZIA_STATUSES.map(status => ({
      name: NOTIZIA_STATUS_LABELS[status],
      count: notizie.filter(n => n.status === status).length,
      color: NOTIZIA_STATUS_COLORS[status]
    }));
  }, [notizie]);

  const tipoData = useMemo(() => {
    return TIPO_OPTIONS.map(tipo => ({
      name: tipo,
      value: notizie.filter(n => n.type === tipo).length
    })).filter(d => d.value > 0);
  }, [notizie]);

  const trendData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, "MMM", { locale: it }),
        fullDate: startOfMonth(date),
        count: 0
      };
    });

    notizie.forEach(n => {
      const createdDate = new Date(n.created_at);
      const monthIndex = last6Months.findIndex(m => 
        createdDate.getMonth() === m.fullDate.getMonth() && 
        createdDate.getFullYear() === m.fullDate.getFullYear()
      );
      if (monthIndex !== -1) {
        last6Months[monthIndex].count++;
      }
    });

    return last6Months;
  }, [notizie]);

  const COLORS = ['#1A1A18', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25"
          />
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[800px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1A1A18] flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0">
                  <BarChart3 size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <div>
                  <h2 className="font-outfit font-bold text-[18px] sm:text-[20px] text-[var(--text-primary)] tracking-[-0.5px]">Statistiche Notizie</h2>
                  <p className="font-outfit font-bold text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Panoramica performance</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] rounded-full transition-colors shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="space-y-8 sm:space-y-12">
                {/* Status Distribution */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#1A1A18] rounded-full" />
                    <h3 className="font-outfit font-bold text-[11px] sm:text-[12px] uppercase tracking-widest text-[var(--text-muted)]">Distribuzione per Stato</h3>
                  </div>
                  <div className="w-full bg-[var(--bg-subtle)] rounded-[20px] p-4 sm:p-6 border border-[var(--border-light)]">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontFamily: 'Outfit', fontWeight: 600, fill: '#9B9A96' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, fill: '#9B9A96' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid var(--border-light)', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
                            fontFamily: 'Outfit',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={30}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                  {/* Tipo Distribution */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-[#1A1A18] rounded-full" />
                      <h3 className="font-outfit font-bold text-[11px] sm:text-[12px] uppercase tracking-widest text-[var(--text-muted)]">Notizie per Tipologia</h3>
                    </div>
                    <div className="w-full bg-[var(--bg-subtle)] rounded-[20px] p-4 sm:p-6 border border-[var(--border-light)]">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={tipoData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {tipoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: '1px solid var(--border-light)', 
                              boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
                              fontFamily: 'Outfit',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '9px', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '16px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Trend */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-[#1A1A18] rounded-full" />
                      <h3 className="font-outfit font-bold text-[11px] sm:text-[12px] uppercase tracking-widest text-[var(--text-muted)]">Trend Acquisizioni</h3>
                    </div>
                    <div className="w-full bg-[var(--bg-subtle)] rounded-[20px] p-4 sm:p-6 border border-[var(--border-light)]">
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, fill: '#9B9A96' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontFamily: 'Outfit', fontWeight: 600, fill: '#9B9A96' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: '1px solid var(--border-light)', 
                              boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
                              fontFamily: 'Outfit',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#1A1A18" 
                            strokeWidth={4} 
                            dot={{ r: 5, fill: '#1A1A18', strokeWidth: 3, stroke: '#fff' }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-[var(--border-light)] bg-[var(--bg-subtle)] shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                <div className="flex items-center gap-6 w-full sm:w-auto justify-center sm:justify-start">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">Totale Notizie</span>
                    <span className="text-[24px] sm:text-[28px] font-outfit font-bold text-[var(--text-primary)] leading-none">{notizie.length}</span>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-light)]" />
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-widest">Media Mensile</span>
                    <span className="text-[24px] sm:text-[28px] font-outfit font-bold text-[var(--text-primary)] leading-none">
                      {(notizie.length / 6).toFixed(1)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full sm:w-auto px-10 h-12 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-[12px] uppercase tracking-[0.15em] hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
                >
                  CHIUDI
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
